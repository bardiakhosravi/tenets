const fs = require('node:fs');
const path = require('node:path');
const { MARKERS, TOOLS } = require('../constants');
const { readConfig } = require('./config-tracker');
const {
  LEGACY_PROFILE,
  isProfile,
} = require('./profiles');
const {
  fetchContent,
  assembleContent,
  assembleCodeReviewAgentContent,
  computeHash,
  computeClaudeHash,
  computeAugmentHash,
  computeCursorHash,
  computeCopilotHash,
  computeReviewCommandHash,
} = require('./content-fetcher');
const { claudeOwnedPaths } = require('./claude-writer');
const { augmentOwnedPaths } = require('./augment-writer');
const { cursorOwnedPaths } = require('./cursor-writer');
const { copilotOwnedPaths } = require('./copilot-writer');
const {
  isTenetsOwnedFile,
  hasValidMarkers,
} = require('./file-writer');
const {
  reviewCommandPath,
} = require('./review-command-writer');

function expectedMode(tool) {
  if (tool.multiOutput) return 'multi';
  if (tool.augmentMultiOutput) return 'augment-multi';
  if (tool.cursorMultiOutput) return 'cursor-multi';
  if (tool.copilotMultiOutput) return 'copilot-multi';
  return null;
}

function expectedHash(
  toolKey,
  tool,
  assembled,
  codeReviewAgentContent,
  content
) {
  if (tool.codeReviewAgent) return computeHash(codeReviewAgentContent);
  if (tool.multiOutput) return computeClaudeHash(assembled, content);
  if (tool.augmentMultiOutput) return computeAugmentHash(assembled, content);
  if (tool.cursorMultiOutput) return computeCursorHash(assembled, content);
  if (tool.copilotMultiOutput) return computeCopilotHash(assembled, content);
  if (tool.reviewCommand) {
    return computeReviewCommandHash(assembled, toolKey, content);
  }
  return computeHash(assembled);
}

function toolPaths(projectRoot, toolKey, tool) {
  if (tool.multiOutput) {
    const hookPath = path.join(
      projectRoot,
      '.claude',
      'hooks',
      'check-architecture.js'
    );
    const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
    let hookConfigured = false;
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        hookConfigured = settings?.hooks?.PostToolUse?.some((entry) =>
          entry?.hooks?.some((hook) =>
            hook?.command?.includes('check-architecture')
          )
        );
      } catch {
        // Malformed settings are reported separately by inspectConfiguredTool.
      }
    }
    return {
      owned: claudeOwnedPaths(projectRoot).filter((filePath) =>
        filePath !== hookPath || hookConfigured || fs.existsSync(hookPath)
      ),
      shared: [path.join(projectRoot, 'CLAUDE.md')],
    };
  }
  if (tool.augmentMultiOutput) {
    return { owned: augmentOwnedPaths(projectRoot), shared: [] };
  }
  if (tool.cursorMultiOutput) {
    return { owned: cursorOwnedPaths(projectRoot), shared: [] };
  }
  if (tool.copilotMultiOutput) {
    return {
      owned: copilotOwnedPaths(projectRoot),
      shared: [
        path.join(projectRoot, '.github', 'copilot-instructions.md'),
      ],
    };
  }

  const targetPath = path.join(projectRoot, tool.targetFile);
  return {
    owned: tool.codeReviewAgent ? [targetPath] : [
      ...(tool.reviewCommand
        ? [reviewCommandPath(projectRoot, toolKey)]
        : []),
    ],
    shared: tool.codeReviewAgent ? [] : [targetPath],
  };
}

function finding(severity, code, message, filePath = null) {
  return {
    severity,
    code,
    message,
    ...(filePath ? { path: path.relative(process.cwd(), filePath) } : {}),
  };
}

function inspectConfiguredTool(
  projectRoot,
  toolKey,
  entry,
  tool,
  currentHash
) {
  const findings = [];
  const mode = expectedMode(tool);
  if (mode && entry.mode !== mode) {
    findings.push(finding(
      'error',
      'legacy_mode',
      `Configured mode is ${entry.mode || 'missing'}; expected ${mode}.`
    ));
  }
  if (entry.contentHash !== currentHash) {
    findings.push(finding(
      'error',
      'stale_content',
      'Installed content does not match this Tenets package version.'
    ));
  }

  const paths = toolPaths(projectRoot, toolKey, tool);
  const reviewPath = tool.reviewCommand
    ? reviewCommandPath(projectRoot, toolKey)
    : null;
  if (toolKey === 'claude') {
    const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      try {
        JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      } catch {
        findings.push(finding(
          'error',
          'malformed_shared_json',
          'Claude settings contain malformed JSON and cannot be inspected safely.',
          settingsPath
        ));
      }
    }
  }
  for (const filePath of paths.owned) {
    if (!fs.existsSync(filePath)) {
      findings.push(finding(
        'error',
        'missing_file',
        'Expected generated file is missing.',
        filePath
      ));
    } else if (!isTenetsOwnedFile(filePath)) {
      findings.push(finding(
        'error',
        'ownership_conflict',
        'Expected generated path exists but is not marked as Tenets-owned.',
        filePath
      ));
    }
  }
  for (const filePath of paths.shared) {
    if (!fs.existsSync(filePath)) {
      findings.push(finding(
        'error',
        'missing_shared_file',
        'Expected shared instruction file is missing.',
        filePath
      ));
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!hasValidMarkers(content)) {
      findings.push(finding(
        'error',
        'missing_marked_block',
        'Shared file does not contain a valid Tenets-owned block.',
        filePath
      ));
    }
  }

  if (
    toolKey === 'cursor' &&
    fs.existsSync(path.join(projectRoot, '.cursorrules')) &&
    fs.readFileSync(path.join(projectRoot, '.cursorrules'), 'utf-8')
      .includes(MARKERS.start)
  ) {
    findings.push(finding(
      'warning',
      'legacy_cursor_rules',
      'Legacy Tenets content remains in .cursorrules.',
      path.join(projectRoot, '.cursorrules')
    ));
  }

  return {
    tool: toolKey,
    name: tool.name,
    status: findings.some((item) => item.severity === 'error')
      ? 'error'
      : findings.length > 0
        ? 'warning'
        : 'healthy',
    findings,
    artifacts: {
      rules: [...paths.owned, ...paths.shared]
        .filter((filePath) => filePath !== reviewPath)
        .map((filePath) => path.relative(projectRoot, filePath)
          .split(path.sep)
          .join('/')),
      reviewCommand: reviewPath
        ? path.relative(projectRoot, reviewPath).split(path.sep).join('/')
        : null,
    },
  };
}

function hasUntrackedArtifacts(projectRoot, toolKey, tool) {
  const paths = toolPaths(projectRoot, toolKey, tool);
  return (
    paths.owned.some((filePath) => isTenetsOwnedFile(filePath)) ||
    paths.shared.some((filePath) => {
      if (!fs.existsSync(filePath)) return false;
      return hasValidMarkers(fs.readFileSync(filePath, 'utf-8'));
    })
  );
}

async function inspectInstallation(options = {}) {
  const projectRoot = options.projectRoot || process.cwd();
  const config = readConfig(projectRoot);
  const profile = config?.profile && isProfile(config.profile)
    ? config.profile
    : LEGACY_PROFILE;
  const appliesTo = config?.appliesTo || [];
  const content = await fetchContent({ profile, appliesTo });
  const assembled = assembleContent(content);
  const codeReviewAgentContent = assembleCodeReviewAgentContent(
    assembled,
    content
  );
  const tools = [];
  const globalFindings = [];

  if (!config) {
    globalFindings.push(finding(
      'error',
      'missing_config',
      'No readable .tenets.json configuration was found.'
    ));
  }
  if (config && !config.profile) {
    globalFindings.push(finding(
      'warning',
      'missing_profile',
      `No profile is configured; strict is assumed until \`tenets update\` migrates the configuration.`
    ));
  } else if (config && !isProfile(config.profile)) {
    globalFindings.push(finding(
      'error',
      'invalid_profile',
      `Configuration contains an unsupported profile: ${config.profile}.`
    ));
  }

  if (!options.toolKeys) {
    for (const toolKey of Object.keys(config?.tools || {})) {
      if (!TOOLS[toolKey]) {
        globalFindings.push(finding(
          'error',
          'unknown_tool',
          `Configuration references unsupported integration key: ${toolKey}.`
        ));
      }
    }
  }

  const selectedTools = options.toolKeys
    ? options.toolKeys.map((toolKey) => [toolKey, TOOLS[toolKey]])
      .filter(([, tool]) => tool)
    : Object.entries(TOOLS);
  for (const [toolKey, tool] of selectedTools) {
    const entry = config?.tools?.[toolKey];
    if (entry) {
      tools.push(inspectConfiguredTool(
        projectRoot,
        toolKey,
        entry,
        tool,
        expectedHash(
          toolKey,
          tool,
          assembled,
          codeReviewAgentContent,
          content
        )
      ));
    } else if (hasUntrackedArtifacts(projectRoot, toolKey, tool)) {
      tools.push({
        tool: toolKey,
        name: tool.name,
        status: 'error',
        findings: [finding(
          'error',
          'untracked_integration',
          'Tenets-owned files exist but this integration is absent from .tenets.json.'
        )],
      });
    } else if (options.toolKeys) {
      tools.push({
        tool: toolKey,
        name: tool.name,
        status: 'error',
        findings: [finding(
          'error',
          'integration_not_configured',
          'The requested integration was not recorded in .tenets.json.'
        )],
        artifacts: { rules: [], reviewCommand: null },
      });
    }
  }

  const speckitEntries = options.presetIds ||
    Object.keys(config?.speckit || {});
  const presets = [];
  for (const presetId of speckitEntries) {
    const presetPath = path.join(
      projectRoot,
      '.specify',
      'presets',
      presetId,
      'preset.yml'
    );
    const presetFindings = [];
    if (!config?.speckit?.[presetId]) {
      presetFindings.push(finding(
        'error',
        'speckit_not_configured',
        `Requested Spec-Kit preset ${presetId} is not configured.`,
        presetPath
      ));
    } else if (!fs.existsSync(presetPath)) {
      presetFindings.push(finding(
        'error',
        'missing_speckit_preset',
        `Configured Spec-Kit preset ${presetId} is missing.`,
        presetPath
      ));
    }
    presets.push({
      preset: presetId,
      status: presetFindings.length > 0 ? 'error' : 'healthy',
      path: path.relative(projectRoot, presetPath).split(path.sep).join('/'),
      findings: presetFindings,
    });
  }

  const findings = [
    ...globalFindings,
    ...tools.flatMap((tool) => tool.findings),
    ...presets.flatMap((preset) => preset.findings),
  ];
  const result = {
    healthy: !findings.some((item) => item.severity === 'error'),
    packageVersion: require('../../package.json').version,
    profile,
    appliesTo,
    tools,
    presets,
    findings: globalFindings,
    summary: {
      healthy:
        tools.filter((tool) => tool.status === 'healthy').length +
        presets.filter((preset) => preset.status === 'healthy').length,
      warnings: findings.filter((item) => item.severity === 'warning').length,
      errors: findings.filter((item) => item.severity === 'error').length,
    },
  };
  return result;
}

module.exports = { inspectInstallation };

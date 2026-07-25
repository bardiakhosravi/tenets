const fs = require('node:fs');
const path = require('node:path');
const { TOOLS } = require('../constants');

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.tenets',
  '.venv',
  'build',
  'dist',
  'node_modules',
  'target',
  'vendor',
]);

const AGENT_INDICATORS = {
  claude: ['.claude', 'CLAUDE.md'],
  cursor: ['.cursor', '.cursorrules'],
  augment: ['.augment'],
  copilot: [
    '.github/copilot-instructions.md',
    '.github/instructions',
    '.github/prompts',
  ],
  agents: ['AGENTS.md'],
};

const LANGUAGE_INDICATORS = [
  {
    id: 'python',
    name: 'Python',
    files: [
      'pyproject.toml',
      'requirements.txt',
      'requirements-dev.txt',
      'setup.py',
      'Pipfile',
      'poetry.lock',
    ],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    files: ['tsconfig.json'],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    files: ['package.json'],
  },
  {
    id: 'java',
    name: 'Java',
    files: ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  },
  {
    id: 'go',
    name: 'Go',
    files: ['go.mod'],
  },
  {
    id: 'rust',
    name: 'Rust',
    files: ['Cargo.toml'],
  },
  {
    id: 'dotnet',
    name: '.NET',
    suffixes: ['.csproj', '.fsproj', '.sln'],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    files: ['Gemfile'],
  },
  {
    id: 'php',
    name: 'PHP',
    files: ['composer.json'],
  },
];

const ARCHITECTURE_DIRECTORY_NAMES = new Set([
  'adapters',
  'application',
  'domain',
  'infrastructure',
  'ports',
  'use_cases',
]);

function exists(projectRoot, relativePath) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function readText(projectRoot, relativePath) {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) return '';
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

function readJson(projectRoot, relativePath) {
  try {
    return JSON.parse(readText(projectRoot, relativePath));
  } catch {
    return null;
  }
}

function matchingFiles(
  projectRoot,
  fileNames = [],
  suffixes = [],
  relativePath = '',
  depth = 0,
  result = []
) {
  if (depth > 3) return result;
  let entries;
  try {
    entries = fs.readdirSync(path.join(projectRoot, relativePath), {
      withFileTypes: true,
    });
  } catch {
    return result;
  }

  for (const entry of entries) {
    const childPath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        matchingFiles(
          projectRoot,
          fileNames,
          suffixes,
          childPath,
          depth + 1,
          result
        );
      }
    } else if (
      fileNames.includes(entry.name) ||
      suffixes.some((suffix) => entry.name.endsWith(suffix))
    ) {
      result.push(childPath.split(path.sep).join('/'));
    }
  }
  return result;
}

function detectAgents(projectRoot) {
  const agents = [];
  const existingAgentFiles = [];
  for (const [toolKey, indicators] of Object.entries(AGENT_INDICATORS)) {
    const evidence = indicators.filter((indicator) =>
      exists(projectRoot, indicator)
    );
    if (evidence.length === 0) continue;
    existingAgentFiles.push(...evidence);
    agents.push({
      tool: toolKey,
      name: TOOLS[toolKey].name,
      evidence,
    });
  }
  return {
    agents,
    existingAgentFiles: [...new Set(existingAgentFiles)].sort(),
  };
}

function detectLanguages(projectRoot) {
  const languages = [];
  for (const definition of LANGUAGE_INDICATORS) {
    const evidence = matchingFiles(
      projectRoot,
      definition.files || [],
      definition.suffixes || []
    );
    if (evidence.length > 0) {
      languages.push({
        id: definition.id,
        name: definition.name,
        evidence,
      });
    }
  }

  if (
    languages.some((language) => language.id === 'typescript') &&
    languages.some((language) => language.id === 'javascript')
  ) {
    return languages.filter((language) => language.id !== 'javascript');
  }
  return languages;
}

function dependencyNames(packageJson) {
  return new Set([
    ...Object.keys(packageJson?.dependencies || {}),
    ...Object.keys(packageJson?.devDependencies || {}),
  ]);
}

function manifestsContaining(projectRoot, fileNames, value) {
  return matchingFiles(projectRoot, fileNames)
    .filter((file) => readText(projectRoot, file).toLowerCase().includes(value));
}

function detectFrameworks(projectRoot) {
  const frameworks = [];
  const pythonManifestFiles = [
    'pyproject.toml',
    'requirements.txt',
    'requirements-dev.txt',
    'Pipfile',
  ];
  const nodeDependencyEvidence = new Map();
  for (const packagePath of matchingFiles(projectRoot, ['package.json'])) {
    for (const dependency of dependencyNames(readJson(projectRoot, packagePath))) {
      const evidence = nodeDependencyEvidence.get(dependency) || [];
      evidence.push(packagePath);
      nodeDependencyEvidence.set(dependency, evidence);
    }
  }
  const javaManifestFiles = [
    'pom.xml',
    'build.gradle',
    'build.gradle.kts',
  ];

  const candidates = [
    ['fastapi', 'FastAPI', manifestsContaining(
      projectRoot, pythonManifestFiles, 'fastapi'
    )],
    ['django', 'Django', manifestsContaining(
      projectRoot, pythonManifestFiles, 'django'
    )],
    ['flask', 'Flask', manifestsContaining(
      projectRoot, pythonManifestFiles, 'flask'
    )],
    ['nestjs', 'NestJS', nodeDependencyEvidence.get('@nestjs/core') || []],
    ['nextjs', 'Next.js', nodeDependencyEvidence.get('next') || []],
    ['express', 'Express', nodeDependencyEvidence.get('express') || []],
    ['spring-boot', 'Spring Boot', manifestsContaining(
      projectRoot, javaManifestFiles, 'spring-boot'
    )],
    ['gin', 'Gin', manifestsContaining(
      projectRoot, ['go.mod'], 'github.com/gin-gonic/gin'
    )],
    ['actix-web', 'Actix Web', manifestsContaining(
      projectRoot, ['Cargo.toml'], 'actix-web'
    )],
    ['axum', 'Axum', manifestsContaining(
      projectRoot, ['Cargo.toml'], 'axum'
    )],
    ['rails', 'Ruby on Rails', manifestsContaining(
      projectRoot, ['Gemfile'], 'rails'
    )],
  ];

  for (const [id, name, evidence] of candidates) {
    if (evidence.length > 0) frameworks.push({ id, name, evidence });
  }
  return frameworks;
}

function scanLayout(projectRoot, relativePath = '', depth = 0, result = []) {
  if (depth > 3) return result;
  let entries;
  try {
    entries = fs.readdirSync(path.join(projectRoot, relativePath), {
      withFileTypes: true,
    });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || IGNORED_DIRECTORIES.has(entry.name)) continue;
    const childPath = path.join(relativePath, entry.name);
    result.push(childPath);
    scanLayout(projectRoot, childPath, depth + 1, result);
  }
  return result;
}

function detectLayout(projectRoot) {
  const directories = scanLayout(projectRoot);
  const sourceRoots = directories
    .filter((directory) =>
      ['src', 'app', 'lib', 'services', 'packages'].includes(
        path.basename(directory)
      )
    )
    .filter((directory) => directory.split(path.sep).length <= 2)
    .map((directory) => directory.split(path.sep).join('/'));
  const architectureDirectories = directories
    .filter((directory) =>
      ARCHITECTURE_DIRECTORY_NAMES.has(path.basename(directory))
    )
    .map((directory) => directory.split(path.sep).join('/'));
  const packageJson = readJson(projectRoot, 'package.json');
  const monorepoEvidence = [
    ...(packageJson?.workspaces ? ['package.json#workspaces'] : []),
    ...['pnpm-workspace.yaml', 'nx.json', 'turbo.json'].filter((file) =>
      exists(projectRoot, file)
    ),
  ];

  let kind = 'flat';
  if (monorepoEvidence.length > 0) {
    kind = 'monorepo';
  } else if (architectureDirectories.length >= 2) {
    kind = 'layered';
  } else if (sourceRoots.length > 0) {
    kind = 'source-root';
  }

  return {
    kind,
    sourceRoots: [...new Set(sourceRoots)].sort(),
    architectureDirectories: [...new Set(architectureDirectories)].sort(),
    monorepoEvidence,
  };
}

function configuredTools(projectRoot) {
  const config = readJson(projectRoot, '.tenets.json');
  return Object.keys(config?.tools || {}).filter((toolKey) => TOOLS[toolKey]);
}

function detectRepository(projectRoot = process.cwd()) {
  const { agents, existingAgentFiles } = detectAgents(projectRoot);
  const languages = detectLanguages(projectRoot);
  const frameworks = detectFrameworks(projectRoot);
  const layout = detectLayout(projectRoot);
  const configured = configuredTools(projectRoot);
  const detectedToolKeys = agents.map((agent) => agent.tool);
  const recommendedTools = [...new Set([...configured, ...detectedToolKeys])];
  if (recommendedTools.length === 0) {
    recommendedTools.push('agents');
  }

  return {
    projectRoot,
    agents,
    existingAgentFiles,
    languages,
    frameworks,
    layout,
    speckit: {
      initialized: exists(projectRoot, '.specify'),
      evidence: exists(projectRoot, '.specify') ? ['.specify'] : [],
    },
    recommendations: {
      tools: recommendedTools,
      speckit: exists(projectRoot, '.specify'),
    },
  };
}

module.exports = { detectRepository };

#!/usr/bin/env node

const { logger } = require('../src/ui/logger');

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const filteredArgs = args.filter((arg) => arg !== '--json');
const command = filteredArgs[0];
const commandArgs = filteredArgs.slice(1);
logger.setJsonMode(jsonMode);

async function main() {
  const isVersionCommand = command === '--version' || command === '-v';
  if (!isVersionCommand) logger.banner();
  let result;

  switch (command) {
    case 'init': {
      const { initCommand } = require('../src/commands/init');
      result = await initCommand(commandArgs);
      break;
    }
    case 'update': {
      const { updateCommand } = require('../src/commands/update');
      result = await updateCommand(commandArgs);
      break;
    }
    case 'diff': {
      const { updateCommand } = require('../src/commands/update');
      result = await updateCommand(['--dry-run', ...commandArgs]);
      break;
    }
    case 'doctor': {
      const { doctorCommand } = require('../src/commands/doctor');
      result = await doctorCommand(commandArgs);
      break;
    }
    case 'uninstall': {
      const { uninstallCommand } = require('../src/commands/uninstall');
      result = await uninstallCommand(commandArgs);
      break;
    }
    case '--version':
    case '-v': {
      result = { version: require('../package.json').version };
      if (!jsonMode) console.log(result.version);
      break;
    }
    case '--help':
    case '-h':
    case undefined:
      printUsage();
      break;
    default:
      logger.error(`Unknown command: ${command}`);
      printUsage();
      process.exitCode = 1;
  }

  if (jsonMode) {
    logger.jsonResult(command, result);
  }
}

function printUsage() {
  const usage = `Usage: tenets <command> [options]

Commands:
  init              Install rules into your AI tool's config
  update            Update all installed rules to latest
  diff              Preview the exact filesystem changes from update
  doctor            Diagnose missing, stale, conflicting, or untracked integrations
  uninstall         Remove only Tenets-owned files and marked content
  --version, -v     Print the installed Tenets version

Init options:
  --claude          Claude Code (rules + skill, optional hook)
  --cursor          Write scoped rules and a review command for Cursor
  --augment         Write rules and a review command for Augment
  --copilot         Write global + scoped instructions and a review prompt
  --code-review-agent
                    Write a code review agent prompt
  --agents          Write AGENTS.md and a generic review prompt
  --speckit         Install DDD preset into an existing Spec-Kit project
  --dry-run         Preview exact filesystem changes without writing
  --json            Return machine-readable JSON
  --yes             Confirm uninstall or migration choices noninteractively

Claude-specific options:
  --with-hook       Auto-install PostToolUse monitoring hook (skip prompt)

Examples:
  npx tenets init --claude
  npx tenets init --claude --with-hook
  npx tenets init --claude --code-review-agent
  npx tenets init --code-review-agent
  npx tenets init --cursor
  npx tenets init --augment
  npx tenets init --speckit
  npx tenets init --claude --speckit
  npx tenets init --cursor --dry-run
  npx tenets update --dry-run
  npx tenets diff
  npx tenets doctor
  npx tenets uninstall --dry-run
  npx tenets uninstall --yes
  npx tenets update`;
  if (logger.isJsonMode()) {
    logger.info(usage);
  } else {
    console.log(usage);
  }
}

main().catch((err) => {
  logger.error(err.message);
  process.exitCode = 1;
  if (jsonMode) {
    logger.jsonResult(command, undefined, err.message);
  }
});

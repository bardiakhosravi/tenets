#!/usr/bin/env node

const { logger } = require('../src/ui/logger');

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  logger.banner();

  switch (command) {
    case 'init': {
      const { initCommand } = require('../src/commands/init');
      await initCommand(args.slice(1));
      break;
    }
    case 'update': {
      const { updateCommand } = require('../src/commands/update');
      await updateCommand();
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
}

function printUsage() {
  console.log(`Usage: tenets <command> [options]

Commands:
  init              Install rules into your AI tool's config
  update            Update all installed rules to latest

Init options:
  --claude          Claude Code (rules + skill + hook integration)
  --cursor          Write rules and a review command for Cursor
  --augment         Write rules and a review command for Augment
  --copilot         Write rules and a review prompt for Copilot
  --code-review-agent
                    Write a code review agent prompt
  --agents          Write AGENTS.md and a generic review prompt
  --speckit         Install DDD preset into an existing Spec-Kit project

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
  npx tenets update`);
}

main().catch((err) => {
  logger.error(err.message);
  process.exitCode = 1;
});

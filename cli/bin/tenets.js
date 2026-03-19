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
  --claude          Write to .claude/docs/tenets/
  --cursor          Write to .cursor/rules/tenets/
  --copilot         Write to .github/instructions/tenets/
  --agents          Write to .agents/tenets/

Examples:
  npx tenets init --claude
  npx tenets init --cursor
  npx tenets update`);
}

main().catch((err) => {
  logger.error(err.message);
  process.exitCode = 1;
});

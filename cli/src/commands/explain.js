const { logger } = require('../ui/logger');
const {
  loadRuleCatalog,
  resolveRule,
} = require('../services/rule-catalog');

function explainCommand(args = []) {
  if (args.length !== 1) {
    throw new Error('Usage: tenets explain <rule-id>');
  }

  const catalog = loadRuleCatalog();
  const result = resolveRule(catalog, args[0]);
  if (!result.entry) {
    const suffix = result.suggestions.length > 0
      ? ` Did you mean ${result.suggestions.join(', ')}?`
      : '';
    throw new Error(`Unknown Tenets rule ID: ${result.requestedId}.${suffix}`);
  }

  if (!logger.isJsonMode()) {
    const { entry } = result;
    if (result.deprecatedEntry) {
      console.log(
        `${result.deprecatedEntry.id} is deprecated; replaced by ${entry.id}.`
      );
      console.log();
    }
    console.log(`${entry.id}: ${entry.title}`);
    console.log(`Status: ${entry.status}`);
    console.log(`Severity: ${entry.severity}`);
    console.log(`Profiles: ${entry.profiles.join(', ')}`);
    if (result.resolvedFrom) {
      console.log(`Resolved from alias: ${result.resolvedFrom}`);
    }
    console.log();
    console.log(entry.body);
    if (entry.related.length > 0) {
      console.log();
      console.log(`Related: ${entry.related.join(', ')}`);
    }
  }

  return {
    ...result.entry,
    ...(result.resolvedFrom ? { resolvedFrom: result.resolvedFrom } : {}),
    ...(result.deprecatedEntry
      ? { deprecated: result.deprecatedEntry }
      : {}),
  };
}

module.exports = { explainCommand };

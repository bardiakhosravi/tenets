const { logger } = require('../ui/logger');
const {
  loadRuleCatalog,
  resolveRule,
} = require('../services/rule-catalog');
const { readConfig } = require('../services/config-tracker');
const {
  isEntryActive,
  profileFromArgs,
  resolveProfile,
} = require('../services/profiles');

function explainCommand(args = []) {
  const ruleArgs = args.filter(
    (argument, index) =>
      argument !== '--profile' &&
      !argument.startsWith('--profile=') &&
      args[index - 1] !== '--profile'
  );
  if (ruleArgs.length !== 1) {
    throw new Error(
      'Usage: tenets explain <rule-id> [--profile core|pragmatic|strict]'
    );
  }

  const config = readConfig();
  const profile = resolveProfile(config, profileFromArgs(args));
  const appliesTo = config?.appliesTo || [];
  const catalog = loadRuleCatalog();
  const result = resolveRule(catalog, ruleArgs[0]);
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
    console.log(`Minimum profile: ${entry.minimum_profile}`);
    console.log(`Applies to: ${entry.applies_to.join(', ')}`);
    console.log(`Repository profile: ${profile}`);
    console.log(
      `Active: ${isEntryActive(entry, profile, appliesTo) ? 'yes' : 'no'}`
    );
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
    repositoryProfile: profile,
    active: isEntryActive(result.entry, profile, appliesTo),
    ...(result.resolvedFrom ? { resolvedFrom: result.resolvedFrom } : {}),
    ...(result.deprecatedEntry
      ? { deprecated: result.deprecatedEntry }
      : {}),
  };
}

module.exports = { explainCommand };

const PROFILE_ORDER = ['core', 'pragmatic', 'strict'];
const DEFAULT_PROFILE = 'pragmatic';
const LEGACY_PROFILE = 'strict';

function isProfile(value) {
  return PROFILE_ORDER.includes(value);
}

function normalizeProfile(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!isProfile(normalized)) {
    throw new Error(
      `Unknown Tenets profile: ${value || '<missing>'}. ` +
      `Expected one of: ${PROFILE_ORDER.join(', ')}.`
    );
  }
  return normalized;
}

function profileFromArgs(args = []) {
  const equalsArgument = args.find((argument) =>
    argument.startsWith('--profile=')
  );
  if (equalsArgument) {
    return normalizeProfile(equalsArgument.slice('--profile='.length));
  }

  const index = args.indexOf('--profile');
  if (index === -1) return null;
  return normalizeProfile(args[index + 1]);
}

function resolveProfile(config, explicitProfile = null) {
  if (explicitProfile) return normalizeProfile(explicitProfile);
  if (config?.profile) return normalizeProfile(config.profile);
  return config ? LEGACY_PROFILE : DEFAULT_PROFILE;
}

function deriveApplicability(detection) {
  return [
    ...(detection?.languages || []).map((language) => language.id),
    ...(detection?.frameworks || []).map((framework) => framework.id),
  ]
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort();
}

function isEntryActive(entry, profile, appliesTo = []) {
  const selectedRank = PROFILE_ORDER.indexOf(normalizeProfile(profile));
  const requiredRank = PROFILE_ORDER.indexOf(entry.minimum_profile);
  if (requiredRank === -1 || requiredRank > selectedRank) return false;

  const targets = entry.applies_to || ['all'];
  if (targets.includes('all') || appliesTo.length === 0) return true;
  return targets.every((target) => appliesTo.includes(target));
}

function profileDescription(profile) {
  return {
    core: 'Essential dependency direction, domain boundaries, ports, and adapter isolation.',
    pragmatic: 'Core rules plus production-oriented modeling, testing, transactions, and maintainability guidance.',
    strict: 'The complete applicable Tenets catalog, including advanced reliability and governance requirements.',
  }[normalizeProfile(profile)];
}

module.exports = {
  PROFILE_ORDER,
  DEFAULT_PROFILE,
  LEGACY_PROFILE,
  isProfile,
  normalizeProfile,
  profileFromArgs,
  resolveProfile,
  deriveApplicability,
  isEntryActive,
  profileDescription,
};

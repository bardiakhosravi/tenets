const fs = require('node:fs');
const path = require('node:path');
const { AUGMENT_RULE_DEFINITIONS, MARKERS } = require('../constants');
const {
  writeReviewCommand,
  reviewCommandExists,
} = require('./review-command-writer');

function buildAugmentRuleFile(definition, content) {
  const section = content.sections.find(
    (candidate) => candidate.section === definition.contentSection
  );
  const parts = [
    '---',
    `type: ${definition.type}`,
    `description: ${definition.description}`,
    '---',
    '',
    MARKERS.start,
  ];

  if (definition.includeIntroduction) {
    parts.push(content.introduction.trim(), '');
  }

  parts.push(`# ${definition.contentSection}`, '');

  for (const file of section?.files || []) {
    parts.push(file.content.trim(), '');
  }

  parts.push(MARKERS.end, '');
  return parts.join('\n');
}

function writeAugmentIntegration(projectRoot, content) {
  const rulesDir = path.join(projectRoot, '.augment', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });

  const writtenFiles = [];
  for (const definition of AUGMENT_RULE_DEFINITIONS) {
    const rulePath = path.join(rulesDir, definition.fileName);
    fs.writeFileSync(rulePath, buildAugmentRuleFile(definition, content), 'utf-8');
    writtenFiles.push(`.augment/rules/${definition.fileName}`);
  }

  writtenFiles.push(writeReviewCommand(projectRoot, 'augment'));

  return writtenFiles;
}

function augmentRulesExist(projectRoot) {
  return AUGMENT_RULE_DEFINITIONS.some((definition) =>
    fs.existsSync(path.join(projectRoot, '.augment', 'rules', definition.fileName))
  );
}

function augmentIntegrationComplete(projectRoot) {
  return (
    AUGMENT_RULE_DEFINITIONS.every((definition) =>
      fs.existsSync(
        path.join(projectRoot, '.augment', 'rules', definition.fileName)
      )
    ) && reviewCommandExists(projectRoot, 'augment')
  );
}

module.exports = {
  buildAugmentRuleFile,
  writeAugmentIntegration,
  augmentRulesExist,
  augmentIntegrationComplete,
};

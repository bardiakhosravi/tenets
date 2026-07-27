const fs = require('node:fs');
const path = require('node:path');
const { AUGMENT_RULE_DEFINITIONS, MARKERS } = require('../constants');
const {
  writeReviewCommand,
  reviewCommandPath,
  reviewCommandExists,
} = require('./review-command-writer');
const {
  writeScaffoldCommand,
  scaffoldCommandPath,
  scaffoldCommandExists,
} = require('./scaffold-command-writer');
const {
  assertCanWriteOwnedFiles,
  isTenetsOwnedFile,
  writeOwnedFile,
} = require('./file-writer');

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

function augmentOwnedPaths(projectRoot) {
  return [
    ...AUGMENT_RULE_DEFINITIONS.map((definition) =>
      path.join(projectRoot, '.augment', 'rules', definition.fileName)
    ),
    reviewCommandPath(projectRoot, 'augment'),
    scaffoldCommandPath(projectRoot, 'augment'),
  ];
}

function writeAugmentIntegration(projectRoot, content, options = {}) {
  const rulesDir = path.join(projectRoot, '.augment', 'rules');
  assertCanWriteOwnedFiles(augmentOwnedPaths(projectRoot), options);
  fs.mkdirSync(rulesDir, { recursive: true });

  const writtenFiles = [];
  for (const definition of AUGMENT_RULE_DEFINITIONS) {
    const rulePath = path.join(rulesDir, definition.fileName);
    writeOwnedFile(
      rulePath,
      buildAugmentRuleFile(definition, content),
      options
    );
    writtenFiles.push(`.augment/rules/${definition.fileName}`);
  }

  writtenFiles.push(writeReviewCommand(projectRoot, 'augment', {
    ...options,
    content,
  }));
  writtenFiles.push(writeScaffoldCommand(projectRoot, 'augment', options));

  return writtenFiles;
}

function augmentRulesExist(projectRoot) {
  return augmentOwnedPaths(projectRoot).some((filePath) =>
    fs.existsSync(filePath)
  );
}

function augmentIntegrationComplete(projectRoot) {
  return (
    AUGMENT_RULE_DEFINITIONS.every((definition) =>
      isTenetsOwnedFile(
        path.join(projectRoot, '.augment', 'rules', definition.fileName)
      )
    ) &&
    reviewCommandExists(projectRoot, 'augment') &&
    scaffoldCommandExists(projectRoot, 'augment')
  );
}

module.exports = {
  buildAugmentRuleFile,
  augmentOwnedPaths,
  writeAugmentIntegration,
  augmentRulesExist,
  augmentIntegrationComplete,
};

function recommendNextAction(detection = {}) {
  const languages = detection.languages || [];
  const frameworks = detection.frameworks || [];
  const layout = detection.layout || {};
  const sourceRoots = layout.sourceRoots || [];
  const architectureDirectories = layout.architectureDirectories || [];
  const frameworkIds = new Set(frameworks.map((framework) => framework.id));

  const hasDetectedStack = languages.length > 0 || frameworks.length > 0;
  const isMinimalRepository =
    !hasDetectedStack &&
    sourceRoots.length === 0 &&
    architectureDirectories.length === 0 &&
    (!layout.kind || layout.kind === 'flat');

  if (isMinimalRepository) {
    return {
      type: 'scaffold',
      command: '/tenets-scaffold',
      scope: 'current service',
      instruction:
        'Run `/tenets-scaffold` to initialize the service architecture.',
      reason: 'No application stack or source layout was detected.',
    };
  }

  if (architectureDirectories.length >= 2 || layout.kind === 'layered') {
    return {
      type: 'scoped_review',
      command: '/tenets-review-architecture <path-or-workflow>',
      scope: 'one existing boundary or the current change',
      instruction:
        'Run `/tenets-review-architecture <path-or-workflow>` against one existing boundary or the current change.',
      reason: 'Existing architecture boundaries were detected.',
    };
  }

  if (frameworkIds.has('flask')) {
    return {
      type: 'classify_and_scaffold',
      command: '/tenets-scaffold',
      scope: 'current service',
      instruction:
        'Run `/tenets-scaffold` to classify this Flask repository and initialize its architecture foundation only when safe.',
      reason:
        'Flask was detected without enough architecture directories to infer established boundaries.',
    };
  }

  return {
    type: 'scoped_adoption',
    command: '/tenets-review-architecture <changed-path-or-workflow>',
    scope: 'the next bounded change',
    instruction:
      'Use `/tenets-review-architecture <changed-path-or-workflow>` on the next bounded change.',
    reason:
      'An established repository was detected without clear Tenets architecture boundaries.',
  };
}

module.exports = { recommendNextAction };

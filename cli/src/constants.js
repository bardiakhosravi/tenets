const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/bardiakhosravi/tenets/main';

const INTRODUCTION_FILE = { path: 'context/00-introduction.md', title: 'Introduction' };

const CONTENT_SECTIONS = [
  {
    section: 'Architecture',
    files: [
      { path: 'context/architecture/01-hexagonal-primer.md', title: 'Hexagonal Architecture Primer' },
      { path: 'context/architecture/02-components.md', title: 'Components' },
      { path: 'context/architecture/03-ports.md', title: 'Ports' },
      { path: 'context/architecture/04-primary-adapters.md', title: 'Primary Adapters' },
      { path: 'context/architecture/05-secondary-adapters.md', title: 'Secondary Adapters' },
      { path: 'context/architecture/06-adapter-configuration.md', title: 'Adapter Configuration' },
      { path: 'context/architecture/07-integration-flow.md', title: 'Integration Flow' },
      { path: 'context/architecture/08-infrastructure-replaceability.md', title: 'Infrastructure Replaceability' },
      { path: 'context/architecture/09-api-boundaries.md', title: 'API Boundaries' },
      { path: 'context/architecture/10-semantic-types-at-port-boundaries.md', title: 'Semantic Types at Port Boundaries' },
    ],
  },
  {
    section: 'Domain',
    files: [
      { path: 'context/domain/01-entities.md', title: 'Entities' },
      { path: 'context/domain/02-value-objects.md', title: 'Value Objects' },
      { path: 'context/domain/03-aggregates.md', title: 'Aggregates' },
      { path: 'context/domain/04-domain-services.md', title: 'Domain Services' },
      { path: 'context/domain/05-repositories.md', title: 'Repositories' },
      { path: 'context/domain/06-domain-events.md', title: 'Domain Events' },
      { path: 'context/domain/07-bounded-contexts.md', title: 'Bounded Contexts' },
      { path: 'context/domain/08-ubiquitous-language.md', title: 'Ubiquitous Language' },
      { path: 'context/domain/09-bounded-context-boundary-rules.md', title: 'Bounded Context Boundary Rules' },
      { path: 'context/domain/10-creation-and-hydration.md', title: 'Domain Object Creation and Hydration' },
    ],
  },
  {
    section: 'Application',
    files: [
      { path: 'context/application/01-use-cases.md', title: 'Use Cases' },
      { path: 'context/application/02-synergy-rules.md', title: 'DDD + Hexagonal Synergy' },
      { path: 'context/application/03-event-integration.md', title: 'Event Integration' },
      { path: 'context/application/04-cross-context-communication.md', title: 'Cross-Context Communication' },
      { path: 'context/application/05-secondary-port-data-flow.md', title: 'Secondary Port Data Flow' },
    ],
  },
  {
    section: 'Global',
    files: [
      { path: 'context/global/project_structure.md', title: 'Project Structure' },
      { path: 'context/global/cross-cutting-concerns.md', title: 'Cross-Cutting Concerns' },
      { path: 'context/global/validation-error-handling.md', title: 'Validation and Error Handling' },
      { path: 'context/global/naming-conventions.md', title: 'Naming Conventions' },
      { path: 'context/global/dependency-rules.md', title: 'Dependency Rules' },
      { path: 'context/global/testing.md', title: 'Testing' },
      { path: 'context/global/async-idempotency.md', title: 'Async Idempotency' },
      { path: 'context/global/architecture-decision-records.md', title: 'Architecture Decision Records' },
    ],
  },
];

const TOOLS = {
  claude: {
    name: 'Claude Code',
    flag: '--claude',
    targetFile: 'CLAUDE.md',
    multiOutput: true,
    reviewCommand: true,
  },
  cursor: {
    name: 'Cursor',
    flag: '--cursor',
    targetFile: '.cursorrules',
    reviewCommand: true,
  },
  augment: {
    name: 'Augment',
    flag: '--augment',
    targetFile: '.augment/rules/tenets-*.md',
    augmentMultiOutput: true,
    reviewCommand: true,
  },
  copilot: {
    name: 'GitHub Copilot',
    flag: '--copilot',
    targetFile: '.github/copilot-instructions.md',
    reviewCommand: true,
  },
  codeReviewAgent: {
    name: 'Tenets Code Review Agent',
    flag: '--code-review-agent',
    targetFile: '.tenets/agents/code-review-agent.md',
    codeReviewAgent: true,
  },
  agents: {
    name: 'AGENTS.md',
    flag: '--agents',
    targetFile: 'AGENTS.md',
    reviewCommand: true,
  },
};

const CONFIG_FILE = '.tenets.json';

const MARKERS = {
  start: '<!-- tenets:start -->',
  end: '<!-- tenets:end -->',
};

/**
 * Claude Code rule files with glob-based auto-loading.
 * Each rule maps to a content section directory.
 */
const CLAUDE_RULE_DEFINITIONS = [
  {
    fileName: 'tenets-domain.md',
    description: 'DDD domain layer rules: entities, value objects, aggregates, creation and hydration, domain services, repositories, domain events, bounded contexts',
    globs: '**/domain/**',
    contentSection: 'Domain',
  },
  {
    fileName: 'tenets-application.md',
    description: 'Application layer rules: use cases, DDD+hexagonal synergy, event integration, cross-context communication, secondary port data flow',
    globs: '**/application/**,**/use_cases/**,**/handlers/**',
    contentSection: 'Application',
  },
  {
    fileName: 'tenets-architecture.md',
    description: 'Hexagonal architecture rules: ports, semantic boundary types, primary adapters, secondary adapters, adapter configuration, integration flow',
    globs: '**/adapters/**,**/infrastructure/**,**/ports/**',
    contentSection: 'Architecture',
  },
  {
    fileName: 'tenets-global.md',
    description: 'Cross-cutting rules: project structure, dependency direction, testing, naming, validation, error handling',
    globs: '**/src/**',
    contentSection: 'Global',
  },
];

const AUGMENT_RULE_DEFINITIONS = [
  {
    fileName: 'tenets-global.md',
    type: 'always_apply',
    description: 'Core Tenets project structure, dependency, testing, naming, validation, and error-handling rules',
    contentSection: 'Global',
    includeIntroduction: true,
  },
  {
    fileName: 'tenets-architecture.md',
    type: 'agent_requested',
    description: 'Apply when designing or changing ports, semantic boundary types, adapters, infrastructure, APIs, or hexagonal architecture boundaries',
    contentSection: 'Architecture',
  },
  {
    fileName: 'tenets-domain.md',
    type: 'agent_requested',
    description: 'Apply when designing or changing entities, value objects, aggregates, creation and hydration, repositories, domain services, events, or bounded contexts',
    contentSection: 'Domain',
  },
  {
    fileName: 'tenets-application.md',
    type: 'agent_requested',
    description: 'Apply when designing or changing use cases, application services, orchestration, cross-context communication, or secondary port data flow',
    contentSection: 'Application',
  },
];

const CLAUDE_MD_SNIPPET = `${MARKERS.start}
## Architecture: Hexagonal + DDD (via tenets)

This project follows **Hexagonal Architecture** (Ports & Adapters) with **Domain-Driven Design**.
Rules are installed by \`tenets\`. Run \`npx tenets update\` to update.

### Non-negotiable rules
- **Dependency direction is inward**: adapters -> application -> domain. NEVER domain -> infrastructure.
- **Domain layer has ZERO external dependencies** — no frameworks, no ORMs, no HTTP libraries.
- **All infrastructure access goes through ports** (abstract interfaces).
- **No naked domain primitives cross repository or secondary-port contracts** — use domain types or cohesive application capability contracts.
- **Repository lookups use semantic verbs** — \`get\`, \`get_by_*\`, \`list_*\`, \`search\`, or \`exists_by_*\`; never \`find_*\`.
- **Aggregates are the only entry point** for state mutations within their boundary.
- **Creation and hydration are different** — create new domain objects with module-level creation functions; repository adapters hydrate existing objects with constructors.
- **Use cases orchestrate domain logic** — they contain NO business rules themselves.
- **Use cases load domain objects before calling secondary ports** — ports receive domain models, never repositories.
- **Primary adapters translate** external requests to domain commands; they contain NO business logic.
- **Secondary adapters implement ports** — they handle all external system complexity.
- **Domain events use ubiquitous language only** — no vendor or technology names.

### Context-aware rules
Rules auto-load based on what you're editing:
- Editing \`domain/\` files -> domain rules load automatically
- Editing \`adapters/\` or \`infrastructure/\` files -> port & adapter rules load
- Editing \`application/\` files -> use case & orchestration rules load

### Automatic architecture review
After completing any feature implementation, bug fix, or refactoring that touches domain, application, or infrastructure code, you MUST run \`/tenets-review-architecture\` to verify compliance before presenting the work as done. Do not skip this step.

### On-demand review
You or the user can also run \`/tenets-review-architecture\` at any time for a full compliance audit.

Detailed rules: \`.claude/rules/tenets-*.md\`
${MARKERS.end}`;

const CODE_REVIEW_AGENT_NAME = 'code-review-agent';
const CODE_REVIEW_AGENT_TEMPLATE = 'templates/agents/code-review-agent.md';
const CLAUDE_CODE_REVIEW_AGENT_TEMPLATE = 'templates/claude/agents/code-review-agent.md';
const CODE_REVIEW_AGENT_HOOK_PROMPT_TEMPLATE = 'templates/claude/hooks/code-review-agent-prompt.md';

const CLAUDE_HOOK_SCRIPT = `#!/usr/bin/env node
/**
 * PostToolUse hook for tenets architecture monitoring.
 * Fires after Edit/Write tool calls to remind Claude about architecture rules.
 */

const LAYER_RULES = {
  domain: 'Domain layer: no external deps, entities have identity equality, VOs are immutable, aggregates enforce invariants, and creation functions are distinct from hydration constructors.',
  application: 'Application layer: use cases orchestrate only, load required domain objects before secondary ports, and pass semantic domain types or capability contracts instead of naked domain primitives.',
  adapters: 'Adapter layer: implement semantic port contracts, unwrap values only during external mapping, handle external complexity, and perform no hidden repository loading.',
  infrastructure: 'Infrastructure layer: implement semantic port contracts, keep tech-specific models here, and confine primitives to persistence, serialization, configuration, and private mapping.',
};

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';

    for (const [layer, reminder] of Object.entries(LAYER_RULES)) {
      if (filePath.includes(\`/\${layer}/\`) || filePath.includes(\`/\${layer}s/\`)) {
        process.stdout.write(\`[tenets] Editing \${layer} layer. \${reminder}\`);
        process.exit(0);
        return;
      }
    }
  } catch {
    // Silently ignore parse errors
  }
  process.exit(0);
});
`;

module.exports = {
  GITHUB_RAW_BASE,
  INTRODUCTION_FILE,
  CONTENT_SECTIONS,
  TOOLS,
  CONFIG_FILE,
  MARKERS,
  CLAUDE_RULE_DEFINITIONS,
  AUGMENT_RULE_DEFINITIONS,
  CLAUDE_MD_SNIPPET,
  CODE_REVIEW_AGENT_NAME,
  CODE_REVIEW_AGENT_TEMPLATE,
  CLAUDE_CODE_REVIEW_AGENT_TEMPLATE,
  CODE_REVIEW_AGENT_HOOK_PROMPT_TEMPLATE,
  CLAUDE_HOOK_SCRIPT,
};

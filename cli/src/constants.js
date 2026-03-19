const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/bardiakhosravi/ai-agent-backend-standards/main';

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
    ],
  },
  {
    section: 'Application',
    files: [
      { path: 'context/application/01-use-cases.md', title: 'Use Cases' },
      { path: 'context/application/02-synergy-rules.md', title: 'DDD + Hexagonal Synergy' },
      { path: 'context/application/03-event-integration.md', title: 'Event Integration' },
      { path: 'context/application/04-cross-context-communication.md', title: 'Cross-Context Communication' },
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
    targetDir: '.claude/docs/tenets',
    fileExtension: '.md',
    description: 'Claude Code automatically reads files in .claude/docs/',
  },
  cursor: {
    name: 'Cursor',
    flag: '--cursor',
    targetDir: '.cursor/rules/tenets',
    fileExtension: '.mdc',
    description: 'Cursor automatically reads .mdc files in .cursor/rules/',
  },
  copilot: {
    name: 'GitHub Copilot',
    flag: '--copilot',
    targetDir: '.github/instructions/tenets',
    fileExtension: '.instructions.md',
    description: 'Copilot automatically reads .instructions.md files in .github/instructions/',
  },
  agents: {
    name: 'AGENTS.md',
    flag: '--agents',
    targetDir: '.agents/tenets',
    fileExtension: '.md',
    description: 'AGENTS.md rules stored as separate files.',
  },
};

const CONFIG_FILE = '.tenets.json';

const MARKERS = {
  start: '<!-- tenets:start -->',
  end: '<!-- tenets:end -->',
};

module.exports = { GITHUB_RAW_BASE, INTRODUCTION_FILE, CONTENT_SECTIONS, TOOLS, CONFIG_FILE, MARKERS };

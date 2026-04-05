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
    targetFile: 'CLAUDE.md',
    multiOutput: true,
  },
  cursor: {
    name: 'Cursor',
    flag: '--cursor',
    targetFile: '.cursorrules',
  },
  copilot: {
    name: 'GitHub Copilot',
    flag: '--copilot',
    targetFile: '.github/copilot-instructions.md',
  },
  agents: {
    name: 'AGENTS.md',
    flag: '--agents',
    targetFile: 'AGENTS.md',
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
    description: 'DDD domain layer rules: entities, value objects, aggregates, domain services, repositories, domain events, bounded contexts',
    globs: '**/domain/**',
    contentSection: 'Domain',
  },
  {
    fileName: 'tenets-application.md',
    description: 'Application layer rules: use cases, DDD+hexagonal synergy, event integration, cross-context communication',
    globs: '**/application/**,**/use_cases/**,**/handlers/**',
    contentSection: 'Application',
  },
  {
    fileName: 'tenets-architecture.md',
    description: 'Hexagonal architecture rules: ports, primary adapters, secondary adapters, adapter configuration, integration flow',
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

const CLAUDE_MD_SNIPPET = `${MARKERS.start}
## Architecture: Hexagonal + DDD (via tenets)

This project follows **Hexagonal Architecture** (Ports & Adapters) with **Domain-Driven Design**.
Rules are installed by \`tenets\`. Run \`npx tenets update\` to update.

### Non-negotiable rules
- **Dependency direction is inward**: adapters -> application -> domain. NEVER domain -> infrastructure.
- **Domain layer has ZERO external dependencies** — no frameworks, no ORMs, no HTTP libraries.
- **All infrastructure access goes through ports** (abstract interfaces).
- **Aggregates are the only entry point** for state mutations within their boundary.
- **Use cases orchestrate domain logic** — they contain NO business rules themselves.
- **Primary adapters translate** external requests to domain commands; they contain NO business logic.
- **Secondary adapters implement ports** — they handle all external system complexity.
- **Domain events use ubiquitous language only** — no vendor or technology names.

### Context-aware rules
Rules auto-load based on what you're editing:
- Editing \`domain/\` files -> domain rules load automatically
- Editing \`adapters/\` or \`infrastructure/\` files -> port & adapter rules load
- Editing \`application/\` files -> use case & orchestration rules load

### Automatic architecture review
After completing any feature implementation, bug fix, or refactoring that touches domain, application, or infrastructure code, you MUST run \`/review-architecture\` to verify compliance before presenting the work as done. Do not skip this step.

### On-demand review
You or the user can also run \`/review-architecture\` at any time for a full compliance audit.

Detailed rules: \`.claude/rules/tenets-*.md\`
${MARKERS.end}`;

const CLAUDE_SKILL_CONTENT = `---
name: review-architecture
description: Review code for Hexagonal Architecture and DDD compliance. Use when the user asks to check architecture, review DDD compliance, or validate code structure.
allowed-tools: Read Grep Glob
---

You are a strict architecture reviewer for a codebase following **Hexagonal Architecture** (Ports & Adapters) with **Domain-Driven Design**.

## Step 1: Load the rules

Read ALL rule files matching \`.claude/rules/tenets-*.md\` to understand the full set of architectural guidelines.

## Step 2: Analyze the codebase

Examine the project structure and source files. If a specific path was provided as an argument (\`$ARGUMENTS\`), focus on that path. Otherwise, analyze the full \`src/\` directory.

## Step 3: Check for violations

For each file, verify:

### Domain layer (\`**/domain/**\`)
- No imports from application, infrastructure, or adapter layers
- Entities use identity-based equality, not attribute-based
- Value objects are immutable
- Aggregates enforce invariants — no logic leaking to use cases or repositories
- Repository interfaces are abstract (ABC) and use domain language
- Domain events are immutable and use ubiquitous language only (no vendor/tech names)

### Application layer (\`**/application/**\`)
- Use cases contain NO business logic — only orchestration
- Each use case handles exactly one business workflow
- Use cases depend on port interfaces, never on concrete adapters
- Primary ports define the application boundary

### Infrastructure/Adapter layer (\`**/infrastructure/**\`, \`**/adapters/**\`)
- Secondary adapters implement port interfaces from domain/application layers
- Adapters handle all external system complexity (mapping, retries, errors)
- No domain logic in adapters
- Technology-specific models stay within their adapter directories
- Primary adapters (controllers) are thin — translate and delegate only

### Dependency direction
- Domain depends on nothing external
- Application depends only on domain
- Infrastructure/adapters depend on domain and application (through ports)
- No circular dependencies

### Project structure
- One class per file
- No implementation code in \`__init__.py\`
- Configuration/DI container wires adapters to ports at startup

## Step 4: Report

For each violation found:
1. **File path and line number**
2. **Rule violated** (reference the specific tenet)
3. **What's wrong** (concrete description)
4. **How to fix it** (specific code change or restructuring needed)

Group violations by severity:
- **Critical**: Dependency direction violations, domain layer impurity
- **Major**: Business logic in wrong layer, missing port abstractions
- **Minor**: Naming conventions, file organization

If no violations are found, confirm the code is compliant and note any particularly well-implemented patterns.
`;

const CLAUDE_HOOK_SCRIPT = `#!/usr/bin/env node
/**
 * PostToolUse hook for tenets architecture monitoring.
 * Fires after Edit/Write tool calls to remind Claude about architecture rules.
 */

const LAYER_RULES = {
  domain: 'Domain layer: no external deps, entities have identity equality, VOs are immutable, aggregates enforce invariants.',
  application: 'Application layer: use cases orchestrate only — no business logic. Depend on ports, never adapters.',
  adapters: 'Adapter layer: implement port interfaces, handle external complexity, no domain logic.',
  infrastructure: 'Infrastructure layer: implement port interfaces, keep tech-specific models here.',
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
  CLAUDE_MD_SNIPPET,
  CLAUDE_SKILL_CONTENT,
  CLAUDE_HOOK_SCRIPT,
};

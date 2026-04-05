const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/bardiakhosravi/ai-agent-backend-standards/main';

const GITHUB_URLS = {
  rules: `${GITHUB_RAW_BASE}/domain_driven_design_hexagonal_arhictecture_python_rules.md`,
  context: [
    {
      url: `${GITHUB_RAW_BASE}/context/architecture/01-hexagonal-primer.md`,
      title: 'Hexagonal Architecture Primer',
    },
    {
      url: `${GITHUB_RAW_BASE}/context/architecture/02-components.md`,
      title: 'Components',
    },
    {
      url: `${GITHUB_RAW_BASE}/context/global/project_structure.md`,
      title: 'Project Structure',
    },
  ],
};

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
 * Each rule file gets frontmatter with globs so Claude Code injects
 * the right rules when working on matching files.
 */
const CLAUDE_RULE_DEFINITIONS = [
  {
    fileName: 'tenets-domain.md',
    description: 'DDD domain layer rules: entities, value objects, aggregates, domain services, repositories, domain events',
    globs: '**/domain/**',
    contentSections: ['Core Domain Model Rules', 'Domain Event Rules'],
  },
  {
    fileName: 'tenets-application.md',
    description: 'Application layer rules: use cases, ports, orchestration, event handling',
    globs: '**/application/**,**/use_cases/**,**/handlers/**',
    contentSections: ['Application Service Rules'],
  },
  {
    fileName: 'tenets-ports-adapters.md',
    description: 'Hexagonal architecture rules: ports, primary adapters, secondary adapters, adapter configuration',
    globs: '**/adapters/**,**/infrastructure/**,**/ports/**',
    contentSections: ['Ports & Adapters (Hexagonal Architecture) Rules'],
  },
  {
    fileName: 'tenets-structure.md',
    description: 'Project structure, dependency direction, and integration flow rules for hexagonal architecture',
    globs: '**/src/**',
    contentSections: ['Integrated Project Structure Rules'],
  },
  {
    fileName: 'tenets-synergy.md',
    description: 'DDD + Hexagonal synergy: repository-as-port, use-case-as-port, event integration, cross-cutting concerns',
    globs: '**/domain/**,**/application/**,**/infrastructure/**',
    contentSections: ['Synergy Rules for DDD + Ports & Adapters'],
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

### On-demand review
Run \`/review-architecture\` to get a full compliance review against all tenets.

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
 *
 * Reads the tool input from stdin and checks if the edited file is in a
 * layer that has specific rules. Outputs a brief reminder to stdout which
 * gets injected into Claude's context.
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
    // Silently ignore parse errors — don't block the tool
  }
  process.exit(0);
});
`;

module.exports = {
  GITHUB_RAW_BASE,
  GITHUB_URLS,
  TOOLS,
  CONFIG_FILE,
  MARKERS,
  CLAUDE_RULE_DEFINITIONS,
  CLAUDE_MD_SNIPPET,
  CLAUDE_SKILL_CONTENT,
  CLAUDE_HOOK_SCRIPT,
};

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

module.exports = { GITHUB_RAW_BASE, GITHUB_URLS, TOOLS, CONFIG_FILE, MARKERS };

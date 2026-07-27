#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DEMO_ROOT = __dirname;
const REPO_ROOT = path.resolve(DEMO_ROOT, '..', '..');
const CAPTURE_ROOT = path.join(DEMO_ROOT, 'captured');
const OUTPUT_ROOT = path.join(REPO_ROOT, 'docs', 'assets');
const TEMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'tenets-demo-render-'));
const CACHE_ROOT = path.join(TEMP_ROOT, 'cache');
fs.mkdirSync(CACHE_ROOT, { recursive: true });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    env: {
      ...process.env,
      XDG_CACHE_HOME: CACHE_ROOT,
    },
    stdio: options.capture ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} failed${result.stderr ? `:\n${result.stderr}` : ''}`
    );
  }
  return result.stdout;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function textLines(lines, x, y, options = {}) {
  const {
    size = 31,
    lineHeight = 48,
    colour = '#d7dde5',
    weight = 500,
    family = 'SFMono-Regular, Menlo, monospace',
  } = options;
  return lines.map((line, index) => {
    const lineColour = line.startsWith('$')
      ? '#52d6b5'
      : line.startsWith('PASS') || line.startsWith('OK')
        ? '#7ed989'
        : line.startsWith('ERROR') || line.startsWith('[error]')
          ? '#ff7a70'
          : line.startsWith('TENETS-')
            ? '#ffc857'
            : colour;
    return `<text x="${x}" y="${y + index * lineHeight}" ` +
      `font-family="${family}" font-size="${size}" font-weight="${weight}" ` +
      `fill="${lineColour}">${escapeXml(line)}</text>`;
  }).join('\n');
}

function panel(x, y, width, height, title, lines, options = {}) {
  const accent = options.accent || '#52d6b5';
  return [
    `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="#15191f" stroke="#303742" stroke-width="2"/>`,
    `<rect x="${x}" y="${y}" width="8" height="${height}" rx="4" fill="${accent}"/>`,
    `<text x="${x + 36}" y="${y + 48}" font-family="SF Pro Display, Arial, sans-serif" font-size="25" font-weight="700" fill="${accent}">${escapeXml(title)}</text>`,
    textLines(lines, x + 36, y + 104, {
      size: options.size || 28,
      lineHeight: options.lineHeight || 43,
    }),
  ].join('\n');
}

function renderScene(scene, index) {
  const progressWidth = 1680 / 6;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <rect width="1920" height="1080" fill="#0b0e12"/>
  <rect x="0" y="0" width="1920" height="10" fill="#52d6b5"/>
  <circle cx="82" cy="76" r="18" fill="#52d6b5"/>
  <circle cx="105" cy="76" r="9" fill="#ff7a70"/>
  <text x="136" y="88" font-family="SF Pro Display, Arial, sans-serif" font-size="42" font-weight="800" fill="#f5f7fa">TENETS</text>
  <text x="1748" y="84" text-anchor="end" font-family="SFMono-Regular, Menlo, monospace" font-size="24" fill="#8d98a8">ARCHITECTURE GUARDRAILS</text>
  <text x="120" y="183" font-family="SFMono-Regular, Menlo, monospace" font-size="23" font-weight="700" fill="#ff7a70">${escapeXml(scene.eyebrow.toUpperCase())}</text>
  <text x="120" y="254" font-family="SF Pro Display, Arial, sans-serif" font-size="60" font-weight="800" fill="#f5f7fa">${escapeXml(scene.title)}</text>
  <text x="120" y="306" font-family="SF Pro Text, Arial, sans-serif" font-size="28" fill="#aeb7c3">${escapeXml(scene.subtitle)}</text>
  ${panel(120, 360, 810, 570, scene.leftTitle, scene.leftLines, {
    accent: scene.leftAccent || '#52d6b5',
    size: scene.leftSize,
    lineHeight: scene.leftLineHeight,
  })}
  ${panel(970, 360, 830, 570, scene.rightTitle, scene.rightLines, {
    accent: scene.rightAccent || '#ffc857',
    size: scene.rightSize,
    lineHeight: scene.rightLineHeight,
  })}
  <text x="120" y="995" font-family="SF Pro Text, Arial, sans-serif" font-size="25" fill="#8d98a8">${escapeXml(scene.footer)}</text>
  <text x="1800" y="995" text-anchor="end" font-family="SFMono-Regular, Menlo, monospace" font-size="23" fill="#8d98a8">${String(index + 1).padStart(2, '0')} / 06</text>
  <rect x="120" y="1031" width="1680" height="5" fill="#252b33"/>
  <rect x="120" y="1031" width="${progressWidth * (index + 1)}" height="5" fill="#52d6b5"/>
</svg>`;
}

function requiredCapture(fileName, marker) {
  const filePath = path.join(CAPTURE_ROOT, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}. Run demo/act-009/capture-demo.sh.`);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes(marker)) {
    throw new Error(`${fileName} does not contain expected marker: ${marker}`);
  }
  return content;
}

requiredCapture('init.txt', 'Installation verified.');
requiredCapture('explain.txt', 'TENETS-PORT-005');
const config = JSON.parse(
  requiredCapture('tenets-config.json', '"profile": "pragmatic"')
);
if (config.profile !== 'pragmatic') {
  throw new Error('Captured demo configuration must use the pragmatic profile.');
}

const scenes = [
  {
    eyebrow: 'An existing FastAPI service',
    title: 'One workflow. Three boundary leaks.',
    subtitle: 'The code runs, but its architecture will get harder to change.',
    leftTitle: 'submit_order_use_case.py',
    leftLines: [
      'from adapters.secondary import',
      '    SqlOrderRepository',
      '',
      'class SubmitOrderUseCase:',
      '    def __init__(',
      '        repository:',
      '        SqlOrderRepository,',
      '    ): ...',
    ],
    rightTitle: 'email_order_notifier.py',
    rightLines: [
      'class EmailOrderNotifier:',
      '    def __init__(self,',
      '        order_repository,',
      '    ): ...',
      '',
      '    order = repository.get(',
      '        OrderId(order_id)',
      '    )',
    ],
    rightAccent: '#ff7a70',
    footer: 'Generated code can look reasonable while crossing critical boundaries.',
  },
  {
    eyebrow: 'Step 1 - Install',
    title: 'Tenets detects the repository.',
    subtitle: 'One command installs versioned rules where the agent already looks.',
    leftTitle: 'TERMINAL',
    leftLines: [
      '$ npx tenets init',
      '',
      'Press Enter to accept',
      '',
      'Detected repository:',
      '  Stack: Python, FastAPI',
      '  Layout: layered',
      '',
      'Using pragmatic profile.',
    ],
    rightTitle: 'POST-INSTALL VERIFICATION',
    rightLines: [
      'PASS AGENTS.md',
      'PASS Review prompt',
      'PASS Profile: pragmatic',
      'PASS Applicability:',
      '     fastapi, python',
      '',
      'OK Installation verified.',
    ],
    rightAccent: '#7ed989',
    footer: 'No unversioned network rules. No hidden global configuration.',
  },
  {
    eyebrow: 'Step 2 - Verify',
    title: 'The integration is explicit.',
    subtitle: 'Rules, review workflow, and repository policy are inspectable files.',
    leftTitle: 'FILES WRITTEN',
    leftLines: [
      'AGENTS.md',
      '',
      '.tenets/',
      '  prompts/',
      '    tenets-review-',
      '    architecture.md',
      '',
      '.tenets.json',
    ],
    rightTitle: '.tenets.json',
    rightLines: [
      '{',
      '  "schemaVersion": 4,',
      '  "profile": "pragmatic",',
      '  "appliesTo": [',
      '    "fastapi",',
      '    "python"',
      '  ]',
      '}',
    ],
    footer: 'The selected profile controls both delivered knowledge and compliance.',
  },
  {
    eyebrow: 'Step 3 - Review',
    title: 'Review one workflow, not the world.',
    subtitle: 'The agent reports exact files, active rule IDs, and concrete remediation.',
    leftTitle: 'AGENT COMMAND',
    leftLines: [
      '$ /tenets-review-architecture',
      '    src/ordering',
      '',
      'Status: changes_requested',
      '',
      '3 blocking findings',
      '0 inactive-rule findings',
    ],
    rightTitle: 'FINDINGS',
    rightLines: [
      '[error] TENETS-DEPEND-002',
      'Use case imports SQL adapter',
      '',
      '[error] TENETS-PORT-007',
      'Port exposes naked primitives',
      '',
      '[error] TENETS-PORT-005',
      'Adapter loads through repository',
    ],
    rightAccent: '#ff7a70',
    rightSize: 25,
    footer: 'Stable IDs turn review feedback into durable, explainable policy.',
  },
  {
    eyebrow: 'Step 4 - Explain',
    title: 'Every finding answers "what now?"',
    subtitle: 'Canonical guidance remains available offline from the installed package.',
    leftTitle: 'TERMINAL',
    leftLines: [
      '$ npx tenets explain',
      '    TENETS-PORT-005',
      '',
      'Minimum profile: core',
      'Repository profile: pragmatic',
      'Active: yes',
      'Severity: error',
    ],
    rightTitle: 'REMEDIATION',
    rightLines: [
      'Remove repository dependencies',
      'from the secondary capability.',
      '',
      'Load required domain objects in',
      'the use case and pass the',
      'complete semantic input through',
      'the port contract.',
    ],
    footer: 'Rule, rationale, incorrect example, correct example, and review check.',
  },
  {
    eyebrow: 'Architecture quality loop',
    title: 'Install. Review. Explain.',
    subtitle: 'Architecture guardrails for AI-generated backend services.',
    leftTitle: 'START',
    leftLines: [
      '$ npx tenets init',
      '',
      'Claude Code',
      'Cursor',
      'Augment',
      'GitHub Copilot',
      'AGENTS.md',
    ],
    rightTitle: 'KEEP THE BOUNDARIES',
    rightLines: [
      'Specify',
      'Generate',
      'Review',
      'Enforce',
      'Explain',
      '',
      'github.com/bardiakhosravi/tenets',
    ],
    rightAccent: '#7ed989',
    footer: 'Tenets - pragmatic DDD and Hexagonal Architecture guidance for coding agents.',
  },
];

fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

const pngPaths = scenes.map((scene, index) => {
  const number = String(index + 1).padStart(2, '0');
  const svgPath = path.join(TEMP_ROOT, `scene-${number}.svg`);
  const pngPath = path.join(TEMP_ROOT, `scene-${number}.png`);
  fs.writeFileSync(svgPath, renderScene(scene, index), 'utf-8');
  run('magick', ['-background', 'none', svgPath, pngPath]);
  return pngPath;
});

const videoPath = path.join(OUTPUT_ROOT, 'tenets-demo.mp4');
const posterPath = path.join(OUTPUT_ROOT, 'tenets-demo-poster.png');
const previewPath = path.join(OUTPUT_ROOT, 'tenets-demo-preview.gif');
fs.copyFileSync(pngPaths[3], posterPath);

const videoInputs = pngPaths.flatMap((pngPath) => [
  '-loop', '1',
  '-framerate', '30',
  '-t', '10',
  '-i', pngPath,
]);
const videoFilters = pngPaths.map((_, index) =>
  `[${index}:v]fade=t=in:st=0:d=0.25,fade=t=out:st=9.75:d=0.25[v${index}]`
);
videoFilters.push(
  `${pngPaths.map((_, index) => `[v${index}]`).join('')}concat=n=6:v=1:a=0[out]`
);
run('ffmpeg', [
  '-y',
  ...videoInputs,
  '-filter_complex', videoFilters.join(';'),
  '-map', '[out]',
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '20',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  videoPath,
]);

run('ffmpeg', [
  '-y',
  '-framerate', '1',
  '-pattern_type', 'glob',
  '-i', path.join(TEMP_ROOT, 'scene-*.png'),
  '-vf',
  'fps=1,scale=960:-1:flags=lanczos,split[s0][s1];' +
    '[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer',
  '-loop', '0',
  previewPath,
]);

const duration = run(
  'ffprobe',
  [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    videoPath,
  ],
  { capture: true }
).trim();
if (Math.abs(Number(duration) - 60) > 0.05) {
  throw new Error(`Expected a 60-second video, got ${duration} seconds.`);
}

fs.rmSync(TEMP_ROOT, { recursive: true, force: true });
console.log(`Rendered ${path.relative(REPO_ROOT, videoPath)} (${duration}s)`);
console.log(`Rendered ${path.relative(REPO_ROOT, posterPath)}`);
console.log(`Rendered ${path.relative(REPO_ROOT, previewPath)}`);

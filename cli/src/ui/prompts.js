const readline = require('node:readline');

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

function detectionSummary(detection) {
  const agents = detection.agents.map((agent) => agent.name);
  const stack = [
    ...detection.languages.map((language) => language.name),
    ...detection.frameworks.map((framework) => framework.name),
  ];
  return {
    agents: agents.length > 0
      ? agents.join(', ')
      : 'No repository-local agent configuration',
    stack: stack.length > 0 ? stack.join(', ') : 'No recognized stack manifest',
    layout: detection.layout.kind,
  };
}

async function promptRecommendedSetup(tools, detection) {
  const rl = createInterface();
  const summary = detectionSummary(detection);
  const entries = Object.entries(tools).map(([key, tool]) => ({
    key,
    name: tool.name,
    targetFile: tool.targetFile,
    selected: detection.recommendations.tools.includes(key),
  }));
  if (detection.speckit.initialized) {
    entries.push({
      key: 'speckit',
      name: 'Spec-Kit DDD preset',
      targetFile: '.specify/presets/tenets-ddd',
      selected: detection.recommendations.speckit,
    });
  }

  console.log('Detected repository:\n');
  console.log(`  Agents: ${summary.agents}`);
  console.log(`  Stack:  ${summary.stack}`);
  console.log(`  Layout: ${summary.layout}`);
  console.log();
  console.log('Recommended setup:\n');
  entries.forEach((entry, index) => {
    console.log(
      `  ${index + 1}) [${entry.selected ? 'x' : ' '}] ` +
      `${entry.name} (${entry.targetFile})`
    );
  });
  console.log();
  console.log('Press Enter to accept the checked items, or enter numbers separated by commas.');

  try {
    const answer = await ask(rl, 'Selection: ');
    if (answer === '') {
      return {
        toolKeys: entries
          .filter((entry) => entry.selected && entry.key !== 'speckit')
          .map((entry) => entry.key),
        speckit: entries.some((entry) =>
          entry.key === 'speckit' && entry.selected
        ),
      };
    }

    const indexes = answer
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10) - 1);
    if (
      indexes.length === 0 ||
      indexes.some((index) =>
        Number.isNaN(index) || index < 0 || index >= entries.length
      )
    ) {
      return null;
    }
    const selected = [...new Set(indexes)].map((index) => entries[index]);
    return {
      toolKeys: selected
        .filter((entry) => entry.key !== 'speckit')
        .map((entry) => entry.key),
      speckit: selected.some((entry) => entry.key === 'speckit'),
    };
  } finally {
    rl.close();
  }
}

async function promptFileConflict(filePath) {
  const rl = createInterface();

  console.log(`\nFile already exists: ${filePath}\n`);
  console.log('  1) Replace entire file');
  console.log('  2) Append to existing file');
  console.log('  3) Cancel');
  console.log();

  try {
    const answer = await ask(rl, 'Enter number: ');
    const choice = parseInt(answer, 10);

    switch (choice) {
      case 1:
        return 'replace';
      case 2:
        return 'append';
      case 3:
        return 'cancel';
      default:
        return 'cancel';
    }
  } finally {
    rl.close();
  }
}

async function promptYesNo(question) {
  const rl = createInterface();

  try {
    const answer = await ask(rl, `${question} (y/N): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

module.exports = {
  promptRecommendedSetup,
  promptFileConflict,
  promptYesNo,
};

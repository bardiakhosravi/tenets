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

async function promptToolSelection(tools) {
  const rl = createInterface();
  const entries = Object.entries(tools);

  console.log('Which AI tool do you want to install rules for?\n');
  entries.forEach(([key, tool], i) => {
    console.log(`  ${i + 1}) ${tool.name} (${tool.targetFile})`);
  });
  console.log();

  try {
    const answer = await ask(rl, 'Enter number: ');
    const index = parseInt(answer, 10) - 1;

    if (index < 0 || index >= entries.length || Number.isNaN(index)) {
      return null;
    }

    return entries[index][0];
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

module.exports = { promptToolSelection, promptFileConflict };

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

let jsonMode = false;
let messages = [];

function emit(level, msg, writer) {
  if (jsonMode) {
    messages.push({ level, message: msg });
    return;
  }
  writer();
}

const logger = {
  info(msg) {
    emit('info', msg, () => console.log(`${CYAN}info${RESET} ${msg}`));
  },
  success(msg) {
    emit('success', msg, () =>
      console.log(`${GREEN}${BOLD}\u2714${RESET} ${msg}`)
    );
  },
  warn(msg) {
    emit('warning', msg, () => console.log(`${YELLOW}warn${RESET} ${msg}`));
  },
  error(msg) {
    emit('error', msg, () =>
      console.error(`${RED}${BOLD}\u2716${RESET} ${msg}`)
    );
  },
  dim(msg) {
    emit('detail', msg, () => console.log(`${DIM}${msg}${RESET}`));
  },
  blank() {
    if (!jsonMode) console.log();
  },
  banner() {
    if (jsonMode) return;
    console.log(
      `${BOLD}tenets${RESET} ${DIM}— DDD + Hexagonal Architecture rules for AI agents${RESET}`
    );
    console.log();
  },
  setJsonMode(enabled) {
    jsonMode = enabled;
    messages = [];
  },
  isJsonMode() {
    return jsonMode;
  },
  jsonResult(command, result, error = null) {
    const output = {
      ok: !error && (!process.exitCode || process.exitCode === 0),
      command,
      ...(result === undefined ? {} : { result }),
      messages,
      ...(error ? { error } : {}),
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  },
};

module.exports = { logger };

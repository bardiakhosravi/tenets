const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';

const logger = {
  info(msg) {
    console.log(`${CYAN}info${RESET} ${msg}`);
  },
  success(msg) {
    console.log(`${GREEN}${BOLD}\u2714${RESET} ${msg}`);
  },
  warn(msg) {
    console.log(`${YELLOW}warn${RESET} ${msg}`);
  },
  error(msg) {
    console.error(`${RED}${BOLD}\u2716${RESET} ${msg}`);
  },
  dim(msg) {
    console.log(`${DIM}${msg}${RESET}`);
  },
  blank() {
    console.log();
  },
  banner() {
    console.log(
      `${BOLD}tenets${RESET} ${DIM}— DDD + Hexagonal Architecture rules for AI agents${RESET}`
    );
    console.log();
  },
};

module.exports = { logger };

const { logger } = require('../ui/logger');
const {
  inspectInstallation,
} = require('../services/installation-inspector');

function renderDoctorResult(
  result,
  heading = `Tenets doctor (${result.packageVersion})`
) {
  if (logger.isJsonMode()) return;

  logger.info(heading);
  logger.dim(
    `  Profile: ${result.profile}; applicability: ` +
    `${result.appliesTo.length > 0 ? result.appliesTo.join(', ') : 'unrestricted'}`
  );
  for (const tool of result.tools) {
    const output = tool.status === 'healthy' ? logger.success : logger.warn;
    output(`${tool.name}: ${tool.status}`);
    for (const item of tool.findings) {
      logger.dim(
        `  [${item.code}] ${item.path ? `${item.path}: ` : ''}${item.message}`
      );
    }
  }
  for (const preset of result.presets) {
    const output = preset.status === 'healthy' ? logger.success : logger.warn;
    output(`Spec-Kit ${preset.preset}: ${preset.status}`);
    for (const item of preset.findings) {
      logger.dim(
        `  [${item.code}] ${item.path ? `${item.path}: ` : ''}${item.message}`
      );
    }
  }
  for (const item of result.findings) {
    logger.warn(`[${item.code}] ${item.message}`);
  }
  logger.blank();
  logger.info(
    `${result.summary.healthy} healthy, ${result.summary.warnings} warning(s), ` +
    `${result.summary.errors} error(s).`
  );
}

async function doctorCommand(args = [], options = {}) {
  const result = await inspectInstallation(options);
  renderDoctorResult(result);
  if (!result.healthy) {
    process.exitCode = 1;
  }
  return result;
}

module.exports = { doctorCommand, renderDoctorResult };

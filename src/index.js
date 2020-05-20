const core = require('@actions/core');
const ActionConfig = require('./config/action-config');

try {
  const actionConfig = new ActionConfig(core);
  if (actionConfig.isDryRun) {
    console.log('is dry run = true');
  }
} catch (error) {
  core.setFailed(error.message);
}

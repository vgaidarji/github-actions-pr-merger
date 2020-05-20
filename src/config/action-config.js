
class ActionConfig {
  constructor(core) {
    this.isDryRun = core.getInput('dry-run') === 'true';
  }
}

module.exports = ActionConfig;

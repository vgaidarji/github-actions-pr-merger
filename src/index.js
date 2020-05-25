const core = require('@actions/core');
const github = require('@actions/github');

const ActionConfig = require('./config/action-config');

try {
  console.log(`payload: ${JSON.stringify(github.context.payload)}`);

  if (github.event_name === 'issue_comment' &&
      github.event.action == 'created') {
    console.log(`comment: ${github.event.comment.body}`);
  }

  const actionConfig = new ActionConfig(core);
  if (actionConfig.isDryRun) {
    console.log(`is dry run = ${actionConfig.isDryRun}`);
  }
} catch (error) {
  core.setFailed(error.message);
}

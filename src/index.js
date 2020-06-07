const core = require('@actions/core');
const github = require('@actions/github');
const ActionConfig = require('./config/action-config');

const octokit = new Octokit();

try {
  const githubPayload = github.context.payload;
  console.log(`payload: ${JSON.stringify(github.context.payload)}`);

  if (github.event_name === 'issue_comment' &&
      github.event.action == 'created') {
    console.log(`comment: ${github.event.comment.body}`);
  }

  const actionConfig = new ActionConfig(core);
  if (actionConfig.isDryRun) {
    console.log(`is dry run = ${actionConfig.isDryRun}`);
    const {owner, repo, number} = githubPayload.issue;
    const comment = async () => {
      const {data: comment} = await octokit.issues.createComment({
        owner: owner,
        repo: repo,
        issue_number: number,
        body: 'dry-run test merge commit message',
      });
      return comment;
    };
    core.info(`Created comment id '${comment.id}' on issue '${githubPayload.issue.id}'.`);
  }
} catch (error) {
  core.setFailed(error.message);
}

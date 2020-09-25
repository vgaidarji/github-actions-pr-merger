const core = require('@actions/core');
const github = require('@actions/github');
const ActionConfig = require('./config/action-config');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);

try {
  console.log(`payload: ${JSON.stringify(githubContext.payload)}`);

  if (github.event_name === 'issue_comment' &&
      github.event.action == 'created') {
    console.log(`comment: ${github.event.comment.body}`);
  }

  const actionConfig = new ActionConfig(core);
  if (actionConfig.isDryRun) {
    console.log(`is dry run = ${actionConfig.isDryRun}`);
    const owner = githubContext.payload.repository.owner.login;
    const repo = githubContext.payload.repository.name;
    const number = githubContext.payload.pull_request.number;
    const comment = async () => {
      const {data: comment} = await octokit.issues.createComment({
        owner: owner,
        repo: repo,
        issue_number: number,
        body: 'dry-run test merge commit message',
      });
      return comment;
    };
    core.info(`Created comment id '${comment}' on issue '${number}'.`);
  }
} catch (error) {
  core.setFailed(error.message);
}

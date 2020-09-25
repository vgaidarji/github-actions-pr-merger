const core = require('@actions/core');
const github = require('@actions/github');
const ActionConfig = require('./config/action-config');
const PullRequest = require('./github/pull-request');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);

try {
  const pullRequest = new PullRequest(githubContext.payload);
  console.log(`payload: ${JSON.stringify(githubContext.payload)}`);

  if (github.event_name === 'issue_comment' &&
      github.event.action == 'created') {
    console.log(`comment: ${github.event.comment.body}`);
  }

  const actionConfig = new ActionConfig(core);
  if (actionConfig.isDryRun) {
    console.log(`is dry run = ${actionConfig.isDryRun}`);
    const postComment = async () => {
      const {data: comment} = await octokit.issues.createComment({
        owner: pullRequest.owner,
        repo: pullRequest.repo,
        issue_number: pullRequest.number,
        body: 'dry-run test merge commit message',
      });
      console.log(`Created comment '${comment.body}' on issue '${pullRequest.number}'.`);
      return comment;
    };
    postComment();
  }
} catch (error) {
  core.setFailed(error.message);
}

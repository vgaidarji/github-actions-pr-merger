const core = require('@actions/core');
const github = require('@actions/github');
const ActionConfig = require('./config/action-config');
const PullRequest = require('./github/pull-request');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);

try {
  console.log(`payload: ${JSON.stringify(githubContext.payload)}`);

  const isComment = 'comment' in githubContext.payload;
  const isPullRequest = 'pull_request' in githubContext.payload;

  if (isComment && githubContext.payload.action == 'created') {
    console.log(`comment: ${githubContext.payload.comment.body}`);
  }

  const actionConfig = new ActionConfig(core);
  if (actionConfig.isDryRun) {
    console.log(`is dry run = ${actionConfig.isDryRun}`);
    if (isPullRequest) {
      const pullRequest = new PullRequest(githubContext.payload);
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
    } else if (isComment) {
      // pull request properties (owner, repo, number) should be extracted differently
    }
  }
} catch (error) {
  core.setFailed(error.message);
}

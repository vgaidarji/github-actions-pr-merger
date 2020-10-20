const core = require('@actions/core');
const github = require('@actions/github');
const PullRequest = require('./github/pull-request');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);

const ROBIN_COMMAND = '/Robin';
const HAS_DRY_RUN_FLAG = '--dry-run';

// on PR
// on comment with command `/Robin squash-merge` or `/Robin rebase-merge`
// check mergeability & return early otherwise
// check all PR checks are passing & return early otherwise
// get list of commits
// get approvers list
// use PR title as 1 line
// find Jira ticket ID from PR description
// use template file to form final merge commit message
// perform merge
// remove source branch

try {
  console.log(`payload: ${JSON.stringify(githubContext.payload)}`);

  const isComment = 'comment' in githubContext.payload;
  // TODO: extract pull_request from 'issue' property from comment payload
  const isPullRequest = 'pull_request' in githubContext.payload;
  const isCommentCreatedAction = isComment && githubContext.payload.action == 'created';

  if (isCommentCreatedAction) {
    const commentBody = githubContext.payload.comment.body;
    // TODO: extract into a func with proper format check and not only for robin keyword
    const isTriggeredViaRobinCommand = commentBody.includes(ROBIN_COMMAND);
    const isDryRunMode = commentBody.includes(HAS_DRY_RUN_FLAG);
    console.log(`comment: ${commentBody}`);

    if (isTriggeredViaRobinCommand) {
      console.log(`Triggered via ${ROBIN_COMMAND} command.`);
      console.log(`is dry run = ${isDryRunMode}`);

      if (isPullRequest && isDryRunMode) {
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
      }
    } else {
      console.log(
          `Robin helps only when he has been explicitly asked via \`/Robin\` command.
          See https://github.com/vgaidarji/github-actions-pr-merger/tree/master#usage.`);
      return;
    }
  }
} catch (error) {
  core.setFailed(error.message);
}

const core = require('@actions/core');
const github = require('@actions/github');
const PullRequest = require('./github/pull-request');
const StatusCheck = require('./github/status-check');
const RobinCommand = require('./robin/robin-command');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);
const statusCheck = new StatusCheck();

// on PR
// on comment with command `/robin squash-merge` or `/robin rebase-merge`
// check mergeability & return early otherwise
// check all PR checks are passing & return early otherwise
// get list of commits
// get approvers list
// use PR title as 1 line
// find Jira ticket ID from PR description
// use template file to form final merge commit message
// perform merge
// remove source branch

const main = async () => {
  try {
    statusCheck.update('in_progress');
    console.groupCollapsed('GitHub event payload ' + '\u21B5');
    console.log(`${JSON.stringify(githubContext.payload)}`);
    console.groupEnd();

    const isComment = 'comment' in githubContext.payload;
    // TODO: extract pull_request from 'issue' property from comment payload
    const isPullRequest = 'pull_request' in githubContext.payload;
    const isCommentCreatedAction = isComment && githubContext.payload.action == 'created';

    if (isCommentCreatedAction) {
      const commentBody = githubContext.payload.comment.body;
      const robinCommand = new RobinCommand(commentBody);
      console.log(`comment: ${commentBody}`);

      if (robinCommand.isRobinCommand()) {
        if (isPullRequest && robinCommand.isDryRunMode()) {
          const pullRequest = new PullRequest(githubContext.payload);
          const {data: comment} = await octokit.issues.createComment({
            owner: pullRequest.owner,
            repo: pullRequest.repo,
            issue_number: pullRequest.number,
            body: 'dry-run test merge commit message',
          });
          console.log(`Created comment '${comment.body}' on issue '${pullRequest.number}'.`);
          postComment();
        }
      } else {
        console.log(
            `Robin helps only when he has been explicitly asked via \`/robin\` command.
            See https://github.com/vgaidarji/github-actions-pr-merger/tree/master#usage`);
        return;
      }
    }
    statusCheck.update('completed', 'success');
  } catch (error) {
    core.setFailed(error.message);
    statusCheck.update('completed', 'failure');
  }
};

main();

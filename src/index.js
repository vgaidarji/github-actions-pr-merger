const core = require('@actions/core');
const github = require('@actions/github');
const PullRequest = require('./github/pull-request');
const RobinCommand = require('./robin/robin-command');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);

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
    console.log(`GitHub payload ${JSON.stringify(githubContext.payload)}`);

    const isComment = 'comment' in githubContext.payload;
    const isCommentCreatedAction = isComment && githubContext.payload.action == 'created';

    if (isCommentCreatedAction) {
      const isPullRequest = 'pull_request' in githubContext.payload.issue;
      if (!isPullRequest) {
        core.setFailed('Not a comment on PR. Nothing to merge here.');
        return;
      }

      const commentBody = githubContext.payload.comment.body;
      const robinCommand = new RobinCommand(commentBody);
      console.log(`comment: ${commentBody}`);

      if (robinCommand.isRobinCommand()) {
        if (robinCommand.isDryRunMode()) {
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
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();

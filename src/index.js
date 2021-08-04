const core = require('@actions/core');
const github = require('@actions/github');
const MergeMethod = require('./github/merge-method');
const PullRequest = require('./github/pull-request');
const RobinCommand = require('./robin/robin-command');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);

// ✓ on PR
// ✓ on comment with command `/robin merge` | `/robin squash-merge` | `/robin rebase-merge`
// check mergeability & return early otherwise
// check all PR checks are passing & return early otherwise
// get list of commits
// get approvers list
// use PR title as 1 line
// find Jira ticket ID from PR description
// use template file to form final merge commit message
// ✓ perform merge
// remove source branch

/**
 * Identifies whether comment created action triggered this action.
 * @return {boolean} True when triggered for comment 'created' action, false - otherwise
 */
function isCommentCreated() {
  return 'comment' in githubContext.payload && githubContext.payload.action == 'created';
};

function isPullRequest() {
  return 'pull_request' in githubContext.payload.issue;
};

function printCollapsibleConsoleMessage(title, message) {
  core.startGroup(title);
  core.info(message);
  core.endGroup();
}

/**
 * Prints GitHub event payload JSON to console to provide additional debug info.
 */
function printGitHubPayload() {
  printCollapsibleConsoleMessage('GitHub payload', `${JSON.stringify(githubContext.payload)}`);
};

const fetchFullPullRequestObject = async () => {
  // issue comment payload contains some info about PR but not full (no head/base commits, etc.)
  const issueCommentPayload = githubContext.payload;
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#get-a-pull-request
  const {data: pullRequestResponse} = await octokit.pulls.get({
    owner: issueCommentPayload.repository.owner.login,
    repo: issueCommentPayload.repository.name,
    pull_number: issueCommentPayload.issue.number,
  }).catch((e) => {
    console.log('Failed to fetch pull request object: ' + e.message);
  });
  printCollapsibleConsoleMessage('PullRequest response', `${JSON.stringify(pullRequestResponse)}`);
  const pullRequest = new PullRequest(pullRequestResponse);
  console.log('PullRequest object: ' + `${JSON.stringify(pullRequest)}`);
  return pullRequest;
};

/**
 * Performs dry-run merge and posts a result comment on PR.
 * @param {PullRequest} pullRequest - Pull Request object
 */
const performDryRunMerge = async (pullRequest) => {
  console.log('Performing dry run merge.');

  const commits = '';

  // TODO hook in real mergeability check
  const dryRunMessage = `
  ### Mergeability
  Can merge ✅

  ### Commits

  \`\`\`
  ${commits}
  \`\`\`
  `;

  await octokit.issues.createComment({
    owner: pullRequest.owner,
    repo: pullRequest.repo,
    issue_number: pullRequest.number,
    body: dryRunMessage,
  }).then((response) => {
    console.log(`Created comment '${response.data.body}' on issue '${pullRequest.number}'.`);
  }).catch((e) => {
    console.log('Failed to post a comment on pull request: ' + e.message);
  });
};

const performMerge = async (pullRequest) => {
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#merge-a-pull-request
  core.startGroup('See below the Pull Request being merged');
  core.info(`${JSON.stringify(pullRequest)}`);
  core.endGroup();
  await octokit.pulls.merge({
    owner: pullRequest.owner,
    repo: pullRequest.repo,
    pull_number: pullRequest.number,
    commit_title: pullRequest.title,
    // Pass merge method from robin command
    merge_method: MergeMethod.MERGE,
  }).then(() => {
    console.log(`Merge succeeded.`);
  }).catch((e) => {
    console.log('Failed to perform merge operation: ' + e.message);
  });
};

function mergePullRequest(pullRequest, commentBody) {
  const robinCommand = new RobinCommand(commentBody);
  if (robinCommand.isDryRunMode()) {
    performDryRunMerge(pullRequest);
  } else {
    performMerge(pullRequest);
  }
};

function main() {
  try {
    const commentBody = githubContext.payload.comment.body;
    console.log(`PullRequest comment: ${commentBody}`);
    printGitHubPayload();
    fetchFullPullRequestObject().then((pullRequest) => {
      if (isCommentCreated()) {
        if (!isPullRequest()) {
          core.setFailed('Not a comment on PR. Nothing to merge here.');
          return;
        }
        const robinCommand = new RobinCommand(commentBody);
        if (!robinCommand.isRobinCommand()) {
          console.log(
              `Robin helps only when he has been explicitly asked via \`/robin\` command.
              See https://github.com/vgaidarji/github-actions-pr-merger/tree/master#usage`);
          return;
        }
        mergePullRequest(pullRequest, commentBody);
      }
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();

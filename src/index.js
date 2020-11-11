const core = require('@actions/core');
const github = require('@actions/github');
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
// perform merge
// remove source branch

/**
 * Identifies whether comment created action triggered this action.
 * @return {boolean} True when triggered for comment 'created' action, false - otherwise
 */
function isCommentCreated() {
  return 'comment' in githubContext.payload && githubContext.payload.action == 'created';
};

/**
 * Prints GitHub event payload JSON to console to provide additional debug info.
 */
function printGitHubPayload() {
  core.startGroup('GitHub payload');
  core.info(`${JSON.stringify(githubContext.payload)}`);
  core.endGroup();
};

const fetchFullPullRequestObject = async () => {
  // issue comment payload contains some info about PR but not full (no head/base commits, etc.)
  const issueCommentPayload = githubContext.payload;
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/pulls#get-a-pull-request
  const {data: currentPullRequest} = await octokit.pulls.get({
    owner: issueCommentPayload.repository.owner.login,
    repo: issueCommentPayload.repository.name,
    pull_number: issueCommentPayload.issue.number,
  }).catch((e) => {
    console.log(e.message);
    return failureOutput;
  });
  console.log(currentPullRequest);
  return currentPullRequest;
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

  const {data: comment} = await octokit.issues.createComment({
    owner: pullRequestFromPayload.owner,
    repo: pullRequestFromPayload.repo,
    issue_number: pullRequestFromPayload.number,
    body: dryRunMessage,
  });
  console.log(`Created comment '${comment.body}' on issue '${pullRequestFromPayload.number}'.`);
};

const performMerge = async (pullRequest) => {
  console.log(`Merge succeeded.`);
};

const main = async () => {
  try {
    printGitHubPayload();
    const pullRequest = fetchFullPullRequestObject();
    if (isCommentCreated()) {
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
          performDryRunMerge(pullRequest);
          return;
        } else {
          performMerge(pullRequest);
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

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

  // TODO perform local merge and print all commits

  // const currentBranch = '';
  // const mergeResult = executeShellCommand(`git merge ${currentBranch} --no-ff`);
  // console.log(mergeResult);
  // const commits = executeShellCommand('git log--oneline 39bdc7614...HEAD | cat $1');
  const commits = '';

  // TODO print diff of changes after local merge
  const fileChanges = `
  git diff 39bdc7614...4a577c943 --oneline | cat $1
  diff--git a / b b / b
  new file mode 100644
  index 000000000..e69de29bb
  diff--git a / t b / t
  new file mode 100644
  index 000000000..f0eec86f6
  --- /dev/null
  +++ b / t
  @@ -0, 0 + 1 @@
  +some content
  `;

  // TODO hook in real mergeability check
  const mergeMessage = `
  ### Mergeability
  Can merge ✅

  ### Commits

  \`\`\`
  ${commits}
  \`\`\`

  ### File changes

  <details>
  <summary>Show changes</summary>

  \`\`\`
  ${fileChanges}
  \`\`\`
  </details>
  `;

  const {data: comment} = await octokit.issues.createComment({
    owner: pullRequestFromPayload.owner,
    repo: pullRequestFromPayload.repo,
    issue_number: pullRequestFromPayload.number,
    body: mergeMessage,
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

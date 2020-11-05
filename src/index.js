const core = require('@actions/core');
const github = require('@actions/github');
const PullRequest = require('./github/pull-request');
const RobinCommand = require('./robin/robin-command');

const {GITHUB_TOKEN} = process.env;
const {context: githubContext} = github;

const octokit = github.getOctokit(GITHUB_TOKEN);
const pullRequest = new PullRequest(githubContext.payload);

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

// async function executeShellCommand(command) {
//   let output = '';
//   let error = '';

//   const options = {};
//   options.listeners = {
//     stdout: (data) => {
//       output += data.toString();
//     },
//     stderr: (data) => {
//       error += data.toString();
//     },
//   };

//   await exec.exec(command, options);
//   core.setFailed(error);
//   return output;
// };

/**
 * Performs dry-run merge and posts a result comment on PR.
 */
const performDryRunMerge = async () => {
  console.log('Performing dry run merge.');

  // TODO perform local merge and print all commits
  const currentPullRequest = octokit.pulls.get(pullRequest.number);
  console.log(currentPullRequest);

  // const currentBranch = '';
  // const mergeResult = executeShellCommand(`git merge ${currentBranch} --no-ff`);
  // console.log(mergeResult);
  // const commits = executeShellCommand('git log--oneline 39bdc7614...HEAD | cat $1');


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
    owner: pullRequest.owner,
    repo: pullRequest.repo,
    issue_number: pullRequest.number,
    body: mergeMessage,
  });
  console.log(`Created comment '${comment.body}' on issue '${pullRequest.number}'.`);
};

const performMerge = async () => {
  console.log(`Merge succeeded.`);
};

const main = async () => {
  try {
    printGitHubPayload();
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
          performDryRunMerge();
          return;
        } else {
          performMerge();
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

const core = require('@actions/core');
const github = require('@actions/github');
const PullRequest = require('./pull-request');

const {GITHUB_TOKEN} = process.env;
const {GITHUB_SHA} = process.env;
const {context: githubContext} = github;
const octokit = github.getOctokit(GITHUB_TOKEN);
const pullRequest = new PullRequest(githubContext.payload);
// https://developer.github.com/v3/repos/statuses/
class CommitStatus {
  setStatus(stateOfStatus) {
    try {
      const commitStatus = async () => {
        octokit.repos.createCommitStatus({
          context: 'Robin',
          description: 'merge status',
          owner: pullRequest.owner,
          repo: pullRequest.repo,
          sha: GITHUB_SHA,
          state: stateOfStatus, //  pending, success, failure, error
          target_url: 'https://www.google.com',
        });
      };
      commitStatus();
    } catch (error) {
      core.setFailed(error.message);
    }
  }
}

CommitStatus.STATE = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILURE: 'failure',
};

module.exports = CommitStatus;

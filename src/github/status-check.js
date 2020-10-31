const core = require('@actions/core');
const github = require('@actions/github');

const {GITHUB_TOKEN} = process.env;
const {GITHUB_SHA} = process.env;
const {context: githubContext} = github;
const octokit = github.getOctokit(GITHUB_TOKEN);
class StatusCheck {
  update(status, conclusion = null) {
    try {
      const pullRequest = new PullRequest(githubContext.payload);
      // https://developer.github.com/v3/checks/runs/#create-a-check-run
      const createCheck = async () => {
        octokit.checks.create({
          owner: pullRequest.owner,
          repo: pullRequest.repo,
          name: 'Robin command status',
          head_sha: GITHUB_SHA,
          status: status, // queued, in_progress, or completed. Default: queued
          conclusion: conclusion, // success, failure, ...
          details_url: 'https://www.google.com',
        });
      };
      createCheck();
    } catch (error) {
      core.setFailed(error.message);
    }
  }
}

module.exports = StatusCheck;

const core = require('@actions/core');
const github = require('@actions/github');
const PullRequest = require('./pull-request');

const {GITHUB_TOKEN} = process.env;
const {GITHUB_SHA} = process.env;
const {context: githubContext} = github;
const octokit = github.getOctokit(GITHUB_TOKEN);
const pullRequest = new PullRequest(githubContext.payload);
// https://developer.github.com/v3/checks/runs/#create-a-check-run
class StatusCheck {
  setInProgress() {
    try {
      const createCheck = async () => {
        octokit.checks.create({
          owner: pullRequest.owner,
          repo: pullRequest.repo,
          name: 'Robin command status',
          head_sha: GITHUB_SHA,
          status: 'in_progress',
          details_url: 'https://www.google.com',
        });
      };
      createCheck();
    } catch (error) {
      core.setFailed(error.message);
    }
  }

  setConclusion(conclusion) {
    try {
      const createCheck = async () => {
        octokit.checks.create({
          owner: pullRequest.owner,
          repo: pullRequest.repo,
          name: 'Robin command status',
          head_sha: GITHUB_SHA,
          // Providing conclusion will automatically set the status parameter to completed
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

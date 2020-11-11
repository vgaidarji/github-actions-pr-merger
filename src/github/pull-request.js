class PullRequest {
  constructor(pullRequestPayload) {
    this.owner = pullRequestPayload.head.repo.owner.login;
    this.repo = pullRequestPayload.head.repo.name;
    this.number = pullRequestPayload.number;
  }
}

module.exports = PullRequest;

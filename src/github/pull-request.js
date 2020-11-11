class PullRequest {
  constructor(pullRequestPayload) {
    this.owner = pullRequestPayload.head.repo.owner.login;
    this.repo = pullRequestPayload.head.repo.name;
    this.number = pullRequestPayload.number;
    this.title = pullRequestPayload.title;
  }
}

module.exports = PullRequest;

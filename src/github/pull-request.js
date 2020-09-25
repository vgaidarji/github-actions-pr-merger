class PullRequest {
  constructor(payload) {
    this.owner = payload.repository.owner.login;
    this.number = payload.pull_request.number;
    this.repo = payload.repository.name;
  }
}
module.exports = PullRequest;

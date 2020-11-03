class PullRequest {
  constructor(issueCommentPayload) {
    this.owner = issueCommentPayload.repository.owner.login;
    this.number = issueCommentPayload.issue.number;
    this.repo = issueCommentPayload.repository.name;
  }
}

module.exports = PullRequest;

class RobinCommand {
  constructor(commentBody) {
    this.commentBody = commentBody;
  }

  /**
   * Performs case-insensitve search for robin command in commendy body
   * /robin + <command> + <flags>
   *
   * @return {boolean} True when comment contains robin command, false - otherwise
   */
  isRobinCommand() {
    const robinCommands = `/robin`
        .concat(` (merge|squash-merge|rebase-merge)`)
        .concat(`( --dry-run)?`);
    return new RegExp(robinCommands, 'i').test(this.commentBody);
  }

  isDryRunMode() {
    return new RegExp('--dry-run', 'i').test(this.commentBody);
  }
}

module.exports = RobinCommand;

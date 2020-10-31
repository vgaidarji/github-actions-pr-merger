const ROBIN_COMMAND = '/robin';
const HAS_DRY_RUN_FLAG = '--dry-run';

class RobinCommand {
  constructor(commentBody) {
    this.commentBody = commentBody;
  }

  isRobinCommand() {
    return commentBody.toLowerCase().includes(ROBIN_COMMAND.toLowerCase());
  }

  isDryRunMode() {
    return commentBody.includes(HAS_DRY_RUN_FLAG);
  }
}
module.exports = RobinCommand;

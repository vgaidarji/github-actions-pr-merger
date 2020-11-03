const RobinCommand = require('../../src/robin/robin-command');

test('identifies merge command', () => {
  expect(new RobinCommand('/robin merge').isRobinCommand()).toBe(true);
});

test('identifies squash-merge command', () => {
  expect(new RobinCommand('/robin squash-merge').isRobinCommand()).toBe(true);
});

test('identifies rebase-merge command', () => {
  expect(new RobinCommand('/robin rebase-merge').isRobinCommand()).toBe(true);
});

test('identifies merge command ingoring the case', () => {
  expect(new RobinCommand('/Robin merGE').isRobinCommand()).toBe(true);
});

test('identifies merge command with --dry-run flag', () => {
  expect(new RobinCommand('/robin merge --dry-run').isRobinCommand()).toBe(true);
});

test('doesn\'t identify merge command without leading slash (\/)', () => {
  expect(new RobinCommand('robin merge').isRobinCommand()).toBe(false);
});

test('doesn\'t identify unknown command', () => {
  expect(new RobinCommand('/robin no-such-command').isRobinCommand()).toBe(false);
});

test('doesn\'t identify correct command at wrong position', () => {
  expect(new RobinCommand('/robin some-other-text merge').isRobinCommand()).toBe(false);
});

test('doesn\'t identify correct command with dry-run flag at wrong position', () => {
  expect(new RobinCommand('/robin --dry-run merge').isRobinCommand()).toBe(false);
});

test('doesn\'t identify command from empty message', () => {
  expect(new RobinCommand('').isRobinCommand()).toBe(false);
});

test('finds dry-run flag', () => {
  expect(new RobinCommand('/robin merge --dry-run').isDryRunMode()).toBe(true);
});

test('doesn\'t find dry-run flag when not passed', () => {
  expect(new RobinCommand('/robin merge').isDryRunMode()).toBe(false);
});

import yargs from './index.js';

describe('yargs import test', function () {
  it('can import the module', function () {
    expect(yargs).toBeInstanceOf(Object);
  });
});

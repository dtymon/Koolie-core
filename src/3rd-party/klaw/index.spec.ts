import klaw from './index.js';

describe('klaw import test', function () {
  it('can import the module', function () {
    expect(klaw).toBeInstanceOf(Function);
  });
});

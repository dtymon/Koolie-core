import { read, write } from './index.js';

describe('fs-extra import test', function () {
  it('can import the module', function () {
    expect(read).toBeInstanceOf(Function);
    expect(write).toBeInstanceOf(Function);
  });
});

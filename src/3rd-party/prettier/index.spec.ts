import { format } from './index.js';

describe('prettier import test', function () {
  it('can import the module', function () {
    expect(format).toBeInstanceOf(Function);
  });
});

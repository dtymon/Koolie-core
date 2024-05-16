import { parse, format } from './index.js';

describe('bson import test', function () {
  it('can import classes from the module', function () {
    expect(parse).toBeInstanceOf(Function);
    expect(format).toBeInstanceOf(Function);
  });
});

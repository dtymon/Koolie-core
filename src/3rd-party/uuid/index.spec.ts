import { v4 as uuidv4, v5 as uuidv5 } from './index.js';

describe('uuid import test', function () {
  it('can import the module', function () {
    expect(uuidv4).toBeInstanceOf(Function);
    expect(uuidv5).toBeInstanceOf(Function);
  });
});

import { ObjectId } from './index.js';

describe('bson import test', function () {
  it('can import classes from the module', function () {
    expect(ObjectId).toBeInstanceOf(Function);
  });
});

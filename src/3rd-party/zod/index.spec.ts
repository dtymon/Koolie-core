import { z } from './index.js';

describe('zod import test', function () {
  it('can import the module', function () {
    expect(z).toBeDefined();
    expect(z.boolean).toBeInstanceOf(Function);
    expect(z.number).toBeInstanceOf(Function);
    expect(z.string).toBeInstanceOf(Function);
  });
});

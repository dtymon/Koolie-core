import { Chalk, colorNames, backgroundColorNames, foregroundColorNames, modifierNames } from './index.js';

describe('chalk import test', function () {
  it('can import the module', function () {
    expect(Chalk).toBeInstanceOf(Function);
    expect(colorNames).toBeInstanceOf(Array);
    expect(backgroundColorNames).toBeInstanceOf(Array);
    expect(foregroundColorNames).toBeInstanceOf(Array);
    expect(modifierNames).toBeInstanceOf(Array);
  });
});

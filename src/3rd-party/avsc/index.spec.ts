import avsc from 'avsc';
const { Service, Type, parse } = avsc;

describe('avsc import test', function () {
  it('can import classes from the module', function () {
    expect(Service).toBeInstanceOf(Function);
    expect(Type).toBeInstanceOf(Function);
    expect(parse).toBeInstanceOf(Function);
  });
});

import { PromiseExtended } from '../PromiseExtended.js';

describe('PromiseExtended Test', function () {
  it('can be resolved', async function () {
    const promise = new PromiseExtended<number>((_resolve, _reject) => {
      // no-op
    });

    promise.resolve(42);
    const result = await promise;
    expect(result).toBe(42);
  });

  it('can be rejected', async function () {
    const promise = new PromiseExtended<number>((_resolve, _reject) => {
      // no-op
    });

    promise.reject(new Error('Boom'));
    await expect(promise).rejects.toThrow(/Boom/);
  });

  it('will not reject after being resolved', async function () {
    const promise = new PromiseExtended<number>((_resolve, _reject) => {
      // no-op
    });

    promise.resolve(42);
    promise.reject(new Error('Boom'));

    try {
      const result = await promise;
      expect(result).toBe(42);
    } catch (err) {
      fail(`Unexpected exception caught: ${err}`);
    }
  });

  it('will not resolve after being rejected', async function () {
    const promise = new PromiseExtended<number>((_resolve, _reject) => {
      // no-op
    });

    promise.reject(new Error('Boom'));
    promise.resolve(42);

    try {
      const result = await promise;
      fail(`Expected exception to be thrown but got back ${result}`);
    } catch (err: any) {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/Boom/);
    }
  });
});

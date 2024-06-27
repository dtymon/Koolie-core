import { ResolvablePromise, PromiseSettler } from '../PromiseTypes.js';

describe('PromiseTypes Test', function () {
  describe('ResolvablePromise Test', function () {
    it('can be resolved', async function () {
      const promise = new ResolvablePromise<number>((_resolve, _reject) => {
        // no-op
      });

      promise.resolve(42);
      const result = await promise;
      expect(result).toBe(42);
    });

    it('can be rejected', async function () {
      const promise = new ResolvablePromise<number>((_resolve, _reject) => {
        // no-op
      });

      promise.reject(new Error('Boom'));
      await expect(promise).rejects.toThrow(/Boom/);
    });

    it('will not reject after being resolved', async function () {
      const promise = new ResolvablePromise<number>((_resolve, _reject) => {
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
      const promise = new ResolvablePromise<number>((_resolve, _reject) => {
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

  describe('PromiseSettler tests', function () {
    it('can handle a promise being resolved', async function () {
      const result = await new Promise<string>((resolve, reject) => {
        const settler = new PromiseSettler(resolve, reject);

        expect(settler.hasBeenSettled()).toEqual(false);
        expect(settler.hasBeenResolved()).toEqual(false);
        expect(settler.hasBeenRejected()).toEqual(false);

        settler.resolve('good');

        expect(settler.hasBeenSettled()).toEqual(true);
        expect(settler.hasBeenResolved()).toEqual(true);
        expect(settler.hasBeenRejected()).toEqual(false);
      });

      expect(result).toEqual('good');
    });

    it('can handle a promise being resolved more than once', async function () {
      const result = await new Promise<string>((resolve, reject) => {
        const settler = new PromiseSettler(resolve, reject);

        expect(settler.hasBeenSettled()).toEqual(false);
        expect(settler.hasBeenResolved()).toEqual(false);
        expect(settler.hasBeenRejected()).toEqual(false);

        settler.resolve('good');

        expect(settler.hasBeenSettled()).toEqual(true);
        expect(settler.hasBeenResolved()).toEqual(true);
        expect(settler.hasBeenRejected()).toEqual(false);

        settler.resolve('excellent');

        expect(settler.hasBeenSettled()).toEqual(true);
        expect(settler.hasBeenResolved()).toEqual(true);
        expect(settler.hasBeenRejected()).toEqual(false);
      });

      expect(result).toEqual('good');
    });

    it('can ignore a promise being rejected after being resolved', async function () {
      const result = await new Promise<string>((resolve, reject) => {
        const settler = new PromiseSettler(resolve, reject);

        expect(settler.hasBeenSettled()).toEqual(false);
        expect(settler.hasBeenResolved()).toEqual(false);
        expect(settler.hasBeenRejected()).toEqual(false);

        settler.resolve('good');

        expect(settler.hasBeenSettled()).toEqual(true);
        expect(settler.hasBeenResolved()).toEqual(true);
        expect(settler.hasBeenRejected()).toEqual(false);

        settler.reject(new Error('bad'));

        expect(settler.hasBeenSettled()).toEqual(true);
        expect(settler.hasBeenResolved()).toEqual(true);
        expect(settler.hasBeenRejected()).toEqual(false);
      });

      expect(result).toEqual('good');
    });

    it('can handle a promise being rejected', async function () {
      function runTest(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          const settler = new PromiseSettler(resolve, reject);

          expect(settler.hasBeenSettled()).toEqual(false);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(false);

          settler.reject(new Error('bad'));

          expect(settler.hasBeenSettled()).toEqual(true);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(true);
        });
      }

      await expect(runTest()).rejects.toThrow('bad');
    });

    it('can handle a promise being rejected more than once', async function () {
      function runTest(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          const settler = new PromiseSettler(resolve, reject);

          expect(settler.hasBeenSettled()).toEqual(false);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(false);

          settler.reject(new Error('bad'));

          expect(settler.hasBeenSettled()).toEqual(true);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(true);

          settler.reject(new Error('awful'));

          expect(settler.hasBeenSettled()).toEqual(true);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(true);
        });
      }

      await expect(runTest()).rejects.toThrow('bad');
    });

    it('can ignore a promise being resolved after being rejected', async function () {
      function runTest(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
          const settler = new PromiseSettler(resolve, reject);

          expect(settler.hasBeenSettled()).toEqual(false);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(false);

          settler.reject(new Error('bad'));

          expect(settler.hasBeenSettled()).toEqual(true);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(true);

          settler.resolve('good');

          expect(settler.hasBeenSettled()).toEqual(true);
          expect(settler.hasBeenResolved()).toEqual(false);
          expect(settler.hasBeenRejected()).toEqual(true);
        });
      }

      await expect(runTest()).rejects.toThrow('bad');
    });
  });
});

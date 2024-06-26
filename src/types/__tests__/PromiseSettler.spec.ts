import { PromiseSettler } from '../PromiseSettler.js';

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

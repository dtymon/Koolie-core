import { KoolieError, ConsequentialError } from '../KoolieError.js';
import type { ErrorContext } from '../KoolieError.js';

describe('KoolieError tests', function () {
  describe('Basic tests', function () {
    it('should construct an instance given just an error message', function () {
      const msg = 'this is bad';
      const err = new KoolieError(msg);
      expect(err.message).toEqual(msg);
      expect(err.context).toEqual({});
      expect(err instanceof KoolieError).toBeTruthy();
      expect(err.toJSON()).toEqual({ message: msg, context: {} });
    });

    it('should construct an instance given a message and context', function () {
      const msg = 'this is bad';
      const ctx: ErrorContext = { name: 'Fred', age: 21 };
      const err = new KoolieError(msg, ctx);
      expect(err.message).toEqual(msg);
      expect(err.context).toEqual(ctx);
      expect(err instanceof KoolieError).toBeTruthy();
      expect(err.toJSON()).toEqual({ message: msg, context: ctx });
    });
  });

  describe('Consequential errors', function () {
    it('should construct an instance from a simple error', function () {
      const rootCauseMsg = 'I was the cause of this';
      const err0 = new Error(rootCauseMsg);
      const msg = 'this is bad';
      const err1 = new ConsequentialError(err0, msg);
      expect(err1 instanceof ConsequentialError).toBeTruthy();
      expect(err1.message).toEqual(msg);
      expect(err1.context).toEqual(expect.objectContaining({ rootCause: err0 }));
    });

    it('should construct an instance from a Koolie error', function () {
      const rootCauseMsg = 'I was the cause of this';
      const err0 = new KoolieError(rootCauseMsg);
      const msg = 'this is bad';
      const err1 = new ConsequentialError(err0, msg);
      expect(err1 instanceof ConsequentialError).toBeTruthy();
      expect(err1.message).toEqual(msg);
      expect(err1.context).toEqual(expect.objectContaining({ rootCause: err0 }));
      expect(err1.getFullStack()).toEqual(expect.stringMatching(new RegExp(`${msg}(?:.|\r|\n)*${rootCauseMsg}`)));
    });

    it('should set root cause correctly when deeply nested', function () {
      const rootCauseMsg = 'I was the cause of this';
      const err0 = new KoolieError(rootCauseMsg, { code: 12345 });

      const err1Msg = 'I am error #1';
      const err2Msg = 'I am error #2';
      const err3Msg = 'I am error #3';

      const err1 = new ConsequentialError(err0, err1Msg);
      const err2 = new ConsequentialError(err1, err2Msg);
      const err3 = new ConsequentialError(err2, err3Msg);

      const msg = 'this is bad';
      const theError = new ConsequentialError(err3, msg);
      expect(theError instanceof ConsequentialError).toBeTruthy();
      expect(theError.message).toEqual(msg);
      expect(theError.context).toEqual(expect.objectContaining({ rootCause: err0 }));
      expect(theError.getFullStack()).toEqual(
        expect.stringMatching(
          new RegExp(
            `${msg}(?:.|\r|\n)*${err3Msg}(?:.|\r|\n)*${err2Msg}(?:.|\r|\n)*${err1Msg}(?:.|\r|\n)*${rootCauseMsg}`
          )
        )
      );
    });
  });
});

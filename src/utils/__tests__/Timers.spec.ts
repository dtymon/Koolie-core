import { StopWatch } from '../StopWatch.js';
import { Timers, TimerCancelledByUser, TimerPromise } from '../Timers.js';

/**
 * A custom jest matcher for comparing that two numbers are within a given
 * tolerance.
 */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithin(expected: number | bigint, epsilon: number): R;
    }
  }
}

expect.extend({
  /**
   * Given the actual and expected observed numbers, allow them to match if they
   * are within the given tolerance.
   *
   * @param actual - the actual value
   * @param expected - the expected value
   * @param epsilon - maximum tolerance allowed for their difference
   */
  toBeWithin(actual: number, expected: number, epsilon: number): jest.CustomMatcherResult {
    return {
      pass: Math.abs(actual - expected) <= epsilon,
      message: () =>
        `Difference between the observed value ${actual} and expected` +
        ` value ${expected} is greater than the tolerance of ${epsilon}`,
    };
  },
});

describe('Timers Tests', function () {
  describe('delay() Tests', function () {
    it('can perform a non-durable delay', async function () {
      const interval = 200; // ms
      const msecs = await StopWatch.timeAsync(() => Timers.delay(interval));
      expect(msecs).toBeWithin(interval, 20);
    });

    it('can perform a durable delay', async function () {
      const interval = 200; // ms
      const durable = true;
      const msecs = await StopWatch.timeAsync(() => Timers.delay(interval, durable));
      expect(msecs).toBeWithin(interval, 20);
    });

    it('can cancel a delay', async function () {
      // Start a long timer
      const interval = 2000; // ms
      const timer = Timers.delay(interval);

      // Wait a bit and then cancel the timer
      await Timers.delay(30);
      timer.cancel();

      // The timer should reject saying it was cancelled by the user
      await expect(timer).rejects.toThrow('Timer was cancelled by the user');
    });
  });

  describe('once() Tests', function () {
    it('can perform a once-off timer', async function () {
      const interval = 200; // ms
      let callCount = 0;

      const msecs = await StopWatch.timeAsync(async () => {
        await Timers.once(interval, () => ++callCount);
      });

      expect(callCount).toEqual(1);
      expect(msecs).toBeWithin(interval, 20);
    });

    it('can cancel a once-off timer', async function () {
      const interval = 200; // ms
      let callCount = 0;

      const timer = Timers.once(interval, () => ++callCount);
      expect(Timers.find(timer.timerId)).toBeDefined();

      // Wait a bit and then cancel the timer
      await Timers.delay(30);
      timer.cancel();

      await expect(timer).rejects.toThrow('Timer was cancelled by the user');
      expect(callCount).toEqual(0);
    });

    it('can handle a once-off timer throwing an exception', async function () {
      const interval = 50; // ms
      let callCount = 0;

      await expect(
        Timers.once(interval, () => {
          ++callCount;
          throw new Error('Boom');
        })
      ).rejects.toThrow('Boom');
      expect(callCount).toEqual(1);
    });
  });

  describe('immediate() Tests', function () {
    it('can perform an immediate call', async function () {
      let callCount = 0;

      await Timers.immediate(() => ++callCount);
      expect(callCount).toEqual(1);
    });

    it('can cancel an immediate call', async function () {
      let callCount = 0;

      const job = Timers.immediate(() => ++callCount);
      job.cancel();

      await expect(job).rejects.toThrow('Timer was cancelled by the user');
      expect(callCount).toEqual(0);
    });

    it('can handle an immediate call throwing an exception', async function () {
      let callCount = 0;

      await expect(
        Timers.immediate(() => {
          ++callCount;
          throw new Error('Boom');
        })
      ).rejects.toThrow('Boom');
      expect(callCount).toEqual(1);
    });
  });

  describe('periodic() Tests', function () {
    it('can perform a periodic timer', async function () {
      const interval = 400; // ms
      let callCount = 0;

      // Capture the trigger intervals in msecs
      const intervals: number[] = [];
      const start = Date.now();
      const timer = Timers.periodic(interval, () => {
        intervals.push(Date.now() - start);
        ++callCount;
      });

      // Wait before cancelling the periodic timer
      await Timers.delay(1500);
      timer.cancel();

      await expect(timer).rejects.toThrow('Timer was cancelled by the user');
      expect(callCount).toEqual(3);
      expect(intervals.length).toEqual(3);
      expect(intervals[0]).toBeWithin(400, 50);
      expect(intervals[1]).toBeWithin(800, 50);
      expect(intervals[2]).toBeWithin(1200, 50);
    });

    it('can accommodate long running async bodies', async function () {
      const interval = 400; // ms
      let callCount = 0;

      // Perform an additional delay in the body, making one iteration
      // approximately 600ms. However, this delay should be subtracted from the
      // interval thus still allowing three iterations in the max test time.
      const intervals: number[] = [];
      const start = Date.now();
      const timer = Timers.periodic(interval, async () => {
        intervals.push(Date.now() - start);
        ++callCount;
        await Timers.delay(200);
      });

      // Wait before cancelling the periodic timer
      await Timers.delay(1500);
      timer.cancel();

      await expect(timer).rejects.toThrow('Timer was cancelled by the user');
      expect(callCount).toEqual(3);
      expect(intervals.length).toEqual(3);
      expect(intervals[0]).toBeWithin(400, 50);
      expect(intervals[1]).toBeWithin(800, 50);
      expect(intervals[2]).toBeWithin(1200, 50);
    });

    it('can accommodate timer overrun', async function () {
      const interval = 400; // ms
      let callCount = 0;

      // Perform an additional delay in the body, making one iteration
      // approximately 900ms. This causes timer overrun since the first
      // iteration is not complete before the second one is due.
      //
      // This should mean it is only possible to get two iterations in:
      //
      //  (400ms) iteration 1: fires but runs until 900ms
      //  (800ms) missed: due to timer overrun
      //  (120ms) iteration 2: fires
      //
      const intervals: number[] = [];
      const start = Date.now();
      const timer = Timers.periodic(interval, async () => {
        intervals.push(Date.now() - start);
        ++callCount;
        await Timers.delay(500);
      });

      // Wait before cancelling the periodic timer
      await Timers.delay(1500);
      timer.cancel();

      await expect(timer).rejects.toThrow('Timer was cancelled by the user');
      expect(callCount).toEqual(2);
      expect(intervals.length).toEqual(2);
      expect(intervals[0]).toBeWithin(400, 50);
      expect(intervals[1]).toBeWithin(1200, 50);
    });

    it('can handle a body cancelling a periodic timer', async function () {
      const interval = 400; // ms
      let callCount = 0;

      const intervals: number[] = [];
      const start = Date.now();
      const timer = Timers.periodic(interval, () => {
        intervals.push(Date.now() - start);
        ++callCount;
        if (callCount > 1) {
          throw new TimerCancelledByUser();
        }
      });

      await expect(timer).rejects.toThrow('Timer was cancelled by the user');
      expect(callCount).toEqual(2);
      expect(intervals.length).toEqual(2);
      expect(intervals[0]).toBeWithin(400, 50);
      expect(intervals[1]).toBeWithin(800, 50);
    });
  });

  describe('cancel() Tests', function () {
    it('can handle cancelling an undefined timer', async function () {
      expect(() => Timers.cancel(undefined)).not.toThrow();
    });
  });

  describe('cancelAll() Tests', function () {
    it('can cancel all jobs', async function () {
      const interval = 200; // ms
      const numTimers = 5;

      const callCount: number[] = [];
      const timers: TimerPromise[] = [];
      for (let idx = 0; idx < numTimers; ++idx) {
        callCount.push(0);
        timers.push(
          Timers.once(interval, () => {
            callCount[idx] = 1;
          })
        );
      }

      // Wait a bit and then cancel all timers
      await Timers.delay(30);
      Timers.cancelAll();

      for (let idx = 0; idx < numTimers; ++idx) {
        await expect(timers[idx]).rejects.toThrow('Timer was cancelled by the user');
        expect(callCount[idx]).toEqual(0);
      }
    });
  });
});

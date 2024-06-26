import { Semaphore } from '../Semaphore.js';

describe('Semaphore tests', function () {
  const steps: string[] = [];

  beforeEach(function () {
    steps.length = 0;
    steps.push('start');
  });

  /**
   * Increments the semaphore by a given amount after introducing a small delay.
   *
   * @param step - the name of this step
   * @param sem - the semaphore
   * @param amount - the amount to increment the semaphore by
   * @param delay - number of msecs to wait before producing
   * @returns the name of the step
   */
  async function produce(step: string, sem: Semaphore, amount: number, delay = 50): Promise<string> {
    return new Promise<string>((resolve, _reject) => {
      setTimeout(() => {
        steps.push(step);
        sem.signal(amount);
        resolve(step);
      }, delay);
    });
  }

  /**
   * Decrements the semaphore by a given amount, waiting if required until there
   * is enough capacity in the semaphore.
   *
   * @param step - the name of this step
   * @param sem - the semaphore
   * @param amount - the amount to decrement the semaphore by
   * @param timeout - max msecs to wait before timing out
   * @returns the name of the step
   */
  async function consume(step: string, sem: Semaphore, amount: number, timeout = 2000): Promise<string> {
    let timerId: NodeJS.Timeout | undefined;
    const timer = new Promise((_resolve, reject) => {
      timerId = setTimeout(() => reject(new Error(`Step ${step} timed out after ${timeout} msecs`)), timeout);
    });

    try {
      await Promise.race([sem.wait(amount), timer]);
    } catch (err) {
      throw err;
    } finally {
      clearTimeout(timerId);
    }

    steps.push(step);
    return step;
  }

  /**
   * Introduce an unrelated step into the async test that is executed on the
   * next event loop iteration.
   *
   * @param step - the name of this step
   * @returns the name of the step
   */
  function unrelated(step: string): Promise<string> {
    return new Promise<string>((resolve, _reject) => {
      setTimeout(() => {
        steps.push(step);
        resolve(step);
      }, 0);
    });
  }

  it('has the correct default value when created', async function () {
    const sem = new Semaphore();
    expect(sem.getValue()).toEqual(0);
  });

  it('allows initial value to be specified', async function () {
    const sem = new Semaphore(123);
    expect(sem.getValue()).toEqual(123);
    expect(sem.getNumWaiters()).toEqual(0);
  });

  it('will not block when there is sufficient capacity', async function () {
    const sem = new Semaphore(10);
    const amount = 2;

    // Should not block because there is enough capacity. Moreover the function
    // should be executed synchronously.
    // prettier-ignore
    await expect(Promise.all([
      consume('consumer-1', sem, amount),
      unrelated('other'),
    ])).resolves.toBeDefined();

    // The consumer job should have completed before the other job
    expect(steps).toEqual(['start', 'consumer-1', 'other']);
    expect(sem.getValue()).toEqual(8);
  });

  it('will block if not enough capacity', async function () {
    const sem = new Semaphore(10);
    const amount = 15;

    // Should block since there is not enough capacity initially
    // prettier-ignore
    await expect(
      Promise.all([
        consume('consumer-1', sem, amount),
        unrelated('other'),
        produce('producer-1', sem, 5),
      ])
    ).resolves.toBeDefined();

    // The consumer should be delayed until the producer completes
    expect(steps).toEqual(['start', 'other', 'producer-1', 'consumer-1']);
    expect(sem.getValue()).toEqual(0);
  });

  it('will continue to block until there is enough capacity', async function () {
    const sem = new Semaphore(10);
    const amount = 15;

    // Should block since there is not enough capacity initially
    await expect(
      Promise.all([
        consume('consumer-1', sem, amount),
        unrelated('other'),
        produce('producer-1', sem, 2, 20),
        produce('producer-2', sem, 2, 40),
        produce('producer-3', sem, 2, 60),
      ])
    ).resolves.toBeDefined();

    // The first job should be delayed until all three producer cycles complete
    expect(steps).toEqual(['start', 'other', 'producer-1', 'producer-2', 'producer-3', 'consumer-1']);
    expect(sem.getValue()).toEqual(1);
  });

  it('will service consumers in FIFO order', async function () {
    const sem = new Semaphore(1);

    // Each consumer should block waiting for capacity but should be processed
    // in FIFO order. That means that even if there is enough capacity for a
    // consumer B, if consumer B is behind consumer A who is waiting for more
    // capacity, then consumer B should be blocked.
    await expect(
      Promise.all([
        consume('consumer-1', sem, 3),
        consume('consumer-2', sem, 1),
        consume('consumer-3', sem, 2),
        produce('producer-1', sem, 1, 20), // Does not satisfy consumer #1
        produce('producer-2', sem, 2, 40), // Satisfies consumers #1 and #2
        produce('producer-3', sem, 1, 60), // Does not satisfy consumer #3
        produce('producer-4', sem, 1, 60), // Satisfies consumer #3
      ])
    ).resolves.toBeDefined();

    expect(steps).toEqual([
      'start',
      'producer-1',
      'producer-2',
      'consumer-1',
      'consumer-2',
      'producer-3',
      'producer-4',
      'consumer-3',
    ]);
    expect(sem.getValue()).toEqual(0);
  });
});

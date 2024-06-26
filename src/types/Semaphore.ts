import { PromiseSettler } from './PromiseSettler.js';
import { LinkedList } from './LinkedList.js';

/**
 * A consumer that is waiting for the semaphore's value to reach the capacity
 * that it needs.
 */
interface SemaphoreWaiter {
  /** The semaphore capacity required by this waiter */
  required: number;

  /** The settler used to resolve the promise allocated for this waiter */
  settler: PromiseSettler<void>;
}

/**
 * A simple semaphore implementation allowing some entities to wait on the
 * semaphore and others to signal the semaphore.
 */
export class Semaphore {
  /** The list of waiters on this semaphore in FIFO order */
  private waiters: LinkedList<SemaphoreWaiter> = new LinkedList();

  /**
   * Constructor
   *
   * @param value - the initial value of the semaphore
   */
  public constructor(private value = 0) {}

  /**
   * Get the current value of the semaphore
   *
   * @return the semaphore value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Get the number of entities waiting on the semaphore
   *
   * @return the number of waiters
   */
  public getNumWaiters(): number {
    return this.waiters.length();
  }

  /**
   * Attempt to decrement the semaphore's value by `i`
   *
   * @param i - the number to decrement the semaphore value by
   */
  public async P(i = 1): Promise<void> {
    // If there are no waiters and enough capacity in the semaphore for this
    // caller then they can return immediately.
    if (this.waiters.empty() && i <= this.value) {
      this.value -= i;
      return;
    }

    // This caller will need to wait, either because there are others waiting
    // already or there is not enough capacity in the semaphore.
    const requestSatisfied = new Promise((resolve, reject) => {
      const settler = new PromiseSettler(resolve, reject);
      this.waiters.push({ required: i, settler });
    });

    // Wait for the semaphore to be signalled and ultimately resolve this
    // promise (via the settler stored in the FIFO) when this caller's request
    // has been satisfied.
    await requestSatisfied;
  }

  /**
   * Attempt to decrement the semaphore's value by `i`
   *
   * @param i - the number to decrement the semaphore value by
   */
  public wait(i = 1): Promise<void> {
    return this.P(i);
  }

  /**
   * Increment the value of the semaphore by `i`
   *
   * @param i - the number to increment the semaphore value by
   */
  public V(i = 1) {
    this.value += i;

    // If there are entities waiting on this semaphore then see if there is now
    // enough capacity to satisfy the first waiter.
    let first = this.waiters.first();
    while (first !== undefined) {
      if (first.required > this.value) {
        // First waiter still requires more capacity so break out of the loop
        break;
      }

      // This waiter is satisfied so they are free to continue. We resolve
      // their promise on the next event loop iteration to ensure there is
      // asynchroncity when unblocking multiple waiters.
      this.waiters.shift();
      this.value -= first.required;
      setImmediate(
        (
          (settler) => () =>
            settler.resolve()
        )(first.settler)
      );

      // Attempt to unblock the next waiter (if any)
      first = this.waiters.first();
    }
  }

  /**
   * Increment the value of the semaphore by the given amount
   *
   * @param delta - the value to add to the semaphore
   */
  public signal(delta = 1) {
    this.V(delta);
  }
}

import { PromiseSettler } from './PromiseSettler.js';
import { LinkedList } from './LinkedList.js';

/** A producer/consumer work queue */
export class WorkQueue<T> {
  /** The jobs waiting to be performed */
  private jobs: LinkedList<T> = new LinkedList();

  /**
   * If defined, it means the consumer is waiting for work. The underlying
   * promise should be resolved when new work is added to wake the consumer up.
   */
  private waiting: PromiseSettler<void> | undefined;

  /**
   * If defined, it is a promise that will be resolved by the next producer to
   * add work to the queue.
   */
  private workAdded: Promise<void> | undefined;

  /** True if the queue has been closed, meaning no more jobs will be added */
  private closed: boolean = false;

  /**
   * Determine if the queue is empty
   *
   * @returns true if the queue is empty
   */
  public isEmpty(): boolean {
    return this.jobs.empty();
  }

  /**
   * Get the number of jobs queued
   *
   * @returns number of jobs in queue
   */
  public length(): number {
    return this.jobs.length();
  }

  /** Called by a producer when no more jobs will be added to the queue */
  public close() {
    this.closed = true;
    this.wakeConsumer();
  }

  /**
   * Determine if the queue is closed
   *
   * @returns true if the queue is closed
   */
  public isClosed(): boolean {
    return this.closed;
  }

  /**
   * Called by a producer to add another job to the end of the queue.
   *
   * @param jobs - the job(s) to be added
   */
  public produce(jobs: T | T[]) {
    if (this.closed) {
      throw new Error(`Cannot add jobs to an empty work queue`);
    }

    // Add the job(s) to the end of the queue. If the consumer is waiting, then
    // wake them up to work on these latest jobs.
    (Array.isArray(jobs) ? jobs : [jobs]).forEach((job) => this.jobs.push(job));
    this.wakeConsumer();
  }

  /**
   * Called by a consumer when they want to get the next job from the queue
   *
   * @returns the next job to be performed or undefined if the queue has closed
   */
  public async consume(): Promise<T | undefined> {
    let job: T | undefined;

    // Keep trying to get a job
    while (job === undefined) {
      job = this.jobs.shift();
      if (job === undefined) {
        // There is currently no work to do. If the queue has closed then there
        // will be no more jobs added.
        if (this.closed) {
          return undefined;
        }

        // The queue is still opened so wait for something to turn up
        if (this.workAdded === undefined) {
          this.workAdded = new Promise((resolve, reject) => {
            this.waiting = new PromiseSettler(resolve, reject);
          });
        }

        // Wait for a producer to signal there is work or the queue has closed.
        // The will do this by resolving this promise via the settler.
        await this.workAdded;
      }
    }

    return job;
  }

  /** Wake the consumer(s) if they are currently waiting */
  private wakeConsumer() {
    if (this.waiting !== undefined) {
      const waiting = this.waiting;

      // Reset the state for the next time the consumers need to wait before
      // resolving the promise.
      this.waiting = undefined;
      this.workAdded = undefined;
      waiting.resolve();
    }
  }
}

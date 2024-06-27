import { LinkedList } from './LinkedList.js';
import { Semaphore } from './Semaphore.js';

/** A producer/consumer work queue */
export class WorkQueue<T> {
  /** The items waiting to be consumed */
  private items: LinkedList<T> = new LinkedList();

  /** The semaphore used to control the consumers accessing the queue */
  private consumers = new Semaphore();

  /**
   * An optional semaphore to control producers accessing the queue when there
   * is a maximum backlog.
   */
  private producers: Semaphore | undefined;

  /** True if the queue has been closed, meaning no more jobs will be added */
  private closed: boolean = false;

  /**
   * Construct a work queue with an optional maximum backlog. If the number of
   * queued jobs reaches that limit then producers will blocked until the
   * backlog drops below that limit.
   *
   * @param backlog - the maximum number of queue jobs allowed
   */
  public constructor(backlog?: number) {
    if (backlog !== undefined && backlog > 0) {
      this.producers = new Semaphore(backlog);
    }
  }

  /**
   * Determine if the queue is empty
   *
   * @returns true if the queue is empty
   */
  public isEmpty(): boolean {
    return this.items.empty();
  }

  /**
   * Determine if the queue is full
   *
   * @return true if the queue is full
   */
  public isFull(): boolean {
    // A queue is full if there is a producers semaphore and its current value
    // is zero.
    return this.producers !== undefined && this.producers.getValue() === 0;
  }

  /**
   * Get the number of items queued
   *
   * @returns number of items in queue
   */
  public length(): number {
    return this.items.length();
  }

  /** Called by a producer when no more jobs will be added to the queue */
  public close(): void {
    // Mark the queue as closed and wake all of the consumers. This requires
    // adding enough capacity for each consumer to be woken.
    this.closed = true;
    this.consumers.signal(this.consumers.getNumWaiters());
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
   * Add one or more items to the queue
   *
   * @param items - the item(s) to be added
   */
  public async produce(items: T | T[]): Promise<void> {
    if (this.closed) {
      throw new Error(`Cannot add items to a closed work queue`);
    }

    items = Array.isArray(items) ? items : [items];
    for (let item of items) {
      // If there is a backlog then we need to make sure there is enough
      // capacity left in the producer's semaphore.
      if (this.producers) {
        await this.producers.wait();
      }

      // In the unlikely event that the queue was closed while waiting to add
      // these items, we continue to add them to the queue and the consumers
      // should continue to consume all of them until the closed queue is
      // exhausted.
      this.items.push(item);
      this.consumers.signal();
    }
  }

  /**
   * Consume one item from the queue
   *
   * @returns the item consumed or undefined if the queue has closed
   */
  public async consume(): Promise<T | undefined> {
    let item: T | undefined;

    // If the queue is empty and closed then there will be nothing to consume
    if (this.isEmpty() && this.isClosed()) {
      return undefined;
    }

    while (item === undefined) {
      // Wait for capacity in the consumer's semaphore before getting the next
      // item from the queue.
      await this.consumers.wait();
      item = this.items.shift();
      if (item === undefined) {
        // There is no work in the queue which most likely means we have been
        // woken up because the queue has been closed. If that's the case then
        // there is no point waiting for more items. Otherwise, if the queue is
        // still opened, then we will attempt to get an item again.
        if (this.closed) {
          return undefined;
        }
      } else {
        // An item was taken from the queue. If there is a maximum backlog then
        // tell the producers that there is one more space now.
        if (this.producers) {
          this.producers.signal();
        }
      }
    }

    return item;
  }
}

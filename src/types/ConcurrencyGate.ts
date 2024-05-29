import { LinkedList } from './LinkedList.js';

/**
 * A concurrency gate is used to control the maximum amount of concurrency that
 * is used to execute a pool of concurrent jobs.
 */
export class ConcurrencyGate<ResultType, Job extends (...args: any) => Promise<ResultType>> {
  /**
   * The list of jobs waiting to go through the gate in FIFO order. These are
   * the resolve() functions of promises for each job that is waiting to be
   * resolved before they can enter.
   */
  private queue: LinkedList<() => void> = new LinkedList();

  /** The number of vacancies inside. */
  private vacancies = 0;

  /**
   * Constructor
   *
   * @param threshold - maximum number of jobs allowed to executing at once
   */
  public constructor(private readonly threshold: number) {
    this.vacancies = this.threshold;
  }

  /**
   * Get the current number of vacancies inside.
   *
   * @returns number of jobs that could go through the gate without waiting
   */
  public getVacancies(): number {
    return this.vacancies;
  }

  /**
   * Get the number of jobs that have have passed through the gate and are
   * inside executing.
   *
   * @returns number of jobs inside
   */
  public getOccupancy(): number {
    return this.threshold - this.vacancies;
  }

  /**
   * Get the number of jobs waiting outside the gate.
   *
   * @returns number of jobs waiting outside
   */
  public getNumWaiting(): number {
    return this.queue.length();
  }

  /**
   * Ask the gate to allow the given job to pass through it and be executed. The
   * gate will execute the job but honour the maximum level of concurrency that
   * was specified when the gate was created.
   *
   * @param job - the job that needs to be executed
   * @param args - optional arguments required to execute the job
   * @returns the result returned by the job
   */
  public async execute(job: Job, ...args: Parameters<Job>): Promise<ResultType> {
    // If there is a vacancy then this job can pass through the gate immediately
    // and start executing.
    if (this.vacancies > 0) {
      --this.vacancies;
      return this.enter(job, ...args);
    }

    // There are no vacancies inside for this job so it is going to have to wait
    // for one to complete.
    await this.getTicket();

    // This job can start executing now. There is no need to change the number
    // of vacancies because this job is replacing one that has just left.
    return this.enter(job, ...args);
  }

  /**
   * Called to allow the job to pass through the gate and start executing.
   * The resulting vacancy levels are expected to have already been set before
   * this function is called.
   *
   * @param job - the job that needs to be executed
   * @param args - optional arguments required to execute the job
   * @returns the result returned by the job
   */
  private async enter(job: Job, ...args: Parameters<Job>): Promise<ResultType> {
    try {
      return await job(...args);
    } finally {
      // Since the job has completed, successfully or otherwise, and is going
      // to leave, there is now a vacancy inside. If there are jobs outside
      // waiting, then give the head of the queue this job's spot. There is no
      // need to change the vacancy levels when give the spot to another job. If
      // there are no jobs waiting then we can bump up the vacancies.
      const nextTicket = this.queue.shift();
      if (nextTicket) {
        // Resolving the ticket will allow the job associated with it to enter.
        // Do the resolution in the next tick to ensure the subsequent call to
        // enter() is not recursive.
        setImmediate(nextTicket);
      } else {
        // There is now one more available spot
        ++this.vacancies;
      }
    }
  }

  /**
   * Called to join the queue of waiters. A ticket is returned that will be
   * resolved when the associated job can pass through the gate.
   * the gate.
   *
   * @returns the ticket for the job to wait on
   */
  private async getTicket(): Promise<void> {
    // Allocate a promise that will be resolved when the job can enter and add
    // that to the queue of jobs waiting. Add the resolve() function to the
    // queue which will be called when it is time for this job to enter
    return new Promise<void>((resolve) => this.queue.push(resolve));
  }
}

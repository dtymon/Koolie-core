import { WorkQueue } from '../WorkQueue.js';

interface Job {
  counter: number;
}

describe('WorkQueue Test', function () {
  it('should handle consuming from an already closed queue', async function () {
    const queue = new WorkQueue<Job>();
    queue.close();

    const received = await queue.consume();
    expect(received).not.toBeDefined();
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should handle closing an already empty queue', async function () {
    // Create a queue and close it on the next event loop
    const queue = new WorkQueue<Job>();
    setImmediate(() => queue.close());

    const received = await queue.consume();
    expect(received).not.toBeDefined();
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should handle consuming a job already in the queue', async function () {
    const queue = new WorkQueue<Job>();

    const job: Job = { counter: 1 };
    queue.produce(job);
    expect(queue.isEmpty()).toBeFalsy();

    let received = await queue.consume();
    expect(received).toEqual(job);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeFalsy();

    queue.close();
    received = await queue.consume();
    expect(received).not.toBeDefined();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should handle consuming a job added to the queue', async function () {
    const queue = new WorkQueue<Job>();

    let job: Job = { counter: 1 };
    queue.produce(job);
    expect(queue.isEmpty()).toBeFalsy();

    // Consume the first item
    let received = await queue.consume();
    expect(received).toBeDefined();
    expect(received?.counter).toEqual(1);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeFalsy();

    // Schedule the second to be added shortly
    job = { counter: 2 };
    setTimeout(() => queue.produce(job), 5);

    // Wait for the job to turn up
    received = await queue.consume();
    expect(received).toBeDefined();
    expect(received?.counter).toEqual(2);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeFalsy();

    queue.close();
    received = await queue.consume();
    expect(received).not.toBeDefined();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should consume all jobs waiting before closure', async function () {
    const queue = new WorkQueue<Job>();

    // Add some jobs to the queue before closing it
    for (let counter = 0; counter < 10; ++counter) {
      queue.produce({ counter });
    }
    expect(queue.isEmpty()).toBeFalsy();
    expect(queue.length()).toEqual(10);
    queue.close();

    // Consume all jobs until we are told it has closed
    const jobs: Job[] = [];
    let completed = false;
    while (!completed) {
      const job = await queue.consume();
      if (job === undefined) {
        completed = true;
      } else {
        jobs.push(job);
      }
    }

    expect(queue.length()).toEqual(0);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
    expect(jobs.length).toEqual(10);

    for (let idx = 0; idx < jobs.length; ++idx) {
      expect(jobs[idx].counter).toEqual(idx);
    }
  });

  it('should handle jobs getting added while waiting', async function () {
    const queue = new WorkQueue<Job>();

    // Add some jobs to the queue at regular intervals
    let delay = 0;
    for (let counter = 0; counter < 10; ++counter) {
      setTimeout(() => queue.produce({ counter }), delay);
      delay += 5;
    }
    setTimeout(() => queue.close(), delay);

    // Consume all jobs until we are told it has closed
    const jobs: Job[] = [];
    let completed = false;
    while (!completed) {
      const job = await queue.consume();
      if (job === undefined) {
        completed = true;
      } else {
        jobs.push(job);
      }
    }

    expect(queue.length()).toEqual(0);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
    expect(jobs.length).toEqual(10);

    for (let idx = 0; idx < jobs.length; ++idx) {
      expect(jobs[idx].counter).toEqual(idx);
    }
  });
});

import { WorkQueue } from '../WorkQueue.js';
import { Timers } from '../../utils/Timers.js';

interface Item {
  counter: number;
}

describe('WorkQueue Test', function () {
  it('should handle consuming from an already closed queue', async function () {
    const queue = new WorkQueue<Item>();
    queue.close();

    const received = await queue.consume();
    expect(received).not.toBeDefined();
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should handle closing an already empty queue', async function () {
    // Create a queue and close it on the next event loop
    const queue = new WorkQueue<Item>();
    setImmediate(() => queue.close());

    const received = await queue.consume();
    expect(received).not.toBeDefined();
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should handle consuming an item already in the queue', async function () {
    const queue = new WorkQueue<Item>();

    const item: Item = { counter: 1 };
    await queue.produce(item);
    expect(queue.isEmpty()).toBeFalsy();

    let received = await queue.consume();
    expect(received).toEqual(item);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeFalsy();

    queue.close();
    received = await queue.consume();
    expect(received).not.toBeDefined();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should handle consuming an item added to the queue', async function () {
    const queue = new WorkQueue<Item>();

    let item: Item = { counter: 1 };
    await queue.produce(item);
    expect(queue.isEmpty()).toBeFalsy();

    // Consume the first item
    let received = await queue.consume();
    expect(received).toBeDefined();
    expect(received?.counter).toEqual(1);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeFalsy();

    // Schedule the second to be added shortly
    item = { counter: 2 };
    setTimeout(async () => await queue.produce(item), 5);

    // Wait for the item to turn up
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

  it('should consume all items waiting before closure', async function () {
    const queue = new WorkQueue<Item>();

    // Add some items to the queue before closing it
    for (let counter = 0; counter < 10; ++counter) {
      await queue.produce({ counter });
    }
    expect(queue.isEmpty()).toBeFalsy();
    expect(queue.length()).toEqual(10);
    queue.close();

    // Consume all items until we are told it has closed
    const items: Item[] = [];
    let completed = false;
    while (!completed) {
      const item = await queue.consume();
      if (item === undefined) {
        completed = true;
      } else {
        items.push(item);
      }
    }

    expect(queue.length()).toEqual(0);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
    expect(items.length).toEqual(10);

    for (let idx = 0; idx < items.length; ++idx) {
      expect(items[idx].counter).toEqual(idx);
    }
  });

  it('should be able to produce many items at once', async function () {
    const queue = new WorkQueue<Item>();

    // Add some items to the queue before closing it
    const items: Item[] = [];
    for (let counter = 0; counter < 10; ++counter) {
      items.push({ counter });
    }
    await queue.produce(items);
    queue.close();

    // Consume all items until we are told it has closed
    const received: Item[] = [];
    let completed = false;
    while (!completed) {
      const item = await queue.consume();
      if (item === undefined) {
        completed = true;
      } else {
        received.push(item);
      }
    }

    expect(queue.length()).toEqual(0);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
    expect(received.length).toEqual(10);

    for (let idx = 0; idx < items.length; ++idx) {
      expect(received[idx].counter).toEqual(idx);
    }
  });

  it('should handle items getting added while waiting', async function () {
    const queue = new WorkQueue<Item>();

    // Add some items to the queue at regular intervals
    let delay = 0;
    for (let counter = 0; counter < 10; ++counter) {
      setTimeout(async () => await queue.produce({ counter }), delay);
      delay += 5;
    }
    setTimeout(() => queue.close(), delay);

    // Consume all items until we are told it has closed
    const items: Item[] = [];
    let completed = false;
    while (!completed) {
      const item = await queue.consume();
      if (item === undefined) {
        completed = true;
      } else {
        items.push(item);
      }
    }

    expect(queue.length()).toEqual(0);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
    expect(items.length).toEqual(10);

    for (let idx = 0; idx < items.length; ++idx) {
      expect(items[idx].counter).toEqual(idx);
    }
  });

  it('should throw when producing to a closed queue', async function () {
    const queue = new WorkQueue<Item>();
    await queue.produce({ counter: 1 });

    const received = await queue.consume();
    expect(received).toBeDefined();
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeFalsy();

    // Close the queue and try to add a new item
    queue.close();
    await expect(queue.produce({ counter: 2 })).rejects.toThrow(Error);
    expect(queue.isEmpty()).toBeTruthy();
    expect(queue.isClosed()).toBeTruthy();
  });

  it('should allow multiple consumers', async function () {
    const queue = new WorkQueue<Item>();
    const consumer1 = queue.consume();
    const consumer2 = queue.consume();
    const consumer3 = queue.consume();

    await queue.produce({ counter: 1 });
    const item1 = await consumer1;

    await queue.produce([{ counter: 2 }, { counter: 3 }]);
    const item2 = await consumer2;
    const item3 = await consumer3;

    expect(item1?.counter).toEqual(1);
    expect(item2?.counter).toEqual(2);
    expect(item3?.counter).toEqual(3);
    expect(queue.isEmpty()).toBeTruthy();
  });

  it('should enforce a maximum backlog', async function () {
    const queue = new WorkQueue<Item>(2);
    await queue.produce([{ counter: 1 }, { counter: 2 }]);
    expect(queue.length()).toEqual(2);
    expect(queue.isFull()).toBeTruthy();

    // The queue is full at this point so producer has to wait
    const producer1 = queue.produce([{ counter: 3 }, { counter: 4 }]);
    expect(queue.length()).toEqual(2);
    expect(queue.isFull()).toBeTruthy();

    // Consume one item and introduce a small delay to allow the producer to
    // put another item on the queue.
    const item1 = await queue.consume();
    expect(item1?.counter).toEqual(1);
    await Timers.delay(10);

    // Queue should be full again
    expect(queue.length()).toEqual(2);
    expect(queue.isFull()).toBeTruthy();

    // Consume the two items in the queue
    const item2 = await queue.consume();
    expect(item2?.counter).toEqual(2);

    const item3 = await queue.consume();
    expect(item3?.counter).toEqual(3);
    await Timers.delay(10);

    // Wait for the producer to put its last item in the queue and then consume
    // it.
    await producer1;
    expect(queue.length()).toEqual(1);
    expect(queue.isFull()).toBeFalsy();

    const item4 = await queue.consume();
    expect(item4?.counter).toEqual(4);
  });
});

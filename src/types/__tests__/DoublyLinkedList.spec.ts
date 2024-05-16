import { DoublyLinkedList } from '../DoublyLinkedList.js';

class Item {
  public constructor(public name: string) {}
}

describe('DoublyLinkedList Test', function () {
  const one = new Item('one');
  const two = new Item('two');
  const three = new Item('three');
  const four = new Item('four');

  function assertEmptyList(items: DoublyLinkedList<Item>) {
    expect(items.empty()).toEqual(true);
    expect(items.length()).toEqual(0);
    expect(items.first()).not.toBeDefined();
    expect(items.last()).not.toBeDefined();
    expect(items.head()).not.toBeDefined();
    expect(items.tail()).not.toBeDefined();
  }

  function assertListNotEmpty(items: DoublyLinkedList<Item>, length: number, first: Item, last: Item) {
    expect(items.empty()).toEqual(false);
    expect(items.length()).toEqual(length);
    expect(items.first()).toBe(first);
    expect(items.last()).toBe(last);
    expect(items.head()).toBeDefined();
    expect(items.tail()).toBeDefined();
  }

  function assertIteration(items: DoublyLinkedList<Item>, expected: Item[]) {
    // Forward iteration first
    const foundForward: Item[] = [];
    for (const item of items) {
      foundForward.push(item);
    }
    expect(foundForward).toEqual(expected);

    // Then reverse iteration
    const foundReverse: Item[] = [];
    for (const item of items.riterator()) {
      foundReverse.push(item);
    }
    expect(foundReverse).toEqual(expected.reverse());
  }

  it('should create an empty list', function () {
    const items = new DoublyLinkedList<Item>();

    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should create a list with an initial item', function () {
    const items = new DoublyLinkedList<Item>(one);

    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);
  });

  it('should return undefined when shifting from an empty list', function () {
    const items = new DoublyLinkedList<Item>();
    const item = items.shift();

    expect(item).not.toBeDefined();
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should return undefined when popping from an empty list', function () {
    const items = new DoublyLinkedList<Item>();
    const item = items.pop();

    expect(item).not.toBeDefined();
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should be able to push one item on and pop it off a list', function () {
    const items = new DoublyLinkedList<Item>();

    items.push(one);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    const item = items.pop();
    expect(item).toBe(one);
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should be able to push one item on and shift it off a list', function () {
    const items = new DoublyLinkedList<Item>();

    items.push(one);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    const item = items.shift();
    expect(item).toBe(one);
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should be able to push many items on to a list', function () {
    const items = new DoublyLinkedList<Item>();

    items.push(one);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    items.push(two);
    assertListNotEmpty(items, 2, one, two);
    assertIteration(items, [one, two]);

    items.push(three);
    assertListNotEmpty(items, 3, one, three);
    assertIteration(items, [one, two, three]);

    let item = items.shift();
    expect(item).toBe(one);
    assertListNotEmpty(items, 2, two, three);
    assertIteration(items, [two, three]);

    item = items.shift();
    expect(item).toBe(two);
    assertListNotEmpty(items, 1, three, three);
    assertIteration(items, [three]);

    items.push(four);
    assertListNotEmpty(items, 2, three, four);
    assertIteration(items, [three, four]);

    item = items.shift();
    expect(item).toBe(three);
    assertListNotEmpty(items, 1, four, four);
    assertIteration(items, [four]);

    item = items.shift();
    expect(item).toBe(four);
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should be able to unshift many items on to a list', function () {
    const items = new DoublyLinkedList<Item>();

    items.unshift(one);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    items.unshift(two);
    assertListNotEmpty(items, 2, two, one);
    assertIteration(items, [two, one]);

    items.unshift(three);
    assertListNotEmpty(items, 3, three, one);
    assertIteration(items, [three, two, one]);

    items.unshift(four);
    assertListNotEmpty(items, 4, four, one);
    assertIteration(items, [four, three, two, one]);

    let item = items.shift();
    expect(item).toBe(four);
    assertListNotEmpty(items, 3, three, one);
    assertIteration(items, [three, two, one]);

    item = items.shift();
    expect(item).toBe(three);
    assertListNotEmpty(items, 2, two, one);
    assertIteration(items, [two, one]);

    item = items.shift();
    expect(item).toBe(two);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    item = items.shift();
    expect(item).toBe(one);
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should be able to mix pushing, popping, shifting and unshifting', function () {
    const items = new DoublyLinkedList<Item>();

    // Items: 1
    items.push(one);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    items.unshift(two);
    assertListNotEmpty(items, 2, two, one);
    assertIteration(items, [two, one]);

    items.push(three);
    assertListNotEmpty(items, 3, two, three);
    assertIteration(items, [two, one, three]);

    let item = items.pop();
    expect(item).toBe(three);
    assertListNotEmpty(items, 2, two, one);
    assertIteration(items, [two, one]);

    items.unshift(four);
    assertListNotEmpty(items, 3, four, one);
    assertIteration(items, [four, two, one]);

    items.push(three);
    assertListNotEmpty(items, 4, four, three);
    assertIteration(items, [four, two, one, three]);

    item = items.shift();
    expect(item).toBe(four);
    assertListNotEmpty(items, 3, two, three);
    assertIteration(items, [two, one, three]);

    item = items.shift();
    expect(item).toBe(two);
    assertListNotEmpty(items, 2, one, three);
    assertIteration(items, [one, three]);

    item = items.pop();
    expect(item).toBe(three);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    item = items.pop();
    expect(item).toBe(one);
    assertEmptyList(items);
    assertIteration(items, []);

    item = items.shift();
    expect(item).not.toBeDefined();
    assertEmptyList(items);
    assertIteration(items, []);

    item = items.pop();
    expect(item).not.toBeDefined();
    assertEmptyList(items);
    assertIteration(items, []);
  });
});

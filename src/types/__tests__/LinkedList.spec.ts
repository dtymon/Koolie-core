import { LinkedList } from '../LinkedList.js';

class Item {
  public constructor(public name: string) {}
}

describe('LinkedList Test', function () {
  const one = new Item('one');
  const two = new Item('two');
  const three = new Item('three');
  const four = new Item('four');

  function assertEmptyList(items: LinkedList<Item>) {
    expect(items.empty()).toEqual(true);
    expect(items.length()).toEqual(0);
    expect(items.first()).not.toBeDefined();
    expect(items.last()).not.toBeDefined();
    expect(items.head()).not.toBeDefined();
    expect(items.tail()).not.toBeDefined();
  }

  function assertListNotEmpty(items: LinkedList<Item>, length: number, first: Item, last: Item) {
    expect(items.empty()).toEqual(false);
    expect(items.length()).toEqual(length);
    expect(items.first()).toBe(first);
    expect(items.last()).toBe(last);
    expect(items.head()).toBeDefined();
    expect(items.tail()).toBeDefined();
  }

  function assertIteration(items: LinkedList<Item>, expected: Item[]) {
    const found: Item[] = [];
    for (const item of items) {
      found.push(item);
    }
    expect(found).toEqual(expected);
  }

  it('should create an empty list', function () {
    const items = new LinkedList<Item>();

    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should create a list with an initial item', function () {
    const items = new LinkedList<Item>(one);

    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);
  });

  it('should return undefined when shifting from an empty list', function () {
    const items = new LinkedList<Item>();
    const item = items.shift();

    expect(item).not.toBeDefined();
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should be able to push one item on and off a list', function () {
    const items = new LinkedList<Item>();

    items.push(one);
    assertListNotEmpty(items, 1, one, one);
    assertIteration(items, [one]);

    const item = items.shift();
    expect(item).toBe(one);
    assertEmptyList(items);
    assertIteration(items, []);
  });

  it('should be able to push many items on and off a list', function () {
    const items = new LinkedList<Item>();

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

  describe('prepend tests', function () {
    it('should handle two empty lists', function () {
      const items1 = new LinkedList<Item>();
      const items2 = new LinkedList<Item>();
      const result = items1.prepend(items2);

      expect(result).toBe(items1);
      assertEmptyList(items1);
      assertEmptyList(items2);
      assertIteration(items1, []);
      assertIteration(items2, []);
    });

    it('should handle an empty LHS', function () {
      const items1 = new LinkedList<Item>();
      const items2 = new LinkedList<Item>();
      items2.push(one).push(two).push(three).push(four);
      const result = items1.prepend(items2);

      expect(result).toBe(items1);
      assertListNotEmpty(items1, 4, one, four);
      assertEmptyList(items2);
      assertIteration(items1, [one, two, three, four]);
      assertIteration(items2, []);
    });

    it('should handle an empty RHS', function () {
      const items1 = new LinkedList<Item>();
      items1.push(one).push(two).push(three).push(four);
      const items2 = new LinkedList<Item>();
      const result = items1.prepend(items2);

      expect(result).toBe(items1);
      assertListNotEmpty(items1, 4, one, four);
      assertEmptyList(items2);
      assertIteration(items1, [one, two, three, four]);
      assertIteration(items2, []);
    });

    it('should handle non-empty RHS', function () {
      const items1 = new LinkedList<Item>();
      items1.push(three).push(four);
      const items2 = new LinkedList<Item>();
      items2.push(one).push(two);
      const result = items1.prepend(items2);

      expect(result).toBe(items1);
      assertListNotEmpty(items1, 4, one, four);
      assertEmptyList(items2);
      assertIteration(items1, [one, two, three, four]);
      assertIteration(items2, []);
    });
  });

  describe('append tests', function () {
    it('should handle two empty lists', function () {
      const items1 = new LinkedList<Item>();
      const items2 = new LinkedList<Item>();
      const result = items1.append(items2);

      expect(result).toBe(items1);
      assertEmptyList(items1);
      assertEmptyList(items2);
      assertIteration(items1, []);
      assertIteration(items2, []);
    });

    it('should handle an empty LHS', function () {
      const items1 = new LinkedList<Item>();
      const items2 = new LinkedList<Item>();
      items2.push(one).push(two).push(three).push(four);
      const result = items1.append(items2);

      expect(result).toBe(items1);
      assertListNotEmpty(items1, 4, one, four);
      assertEmptyList(items2);
      assertIteration(items1, [one, two, three, four]);
      assertIteration(items2, []);
    });

    it('should handle an empty RHS', function () {
      const items1 = new LinkedList<Item>();
      items1.push(one).push(two).push(three).push(four);
      const items2 = new LinkedList<Item>();
      const result = items1.append(items2);

      expect(result).toBe(items1);
      assertListNotEmpty(items1, 4, one, four);
      assertEmptyList(items2);
      assertIteration(items1, [one, two, three, four]);
      assertIteration(items2, []);
    });

    it('should handle non-empty RHS', function () {
      const items1 = new LinkedList<Item>();
      items1.push(one).push(two);
      const items2 = new LinkedList<Item>();
      items2.push(three).push(four);
      const result = items1.append(items2);

      expect(result).toBe(items1);
      assertListNotEmpty(items1, 4, one, four);
      assertEmptyList(items2);
      assertIteration(items1, [one, two, three, four]);
      assertIteration(items2, []);
    });
  });
});

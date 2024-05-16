/**
 * A doubly linked list
 *
 * @typeParam T - the type of items stored in the list
 */
export class DoublyLinkedList<T> implements Iterable<T> {
  /** Head of the list */
  private _head?: DoublyLinkedListNode<T>;

  /** Tail of the list */
  private _tail?: DoublyLinkedListNode<T>;

  /** number of items in the list */
  private count = 0;

  /**
   * Constructor
   *
   * @param item - optional item to start the list
   */
  public constructor(item?: T) {
    if (item !== undefined) {
      this._head = new DoublyLinkedListNode(item);
      this._tail = this._head;
      this.count = 1;
    }
  }

  /**
   * Get the number of items in the list
   *
   * @returns the number of items in the list
   */
  public length(): number {
    return this.count;
  }

  /**
   * Determine if the list is empty
   *
   * @returns true if the list is empty
   */
  public empty(): boolean {
    return this.count === 0;
  }

  /**
   * Add the given item at the end of the list
   *
   * @param item - the item to add
   * @returns this instance
   */
  public push(item: T): this {
    const node = new DoublyLinkedListNode(item);

    // If this is the first item in the list then it becomes the head otherwise
    // it gets added after the tail.
    if (this._tail === undefined) {
      this._head = node;
    } else {
      node.prev = this._tail;
      this._tail.next = node;
    }

    this._tail = node;
    ++this.count;
    return this;
  }

  /**
   * Add an item to the start of the list
   *
   * @param item - the item to add
   * @returns this instance
   */
  public unshift(item: T): this {
    const node = new DoublyLinkedListNode(item);

    if (this._head === undefined) {
      this._tail = node;
    } else {
      node.next = this._head;
      this._head.prev = node;
    }

    this._head = node;
    ++this.count;
    return this;
  }

  /**
   * Remove an item from the end of the list
   *
   * @returns the item removed or undefined if the list is empty
   */
  public pop(): T | undefined {
    const node = this._tail;
    if (node === undefined) {
      return undefined;
    }

    // Move the tail back
    this._tail = node.prev;
    if (this._tail !== undefined) {
      this._tail.next = undefined;
    } else {
      this._head = undefined;
    }

    --this.count;
    return node.item;
  }

  /**
   * Remove an item from the head of the list
   *
   * @returns the item removed or undefined if the list is empty
   */
  public shift(): T | undefined {
    const node = this._head;
    if (node === undefined) {
      return undefined;
    }

    this._head = node.next;
    if (this._head !== undefined) {
      this._head.prev = undefined;
    } else {
      this._tail = undefined;
    }

    --this.count;
    return node.item;
  }

  /**
   * Return the first item in the list if any
   *
   * @returns the first item or undefined
   */
  public first(): T | undefined {
    return this._head?.item;
  }

  /**
   * Get the first item in the list
   *
   * @returns the last item or undefined
   */
  public last(): T | undefined {
    return this._tail?.item;
  }

  /**
   * Get the head of the list
   *
   * @returns the head node or undefined
   */
  public head(): Readonly<DoublyLinkedListNode<T>> | undefined {
    return this._head;
  }

  /**
   * Get the tail of the list
   *
   * @returns the tail node or undefined
   */
  public tail(): Readonly<DoublyLinkedListNode<T>> | undefined {
    return this._tail;
  }

  /**
   * Get an iterator that can iterate the list
   *
   * @returns the iterator
   */
  [Symbol.iterator](): Iterator<T> {
    return new DoublyLinkedListIterator(this);
  }

  /**
   * Return a reverse iterator for the list
   *
   * @returns the iterator
   */
  riterator(): DoublyLinkedListReverseIterator<T> {
    return new DoublyLinkedListReverseIterator(this);
  }
}

/**
 * A node in the list
 *
 * @typeParam T - the type of items stored in the list
 */
export class DoublyLinkedListNode<T> {
  /** Previous node in the list or undefined if this node is the first */
  public prev?: DoublyLinkedListNode<T>;

  /** Next node in the list or undefined if this node is the last */
  public next?: DoublyLinkedListNode<T>;

  /**
   * Constructor
   *
   * @param item - the item this node contains
   */
  public constructor(public item: T) {}
}

/**
 * An iterator that can iterate a linked list
 *
 * @typeParam T - the type of items stored in the list
 */
export class DoublyLinkedListIterator<T> {
  /** Where the iterator is up to in the list */
  private ptr: Readonly<DoublyLinkedListNode<T>> | undefined;

  /**
   * Constructor
   *
   * @param list - the list to iterate
   */
  public constructor(list: DoublyLinkedList<T>) {
    this.ptr = list.head();
  }

  /**
   * Get the next item in the list
   *
   * @returns the next item
   */
  public next(): IteratorResult<T> {
    if (this.ptr === undefined) {
      return { done: true, value: undefined };
    } else {
      const value = this.ptr.item;
      this.ptr = this.ptr.next;
      return { done: false, value };
    }
  }
}

/**
 * An iterator that can iterate a linked list in the reverse direction
 *
 * @typeParam T - the type of items stored in the list
 */
export class DoublyLinkedListReverseIterator<T> implements Iterable<T> {
  /** Where the iterator is up to in the list */
  private ptr: Readonly<DoublyLinkedListNode<T>> | undefined;

  /**
   * Constructor
   *
   * @param list - the list to iterate
   */
  public constructor(list: DoublyLinkedList<T>) {
    this.ptr = list.tail();
  }

  /**
   * Return the next item in the list which in this case is the previous item in
   * the list.
   *
   * @returns the next item
   */
  public next(): IteratorResult<T> {
    if (this.ptr === undefined) {
      return { done: true, value: undefined };
    } else {
      const value = this.ptr.item;
      this.ptr = this.ptr.prev;
      return { done: false, value };
    }
  }

  /**
   * Makes it possible to "iterate" this iterator so that it can be used
   * in `for` loops.
   *
   * ```ts
   *   for (const item of items.riterator()) {
   *   }
   * ```
   *
   * @returns the iterator
   */
  [Symbol.iterator](): Iterator<T> {
    return this;
  }
}

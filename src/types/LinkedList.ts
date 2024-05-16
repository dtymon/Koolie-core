/**
 * A singly linked list
 *
 * @typeParam T - type of items stored in the list
 */
export class LinkedList<T> implements Iterable<T> {
  /** The head of the list */
  private _head?: LinkedListNode<T>;

  /** The tail of the list */
  private _tail?: LinkedListNode<T>;

  /** The number of items in the list */
  private count = 0;

  /**
   * Constructor
   *
   * @typeParam T - the type of items stored in the list
   * @param item - optional item to start the list
   */
  public constructor(item?: T) {
    if (item !== undefined) {
      this._head = new LinkedListNode(item);
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
    const node = new LinkedListNode(item);

    // If this is the first item in the list then it becomes the head otherwise
    // it gets added after the tail.
    if (this._tail === undefined) {
      this._head = node;
    } else {
      this._tail.next = node;
    }

    this._tail = node;
    ++this.count;
    return this;
  }

  /**
   * Remove the item at the head of the list
   *
   * @returns item removed or undefined if the list is empty
   */
  public shift(): T | undefined {
    const node = this._head;
    if (node === undefined) {
      return undefined;
    }

    // Move the head forward and possibly the tail
    this._head = node.next;
    if (this._tail === node) {
      this._tail = this._head;
    }

    --this.count;
    return node.item;
  }

  /**
   * Given another instance, take ownership of its nodes by adding them to the
   * beginning of this list. The other instance becomes an empty list.
   *
   * @param other - the other instance
   * @returns this instance
   */
  public prepend(other: LinkedList<T>): this {
    if (other._tail !== undefined) {
      if (this._head === undefined) {
        this._head = other._head;
        this._tail = other._tail;
      } else {
        other._tail.next = this._head;
        this._head = other._head;
      }
      this.count += other.count;

      other._head = undefined;
      other._tail = undefined;
      other.count = 0;
    }

    return this;
  }

  /**
   * Given another instance, take ownership of its nodes by adding them to the
   * end of this list. The other instance becomes an empty list.
   *
   * @param other - the other instance
   * @returns this instance for chaining
   */
  public append(other: LinkedList<T>): this {
    if (other._head !== undefined) {
      if (this._tail === undefined) {
        this._head = other._head;
        this._tail = other._tail;
      } else {
        this._tail.next = other._head;
        this._tail = other._tail;
      }
      this.count += other.count;

      other._head = undefined;
      other._tail = undefined;
      other.count = 0;
    }

    return this;
  }

  /**
   * Get the first item in the list
   *
   * @returns the first item or undefined
   */
  public first(): T | undefined {
    return this._head?.item;
  }

  /**
   * Get the last item in the list
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
  public head(): Readonly<LinkedListNode<T>> | undefined {
    return this._head;
  }

  /**
   * Get the tail of the list
   *
   * @returns the tail node or undefined
   */
  public tail(): Readonly<LinkedListNode<T>> | undefined {
    return this._tail;
  }

  /**
   * Get an iterator that can iterate the list
   *
   * @returns the iterator
   */
  [Symbol.iterator](): Iterator<T> {
    return new LinkedListIterator(this);
  }
}

/**
 * A node in the list
 *
 * @typeParam T - the type of items stored in the list
 */
export class LinkedListNode<T> {
  /** Next node in the list or undefined if this node is the last */
  public next?: LinkedListNode<T>;

  /**
   * Constructor
   *
   * @typeParam T - the type of items stored in the list
   * @param item - the item this node contains
   */
  public constructor(public item: T) {}
}

/**
 * An iterator that can iterate a linked list
 *
 * @typeParam T - the type of items stored in the list
 */
class LinkedListIterator<T> {
  /** Where the iterator is up to in the list */
  private ptr: Readonly<LinkedListNode<T>> | undefined;

  /**
   * Constructor
   *
   * @param list - the list to iterate
   */
  public constructor(list: LinkedList<T>) {
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

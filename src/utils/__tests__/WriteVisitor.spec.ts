import { WriteVisitor, WriteWalker, WriteVisitResult } from '../WriteVisitor.js';

describe('WriteVisitor tests', function () {
  class UpdatingWriteVisitor extends WriteVisitor {
    public nodes: Map<string, any> = new Map();

    public constructor(private updates: Map<string, any>) {
      super();
    }

    public enter(node: any, _name: string, path: string): WriteVisitResult | void {
      this.nodes.set(path, node);
      if (this.updates.has(path)) {
        const update = this.updates.get(path);
        return update === undefined ? { delete: true } : { update };
      }
    }

    public keyList(): string[] {
      return Array.from(this.nodes.keys()).sort();
    }
  }

  describe('scalar tests', function () {
    it('can visit a string', function () {
      const updates = new Map<string, any>([['', 'goodbye']]);
      const visitor = new UpdatingWriteVisitor(updates);
      const result = WriteWalker.walk('hello', visitor);

      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual('hello');
      expect(result).toEqual(updates.get(''));
    });

    it('can visit a numeric', function () {
      const updates = new Map<string, any>([['', 567.89]]);
      const visitor = new UpdatingWriteVisitor(updates);
      const result = WriteWalker.walk(123.45, visitor);

      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual(123.45);
      expect(result).toEqual(updates.get(''));
    });

    it('can visit a boolean', function () {
      const updates = new Map<string, any>([['', true]]);
      const visitor = new UpdatingWriteVisitor(updates);
      const result = WriteWalker.walk(false, visitor);

      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual(false);
      expect(result).toEqual(updates.get(''));
    });

    it('can visit a date', function () {
      const now = new Date();
      const before = new Date(Date.now() - 100000);
      const updates = new Map<string, any>([['', before]]);
      const visitor = new UpdatingWriteVisitor(updates);
      const result = WriteWalker.walk(now, visitor);

      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual(now);
      expect(result).toEqual(updates.get(''));
    });

    it('can delete a scalar', function () {
      const updates = new Map<string, any>([['', undefined]]);
      const visitor = new UpdatingWriteVisitor(updates);
      const result = WriteWalker.walk('hello', visitor);

      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual('hello');
      expect(result).not.toBeDefined();
    });

    it('can leave scalar unaltered', function () {
      const updates = new Map<string, any>([]);
      const visitor = new UpdatingWriteVisitor(updates);
      const result = WriteWalker.walk('hello', visitor);

      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual('hello');
      expect(result).toEqual('hello');
    });
  });

  describe('object tests', function () {
    it('can visit a simple object', function () {
      const now = new Date();
      const obj = {
        name: 'Tom Walker',
        age: 47,
        tall: false,
        updated: now
      };

      const updates = new Map<string, any>([
        ['age', 26],
        ['tall', true],
        ['updated', undefined]
      ]);
      const visitor = new UpdatingWriteVisitor(updates);
      const newValue = WriteWalker.walk(obj, visitor);

      expect(visitor.nodes.size).toEqual(5);
      expect(visitor.keyList()).toEqual(['', 'age', 'name', 'tall', 'updated']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('tall')).toEqual(obj.tall);
      expect(visitor.nodes.get('updated')).toEqual(obj.updated);
      expect(newValue).toEqual({ name: obj.name, age: updates.get('age'), tall: updates.get('tall') });
    });

    it('can visit a nested object', function () {
      const now = new Date();
      const obj = {
        name: 'Sally Jones',
        age: 31,
        address: {
          streetNum: 382,
          streetName: 'Bell Road'
        },
        tall: false,
        updated: now
      };

      const updates = new Map<string, any>([
        ['age', 32],
        ['address.streetName', 'Brown Road']
      ]);
      const visitor = new UpdatingWriteVisitor(updates);
      const newValue = WriteWalker.walk(obj, visitor);

      expect(visitor.nodes.size).toEqual(8);
      expect(visitor.keyList()).toEqual([
        '',
        'address',
        'address.streetName',
        'address.streetNum',
        'age',
        'name',
        'tall',
        'updated'
      ]);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('tall')).toEqual(obj.tall);
      expect(visitor.nodes.get('updated')).toEqual(obj.updated);
      expect(visitor.nodes.get('address')).toEqual(obj.address);
      expect(visitor.nodes.get('address.streetNum')).toEqual(obj.address.streetNum);
      expect(visitor.nodes.get('address.streetName')).toEqual(obj.address.streetName);
      expect(newValue).toEqual({
        ...obj,
        age: updates.get('age'),
        address: { ...obj.address, streetName: updates.get('address.streetName') }
      });
    });

    it('can handle cyclic references', function () {
      const now = new Date();
      const obj = {
        name: 'Sally Jones',
        age: 31,
        address: {
          streetNum: 382,
          streetName: 'Bell Road'
        },
        tall: false,
        updated: now,
        loop: {}
      };
      (obj.loop as Record<string, any>).self = obj;

      const updates = new Map<string, any>([
        ['age', 32],
        ['address.streetName', 'Brown Road']
      ]);
      const visitor = new UpdatingWriteVisitor(updates);
      const newValue = WriteWalker.walk(obj, visitor);

      expect(visitor.nodes.size).toEqual(10);
      expect(visitor.keyList()).toEqual([
        '',
        'address',
        'address.streetName',
        'address.streetNum',
        'age',
        'loop',
        'loop.self',
        'name',
        'tall',
        'updated'
      ]);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('tall')).toEqual(obj.tall);
      expect(visitor.nodes.get('updated')).toEqual(obj.updated);
      expect(visitor.nodes.get('address')).toEqual(obj.address);
      expect(visitor.nodes.get('address.streetNum')).toEqual(obj.address.streetNum);
      expect(visitor.nodes.get('address.streetName')).toEqual(obj.address.streetName);
      expect(visitor.nodes.get('loop')).toEqual({ self: obj });
      expect(visitor.nodes.get('loop.self')).toEqual(obj);
      expect(newValue).toEqual({
        ...obj,
        age: updates.get('age'),
        address: { ...obj.address, streetName: updates.get('address.streetName') },
        loop: { self: newValue }
      });
    });

    it('can replace an object key with multiple new keys', function () {
      const now = new Date();
      const obj: any = {
        name: 'Sally Jones',
        age: 31,
        tall: false,
        updated: now,
        details: {
          one: 'This should be deleted',
          two: 'And so should this',
          three: 3
        }
      };

      const update = {
        name: 'Sally Smith',
        address: {
          street: '12 Somewhere Street',
          city: 'Melbourne',
          country: 'Australia',
          postcode: 3001
        }
      };

      class MultipleKeyWriteVisitor extends WriteVisitor {
        public enter(_node: any, _name: string, path: string): WriteVisitResult | void {
          if (path === 'details') {
            return {
              spread: true,
              traverse: false,
              update
            };
          }
        }
      }

      const expected = {
        ...obj,
        ...update
      };
      delete expected.details;

      const visitor = new MultipleKeyWriteVisitor();
      const newValue = WriteWalker.walk(obj, visitor);
      expect(newValue).toEqual(expected);
    });
  });

  describe('array tests', function () {
    it('can visit a simple array', function () {
      const hobbies = ['reading', 'singing', 'chess', 'fishing'];

      const updates = new Map<string, any>([
        ['[1]', 'camping'],
        ['[2]', undefined]
      ]);
      const visitor = new UpdatingWriteVisitor(updates);
      const newValue = WriteWalker.walk(hobbies, visitor);

      expect(visitor.nodes.size).toEqual(5);
      expect(visitor.keyList()).toEqual(['', '[0]', '[1]', '[2]', '[3]']);
      expect(visitor.nodes.get('')).toEqual(hobbies);
      expect(visitor.nodes.get('[0]')).toEqual(hobbies[0]);
      expect(visitor.nodes.get('[1]')).toEqual(hobbies[1]);
      expect(visitor.nodes.get('[2]')).toEqual(hobbies[2]);
      expect(visitor.nodes.get('[3]')).toEqual(hobbies[3]);
      expect(newValue).toEqual(['reading', 'camping', 'fishing']);
    });

    it('can handle cyclic arrays', function () {
      const colours: any[] = [
        ['red', 'green', 'blue'],
        ['yellow', 'cyan', 'magenta']
      ];
      colours.unshift(colours);

      const updates = new Map<string, any>([['[1][2]', 'royal-blue']]);
      const visitor = new UpdatingWriteVisitor(updates);
      const newValue = WriteWalker.walk(colours, visitor);

      expect(visitor.nodes.size).toEqual(10);
      expect(visitor.keyList()).toEqual([
        '',
        '[0]',
        '[1]',
        '[1][0]',
        '[1][1]',
        '[1][2]',
        '[2]',
        '[2][0]',
        '[2][1]',
        '[2][2]'
      ]);
      expect(visitor.nodes.get('')).toEqual(colours);
      expect(visitor.nodes.get('[0]')).toEqual(colours);
      expect(visitor.nodes.get('[1]')).toEqual(colours[1]);
      expect(visitor.nodes.get('[1][0]')).toEqual(colours[1][0]);
      expect(visitor.nodes.get('[1][1]')).toEqual(colours[1][1]);
      expect(visitor.nodes.get('[1][2]')).toEqual(colours[1][2]);
      expect(visitor.nodes.get('[2]')).toEqual(colours[2]);
      expect(visitor.nodes.get('[2][0]')).toEqual(colours[2][0]);
      expect(visitor.nodes.get('[2][1]')).toEqual(colours[2][1]);
      expect(visitor.nodes.get('[2][2]')).toEqual(colours[2][2]);
      expect(newValue).toEqual([newValue, ['red', 'green', 'royal-blue'], ['yellow', 'cyan', 'magenta']]);
    });
  });

  describe('abort tests', function () {
    class AbortingWriteVisitor extends WriteVisitor {
      public nodes: Map<string, any> = new Map();

      public constructor(private abortAt: string) {
        super();
      }

      public enter(node: any, _name: string, path: string): WriteVisitResult {
        this.nodes.set(path, node);
        return { abort: path === this.abortAt };
      }

      public keyList(): string[] {
        return Array.from(this.nodes.keys()).sort();
      }
    }

    it('can abort walk of simple object', function () {
      const now = new Date();
      const obj = {
        name: 'Sally Jones',
        age: 31,
        tall: false,
        updated: now
      };

      const visitor = new AbortingWriteVisitor('tall');
      const newValue = WriteWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(4);
      expect(visitor.keyList()).toEqual(['', 'age', 'name', 'tall']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('tall')).toEqual(obj.tall);
      expect(newValue).toEqual({ name: obj.name, age: obj.age });
    });

    it('can abort walk in nested object', function () {
      const now = new Date();
      const obj = {
        name: 'Sally Jones',
        age: 31,
        address: {
          streetNum: 382,
          streetName: 'Bell Road'
        },
        tall: false,
        updated: now
      };

      const visitor = new AbortingWriteVisitor('address.streetNum');
      const newValue = WriteWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(5);
      expect(visitor.keyList()).toEqual(['', 'address', 'address.streetNum', 'age', 'name']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('address')).toEqual(obj.address);
      expect(visitor.nodes.get('address.streetNum')).toEqual(obj.address.streetNum);
      expect(newValue).toEqual({ name: obj.name, age: obj.age });
    });

    it('can abort in an array', function () {
      const now = new Date();
      const obj = {
        name: 'Sally Jones',
        age: 31,
        address: {
          streetNum: 382,
          streetName: 'Bell Road'
        },
        colours: ['red', 'green', 'blue'],
        tall: false,
        updated: now
      };

      const visitor = new AbortingWriteVisitor('colours[1]');
      const newValue = WriteWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(9);
      expect(visitor.keyList()).toEqual([
        '',
        'address',
        'address.streetName',
        'address.streetNum',
        'age',
        'colours',
        'colours[0]',
        'colours[1]',
        'name'
      ]);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('address')).toEqual(obj.address);
      expect(visitor.nodes.get('address.streetNum')).toEqual(obj.address.streetNum);
      expect(visitor.nodes.get('address.streetName')).toEqual(obj.address.streetName);
      expect(visitor.nodes.get('colours')).toEqual(obj.colours);
      expect(visitor.nodes.get('colours[0]')).toEqual(obj.colours[0]);
      expect(visitor.nodes.get('colours[1]')).toEqual(obj.colours[1]);
      expect(newValue).toEqual({ name: obj.name, age: obj.age, address: obj.address });
    });
  });
});

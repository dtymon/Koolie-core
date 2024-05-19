import { ReadVisitor, ReadWalker, ReadVisitResult } from '../ReadVisitor.js';

describe('ReadVisitor tests', function () {
  class TestVisitor extends ReadVisitor {
    public nodes: Map<string, any> = new Map();

    public enter(node: any, _name: string, path: string) {
      this.nodes.set(path, node);
    }

    public keyList(): string[] {
      return Array.from(this.nodes.keys()).sort();
    }
  }

  describe('scalar tests', function () {
    it('can visit a string', function () {
      const visitor = new TestVisitor();
      ReadWalker.walk('simple string', visitor);
      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual('simple string');
    });

    it('can visit a numeric', function () {
      const visitor = new TestVisitor();
      ReadWalker.walk(123.45, visitor);
      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual(123.45);
    });

    it('can visit a boolean', function () {
      const visitor = new TestVisitor();
      ReadWalker.walk(true, visitor);
      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual(true);
    });

    it('can visit a Date', function () {
      const now = new Date();
      const visitor = new TestVisitor();
      ReadWalker.walk(now, visitor);
      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual(now);
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

      const visitor = new TestVisitor();
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(5);
      expect(visitor.keyList()).toEqual(['', 'age', 'name', 'tall', 'updated']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('tall')).toEqual(obj.tall);
      expect(visitor.nodes.get('updated')).toEqual(obj.updated);
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

      const visitor = new TestVisitor();
      ReadWalker.walk(obj, visitor);
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

      const visitor = new TestVisitor();
      ReadWalker.walk(obj, visitor);
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
    });
  });

  describe('array tests', function () {
    it('can visit a simple array', function () {
      const hobbies = ['reading', 'singing', 'chess', 'fishing'];

      const visitor = new TestVisitor();
      ReadWalker.walk(hobbies, visitor);
      expect(visitor.nodes.size).toEqual(5);
      expect(visitor.keyList()).toEqual(['', '[0]', '[1]', '[2]', '[3]']);
      expect(visitor.nodes.get('')).toEqual(hobbies);
      expect(visitor.nodes.get('[0]')).toEqual(hobbies[0]);
      expect(visitor.nodes.get('[1]')).toEqual(hobbies[1]);
      expect(visitor.nodes.get('[2]')).toEqual(hobbies[2]);
      expect(visitor.nodes.get('[3]')).toEqual(hobbies[3]);
    });

    it('can handle nested arrays', function () {
      const colours = [
        ['red', 'green', 'blue'],
        ['yellow', 'cyan', 'magenta']
      ];

      const visitor = new TestVisitor();
      ReadWalker.walk(colours, visitor);
      expect(visitor.nodes.size).toEqual(9);
      expect(visitor.keyList()).toEqual(['', '[0]', '[0][0]', '[0][1]', '[0][2]', '[1]', '[1][0]', '[1][1]', '[1][2]']);
      expect(visitor.nodes.get('')).toEqual(colours);
      expect(visitor.nodes.get('[0]')).toEqual(colours[0]);
      expect(visitor.nodes.get('[0][0]')).toEqual(colours[0][0]);
      expect(visitor.nodes.get('[0][1]')).toEqual(colours[0][1]);
      expect(visitor.nodes.get('[0][2]')).toEqual(colours[0][2]);
      expect(visitor.nodes.get('[1]')).toEqual(colours[1]);
      expect(visitor.nodes.get('[1][0]')).toEqual(colours[1][0]);
      expect(visitor.nodes.get('[1][1]')).toEqual(colours[1][1]);
      expect(visitor.nodes.get('[1][2]')).toEqual(colours[1][2]);
    });

    it('can handle cyclic arrays', function () {
      const colours: any[] = [
        ['red', 'green', 'blue'],
        ['yellow', 'cyan', 'magenta']
      ];
      colours.unshift(colours);

      const visitor = new TestVisitor();
      ReadWalker.walk(colours, visitor);
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
    });
  });

  describe('complex structure', function () {
    it('can walk a complex structure', function () {
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
        loop: {},
        details: {
          colours: [
            ['red', 'green', 'blue'],
            ['yellow', 'cyan', 'magenta']
          ],
          friends: [
            {
              name: 'Bill'
            },
            {
              name: 'Ted'
            }
          ]
        }
      };
      (obj.loop as Record<string, any>).self = obj;

      const visitor = new TestVisitor();
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(25);
      expect(visitor.keyList()).toEqual([
        '',
        'address',
        'address.streetName',
        'address.streetNum',
        'age',
        'details',
        'details.colours',
        'details.colours[0]',
        'details.colours[0][0]',
        'details.colours[0][1]',
        'details.colours[0][2]',
        'details.colours[1]',
        'details.colours[1][0]',
        'details.colours[1][1]',
        'details.colours[1][2]',
        'details.friends',
        'details.friends[0]',
        'details.friends[0].name',
        'details.friends[1]',
        'details.friends[1].name',
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
      expect(visitor.nodes.get('details')).toEqual(obj.details);
      expect(visitor.nodes.get('details.colours')).toEqual(obj.details.colours);
      expect(visitor.nodes.get('details.colours[0]')).toEqual(obj.details.colours[0]);
      expect(visitor.nodes.get('details.colours[0][0]')).toEqual(obj.details.colours[0][0]);
      expect(visitor.nodes.get('details.colours[0][1]')).toEqual(obj.details.colours[0][1]);
      expect(visitor.nodes.get('details.colours[0][2]')).toEqual(obj.details.colours[0][2]);
      expect(visitor.nodes.get('details.colours[1]')).toEqual(obj.details.colours[1]);
      expect(visitor.nodes.get('details.colours[1][0]')).toEqual(obj.details.colours[1][0]);
      expect(visitor.nodes.get('details.colours[1][1]')).toEqual(obj.details.colours[1][1]);
      expect(visitor.nodes.get('details.colours[1][2]')).toEqual(obj.details.colours[1][2]);
      expect(visitor.nodes.get('details.friends')).toEqual(obj.details.friends);
      expect(visitor.nodes.get('details.friends[0]')).toEqual(obj.details.friends[0]);
      expect(visitor.nodes.get('details.friends[0].name')).toEqual(obj.details.friends[0].name);
      expect(visitor.nodes.get('details.friends[1]')).toEqual(obj.details.friends[1]);
      expect(visitor.nodes.get('details.friends[1].name')).toEqual(obj.details.friends[1].name);
    });
  });

  describe('traverse tests', function () {
    class StopTraversalReadVisitor extends ReadVisitor {
      public nodes: Map<string, any> = new Map();
      private doNotTraverse: Set<string>;

      public constructor(...doNotTraverse: string[]) {
        super();
        this.doNotTraverse = new Set<string>(doNotTraverse);
      }

      public enter(node: any, _name: string, path: string): ReadVisitResult {
        this.nodes.set(path, node);
        return { traverse: !this.doNotTraverse.has(path) };
      }

      public keyList(): string[] {
        return Array.from(this.nodes.keys()).sort();
      }
    }

    it('can stop traversal of simple object', function () {
      const now = new Date();
      const obj = {
        name: 'Sally Jones',
        age: 31,
        tall: false,
        updated: now
      };

      // Do not traverse the given object
      const visitor = new StopTraversalReadVisitor('');
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(1);
      expect(visitor.keyList()).toEqual(['']);
      expect(visitor.nodes.get('')).toEqual(obj);
    });

    it('can stop traversal of nested object', function () {
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

      // Do not traverse into the address
      const visitor = new StopTraversalReadVisitor('address');
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(6);
      expect(visitor.keyList()).toEqual(['', 'address', 'age', 'name', 'tall', 'updated']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('tall')).toEqual(obj.tall);
      expect(visitor.nodes.get('updated')).toEqual(obj.updated);
    });

    it('can stop traversal of an array', function () {
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
        colours: ['red', 'green', 'blue']
      };

      const visitor = new StopTraversalReadVisitor('colours', 'address');
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(7);
      expect(visitor.keyList()).toEqual(['', 'address', 'age', 'colours', 'name', 'tall', 'updated']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('tall')).toEqual(obj.tall);
      expect(visitor.nodes.get('updated')).toEqual(obj.updated);
      expect(visitor.nodes.get('address')).toEqual(obj.address);
      expect(visitor.nodes.get('colours')).toEqual(obj.colours);
    });
  });

  describe('abort tests', function () {
    class AbortingReadVisitor extends ReadVisitor {
      public nodes: Map<string, any> = new Map();

      public constructor(private abortAt: string) {
        super();
      }

      public enter(node: any, _name: string, path: string): ReadVisitResult {
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

      const visitor = new AbortingReadVisitor('age');
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(3);
      expect(visitor.keyList()).toEqual(['', 'age', 'name']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
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

      const visitor = new AbortingReadVisitor('address.streetNum');
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(5);
      expect(visitor.keyList()).toEqual(['', 'address', 'address.streetNum', 'age', 'name']);
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('address')).toEqual(obj.address);
      expect(visitor.nodes.get('address.streetNum')).toEqual(obj.address.streetNum);
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

      const visitor = new AbortingReadVisitor('colours[1]');
      ReadWalker.walk(obj, visitor);
      expect(visitor.nodes.size).toEqual(9);
      expect(visitor.keyList()).toEqual(
        [
          '',
          'address',
          'address.streetNum',
          'address.streetName',
          'age',
          'colours',
          'colours[0]',
          'colours[1]',
          'name'
        ].sort()
      );
      expect(visitor.nodes.get('')).toEqual(obj);
      expect(visitor.nodes.get('name')).toEqual(obj.name);
      expect(visitor.nodes.get('age')).toEqual(obj.age);
      expect(visitor.nodes.get('address')).toEqual(obj.address);
      expect(visitor.nodes.get('address.streetNum')).toEqual(obj.address.streetNum);
      expect(visitor.nodes.get('address.streetName')).toEqual(obj.address.streetName);
      expect(visitor.nodes.get('colours')).toEqual(obj.colours);
      expect(visitor.nodes.get('colours[0]')).toEqual(obj.colours[0]);
      expect(visitor.nodes.get('colours[1]')).toEqual(obj.colours[1]);
    });
  });
});

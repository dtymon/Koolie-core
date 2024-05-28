import type { Constructor } from '../types/Constructor.js';

/**
 * This factory is used to create process-wide singletons. On the surface, that
 * seems like a very easy thing to do, something that would not require a
 * factory. Just create one following a simple singleton pattern.
 *
 * However, if the singleton is being created in a module imported into the
 * application then there can be issues. If the application happens to include
 * multiple versions of the module, which can happen with transitive
 * dependencies, then each version of the module will have its own singleton
 * instance. This is usually not what is expected.
 *
 * For example, say application A depends on module X which exports a singleton
 * using the standard singleton pattern of:
 *
 * ```ts
 * export const SomeSingleton = new SomeClassDefinition();
 * ```
 *
 * And, say Application A also depends on module Y which in turn depends on
 * module X too but for some reason, application A and module Y do not use the
 * same instance of module X (meaning that module X appears at least twice
 * under `node_modules` and wasn't hoisted), then this will result in
 * multiple `SomeSingleton` instances existing in application A.
 *
 * This
 * [article](https://derickbailey.com/2016/03/09/creating-a-true-singleton-in-node-js-with-es6-symbols/)
 * describes the problem well and details the solution used here.
 *
 * The solution here is to use Node's `global` namespace to store singletons
 * created by this factory. The keys used to store the singletons are `Symbol`
 * instances that are appropriately scoped to reduce the chances of a name
 * collision with another entry in the `global` namespace.
 */
export class ProcessSingletonFactory {
  /** Namespace used for singletons created by the factory **/
  private static readonly NAMESPACE = '/__koolie__/singletons';

  /**
   * Get or create the singleton with the given name
   *
   * @typeParam T - the type of the singleton
   * @param name - unique name assigned to the singleton
   * @param ctor - constructor to create the singleton
   * @returns the singleton instance
   */
  public static get<T extends object>(name: string, ctor: Constructor<T>): T {
    const key = Symbol.for(this.NAMESPACE);
    let singletons: Map<string, any> | undefined = (global as any)[key];
    if (singletons === undefined) {
      singletons = new Map();
      (global as any)[key] = singletons;
    }

    let singleton: T | undefined = singletons.get(name);
    if (singleton === undefined) {
      singleton = new ctor();
      singletons.set(name, singleton);
    }
    return singleton;
  }
}

/**
 * Determine if the given structure is a plain object
 *
 * @param obj - the object to test
 * @returns true if the object is considered to be a plain object
 */
function isPlainObject(obj: any): boolean {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return false;
  }

  const proto = Object.getPrototypeOf(obj);
  return proto === Object.prototype || proto === null;
}

/** A read visitor can return this structure to influence the traversal*/
export interface ReadVisitResult {
  /** If explicitly set to `false`, the node's children will not be traversed */
  traverse?: boolean;

  /** If explicitly set to `true`, the walking process will be aborted */
  abort?: boolean;
}

/**
 * Abstract base class of a read-only visitor that gets notified each time a
 * node is entered and exited as the data structure is walked.
 */
export abstract class ReadVisitor {
  /**
   * Called when a visitation of a node starts
   *
   * @param node - node that is being visited
   * @param name - name of the node
   * @param path - full dotted path to the node
   * @returns directives for controlling the walking
   */
  public abstract enter(node: any, name: string, path: string): ReadVisitResult | void;

  /**
   * Called when a visitation of a node ends
   *
   * @param _node - node whose visitation has completed
   * @param _name - name of the node
   * @param _path - full dotted path to the node
   */
  public exit(_node: any, _name: string, _path: string): void {
    // No-op by default
  }
}

/**
 * A read-only walker that walks a data structure and informs a visitor of each
 * node visited.
 */
export class ReadWalker {
  /** Set of complex structures already visited. Used to avoid cycles. */
  private visited: Set<any> = new Set();

  /**
   * Walk a given value notifying the specified visitor
   *
   * @param value - value to walk
   * @param visitor - visitor interested in the walking
   */
  public static walk(value: any, visitor: ReadVisitor): void {
    const walker = new ReadWalker(value, visitor);
    walker.start();
  }

  /**
   * Constructor
   *
   * @param node - node to be walked
   * @param visitor - visitor interested in the walking process
   */
  private constructor(
    private node: any,
    private visitor: ReadVisitor
  ) {}

  /** Starts the walking process */
  private start(): void {
    this.walkNode(this.node, '', '');
  }

  /**
   * Walks a given node
   *
   * @param node - value node to walk
   * @param name - name of the node
   * @param path - full dotted path to the node
   * @returns the result of walking this node
   */
  private walkNode(node: any, name: string, path: string): ReadVisitResult {
    // Notify the visitor of this node. Leave immediately if the walking process
    // was aborted.
    const result = this.visitor.enter(node, name, path) ?? {};
    if (result.abort === true) {
      return result;
    }

    // If the visitor has not explicitly requested to skip this node then
    // traverse into it if it is either a plain object or array.
    if (result.traverse !== false && (Array.isArray(node) || isPlainObject(node))) {
      // Do not traverse structures that have already been visited
      if (!this.visited.has(node)) {
        this.visited.add(node);

        if (Array.isArray(node)) {
          // Walk each item in the array in order
          for (let idx = 0; idx < node.length; ++idx) {
            // If the walk of the child node aborts then abort at the parent
            // level too.
            const name = `[${idx}]`;
            const { abort } = this.walkNode(node[idx], name, path + name);
            if (abort === true) {
              return { abort };
            }
          }
        } else {
          // For plain objects, walk each of its attributes
          for (const key in node) {
            // If the walk of the child node aborts then abort at the parent
            // level too.
            const { abort } = this.walkNode(node[key], key, path === '' ? key : path + `.${key}`);
            if (abort === true) {
              return { abort };
            }
          }
        }
      }
    }

    // Notify the visitor the node has been walked
    this.visitor.exit(node, name, path);
    return result;
  }
}

import { ReadVisitResult } from './ReadVisitor.js';
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

/** A write visitor can return this structure to influence the traversal*/
export interface WriteVisitResult extends ReadVisitResult {
  /** An update to the node's value */
  update?: any;

  /** If explicitly set to `true`, the node should be deleted */
  delete?: boolean;

  /** If explicitly set to `true`, the update contains many values that should
   * replace the current value.
   */
  spread?: boolean;
}

/**
 * Abstract base class of a read-write visitor that gets notified each time a
 * node is entered and exited as the data structure is walked.
 */
export abstract class WriteVisitor {
  /**
   * Called when a visitation of a node starts
   *
   * @param node - node that is being visited
   * @param name - name of the node
   * @param path - full dotted path to the node
   * @returns directives for controlling the walking
   */
  public abstract enter(node: any, name: string, path: string): WriteVisitResult | void;

  /**
   * Called when a visitation of a node ends
   *
   * @param _node - node whose visitation has completed
   * @param _name - name of the node
   * @param _path - full dotted path to the node
   */
  public exit(_node: any, _name: string, _path: string) {
    // No-op by default
  }
}

/**
 * A read-write walker that walks a data structure and informs a visitor of each
 * node visited.
 */
export class WriteWalker {
  /** Set of complex structures already visited. Used to avoid cycles. */
  private visited: Map<any, WriteVisitResult> = new Map();

  /**
   * Walk a given value notifying the specified visitor
   *
   * @param value - value to walk
   * @param visitor - visitor interested in the walking
   * @returns the result of walking the node
   */
  public static walk(value: any, visitor: WriteVisitor): any {
    const walker = new WriteWalker(value, visitor);
    const result = walker.start();

    // If the value was deleted then return undefined. Otherwise return the
    // updated value if there is one or the original value (possibly updated
    // in place).
    return result.delete === true ? undefined : result.update !== undefined ? result.update : value;
  }

  /**
   * Constructor
   *
   * @param node - node to be walked
   * @param visitor - visitor interested in the walking process
   */
  private constructor(
    private node: any,
    private visitor: WriteVisitor
  ) {}

  /**
   * Starts the walking process
   *
   * @returns the result of walking the node
   */
  private start(): WriteVisitResult {
    return this.walkNode(this.node, '', '');
  }

  /**
   * Walks a given node
   *
   * @param node - value node to walk
   * @param name - name of the node
   * @param path - full dotted path to the node
   * @returns the result of walking this node
   */
  private walkNode(node: any, name: string, path: string): WriteVisitResult {
    // Notify the visitor of this node. Leave immediately if the walking process
    // was aborted.
    let result = this.visitor.enter(node, name, path) ?? {};
    if (result.abort === true) {
      return result;
    }

    // If the visit resulted in an update or deletion then update the node
    node = result.update !== undefined ? result.update : result.delete === true ? undefined : node;

    // If the visitor has not explicitly requested to skip this node then
    // traverse into it if it is either a plain object or array.
    if (result.traverse !== false && (Array.isArray(node) || isPlainObject(node))) {
      // Do not traverse structures that have already been visited
      if (this.visited.has(node)) {
        result = this.visited.get(node) as WriteVisitResult;
      } else {
        result = Array.isArray(node) ? this.walkArray(node, path) : this.walkObject(node, path);
        if (result.abort === true) {
          return result;
        }
      }
    }

    // Notify the visitor the node has been walked
    this.visitor.exit(node, name, path);
    return result;
  }

  /**
   * Walks an array node
   *
   * @param node - value node to walk
   * @param path - full dotted path to the node
   * @returns the result of visiting the array
   */
  private walkArray(node: any[], path: string): WriteVisitResult {
    const items: any[] = [];
    const result: WriteVisitResult = { update: items };

    // Mark the node as visited
    this.visited.set(node, result);

    // Visit each of the items in the array
    for (let idx = 0; idx < node.length; ++idx) {
      const name = `[${idx}]`;
      const itemVisit = this.walkNode(node[idx], name, path + name);
      if (itemVisit.abort === true) {
        result.abort = true;
        return result;
      }

      // If the item was not deleted then add the item into the result set
      if (itemVisit.delete !== true) {
        items.push(itemVisit.update !== undefined ? itemVisit.update : node[idx]);
      }
    }

    return result;
  }

  /**
   * Walks an object node
   *
   * @param node - value node to walk
   * @param path - full dotted path to the node
   * @returns the result of visiting the object
   */
  private walkObject(node: Record<string, any>, path: string): WriteVisitResult {
    const obj: Record<string, any> = {};
    const result: WriteVisitResult = { update: obj };

    // Mark the node as visited
    this.visited.set(node, result);

    // Visit each of the properties of the object
    for (const key in node) {
      const itemVisit = this.walkNode(node[key], key, path === '' ? key : path + `.${key}`);
      if (itemVisit.abort === true) {
        result.abort = true;
        return result;
      }

      // If the property was not deleted then add it to the result set
      if (itemVisit.delete !== true) {
        if (itemVisit.update === undefined) {
          // Use the existing value
          obj[key] = node[key];
        } else if (itemVisit.spread !== true) {
          // Replace the value with the updated value
          obj[key] = itemVisit.update;
        } else {
          // Replace the existing value with many values
          for (const newKey in itemVisit.update) {
            obj[newKey] = itemVisit.update[newKey];
          }
        }
      }
    }

    return result;
  }
}

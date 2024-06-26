/** Contains the information required to settle an extended promise */
export interface PromiseExtendedState<T> {
  /** The resolve() callback */
  resolve?: (value: T | PromiseLike<T>) => void;

  /** The reject() callback */
  reject?: (reason?: any) => void;
}

/** An extended promise that captures the resolve() and reject() callbacks */
export class PromiseExtended<T> extends Promise<T> {
  /** The information required to settle the promise */
  private state?: PromiseExtendedState<T>;

  /** True if the promise has been settled */
  private settled = false;

  /**
   * Constructor
   *
   * @param executor - the executor required by the underlying promise
   */
  public constructor(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
    // We cannot access the private state member before we call the base
    // constructor so store the state information in a local variable first. The
    // executor appears to be called in the base constructor so the callback
    // information is captured before we get to the point below to set the
    // member variable.
    const stateInfo: PromiseExtendedState<T> = {};

    // Wrap the given executor so that we can capture the resolve() and
    // reject() functions for this promise instance.
    const executorWrapper = (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => {
      stateInfo.resolve = resolve;
      stateInfo.reject = reject;
      executor(resolve, reject);
    };

    // Invoking the base constructor should allow us to capture the resolve()
    // and reject() functions via the wrapper above.
    super(executorWrapper);

    // Point our state member to the local variable
    this.state = stateInfo;
  }

  /** Set the species of the class to be a Promise */
  static get [Symbol.species]() {
    return Promise;
  }

  /**
   * Resolve the promise
   *
   * @param result - the result of the promise
   */
  public resolve(result: T) {
    if (!this.settled && this.state?.resolve) {
      this.settled = true;
      this.state.resolve(result);
    }
  }

  /**
   * Reject the promise
   *
   * @param reason - the reason the promise was rejected
   */
  public reject(reason: Error) {
    if (!this.settled && this.state?.reject) {
      this.settled = true;
      this.state.reject(reason);
    }
  }
}

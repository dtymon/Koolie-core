/** The signature of a resolve() function */
export type ResolveSignature<T> = (value: T | PromiseLike<T>) => void;

/** The signature of a reject() function */
export type RejectSignature = (reason?: any) => void;

/** Captures the functions required to settle promise */
export interface PromiseSettlingFunctions<T> {
  /** The function to resolve the associated promise */
  resolve?: ResolveSignature<T>;

  /** The function to reject the associated promise */
  reject?: RejectSignature;
}

/**
 * A promise that has been extended to capture its resolve() and reject()
 * functions. This allows the promise to expose methods that can be called to
 * resolve or reject the promise without having explicit access to these
 * settling functions.
 */
export class ResolvablePromise<T> extends Promise<T> {
  /** The settling information for this promise */
  private state?: PromiseSettlingFunctions<T>;

  /** True if the promise has been settled */
  private settled = false;

  /**
   * Constructor
   *
   * @param executor - the executor required by the underlying promise
   */
  public constructor(executor: (resolve: ResolveSignature<T>, reject: RejectSignature) => void) {
    // We cannot access the private state member before we call the base
    // constructor so store the state information in a local variable first. The
    // executor appears to be called in the base constructor so the callback
    // information is captured before we get to the point below to set the
    // member variable.
    const settlers: PromiseSettlingFunctions<T> = {};

    // Wrap the given executor so that we can capture the resolve() and
    // reject() functions for this promise instance.
    const executorWrapper = (resolve: ResolveSignature<T>, reject: RejectSignature) => {
      settlers.resolve = resolve;
      settlers.reject = reject;
      executor(resolve, reject);
    };

    // Invoking the base constructor should allow us to capture the resolve()
    // and reject() functions via the wrapper above.
    super(executorWrapper);

    // Point our state member to the local variable
    this.state = settlers;
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

/** Wrapper that ensures that a promise is settled at most once. */
export class PromiseSettler<T> {
  /** The Promise's resolve() function */
  private resolver: ResolveSignature<T>;

  /** The Promise's reject() function */
  private rejecter: RejectSignature;

  /** True if the promise has been resolved */
  private resolved = false;

  /** True if the promise has been rejected */
  private rejected = false;

  /**
   * Constructor
   *
   * @param resolve - the resolve() function
   * @param reject - the reject() function
   */
  public constructor(resolve: ResolveSignature<T>, reject: RejectSignature) {
    this.resolver = resolve;
    this.rejecter = reject;
  }

  /**
   * Determine whether the promise has been settled
   *
   * @returns true if the promise has been settled
   */
  public hasBeenSettled(): boolean {
    return this.resolved || this.rejected;
  }

  /**
   * Determine if the promise has been resolved
   *
   * @returns true if the promise has been resolved
   */
  public hasBeenResolved(): boolean {
    return this.resolved;
  }

  /**
   * Determine if the promise has been rejected
   *
   * @returns true if the promise has been rejected
   */
  public hasBeenRejected(): boolean {
    return this.rejected;
  }

  /**
   * Resolve the promise if not already settled
   *
   * @param result - the result of the promise
   */
  public resolve(result: T | PromiseLike<T>): void {
    if (!this.hasBeenSettled()) {
      this.resolved = true;
      this.resolver(result);
    }
  }

  /**
   * Reject the promise if not already settled
   *
   * @param err - the error to report
   */
  public reject(err?: Error): void {
    if (!this.hasBeenSettled()) {
      this.rejected = true;
      this.rejecter(err);
    }
  }
}

/** Wrapper that ensures that a promise is settled at most once. */
export class PromiseSettler<ReturnType> {
  /** The Promise's resolve() function */
  private resolver: (value: ReturnType | PromiseLike<ReturnType>) => void;

  /** The Promise's reject() function */
  private rejecter: (reason?: any) => void;

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
  public constructor(resolve: (value: ReturnType | PromiseLike<ReturnType>) => void, reject: (reason?: any) => void) {
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
  public resolve(result: ReturnType | PromiseLike<ReturnType>): void {
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

/** Utility class to assist in timing function execution times */
export class StopWatch {
  /**
   * Execute the given function and return how long it took to complete
   *
   * @typeParam F - type of function to execute
   * @param func - function to execute
   * @returns number of milliseconds the execution took
   */
  public static async time<F extends (...args: any) => any>(func: F, ...args: Parameters<F>): Promise<number> {
    const startNano = process.hrtime.bigint();
    await func(...args);
    const endNano = process.hrtime.bigint();

    // Return the number of milliseconds that elapsed
    return Number(endNano - startNano) / 1000000.0;
  }

  /**
   * Execute the given function synchronously and return how long it took to
   * complete.
   *
   * @typeParam F - type of function to execute
   * @param func - function to execute
   * @returns number of milliseconds the execution took
   */
  public static timeSync<F extends (...args: any) => any>(func: F, ...args: Parameters<F>): number {
    const startNano = process.hrtime.bigint();
    func(...args);
    const endNano = process.hrtime.bigint();

    // Return the number of milliseconds that elapsed
    return Number(endNano - startNano) / 1000000.0;
  }
}

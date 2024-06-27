/** Used to assist timing how long operations take to perform */
export class StopWatch {
  /**
   * Time how many msecs it takes to execute the given asynchronous function
   *
   * @param func - the function to be timed
   * @returns msecs it took to complete
   */
  public static async timeAsync<T extends (...args: any) => any>(func: T, ...args: Parameters<T>): Promise<number> {
    const startNano = process.hrtime.bigint();
    await func(...(args as any));
    const endNano = process.hrtime.bigint();
    return Number(endNano - startNano) / 1000000.0;
  }

  /**
   * Time how many msecs it takes to execute the given synchronous function
   *
   * @param func - the function to be timed
   * @returns msecs it took to complete
   */
  public static timeSync<T extends (...args: any) => any>(func: T, ...args: Parameters<T>): number {
    const startNano = process.hrtime.bigint();
    func(...(args as any));
    const endNano = process.hrtime.bigint();
    return Number(endNano - startNano) / 1000000.0;
  }
}

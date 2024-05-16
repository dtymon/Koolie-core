/** The signature of a constructor */
export type Constructor<T extends object = object> = new (...args: any[]) => T;

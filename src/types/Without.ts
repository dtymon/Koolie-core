/**
 * A type that is type T without the properties defined in type U
 *
 * @typeParam T - the base type
 * @typeParam U - exclude these properties from the resultant type
 */
export type Without<T, U> = { [property in Exclude<keyof T, keyof U>]?: never };

/** A mutually exclusive type that handles primitives and structured types */
export type XorTypes<T, U> = T | U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;

/**
 * Used to define a new interface with the properties common to the two given
 * generics. The properties have to share the same name and type.
 */
export type IntersectionOf<A, B> = Pick<
  A,
  {
    [K in keyof A & keyof B]: A[K] extends B[K] ? (B[K] extends A[K] ? K : never) : never;
  }[keyof A & keyof B]
>;

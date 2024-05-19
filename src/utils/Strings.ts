import { Hash, createHash, timingSafeEqual } from 'node:crypto';

// A hash used for timing-safe string comparisions, created on demand.
let stringCompareHash: Hash | undefined = undefined;

/** Utility class that provides some helpful string functions */
export class Strings {
  /**
   * Convert snake_case to upper CamelCase
   *
   * @param input - the string to convert
   * @returns the upper CamelCase equivalent
   */
  public static toCamelCase(input: string): string {
    // prettier-ignore
    return input.replace(/^_+/, '')
      .replace(/(_+(.))/g, ($2) => $2.toUpperCase())
      .replace(/_/g, '')
    ;
  }

  /**
   * Compare two strings for equality in such a way that it is not susceptible
   * to timing attacks. This is when an attacker is monitoring how long it takes
   * to compare the string. This time tends to increase as the attacker gets
   * closer to the correct value since a naive approach would need to compare
   * more characters in the string.
   *
   * @param x - the first string
   * @param y - the second string
   * @returns true if the inputs are equal
   */
  public static timingSafeCompare(x: string, y: string): boolean {
    // Create the hash on demand. It is too expensive to use a create a new hash
    // on each invocation.
    if (stringCompareHash === undefined) {
      stringCompareHash = createHash('sha512');
    }

    // Take copy of the hash to compute a SHA512 digest for each input and use
    // these to test for equality.
    const xDigest = stringCompareHash.copy().update(x).digest();
    const yDigest = stringCompareHash.copy().update(y).digest();
    return timingSafeEqual(xDigest, yDigest);
  }
}

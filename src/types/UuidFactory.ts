import { v4 as uuidv4, v5 as uuidv5 } from '../3rd-party/uuid/index.js';

export const UUID_REGEX = new RegExp(
  '(?:^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$)|(?:^[0-9a-f]{32}$)',
  'i'
);

/** A factory for generating uuid strings **/
export class UuidFactory {
  /**
   * Generates a v4 random uuid.
   *
   * @returns the v4 uuid
   */
  public static random(): string {
    return uuidv4();
  }

  /**
   * Generates a v5 deterministic uuid.
   *
   * @param namespace - the namespace uuid this uuid belongs to
   * @param name - the name to use when generating the uuid
   * @returns a deterministic uuid when passed the same name within the given
   * namespace
   */
  public static deterministic(namespace: string, name: string): string {
    return uuidv5(name, namespace);
  }

  /**
   * Convert a stringified uuid to its equivalent 16-byte array.
   *
   * @param uuid - the string to convert
   * @param buffer - if specified, put the bytes in this buffer
   * @param offset - if specified, start at the given offset in the provided
   * buffer
   * @returns the 16-byte array or undefined if the provided uuid is not valid
   */
  public static toBytes(uuid: string, buffer?: ArrayBuffer, offset = 0): ArrayBuffer | undefined {
    // Create a new buffer if none was provided
    buffer = buffer || new ArrayBuffer(16);
    const view = new Uint8Array(buffer);

    let failures = 0;
    let idx = 0;

    // Extract each octet and add to the buffer
    uuid
      .toLowerCase()
      .replace(/-/g, '')
      .replace(/../g, function (octet: string): string {
        const x = parseInt(octet, 16);
        if (/^[0-9a-f]{2}$/.test(octet) && !isNaN(x)) {
          view[offset + idx++] = x;
        } else {
          ++failures;
        }
        return octet;
      });

    return failures || idx != 16 ? undefined : buffer;
  }

  /**
   * Given an array of 16 bytes, return the equivalent uuid 36 char string
   *
   * @param buffer - the buffer containing the bytes
   * @param offset - if specified, start at given offset in the provided buffer
   * @returns the uuid string if the array is valid else undefined
   */
  public static fromBytes(buffer: ArrayBuffer, offset = 0): string | undefined {
    if (offset + 16 > buffer.byteLength) {
      return undefined;
    }

    let uuid = '';
    const view = new Uint8Array(buffer);
    for (let idx = 0; idx < 16; ++idx) {
      const octet = view[offset + idx];

      // Add 0x100 to the octet to get zero-padding
      uuid += (octet + 0x100).toString(16).substring(1);
      switch (idx) {
        case 3:
        case 5:
        case 7:
        case 9:
          uuid += '-';
          break;
      }
    }

    return uuid;
  }

  /**
   * Determine if the given string is a valid uuid. The string can either by a
   * 32-char uuid with no separators or a 36-char string with dashes in the
   * standard locations.
   *
   * @param input - the string to test
   * @returns true if it is a valid uuid string
   */
  public static isValid(input: string | undefined): boolean {
    return input === undefined ? false : UUID_REGEX.test(input);
  }
}

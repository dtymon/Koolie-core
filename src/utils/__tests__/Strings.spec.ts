import { Strings } from '../Strings.js';

describe('StringUtils tests', function () {
  describe('toCamelCase', function () {
    it('can handle an empty string', function () {
      expect(Strings.toCamelCase('')).toEqual('');
    });

    it('can convert a snake_case string', function () {
      const input = 'this_is_snake_case';
      const expected = 'thisIsSnakeCase';
      expect(Strings.toCamelCase(input)).toEqual(expected);
    });

    it('will strip leading underscores', function () {
      const input = '____this_is_snake_case';
      const expected = 'thisIsSnakeCase';
      expect(Strings.toCamelCase(input)).toEqual(expected);
    });

    it('will strip trailing underscore', function () {
      const input = 'this_is_snake_case_';
      const expected = 'thisIsSnakeCase';
      expect(Strings.toCamelCase(input)).toEqual(expected);
    });

    it('will strip trailing underscores', function () {
      const input = 'this_is_snake_case____';
      const expected = 'thisIsSnakeCase';
      expect(Strings.toCamelCase(input)).toEqual(expected);
    });

    it('can handle multiple underscores', function () {
      const input = 'this_is___snake_case';
      const expected = 'thisIsSnakeCase';
      expect(Strings.toCamelCase(input)).toEqual(expected);
    });

    it('can handle no underscores', function () {
      const input = 'thisissnakecase';
      const expected = 'thisissnakecase';
      expect(Strings.toCamelCase(input)).toEqual(expected);
    });
  });

  describe('timingSafeCompare', function () {
    // Use long strings that are very similar
    const str1 = '79384e7e-397f-49be-b48a-7ab1cf55e715 3dca2225-d153-4b7e-8a2c-24fd7b8f64df';
    const str2 = '79384e7e-397f-49be-b48a-7ab1cf55e715 3dca2225-d153-4b7e-8a2c-24fd7b8f64df';
    const str3 = '79384e7e-397f-49be-b48a-7ab1cf55e715 3dca2225-d153-4b7e-8a2c-24fd7b8f64DF';

    it('can compare a string with itself', function () {
      expect(Strings.timingSafeCompare(str1, str1)).toBeTruthy();
    });

    it('can compare two equal strings #1', function () {
      expect(Strings.timingSafeCompare(str1, str2)).toBeTruthy();
    });

    it('can compare two equal strings #2', function () {
      expect(Strings.timingSafeCompare(str2, str1)).toBeTruthy();
    });

    it('can compare two different strings #1', function () {
      expect(Strings.timingSafeCompare(str1, str3)).toBeFalsy();
    });

    it('can compare two different strings #2', function () {
      expect(Strings.timingSafeCompare(str3, str2)).toBeFalsy();
    });
  });
});

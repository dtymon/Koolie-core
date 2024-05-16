import { UuidFactory, UUID_REGEX } from '../UuidFactory.js';

describe('UuidFactory Test', function () {
  describe('random', function () {
    it('can generate a random uuid', function () {
      const result = UuidFactory.random();
      expect(result.match(UUID_REGEX)).toBeTruthy();
      expect(UuidFactory.isValid(result)).toBeTruthy();
    });
  });

  describe('deterministic', function () {
    const namespace = 'c0348c43-bc83-47ab-95de-d5ccb7fd2e56';
    const name = 'my-uuid';
    const expected = 'bf30dc3b-3524-5c05-a366-8ad54b576250';

    it('can generate a deterministic uuid', function () {
      const actual = UuidFactory.deterministic(namespace, name);
      expect(actual.match(UUID_REGEX)).toBeTruthy();
      expect(actual).toEqual(expected);
      expect(UuidFactory.isValid(actual)).toBeTruthy();

      const actual2 = UuidFactory.deterministic(namespace, name);
      expect(actual2).toEqual(actual);
    });
  });

  describe('toBytes', function () {
    const input = '00112233-4455-6677-8899-aabbccddeeff';

    it('can convert a uuid into bytes', function () {
      const buffer = UuidFactory.toBytes(input);
      expect(buffer).toBeDefined();
      if (buffer !== undefined) {
        const view = new Uint8Array(buffer);
        expect(view.length).toEqual(16);
        expect(view[0]).toEqual(0x00);
        expect(view[1]).toEqual(0x11);
        expect(view[2]).toEqual(0x22);
        expect(view[3]).toEqual(0x33);
        expect(view[4]).toEqual(0x44);
        expect(view[5]).toEqual(0x55);
        expect(view[6]).toEqual(0x66);
        expect(view[7]).toEqual(0x77);
        expect(view[8]).toEqual(0x88);
        expect(view[9]).toEqual(0x99);
        expect(view[10]).toEqual(0xaa);
        expect(view[11]).toEqual(0xbb);
        expect(view[12]).toEqual(0xcc);
        expect(view[13]).toEqual(0xdd);
        expect(view[14]).toEqual(0xee);
        expect(view[15]).toEqual(0xff);
      }
    });

    it('can handle invalid input', function () {
      const buffer = UuidFactory.toBytes('hello');
      expect(buffer).not.toBeDefined();
    });
  });

  describe('fromBytes', function () {
    const expected = '00112233-4455-6677-8899-aabbccddeeff';

    it('can convert a byte array into a uuid', function () {
      const buffer = new ArrayBuffer(16);
      const view = new Uint8Array(buffer);
      view[0] = 0x00;
      view[1] = 0x11;
      view[2] = 0x22;
      view[3] = 0x33;
      view[4] = 0x44;
      view[5] = 0x55;
      view[6] = 0x66;
      view[7] = 0x77;
      view[8] = 0x88;
      view[9] = 0x99;
      view[10] = 0xaa;
      view[11] = 0xbb;
      view[12] = 0xcc;
      view[13] = 0xdd;
      view[14] = 0xee;
      view[15] = 0xff;

      const actual = UuidFactory.fromBytes(buffer);
      expect(actual).toBeDefined();
      expect(UuidFactory.isValid(actual)).toBeTruthy();
      if (actual !== undefined) {
        expect(actual).toEqual(expected);
      }
    });

    it('can handle short data', function () {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 0x00;
      view[1] = 0x11;
      view[2] = 0x22;
      view[3] = 0x33;

      const actual = UuidFactory.fromBytes(buffer);
      expect(actual).not.toBeDefined();
      expect(UuidFactory.isValid(actual)).toBeFalsy();
    });
  });
});

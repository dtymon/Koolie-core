import { OpenAPIV2, OpenAPIV3 } from './index.js';

describe('openapi-types import test', function () {
  it('can import the module', function () {
    expect(OpenAPIV2).toBeInstanceOf(Object);
    expect(OpenAPIV3).toBeInstanceOf(Object);
  });
});

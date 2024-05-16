import { StatusCodes, ReasonPhrases } from './index.js';

describe('http-status-codes import test', function () {
  it('can import the module', function () {
    expect(StatusCodes).toBeDefined();
    expect(StatusCodes.BAD_REQUEST).toBeDefined();
    expect(ReasonPhrases).toBeDefined();
    expect(ReasonPhrases.OK).toEqual('OK');
  });
});

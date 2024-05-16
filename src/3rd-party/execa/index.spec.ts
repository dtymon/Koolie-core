import { ExecaError, ExecaSyncError, execa, execaCommand, execaCommandSync, execaNode, execaSync } from './index.js';

describe('execa import test', function () {
  it('can import the module', function () {
    expect(ExecaError).toBeInstanceOf(Function);
    expect(ExecaSyncError).toBeInstanceOf(Function);
    expect(execa).toBeInstanceOf(Function);
    expect(execaCommand).toBeInstanceOf(Function);
    expect(execaCommandSync).toBeInstanceOf(Function);
    expect(execaNode).toBeInstanceOf(Function);
    expect(execaSync).toBeInstanceOf(Function);
  });
});

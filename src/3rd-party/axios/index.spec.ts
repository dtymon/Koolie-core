import axios, { get, head, post, put } from './index.js';

describe('axios import test', function () {
  it('can import the module', function () {
    expect(typeof axios).toEqual('object');
    expect(axios.all).toBeInstanceOf(Function);
    expect(get).toBeInstanceOf(Function);
    expect(head).toBeInstanceOf(Function);
    expect(post).toBeInstanceOf(Function);
    expect(put).toBeInstanceOf(Function);
  });
});

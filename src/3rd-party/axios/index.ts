import * as axios from 'axios';
export default axios;
export const all = axios.default.all;
export const get = axios.default.get;
export const head = axios.default.head;
export const _delete = axios.default.delete;
export const options = axios.default.options;
export const patch = axios.default.patch;
export const post = axios.default.post;
export const put = axios.default.put;
export const request = axios.default.request;

export {
  Axios,
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  Cancel,
  CancelToken,
  CanceledError,
  HttpStatusCode,
  isAxiosError,
  isCancel,
} from 'axios';

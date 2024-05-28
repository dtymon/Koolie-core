import { StatusCodes, getReasonPhrase } from '../../3rd-party/http-status-codes/index.js';
import { AxiosError } from '../../3rd-party/axios/index.js';

import { Constructor } from '../../types/Constructor.js';
import { KoolieError, ErrorContext } from '../KoolieError.js';
import {
  HttpError,
  HttpErrorResponse,
  HttpErrorResponseCausedBy,
  HttpErrorBadRequest,
  HttpErrorBadRequestCausedBy,
  HttpErrorUnauthorized,
  HttpErrorUnauthorizedCausedBy,
  HttpErrorForbidden,
  HttpErrorForbiddenCausedBy,
  HttpErrorNotFound,
  HttpErrorNotFoundCausedBy,
  HttpErrorMethodNotAllowed,
  HttpErrorMethodNotAllowedCausedBy,
  HttpErrorNotAcceptable,
  HttpErrorNotAcceptableCausedBy,
  HttpErrorRequestTimeout,
  HttpErrorRequestTimeoutCausedBy,
  HttpErrorConflict,
  HttpErrorConflictCausedBy,
  HttpErrorGone,
  HttpErrorGoneCausedBy,
  HttpErrorUnprocessableEntity,
  HttpErrorUnprocessableEntityCausedBy,
  HttpErrorTooManyRequests,
  HttpErrorTooManyRequestsCausedBy,
  HttpErrorInternalServerError,
  HttpErrorInternalServerErrorCausedBy,
  HttpErrorNotImplemented,
  HttpErrorNotImplementedCausedBy,
  HttpErrorBadGateway,
  HttpErrorBadGatewayCausedBy,
  HttpErrorServiceUnavailable,
  HttpErrorServiceUnavailableCausedBy,
  HttpErrorGatewayTimeout,
  HttpErrorGatewayTimeoutCausedBy,
  HttpErrorSendRequestFailed,
  HttpErrorSendRequestFailedCausedBy,
  HttpErrorReceiveResponseFailed,
  HttpErrorReceiveResponseFailedCausedBy,
  HttpErrorFactory,
} from '../HttpErrors.js';

interface ExpectedState {
  statusCode: number;
  message: string | undefined;
  context: ErrorContext;
  requestWasSent?: boolean;
  responseWasReceived?: boolean;
}

function expectSimple<T extends HttpErrorResponse>(err: T, state: ExpectedState) {
  expect(err instanceof HttpErrorResponse).toBeTruthy();
  expect(err.statusCode).toEqual(state.statusCode);
  expect(err.message).toEqual(state.message);
  expect(err.sentRequest()).toEqual(state.requestWasSent ?? true);
  expect(err.receivedResponse()).toEqual(state.responseWasReceived ?? true);
  expect(err.context).toEqual(state.context);
  expect(err.toJSON()).toEqual({
    statusCode: state.statusCode,
    message: state.message,
    context: state.context,
  });
}

function expectCausedBy<T extends HttpErrorResponse, C extends KoolieError>(err: T, rootCause: C, state: ErrorContext) {
  const expectedCtx = { ...state.context, rootCause };
  expect(err instanceof HttpErrorResponse).toBeTruthy();
  expect(err.statusCode).toEqual(state.statusCode);
  expect(err.message).toEqual(state.message);
  expect(err.sentRequest()).toEqual(state.requestWasSent ?? true);
  expect(err.receivedResponse()).toEqual(state.responseWasReceived ?? true);
  expect(err.context).toEqual(expectedCtx);
  expect(err.toJSON()).toEqual({
    statusCode: state.statusCode,
    message: state.message,
    context: expectedCtx,
  });
}

describe('HttpErrors Test', function () {
  const rootCauseMessage = 'I was the cause of this';
  const rootCause = new KoolieError(rootCauseMessage, { info: 'this was the root cause of the issue' });

  /**
   * Tests the construction of one error type
   *
   * @param ctor - the constructor of the error type to test
   * @param statusCode - the status associated with this error
   */
  function testResponseErrorType<T extends HttpErrorResponse>(ctor: Constructor<T>, statusCode: number) {
    const message = 'My error message';
    const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
    const err = new ctor(message, context);

    expectSimple(err, { statusCode, message, context });
  }

  /**
   * Tests the construction of one caused-by error type
   *
   * @param ctor - the constructor of the error type to test
   * @param statusCode - the status associated with this error
   */
  function testResponseCausedBy<T extends HttpErrorResponse>(ctor: Constructor<T>, statusCode: number) {
    const message = 'My error message';
    const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
    const err = new ctor(rootCause, message, context);

    expectCausedBy(err, rootCause, { statusCode, message, context });
  }

  /**
   * Tests the construction of one error type via the factory
   *
   * @param ctor - the constructor of the error type to test
   * @param statusCode - the status associated with this error
   */
  function testResponseErrorViaFactory<T extends HttpErrorResponse>(ctor: Constructor<T>, statusCode: number) {
    const message = 'Something went wrong';
    const context = { name: 'Bill Jones', age: 82, attrs: { height: 153, weight: 82 } };

    const axiosErr: Partial<AxiosError> = {
      isAxiosError: true,
      message,
      request: {},
      response: {
        status: statusCode,
        statusText: getReasonPhrase(statusCode),
        headers: {},
        config: {} as any,
        data: context,
      },
    };

    const err = HttpErrorFactory.fromAxios(axiosErr);
    expect(err).toBeInstanceOf(ctor);
    expectSimple(err as HttpErrorResponse, { statusCode, message, context: { data: context } });
  }

  describe('HttpErrorResponse Test', function () {
    it('should construct an instance given just an HTTP status', function () {
      const statusCode = 205;
      const err = new HttpErrorResponse(statusCode);

      expectSimple(err, {
        statusCode,
        message: getReasonPhrase(statusCode),
        context: {},
      });
    });

    it('should construct an instance given a status and message', function () {
      const statusCode = 205;
      const message = 'My error message';
      const err = new HttpErrorResponse(statusCode, message);

      expectSimple(err, {
        statusCode,
        message,
        context: {},
      });
    });

    it('should construct an instance given a statusCode, message and context', function () {
      const statusCode = 205;
      const message = 'My error message';
      const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
      const err = new HttpErrorResponse(statusCode, message, context);

      expectSimple(err, {
        statusCode,
        message,
        context,
      });
    });

    it('should handle erroneous HTTP statuses', function () {
      const statusCode = 2615251;
      const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
      const err = new HttpErrorResponse(statusCode, undefined, context);

      expectSimple(err, {
        statusCode,
        message: `${statusCode}`,
        context,
      });
    });
  });

  describe('HttpErrorResponseCausedBy Test', function () {
    it('should construct an instance', function () {
      const statusCode = 205;
      const message = 'My error message';
      const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
      const err = new HttpErrorResponseCausedBy(rootCause, statusCode, message, context);

      const expectedCtx = { ...context, rootCause };
      expect(err.statusCode).toEqual(statusCode);
      expect(err.message).toEqual(message);
      expect(err.context).toEqual(expectedCtx);
      expect(err.sentRequest()).toEqual(true);
      expect(err.receivedResponse()).toEqual(true);
      expect(err.toJSON()).toMatchObject({
        statusCode,
        message,
        context: expectedCtx,
      });
    });
  });

  describe('BadRequest Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorBadRequest, StatusCodes.BAD_REQUEST);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorBadRequest, StatusCodes.BAD_REQUEST);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorBadRequestCausedBy, StatusCodes.BAD_REQUEST);
    });
  });

  describe('Unauthorized Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorUnauthorized, StatusCodes.UNAUTHORIZED);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorUnauthorized, StatusCodes.UNAUTHORIZED);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorUnauthorizedCausedBy, StatusCodes.UNAUTHORIZED);
    });
  });

  describe('Forbidden Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorForbidden, StatusCodes.FORBIDDEN);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorForbidden, StatusCodes.FORBIDDEN);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorForbiddenCausedBy, StatusCodes.FORBIDDEN);
    });
  });

  describe('NotFound Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorNotFound, StatusCodes.NOT_FOUND);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorNotFound, StatusCodes.NOT_FOUND);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorNotFoundCausedBy, StatusCodes.NOT_FOUND);
    });
  });

  describe('MethodNotAllowed Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorMethodNotAllowed, StatusCodes.METHOD_NOT_ALLOWED);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorMethodNotAllowed, StatusCodes.METHOD_NOT_ALLOWED);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorMethodNotAllowedCausedBy, StatusCodes.METHOD_NOT_ALLOWED);
    });
  });

  describe('NotAcceptable Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorNotAcceptable, StatusCodes.NOT_ACCEPTABLE);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorNotAcceptable, StatusCodes.NOT_ACCEPTABLE);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorNotAcceptableCausedBy, StatusCodes.NOT_ACCEPTABLE);
    });
  });

  describe('RequestTimeout Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorRequestTimeout, StatusCodes.REQUEST_TIMEOUT);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorRequestTimeout, StatusCodes.REQUEST_TIMEOUT);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorRequestTimeoutCausedBy, StatusCodes.REQUEST_TIMEOUT);
    });
  });

  describe('Conflict Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorConflict, StatusCodes.CONFLICT);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorConflict, StatusCodes.CONFLICT);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorConflictCausedBy, StatusCodes.CONFLICT);
    });
  });

  describe('Gone Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorGone, StatusCodes.GONE);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorGone, StatusCodes.GONE);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorGoneCausedBy, StatusCodes.GONE);
    });
  });

  describe('Unprocessable Entity Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorUnprocessableEntity, StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorUnprocessableEntity, StatusCodes.UNPROCESSABLE_ENTITY);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorUnprocessableEntityCausedBy, StatusCodes.UNPROCESSABLE_ENTITY);
    });
  });

  describe('TooManyRequests Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorTooManyRequests, StatusCodes.TOO_MANY_REQUESTS);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorTooManyRequests, StatusCodes.TOO_MANY_REQUESTS);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorTooManyRequestsCausedBy, StatusCodes.TOO_MANY_REQUESTS);
    });
  });

  describe('InternalServerError Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorInternalServerError, StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorInternalServerError, StatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorInternalServerErrorCausedBy, StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe('NotImplemented Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorNotImplemented, StatusCodes.NOT_IMPLEMENTED);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorNotImplemented, StatusCodes.NOT_IMPLEMENTED);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorNotImplementedCausedBy, StatusCodes.NOT_IMPLEMENTED);
    });
  });

  describe('BadGateway Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorBadGateway, StatusCodes.BAD_GATEWAY);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorBadGateway, StatusCodes.BAD_GATEWAY);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorBadGatewayCausedBy, StatusCodes.BAD_GATEWAY);
    });
  });

  describe('ServiceUnavailable Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorServiceUnavailable, StatusCodes.SERVICE_UNAVAILABLE);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorServiceUnavailable, StatusCodes.SERVICE_UNAVAILABLE);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorServiceUnavailableCausedBy, StatusCodes.SERVICE_UNAVAILABLE);
    });
  });

  describe('GatewayTimeout Test', function () {
    it('can construct an instance', function () {
      testResponseErrorType(HttpErrorGatewayTimeout, StatusCodes.GATEWAY_TIMEOUT);
    });

    it('can be constructed via factory', function () {
      testResponseErrorViaFactory(HttpErrorGatewayTimeout, StatusCodes.GATEWAY_TIMEOUT);
    });

    it('can construct a caused-by instance', function () {
      testResponseCausedBy(HttpErrorGatewayTimeoutCausedBy, StatusCodes.GATEWAY_TIMEOUT);
    });
  });

  describe('HttpErrorSendRequestFailed Test', function () {
    it('can construct an instance', function () {
      const message = 'My error message';
      const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
      const err = new HttpErrorSendRequestFailed(message, context);

      expect(err.message).toEqual(message);
      expect(err.context).toEqual(context);
      expect(err.sentRequest()).toEqual(false);
      expect(err.receivedResponse()).toEqual(false);
      expect(err.toJSON()).toEqual({ message, context });
    });
  });

  describe('HttpErrorSendRequestFailedCausedBy Test', function () {
    it('can construct an instance', function () {
      const message = 'My error message';
      const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
      const err = new HttpErrorSendRequestFailedCausedBy(rootCause, message, context);

      const expectedCtx = { ...context, rootCause };
      expect(err.message).toEqual(message);
      expect(err.context).toEqual(expectedCtx);
      expect(err.sentRequest()).toEqual(false);
      expect(err.receivedResponse()).toEqual(false);
      expect(err.toJSON()).toMatchObject({
        message,
        context: expectedCtx,
      });
    });
  });

  describe('HttpErrorReceiveResponseFailed Test', function () {
    it('can construct an instance', function () {
      const message = 'My error message';
      const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
      const err = new HttpErrorReceiveResponseFailed(message, context);

      expect(err.message).toEqual(message);
      expect(err.context).toEqual(context);
      expect(err.sentRequest()).toEqual(true);
      expect(err.receivedResponse()).toEqual(false);
      expect(err.toJSON()).toEqual({ message, context });
    });
  });

  describe('HttpFailedToReceiveResponseErrorCausedByTest', function () {
    it('can construct an instance', function () {
      const message = 'My error message';
      const context = { name: 'Mary', age: 27, attrs: { height: 182, weight: 71 } };
      const err = new HttpErrorReceiveResponseFailedCausedBy(rootCause, message, context);

      const expectedCtx = { ...context, rootCause };
      expect(err.message).toEqual(message);
      expect(err.context).toEqual(expectedCtx);
      expect(err.sentRequest()).toEqual(true);
      expect(err.receivedResponse()).toEqual(false);
      expect(err.toJSON()).toMatchObject({
        message,
        context: expectedCtx,
      });
    });
  });

  describe('HttpErrorFactory Test', function () {
    const message = 'Something went wrong';
    it('can handle getting something other than an error', function () {
      const text = 'this is a message';
      const err = HttpErrorFactory.fromAxios(text);
      expect(err).toBeInstanceOf(HttpError);
      expect(err.message).toMatch(new RegExp(`Unknown HTTP error.*${text}`));
    });

    it('can handle a non-Axios error', function () {
      const rawErr = new Error(message);
      const err = HttpErrorFactory.fromAxios(rawErr);
      expect(err).toBeInstanceOf(HttpError);
      expect(err.message).toMatch(new RegExp(`Unknown HTTP error.*${message}`));
    });

    it('can handle an Axios error with no request', function () {
      const axiosErr: Partial<AxiosError> = { isAxiosError: true, message };
      const err = HttpErrorFactory.fromAxios(axiosErr);
      expect(err).toBeInstanceOf(HttpErrorSendRequestFailed);
      expect(err.message).toEqual(message);
    });

    it('can handle an Axios error with no response', function () {
      const axiosErr: Partial<AxiosError> = { isAxiosError: true, message, request: {} };
      const err = HttpErrorFactory.fromAxios(axiosErr);
      expect(err).toBeInstanceOf(HttpErrorReceiveResponseFailed);
      expect(err.message).toEqual(message);
    });

    it('can handle an erroneous status', function () {
      const statusCode = 2615251;
      const response: any = { status: statusCode };
      const axiosErr: Partial<AxiosError> = { isAxiosError: true, message, request: {}, response };
      const err = HttpErrorFactory.fromAxios(axiosErr);
      expect(err).toBeInstanceOf(HttpErrorResponse);
      expect(err.message).toEqual(message);
      expect((err as HttpErrorResponse).statusCode).toEqual(statusCode);
    });
  });
});

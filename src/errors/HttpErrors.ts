import { StatusCodes, getReasonPhrase } from '../3rd-party/http-status-codes/index.js';
import { AxiosError, isAxiosError } from '../3rd-party/axios/index.js';

import { KoolieError, CausedBy } from './KoolieError.js';
import type { ErrorContext } from './KoolieError.js';

/** Base class of all HTTP errors */
export class HttpError extends KoolieError {
  /**
   * Determine if the HTTP request was sent
   *
   * @returns true if the HTTP request was sent
   */
  public sentRequest(): boolean {
    // By default, assume the request was not sent
    return false;
  }

  /**
   * Determine if an HTTP response was received
   *
   * @returns true if an HTTP response was received
   */
  public receivedResponse(): boolean {
    // By default, assume the response was not received
    return false;
  }
}

/** Base class of all HTTP error responses */
export class HttpErrorResponse extends HttpError {
  /**
   * Constructor
   *
   * @param statusCode - the HTTP status code in the response
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(
    public statusCode: number,
    message?: string,
    context?: ErrorContext
  ) {
    try {
      message = message ?? getReasonPhrase(statusCode);
    } catch (_err: any) {
      message = `${statusCode}`;
    }

    super(message, context);
  }

  /**
   * Convert the error to its JSON equivalent
   *
   * @returns the JSON equivalent of the error
   */
  public toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
    };
  }
  /**
   * Determine if the HTTP request was sent
   *
   * @returns true if the HTTP request was sent
   */
  public sentRequest(): boolean {
    return true;
  }

  /**
   * Determine if an HTTP response was received
   *
   * @returns true if an HTTP response was received
   */
  public receivedResponse(): boolean {
    return true;
  }
}

/** An HTTP error response caused by another error */
export class HttpErrorResponseCausedBy extends CausedBy(HttpErrorResponse) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param statusCode - the HTTP status code in the response
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, statusCode: number, message?: string, context?: ErrorContext) {
    super(statusCode, message, context);
    this.captureCause(cause);
  }
}

/** Bad Request error (400) */
export class HttpErrorBadRequest extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param details - optional details about the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.BAD_REQUEST, message, context);
  }
}

/** Bad Request error (400) caused by another error */
export class HttpErrorBadRequestCausedBy extends CausedBy(HttpErrorBadRequest) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Unauthorized error (401) */
export class HttpErrorUnauthorized extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.UNAUTHORIZED, message, context);
  }
}

/** Unauthorized error (401) caused by another error */
export class HttpErrorUnauthorizedCausedBy extends CausedBy(HttpErrorUnauthorized) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Forbidden error (403) */
export class HttpErrorForbidden extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.FORBIDDEN, message, context);
  }
}

/** Forbidden error (403) caused by another error */
export class HttpErrorForbiddenCausedBy extends CausedBy(HttpErrorForbidden) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Not Found error (404) */
export class HttpErrorNotFound extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.NOT_FOUND, message, context);
  }
}

/** Not Found error (404) caused by another error */
export class HttpErrorNotFoundCausedBy extends CausedBy(HttpErrorNotFound) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Method Not Allowed error (405) */
export class HttpErrorMethodNotAllowed extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.METHOD_NOT_ALLOWED, message, context);
  }
}

/** Method Not Allowed error (405) caused by another error */
export class HttpErrorMethodNotAllowedCausedBy extends CausedBy(HttpErrorMethodNotAllowed) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Not Acceptable error (406) */
export class HttpErrorNotAcceptable extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.NOT_ACCEPTABLE, message, context);
  }
}

/** Not Acceptable error (406) caused by another error */
export class HttpErrorNotAcceptableCausedBy extends CausedBy(HttpErrorNotAcceptable) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Proxy Authentication Required error (407) */
export class HttpErrorProxyAuthenticationError extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.PROXY_AUTHENTICATION_REQUIRED, message, context);
  }
}

/** Proxy Authentication Required error (407) caused by another error */
export class HttpErrorProxyAuthenticationErrorCausedBy extends CausedBy(HttpErrorProxyAuthenticationError) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Request Timeout error (408) */
export class HttpErrorRequestTimeout extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.REQUEST_TIMEOUT, message, context);
  }
}

/** Request timeout error (408) caused by another error */
export class HttpErrorRequestTimeoutCausedBy extends CausedBy(HttpErrorRequestTimeout) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Conflict error (409) */
export class HttpErrorConflict extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.CONFLICT, message, context);
  }
}

/** Conflict error (409) caused by another error */
export class HttpErrorConflictCausedBy extends CausedBy(HttpErrorConflict) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Gone error (410) */
export class HttpErrorGone extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.GONE, message, context);
  }
}

/** Gone error (410) caused by another error */
export class HttpErrorGoneCausedBy extends CausedBy(HttpErrorGone) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Unprocessable Entity error (422) */
export class HttpErrorUnprocessableEntity extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.UNPROCESSABLE_ENTITY, message, context);
  }
}

/** Unprocessable Entity error (422) caused by another error */
export class HttpErrorUnprocessableEntityCausedBy extends CausedBy(HttpErrorUnprocessableEntity) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Too Many Requests error (429) */
export class HttpErrorTooManyRequests extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.TOO_MANY_REQUESTS, message, context);
  }
}

/** Too many requests error (429) caused by another error */
export class HttpErrorTooManyRequestsCausedBy extends CausedBy(HttpErrorTooManyRequests) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Internal Server Error error (500) */
export class HttpErrorInternalServerError extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message, context);
  }
}

/** Internal Server Error (500) caused by another error */
export class HttpErrorInternalServerErrorCausedBy extends CausedBy(HttpErrorInternalServerError) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Not Implemented error (501) */
export class HttpErrorNotImplemented extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.NOT_IMPLEMENTED, message, context);
  }
}

/** Not Implemented error (501) caused by another error */
export class HttpErrorNotImplementedCausedBy extends CausedBy(HttpErrorNotImplemented) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Bad Gateway error (502) */
export class HttpErrorBadGateway extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.BAD_GATEWAY, message, context);
  }
}

/** Bad Gateway error (502) caused by another error */
export class HttpErrorBadGatewayCausedBy extends CausedBy(HttpErrorBadGateway) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Service Unavailable error (503) */
export class HttpErrorServiceUnavailable extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.SERVICE_UNAVAILABLE, message, context);
  }
}

/** Service Unavailable error (503) caused by another error */
export class HttpErrorServiceUnavailableCausedBy extends CausedBy(HttpErrorServiceUnavailable) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** Gateway Timeout error (504) */
export class HttpErrorGatewayTimeout extends HttpErrorResponse {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(message?: string, context?: ErrorContext) {
    super(StatusCodes.GATEWAY_TIMEOUT, message, context);
  }
}

/** Gateway Timeout error (504) caused by another error */
export class HttpErrorGatewayTimeoutCausedBy extends CausedBy(HttpErrorGatewayTimeout) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** An error that occurred due to an HTTP request not being successfully sent */
export class HttpErrorSendRequestFailed extends HttpError {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   * @param statusCode - a possible HTTP status code explaining the inability to
   * send the request
   */
  public constructor(
    message: string,
    context?: ErrorContext,
    public statusCode?: number
  ) {
    super(message, context);
  }
}

/** A failure to send an HTTP request caused by another error */
export class HttpErrorSendRequestFailedCausedBy extends CausedBy(HttpErrorSendRequestFailed) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   * @param statusCode - a possible HTTP status code explaining the inability to
   * send the request
   */
  public constructor(cause: Error, message: string, context?: ErrorContext, statusCode?: number) {
    super(message, context, statusCode);
    this.captureCause(cause);
  }
}

/** An error that occurred due to an HTTP response not being received */
export class HttpErrorReceiveResponseFailed extends HttpError {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   * @param statusCode - a possible HTTP status code explaining the inability to
   * receive a response
   */
  public constructor(
    message: string,
    context?: ErrorContext,
    public statusCode?: number
  ) {
    super(message, context);
  }

  /**
   * Determine if the HTTP request was sent
   *
   * @returns true if the HTTP request was sent
   */
  public sentRequest(): boolean {
    return true;
  }
}

/** A failure to receive an HTTP response caused by another error */
export class HttpErrorReceiveResponseFailedCausedBy extends CausedBy(HttpErrorReceiveResponseFailed) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context?: ErrorContext) {
    super(message, context);
    this.captureCause(cause);
  }
}

/** A factory that creates HttpError instances */
export class HttpErrorFactory {
  /**
   * Create an HttpError given an Axios error
   *
   * @param err - the Axios error
   * @returns an HttpError instance equivalent to the Axios error
   */
  static fromAxios(err: any): HttpError {
    const message = err.message ?? err.toString();

    // If the given error is not actually an Axios error then try to return
    // something sensible.
    if (!isAxiosError(err)) {
      return new HttpError(`Unknown HTTP error: ${message}`);
    }

    // If the request was sent, details should appear in the Axios error
    const axiosError: AxiosError = err;
    if (!axiosError.request) {
      return new HttpErrorSendRequestFailed(message, {
        context: {
          method: axiosError.config?.method,
          url: axiosError.config?.url,
        },
        statusCode: axiosError.code,
      });
    }

    // If there is no response property or no HTTP status present then assume no
    // response was received.
    if (!axiosError.response || axiosError.response.status === undefined) {
      return new HttpErrorReceiveResponseFailed(message, {
        context: {
          method: axiosError.config?.method,
          url: axiosError.config?.url,
        },
        statusCode: axiosError.code,
      });
    }

    return this.create(axiosError.response.status, message, {
      data: axiosError.response.data,
    });
  }

  /**
   * Create a meaningful error from an HTTP status code
   *
   * @param status - the HTTP status code
   * @param message - the error message
   * @param context - additional context around the error
   * @returns an equivalent HttpError instance
   */
  public static create(status: number, message?: string, context?: ErrorContext): HttpError {
    switch (status) {
      case StatusCodes.BAD_REQUEST:
        return new HttpErrorBadRequest(message, context);

      case StatusCodes.UNAUTHORIZED:
        return new HttpErrorUnauthorized(message, context);

      case StatusCodes.FORBIDDEN:
        return new HttpErrorForbidden(message, context);

      case StatusCodes.NOT_FOUND:
        return new HttpErrorNotFound(message, context);

      case StatusCodes.METHOD_NOT_ALLOWED:
        return new HttpErrorMethodNotAllowed(message, context);

      case StatusCodes.NOT_ACCEPTABLE:
        return new HttpErrorNotAcceptable(message, context);

      case StatusCodes.REQUEST_TIMEOUT:
        return new HttpErrorRequestTimeout(message, context);

      case StatusCodes.CONFLICT:
        return new HttpErrorConflict(message, context);

      case StatusCodes.GONE:
        return new HttpErrorGone(message, context);

      case StatusCodes.UNPROCESSABLE_ENTITY:
        return new HttpErrorUnprocessableEntity(message, context);

      case StatusCodes.TOO_MANY_REQUESTS:
        return new HttpErrorTooManyRequests(message, context);

      case StatusCodes.INTERNAL_SERVER_ERROR:
        return new HttpErrorInternalServerError(message, context);

      case StatusCodes.NOT_IMPLEMENTED:
        return new HttpErrorNotImplemented(message, context);

      case StatusCodes.BAD_GATEWAY:
        return new HttpErrorBadGateway(message, context);

      case StatusCodes.SERVICE_UNAVAILABLE:
        return new HttpErrorServiceUnavailable(message, context);

      case StatusCodes.GATEWAY_TIMEOUT:
        return new HttpErrorGatewayTimeout(message, context);

      default:
        return new HttpErrorResponse(status, message, context);
    }
  }
}

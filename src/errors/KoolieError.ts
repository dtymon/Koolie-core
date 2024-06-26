import util from 'node:util';

import { Constructor } from '../types/Constructor.js';

export type ErrorContext = Record<string, any>;

/** Base class for all Koolie errors */
export class KoolieError extends Error {
  /**
   * Constructor
   *
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(
    message: string,
    public context: ErrorContext = {}
  ) {
    super(message);
  }

  /**
   * Get the JSON representation of the error
   *
   * @returns the JSON representation of the error
   */
  public toJSON(): Record<string, any> {
    return {
      message: this.message,
      context: this.context,
    };
  }
}

/**
 * Captures the relationship when one error causes another. This is a mixin that
 * be used to extend errors to capture that causal relationship.
 */
export function CausedBy<T extends Constructor<KoolieError>>(ErrorType: T) {
  return class extends ErrorType {
    /**
     * Capture that this error was caused by another
     *
     * @param cause - error that caused this error
     */
    public captureCause(cause: Error): void {
      // ES2022 now provides a `cause` field for this very situation
      this.cause = cause;

      // If the error that caused this error is also a consequential then copy
      // its root cause. Otherwise, it will become the root cause.
      this.context.rootCause = cause instanceof KoolieError ? cause.context.rootCause || cause : cause;
    }

    /**
     * Get the full stack trace including that of the cause of this error
     *
     * @returns the full stack trace down to the root case
     */
    public getFullStack(): string {
      // prettier-ignore
      try {
        return util.inspect(this, { depth: null });
      }
      /* v8 ignore next 3 */
      catch (_err: any) {
        return this.toString();
      }
    }
  };
}

/** An error that was caused by some other error */
export class ConsequentialError extends CausedBy(KoolieError) {
  /**
   * Constructor
   *
   * @param cause - error that caused this error
   * @param message - the error message
   * @param context - additional context around the error
   */
  public constructor(cause: Error, message: string, context: ErrorContext = {}) {
    super(message, context);
    this.captureCause(cause);
  }
}

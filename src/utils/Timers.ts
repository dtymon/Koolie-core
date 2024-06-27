import { ProcessSingletonFactory } from '../process/ProcessSingletonFactory.js';
import { PromiseSettler, RejectSignature, ResolveSignature } from '../types/PromiseTypes.js';

/** The timer id returned by Koolie timers */
export type TimerId = number;

/** Base class of exceptions thrown by the timers library */
export class TimerException extends Error {}

/** If a timer is cancelled by a user then this error is thrown */
export class TimerCancelledByUser extends TimerException {
  /**
   * Constructor
   *
   * @param timerId - id of the timer that was cancelled
   */
  public constructor(public timerId?: TimerId) {
    super(`Timer was cancelled by the user`);
  }
}

/** If a timer is cancelled by the system then this error is thrown */
export class TimerCancelledBySystem extends TimerException {
  /**
   * Constructor
   *
   * @param timerId - id of the timer that was cancelled
   */
  public constructor(public timerId?: TimerId) {
    super(`Timer was automatically cancelled by the system`);
  }
}

/** The type of id returned by setTimeout() */
type SetTimeoutId = ReturnType<typeof setTimeout>;

/** The type of id returned by setImmediate() */
type SetImmediateId = ReturnType<typeof setImmediate>;

/** The kinds of supported system timers */
enum TimerKind {
  SET_TIMEOUT,
  SET_IMMEDIATE,
}

/** The state stored for setTimeout() timers */
interface SetTimeoutState {
  /** The kind of timer **/
  kind: TimerKind.SET_TIMEOUT;

  /** The id allocated by the system for the timer */
  systemId?: SetTimeoutId;
}

/** The state stored for setImmediate() timers */
interface SetImmediateState {
  /** The kind of timer **/
  kind: TimerKind.SET_IMMEDIATE;

  /** The id allocated by the system for the timer */
  systemId?: SetImmediateId;
}

/**
 * An extended promise returned from the timer functions that provides the
 * ability to cancel the associated timer, resulting in the promise being
 * rejected.
 *
 * For once-off timers, the promise will return the result of executing the body
 * when resolved. For periodic timers, the promise will not return any value
 * when resolved.
 */
export class TimerPromise<T = void> extends Promise<T> {
  /**
   * Constructor
   *
   * @param executor - the executor required by the underlying promise
   * @param id - the id of the timer associated with this promise
   */
  public constructor(
    executor: (resolve: ResolveSignature<T>, reject: RejectSignature) => void,
    private id?: TimerId
  ) {
    super(executor);
  }

  /** Set the species of the class to be a Promise */
  static get [Symbol.species]() {
    return Promise;
  }

  /**
   * Get the id of the associated timer
   *
   * @returns the id of the timer
   */
  public get timerId(): TimerId | undefined {
    return this.id;
  }

  /** Cancel the timer that this promise is associated with */
  public cancel(): void {
    Timers.cancel(this.timerId);
  }
}

/** The state maintained for each timer that has been set */
interface TimerState {
  /** The msecs that this timer is to be delayed for */
  msecs: number;

  /** True if this timer is immune to system shutdowns */
  durable: boolean;

  /** System state associated with the timer */
  state: SetTimeoutState | SetImmediateState;

  /** Used to resolve or reject the timer's promise */
  settler?: PromiseSettler<any>;
}

/** A process-wide singleton used to create and control timers */
export class TimersSingleton {
  /** Last timer id allocated by the singleton */
  private lastTimerId: TimerId = 0;

  /** Timers that are currently in progress keyed on their timer id */
  private timers: Map<TimerId, TimerState> = new Map();

  /** Set of ids of active periodic timers **/
  private periodicTimers: Set<TimerId> = new Set();

  /** True if the system is shutting down */
  private shuttingDown = false;

  /**
   * Find the timer state associated with the given id
   *
   * @param timerId - the id of the timer of interest
   * @returns the timer state if found else undefined
   */
  public find(timerId?: TimerId): TimerState | undefined {
    return timerId === undefined ? undefined : this.timers.get(timerId);
  }

  /**
   * Introduce a delay in the execution
   *
   * @param msecs - the size of the delay
   * @param durable - if true, the timer will ignore shutdown requests
   * @returns a timer promise that can be used to cancel the timer
   */
  public delay(msecs: number, durable = false): TimerPromise<void> {
    return this.once(msecs, () => {}, durable);
  }

  /**
   * Start a once-off timer that will execute a body after a given delay
   *
   * @param msecs - number of msecs to delay before executing the body
   * @param body - body to execute once timer completes
   * @param durable - if true, the timer will ignore shutdown requests
   * @returns a timer promise that can be used to cancel the timer
   */
  public once<T>(msecs: number, body: () => T, durable = false): TimerPromise<T> {
    const timerId = ++this.lastTimerId;
    return this.addTimerImpl(TimerKind.SET_TIMEOUT, timerId, msecs, body, durable);
  }

  /**
   * Schedule a job to execute the given body on the next iteration of the event
   * loop.
   *
   * @param body - body to execute in the next event loop
   * @param durable - if true, the timer will ignore shutdown requests
   * @returns a timer promise that can be used to cancel the timer
   */
  public immediate<T>(body: () => T, durable = false): TimerPromise<T> {
    const timerId = ++this.lastTimerId;
    return this.addTimerImpl(TimerKind.SET_IMMEDIATE, timerId, 0, body, durable);
  }

  /**
   * Start a periodic timer that will execute the body at regular periodic
   * intervals. Care is taken to try to minimise clock skew to keep the
   * frequency as regular as possible.
   *
   * @param msecs - the frequency of the periodic timer
   * @param body - the body to execute on each iteration of the timer
   * @param firstExecutedAt - when the body was first executed (if at all)
   * @returns a timer promise that can be used to cancel the timer
   */
  public periodic(msecs: number, body: () => any, firstExecutedAt?: bigint | undefined): TimerPromise<void> {
    // Add to the set of periodic timers. If the timer id gets removed from this
    // set then it means that the caller has cancelled the periodic timer.
    const timerId = ++this.lastTimerId;
    this.periodicTimers.add(timerId);
    return new TimerPromise((_resolve, reject) => {
      // Continually schedule and execute the body at the required frequency
      // until the periodic timer is cancelled via rejection.
      this.scheduleAndExecutePeriodically(timerId, msecs, body, firstExecutedAt).catch((err) => {
        // The periodic timer has been cancelled
        this.periodicTimers.delete(timerId);
        reject(err);
      });
    }, timerId);
  }

  /**
   * Immediately invoke the given body and then start a periodic timer that will
   * continue to execute it at regular periodic intervals. Care is taken to try
   * to minimise clock skew to keep the frequency as regular as possible.
   *
   * @param msecs - the frequency of the periodic timer
   * @param body - the body to execute on each iteration of the timer
   * @returns a timer promise that can be used to cancel the timer
   */
  public periodicWithImmediateFire(msecs: number, body: () => any): TimerPromise<void> {
    // Cannot start a periodic timer when shutting down
    const timerId = ++this.lastTimerId;
    if (this.shuttingDown) {
      return new TimerPromise((_resolve, reject) => reject(new TimerCancelledBySystem(timerId)), timerId);
    }

    this.periodicTimers.add(timerId);
    return new TimerPromise((_resolve, reject) => {
      const bodyExecuter = async () => {
        // Swallow any non-timer exceptions the body throws as they need to be
        // caught and handled in the body itself.
        try {
          await body();
        } catch (err: any) {
          if (err instanceof TimerException) {
            this.periodicTimers.delete(timerId);
            throw err;
          }
        }
      };

      // Execute the body immediately before executing it periodically at the
      // required frequency
      const firstRunAt = process.hrtime.bigint();
      bodyExecuter()
        .then(() => this.periodic(msecs, body, firstRunAt))
        .catch(reject);
    }, timerId);
  }

  /**
   * Schedules the next trigger of a periodic timer, waits for that time to
   * elapse and then executes the body. Note that any exceptions thrown when the
   * body is executed are swallowed and ignored with the periodic timer
   * continuing execution. If exceptions are important then they need to be
   * caught and handled in the body itself.
   *
   * @param timerId - the id allocated to the timer
   * @param msecs - the frequency of the periodic timer
   * @param body - the body to execute on each iteration of the timer
   * @param firstExecutedAt - when the body was first executed (if at all)
   * @returns after the body is executed or rejects if the timer is cancelled
   */
  private async scheduleAndExecutePeriodically(
    timerId: TimerId,
    msecs: number,
    body: () => any,
    firstExecutedAt?: bigint | undefined
  ): Promise<void> {
    // Cannot start a periodic timer when shutting down
    if (this.shuttingDown) {
      return Promise.reject(new TimerCancelledBySystem(timerId));
    }

    // If the timer is no longer in the set of periodic timers then it has been
    // cancelled by the user. This should not really be possible.
    if (!this.periodicTimers.has(timerId)) {
      return Promise.reject(new TimerCancelledByUser(timerId));
    }

    // Convert the frequency from msecs to nsecs
    const nsecs = BigInt(msecs * 1000000);

    // This will updated to denote when the next execution should be done. It
    // will be based on when the last
    let executeAt = firstExecutedAt === undefined ? process.hrtime.bigint() : firstExecutedAt;

    // This promise will be resolved once the periodic timer has been
    // cancelled, or more correctly, it will be rejected when it is cancelled.
    return new Promise((_resolve, reject) => {
      /**
       * Computes when next execution of the body should occur and schedules
       * it.
       */
      const delayThenExecuteBody = async () => {
        // Workout when the next expiry of the timer should be. Even though we
        // are scheduling a periodic timer, we still use setTimeout() rather
        // than setInterval() to avoid cumulative clock skew.
        //
        // Always attempt to trigger on the period frequency boundaries so add
        // the delta on the previous expiry time.
        //
        // It is possible for the expiry time to be ahead of the current time
        // due to services like NTP making micro adjustments to it. However, we
        // always want the next timer to be at least one period later than the
        // previous one regardless of the current system time.
        executeAt += nsecs;

        // Then keep adding multiples of the frequency to the expiry time until
        // it is ahead of the current time in case we have had timer overrun in
        // the previous trigger.
        const now = process.hrtime.bigint();
        while (executeAt <= now) {
          executeAt += nsecs;
        }

        // Workout how long needs to elapse before firing the timer, converting
        // nsecs to msecs.
        const delta = executeAt - now;
        const msecsUntilNextTrigger = Number(delta) / 1000000;
        try {
          // Insert the delay before the next execution. Periodic timers are
          // never durable.
          const durable = false;
          await this.addTimerImpl(TimerKind.SET_TIMEOUT, timerId, msecsUntilNextTrigger, () => {}, durable);
        } catch (err: any) {
          // The only exceptions that can be thrown by delay() are those to
          // cancel the timer. These should be passed back to the caller by
          // rejecting the promise.
          reject(err);
          return;
        }

        // Time to execute the body. Swallow non-timer related exceptions as
        // they need to be caught in the body itself.
        try {
          await body();
        } catch (err: any) {
          // Propagate timer cancellation exceptions to the caller
          if (err instanceof TimerException) {
            reject(err);
            return;
          }
        }

        // At this point, the body has been executed and the timer has not been
        // cancelled so we should schedule the next iteration. Perform that at
        // the start of the next event loop. This is safe because no exceptions
        // are thrown in this function. They are all caught and propagated to
        // the caller be rejecting the outer promise.
        //
        // However, we should not perform any more iterations of the periodic
        // timer if it has been cancelled.
        if (!this.periodicTimers.has(timerId)) {
          reject(new TimerCancelledByUser(timerId));
        } else {
          // Schedule the next iteration
          setTimeout(delayThenExecuteBody, 0);
        }
      };

      // Schedule the first invocation of the periodic timer
      delayThenExecuteBody();
    });
  }

  /**
   * Cancel a timer given its id
   *
   * @param timerId - the id of the timer to cancel
   * @param reason - reason why the timer is being cancelled
   */
  public cancel(timerId: TimerId | undefined, reason?: Error) {
    // Ignore if we didn't get a valid timer id
    if (timerId === undefined) {
      return;
    }

    // Ensure it is no longer listed as a periodic timer
    this.periodicTimers.delete(timerId);

    // Attempt to remove the entry for the timer
    const entry = this.timers.get(timerId);
    if (entry !== undefined) {
      this.timers.delete(timerId);

      // First stop the system timer
      if (entry.state.systemId !== undefined) {
        switch (entry.state.kind) {
          case TimerKind.SET_TIMEOUT:
            clearTimeout(entry.state.systemId);
            break;

          case TimerKind.SET_IMMEDIATE:
            clearImmediate(entry.state.systemId);
            break;
        }

        entry.state.systemId == undefined;
      }

      // Reject the timer's promise to show that it was cancelled. Unless
      // specified otherwise, assume it is being cancelled by the user
      if (entry.settler !== undefined) {
        entry.settler.reject(reason ?? new TimerCancelledByUser(timerId));
      }
    }
  }

  /** Cancels all timers */
  public cancelAll() {
    this.periodicTimers.clear();
    for (const [timerId] of this.timers) {
      this.cancel(timerId, new TimerCancelledByUser(timerId));
    }
    this.timers.clear();
  }

  /**
   * Adds a new timer. The timer will wait for the given number of msecs before
   * executing the timer body. If the timer cannot be set or is interrupted then
   * the function throws an error.
   *
   * @param kind - the kind of timer to add
   * @param timerId - the id allocated to the timer
   * @param msecs - number of msecs to delay before executing the body
   * @param body - body to execute once timer completes
   * @param durable - if true, the timer will ignore shutdown requests
   * @returns a timer promise that can be used to cancel the timer
   */
  private addTimerImpl<T>(
    kind: TimerKind,
    timerId: TimerId,
    msecs: number,
    body: () => T,
    durable: boolean
  ): TimerPromise<T> {
    // Non-durable timers do not get added during a shutdown
    if (!durable && this.shuttingDown) {
      // Create a timer promise that is rejected immediately
      return new TimerPromise<T>((_resolve, reject) => reject(new TimerCancelledBySystem(timerId)), timerId);
    }

    // Add the timer to the list
    const timer: TimerState = { msecs, durable, state: { kind } };
    this.timers.set(timerId, timer);

    // Start the delay using the appropriate kind of timer
    return new TimerPromise<T>((resolve, reject) => {
      // Create the settler used to resolve this promise when the timer
      // completes or is cancelled.
      const settler = new PromiseSettler(resolve, reject);
      timer.settler = settler;

      // Define the body wrapper that will be executed when the timer expires
      const bodyWrapper = async () => {
        try {
          this.timers.delete(timerId);
          settler.resolve(await body());
        } catch (err: any) {
          settler.reject(err);
        }
      };

      // Start the appropriate kind of timer
      switch (kind) {
        case TimerKind.SET_TIMEOUT:
          timer.state.systemId = setTimeout(bodyWrapper, msecs);
          break;

        case TimerKind.SET_IMMEDIATE:
          timer.state.systemId = setImmediate(bodyWrapper);
          break;
      }
    }, timerId);
  }
}

export const Timers = ProcessSingletonFactory.get('/__koolie__/utils/Timers', TimersSingleton);

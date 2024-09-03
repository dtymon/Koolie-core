import { KoolieError } from '../errors/KoolieError.js';

/** Base class of all pipeline errors */
export class PipelineError extends KoolieError {}

/** Thrown when an attempt is made to write to a closed pipe */
export class PipelineErrorPipeIsClosed extends PipelineError {
  /**
   * Constructor
   *
   * @param pipeName - the name of the pipe
   */
  public constructor(pipeName: string) {
    super(`An attempt was made to write to a closed pipe`, { pipe: pipeName });
  }
}

/** Thrown when an attempt is made to close a source that is already closed */
export class PipelineErrorSourceAlreadyClosed extends PipelineError {
  /**
   * Constructor
   *
   * @param name - the name of the closed source
   */
  public constructor(name: string) {
    super(`Cannot close an already closed source`, { source: name });
  }
}

/** Thrown when an attempt is made to connect to an already connected source */
export class PipelineErrorSourceAlreadyConnected extends PipelineError {
  /**
   * Constructor
   *
   * @param pipeName - the name of the connected pipe
   * @param sinkName - the name of the sink trying to connect
   */
  public constructor(pipeName: string, sinkName: string) {
    super(`Cannot connect to an already connected source`, { pipe: pipeName, sink: sinkName });
  }
}

/** Thrown when an attempt is made to connect multiple sinks to a pipe */
export class PipelineErrorPipeAlreadyHasSink extends PipelineError {
  /**
   * Constructor
   *
   * @param pipe - the name of the pipe
   * @param sink - the name of the sink trying to connect
   */
  public constructor(pipe: string, sink: string) {
    super(`Cannot have more than one sink per pipe`, { pipe, sink });
  }
}

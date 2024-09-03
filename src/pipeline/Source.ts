import { Pipe } from './Pipe.js';
import {
  PipelineErrorPipeIsClosed,
  PipelineErrorSourceAlreadyClosed,
  PipelineErrorSourceAlreadyConnected,
} from './PipelineErrors.js';
import { PipelineNode, SinkNode, SourceNode } from './PipelineTypes.js';

/** The events emitted by the source */
export const SourceEvent = {
  CONNECTED: Symbol('connected'),
  CLOSED: Symbol('closed'),
};

/**
 * Called when a sink wishes to connect to a source's pipe
 *
 * @param pipe - the pipe to connect to
 * @param sink - the sink that wishes to connect
 */
export function sourceConnectImpl<T>(pipe: Pipe<T>, sink: SinkNode<T>) {
  // The source's pipe cannot be currently connected to another sink
  const sinkName = sink.getName();
  if (pipe.hasSink()) {
    throw new PipelineErrorSourceAlreadyConnected(pipe.getName(), sinkName);
  }

  pipe.connect(sinkName);
}

/**
 * Closes the write end of the pipe to signify no more data will be produced
 * by the source.
 *
 * @param name - the name of the source
 * @param pipe - the pipe to close
 */
export function sourceCloseImpl<T>(name: string, pipe: Pipe<T>) {
  if (pipe.isClosed()) {
    throw new PipelineErrorSourceAlreadyClosed(name);
  }

  pipe.close();
}

/**
 * Called when the source wishes to produce more data
 *
 * @param pipe - the pipe to use when producing
 * @param data - the data that has been produced
 * @returns when the data has been written to the pipe
 */
export function sourceProduceImpl<T>(pipe: Pipe<T>, data: T): Promise<void> {
  // It is not possible to produce data if the source has closed the pipe
  if (pipe.isClosed()) {
    throw new PipelineErrorPipeIsClosed(pipe.getName());
  }

  // This could block if there is a maximum backlog that has been reached
  return pipe.write(data);
}

/** A pipeline node that produces data of the given type */
export class Source<T> extends PipelineNode<T> implements SourceNode<T> {
  /**
   * Constructor
   *
   * @param name - the name assigned to the node
   * @param backlog - optional maximum number of items allowed to be queued
   */
  public constructor(name: string, backlog = 0) {
    super(name, new Pipe(name, backlog));
  }

  /**
   * Get the pipe that the source is producing data into
   *
   * @returns the pipe of the source
   */
  public getPipe(): Pipe<T> {
    return this.pipe;
  }

  /**
   * Called when a sink wishes to connect to this source
   *
   * @param sink - the sink that wishes to connect
   */
  public connect(sink: SinkNode<T>) {
    sourceConnectImpl(this.pipe, sink);
    this.emit(SourceEvent.CONNECTED, { source: this, sink });
  }

  /**
   * Closes the write end of the pipe to signify no more data will be produced
   * by the source.
   */
  public close() {
    sourceCloseImpl(this.name, this.pipe);
    this.emit(SourceEvent.CLOSED, { source: this });
  }

  /**
   * Called when the source wishes to produce more data
   *
   * @param data - the data that has been produced
   * @returns when the data has been written to the pipe
   */
  public produce(data: T): Promise<void> {
    return sourceProduceImpl(this.pipe, data);
  }
}

import { EventEmitter } from 'node:events';

import { Pipe } from './Pipe.js';

/** The interface that all pipeline nodes support */
export interface Node {
  /**
   * Get the name of the node
   *
   * @returns the node's name
   */
  getName(): string;
}

/** A pipeline node that produces data of the given type */
export interface SourceNode<T> extends Node {
  /**
   * Get the pipe that the source is producing data into
   *
   * @returns the pipe of the source
   */
  getPipe(): Pipe<T>;

  /**
   * Called when a sink wishes to connect to the source
   *
   * @param sink - the sink that wishes to connect
   */
  connect(sink: SinkNode<T>): void;

  /** Called when no more data will be produced by the source */
  close(): void;

  /**
   * Called when more data has been produced. The source must be connected when
   * producing data.
   *
   * @param data - the data produced
   */
  produce(data: T): Promise<void>;
}

/** A pipeline node that ingests data of the given type */
export interface SinkNode<T> extends Node {
  /** Disconnect the current sink from its source */
  disconnect(): void;

  /**
   * Called to consume data from the source.
   *
   * @returns the data consumed or undefined if the source is exhausted
   */
  consume(): Promise<T | undefined>;

  /** Called when the sink has consumed all data produced by the source */
  onEnd(): void | Promise<void>;

  /**
   * Called when the sink has consumed data from the source
   *
   * @param data - the data consumed
   */
  onData(data: T): void | Promise<void>;
}

/** Base class of all pipeline nodes */
export class PipelineNode<T> extends EventEmitter {
  /**
   * Constructor
   *
   * @param name - the name assigned to the node
   * @param pipe - pipe connecting this node to its peer in the pipeline
   */
  public constructor(
    protected name: string,
    protected pipe: Pipe<T>
  ) {
    super();
  }

  /**
   * Get the name of the node
   *
   * @returns the node's name
   */
  public getName(): string {
    return this.name;
  }
}

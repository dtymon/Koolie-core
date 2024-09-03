import { Pipe } from './Pipe.js';
import { Sink } from './Sink.js';
import { SinkNode, SourceNode } from './PipelineTypes.js';
import { SourceEvent, sourceCloseImpl, sourceConnectImpl, sourceProduceImpl } from './Source.js';

/** A pipeline node that consumes type T and transforms it to produce type U */
export abstract class Transform<T, U = T> extends Sink<T> implements SourceNode<U> {
  /** The pipe where transformed data is written to */
  protected transformedPipe: Pipe<U>;

  /**
   * Constructor
   *
   * @param name - the name assigned to the node
   * @param source - the source to consume data from
   * @param backlog - optional maximum number of items allowed to be queued
   */
  public constructor(
    name: string,
    protected source: SourceNode<T>,
    backlog = 0
  ) {
    super(name, source);
    this.transformedPipe = new Pipe(name, backlog);
  }

  /**
   * Get the pipe that the source is producing data into
   *
   * @returns the pipe of the source
   */
  public getPipe(): Pipe<U> {
    return this.transformedPipe;
  }

  /**
   * Called when a sink wishes to connect to this source
   *
   * @param sink - the sink that wishes to connect
   */
  public connect(sink: SinkNode<U>) {
    sourceConnectImpl(this.transformedPipe, sink);
    this.emit(SourceEvent.CONNECTED, { source: this, sink });
  }

  /**
   * Closes the write end of the pipe to signify no more data will be produced
   * by the source.
   */
  public close() {
    sourceCloseImpl(this.name, this.transformedPipe);
    this.emit(SourceEvent.CLOSED, { source: this });
  }

  /**
   * Called when the source wishes to produce more data
   *
   * @param data - the data that has been produced
   * @returns when the data has been written to the pipe
   */
  public produce(data: U): Promise<void> {
    return sourceProduceImpl(this.transformedPipe, data);
  }

  /** Called when the sink has consumed all data produced by the source */
  public onEnd(): void | Promise<void> {
    // Since the transform's source is exhausted, this means that the transform
    // is also now exhausted.
    if (!this.transformedPipe.isClosed()) {
      this.transformedPipe.close();
    }
  }

  /**
   * Called when the sink has consumed data from the source
   *
   * @param data - the data consumed
   */
  public async onData(data: T): Promise<void> {
    // Transform the consumed data and produce the result
    const transformed = await this.transform(data);
    if (transformed !== undefined) {
      return this.produce(transformed);
    }
  }

  /**
   * The transformation function. If it returns undefined then the consumed data
   * will be dropped.
   *
   * @param input - the input data to be transformed
   * @returns the transformed data or undefined to drop the data
   */
  public abstract transform(data: T): undefined | U | Promise<U | void>;
}

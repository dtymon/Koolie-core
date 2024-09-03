import { WorkQueue } from '../types/WorkQueue.js';

import { PipelineErrorPipeIsClosed, PipelineErrorPipeAlreadyHasSink } from './PipelineErrors.js';

/**
 * A pipe connects a source and sink in the pipeline allowing instances of the
 * given type to pass from source to sink.
 *
 * The pipe is notionally "owned" by the source such that a source cannot
 * disconnect from its pipe. It can however close the pipe to signify that it
 * will not be producing any more data.
 *
 * A sink can connect to the pipe to consume the source's data. It can
 * disconnect at any stage, allowing another sink to connect to the pipe if it
 * is still open and all data has not been exhausted.
 */
export class Pipe<T> {
  /** The name of the source connected to the pipe, if any */
  protected sourceName: string;

  /** The name of the sink connected to the pipe, if any */
  protected sinkName?: string;

  /** The queue of data written to the pipe but not yet read */
  protected queue: WorkQueue<T>;

  /** True if a sink is connected to the pipe */
  protected sinkConnected = false;

  /**
   * Constructor. Instances are created by a source and they are created in a
   * disconnected state, that is, there is no sink attached. This is to allow a
   * source to start producing data before a sink has been connected to it. The
   * pipe allows that data to be buffered, possibly capped to some backlog
   * limit, while there is no sink consuming.
   *
   * @param sourceName - name of the producer for the pipe
   * @param backlog - optional maximum number of items allowed to be queued
   */
  public constructor(sourceName: string, backlog = 0) {
    this.sourceName = sourceName;
    this.queue = new WorkQueue(backlog);
  }

  /**
   * Get the name of the pipe
   *
   * @returns the pipe's name
   */
  public getName(): string {
    const sourceName = `${this.sourceName}${!this.isClosed() ? '[closed]' : ''}`;
    return `${sourceName}|${this.sinkName ?? '[none]'}`;
  }

  /**
   * Determine if the pipe has a sink
   *
   * @returns true if a sink is connected
   */
  public hasSink(): boolean {
    return this.sinkConnected;
  }

  /**
   * Connect a sink to the pipe
   *
   * @param sinkName - name of the sink to connect
   */
  public connect(sinkName: string) {
    // A pipe can only have one sink
    if (this.sinkConnected) {
      throw new PipelineErrorPipeAlreadyHasSink(this.getName(), sinkName);
    }

    this.sinkConnected = true;
    this.sinkName = sinkName;
  }

  /** Disconnect the current sink from the pipe */
  public disconnect() {
    this.sinkConnected = false;
    this.sinkName = undefined;
  }

  /** Close the write end of the pipe so that no more data can be produced */
  public close() {
    this.queue.close();
  }

  /**
   * Determine if the pipe is closed
   *
   * @returns true if the pipe is closed
   */
  public isClosed() {
    return this.queue.isClosed();
  }

  /**
   * Write data into the pipe
   *
   * @params data - the data to be written
   * @returns when the data has been written to the pipe
   */
  public write(data: T): Promise<void> {
    // It is not possible to write to a closed pipe
    if (this.queue.isClosed()) {
      throw new PipelineErrorPipeIsClosed(this.getName());
    }

    return this.queue.produce(data);
  }

  /**
   * Read data from the pipe
   *
   * @returns the next instance of the data type read from the pipe or undefined
   * if no data arrived before the pipe was closed.
   */
  public read(): Promise<T | undefined> {
    // This is performed even if the write end has been closed as there may
    // still be data remaining in the pipe. If there is no data remaining then
    // it will return undefined if the pipe has been closed or wait for data to
    // arrive otherwise.
    return this.queue.consume();
  }
}

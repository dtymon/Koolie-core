import { PipelineNode, SinkNode, SourceNode } from './PipelineTypes.js';

/** The events emitted by the sink */
export const SinkEvent = {
  END: Symbol('end'),
  DATA: Symbol('data'),
};

/**
 * A pipeline node that consumes data of the given type. A sink can operate in
 * one of two modes:
 *
 *   manual - explicitly consume one event at a time by calling consume()
 *   auto - calling run() and generating events each time something is consumed
 */
export class Sink<T> extends PipelineNode<T> implements SinkNode<T> {
  /** True if the sink is running in auto mode */
  protected running = false;

  /**
   * Constructor
   *
   * @param name - the name assigned to the node
   * @param source - the source to consume data from
   */
  public constructor(
    name: string,
    protected source: SourceNode<T>
  ) {
    super(name, source.getPipe());
    source.connect(this);
  }

  /** Disconnect the sink from its pipe */
  public disconnect() {
    this.pipe.disconnect();
  }

  /** Called when the sink has consumed all data produced by the source */
  public onEnd(): void | Promise<void> {
    // No-op by default
  }

  /**
   * Called when the sink has consumed data from the source
   *
   * @param data - the data consumed
   */
  public onData(_data: T): void | Promise<void> {
    // No-op by default
  }

  /**
   * Called to consume the next data event from the queue. Blocks until data
   * arrives or the source closes the pipe.
   *
   * @returns the data consumed or undefined if the source is exhausted
   */
  public async consume(): Promise<T | undefined> {
    const data = await this.pipe.read();
    if (data === undefined) {
      // The source has closed the pipe and all data has been consumed so emit
      // an event signifying this.
      this.emit(SinkEvent.END, { sink: this });
      await this.onEnd();
    } else {
      this.emit(SinkEvent.DATA, { sink: this, data });
      await this.onData(data);
    }
    return data;
  }

  /**
   * Put the sink into 'auto' mode where it will continually consume data and
   * emit events until it is stopped or the pipe is closed and exhausted.
   *
   * @returns when the pipe is closed or the loop has been explicitly stopped
   */
  public async run(): Promise<void> {
    this.running = true;
    while (this.running) {
      // Wait for data to arrive
      const data = await this.consume();
      if (data === undefined) {
        // All data has been consumed and the pipe has closed
        this.running = false;
      }
    }
  }

  /**
   * Called to stop the sink
   */
  public stop(): void {
    this.running = false;
  }
}

import * as Y from "yjs";

export interface CompleteCollaboratorProviderConfiguration {
  /**
   * The identifier/name of your document
   */
  name: string;
  /**
   * The actual Y.js document
   */
  document: Y.Doc;
  /**
   * onChange callback
   */
  onChange: (updates: Uint8Array) => void;
}

const DEBOUNCE_TIME = 0;

export type CollaborationProviderConfiguration = Required<Pick<CompleteCollaboratorProviderConfiguration, "name">> &
  Partial<CompleteCollaboratorProviderConfiguration>;

export class CollaborationProvider {
  public configuration: CompleteCollaboratorProviderConfiguration = {
    name: "",
    // @ts-expect-error cannot be undefined
    document: undefined,
    onChange: () => {},
  };
  // timeout for debounce
  timeoutId: NodeJS.Timeout | null;
  // array to merge updates into one single UInt8Array
  updates: Uint8Array[];

  constructor(configuration: CollaborationProviderConfiguration) {
    this.setConfiguration(configuration);

    this.timeoutId = null;
    this.updates = [];

    this.configuration.document = configuration.document ?? new Y.Doc();
    this.document.on("update", this.documentUpdateHandler.bind(this));
    this.document.on("destroy", this.documentDestroyHandler.bind(this));
  }

  public setConfiguration(configuration: Partial<CompleteCollaboratorProviderConfiguration> = {}): void {
    this.configuration = {
      ...this.configuration,
      ...configuration,
    };
  }

  get document() {
    return this.configuration.document;
  }

  documentUpdateHandler(update: Uint8Array, origin: any) {
    // return if the update is from the provider itself
    if (origin === this) return;

    // store the update in an array
    this.updates.push(update);

    // debounce onChange call
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(() => {
      // merge updates
      const combinedUpdates = Y.mergeUpdates(this.updates);
      // const base64Updates = Buffer.from(combinedUpdates).toString("base64");
      // call onChange with the merged updates
      this.configuration.onChange?.(combinedUpdates);
      // reset variables
      this.updates = [];
      this.timeoutId = null;
    }, DEBOUNCE_TIME);
  }

  documentDestroyHandler() {
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.document.off("update", this.documentUpdateHandler);
    this.document.off("destroy", this.documentDestroyHandler);
  }
}

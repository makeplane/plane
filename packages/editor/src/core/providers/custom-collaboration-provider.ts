import * as Y from "yjs";

export interface CompleteCollaborationProviderConfiguration {
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

export type CollaborationProviderConfiguration = Required<Pick<CompleteCollaborationProviderConfiguration, "name">> &
  Partial<CompleteCollaborationProviderConfiguration>;

export class CustomCollaborationProvider {
  public hasSynced: boolean;

  public configuration: CompleteCollaborationProviderConfiguration = {
    name: "",
    document: new Y.Doc(),
    onChange: () => {},
  };

  constructor(configuration: CollaborationProviderConfiguration) {
    this.hasSynced = false;
    this.setConfiguration(configuration);
    this.document.on("update", this.documentUpdateHandler.bind(this));
    this.document.on("destroy", this.documentDestroyHandler.bind(this));
  }

  public setConfiguration(configuration: Partial<CompleteCollaborationProviderConfiguration> = {}): void {
    this.configuration = {
      ...this.configuration,
      ...configuration,
    };
  }

  get document() {
    return this.configuration.document;
  }

  async documentUpdateHandler(_update: Uint8Array, origin: any) {
    if (!this.hasSynced) return;
    // return if the update is from the provider itself
    if (origin === this) return;
    // call onChange with the update
    const stateVector = Y.encodeStateAsUpdate(this.document);
    this.configuration.onChange?.(stateVector);
  }

  documentDestroyHandler() {
    this.document.off("update", this.documentUpdateHandler);
    this.document.off("destroy", this.documentDestroyHandler);
  }
}

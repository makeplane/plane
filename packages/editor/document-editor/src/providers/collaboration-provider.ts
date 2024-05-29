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

export type CollaborationProviderConfiguration = Required<Pick<CompleteCollaboratorProviderConfiguration, "name">> &
  Partial<CompleteCollaboratorProviderConfiguration>;

export class CollaborationProvider {
  public configuration: CompleteCollaboratorProviderConfiguration = {
    name: "",
    // @ts-expect-error cannot be undefined
    document: undefined,
    onChange: () => {},
  };

  constructor(configuration: CollaborationProviderConfiguration) {
    this.setConfiguration(configuration);

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

    // call onChange with the update
    this.configuration.onChange?.(update);
  }

  documentDestroyHandler() {
    this.document.off("update", this.documentUpdateHandler);
    this.document.off("destroy", this.documentDestroyHandler);
  }
}

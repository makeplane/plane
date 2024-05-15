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
  onChange: (binaryString: string) => void;
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

  timeoutId: NodeJS.Timeout | null;

  constructor(configuration: CollaborationProviderConfiguration) {
    this.setConfiguration(configuration);

    this.timeoutId = null;

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

    // debounce onChange call
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);

    this.timeoutId = setTimeout(() => {
      const docAsUint8Array = Y.encodeStateAsUpdate(this.document);
      const base64Doc = Buffer.from(docAsUint8Array).toString("base64");
      // const base64Doc = Buffer.from(update).toString("base64");

      this.configuration.onChange?.(base64Doc);
      this.timeoutId = null;
    }, 2000);
  }

  documentDestroyHandler() {
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.document.off("update", this.documentUpdateHandler);
    this.document.off("destroy", this.documentDestroyHandler);
  }
}

import { IndexeddbPersistence } from "y-indexeddb";
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
  onChange: (updates: Uint8Array, source?: string) => void;
  /**
   * Whether connection to the database has been established and all available content has been loaded or not.
   */
  hasIndexedDBSynced: boolean;
}

export type CollaborationProviderConfiguration = Required<Pick<CompleteCollaboratorProviderConfiguration, "name">> &
  Partial<CompleteCollaboratorProviderConfiguration>;

export class CollaborationProvider {
  public configuration: CompleteCollaboratorProviderConfiguration = {
    name: "",
    document: new Y.Doc(),
    onChange: () => {},
    hasIndexedDBSynced: false,
  };

  unsyncedChanges = 0;

  private initialSync = false;

  constructor(configuration: CollaborationProviderConfiguration) {
    this.setConfiguration(configuration);

    this.indexeddbProvider = new IndexeddbPersistence(`page-${this.configuration.name}`, this.document);
    this.indexeddbProvider.on("synced", () => {
      this.configuration.hasIndexedDBSynced = true;
    });
    this.document.on("update", this.documentUpdateHandler.bind(this));
    this.document.on("destroy", this.documentDestroyHandler.bind(this));
  }

  private indexeddbProvider: IndexeddbPersistence;

  public setConfiguration(configuration: Partial<CompleteCollaboratorProviderConfiguration> = {}): void {
    this.configuration = {
      ...this.configuration,
      ...configuration,
    };
  }

  get document() {
    return this.configuration.document;
  }

  public hasUnsyncedChanges(): boolean {
    return this.unsyncedChanges > 0;
  }

  private resetUnsyncedChanges() {
    this.unsyncedChanges = 0;
  }

  private incrementUnsyncedChanges() {
    this.unsyncedChanges += 1;
  }

  public setSynced() {
    this.resetUnsyncedChanges();
  }

  public async hasIndexedDBSynced() {
    await this.indexeddbProvider.whenSynced;
    return this.configuration.hasIndexedDBSynced;
  }

  async documentUpdateHandler(_update: Uint8Array, origin: any) {
    await this.indexeddbProvider.whenSynced;

    // return if the update is from the provider itself
    if (origin === this) return;

    // call onChange with the update
    const stateVector = Y.encodeStateAsUpdate(this.document);

    if (!this.initialSync) {
      this.configuration.onChange?.(stateVector, "initialSync");
      this.initialSync = true;
      return;
    }

    this.configuration.onChange?.(stateVector);
    this.incrementUnsyncedChanges();
  }

  getUpdateFromIndexedDB(): Uint8Array {
    const update = Y.encodeStateAsUpdate(this.document);
    return update;
  }

  documentDestroyHandler() {
    this.document.off("update", this.documentUpdateHandler);
    this.document.off("destroy", this.documentDestroyHandler);
  }
}

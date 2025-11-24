import { action, makeObservable, observable, runInAction } from "mobx";
// plane imports
import type { EditorRefApi, TEditorAsset } from "@plane/editor";

export type TPageEditorInstance = {
  // observables
  assetsList: TEditorAsset[];
  editorRef: EditorRefApi | null;
  // actions
  setEditorRef: (editorRef: EditorRefApi | null) => void;
  updateAssetsList: (assets: TEditorAsset[]) => void;
};

export class PageEditorInstance implements TPageEditorInstance {
  // observables
  editorRef: EditorRefApi | null = null;
  assetsList: TEditorAsset[] = [];

  constructor() {
    makeObservable(this, {
      // observables
      editorRef: observable.ref,
      assetsList: observable,
      // actions
      setEditorRef: action,
      updateAssetsList: action,
    });
  }

  setEditorRef: TPageEditorInstance["setEditorRef"] = (editorRef) => {
    runInAction(() => {
      this.editorRef = editorRef;
    });
  };

  updateAssetsList: TPageEditorInstance["updateAssetsList"] = (assets) => {
    runInAction(() => {
      this.assetsList = assets;
    });
  };
}

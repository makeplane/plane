import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// extensions
import { getImageBlockId } from "@/extensions/custom-image/components/image-block";
// plane editor imports
import { ADDITIONAL_ASSETS_META_DATA_RECORD } from "@/plane-editor/constants/assets";
// types
import { TEditorAsset } from "@/types";

export type TAssetMetaDataRecord = (node: Node, index: number) => TEditorAsset | undefined;

const ASSETS_META_DATA_RECORD: Partial<Record<CORE_EXTENSIONS, TAssetMetaDataRecord>> = {
  [CORE_EXTENSIONS.IMAGE]: (node: Node, index) => {
    if (!node.attrs?.src) return;
    return {
      id: node.attrs?.id,
      name: `image-${index + 1}`,
      scrollId: `#${getImageBlockId(node.attrs?.id ?? "")}`,
      size: 0,
      src: node.attrs?.src,
      type: "IMAGE",
    };
  },
  [CORE_EXTENSIONS.CUSTOM_IMAGE]: (node: Node, index) => {
    if (!node.attrs?.src) return;
    return {
      id: node.attrs?.id,
      name: `image-${index + 1}`,
      scrollId: `#${getImageBlockId(node.attrs?.id ?? "")}`,
      size: 0,
      src: node.attrs?.src,
      type: "CUSTOM_IMAGE",
    };
  },
};

export const getAllEditorAssets = (editor: Editor): TEditorAsset[] => {
  const assets: TEditorAsset[] = [];
  editor.state.doc.descendants((node, _pos, _parent, index) => {
    const assetMetaData = ASSETS_META_DATA_RECORD[node.type.name as keyof typeof ASSETS_META_DATA_RECORD];
    const additionalAssetMetaData =
      ADDITIONAL_ASSETS_META_DATA_RECORD[node.type.name as unknown as keyof typeof ADDITIONAL_ASSETS_META_DATA_RECORD];
    let asset: TEditorAsset | undefined = undefined;
    if (assetMetaData) {
      asset = assetMetaData(node, index);
    } else if (additionalAssetMetaData) {
      asset = additionalAssetMetaData(node, index);
    }
    if (asset) assets.push(asset);
  });
  return assets;
};

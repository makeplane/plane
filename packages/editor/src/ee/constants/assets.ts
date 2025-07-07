// helpers
import { TAssetMetaDataRecord } from "@/helpers/assets";
// local imports
import { EAttachmentBlockAttributeNames, TAttachmentBlockAttributes } from "../extensions/attachments/types";
import { getAttachmentBlockId } from "../extensions/attachments/utils";
import { ADDITIONAL_EXTENSIONS } from "./extensions";

export const ADDITIONAL_ASSETS_META_DATA_RECORD: Partial<Record<ADDITIONAL_EXTENSIONS, TAssetMetaDataRecord>> = {
  [ADDITIONAL_EXTENSIONS.ATTACHMENT]: (attrs) => {
    const attachmentBlockAttrs = attrs as TAttachmentBlockAttributes;
    if (!attachmentBlockAttrs[EAttachmentBlockAttributeNames.SOURCE]) return;
    const assetSize = Number(attachmentBlockAttrs[EAttachmentBlockAttributeNames.FILE_SIZE] ?? 0);

    return {
      href: `#${getAttachmentBlockId(attachmentBlockAttrs[EAttachmentBlockAttributeNames.ID] ?? "")}`,
      id: attachmentBlockAttrs[EAttachmentBlockAttributeNames.ID] ?? "",
      name: attachmentBlockAttrs[EAttachmentBlockAttributeNames.FILE_NAME] ?? "",
      size: isNaN(assetSize) ? 0 : assetSize,
      src: attachmentBlockAttrs[EAttachmentBlockAttributeNames.SOURCE],
      type: ADDITIONAL_EXTENSIONS.ATTACHMENT,
    };
  },
};

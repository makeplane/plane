import { useCallback } from "react";
// helpers
import type { TCustomComponentsMetaData } from "@plane/utils";
// helpers
import { getEditorAssetSrc } from "@/helpers/editor.helper";
// hooks
import { useMember } from "@/hooks/store/use-member";

type TArgs = {
  anchor: string;
};

export const useParseEditorContent = (args: TArgs) => {
  const { anchor } = args;
  // store hooks
  const { getMemberById } = useMember();

  const getEditorMetaData = useCallback(
    (htmlContent: string): TCustomComponentsMetaData => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      const imageMetaData: TCustomComponentsMetaData["file_assets"] = [];
      // process image components
      const imageComponents = doc.querySelectorAll("image-component");
      imageComponents.forEach((element) => {
        const src = element.getAttribute("src");
        if (src) {
          const assetSrc = src.startsWith("http") ? src : getEditorAssetSrc(anchor, src);
          if (assetSrc) {
            imageMetaData.push({
              id: src,
              name: src,
              url: assetSrc,
            });
          }
        }
      });
      // process user mentions
      const userMentions: TCustomComponentsMetaData["user_mentions"] = [];
      const mentionComponents = doc.querySelectorAll("mention-component");
      mentionComponents.forEach((element) => {
        const id = element.getAttribute("entity_identifier");
        if (id) {
          const userDetails = getMemberById(id);
          const originUrl = typeof window !== "undefined" && (window.location.origin ?? "");
          const path = `profile/${id}`;
          const url = `${originUrl}/${path}`;
          if (userDetails) {
            userMentions.push({
              id,
              display_name: userDetails.member__display_name,
              url,
            });
          }
        }
      });

      return {
        file_assets: imageMetaData,
        user_mentions: userMentions,
      };
    },
    [anchor, getMemberById]
  );

  return {
    getEditorMetaData,
  };
};

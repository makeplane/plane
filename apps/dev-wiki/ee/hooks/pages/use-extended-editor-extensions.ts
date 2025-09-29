import { useMemo } from "react";
// plane editor types
import type { IEditorPropsExtended, TCommentConfig } from "@plane/editor";
// hooks
import type { TSearchEntityRequestPayload, TSearchResponse } from "@plane/types";
// plane web hooks
import { LogoSpinner } from "@/components/common";
import { useUserProfile } from "@/hooks/store";
import { useEditorEmbeds } from "@/plane-web/hooks/use-editor-embed";
import { type TPageInstance } from "@/store/pages/base-page";
import { EPageStoreType } from "../store";

export type TExtendedEditorExtensionsConfig = Pick<
  IEditorPropsExtended,
  "embedHandler" | "commentConfig" | "isSmoothCursorEnabled" | "logoSpinner"
>;

export type TExtendedEditorExtensionsHookParams = {
  workspaceSlug: string;
  page: TPageInstance;
  storeType: EPageStoreType;
  fetchEntity: (payload: TSearchEntityRequestPayload) => Promise<TSearchResponse>;
  getRedirectionLink: (pageId?: string) => string;
  extensionHandlers?: Map<string, unknown>;
  projectId?: string;
};

export const useExtendedEditorProps = (
  params: TExtendedEditorExtensionsHookParams
): TExtendedEditorExtensionsConfig => {
  const { workspaceSlug, page, storeType, fetchEntity, getRedirectionLink, extensionHandlers, projectId } = params;

  // store hooks
  const {
    data: { is_smooth_cursor_enabled },
  } = useUserProfile();

  // embed props
  const { embedProps } = useEditorEmbeds({
    fetchEmbedSuggestions: fetchEntity,
    getRedirectionLink,
    workspaceSlug,
    page,
    storeType,
    projectId,
  });

  const extendedEditorProps: TExtendedEditorExtensionsConfig = useMemo(
    () => ({
      embedHandler: embedProps,
      commentConfig: extensionHandlers?.get("comments") as TCommentConfig | undefined,
      isSmoothCursorEnabled: is_smooth_cursor_enabled,
      logoSpinner: LogoSpinner,
    }),
    [embedProps, extensionHandlers, is_smooth_cursor_enabled]
  );

  return extendedEditorProps;
};

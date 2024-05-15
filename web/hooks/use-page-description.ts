import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
// editor
import { proseMirrorJSONToBinaryString } from "@plane/document-editor";
import { generateJSONfromHTML } from "@plane/editor-core";
// services
import { PageService } from "@/services/page.service";
import { IPageStore } from "@/store/pages/page.store";
const pageService = new PageService();

type Props = {
  pageStore: IPageStore;
  projectId: string | string[] | undefined;
  workspaceSlug: string | string[] | undefined;
};

export const usePageDescription = (props: Props) => {
  const { pageStore, projectId, workspaceSlug } = props;
  // states
  const [isDescriptionReady, setIsDescriptionReady] = useState(false);
  // derived values
  const { updateDescription } = pageStore;
  const pageDescription = pageStore.description_html;
  const pageId = pageStore.id;

  const { data: descriptionYJS, mutate: mutateDescriptionYJS } = useSWR(
    workspaceSlug && projectId && pageId ? `PAGE_DESCRIPTION_${workspaceSlug}_${projectId}_${pageId}` : null,
    workspaceSlug && projectId && pageId
      ? () => pageService.fetchDescriptionYJS(workspaceSlug.toString(), projectId.toString(), pageId.toString())
      : null,
    {
      refreshInterval: 15000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  const pageDescriptionYJS = useMemo(
    () => (descriptionYJS ? new Uint8Array(descriptionYJS) : undefined),
    [descriptionYJS]
  );

  // if description_binary field is empty, convert description_html to yDoc and update the DB
  // TODO: this is a one-time operation, and needs to be removed once all the pages are updated
  useEffect(() => {
    if (!pageDescriptionYJS || !pageDescription) return;
    if (pageDescriptionYJS.byteLength === 0) {
      const { contentJSON, editorSchema } = generateJSONfromHTML(pageDescription ?? "<p></p>");
      const yDocBinaryString = proseMirrorJSONToBinaryString(contentJSON, "default", editorSchema);
      updateDescription(yDocBinaryString, pageDescription ?? "<p></p>").then(async () => {
        await mutateDescriptionYJS();
        setIsDescriptionReady(true);
      });
    } else setIsDescriptionReady(true);
  }, [mutateDescriptionYJS, pageDescription, pageDescriptionYJS, updateDescription]);

  return { isDescriptionReady, pageDescriptionYJS };
};

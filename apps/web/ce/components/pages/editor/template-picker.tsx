// plane imports
import type { EditorTitleRefApi } from "@plane/editor";
// store
import { TPageInstance } from "@/store/pages/base-page";

export type TPageTemplatePickerProps = {
  isPageLoading: boolean;
  page: TPageInstance;
  projectId: string | undefined;
  titleEditorRef: React.RefObject<EditorTitleRefApi>;
  workspaceSlug: string;
};

export const PageTemplatePicker: React.FC<TPageTemplatePickerProps> = () => null;

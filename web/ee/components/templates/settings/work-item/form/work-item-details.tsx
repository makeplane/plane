import { useRef } from "react";
import { observer } from "mobx-react";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TWorkItemTemplateForm } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
import { Input } from "@plane/ui";
// components
import { getDescriptionPlaceholderI18n, isEditorEmpty } from "@plane/utils";
import { RichTextEditor } from "@/components/editor";
// helpers
// hooks
import { useEditorAsset, useMember, useWorkspace } from "@/hooks/store";
// plane web hooks
import { validateWhitespaceI18n } from "@/plane-web/components/templates/settings/common";
import { useEditorMentionSearch } from "@/plane-web/hooks/use-editor-mention-search";

type TWorkItemDetailsProps = {
  workspaceSlug: string;
  projectId: string | null;
};

export const WorkItemDetails = observer((props: TWorkItemDetailsProps) => {
  const { workspaceSlug, projectId } = props;
  // refs
  const issueTitleRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<EditorRefApi>(null);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const {
    project: { getProjectMemberIds },
  } = useMember();
  const { uploadEditorAsset } = useEditorAsset();
  // form context
  const {
    control,
    formState: { errors },
  } = useFormContext<TWorkItemTemplateForm>();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const projectMemberIds = projectId ? getProjectMemberIds(projectId, true) : [];
  // use editor mention search
  const { searchEntity } = useEditorMentionSearch({
    memberIds: projectMemberIds ?? [],
  });

  if (!workspaceId) {
    return null;
  }

  return (
    <>
      {/* Work Item Title */}
      <div>
        <Controller
          control={control}
          name="work_item.name"
          rules={{
            validate: (value) => {
              const result = validateWhitespaceI18n(value);
              if (result) {
                return t(result);
              }
              return undefined;
            },
            required: t("templates.settings.form.work_item.name.validation.required"),
            maxLength: {
              value: 255,
              message: t("templates.settings.form.work_item.name.validation.maxLength"),
            },
          }}
          render={({ field: { value, onChange, ref } }) => (
            <Input
              id="work_item.name"
              name="work_item.name"
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              ref={issueTitleRef || ref}
              hasError={Boolean(errors.work_item?.name)}
              placeholder={t("templates.settings.form.work_item.name.placeholder")}
              className="w-full text-lg font-bold p-0"
              mode="true-transparent"
              inputSize="md"
            />
          )}
        />
        {errors?.work_item?.name && typeof errors.work_item.name.message === "string" && (
          <span className="text-xs font-medium text-red-500">{errors.work_item.name.message}</span>
        )}
      </div>

      {/* Work Item Description */}
      {/* TODO: Test and handle attachments */}
      <div className="space-y-1">
        <Controller
          name="work_item.description_html"
          control={control}
          render={({ field: { value, onChange } }) => (
            <RichTextEditor
              id="work-item-description"
              initialValue={value ?? "<p></p>"}
              workspaceSlug={workspaceSlug as string}
              workspaceId={workspaceId}
              projectId={projectId ? projectId : undefined}
              ref={editorRef}
              searchMentionCallback={searchEntity}
              onChange={(description_json: object, description_html: string) => {
                onChange(description_html);
              }}
              placeholder={(isFocused, value) =>
                isEditorEmpty(value)
                  ? t("templates.settings.form.work_item.description.placeholder")
                  : t(`${getDescriptionPlaceholderI18n(isFocused, value)}`)
              }
              containerClassName="min-h-[80px] px-0"
              disabledExtensions={["image"]}
              uploadFile={async (blockId, file) => {
                try {
                  const { asset_id } = await uploadEditorAsset({
                    blockId,
                    data: {
                      entity_identifier: "",
                      entity_type: EFileAssetType.ISSUE_DESCRIPTION,
                    },
                    file,
                    workspaceSlug: workspaceSlug || "",
                    projectId: projectId ?? undefined,
                  });
                  return asset_id;
                } catch (error) {
                  console.log("Error in uploading work item asset:", error);
                  throw new Error("Asset upload failed. Please try again later.");
                }
              }}
            />
          )}
        />
      </div>
    </>
  );
});

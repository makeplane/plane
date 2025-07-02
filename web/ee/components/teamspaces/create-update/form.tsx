"use client";

import { FormEvent, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EFileAssetType, EUserWorkspaceRoles, TTeamspace } from "@plane/types";
import { Button, CustomEmojiIconPicker, Input, Logo } from "@plane/ui";
import { cn, convertHexEmojiToDecimal, getDescriptionPlaceholderI18n, isEditorEmpty } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns";
import { RichTextEditor } from "@/components/editor";
// store hooks
import { useEditorAsset, useMember, useWorkspace } from "@/hooks/store";
// plane web components
import { useTeamspaces } from "@/plane-web/hooks/store";
import { useEditorMentionSearch } from "@/plane-web/hooks/use-editor-mention-search";

type Props = {
  teamDetail?: TTeamspace;
  formData: Partial<TTeamspace> | undefined;
  isSubmitting: boolean;
  handleFormDataChange: <T extends keyof TTeamspace>(key: T, value: TTeamspace[T] | undefined) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

export const CreateOrUpdateTeamForm: React.FC<Props> = observer((props) => {
  const { teamDetail, formData, isSubmitting, handleFormDataChange, handleModalClose, handleFormSubmit } = props;
  // router
  const { workspaceSlug } = useParams();
  // state
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { getTeamspaceMemberIds } = useTeamspaces();
  const { uploadEditorAsset } = useEditorAsset();
  // derived values
  const teamspaceMemberIds = teamDetail?.id
    ? (getTeamspaceMemberIds(teamDetail.id) ?? [])
    : (formData?.member_ids ?? []);
  const userIdsWithAdminOrMemberRole = useMemo(
    () =>
      workspaceMemberIds?.filter((userId) => {
        const memberDetails = getWorkspaceMemberDetails(userId);
        if (!memberDetails?.role) return false;
        return (memberDetails.role as unknown as EUserWorkspaceRoles) === EUserWorkspaceRoles.GUEST ? false : true; // TODO: remove this after migration to EUserWorkspaceRoles
      }),
    [workspaceMemberIds, getWorkspaceMemberDetails]
  );
  // use editor mention search
  const { searchEntity } = useEditorMentionSearch({
    memberIds: teamspaceMemberIds,
  });

  const validateForm = (data: Partial<TTeamspace>) => {
    const newErrors: { name?: string } = {};
    if (!data.name || data.name.trim() === "") {
      newErrors.name = "Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTeamFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData) return;
    if (validateForm(formData)) {
      await handleFormSubmit();
    }
  };

  const handleNameChange = (value: string) => {
    handleFormDataChange("name", value);
    validateForm({ ...formData, name: value });
  };

  if (!workspaceSlug || !currentWorkspace || !formData) return null;

  return (
    <form onSubmit={handleTeamFormSubmit}>
      <div className="space-y-3 p-5 pb-4">
        <h3 className="text-xl font-medium text-custom-text-200">{formData.id ? "Update" : "Create"} Teamspace</h3>
        <div className={cn("flex items-center gap-2 w-full", errors.name && "items-start")}>
          <CustomEmojiIconPicker
            isOpen={isEmojiPickerOpen}
            handleToggle={(val: boolean) => setIsEmojiPickerOpen(val)}
            className="flex items-center justify-center"
            buttonClassName="flex items-center justify-center"
            label={
              <span className="grid size-9 place-items-center rounded-md bg-custom-background-90">
                {formData.logo_props && <Logo logo={formData.logo_props} size={20} />}
              </span>
            }
            onChange={(val) => {
              let logoValue = {};
              if (val?.type === "emoji")
                logoValue = {
                  value: convertHexEmojiToDecimal(val.value.unified),
                  url: val.value.imageUrl,
                };
              else if (val?.type === "icon") logoValue = val.value;
              handleFormDataChange("logo_props", {
                in_use: val?.type,
                [val?.type]: logoValue,
              });
              setIsEmojiPickerOpen(false);
            }}
          />
          <div className="space-y-1 flew-grow w-full">
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Name this teamspace."
              className="w-full resize-none text-base"
              hasError={Boolean(errors.name)}
              tabIndex={1}
              autoFocus
            />
            {errors.name && <div className="text-red-500 text-xs">{errors.name}</div>}
          </div>
        </div>
        <RichTextEditor
          id="teamspace-modal-editor"
          initialValue={
            !formData?.description_html || formData?.description_html === "" ? "<p></p>" : formData?.description_html
          }
          workspaceSlug={workspaceSlug.toString()}
          workspaceId={currentWorkspace.id}
          dragDropEnabled={false}
          onChange={(description_json: object, description_html: string) => {
            handleFormDataChange("description_json", description_json);
            handleFormDataChange("description_html", description_html);
          }}
          placeholder={(isFocused, value) =>
            isEditorEmpty(value)
              ? "Include a helpful description for members you add to this teamspace."
              : t(getDescriptionPlaceholderI18n(isFocused, value))
          }
          searchMentionCallback={searchEntity}
          editorClassName="text-xs"
          containerClassName="resize-none min-h-24 text-xs border-[0.5px] border-custom-border-200 rounded-md px-3 py-2"
          tabIndex={2}
          uploadFile={async (blockId, file) => {
            try {
              const { asset_id } = await uploadEditorAsset({
                blockId,
                data: {
                  entity_identifier: teamDetail?.id ?? "",
                  entity_type: EFileAssetType.TEAM_SPACE_DESCRIPTION,
                },
                file,
                workspaceSlug: workspaceSlug.toString(),
              });
              return asset_id;
            } catch (error) {
              console.log("Error in uploading work item asset:", error);
              throw new Error("Asset upload failed. Please try again later.");
            }
          }}
        />
        <div className="space-y-0.5">
          <p className="text-sm text-custom-text-300">Team lead</p>
          <MemberDropdown
            value={formData.lead_id ?? ""}
            memberIds={userIdsWithAdminOrMemberRole}
            onChange={(val) => {
              if (val && val !== formData.lead_id) {
                handleFormDataChange("lead_id", val);
              } else {
                handleFormDataChange("lead_id", undefined);
              }
            }}
            multiple={false}
            buttonVariant="border-with-text"
            buttonContainerClassName={cn(
              "h-8 w-full text-left",
              formData.lead_id ? "text-custom-text-200" : "text-custom-text-400"
            )}
            placeholder="Pick from your list of members."
            showUserDetails
            tabIndex={3}
          />
        </div>
        <div className="space-y-0.5">
          <p className="flex gap-1.5 items-center text-sm text-custom-text-300">Team members</p>
          <MemberDropdown
            value={formData.member_ids ?? []}
            memberIds={userIdsWithAdminOrMemberRole}
            onChange={(val) => {
              handleFormDataChange("member_ids", val);
            }}
            multiple
            buttonVariant="border-with-text"
            buttonContainerClassName={cn(
              "h-8 w-full text-left",
              formData.member_ids?.length ? "text-custom-text-200" : "text-custom-text-400"
            )}
            placeholder="Pick from your list of members."
            hideIcon={formData.member_ids?.length === 0}
            showUserDetails
            tabIndex={3}
          />
        </div>
      </div>
      <div className="mx-5 py-3 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-100">
        <div className="flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleModalClose} tabIndex={3}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={4}>
            {formData.id ? "Update" : "Create"} teamspace
          </Button>
        </div>
      </div>
    </form>
  );
});

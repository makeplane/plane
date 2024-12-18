"use client";

import { FormEvent, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { InfoIcon } from "lucide-react";
// types
import { TTeam } from "@plane/types";
import { EFileAssetType } from "@plane/types/src/enums";
// ui
import { Button, CustomEmojiIconPicker, Input, Logo, Tooltip } from "@plane/ui";
// components
import { MemberDropdown, ProjectDropdown } from "@/components/dropdowns";
import { RichTextEditor } from "@/components/editor";
// helpers
import { cn } from "@/helpers/common.helper";
import { convertHexEmojiToDecimal } from "@/helpers/emoji.helper";
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// store hooks
import { useWorkspace } from "@/hooks/store";
// plane web components
import { useTeams } from "@/plane-web/hooks/store";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

type Props = {
  teamDetail?: TTeam;
  formData: Partial<TTeam> | undefined;
  isSubmitting: boolean;
  handleFormDataChange: <T extends keyof TTeam>(key: T, value: TTeam[T] | undefined) => void;
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
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { getTeamMemberIds } = useTeams();
  // derived values
  const teamMemberIds = teamDetail?.id ? (getTeamMemberIds(teamDetail.id) ?? []) : (formData?.member_ids ?? []);

  const validateForm = (data: Partial<TTeam>) => {
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
        <h3 className="text-xl font-medium text-custom-text-200">{formData.id ? "Update" : "Create"} Team</h3>
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
              placeholder="Team name"
              className="w-full resize-none text-base"
              hasError={Boolean(errors.name)}
              tabIndex={1}
              autoFocus
            />
            {errors.name && <div className="text-red-500 text-xs">{errors.name}</div>}
          </div>
        </div>
        {(!formData.id || (formData.id && formData.description_html)) && (
          <RichTextEditor
            id="team-modal-editor"
            initialValue={
              !formData?.description_html || formData?.description_html === "" ? "<p></p>" : formData?.description_html
            }
            workspaceSlug={workspaceSlug.toString()}
            workspaceId={currentWorkspace.id}
            memberIds={teamMemberIds}
            dragDropEnabled={false}
            onChange={(description_json: object, description_html: string) => {
              handleFormDataChange("description_json", description_json);
              handleFormDataChange("description_html", description_html);
            }}
            placeholder={getDescriptionPlaceholder}
            editorClassName="text-xs"
            containerClassName="resize-none min-h-24 text-xs border-[0.5px] border-custom-border-200 rounded-md px-3 py-2"
            tabIndex={2}
            uploadFile={async (file) => {
              try {
                const { asset_id } = await fileService.uploadWorkspaceAsset(
                  workspaceSlug.toString(),
                  {
                    entity_identifier: teamDetail?.id ?? "",
                    entity_type: EFileAssetType.TEAM_SPACE_DESCRIPTION,
                  },
                  file
                );
                return asset_id;
              } catch (error) {
                console.log("Error in uploading issue asset:", error);
                throw new Error("Asset upload failed. Please try again later.");
              }
            }}
          />
        )}
        <div className="space-y-0.5">
          <p className="text-sm text-custom-text-300">Team lead</p>
          <MemberDropdown
            value={formData.lead_id ?? ""}
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
            placeholder="Select team lead"
            showUserDetails
            tabIndex={3}
          />
        </div>
        <div className="space-y-0.5">
          <p className="flex gap-1.5 items-center text-sm text-custom-text-300">
            <span>{teamDetail?.id ? "Add team members" : "Team members"}</span>
            <Tooltip
              position="right"
              tooltipContent="Team members cannot be removed directly from here. Please visit the team details page sidebar to manage removals."
            >
              <InfoIcon className="size-3.5 text-custom-text-400 hover:text-custom-text-300 cursor-help outline-none" />
            </Tooltip>
          </p>
          <MemberDropdown
            value={formData.member_ids ?? []}
            onChange={(val) => {
              handleFormDataChange("member_ids", Array.from(new Set([...(teamDetail?.member_ids ?? []), ...val])));
            }}
            multiple
            buttonVariant="border-with-text"
            buttonContainerClassName={cn(
              "h-8 w-full text-left",
              formData.member_ids?.length ? "text-custom-text-200" : "text-custom-text-400"
            )}
            placeholder="Search for members"
            hideIcon={formData.member_ids?.length === 0}
            showUserDetails
            tabIndex={3}
          />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm text-custom-text-300">Projects</p>
          <ProjectDropdown
            value={formData.project_ids ?? []}
            onChange={(val) => {
              handleFormDataChange("project_ids", val);
            }}
            multiple
            buttonVariant="border-with-text"
            buttonContainerClassName={cn(
              "h-8 w-full text-left",
              formData.project_ids?.length ? "text-custom-text-200" : "text-custom-text-400"
            )}
            buttonClassName="gap-1"
            placeholder="Search for projects"
            tabIndex={4}
          />
        </div>
      </div>
      <div className="mx-5 py-3 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-100">
        <div className="flex items-center justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleModalClose} tabIndex={3}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={4}>
            {formData.id ? "Update" : "Create"} team
          </Button>
        </div>
      </div>
    </form>
  );
});

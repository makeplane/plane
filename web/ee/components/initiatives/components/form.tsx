import React, { FC, useState } from "react";
import { useParams } from "next/navigation";
import { EFileAssetType } from "@plane/types/src/enums";
import { Button, Input, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { DateRangeDropdown, MemberDropdown, ProjectDropdown } from "@/components/dropdowns";
import { RichTextEditor } from "@/components/editor";
// helpers
import { getDate, renderFormattedPayloadDate } from "@/helpers/date-time.helper";
import { getDescriptionPlaceholder } from "@/helpers/issue.helper";
// hooks
import { useMember, useWorkspace } from "@/hooks/store";
// plane web components
import { TInitiative } from "@/plane-web/types/initiative";
// services
import { FileService } from "@/services/file.service";

const fileService = new FileService();

type Props = {
  initiativeDetail?: TInitiative;
  formData: Partial<TInitiative> | undefined;
  isSubmitting: boolean;
  handleFormDataChange: <T extends keyof TInitiative>(key: T, value: TInitiative[T] | undefined) => void;
  handleClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

export const CreateUpdateInitiativeForm: FC<Props> = (props) => {
  const { initiativeDetail, formData, isSubmitting, handleFormDataChange, handleClose, handleFormSubmit } = props;
  // router
  const { workspaceSlug } = useParams();
  // state
  const [errors, setErrors] = useState<{ name?: string; project_ids?: string }>({});
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const {
    workspace: { workspaceMemberIds },
  } = useMember();

  // derived values

  const validateForm = (data: Partial<TInitiative>) => {
    const newErrors: { name?: string; project_ids?: string } = {};
    if (!data.name || data.name.trim() === "") {
      newErrors.name = "Name is required";
    }
    if (!data.project_ids || data.project_ids.length === 0) {
      newErrors.project_ids = "Project is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (value: string) => {
    handleFormDataChange("name", value);
    validateForm({ ...formData, name: value });
  };

  if (!workspaceSlug || !currentWorkspace || !formData) return null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (validateForm(formData)) {
          handleFormSubmit();
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: errors.project_ids || errors.name || "Please fill in all required fields.",
          });
        }
      }}
    >
      <div className="space-y-5 p-5">
        <div className="flex items-center gap-x-3">
          <h3 className="text-xl font-medium text-custom-text-200">
            {initiativeDetail ? "Update" : "Create"} Initiative
          </h3>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Input
              id="name"
              name="name"
              type="text"
              value={formData?.name}
              onChange={(e) => handleNameChange(e.target.value)}
              hasError={Boolean(errors?.name)}
              placeholder="Title"
              className="w-full text-base"
              tabIndex={1}
              maxLength={255}
              required
              autoFocus
            />
            <span className="text-xs text-red-500">{errors?.name}</span>
          </div>
          <div className="border-[0.5px] border-custom-border-200 rounded-lg relative">
            <RichTextEditor
              id="initiative-modal-editor"
              initialValue={
                !formData?.description_html || formData?.description_html === ""
                  ? "<p></p>"
                  : formData?.description_html
              }
              value={formData?.description_html}
              workspaceSlug={workspaceSlug.toString()}
              workspaceId={currentWorkspace.id}
              memberIds={workspaceMemberIds || []}
              dragDropEnabled={false}
              onChange={(description_json: object, description_html: string) => {
                handleFormDataChange("description_html", description_html);
              }}
              placeholder={getDescriptionPlaceholder}
              editorClassName="text-xs"
              containerClassName="resize-none min-h-24 max-h-64 overflow-y-scroll vertical-scrollbar scrollbar-sm text-xs border-[0.5px] border-custom-border-200 rounded-md px-3 py-2"
              tabIndex={2}
              uploadFile={async (file) => {
                try {
                  const { asset_id } = await fileService.uploadWorkspaceAsset(
                    workspaceSlug.toString(),
                    {
                      entity_identifier: initiativeDetail?.id ?? "",
                      entity_type: EFileAssetType.INITIATIVE_DESCRIPTION,
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-7">
              <ProjectDropdown
                buttonVariant={"border-with-text"}
                onChange={(val) => {
                  handleFormDataChange("project_ids", val);
                }}
                value={formData.project_ids || []}
                multiple
                showTooltip
                tabIndex={2}
              />
            </div>

            <DateRangeDropdown
              buttonVariant="border-with-text"
              className="h-7"
              value={{
                from: getDate(formData?.start_date),
                to: getDate(formData?.end_date),
              }}
              onSelect={(val) => {
                handleFormDataChange("start_date", val?.from ? renderFormattedPayloadDate(val.from) : null);
                handleFormDataChange("end_date", val?.to ? renderFormattedPayloadDate(val.to) : null);
              }}
              placeholder={{
                from: "Start date",
                to: "End date",
              }}
              hideIcon={{
                to: true,
              }}
              tabIndex={3}
            />

            <div className="h-7">
              <MemberDropdown
                value={formData?.lead ?? ""}
                onChange={(val) => handleFormDataChange("lead", val)}
                multiple={false}
                buttonVariant="border-with-text"
                placeholder="Lead"
                tabIndex={4}
                showUserDetails
              />
            </div>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={5}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={6}>
          {initiativeDetail
            ? isSubmitting
              ? "Updating"
              : "Update Initiative"
            : isSubmitting
              ? "Creating"
              : "Create Initiative"}
        </Button>
      </div>
    </form>
  );
};

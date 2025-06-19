"use client";

import { FC } from "react";
import { useParams } from "next/navigation";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import useSWR from "swr";
// plane types
import { IJiraImporterForm } from "@plane/types";
// plane ui
import { Avatar, CustomSelect, CustomSearchSelect, Input, ToggleSwitch } from "@plane/ui";
// constants
import { getFileURL } from "@plane/utils";
import { WORKSPACE_MEMBERS } from "@/constants/fetch-keys";
// helpers
// plane web services
import { WorkspaceService } from "@/plane-web/services";

const workspaceService = new WorkspaceService();

export const JiraImportUsers: FC = () => {
  const { workspaceSlug } = useParams();
  // form info
  const {
    control,
    watch,
    formState: { errors },
  } = useFormContext<IJiraImporterForm>();

  const { fields } = useFieldArray({
    control,
    name: "data.users",
  });

  const { data: members } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug?.toString() ?? "") : null,
    workspaceSlug ? () => workspaceService.fetchWorkspaceMembers(workspaceSlug?.toString() ?? "") : null
  );

  const options = members
    ?.map((member) => {
      if (!member?.member) return;
      return {
        value: member.member.email,
        query: member.member.display_name ?? "",
        content: (
          <div className="flex items-center gap-2">
            <Avatar name={member?.member.display_name} src={getFileURL(member?.member.avatar_url)} />
            {member.member.display_name}
          </div>
        ),
      };
    })
    .filter((member) => !!member) as
    | {
        value: string;
        query: string;
        content: JSX.Element;
      }[]
    | undefined;

  return (
    <div className="h-full w-full space-y-10 divide-y-2 divide-custom-border-200 overflow-y-auto">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Users</h3>
          <p className="text-sm text-custom-text-200">Update, invite or choose not to invite assignee</p>
        </div>
        <div className="col-span-1">
          <Controller
            control={control}
            name="data.invite_users"
            render={({ field: { value, onChange } }) => <ToggleSwitch onChange={onChange} value={value} />}
          />
        </div>
      </div>

      {watch("data.invite_users") && (
        <div className="pt-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1 text-sm text-custom-text-200">Name</div>
            <div className="col-span-1 text-sm text-custom-text-200">Import as</div>
          </div>

          <div className="mt-5 space-y-3">
            {fields.map((user, index) => (
              <div className="grid grid-cols-3 gap-3" key={`${user.email}-${user.username}`}>
                <div className="col-span-1">
                  <p>{user.username}</p>
                </div>
                <div className="col-span-1">
                  <Controller
                    control={control}
                    name={`data.users.${index}.import`}
                    render={({ field: { value, onChange } }) => (
                      <CustomSelect
                        input
                        value={value}
                        onChange={onChange}
                        optionsClassName="w-full"
                        label={<span className="capitalize">{Boolean(value) ? value : ("Ignore" as any)}</span>}
                      >
                        <CustomSelect.Option value="invite">Invite by email</CustomSelect.Option>
                        <CustomSelect.Option value="map">Map to existing</CustomSelect.Option>
                        <CustomSelect.Option value={false}>Do not import</CustomSelect.Option>
                      </CustomSelect>
                    )}
                  />
                </div>
                <div className="col-span-1">
                  {watch(`data.users.${index}.import`) === "invite" && (
                    <Controller
                      control={control}
                      name={`data.users.${index}.email`}
                      rules={{
                        required: "This field is required",
                      }}
                      render={({ field: { value, onChange, ref } }) => (
                        <Input
                          id={`data.users.${index}.email`}
                          name={`data.users.${index}.email`}
                          type="text"
                          value={value}
                          onChange={onChange}
                          ref={ref}
                          hasError={Boolean(errors.data?.users?.[index]?.email)}
                          className="w-full"
                        />
                      )}
                    />
                  )}
                  {watch(`data.users.${index}.import`) === "map" && (
                    <Controller
                      control={control}
                      name={`data.users.${index}.email`}
                      render={({ field: { value, onChange } }) => (
                        <CustomSearchSelect
                          value={value}
                          input
                          label={value !== "" ? value : "Select user from project"}
                          options={options}
                          onChange={onChange}
                          optionsClassName="w-48"
                        />
                      )}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

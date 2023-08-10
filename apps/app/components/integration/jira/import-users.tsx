import { FC } from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR from "swr";

// react-hook-form
import { useFormContext, useFieldArray, Controller } from "react-hook-form";

// fetch keys
import { WORKSPACE_MEMBERS_WITH_EMAIL } from "constants/fetch-keys";

// services
import workspaceService from "services/workspace.service";

// components
import { ToggleSwitch, Input, CustomSelect, CustomSearchSelect, Avatar } from "components/ui";

import { IJiraImporterForm } from "types";

export const JiraImportUsers: FC = () => {
  const {
    control,
    watch,
    register,
    formState: { errors },
  } = useFormContext<IJiraImporterForm>();

  const { fields } = useFieldArray({
    control,
    name: "data.users",
  });

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: members } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS_WITH_EMAIL(workspaceSlug?.toString() ?? "") : null,
    workspaceSlug
      ? () => workspaceService.workspaceMembersWithEmail(workspaceSlug?.toString() ?? "")
      : null
  );

  const options = members?.map((member) => ({
    value: member.member.email,
    query: member.member.display_name ?? "",
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.display_name}
      </div>
    ),
  }));

  return (
    <div className="h-full w-full space-y-10 divide-y-2 divide-custom-border-200 overflow-y-auto">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="col-span-1">
          <h3 className="font-semibold">Users</h3>
          <p className="text-sm text-custom-text-200">
            Update, invite or choose not to invite assignee
          </p>
        </div>
        <div className="col-span-1">
          <Controller
            control={control}
            name="data.invite_users"
            render={({ field: { value, onChange } }) => (
              <ToggleSwitch onChange={onChange} value={value} />
            )}
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
                        width="w-full"
                        label={
                          <span className="capitalize">
                            {Boolean(value) ? value : ("Ignore" as any)}
                          </span>
                        }
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
                    <Input
                      id={`data.users.${index}.email`}
                      name={`data.users.${index}.email`}
                      type="text"
                      register={register}
                      validations={{
                        required: "This field is required",
                      }}
                      error={errors?.data?.users?.[index]?.email}
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
                          optionsClassName="w-full"
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

import { observer } from "mobx-react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { ROLE, EUserPermissions, EUserPermissionsLevel, MEMBER_TRACKER_ELEMENTS } from "@plane/constants";
import { IUser, IWorkspaceMember } from "@plane/types";
// plane ui
import { CustomSelect, PopoverMenu, TOAST_TYPE, setToast } from "@plane/ui";
// constants
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember, useUser, useUserPermissions } from "@/hooks/store";
// plane web constants

export interface RowData {
  member: IWorkspaceMember;
  role: EUserPermissions;
}

type NameProps = {
  rowData: RowData;
  workspaceSlug: string;
  isAdmin: boolean;
  currentUser: IUser | undefined;
  setRemoveMemberModal: (rowData: RowData) => void;
};

type AccountTypeProps = {
  rowData: RowData;
  workspaceSlug: string;
};

export const NameColumn: React.FC<NameProps> = (props) => {
  const { rowData, workspaceSlug, isAdmin, currentUser, setRemoveMemberModal } = props;
  // derived values
  const { avatar_url, display_name, email, first_name, id, last_name } = rowData.member;

  return (
    <Disclosure>
      {({}) => (
        <div className="relative group">
          <div className="flex items-center gap-x-4 gap-y-2 w-72 justify-between">
            <div className="flex items-center gap-x-2 gap-y-2 flex-1">
              {avatar_url && avatar_url.trim() !== "" ? (
                <Link href={`/${workspaceSlug}/profile/${id}`}>
                  <span className="relative flex h-6 w-6 items-center justify-center rounded-full capitalize text-white">
                    <img
                      src={getFileURL(avatar_url)}
                      className="absolute left-0 top-0 h-full w-full rounded-full object-cover"
                      alt={display_name || email}
                    />
                  </span>
                </Link>
              ) : (
                <Link href={`/${workspaceSlug}/profile/${id}`}>
                  <span className="relative flex h-4 w-4 text-xs items-center justify-center rounded-full bg-gray-700 capitalize text-white">
                    {(email ?? display_name ?? "?")[0]}
                  </span>
                </Link>
              )}
              {first_name} {last_name}
            </div>

            {(isAdmin || id === currentUser?.id) && (
              <PopoverMenu
                data={[""]}
                keyExtractor={(item) => item}
                popoverClassName="justify-end"
                buttonClassName="outline-none	origin-center rotate-90 size-8 aspect-square flex-shrink-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                render={() => (
                  <div
                    className="flex items-center gap-x-3 cursor-pointer"
                    onClick={() => setRemoveMemberModal(rowData)}
                    data-ph-element={MEMBER_TRACKER_ELEMENTS.WORKSPACE_MEMBER_TABLE_CONTEXT_MENU}
                  >
                    <Trash2 className="size-3.5 align-middle" /> {id === currentUser?.id ? "Leave " : "Remove "}
                  </div>
                )}
              />
            )}
          </div>
        </div>
      )}
    </Disclosure>
  );
};

export const AccountTypeColumn: React.FC<AccountTypeProps> = observer((props) => {
  const { rowData, workspaceSlug } = props;
  // form info
  const {
    control,
    formState: { errors },
  } = useForm();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const {
    workspace: { updateMember },
  } = useMember();
  const { data: currentUser } = useUser();

  // derived values
  const isCurrentUser = currentUser?.id === rowData.member.id;
  const isAdminRole = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const isRoleNonEditable = isCurrentUser || !isAdminRole;

  return (
    <>
      {isRoleNonEditable ? (
        <div className="w-32 flex ">
          <span>{ROLE[rowData.role]}</span>
        </div>
      ) : (
        <Controller
          name="role"
          control={control}
          rules={{ required: "Role is required." }}
          render={({ field: { value } }) => (
            <CustomSelect
              value={value}
              onChange={(value: EUserPermissions) => {
                if (!workspaceSlug) return;
                updateMember(workspaceSlug.toString(), rowData.member.id, {
                  role: value as unknown as EUserPermissions, // Cast value to unknown first, then to EUserPermissions
                }).catch((err) => {
                  console.log(err, "err");
                  const error = err.error;
                  const errorString = Array.isArray(error) ? error[0] : error;

                  setToast({
                    type: TOAST_TYPE.ERROR,
                    title: "Error!",
                    message: errorString ?? "An error occurred while updating member role. Please try again.",
                  });
                });
              }}
              label={
                <div className="flex ">
                  <span>{ROLE[rowData.role]}</span>
                </div>
              }
              buttonClassName={`!px-0 !justify-start hover:bg-custom-background-100 ${errors.role ? "border-red-500" : "border-none"}`}
              className="rounded-md p-0 w-32"
              optionsClassName="w-full"
              input
            >
              {Object.keys(ROLE).map((item) => (
                <CustomSelect.Option key={item} value={item as unknown as EUserPermissions}>
                  {ROLE[item as unknown as keyof typeof ROLE]}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      )}
    </>
  );
});

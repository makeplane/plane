import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
// plane imports
import { Button } from "@plane/propel/button";
import { EUserProjectRoles, EUserWorkspaceRoles } from "@plane/types";
// plane ui
import { CustomMenu } from "@plane/ui";
// components
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

interface IRoleOption {
  value: string;
  label: string;
}

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (role: string) => void;
  memberType: "project" | "workspace";
};

const PROJECT_ROLE_OPTIONS: IRoleOption[] = [
  { value: String(EUserProjectRoles.ADMIN), label: "Admin" },
  { value: String(EUserProjectRoles.MEMBER), label: "Member" },
  { value: String(EUserProjectRoles.GUEST), label: "Guest" },
];

const WORKSPACE_ROLE_OPTIONS: IRoleOption[] = [
  { value: String(EUserWorkspaceRoles.ADMIN), label: "Admin" },
  { value: String(EUserWorkspaceRoles.MEMBER), label: "Member" },
  { value: String(EUserWorkspaceRoles.GUEST), label: "Guest" },
  { value: "suspended", label: "Suspended" },
];

// Role filter group component
const RoleFilterGroup: React.FC<{
  appliedFilters: string[] | null;
  handleUpdate: (role: string) => void;
  memberType: "project" | "workspace";
}> = observer(({ appliedFilters, handleUpdate, memberType }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const roleOptions = memberType === "project" ? PROJECT_ROLE_OPTIONS : WORKSPACE_ROLE_OPTIONS;

  return (
    <div className="space-y-2">
      <FilterHeader
        title={`Roles${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={isExpanded}
        handleIsPreviewEnabled={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="space-y-1">
          {roleOptions.map((role) => {
            const isSelected = appliedFilters?.includes(role.value) ?? false;
            return (
              <FilterOption
                key={`role-${role.value}`}
                isChecked={isSelected}
                title={role.label}
                onClick={() => handleUpdate(role.value)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

export const MemberListFilters: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, memberType } = props;

  return (
    <div className="space-y-4">
      {/* Role Filter Group */}
      <RoleFilterGroup appliedFilters={appliedFilters} handleUpdate={handleUpdate} memberType={memberType} />
    </div>
  );
});

// Dropdown component for member list filters
export const MemberListFiltersDropdown: React.FC<Props> = observer((props) => {
  const { appliedFilters, handleUpdate, memberType } = props;

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  return (
    <CustomMenu
      customButton={
        <div className="relative">
          <Button variant="neutral-primary" size="sm" className="flex items-center gap-2">
            <span>Filters</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
          {appliedFiltersCount > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-custom-primary-100" />
          )}
        </div>
      }
      placement="bottom-start"
    >
      <MemberListFilters appliedFilters={appliedFilters} handleUpdate={handleUpdate} memberType={memberType} />
    </CustomMenu>
  );
});

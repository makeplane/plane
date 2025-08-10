import { Fragment, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Check, Loader, Search, Tag } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { EUserPermissionsLevel, getRandomLabelColor } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EUserProjectRoles, IIssueLabel } from "@plane/types";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks
import { useLabel, useUserPermissions } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export interface IIssueLabelSelect {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  values: string[];
  onSelect: (_labelIds: string[]) => void;
  onAddLabel: (workspaceSlug: string, projectId: string, data: Partial<IIssueLabel>) => Promise<any>;
}

export const IssueLabelSelect: React.FC<IIssueLabelSelect> = observer((props) => {
  const { workspaceSlug, projectId, issueId, values, onSelect, onAddLabel } = props;
  const { t } = useTranslation();
  // store hooks
  const { isMobile } = usePlatformOS();
  const { fetchProjectLabels, getProjectLabels } = useLabel();
  const { allowPermissions } = useUserPermissions();
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const canCreateLabel =
    projectId && allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const projectLabels = getProjectLabels(projectId);
  const { baseTabIndex } = getTabIndex(undefined, isMobile);

  const fetchLabels = () => {
    setIsLoading(true);
    if (!projectLabels && workspaceSlug && projectId)
      fetchProjectLabels(workspaceSlug, projectId).then(() => setIsLoading(false));
  };

  const options = (projectLabels ?? []).map((label) => ({
    value: label.id,
    query: label.name,
    content: (
      <div className="flex items-center justify-start gap-2 overflow-hidden">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            backgroundColor: label.color,
          }}
        />
        <div className="line-clamp-1">{label.name}</div>
      </div>
    ),
  }));

  const filteredOptions = query === "" ? options : options.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const handleClose = () => {
    setQuery("");
  };

  const handleSelect = (val: string[]) => {
    onSelect(val);
    handleClose();
  };

  const handleAddLabel = async (labelName: string) => {
    if (!labelName.trim() || submitting) return;

    setSubmitting(true);
    try {
      const labelData = {
        name: labelName.trim(),
        color: getRandomLabelColor(),
      };
      await onAddLabel(workspaceSlug, projectId, labelData);
      setQuery("");
    } catch (error) {
      console.error("Error adding label:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const searchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      
      // If there are filtered options and query is not empty, select the first matching label
      if (filteredOptions.length > 0 && query.trim()) {
        const firstMatch = filteredOptions[0];
        const newValues = values.includes(firstMatch.value)
          ? values.filter(v => v !== firstMatch.value)
          : [...values, firstMatch.value];
        handleSelect(newValues);
        return;
      }
      
      // If no matches and user can create labels, create a new one
      if (canCreateLabel && query.trim() && filteredOptions.length === 0) {
        handleAddLabel(query);
        return;
      }
    }
  };

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const comboboxProps: any = {
    value: values,
    onChange: handleSelect,
    nullable: true,
    multiple: true,
  };

  const comboButton = (
    <Combobox.Button
      ref={setReferenceElement}
      className="relative flex cursor-pointer items-center justify-between gap-1 rounded border-none bg-transparent px-2.5 py-1 text-xs text-custom-text-200 shadow-none duration-300 hover:bg-custom-background-80 focus:outline-none"
      onClick={fetchLabels}
      tabIndex={baseTabIndex}
    >
      <div className="flex items-center justify-start gap-1 text-custom-text-200">
        <Tag className="h-3 w-3" />
        <span className="hidden sm:block">{t("common.label")}</span>
      </div>
    </Combobox.Button>
  );

  const comboOptions = (
    <>
      <div className="flex w-full items-center justify-start rounded border px-2">
        <Search className="h-3.5 w-3.5 text-custom-text-300" />
        <Combobox.Input
          className="w-full bg-transparent px-2 py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("common.search")}
          displayValue={() => ""}
          onKeyDown={searchInputKeyDown}
          tabIndex={baseTabIndex}
        />
      </div>
      <div className={`vertical-scrollbar scrollbar-sm mt-2 max-h-48 space-y-1 overflow-y-scroll px-2 pr-0`}>
        {isLoading ? (
          <p className="text-center text-custom-text-200">{t("common.loading")}</p>
        ) : filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <Combobox.Option
              key={option.value}
              value={option.value}
              className={({ selected }) =>
                `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded px-1 py-1.5 hover:bg-custom-background-80 ${
                  selected ? "text-custom-text-100" : "text-custom-text-200"
                }`
              }
            >
              {({ selected }) => (
                <>
                  {option.content}
                  {selected && (
                    <div className="flex-shrink-0">
                      <Check className={`h-3.5 w-3.5`} />
                    </div>
                  )}
                </>
              )}
            </Combobox.Option>
          ))
        ) : submitting ? (
          <Loader className="spin h-3.5 w-3.5" />
        ) : canCreateLabel ? (
          <Combobox.Option
            value={query}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!query.length) return;
              handleAddLabel(query);
            }}
            className={`text-left text-custom-text-200 ${
              query.length ? "cursor-pointer" : "cursor-default"
            }`}
          >
            {query.length ? (
              <>
                {/* TODO: Translate here */}+ Add{" "}
                <span className="text-custom-text-100">"{query}"</span> to labels
              </>
            ) : (
              t("label.create.type")
            )}
          </Combobox.Option>
        ) : (
          <p className="text-left text-custom-text-200 ">{t("common.search.no_matching_results")}</p>
        )}
      </div>
    </>
  );

  return (
    <Combobox {...comboboxProps} onClose={handleClose}>
      <div className="relative">
        {comboButton}
        <Combobox.Options
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
          className="z-10 w-64 rounded border border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
        >
          {comboOptions}
        </Combobox.Options>
      </div>
    </Combobox>
  );
});

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
//constants
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
        <div className="line-clamp-1 inline-block truncate">{label.name}</div>
      </div>
    ),
  }));

  const filteredOptions =
    query === "" ? options : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-end",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const issueLabels = values ?? [];

  const label = (
    <div
      className={`relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full border border-custom-border-100 p-0.5 px-2 py-0.5 text-xs text-custom-text-300 transition-all hover:bg-custom-background-90 hover:text-custom-text-200`}
    >
      <div className="flex-shrink-0">
        <Tag className="h-2.5 w-2.5" />
      </div>
      <div className="flex-shrink-0">{t("label.select")}</div>
    </div>
  );

  const searchInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (query !== "" && e.key === "Escape") {
      e.stopPropagation();
      setQuery("");
    }

    if (query !== "" && e.key === "Enter" && !e.nativeEvent.isComposing && canCreateLabel) {
      e.stopPropagation();
      e.preventDefault();
      await handleAddLabel(query);
    }
  };

  const handleAddLabel = async (labelName: string) => {
    setSubmitting(true);
    const label = await onAddLabel(workspaceSlug, projectId, { name: labelName, color: getRandomLabelColor() });
    onSelect([...values, label.id]);
    setQuery("");
    setSubmitting(false);
  };

  if (!issueId || !values) return <></>;

  return (
    <>
      <Combobox
        as="div"
        className={`w-auto max-w-full flex-shrink-0 text-left`}
        value={issueLabels}
        onChange={(value) => onSelect(value)}
        multiple
      >
        <Combobox.Button as={Fragment}>
          <button
            ref={setReferenceElement}
            type="button"
            className="cursor-pointer rounded"
            onClick={() => !projectLabels && fetchLabels()}
          >
            {label}
          </button>
        </Combobox.Button>

        <Combobox.Options className="fixed z-10">
          <div
            className={`z-10 my-1 w-48 whitespace-nowrap rounded border border-custom-border-300 bg-custom-background-100 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none`}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="px-2">
              <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
                <Search className="h-3.5 w-3.5 text-custom-text-300" />
                <Combobox.Input
                  className="w-full bg-transparent px-2 py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("common.search.label")}
                  displayValue={(assigned: any) => assigned?.name}
                  onKeyDown={searchInputKeyDown}
                  tabIndex={baseTabIndex}
                />
              </div>
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
                <Loader className="spin  h-3.5 w-3.5" />
              ) : canCreateLabel ? (
                <Combobox.Option
                  value={query}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!query.length) return;
                    handleAddLabel(query);
                  }}
                  className={`text-left text-custom-text-200 ${query.length ? "cursor-pointer" : "cursor-default"}`}
                >
                  {query.length ? (
                    <>
                      {/* TODO: Translate here */}+ Add{" "}
                      <span className="text-custom-text-100">&quot;{query}&quot;</span> to labels
                    </>
                  ) : (
                    t("label.create.type")
                  )}
                </Combobox.Option>
              ) : (
                <p className="text-left text-custom-text-200 ">{t("common.search.no_matching_results")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      </Combobox>
    </>
  );
});

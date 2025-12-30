import { Fragment, useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Loader } from "lucide-react";
import { Combobox } from "@headlessui/react";
// plane imports
import { EUserPermissionsLevel, getRandomLabelColor } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CheckIcon, SearchIcon, PlusIcon } from "@plane/propel/icons";
import type { IIssueLabel } from "@plane/types";
import { EUserProjectRoles } from "@plane/types";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useUserPermissions } from "@/hooks/store/user";
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

export const IssueLabelSelect = observer(function IssueLabelSelect(props: IIssueLabelSelect) {
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

  const issueLabels = values ?? [];

  const label = <span className="text-body-xs-medium text-placeholder">{t("label.select")}</span>;

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
        className="size-full flex-shrink-0 text-left"
        value={issueLabels}
        onChange={(value) => onSelect(value)}
        multiple
      >
        <Combobox.Button as={Fragment}>
          <Button
            ref={setReferenceElement}
            type="button"
            variant="tertiary"
            size="sm"
            prependIcon={<PlusIcon />}
            onClick={() => !projectLabels && fetchLabels()}
          >
            {label}
          </Button>
        </Combobox.Button>

        <Combobox.Options className="fixed z-10">
          <div
            className={`z-10 my-1 w-48 whitespace-nowrap rounded-sm border border-strong bg-surface-1 py-2.5 text-11 shadow-raised-200 focus:outline-none`}
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="px-2">
              <div className="flex w-full items-center justify-start rounded-sm border border-subtle bg-surface-2 px-2">
                <SearchIcon className="h-3.5 w-3.5 text-tertiary" />
                <Combobox.Input
                  className="w-full bg-transparent px-2 py-1 text-11 text-secondary placeholder:text-placeholder focus:outline-none"
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
                <p className="text-center text-secondary">{t("common.loading")}</p>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ selected }) =>
                      `flex cursor-pointer select-none items-center justify-between gap-2 truncate rounded-sm px-1 py-1.5 hover:bg-layer-1 ${
                        selected ? "text-primary" : "text-secondary"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        {option.content}
                        {selected && (
                          <div className="flex-shrink-0">
                            <CheckIcon className={`h-3.5 w-3.5`} />
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
                  className={`text-left text-secondary ${query.length ? "cursor-pointer" : "cursor-default"}`}
                >
                  {query.length ? (
                    <>
                      {/* TODO: Translate here */}+ Add <span className="text-primary">&quot;{query}&quot;</span> to
                      labels
                    </>
                  ) : (
                    t("label.create.type")
                  )}
                </Combobox.Option>
              ) : (
                <p className="text-left text-secondary ">{t("common.search.no_matching_results")}</p>
              )}
            </div>
          </div>
        </Combobox.Options>
      </Combobox>
    </>
  );
});

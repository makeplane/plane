/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { SearchIcon } from "@plane/propel/icons";
import type { ISearchIssueResponse } from "@plane/types";
import { Loader, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import { getTabIndex } from "@plane/utils";
import { IssueSearchModalEmptyState } from "@/components/core/modals/issue-search-modal-empty-state";
import useDebounce from "@/hooks/use-debounce";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
import { ProjectService } from "@/services/project";

interface TimesheetAddIssueModalProps {
    isOpen: boolean;
    handleClose: () => void;
    projectId: string;
    onSelect: (issue: ISearchIssueResponse) => void;
}

const projectService = new ProjectService();

export function TimesheetAddIssueModal({
    isOpen,
    handleClose: onClose,
    projectId,
    onSelect,
}: TimesheetAddIssueModalProps) {
    const { t } = useTranslation();
    const { workspaceSlug } = useParams();
    const { isMobile } = usePlatformOS();

    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [issues, setIssues] = useState<ISearchIssueResponse[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const { baseTabIndex } = getTabIndex(undefined, isMobile);

    const handleClose = () => {
        onClose();
        setSearchTerm("");
    };

    useEffect(() => {
        if (!isOpen || !workspaceSlug || !projectId) return;

        setIsSearching(true);
        setIsLoading(true);

        projectService
            .projectIssuesSearch(workspaceSlug.toString(), projectId, {
                search: debouncedSearchTerm,
                workspace_search: false,
            })
            .then((res) => setIssues(res))
            .catch(() => setIssues([]))
            .finally(() => {
                setIsSearching(false);
                setIsLoading(false);
            });
    }, [debouncedSearchTerm, isOpen, projectId, workspaceSlug]);

    return (
        <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
            <Combobox
                onChange={(val: ISearchIssueResponse) => {
                    onSelect(val);
                    handleClose();
                }}
            >
                <div className="relative m-1">
                    <SearchIcon
                        className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-primary text-opacity-40"
                        aria-hidden="true"
                    />
                    <Combobox.Input
                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-primary outline-none placeholder:text-placeholder focus:ring-0 sm:text-13"
                        placeholder={t("common.search.placeholder", "Search for issues...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        displayValue={() => ""}
                        tabIndex={baseTabIndex}
                    />
                </div>
                <Combobox.Options static className="max-h-80 scroll-py-2 overflow-y-auto vertical-scrollbar scrollbar-md">
                    {searchTerm !== "" && (
                        <h5 className="mx-2 text-13 text-secondary">
                            Search results for <span className="text-primary">&quot;{searchTerm}&quot;</span>
                        </h5>
                    )}

                    {isSearching || isLoading ? (
                        <Loader className="space-y-3 p-3">
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                            <Loader.Item height="40px" />
                        </Loader>
                    ) : issues.length === 0 ? (
                        <IssueSearchModalEmptyState
                            debouncedSearchTerm={debouncedSearchTerm}
                            isSearching={isSearching}
                            issues={issues}
                            searchTerm={searchTerm}
                        />
                    ) : (
                        <ul className="text-13 p-2">
                            {issues.map((issue) => (
                                <Combobox.Option
                                    key={issue.id}
                                    value={issue}
                                    className={({ active, selected }) =>
                                        `group flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 my-0.5 text-secondary ${active ? "bg-layer-1 text-primary" : ""
                                        } ${selected ? "text-primary" : ""}`
                                    }
                                >
                                    <div className="flex flex-grow items-center gap-2 truncate">
                                        <span
                                            className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                            style={{ backgroundColor: issue.state__color }}
                                        />
                                        <span className="flex-shrink-0">
                                            <IssueIdentifier
                                                projectId={issue.project_id}
                                                issueTypeId={issue.type_id}
                                                projectIdentifier={issue.project__identifier}
                                                issueSequenceId={issue.sequence_id}
                                                size="xs"
                                                variant="secondary"
                                            />
                                        </span>{" "}
                                        <span className="truncate">{issue.name}</span>
                                    </div>
                                </Combobox.Option>
                            ))}
                        </ul>
                    )}
                </Combobox.Options>
            </Combobox>
        </ModalCore>
    );
}

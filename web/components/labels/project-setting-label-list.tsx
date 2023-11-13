import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import {
  CreateUpdateLabelInline,
  DeleteLabelModal,
  LabelsListModal,
  ProjectSettingLabelItem,
  ProjectSettingLabelGroup,
} from "components/labels";
// ui
import { Button, Loader } from "@plane/ui";
import { EmptyState } from "components/common";
// images
import emptyLabel from "public/empty-state/label.svg";
// types
import { IIssueLabels } from "types";

export const ProjectSettingsLabelList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  // store
  const { project: projectStore } = useMobxStore();

  // states
  const [labelForm, setLabelForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [labelsListModal, setLabelsListModal] = useState(false);
  const [labelToUpdate, setLabelToUpdate] = useState<IIssueLabels | null>(null);
  const [parentLabel, setParentLabel] = useState<IIssueLabels | undefined>(undefined);
  const [selectDeleteLabel, setSelectDeleteLabel] = useState<IIssueLabels | null>(null);

  // ref
  const scrollToRef = useRef<HTMLFormElement>(null);

  // api call to fetch project details
  useSWR(
    workspaceSlug && projectId ? "PROJECT_LABELS" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // derived values
  const issueLabels = projectStore.labels?.[projectId?.toString()!] ?? null;

  const newLabel = () => {
    setIsUpdating(false);
    setLabelForm(true);
  };

  const addLabelToGroup = (parentLabel: IIssueLabels) => {
    setLabelsListModal(true);
    setParentLabel(parentLabel);
  };

  const editLabel = (label: IIssueLabels) => {
    setLabelForm(true);
    setIsUpdating(true);
    setLabelToUpdate(label);
  };

  return (
    <>
      <LabelsListModal isOpen={labelsListModal} parent={parentLabel} handleClose={() => setLabelsListModal(false)} />
      <DeleteLabelModal
        isOpen={!!selectDeleteLabel}
        data={selectDeleteLabel ?? null}
        onClose={() => setSelectDeleteLabel(null)}
      />

      <div className="flex items-center py-3.5 border-b border-custom-border-100 justify-between">
        <h3 className="text-xl font-medium">Labels</h3>
        <Button variant="primary" onClick={newLabel} size="sm">
          Add label
        </Button>
      </div>
      <div className="space-y-3 py-6 h-full w-full">
        {labelForm && (
          <CreateUpdateLabelInline
            labelForm={labelForm}
            setLabelForm={setLabelForm}
            isUpdating={isUpdating}
            labelToUpdate={labelToUpdate}
            ref={scrollToRef}
            onClose={() => {
              setLabelForm(false);
              setIsUpdating(false);
              setLabelToUpdate(null);
            }}
          />
        )}

        {/* labels */}
        {issueLabels &&
          issueLabels.map((label) => {
            const children = issueLabels?.filter((l) => l.parent === label.id);

            if (children && children.length === 0) {
              if (!label.parent)
                return (
                  <ProjectSettingLabelItem
                    key={label.id}
                    label={label}
                    addLabelToGroup={() => addLabelToGroup(label)}
                    editLabel={(label) => {
                      editLabel(label);
                      scrollToRef.current?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    handleLabelDelete={() => setSelectDeleteLabel(label)}
                  />
                );
            } else {
              return (
                <ProjectSettingLabelGroup
                  key={label.id}
                  label={label}
                  labelChildren={children}
                  addLabelToGroup={addLabelToGroup}
                  editLabel={(label) => {
                    editLabel(label);
                    scrollToRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                  handleLabelDelete={() => setSelectDeleteLabel(label)}
                />
              );
            }
          })}

        {/* loading state */}
        {!issueLabels && (
          <Loader className="space-y-5">
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
            <Loader.Item height="42px" />
          </Loader>
        )}

        {/* empty state */}
        {issueLabels && issueLabels.length === 0 && (
          <EmptyState
            title="No labels yet"
            description="Create labels to help organize and filter issues in you project"
            image={emptyLabel}
            primaryButton={{
              text: "Add label",
              onClick: () => newLabel(),
            }}
          />
        )}
      </div>
    </>
  );
});

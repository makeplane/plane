import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceView } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { useAppRouter } from "@/hooks/use-app-router";
// local imports
import { WorkspaceViewForm } from "./form";

type Props = {
  data?: IWorkspaceView;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<IWorkspaceView>;
};

export const CreateUpdateWorkspaceViewModal = observer(function CreateUpdateWorkspaceViewModal(props: Props) {
  const { isOpen, onClose, data, preLoadedData } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  // store hooks
  const { createGlobalView, updateGlobalView } = useGlobalView();
  const { resetExpression } = useWorkItemFilters();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: Partial<IWorkspaceView>) => {
    if (!workspaceSlug) return;

    try {
      const payloadData: Partial<IWorkspaceView> = {
        ...payload,
        rich_filters: {
          ...payload?.rich_filters,
        },
      };
      const res = await createGlobalView(workspaceSlug, payloadData);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "View created successfully.",
      });
      router.push(`/${workspaceSlug}/workspace-views/${res.id}`);
      handleClose();
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "View could not be created. Please try again.",
      });
    }
  };

  const handleUpdateView = async (payload: Partial<IWorkspaceView>) => {
    if (!workspaceSlug || !data) return;

    try {
      const payloadData: Partial<IWorkspaceView> = {
        ...payload,
        query: {
          ...payload?.rich_filters,
        },
      };
      const res = await updateGlobalView(workspaceSlug, data.id, payloadData);
      if (res) {
        resetExpression(EIssuesStoreType.GLOBAL, data.id, res.rich_filters);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View updated successfully.",
        });
        handleClose();
      }
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "View could not be updated. Please try again.",
      });
    }
  };

  const handleFormSubmit = async (formData: Partial<IWorkspaceView>) => {
    if (!workspaceSlug) return;

    if (!data) await handleCreateView(formData);
    else await handleUpdateView(formData);
  };

  if (!workspaceSlug) return null;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <WorkspaceViewForm
        handleFormSubmit={handleFormSubmit}
        handleClose={handleClose}
        data={data}
        preLoadedData={preLoadedData}
        workspaceSlug={workspaceSlug}
      />
    </ModalCore>
  );
});

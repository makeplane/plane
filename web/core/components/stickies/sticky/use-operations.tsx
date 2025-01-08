import { useMemo } from "react";
import { TSticky } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { useSticky } from "@/hooks/use-stickies";

export type TOperations = {
  create: (data: Partial<TSticky>) => Promise<void>;
  update: (stickyId: string, data: Partial<TSticky>) => Promise<void>;
  remove: (stickyId: string) => Promise<void>;
};

type TProps = {
  workspaceSlug: string;
};

export const useStickyOperations = (props: TProps) => {
  const { workspaceSlug } = props;
  const { createSticky, updateSticky, deleteSticky } = useSticky();

  const isValid = (data: Partial<TSticky>) => {
    if (data.name && data.name.length > 100) {
      setToast({
        message: "The sticky name cannot be longer than 100 characters",
        type: TOAST_TYPE.ERROR,
        title: "Sticky not updated",
      });
      return false;
    }
    return true;
  };

  const stickyOperations: TOperations = useMemo(
    () => ({
      create: async (data: Partial<TSticky>) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          if (!isValid(data)) return;
          await createSticky(workspaceSlug, data);
          setToast({
            message: "The sticky has been successfully created",
            type: TOAST_TYPE.SUCCESS,
            title: "Sticky created",
          });
        } catch (error: any) {
          setToast({
            message: error?.data?.error ?? "The sticky could not be created",
            type: TOAST_TYPE.ERROR,
            title: "Sticky not created",
          });
          throw error;
        }
      },
      update: async (stickyId: string, data: Partial<TSticky>) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          if (!isValid(data)) return;
          await updateSticky(workspaceSlug, stickyId, data);
        } catch (error) {
          setToast({
            message: "The sticky could not be updated",
            type: TOAST_TYPE.ERROR,
            title: "Sticky not updated",
          });
          throw error;
        }
      },
      remove: async (stickyId: string) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          await deleteSticky(workspaceSlug, stickyId);
          setToast({
            message: "The sticky has been successfully removed",
            type: TOAST_TYPE.SUCCESS,
            title: "Sticky removed",
          });
        } catch (error) {
          setToast({
            message: "The sticky could not be removed",
            type: TOAST_TYPE.ERROR,
            title: "Sticky not removed",
          });
          throw error;
        }
      },
    }),
    [workspaceSlug]
  );

  return {
    stickyOperations,
  };
};

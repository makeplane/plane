import { useMemo } from "react";
// plane types
import { InstructionType, TSticky } from "@plane/types";
// plane ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// plane utils
import { isCommentEmpty } from "@plane/utils";
// components
import { STICKY_COLORS_LIST } from "@/components/editor/sticky-editor/color-palette";
// hooks
import { useSticky } from "@/hooks/use-stickies";

export type TOperations = {
  create: (data?: Partial<TSticky>) => Promise<void>;
  update: (stickyId: string, data: Partial<TSticky>) => Promise<void>;
  remove: (stickyId: string) => Promise<void>;
  updatePosition: (
    workspaceSlug: string,
    sourceId: string,
    droppedId: string,
    instruction: InstructionType
  ) => Promise<void>;
};

type TProps = {
  workspaceSlug: string;
};

export const getRandomStickyColor = (): string => {
  const randomIndex = Math.floor(Math.random() * STICKY_COLORS_LIST.length);
  return STICKY_COLORS_LIST[randomIndex].key;
};

export const useStickyOperations = (props: TProps) => {
  const { workspaceSlug } = props;
  // store hooks
  const { stickies, getWorkspaceStickyIds, createSticky, updateSticky, deleteSticky, updateStickyPosition } =
    useSticky();

  const isValid = (data: Partial<TSticky>) => {
    if (data.name && data.name.length > 100) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Sticky not updated",
        message: "The sticky name cannot be longer than 100 characters.",
      });
      return false;
    }
    return true;
  };

  const stickyOperations: TOperations = useMemo(
    () => ({
      create: async (data?: Partial<TSticky>) => {
        try {
          const payload: Partial<TSticky> = {
            background_color: getRandomStickyColor(),
            ...data,
          };
          const workspaceStickIds = getWorkspaceStickyIds(workspaceSlug);
          // check if latest sticky is empty
          if (workspaceStickIds && workspaceStickIds.length >= 0) {
            const latestSticky = stickies[workspaceStickIds[0]];
            if (latestSticky && (!latestSticky.description_html || isCommentEmpty(latestSticky.description_html))) {
              setToast({
                message: "There already exists a sticky with no description",
                type: TOAST_TYPE.WARNING,
                title: "Sticky already created",
              });
              return;
            }
          }
          if (!workspaceSlug) throw new Error("Missing required fields");
          if (!isValid(payload)) return;
          await createSticky(workspaceSlug, payload);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Sticky created",
            message: "The sticky has been successfully created.",
          });
        } catch (error: any) {
          console.error("Error in creating sticky:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Sticky not created",
            message: error?.data?.error ?? "The sticky could not be created.",
          });
        }
      },
      update: async (stickyId: string, data: Partial<TSticky>) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          if (!isValid(data)) return;
          await updateSticky(workspaceSlug, stickyId, data);
        } catch (error) {
          console.error("Error in updating sticky:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Sticky not updated",
            message: "The sticky could not be updated.",
          });
        }
      },
      remove: async (stickyId: string) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          await deleteSticky(workspaceSlug, stickyId);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Sticky removed",
            message: "The sticky has been removed successfully.",
          });
        } catch (error) {
          console.error("Error in removing sticky:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Sticky not removed",
            message: "The sticky could not be removed.",
          });
        }
      },
      updatePosition: async (
        workspaceSlug: string,
        sourceId: string,
        droppedId: string,
        instruction: InstructionType
      ) => {
        try {
          if (!workspaceSlug) throw new Error("Missing required fields");
          await updateStickyPosition(workspaceSlug, sourceId, droppedId, instruction);
        } catch (error) {
          console.error("Error in updating sticky position:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Sticky not updated",
            message: "The sticky could not be updated.",
          });
        }
      },
    }),
    [createSticky, deleteSticky, getWorkspaceStickyIds, stickies, updateSticky, updateStickyPosition, workspaceSlug]
  );

  return {
    stickyOperations,
  };
};

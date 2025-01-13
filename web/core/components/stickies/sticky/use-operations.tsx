import { useMemo } from "react";
import { InstructionType, TSticky } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { STICKY_COLORS } from "@/components/editor/sticky-editor/color-pallete";
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

/**
 * Checks if HTML content is empty after extracting text
 * @param html HTML string to check
 * @returns boolean indicating if content is empty
 */
const isHtmlContentEmpty = (html: string): boolean => {
  // Create a temporary DOM element
  const tempElement = document.createElement("div");
  tempElement.innerHTML = html;

  // Get text content and trim whitespace
  const textContent = tempElement.textContent || "";
  const trimmedContent = textContent.trim();

  return trimmedContent.length === 0;
};

export const getRandomStickyColor = (): string => {
  const randomIndex = Math.floor(Math.random() * STICKY_COLORS.length);
  return STICKY_COLORS[randomIndex];
};

export const useStickyOperations = (props: TProps) => {
  const { workspaceSlug } = props;
  const { stickies, getWorkspaceStickies, createSticky, updateSticky, deleteSticky, updateStickyPosition } =
    useSticky();

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
      create: async (data?: Partial<TSticky>) => {
        try {
          const payload: Partial<TSticky> = {
            color: getRandomStickyColor(),
            ...data,
          };
          const workspaceStickies = getWorkspaceStickies(workspaceSlug);
          // check if latest sticky is empty
          if (getWorkspaceStickies(workspaceSlug).length >= 0) {
            const latestSticky = stickies[workspaceStickies[0]];
            if (latestSticky && (!latestSticky.description_html || isHtmlContentEmpty(latestSticky.description_html))) {
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
          setToast({
            message: "The sticky could not be updated",
            type: TOAST_TYPE.ERROR,
            title: "Sticky not updated",
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

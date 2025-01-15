import { useCallback, useState } from "react";
import { debounce } from "lodash";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Minimize2 } from "lucide-react";
// plane types
import { TSticky } from "@plane/types";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useSticky } from "@/hooks/use-stickies";
// components
import { STICKY_COLORS_LIST } from "../../editor/sticky-editor/color-palette";
import { StickyDeleteModal } from "../delete-modal";
import { StickyInput } from "./inputs";
import { StickyItemDragHandle } from "./sticky-item-drag-handle";
import { useStickyOperations } from "./use-operations";

type TProps = {
  onClose?: () => void;
  workspaceSlug: string;
  className?: string;
  stickyId: string | undefined;
  showToolbar?: boolean;
};
export const StickyNote = observer((props: TProps) => {
  const { onClose, workspaceSlug, className = "", stickyId, showToolbar } = props;
  // navigation
  const pathName = usePathname();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // store hooks
  const { stickies } = useSticky();
  // sticky operations
  const { stickyOperations } = useStickyOperations({ workspaceSlug });
  // derived values
  const stickyData = stickyId ? stickies[stickyId] : undefined;
  const isStickiesPage = pathName?.includes("stickies");
  const backgroundColor =
    STICKY_COLORS_LIST.find((c) => c.key === stickyData?.background_color)?.backgroundColor ||
    STICKY_COLORS_LIST[0].backgroundColor;

  const handleChange = useCallback(
    async (payload: Partial<TSticky>) => {
      if (stickyId) {
        await stickyOperations.update(stickyId, payload);
      } else {
        await stickyOperations.create({
          ...payload,
        });
      }
    },
    [stickyId, stickyOperations]
  );

  const debouncedFormSave = useCallback(
    debounce(async (payload: Partial<TSticky>) => {
      await handleChange(payload);
    }, 500),
    [stickyOperations, stickyData, handleChange]
  );

  const handleDelete = async () => {
    if (!stickyId) return;
    onClose?.();
    stickyOperations.remove(stickyId);
  };

  return (
    <>
      <StickyDeleteModal
        isOpen={isDeleteModalOpen}
        handleSubmit={handleDelete}
        handleClose={() => setIsDeleteModalOpen(false)}
      />
      <div
        className={cn("w-full flex flex-col h-fit rounded p-4 group/sticky", className)}
        style={{
          backgroundColor,
        }}
      >
        {isStickiesPage && <StickyItemDragHandle isDragging={false} />}{" "}
        {onClose && (
          <button type="button" className="flex w-full" onClick={onClose}>
            <Minimize2 className="size-4 m-auto mr-0" />
          </button>
        )}
        {/* inputs */}
        <StickyInput
          stickyData={stickyData}
          workspaceSlug={workspaceSlug}
          handleUpdate={debouncedFormSave}
          stickyId={stickyId}
          handleDelete={() => setIsDeleteModalOpen(true)}
          handleChange={handleChange}
          showToolbar={showToolbar}
        />
      </div>
    </>
  );
});

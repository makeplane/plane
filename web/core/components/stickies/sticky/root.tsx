import { useCallback, useState } from "react";
import { debounce } from "lodash";
import { observer } from "mobx-react";
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
import { getRandomStickyColor, useStickyOperations } from "./use-operations";

type TProps = {
  onClose?: () => void;
  workspaceSlug: string;
  className?: string;
  stickyId: string | undefined;
  showToolbar?: boolean;
  handleLayout?: () => void;
};
export const StickyNote = observer((props: TProps) => {
  const { onClose, workspaceSlug, className = "", stickyId, showToolbar, handleLayout } = props;
  // navigation
  // const pathName = usePathname();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // store hooks
  const { stickies } = useSticky();
  // sticky operations
  const { stickyOperations } = useStickyOperations({ workspaceSlug });
  // derived values
  const stickyData: Partial<TSticky> = stickyId ? stickies[stickyId] : { background_color: getRandomStickyColor() };
  // const isStickiesPage = pathName?.includes("stickies");
  const backgroundColor =
    STICKY_COLORS_LIST.find((c) => c.key === stickyData?.background_color)?.backgroundColor ||
    STICKY_COLORS_LIST[0].backgroundColor;

  const handleChange = useCallback(
    async (payload: Partial<TSticky>) => {
      if (stickyId) {
        await stickyOperations.update(stickyId, payload);
      } else {
        await stickyOperations.create({
          ...stickyData,
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
        className={cn("w-full h-fit flex flex-col rounded group/sticky overflow-y-scroll", className)}
        style={{
          backgroundColor,
        }}
      >
        {/* {isStickiesPage && <StickyItemDragHandle isDragging={false} />}{" "} */}
        {onClose && (
          <button type="button" className="flex-shrink-0 flex justify-end p-2.5" onClick={onClose}>
            <Minimize2 className="size-4" />
          </button>
        )}
        {/* inputs */}
        <div className="-mt-2">
          <StickyInput
            stickyData={stickyData}
            workspaceSlug={workspaceSlug}
            handleUpdate={(payload) => {
              handleLayout?.();
              debouncedFormSave(payload);
            }}
            stickyId={stickyId}
            handleDelete={() => setIsDeleteModalOpen(true)}
            handleChange={handleChange}
            showToolbar={showToolbar}
          />
        </div>
      </div>
    </>
  );
});

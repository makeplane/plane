import { useCallback } from "react";
import { debounce } from "lodash";
import { observer } from "mobx-react";
import { Minimize2 } from "lucide-react";
import { TSticky } from "@plane/types";
import { cn } from "@plane/utils";
import { useSticky } from "@/hooks/use-stickies";
import { STICKY_COLORS } from "../../editor/sticky-editor/color-pallete";
import { StickyInput } from "./inputs";
import { useStickyOperations } from "./use-operations";

type TProps = {
  onClose?: () => void;
  workspaceSlug: string;
  className?: string;
  stickyId: string | undefined;
};
export const StickyNote = observer((props: TProps) => {
  const { onClose, workspaceSlug, className = "", stickyId } = props;
  // hooks
  const { stickyOperations } = useStickyOperations({ workspaceSlug });
  const { stickies } = useSticky();
  // derived values
  const stickyData: TSticky | undefined = stickyId ? stickies[stickyId] : undefined;

  const handleChange = useCallback(
    async (payload: Partial<TSticky>) => {
      stickyId
        ? await stickyOperations.update(stickyId, payload)
        : await stickyOperations.create({
            color: payload.color || STICKY_COLORS[0],
            ...payload,
          });
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
    <div
      className={cn("w-full flex flex-col h-fit rounded p-4 group/sticky", className)}
      style={{ backgroundColor: stickyData?.color || STICKY_COLORS[0] }}
    >
      {onClose && (
        <button className="flex w-full" onClick={onClose}>
          <Minimize2 className="size-4 m-auto mr-0" />
        </button>
      )}
      {/* inputs */}
      <StickyInput
        stickyData={stickyData}
        workspaceSlug={workspaceSlug}
        handleUpdate={debouncedFormSave}
        stickyId={stickyId}
        handleDelete={handleDelete}
        handleChange={handleChange}
      />
    </div>
  );
});

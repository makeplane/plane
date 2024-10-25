import { useState } from "react";
import { useParams } from "next/navigation";
import { Controller, useFormContext } from "react-hook-form";
import { X } from "lucide-react";
// plane types
import { IProject } from "@plane/types";
// components
import { ImagePickerPopover } from "@/components/core";
import { ProjectLogoPicker } from "@/components/project";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getFileURL } from "@/helpers/file.helper";
import { getTabIndex } from "@/helpers/tab-indices.helper";

type Props = {
  handleClose: () => void;
  isMobile?: boolean;
};
const ProjectCreateHeader: React.FC<Props> = (props) => {
  const { handleClose, isMobile = false } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  // form
  const { watch, control } = useFormContext<IProject>();
  // derived values
  const coverImage = watch("cover_image_url");

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  return (
    <div className="group relative h-44 w-full rounded-lg bg-custom-background-80">
      {coverImage && (
        <img
          src={getFileURL(coverImage)}
          className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
          alt="Project cover image"
        />
      )}

      <div className="absolute right-2 top-2 p-2">
        <button data-posthog="PROJECT_MODAL_CLOSE" type="button" onClick={handleClose} tabIndex={getIndex("close")}>
          <X className="h-5 w-5 text-white" />
        </button>
      </div>
      <div className="absolute bottom-2 right-2">
        <Controller
          name="cover_image_url"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ImagePickerPopover
              label="Change Cover"
              onChange={onChange}
              control={control}
              value={value}
              tabIndex={getIndex("cover_image")}
            />
          )}
        />
      </div>
      <div className="absolute -bottom-[22px] left-3">
        <Controller
          name="logo_props"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ProjectLogoPicker
              buttonClassName="h-11 w-11 rounded-md bg-custom-background-80"
              handleToggle={(val) => setIsOpen(val)}
              isOpen={isOpen}
              onChange={(val) => {
                onChange(val);
                setIsOpen(false);
              }}
              value={value}
              workspaceSlug={workspaceSlug?.toString() ?? ""}
            />
          )}
        />
      </div>
    </div>
  );
};

export default ProjectCreateHeader;

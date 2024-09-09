import { useFormContext } from "react-hook-form";
import { IProject } from "@plane/types";
// ui
import { Button } from "@plane/ui";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";

type Props = {
  handleClose: () => void;
  isMobile?: boolean;
};

const ProjectCreateButtons: React.FC<Props> = (props) => {
  const { handleClose, isMobile = false } = props;
  const {
    formState: { isSubmitting },
  } = useFormContext<IProject>();

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CREATE, isMobile);

  return (
    <div className="flex justify-end gap-2 py-4 border-t border-custom-border-100">
      <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={getIndex("cancel")}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" size="sm" loading={isSubmitting} tabIndex={getIndex("submit")}>
        {isSubmitting ? "Creating" : "Create project"}
      </Button>
    </div>
  );
};

export default ProjectCreateButtons;

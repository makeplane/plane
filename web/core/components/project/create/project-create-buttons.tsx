import { useFormContext } from "react-hook-form";
import { IProject } from "@plane/types";
import { Button } from "@plane/ui";

type Props = {
  handleClose: () => void;
};
const ProjectCreateButtons: React.FC<Props> = (props) => {
  const { handleClose } = props;
  const {
    formState: { isSubmitting },
  } = useFormContext<IProject>();

  return (
    <div className="flex justify-end gap-2 pt-4 border-t border-custom-border-100">
      <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={6}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" size="sm" loading={isSubmitting} tabIndex={7}>
        {isSubmitting ? "Creating" : "Create project"}
      </Button>
    </div>
  );
};

export default ProjectCreateButtons;

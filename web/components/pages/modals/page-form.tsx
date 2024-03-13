import { useState } from "react";
// ui
import { Button, Input } from "@plane/ui";
// types
import { TPage } from "@plane/types";
// types
// import { IPage } from "@plane/types";
// constants
// import { PAGE_ACCESS_SPECIFIERS } from "constants/page";
// import { IPageStore } from "store/pages/page.store";

type Props = {
  formData: Partial<TPage>;
  handleFormData: <T extends keyof TPage>(key: T, value: TPage[T]) => void;
  handleModalClose: () => void;
  handleFormSubmit: () => Promise<void>;
};

export const PageForm: React.FC<Props> = (props) => {
  const { formData, handleFormData, handleModalClose, handleFormSubmit } = props;
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePageFormSubmit = async () => {
    try {
      setIsSubmitting(true);
      await handleFormSubmit();
      setIsSubmitting(false);
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handlePageFormSubmit}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">
          {formData?.id ? "Update" : "Create"} Page
        </h3>

        <div>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleFormData("name", e.target.value)}
            placeholder="Title"
            className="w-full resize-none text-lg"
            tabIndex={1}
            required
          />
        </div>
      </div>

      <div className="mt-5 md:flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 justify-end mt-5 md:mt-0">
          <Button variant="neutral-primary" size="sm" onClick={handleModalClose} tabIndex={4}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting} tabIndex={5}>
            {formData?.id
              ? isSubmitting
                ? "Updating..."
                : "Update page"
              : isSubmitting
              ? "Creating..."
              : "Create Page"}
          </Button>
        </div>
      </div>
    </form>
  );
};

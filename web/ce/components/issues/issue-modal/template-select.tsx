export type TWorkItemTemplateDropdownSize = "xs" | "sm";

export type TWorkItemTemplateSelect = {
  projectId: string | null;
  typeId: string | null;
  disabled?: boolean;
  size?: TWorkItemTemplateDropdownSize;
  placeholder?: string;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  handleModalClose: () => void;
  handleFormChange?: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const WorkItemTemplateSelect = (props: TWorkItemTemplateSelect) => <></>;

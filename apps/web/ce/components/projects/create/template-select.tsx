type TProjectTemplateDropdownSize = "xs" | "sm";

export type TProjectTemplateSelect = {
  disabled?: boolean;
  size?: TProjectTemplateDropdownSize;
  placeholder?: string;
  dropDownContainerClassName?: string;
  handleModalClose: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProjectTemplateSelect(props: TProjectTemplateSelect) {
  return <></>;
}

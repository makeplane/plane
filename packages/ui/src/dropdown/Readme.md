Below is a detailed list of the props included:

### Root Props

- value: string | string[]; - Current selected value.
- onChange: (value: string | string []) => void; - Callback function for handling value changes.
- options: TDropdownOption[] | undefined; - Array of options.
- onOpen?: () => void; - Callback function triggered when the dropdown opens.
- onClose?: () => void; - Callback function triggered when the dropdown closes.
- containerClassName?: (isOpen: boolean) => string; - Function to return the class name for the container based on the open state.
- tabIndex?: number; - Sets the tab index for the dropdown.
- placement?: Placement; - Determines the placement of the dropdown (e.g., top, bottom, left, right).
- disabled?: boolean; - Disables the dropdown if set to true.

---

### Button Props

- buttonContent?: (isOpen: boolean) => React.ReactNode; - Function to render the content of the button based on the open state.
- buttonContainerClassName?: string; - Class name for the button container.
- buttonClassName?: string; - Class name for the button itself.

---

### Input Props

- disableSearch?: boolean; - Disables the search input if set to true.
- inputPlaceholder?: string; - Placeholder text for the search input.
- inputClassName?: string; - Class name for the search input.
- inputIcon?: React.ReactNode; - Icon to be displayed in the search input.
- inputContainerClassName?: string; - Class name for the search input container.

---

### Options Props

- keyExtractor: (option: TDropdownOption) => string; - Function to extract the key from each option.
- optionsContainerClassName?: string; - Class name for the options container.
- queryArray: string[]; - Array of strings to be used for querying the options.
- sortByKey: string; - Key to sort the options by.
- firstItem?: (optionValue: string) => boolean; - Function to determine if an option should be the first item.
- renderItem?: ({ value, selected }: { value: string; selected: boolean }) => React.ReactNode; - Function to render each option.
- loader?: React.ReactNode; - Loader element to be displayed while options are being loaded.
- disableSorting?: boolean; - Disables sorting of the options if set to true.

---

These properties offer extensive control over the dropdown's behavior and presentation, making it a highly versatile component suitable for various scenarios.

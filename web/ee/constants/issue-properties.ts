// icons
import { AlignLeft, Calendar, CircleChevronDown, Hash, ToggleLeft, UsersRound } from "lucide-react";
// plane web types
import {
  EIssuePropertyRelationType,
  EIssuePropertyType,
  TDateAttributeDisplayOptions,
  TDropdownAttributeOptions,
  TIssuePropertySettingsConfigurationsDetails,
  TIssuePropertySettingsMap,
  TissuePropertyTypeDetails,
  TIssuePropertyTypeKeys,
  TTextAttributeDisplayOptions,
} from "@/plane-web/types";

// Get the display name for the text attribute based on the display format
export const getTextAttributeDisplayName = (display_format: TTextAttributeDisplayOptions) => {
  switch (display_format) {
    case "single-line":
      return "Single line";
    case "multi-line":
      return "Paragraph";
    case "readonly":
      return "Read only";
    default:
      return "Invalid text format";
  }
};

// Get the display name for the date attribute based on the display format
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getDateAttributeDisplayName = (display_format: TDateAttributeDisplayOptions) => "No attributes";
// TODO: enable this in next phase of issue types
// switch (display_format) {
//   case "MMM dd, yyyy":
//     return "mmm. dd. yyyy";
//   case "dd/MM/yyyy":
//     return "dd. mm. yyyy";
//   case "MM/dd/yyyy":
//     return "mm. dd. yyyy";
//   case "yyyy/MM/dd":
//     return "yyyy. mm. dd";
//   default:
//     return "Invalid date format";
// }

export const ISSUE_PROPERTY_TYPE_DETAILS: Partial<
  Record<TIssuePropertyTypeKeys, TissuePropertyTypeDetails<EIssuePropertyType>>
> = {
  TEXT: {
    displayName: "Text",
    icon: AlignLeft,
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "AlignLeft",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.TEXT,
      relation_type: undefined,
      is_multi: undefined,
      is_required: false,
      default_value: undefined,
      settings: {
        display_format: "single-line",
      } as TIssuePropertySettingsMap[EIssuePropertyType.TEXT],
    },
  },
  DECIMAL: {
    displayName: "Number",
    icon: Hash,
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "Hash",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.DECIMAL,
      relation_type: undefined,
      is_multi: undefined,
      is_required: false,
      default_value: undefined,
      settings: undefined,
    },
  },
  OPTION: {
    displayName: "Dropdown",
    icon: CircleChevronDown,
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "CircleChevronDown",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.OPTION,
      relation_type: undefined,
      is_multi: false,
      is_required: false,
      default_value: undefined,
      settings: undefined,
    },
  },
  BOOLEAN: {
    displayName: "Boolean",
    icon: ToggleLeft,
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "ToggleLeft",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.BOOLEAN,
      relation_type: undefined,
      is_multi: undefined,
      is_required: false,
      default_value: ["false"],
      settings: undefined,
    },
  },
  DATETIME: {
    displayName: "Date",
    icon: Calendar,
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "Calendar",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.DATETIME,
      relation_type: undefined,
      is_multi: undefined,
      is_required: false,
      default_value: undefined,
      settings: undefined,
    },
  },
  RELATION_USER: {
    displayName: "Member picker",
    icon: UsersRound,
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "UsersRound",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.RELATION,
      relation_type: EIssuePropertyRelationType.USER,
      is_multi: false,
      is_required: false,
      default_value: undefined,
      settings: undefined,
    },
  },
};

export const DROPDOWN_ATTRIBUTES: Partial<{
  [key in TIssuePropertyTypeKeys]: {
    key: TDropdownAttributeOptions;
    label: string;
  }[];
}> = {
  RELATION_USER: [
    {
      key: "single_select",
      label: "Single select",
    },
    {
      key: "multi_select",
      label: "Multi select",
    },
  ],
  OPTION: [
    {
      key: "single_select",
      label: "Single select",
    },
    {
      key: "multi_select",
      label: "Multi select",
    },
  ],
};

export const ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS: Partial<TIssuePropertySettingsConfigurationsDetails> = {
  TEXT: [
    {
      keyToUpdate: ["display_format"],
      allowedEditingModes: ["create"],
      configurations: {
        componentToRender: "radio-input",
        options: [
          {
            label: getTextAttributeDisplayName("single-line"),
            value: "single-line",
          },
          {
            label: getTextAttributeDisplayName("multi-line"),
            value: "multi-line",
          },
          {
            label: getTextAttributeDisplayName("readonly"),
            value: "readonly",
          },
        ],
      },
    },
  ],
  DATETIME: [
    {
      keyToUpdate: ["display_format"],
      allowedEditingModes: ["create", "update"],
      configurations: {
        componentToRender: "radio-input",
        options: [
          {
            label: getDateAttributeDisplayName("MMM dd, yyyy"),
            value: "MMM dd, yyyy",
          },
          {
            label: getDateAttributeDisplayName("dd/MM/yyyy"),
            value: "dd/MM/yyyy",
          },
          {
            label: getDateAttributeDisplayName("MM/dd/yyyy"),
            value: "MM/dd/yyyy",
          },
          {
            label: getDateAttributeDisplayName("yyyy/MM/dd"),
            value: "yyyy/MM/dd",
          },
        ],
      },
    },
  ],
};

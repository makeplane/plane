// plane web types
import {
  TDropdownAttributeOptions,
  TIssuePropertySettingsConfigurationsDetails,
  TIssuePropertySettingsMap,
  TIssuePropertyTypeDetails,
  TIssuePropertyTypeKeys,
} from "@plane/types";

// Issue property types
export enum EIssuePropertyType {
  TEXT = "TEXT",
  DECIMAL = "DECIMAL",
  OPTION = "OPTION",
  BOOLEAN = "BOOLEAN",
  DATETIME = "DATETIME",
  RELATION = "RELATION",
}

// Issue property relation
export enum EIssuePropertyRelationType {
  ISSUE = "ISSUE",
  USER = "USER",
}

export const ISSUE_PROPERTY_TYPE_DETAILS: Partial<
  Record<TIssuePropertyTypeKeys, TIssuePropertyTypeDetails<EIssuePropertyType>>
> = {
  TEXT: {
    i18n_displayName: "work_item_types.settings.properties.property_type.text.label",
    iconKey: "AlignLeft",
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "AlignLeft",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.TEXT,
      relation_type: null,
      is_multi: false,
      is_required: false,
      default_value: [],
      settings: {
        display_format: "single-line",
      } as TIssuePropertySettingsMap[EIssuePropertyType.TEXT],
    },
  },
  DECIMAL: {
    i18n_displayName: "work_item_types.settings.properties.property_type.number.label",
    iconKey: "Hash",
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "Hash",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.DECIMAL,
      relation_type: null,
      is_multi: false,
      is_required: false,
      default_value: [],
      settings: undefined,
    },
  },
  OPTION: {
    i18n_displayName: "work_item_types.settings.properties.property_type.dropdown.label",
    iconKey: "CircleChevronDown",
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "CircleChevronDown",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.OPTION,
      relation_type: null,
      is_multi: false,
      is_required: false,
      default_value: [],
      settings: undefined,
    },
  },
  BOOLEAN: {
    i18n_displayName: "work_item_types.settings.properties.property_type.boolean.label",
    iconKey: "ToggleLeft",
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "ToggleLeft",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.BOOLEAN,
      relation_type: null,
      is_multi: false,
      is_required: false,
      default_value: [],
      settings: undefined,
    },
  },
  DATETIME: {
    i18n_displayName: "work_item_types.settings.properties.property_type.date.label",
    iconKey: "Calendar",
    dataToUpdate: {
      logo_props: {
        in_use: "icon",
        icon: {
          name: "Calendar",
          color: "#6d7b8a",
        },
      },
      property_type: EIssuePropertyType.DATETIME,
      relation_type: null,
      is_multi: false,
      is_required: false,
      default_value: [],
      settings: undefined,
    },
  },
  RELATION_USER: {
    i18n_displayName: "work_item_types.settings.properties.property_type.member_picker.label",
    iconKey: "UsersRound",
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
      default_value: [],
      settings: undefined,
    },
  },
};

export const DROPDOWN_ATTRIBUTES: Partial<{
  [key in TIssuePropertyTypeKeys]: {
    key: TDropdownAttributeOptions;
    i18n_label: string;
  }[];
}> = {
  RELATION_USER: [
    {
      key: "single_select",
      i18n_label: "work_item_types.settings.properties.attributes.relation.single_select.label",
    },
    {
      key: "multi_select",
      i18n_label: "work_item_types.settings.properties.attributes.relation.multi_select.label",
    },
  ],
  OPTION: [
    {
      key: "single_select",
      i18n_label: "work_item_types.settings.properties.attributes.relation.single_select.label",
    },
    {
      key: "multi_select",
      i18n_label: "work_item_types.settings.properties.attributes.relation.multi_select.label",
    },
  ],
};

export const ISSUE_PROPERTY_SETTINGS_CONFIGURATIONS: Partial<TIssuePropertySettingsConfigurationsDetails> =
{
  TEXT: [
    {
      keyToUpdate: ["display_format"],
      allowedEditingModes: ["create"],
      configurations: {
        componentToRender: "radio-input",
        options: [
          {
            labelKey: "single-line",
            value: "single-line",
          },
          {
            labelKey: "multi-line",
            value: "multi-line",
          },
          {
            labelKey: "readonly",
            value: "readonly",
          },
        ],
        verticalLayout: false,
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
            labelKey: "MMM dd, yyyy",
            value: "MMM dd, yyyy",
          },
          {
            labelKey: "dd/MM/yyyy",
            value: "dd/MM/yyyy",
          },
          {
            labelKey: "MM/dd/yyyy",
            value: "MM/dd/yyyy",
          },
          {
            labelKey: "yyyy/MM/dd",
            value: "yyyy/MM/dd",
          },
        ],
        verticalLayout: false,
      },
    },
  ],
};

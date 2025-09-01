import { RelationTypeEnum } from "@makeplane/plane-node-sdk";
import { SelectOption } from "@/types/form/base/field-options";
import { RelationField, SelectField, TextField } from "@/types/form/base/fields";

export class StaticFormFieldsService {
  getTitleField(orderInFormFields: number, required?: boolean, visible?: boolean): TextField {
    return {
      id: "title",
      name: "Title",
      type: "TEXT",
      required: required ?? true,
      visible: visible ?? true,
      order: orderInFormFields,
    };
  }

  getDescriptionField(orderInFormFields: number, required?: boolean, visible?: boolean): TextField {
    return {
      id: "description_html",
      name: "Description",
      type: "TEXT",
      required: required ?? false,
      visible: visible ?? true,
      order: orderInFormFields,
      placeholder: "Enter description",
      helpText: "Enter the description for the work item",
      isMulti: true,
    };
  }

  getPriorityField(orderInFormFields: number, required?: boolean, visible?: boolean): SelectField {
    const options: SelectOption[] = [
      { value: "none", label: "None" },
      { value: "low", label: "Low" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High" },
      { value: "urgent", label: "Urgent" },
    ];
    return {
      id: "priority",
      name: "Priority",
      type: "OPTION",
      required: required ?? false,
      visible: visible ?? true,
      order: orderInFormFields,
      placeholder: "Select priority",
      helpText: "Select the priority for the work item",
      options,
    };
  }

  getAssigneesField(orderInFormFields: number, required?: boolean, visible?: boolean): RelationField {
    return {
      id: "assignees",
      name: "Assignees",
      type: "RELATION",
      required: required ?? false,
      visible: visible ?? true,
      order: orderInFormFields,
      placeholder: "Select assignees",
      helpText: "Select the assignees for the work item",
      options: [],
      relationType: RelationTypeEnum.User,
      isMulti: true,
    };
  }

  getLabelsField(
    orderInFormFields: number,
    required?: boolean,
    visible?: boolean
  ): SelectField {
    return {
      id: "labels",
      name: "Labels",
      type: "OPTION",
      required: required ?? false,
      visible: visible ?? true,
      order: orderInFormFields,
      placeholder: "Select labels",
      helpText: "Select the labels for the work item",
      options: [],
      isMulti: true,
    };
  }

  getStatesField(
    orderInFormFields: number,
    required?: boolean,
    visible?: boolean
  ): SelectField {
    return {
      id: "state",
      name: "State",
      type: "OPTION",
      required: required ?? false,
      visible: visible ?? true,
      order: orderInFormFields,
      placeholder: "Select state",
      helpText: "Select the state for the work item",
      options: [],
    };
  }
}

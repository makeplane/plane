import { getCreateIntakeFormFields, getCreateWorkItemFormFields } from "@/services/form-fields";
import { E_KNOWN_FIELD_KEY, FormField } from "@/types/form/base";
import { TFormParserContext, TParsedFormResult, TWorkItemFormResult, TIntakeFormResult, TFormType } from "../../types/fields";
import { E_MESSAGE_ACTION_TYPES } from "../../types/types";
import { richTextBlockToMrkdwn } from "../parse-issue-form";
import { removePrefixIfExists } from "../slack-options";

/**
 * @fileoverview
 * This file contains the SlackFormParser class, which is used to parse the form data from Slack.
 * It is used to parse the form data from Slack and return a type-safe result.
 * Essentially, there are core fields and custom fields. The parser takes in the issue, issue's type
 * and project, and understand what fields are expected to be present. It moves on and the parse with
 * the same assumption for the custom fields.
 */


export class SlackFormParser {
  constructor(private context: TFormParserContext) { }

  private readonly coreFieldParsers = {
    project: (data: any) => data?.selected_option?.value,
    name: (data: any) => data?.value,
    description_html: (data: any) => richTextBlockToMrkdwn(data?.rich_text_value) || "<p></p>",
    assignees: (data: any) => data?.selected_options?.map((opt: any) => opt.value),
    state: (data: any) => data?.selected_option?.value,
    priority: (data: any) => data?.selected_option?.value,
    labels: (data: any) => data?.selected_options?.map((opt: any) => opt.value),
    enable_thread_sync: (data: any) => data?.selected_options?.length > 0,
    issue_type: (data: any) => removePrefixIfExists(data?.selected_option?.value),
  };

  async parse(viewData: {
    callback_id: string;
    state: { values: any };
    private_metadata?: string;
  }): Promise<TParsedFormResult> {
    try {
      switch (viewData.callback_id as E_MESSAGE_ACTION_TYPES) {
        case E_MESSAGE_ACTION_TYPES.CREATE_NEW_WORK_ITEM:
          return await this.parseWorkItem(viewData);

        case E_MESSAGE_ACTION_TYPES.CREATE_INTAKE_ISSUE:
          return await this.parseIntake(viewData);

        default:
          return {
            type: TFormType.UNKNOWN,
            success: false,
            error: `Unsupported callback_id: ${viewData.callback_id}`,
            callbackId: viewData.callback_id,
          };
      }
    } catch (error) {
      return {
        type: TFormType.UNKNOWN,
        success: false,
        error: error instanceof Error ? error.message : "Unknown parsing error",
        callbackId: viewData.callback_id,
      };
    }
  }

  private async parseWorkItem(viewData: any): Promise<TWorkItemFormResult> {
    const projectId = this.extractProjectId(viewData.state.values);

    const issueTypeFromForm = this.extractIssueType(viewData.state.values);
    const finalIssueTypeId = issueTypeFromForm;

    const formFields = await getCreateWorkItemFormFields(
      this.context.workspaceSlug,
      projectId,
      this.context.accessToken,
      finalIssueTypeId
    );

    const { coreFields, customFields } = this.parseFields(viewData.state.values, formFields.fields, projectId);

    return {
      type: TFormType.WORK_ITEM,
      success: true,
      data: {
        ...coreFields,
        customFields,
        projectId,
        formFields: formFields.fields,
      },
    };
  }

  private async parseIntake(viewData: any): Promise<TIntakeFormResult> {
    const projectId = this.extractProjectId(viewData.state.values);

    // Fetch the form definition
    const formFields = await getCreateIntakeFormFields(this.context.workspaceSlug, projectId);

    const { coreFields, customFields } = this.parseFields(viewData.state.values, formFields.fields, projectId);

    return {
      type: TFormType.INTAKE,
      success: true,
      data: {
        project: coreFields.project,
        name: coreFields.name,
        description_html: coreFields.description_html,
        priority: coreFields.priority,
        customFields,
        projectId,
        formFields: formFields.fields,
      },
    };
  }

  private parseFields(values: any, formFields: FormField[], projectId: string) {
    const coreFields = {
      project: projectId,
      name: "",
      description_html: "", // or whatever default you want
      state: undefined as string | undefined,
      state_id: undefined as string | undefined,
      priority: undefined as string | undefined,
      labels: undefined as string[] | undefined,
      enable_thread_sync: undefined as boolean | undefined,
      type_id: undefined as string | undefined,
    };

    const customFields: Record<string, unknown> = {};
    const fieldMap = new Map(formFields.map((field) => [field.id, field]));

    Object.entries(values).forEach(([_, blockData]: [string, any]) => {
      Object.entries(blockData).forEach(([actionKey, actionData]: [string, any]) => {
        // Parse core fields (backward compatibility)
        if (this.isCoreField(actionKey)) {
          this.parseCoreField(actionKey, actionData, coreFields);
        } else {
          // Parse dynamic custom fields using action_id pattern: projectId.fieldId
          const fieldId = removePrefixIfExists(actionKey);
          const field = fieldMap.get(fieldId);

          if (field) {
            const value = this.parseFieldValue(actionData, field);
            if (value !== undefined) {
              customFields[fieldId] = value;
            }
          }
        }
      });
    });

    return { coreFields, customFields };
  }

  private isCoreField(actionKey: string): boolean {
    const cleanActionKey = removePrefixIfExists(actionKey);
    return cleanActionKey in this.coreFieldParsers;
  }

  private parseCoreField(actionKey: string, actionData: any, coreFields: any) {
    const cleanActionKey = removePrefixIfExists(actionKey);
    const parser = this.coreFieldParsers[cleanActionKey as keyof typeof this.coreFieldParsers];
    if (!parser) return;

    const value = parser(actionData);
    if (value !== undefined) {
      if (cleanActionKey === E_KNOWN_FIELD_KEY.TITLE) {
        coreFields[E_KNOWN_FIELD_KEY.NAME] = value;
      } else if (cleanActionKey === E_KNOWN_FIELD_KEY.ISSUE_TYPE) {
        coreFields[E_KNOWN_FIELD_KEY.TYPE_ID] = value;
      } else {
        coreFields[cleanActionKey] = value;
      }
    }
  }

  private parseFieldValue(actionData: any, field: FormField): unknown {
    switch (field.type) {
      case "TEXT":
        return actionData.type === "plain_text_input" ? actionData.value : undefined;

      case "DECIMAL":
        if (actionData.type === "plain_text_input") {
          const num = parseFloat(actionData.value);
          return isNaN(num) ? undefined : num;
        }
        return undefined;

      case "OPTION":
        if (
          field.isMulti &&
          (actionData.type === "multi_static_select" || actionData.type === "multi_external_select")
        ) {
          return actionData.selected_options?.map((opt: any) => opt.value) || [];
        } else if (!field.isMulti && (actionData.type === "static_select" || actionData.type === "external_select")) {
          return actionData.selected_option?.value;
        }
        return undefined;

      case "RELATION":
        if (field.isMulti && actionData.type === "multi_external_select") {
          return actionData.selected_options?.map((opt: any) => opt.value) || [];
        } else if (!field.isMulti && actionData.type === "external_select") {
          return actionData.selected_option?.value;
        }
        return undefined;

      case "DATETIME":
        return actionData.type === "datepicker" ? actionData.selected_date : undefined;

      case "BOOLEAN":
        return actionData.type === "checkboxes" ? actionData.selected_options?.length > 0 : false;

      default:
        return actionData.value;
    }
  }

  private extractProjectId(values: any): string {
    let projectId = "";

    Object.entries(values).forEach(([_, blockData]: [string, any]) => {
      if (blockData.project?.type === "static_select") {
        projectId = blockData.project.selected_option?.value;
      }
    });

    return projectId;
  }

  private extractIssueType(values: any): string | undefined {
    let issueTypeId: string | undefined;

    Object.entries(values).forEach(([_, blockData]: [string, any]) => {
      Object.entries(blockData).forEach(([actionKey, actionData]: [string, any]) => {
        if (actionKey.includes(E_KNOWN_FIELD_KEY.ISSUE_TYPE) && actionData?.type === "static_select") {
          issueTypeId = removePrefixIfExists(actionData.selected_option?.value);
        }
      });
    });

    return issueTypeId;
  }


}

export const createSlackFormParser = (context: TFormParserContext) => new SlackFormParser(context);

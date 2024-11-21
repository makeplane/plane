import { E_IMPORTER_STEPS } from "@/plane-web/silo/jira/types";

export enum E_FORM_RADIO_DATA {
  CREATE_AS_LABEL = "create_as_label",
  ADD_IN_TITLE = "add_in_title",
}
export type TFormRadioData = E_FORM_RADIO_DATA.CREATE_AS_LABEL | E_FORM_RADIO_DATA.ADD_IN_TITLE;

export type TImporterDataPayload = {
  [E_IMPORTER_STEPS.SELECT_PLANE_PROJECT]: {
    projectId: string | undefined;
  };
  [E_IMPORTER_STEPS.CONFIGURE_JIRA]: {
    resourceId: string | undefined;
    projectId: string | undefined;
    issueType: TFormRadioData;
  };
  [E_IMPORTER_STEPS.IMPORT_USERS_FROM_JIRA]: {
    userSkipToggle: boolean;
    userData: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_STATES]: {
    [key: string]: string | undefined;
  };
  [E_IMPORTER_STEPS.MAP_PRIORITY]: {
    [key: string]: string | undefined;
  };
};

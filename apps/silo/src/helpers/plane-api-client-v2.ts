import {
  Configuration,
  CyclesApi,
  LabelsApi,
  ModulesApi,
  ProjectsApi,
  StatesApi,
  UsersApi,
  WorkItemsApi,
  MembersApi,
  WorkItemTypesApi,
  WorkItemPropertiesApi,
  ConfigurationParameters,
} from "@makeplane/plane-node-sdk";
import { env } from "@/env";

export class PlaneClientV2 {
  config: Configuration;
  workItemsApi: WorkItemsApi;
  workItemTypesApi: WorkItemTypesApi;
  workItemPropertiesApi: WorkItemPropertiesApi;
  projectsApi: ProjectsApi;
  labelsApi: LabelsApi;
  statesApi: StatesApi;
  usersApi: UsersApi;
  membersApi: MembersApi;
  modulesApi: ModulesApi;
  cyclesApi: CyclesApi;

  constructor(config: ConfigurationParameters) {
    this.config = new Configuration({
      ...config,
      basePath: env.API_BASE_URL,
    });

    this.workItemsApi = new WorkItemsApi(this.config);
    this.workItemTypesApi = new WorkItemTypesApi(this.config);
    this.workItemPropertiesApi = new WorkItemPropertiesApi(this.config);
    this.projectsApi = new ProjectsApi(this.config);
    this.labelsApi = new LabelsApi(this.config);
    this.statesApi = new StatesApi(this.config);
    this.usersApi = new UsersApi(this.config);
    this.membersApi = new MembersApi(this.config);
    this.modulesApi = new ModulesApi(this.config);
    this.cyclesApi = new CyclesApi(this.config);
  }
}

export const getPlaneClientV2 = ({ accessToken, apiKey }: { accessToken?: string; apiKey?: string }): PlaneClientV2 => {
  let planeClientV2: PlaneClientV2 | null = null;
  if (accessToken) {
    planeClientV2 = new PlaneClientV2({ accessToken });
  } else if (apiKey) {
    planeClientV2 = new PlaneClientV2({ apiKey });
  } else {
    throw new Error("No access token or api key provided");
  }
  return planeClientV2;
};

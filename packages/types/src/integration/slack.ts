import { TWorkspaceConnection, TWorkspaceEntityConnection } from "../workspace";

// slack entity connection config
export type TSlackEntityConnectionConfig = object;

// slack workspace connection config
export type TSlackWorkspaceConnectionConfig = object;

// slack workspace connection data
export type TSlackWorkspaceConnectionData = {
  id: string;
  name: string;
};

// slack workspace connection
export type TSlackWorkspaceConnection = TWorkspaceConnection<TSlackWorkspaceConnectionData, TSlackWorkspaceConnectionConfig>;

// slack entity connection
export type TSlackEntityConnection = TWorkspaceEntityConnection<TSlackEntityConnectionConfig>;

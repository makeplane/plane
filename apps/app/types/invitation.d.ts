import { IWorkspace } from "./";

export interface IWorkspaceInvitation {
  id: string;
  workspace: IWorkspace;
  created_at: Date;
  updated_at: Date;
  email: string;
  accepted: boolean;
  token: string;
  message: string;
  responded_at: Date;
  role: number;
  created_by: null;
  updated_by: null;
}

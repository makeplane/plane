import { IState } from "@plane/types";
import { E_SILO_ERROR_CODES } from "../types/error";

const entries = Object.entries(E_SILO_ERROR_CODES);

export const SILO_ERROR_CODES = (
  Object.entries(E_SILO_ERROR_CODES) as Array<[keyof typeof E_SILO_ERROR_CODES, string]>
).map((key) => ({
  code: key[1],
  description: key[0].toLowerCase(),
}));

export const EMPTY_PLANE_STATE: IState = {
  id: "",
  name: "No transition",
  group: "backlog",
  color: "#000000",
  default: false,
  description: "",
  project_id: "",
  sequence: 0,
  workspace_id: "",
  order: 0,
};

import { RepositoryService } from "@/services/qa";

export const formatDateTime = (isoString:string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
export const formatDate = (isoString:string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };


export const getEnums = async (workspaceSlug: string) => {
  const repositoryService = new RepositoryService();
  const response: any = await repositoryService.enumsList(
    workspaceSlug as string,
  );
  return response || {};
}

export type TGlobalEnums = {
  plan_state: Record<number | string, string>;
  case_state: Record<number | string, string>;
  case_type: Record<number | string, string>;
  case_priority: Record<number | string, string>;
  plan_case_result: Record<number | string, string>;
};

export const globalEnums = {
  Enums: { 
    plan_state: {}, 
    case_state: {}, 
    case_type: {}, 
    case_priority: {},
    plan_case_result: {}
  } as TGlobalEnums,
  setEnums: (value: TGlobalEnums) => {
    globalEnums.Enums = value;
  },
};


// plane imports
import { TWorkItemTemplate } from "@plane/types";
// local imports
import { BaseTemplateInstance, IBaseTemplateInstance, TBaseTemplateInstanceProps } from "./base";

export type TWorkItemTemplateInstanceProps = TBaseTemplateInstanceProps<TWorkItemTemplate>;

// export interface IWorkItemTemplateInstance extends IBaseTemplate<TWorkItemTemplate> { }
export type IWorkItemTemplateInstance = IBaseTemplateInstance<TWorkItemTemplate>;

export class WorkItemTemplateInstance extends BaseTemplateInstance<TWorkItemTemplate> implements IWorkItemTemplateInstance {
  constructor(protected store: TWorkItemTemplateInstanceProps) {
    super(store);
  }
}

// plane imports
import { PartialDeep, TBaseTemplateWithData } from "@plane/types";

export interface IBaseTemplateActionCallbacks<T extends TBaseTemplateWithData> {
  create: (template: PartialDeep<T>) => Promise<T>;
  update: (templateId: string, data: PartialDeep<T>) => Promise<T>;
  destroy: (template: T) => Promise<void>;
}

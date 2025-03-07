// plane imports
import { ETemplateType } from "@plane/constants";
import { PartialDeep, TBaseTemplate } from "@plane/types";

export interface IBaseTemplateActionCallbacks<T extends TBaseTemplate<ETemplateType, Record<string, unknown>>> {
  create: (template: PartialDeep<T>) => Promise<T>;
  update: (templateId: string, data: PartialDeep<T>) => Promise<T>;
  destroy: (template: T) => Promise<void>;
}

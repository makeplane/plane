import { PartialDeep, TBaseTemplateWithData } from "@plane/types";

export type ITemplateService<T extends TBaseTemplateWithData> = {
  list: () => Promise<T[]>;
  retrieve: (templateId: string) => Promise<T>;
  create: (template: PartialDeep<T>) => Promise<T>;
  update: (templateId: string, data: PartialDeep<T>) => Promise<T>;
  destroy: (templateId: string) => Promise<void>;
};

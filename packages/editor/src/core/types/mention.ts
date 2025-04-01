// plane types
import { IUserLite, TSearchEntities } from "@plane/types";

export type TMentionSuggestion = {
  entity_identifier: string;
  entity_name: TSearchEntities;
  icon: React.ReactNode;
  id: string;
  subTitle?: string;
  title: string;
};

export type TMentionSection = {
  key: string;
  title?: string;
  items: TMentionSuggestion[];
};

export type TMentionComponentProps = Pick<TMentionSuggestion, "entity_identifier" | "entity_name">;

export type TReadOnlyMentionHandler = {
  renderComponent: (props: TMentionComponentProps) => React.ReactNode;
  getMentionedEntityDetails?: (entity_identifier: string) => { display_name: string } | undefined;
};

export type TMentionHandler = TReadOnlyMentionHandler & {
  searchCallback?: (query: string) => Promise<TMentionSection[]>;
};

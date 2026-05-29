export type TBaseActivity<TFieldKey extends string = string, TVerbKey extends string = string> = {
  id: string;
  field: TFieldKey | undefined;
  epoch: number;
  verb: TVerbKey;
  comment: string | undefined;
  // updates
  old_value: string | undefined;
  new_value: string | undefined;
  old_identifier: string | undefined;
  new_identifier: string | undefined;
  // actor detail
  actor: string;
  // timestamp
  created_at: string;
  updated_at: string;
};

export type TWorkspaceBaseActivity<K extends string = string, V extends string = string> = TBaseActivity<K, V> & {
  workspace: string;
};

export type TProjectBaseActivity<K extends string = string, V extends string = string> = TWorkspaceBaseActivity<
  K,
  V
> & {
  project: string;
};

export type TBaseActivityVerbs = "created" | "updated" | "deleted";

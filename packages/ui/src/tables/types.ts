export type TTableColumn<T> = {
  key: string;
  content: string;
  thRender?: () => JSX.Element;
  tdRender: (rowData: T) => JSX.Element;
};

export type TTableData<T> = {
  data: T[];
  columns: TTableColumn<T>[];
  keyExtractor: (rowData: T) => string;
  // classNames
  tableClassName?: string;
  tHeadClassName?: string;
  tHeadTrClassName?: string;
  thClassName?: string;
  tBodyClassName?: string;
  tBodyTrClassName?: string;
  tdClassName?: string;
};

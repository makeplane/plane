export type TTableColumn<T> = {
  key: string;
  content: string;
  thRender?: () => React.ReactNode;
  tdRender: (rowData: T) => React.ReactNode;
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

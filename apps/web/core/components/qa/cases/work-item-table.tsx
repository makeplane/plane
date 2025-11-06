import React from "react";
import { Table } from "antd";

export type WorkItemTableProps<T> = {
  data: T[];
  loading?: boolean;
  columns: any;
  rowKey: string | ((record: T) => string);
  current: number;
  pageSize: number;
  total: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  rowSelection?: any;
  showQuickJumper?: boolean;
  showSizeChanger?: boolean;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
};

export function WorkItemTable<T>({
  data,
  loading,
  columns,
  rowKey,
  rowSelection,
}: WorkItemTableProps<T>) {
  return (
    <Table<T>
      size="small"
      rowKey={rowKey as any}
      loading={loading}
      dataSource={data as any}
      columns={columns as any}
      rowSelection={rowSelection as any}
    />
  );
}
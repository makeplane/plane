"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Modal, Space, Button, Input, Tree, Table, Tag, message } from "antd";
import { globalEnums, getEnums } from "app/(all)/[workspaceSlug]/(projects)/test-management/util";
import type { TableProps } from "antd";
import { CaseService as QaCaseService } from "@/services/qa/case.service";
import styles from "./TestCaseSelectionModal.module.css";
import { DeleteOutlined } from "@ant-design/icons";

type TModuleNode = { id: string; name: string; children?: TModuleNode[]; total?: number };
type TTestCase = {
  id: string;
  name: string;
  module?: { name?: string } | null;
  type?: number;
  priority?: number;
  created_at?: string;
};
type TTestCaseResponse = { count: number; data: TTestCase[] };

type Props = {
  open: boolean;
  onClose: () => void;
  initialSelectedIds: string[];
  onConfirm: (ids: string[]) => void;
  onChangeSelected?: (ids: string[]) => void;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
};

const getEnumLabel = (group: "case_state" | "case_type" | "case_priority", value?: number) => {
  if (value === null || value === undefined) return "-";
  const map = (globalEnums.Enums as any)?.[group] || {};
  const label = map[value] ?? map[String(value)] ?? value;
  return label as string;
};

const renderEnumTag = (
  group: "case_state" | "case_type" | "case_priority",
  value?: number,
  color: "default" | "processing" | "success" | "warning" | "magenta" = "default"
) => {
  const label = getEnumLabel(group, value);
  if (label === "-" || label === undefined) return <span className="text-custom-text-400">-</span>;
  return <Tag color={color}>{label}</Tag>;
};

export default function TestCaseSelectionModal({
  open,
  onClose,
  initialSelectedIds,
  onConfirm,
  onChangeSelected,
}: Props) {
  const { workspaceSlug } = useParams();
  const qaCaseService = useMemo(() => new QaCaseService(), []);
  const repositoryId = typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryId") : null;

  const [modules, setModules] = useState<TModuleNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<string[] | undefined>(undefined);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [cases, setCases] = useState<TTestCase[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchName, setSearchName] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMap, setSelectedMap] = useState<Record<string, TTestCase>>({});

  const orderedCases = useMemo(() => {
    const list = cases || [];
    const selectedList = list.filter((c) => selectedIds.has(String(c.id)));
    const unselectedList = list.filter((c) => !selectedIds.has(String(c.id)));
    return [...selectedList, ...unselectedList];
  }, [cases, selectedIds]);

  useEffect(() => {
    if (!open) return;
    const init = initialSelectedIds?.map(String) || [];
    setSelectedIds(new Set(init));
  }, [open]);

  useEffect(() => {
    if (!open || !workspaceSlug) return;
    getEnums(String(workspaceSlug))
      .then(globalEnums.setEnums)
      .catch(() => {});
  }, [open, workspaceSlug]);

  useEffect(() => {
    if (!open || !workspaceSlug || !repositoryId) return;
    setLoadingModules(true);
    qaCaseService
      .getModules(workspaceSlug as string, repositoryId as string)
      .then(async (moduleData: any[]) => {
        const countsResponse = await qaCaseService.getModulesCount(workspaceSlug as string, repositoryId as string);
        const { total: _t = 0, ...countsMap } = countsResponse || {};
        const withCounts = (moduleData || []).map((m: any) => ({
          id: String(m.id),
          name: String(m.name),
          children: (m.children || []).map((c: any) => ({
            id: String(c.id),
            name: String(c.name),
            children: c.children || [],
          })),
          total: countsMap[String(m.id)] ?? undefined,
        }));
        setModules(withCounts);
        setExpandedKeys(undefined);
        setAutoExpandParent(true);
      })
      .catch((err: any) => {
        setModules([]);
        message.error(err?.message || "获取模块失败");
      })
      .finally(() => setLoadingModules(false));
  }, [open, workspaceSlug, repositoryId, qaCaseService]);

  const fetchCases = async (page = currentPage, size = pageSize) => {
    if (!workspaceSlug || !repositoryId) return;
    setLoadingCases(true);
    try {
      const query: any = { page, page_size: size, repository_id: repositoryId };
      if (selectedModuleId) query.module_id = selectedModuleId;
      if (searchName) query.name__icontains = searchName;
      const res: TTestCaseResponse = await qaCaseService.getCases(workspaceSlug as string, query);
      setCases(res?.data || []);
      setTotal(res?.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err: any) {
      message.error(err?.message || "获取用例失败");
    } finally {
      setLoadingCases(false);
    }
  };

  useEffect(() => {
    if (!open || !repositoryId) return;
    fetchCases(1, pageSize);
  }, [selectedModuleId, searchName]);

  useEffect(() => {
    if (!open || !repositoryId) return;
    fetchCases(currentPage, pageSize);
  }, [open]);

  const onTreeSelect = (_keys: any, info: any) => {
    const key = String(info?.node?.key || "");
    if (key) setSelectedModuleId(key === "all" ? null : key);
  };

  const treeData = [
    {
      title: <span className="text-sm text-custom-text-200">全部模块</span>,
      key: "all",
      children: (modules || []).map((m) => ({
        title: (
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="text-sm text-custom-text-200">{m.name}</span>
            {typeof m.total === "number" && <span className="text-xs text-custom-text-300">{m.total}</span>}
          </div>
        ),
        key: m.id,
        children: (m.children || []).map((c) => ({ title: String(c.name), key: String(c.id) })),
      })),
    },
  ];

  const rowSelection = {
    selectedRowKeys: Array.from(selectedIds),
    onSelect: (record: TTestCase, selected: boolean) => {
      const id = String(record.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) next.add(id);
        else next.delete(id);
        onChangeSelected?.(Array.from(next));
        return next;
      });
      setSelectedMap((prev) => {
        const next = { ...prev };
        if (selected) next[id] = record;
        else delete next[id];
        return next;
      });
    },
    onSelectAll: (selected: boolean) => {
      const currentIds = cases.map((c) => String(c.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) currentIds.forEach((id) => next.add(id));
        else currentIds.forEach((id) => next.delete(id));
        onChangeSelected?.(Array.from(next));
        return next;
      });
      setSelectedMap((prev) => {
        const next = { ...prev };
        if (selected) cases.forEach((c) => (next[String(c.id)] = c));
        else cases.forEach((c) => delete next[String(c.id)]);
        return next;
      });
    },
  } as any;

  const caseColumns: TableProps<TTestCase>["columns"] = [
    { title: "名称", dataIndex: "name", key: "name", render: (v) => <span className={styles.nameCell}>{v}</span> },
    { title: "模块", dataIndex: "module", key: "module", render: (m) => m?.name || "-", width: 160 },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (v) => renderEnumTag("case_type", v, "magenta"),
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (v) => renderEnumTag("case_priority", v, "warning"),
    },
  ];

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="选择测试用例"
      width={1200}
      keyboard={false}
      maskClosable={false}
      getContainer={false}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleConfirm} loading={loadingCases || loadingModules}>
            确定
          </Button>
        </Space>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.content}>
          <div className={styles.leftPane}>
            <div className="px-2 py-2 flex items-center justify-between">
              <span className="text-sm text-custom-text-300">用例模块</span>
            </div>
            <div className="px-2">
              <Tree
                defaultExpandAll
                onSelect={onTreeSelect}
                onExpand={(keys) => {
                  setExpandedKeys(keys as string[]);
                  setAutoExpandParent(false);
                }}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                treeData={treeData}
                selectedKeys={selectedModuleId ? [selectedModuleId] : ["all"]}
              />
            </div>
          </div>
          <div className={styles.rightPane}>
            <div className="flex items-center justify-between mb-2">
              <Input
                placeholder="按名称搜索"
                allowClear
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-64"
              />
            </div>
            <Table<TTestCase>
              size="small"
              rowKey="id"
              loading={loadingCases}
              dataSource={orderedCases}
              columns={caseColumns as any}
              showHeader
              pagination={{
                current: currentPage,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (page) => {
                  setCurrentPage(page);
                  fetchCases(page, pageSize);
                },
                onShowSizeChange: (_current, size) => {
                  setPageSize(size);
                  fetchCases(1, size);
                },
                showTotal: (t, r) => `第 ${r[0]}-${r[1]} 条，共 ${t} 条`,
              }}
              rowSelection={rowSelection}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

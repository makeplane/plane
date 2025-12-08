"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Modal, Space, Button, Input, Table, Tag, message, Tree, Select } from "antd";
import type { TableProps } from "antd";
import { CaseService as QaCaseService } from "@/services/qa/case.service";
import { RepositoryService } from "@/services/qa/repository.service";
import styles from "../../../qa/review/TestCaseSelectionModal.module.css";
import { Trash2 } from "lucide-react";
import { globalEnums, getEnums } from "app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/test-management/util";

type TModuleNode = { id: string; name: string; children?: TModuleNode[]; total?: number };
type TTestCase = {
  id: string;
  name: string;
  module?: { id?: string; name?: string } | null;
  repository?: { name?: string } | null;
  type?: number;
  priority?: number;
  created_at?: string;
};

type Props = {
  open: boolean;
  workspaceSlug: string;
  issueId: string;
  onClose: () => void;
  onConfirmed?: () => void;
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

export default function IssueCaseSelectionModal({ open, workspaceSlug, issueId, onClose, onConfirmed }: Props) {
  const qaCaseService = useMemo(() => new QaCaseService(), []);
  const repositoryService = useMemo(() => new RepositoryService(), []);

  const [cases, setCases] = useState<TTestCase[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [searchName, setSearchName] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedMap, setSelectedMap] = useState<Record<string, TTestCase>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [repositories, setRepositories] = useState<any[]>([]);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string | null>(null);
  const [modules, setModules] = useState<TModuleNode[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<string[] | undefined>(undefined);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  useEffect(() => {
    if (!open || !workspaceSlug) return;
    getEnums(String(workspaceSlug))
      .then(globalEnums.setEnums)
      .catch(() => {});
  }, [open, workspaceSlug]);

  useEffect(() => {
    if (!open || !workspaceSlug) return;
    repositoryService
      .getRepositories(workspaceSlug, { page: 1, page_size: 10000 })
      .then((res) => {
        // Adjusting for potential data structure differences
        const list = Array.isArray(res) ? res : res?.results || res?.data || [];
        setRepositories(list);
        if (list.length > 0) {
          setSelectedRepositoryId(list[0].id);
        }
      })
      .catch((err) => {
        message.error(err?.message || "获取用例库失败");
      });
  }, [open, workspaceSlug]);

  useEffect(() => {
    if (!open || !workspaceSlug || !selectedRepositoryId) return;
    qaCaseService
      .getModules(workspaceSlug, selectedRepositoryId)
      .then((moduleData: any[]) => {
        const withCounts = (moduleData || []).map((m: any) => ({
          id: String(m.id),
          name: String(m.name),
          children: (m.children || []).map((c: any) => ({
            id: String(c.id),
            name: String(c.name),
            children: c.children || [],
          })),
        }));
        setModules(withCounts);
        setExpandedKeys(undefined);
        setAutoExpandParent(true);
      })
      .catch((err: any) => {
        setModules([]);
        message.error(err?.message || "获取模块失败");
      });
  }, [open, workspaceSlug, selectedRepositoryId, qaCaseService]);

  const fetchCases = useCallback(async () => {
    if (!open || !workspaceSlug || !issueId || !selectedRepositoryId) return;
    setLoadingCases(true);
    try {
      const list: any = await qaCaseService.getUnselectIssueCase(
        String(workspaceSlug),
        String(issueId),
        selectedRepositoryId,
        selectedModuleId || undefined
      );
      setCases(Array.isArray(list) ? (list as TTestCase[]) : []);
    } catch (err: any) {
      message.error(err?.message || "获取未关联用例失败");
      setCases([]);
    } finally {
      setLoadingCases(false);
    }
  }, [open, workspaceSlug, issueId, selectedRepositoryId, selectedModuleId, qaCaseService]);

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    setSelectedMap({});
    setSearchName("");
    setCurrentPage(1);
    fetchCases();
  }, [open, fetchCases]);

  const filteredCases = useMemo(() => {
    const q = (searchName || "").trim().toLowerCase();
    if (!q) return cases || [];
    return (cases || []).filter((c) =>
      String(c.name || "")
        .toLowerCase()
        .includes(q)
    );
  }, [cases, searchName]);

  const total = filteredCases.length;
  const pagedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredCases.slice(start, end);
  }, [filteredCases, currentPage, pageSize]);

  const orderedCases = useMemo(() => {
    const list = pagedCases || [];
    const selectedList = list.filter((c) => selectedIds.has(String(c.id)));
    const unselectedList = list.filter((c) => !selectedIds.has(String(c.id)));
    return [...selectedList, ...unselectedList];
  }, [pagedCases, selectedIds]);

  const rowSelection = {
    selectedRowKeys: Array.from(selectedIds),
    onSelect: (record: TTestCase, selected: boolean) => {
      const id = String(record.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) next.add(id);
        else next.delete(id);
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
      const currentIds = orderedCases.map((c) => String(c.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (selected) currentIds.forEach((id) => next.add(id));
        else currentIds.forEach((id) => next.delete(id));
        return next;
      });
      setSelectedMap((prev) => {
        const next = { ...prev };
        if (selected) orderedCases.forEach((c) => (next[String(c.id)] = c));
        else orderedCases.forEach((c) => delete next[String(c.id)]);
        return next;
      });
    },
  } as any;

  const caseColumns: TableProps<TTestCase>["columns"] = [
    { title: "名称", dataIndex: "name", key: "name", render: (v) => <span className={styles.nameCell}>{v}</span> },
    { title: "模块", dataIndex: "module", key: "module", render: (m) => m?.name || "-", width: 160 },
    { title: "用例库", dataIndex: "repository", key: "repository", render: (r) => r?.name || "-", width: 160 },
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

  const handleConfirm = async () => {
    if (!workspaceSlug || !issueId) return;
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      message.warning("请先选择要关联的用例");
      return;
    }
    setConfirmLoading(true);
    try {
      await Promise.all(
        ids.map((caseId) => qaCaseService.addIssueCase(String(workspaceSlug), String(issueId), String(caseId)))
      );
      message.success("已成功关联所选用例");
      onClose();
    } catch (e: any) {
      message.error(e?.message || "关联用例失败");
    } finally {
      setConfirmLoading(false);
    }
  };

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
          </div>
        ),
        key: m.id,
        children: (m.children || []).map((c) => ({ title: String(c.name), key: String(c.id) })),
      })),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-4">
          <span>选择测试用例</span>
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              style={{ width: 200 }}
              bordered={false}
              suffixIcon={null}
              placeholder="选择用例库"
              value={selectedRepositoryId}
              onChange={(value) => {
                setSelectedRepositoryId(value);
                setSelectedModuleId(null);
              }}
              options={repositories.map((repo) => ({ label: repo.name, value: repo.id }))}
              getPopupContainer={(triggerNode) => triggerNode.parentElement}
            />
          </div>
        </div>
      }
      width={1200}
      keyboard={false}
      maskClosable={false}
      getContainer={false}
      destroyOnClose
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleConfirm} loading={confirmLoading || loadingCases}>
            确定
          </Button>
        </Space>
      }
    >
      <div className={styles.modalBody} style={{ height: "calc(60vh + 50px)", maxHeight: "calc(60vh + 50px)" }}>
        <div className={styles.content}>
          <div className={styles.leftPane} style={{ width: "25%", paddingTop: "12px" }}>
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
          <div className={styles.rightPane} style={{ width: "75%" }}>
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
              pagination={{
                current: currentPage,
                pageSize,
                total,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (page) => {
                  setCurrentPage(page);
                },
                onShowSizeChange: (_current, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
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

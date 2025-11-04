// 文件顶部 imports
import React, { useEffect, useMemo, useState } from "react";
import { Modal, List, Button, Checkbox, Spin, Empty, Tag, message, Input, Table } from "antd";
import type { TPartialProject, TIssue, TIssuesResponse } from "@plane/types";
import { ProjectService } from "@/services/project/project.service";
import { IssueService } from "@/services/issue/issue.service";
import { Logo } from "@/components/common/logo";
import { ProjectIssueTypeService, projectIssueTypesCache, TIssueType } from "@/services/project";
import * as LucideIcons from "lucide-react";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  onClose: () => void;
  onConfirm: (issues: TIssue[]) => void;
};

export const WorkItemSelectModal: React.FC<Props> = ({ isOpen, workspaceSlug, onClose, onConfirm }) => {
  const projectService = useMemo(() => new ProjectService(), []);
  const issueService = useMemo(() => new IssueService(), []);

  const [projects, setProjects] = useState<TPartialProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [issues, setIssues] = useState<TIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());

  // 新增：项目搜索关键字
  const [projectSearch, setProjectSearch] = useState<string>("");

  // 新增：过滤后的项目列表
  const filteredProjects = useMemo(
    () => projects.filter((p) => (p.name || "").toLowerCase().includes(projectSearch.toLowerCase())),
    [projects, projectSearch]
  );
  const issueTypeService = useMemo(() => new ProjectIssueTypeService(), []);
  const [projectIssueTypesMap, setProjectIssueTypesMap] = useState<Record<string, TIssueType> | undefined>(undefined);

  useEffect(() => {
    if (!isOpen || !selectedProjectId) {
      setProjectIssueTypesMap(undefined);
      return;
    }
    issueTypeService
      .fetchProjectIssueTypes(workspaceSlug, selectedProjectId)
      .then(() => {
        // 使用缓存的映射
        setProjectIssueTypesMap(projectIssueTypesCache.get(selectedProjectId));
      })
      .catch(() => {
        setProjectIssueTypesMap(undefined);
      });
  }, [isOpen, workspaceSlug, selectedProjectId, issueTypeService]);

  // 渲染类型图标（参考 issue-detail.tsx 逻辑）
  const renderIssueTypeIcon = (record: TIssue) => {
    const typeId = (record as any)?.type_id as string | undefined;
    const map = projectIssueTypesMap;
    if (typeId && map && map[typeId]?.logo_props?.icon) {
      const { name, color, background_color } = map[typeId].logo_props!.icon!;
      const IconComp = (LucideIcons as any)[name] as React.FC<any> | undefined;
      return (
        <span
          className="inline-flex items-center justify-center rounded-sm"
          style={{
            backgroundColor: background_color || "transparent",
            color: color || "currentColor",
            width: "16px",
            height: "16px",
          }}
          aria-label={`Issue type: ${map[typeId].name}`}
        >
          {IconComp ? (
            <IconComp className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <LucideIcons.Layers className="h-3.5 w-3.5" />
          )}
        </span>
      );
    }
    // 映射为空或无图标配置时的兜底
    return <LucideIcons.Layers className="h-3.5 w-3.5" />;
  };
  // 新增：Table 列定义（展示名称与状态）
  const columns = useMemo(
    () => [
      {
        title: "名称",
        dataIndex: "name",
        key: "name",
        render: (_: any, record: TIssue) => (
          <div className="flex items-center gap-2">
            {renderIssueTypeIcon(record)}
            <span className="truncate">{record.name}</span>
          </div>
        ),
      },
      {
        title: "状态",
        key: "state",
        render: (_: any, record: TIssue) => <Tag>{record.state__group ?? record.state_id ?? "-"}</Tag>,
      },
    ],
    [projectIssueTypesMap]
  );

  // 新增：Table 多选
  const rowSelection = {
    selectedRowKeys: Array.from(selectedIssueIds),
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedIssueIds(new Set(selectedRowKeys as string[]));
    },
  };

  useEffect(() => {
    if (!isOpen) return;
    setLoadingProjects(true);
    projectService
      .getProjectsLite(workspaceSlug)
      .then((data) => {
        setProjects(data || []);
        // 默认选中第一项项目
        if (data && data.length > 0) {
          setSelectedProjectId(data[0].id as string);
        } else {
          setSelectedProjectId(null);
        }
      })
      .catch((err) => {
        message.error(`获取项目列表失败：${err?.message || "未知错误"}`);
      })
      .finally(() => setLoadingProjects(false));
  }, [isOpen, workspaceSlug, projectService]);

  useEffect(() => {
    if (!isOpen || !selectedProjectId) {
      setIssues([]);
      return;
    }
    setLoadingIssues(true);
    // 兼容返回结构（数组或分组对象）
    issueService
      .getIssues(workspaceSlug, selectedProjectId, {})
      .then((res: TIssuesResponse) => {
        const flat: TIssue[] = normalizeIssues(res);
        setIssues(flat);
        // 清空已选（切换项目时）
        setSelectedIssueIds(new Set());
      })
      .catch((err) => {
        message.error(`获取工作项失败：${err?.message || "未知错误"}`);
      })
      .finally(() => setLoadingIssues(false));
  }, [isOpen, workspaceSlug, selectedProjectId, issueService]);

  const normalizeIssues = (res: TIssuesResponse): TIssue[] => {
    const { results } = res || {};
    if (!results) return [];
    if (Array.isArray(results)) return results as TIssue[];
    const out: TIssue[] = [];
    for (const key in results) {
      const groupObj = (results as any)[key];
      const groupResults = groupObj?.results;
      if (Array.isArray(groupResults)) {
        out.push(...(groupResults as TIssue[]));
      } else if (groupResults && typeof groupResults === "object") {
        for (const subKey in groupResults) {
          const sub = groupResults[subKey];
          if (Array.isArray(sub?.results)) out.push(...(sub.results as TIssue[]));
        }
      }
    }
    return out;
  };

  const toggleIssue = (id: string, checked: boolean) => {
    setSelectedIssueIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = issues.filter((i) => selectedIssueIds.has(i.id));
    onConfirm(selected);
  };

  const leftWidth = "30%";
  const rightWidth = "70%";

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title="选择工作项"
      width="70vw"
      destroyOnClose
      maskClosable={false}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleConfirm} disabled={selectedIssueIds.size === 0}>
            确定
          </Button>
        </div>
      }
    >
      {/* 新增固定高度，左右分栏内部滚动 */}
      <div style={{ display: "flex", gap: 16, height: "60vh" }}>
        {/* 左侧项目列表：加入滚动和搜索 */}
        <div style={{ width: leftWidth, borderRight: "1px solid #f0f0f0", paddingRight: 12, overflowY: "auto" }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>项目</div>
          <Input
            size="small"
            placeholder="搜索项目"
            allowClear
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          {loadingProjects ? (
            <Spin />
          ) : filteredProjects.length === 0 ? (
            <Empty description="暂无项目" />
          ) : (
            <List
              size="small"
              dataSource={filteredProjects}
              renderItem={(p) => (
                <List.Item
                  style={{
                    cursor: "pointer",
                    background: selectedProjectId === p.id ? "#e6f4ff" : undefined,
                  }}
                  onClick={() => setSelectedProjectId(p.id as string)}
                >
                  <div style={{ width: "100%" }}>
                    <div className="flex items-center gap-2">
                      <Logo logo={p.logo_props} size={18} />
                      <span className="truncate">{p.name}</span>
                    </div>
                    {/* <span style={{ fontWeight: selectedProjectId === p.id ? 600 : 400 }}>{p.name}</span> */}
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>

        {/* 右侧工作项：改用 Table 展示 */}
        <div style={{ width: rightWidth }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>工作项</div>
          <Table<TIssue>
            size="small"
            rowKey="id"
            loading={loadingIssues}
            dataSource={issues}
            columns={columns as any}
            pagination={false}
            rowSelection={rowSelection as any}
            scroll={{ y: "50vh" }}
          />
        </div>
      </div>
    </Modal>
  );
};

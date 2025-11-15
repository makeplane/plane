// 文件顶部 imports
import React, { useEffect, useMemo, useState } from "react";
import { Modal, List, Button, Checkbox, Spin, Empty, Tag, message, Input, Table, Space } from "antd";
import type { TPartialProject, TIssue, TIssuesResponse } from "@plane/types";
import { ProjectService } from "@/services/project/project.service";
import { IssueService } from "@/services/issue/issue.service";
import { Logo } from "@/components/common/logo";
import { ProjectIssueTypeService, projectIssueTypesCache, TIssueType } from "@/services/project";
import * as LucideIcons from "lucide-react";
// 新增：复用状态下拉组件，保持与工作项详情侧栏一致的风格
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { SearchOutlined } from "@ant-design/icons";
import type { TableProps, InputRef, TableColumnType } from "antd";
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  isOpen: boolean;
  workspaceSlug: string;
  onClose: () => void;
  onConfirm: (issues: TIssue[]) => void;
  initialSelectedIssues?: TIssue[];
  forceTypeName?: "Requirement" | "Task" | "Bug";
};

export const WorkItemSelectModal: React.FC<Props> = ({
  isOpen,
  workspaceSlug,
  onClose,
  onConfirm,
  initialSelectedIssues,
  forceTypeName,
}) => {
  const projectService = useMemo(() => new ProjectService(), []);
  const issueService = useMemo(() => new IssueService(), []);
  const { fetchProjectStates, getStateById } = useProjectState();
  const [projects, setProjects] = useState<TPartialProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [issues, setIssues] = useState<TIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // 选择项
  const [selectedIssueIds, setSelectedIssueIds] = useState<Set<string>>(new Set());
  // 新增：跨项目、跨分页持久化选中项映射
  const [selectedIssuesMap, setSelectedIssuesMap] = useState<Record<string, TIssue>>({});
  // 新增：表格过滤状态（前端受控）
  const [filters, setFilters] = useState<{
    name?: string;
    state?: string[]; // state_id
    type_id?: string[]; // type_id
  }>({});

  // 名称搜索（复用参考页逻辑）
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = React.useRef<InputRef>(null);

  // 复用搜索下拉
  const getColumnSearchProps = (dataIndex: keyof TIssue | string): TableColumnType<TIssue> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex === "name" ? "名称" : "文本"}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], dataIndex, confirm)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], dataIndex, confirm)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, dataIndex, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />,
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    // 受控的过滤值
    filteredValue: dataIndex === "name" ? (filters.name ? [filters.name] : null) : null,
    // 前端过滤函数
    onFilter: (value, record) =>
      dataIndex === "name" ? (record?.name || "").toLowerCase().includes(String(value).toLowerCase()) : true,
  });

  const handleSearch = (selectedKeys: string[], dataIndex: keyof TIssue | string, confirm?: () => void) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(String(dataIndex));
    const next = { ...filters };
    if (selectedKeys[0]) {
      if (dataIndex === "name") next.name = selectedKeys[0];
    } else {
      if (dataIndex === "name") delete next.name;
    }
    setFilters(next);
    confirm?.();
  };

  const handleReset = (clearFilters: () => void, dataIndex: keyof TIssue | string, confirm?: () => void) => {
    clearFilters();
    setSearchText("");
    const next = { ...filters };
    if (dataIndex === "name") delete next.name;
    setFilters(next);
    confirm?.();
  };

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

  const displayIssues = useMemo(
    () => displayIssuesSelector(issues, projectIssueTypesMap, forceTypeName),
    [issues, projectIssueTypesMap, forceTypeName]
  );

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
    () => {
      const baseList = displayIssues;
      const uniqueStateIds = Array.from(new Set((baseList || []).map((i) => i.state_id).filter(Boolean))) as string[];
      const uniqueTypeIds = Array.from(new Set((baseList || []).map((i) => i.type_id).filter(Boolean))) as string[];
      // 新增：类型过滤项使用“当前项目全部类型”，而不是仅限于当前页数据出现的类型
      const allProjectTypeIds = projectIssueTypesMap ? Object.keys(projectIssueTypesMap) : uniqueTypeIds;

      return [
        {
          title: "名称",
          dataIndex: "name",
          key: "name",
          ...getColumnSearchProps("name"),
        },
        {
          title: "状态",
          key: "state_id",
          dataIndex: "state_id",
          render: (_: any, record: TIssue) => (
            <StateDropdown
              value={record?.state_id || ""}
              onChange={async (val) => {
                try {
                  await issueService.patchIssue(workspaceSlug, record.project_id as string, record.id as string, {
                    state_id: val,
                  });
                  setIssues((prev) => prev.map((i) => (i.id === record.id ? { ...i, state_id: val } : i)));
                  message.success("状态已更新");
                } catch (err: any) {
                  message.error(`更新状态失败：${err?.message || "未知错误"}`);
                }
              }}
              projectId={record?.project_id?.toString() ?? ""}
              disabled={true}
              buttonVariant="transparent-with-text"
              className="group w-full"
              buttonContainerClassName="w-full text-left"
              buttonClassName="text-xs"
              dropdownArrow
            />
          ),
          // 修复：过滤项显示状态名称而不是 id
          filters: uniqueStateIds.map((sid) => ({
            text: getStateById(sid)?.name ?? sid ?? "-",
            value: sid,
          })),
          filterMultiple: true,
          filteredValue: filters.state ?? null,
          onFilter: (value: any, record: { state_id: any }) => (record?.state_id ?? "") === String(value),
          width: 140,
        },
        {
          title: "类型",
          key: "type_id",
          dataIndex: "type_id",
          render: (_: any, record: TIssue) => {
            const typeId = record?.type_id || undefined;
            const map = projectIssueTypesMap;
            const typeName = typeId && map ? map[typeId]?.name : undefined;
            return (
              <div className="flex items-center gap-2">
                {renderIssueTypeIcon(record)}
                <span className="truncate">{typeName ?? "-"}</span>
              </div>
            );
          },
          // 修复：类型过滤项展示“当前项目下的全部类型”
          filters: allProjectTypeIds.map((tid) => ({
            text: projectIssueTypesMap?.[tid]?.name ?? tid ?? "-",
            value: tid,
          })),
          filterMultiple: true,
          filteredValue: filters.type_id ?? null,
          onFilter: (value: any, record: { type_id: any }) => (record?.type_id ?? "") === String(value),
          width: 140,
        },
      ];
    },
    // 依赖中加入 getStateById，确保状态名称变化时列配置更新
    [displayIssues, filters, projectIssueTypesMap, workspaceSlug, issueService, getStateById]
  );

  // 表格 onChange：同步 filters（受控）
  const handleTableChange: TableProps<TIssue>["onChange"] = (_pagination, tableFilters) => {
    const selectedStates = (tableFilters?.state_id as string[] | undefined) || [];
    const selectedTypes = (tableFilters?.type_id as string[] | undefined) || [];
    setFilters((prev) => ({
      ...prev,
      state: selectedStates.length ? selectedStates.map(String) : undefined,
      type_id: selectedTypes.length ? selectedTypes.map(String) : undefined,
    }));
  };

  // 新增：Table 多选（保持原逻辑）
  const rowSelection = {
    selectedRowKeys: Array.from(selectedIssueIds),
    onSelect: (record: TIssue, selected: boolean) => {
      const id = String(record.id);
      setSelectedIssueIds((prev) => {
        const next = new Set(prev);
        if (selected) next.add(id);
        else next.delete(id);
        return next;
      });
      setSelectedIssuesMap((prev) => {
        const next = { ...prev };
        if (selected) next[id] = record;
        else delete next[id];
        return next;
      });
    },
    onSelectAll: (selected: boolean, selectedRows: TIssue[]) => {
      const currentIds = displayIssues.map((i) => String(i.id));
      setSelectedIssueIds((prev) => {
        const next = new Set(prev);
        if (selected) currentIds.forEach((id) => next.add(id));
        else currentIds.forEach((id) => next.delete(id));
        return next;
      });
      setSelectedIssuesMap((prev) => {
        const next = { ...prev };
        if (selected) {
          displayIssues.forEach((i) => (next[String(i.id)] = i));
        } else {
          displayIssues.forEach((i) => delete next[String(i.id)]);
        }
        return next;
      });
    },
    // 合并式更新，避免覆盖掉其它项目页的选中
    onChange: (selectedRowKeys: React.Key[], selectedRows: TIssue[]) => {
      const selectedKeySet = new Set((selectedRowKeys || []).map((k) => String(k)));
      const currentIdsSet = new Set(displayIssues.map((i) => String(i.id)));

      setSelectedIssueIds((prev) => {
        const next = new Set(prev);
        // 先移除当前数据集中未选中的
        currentIdsSet.forEach((id) => {
          if (!selectedKeySet.has(id)) next.delete(id);
        });
        // 再加入当前选中的
        selectedKeySet.forEach((id) => next.add(id));
        return next;
      });
      setSelectedIssuesMap((prev) => {
        const next = { ...prev };
        // 移除当前数据集中未选中的
        displayIssues.forEach((i) => {
          const id = String(i.id);
          if (!selectedKeySet.has(id)) delete next[id];
        });
        // 加入当前数据集中选中的记录（保留其它项目页的已选项）
        selectedRows.forEach((r) => {
          next[String(r.id)] = r;
        });
        return next;
      });
    },
  };

  useEffect(() => {
    // 模态打开时，根据父组件传入的 initialSelectedIssues 进行回显初始化
    if (!isOpen) return;
    const arr = initialSelectedIssues || [];
    const ids = arr.map((i) => String(i.id));
    const map = Object.fromEntries(arr.map((i) => [String(i.id), i]));
    setSelectedIssueIds(new Set(ids));
    setSelectedIssuesMap(map);
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
        // 去除“清空已选（切换项目时）”，保持跨项目选择持久化
        // 原：setSelectedIssueIds(new Set());
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
    // 返回跨项目、跨分页的全部已选项
    const selected = Object.values(selectedIssuesMap);
    onConfirm(selected);
  };

  const leftWidth = "30%";
  const rightWidth = "70%";

  // 受控分页：页大小与当前页
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

  // 封装获取工作项（带 per_page 与首页 cursor）
  const fetchIssuesWithPageSize = async (perPage: number) => {
    if (!isOpen || !selectedProjectId) return;
    setLoadingIssues(true);
    try {
      const queries: any = { per_page: perPage, cursor: `${perPage}:0:0` };
      const res = await issueService.getIssues(workspaceSlug, selectedProjectId, queries);
      const flat = normalizeIssues(res);
      setIssues(flat);
      // 提取总数，若无则以当前数量兜底
      setTotalCount((res as any)?.total_count ?? flat.length);
      // 重置当前页到 1（与 Table 显示一致）
      setCurrentPage(1);
    } catch (err: any) {
      message.error(`获取工作项失败：${err?.message || "未知错误"}`);
    } finally {
      setLoadingIssues(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !selectedProjectId) {
      setIssues([]);
      return;
    }
    // 加载项目变更或弹窗开启时按当前 pageSize 拉首屏数据
    fetchIssuesWithPageSize(pageSize);
  }, [isOpen, workspaceSlug, selectedProjectId, issueService]);

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
      <div style={{ display: "flex", gap: 16, height: "60vh" }}>
        <div style={{ width: leftWidth, borderRight: "1px solid #f0f0f0", paddingRight: 12, overflowY: "auto" }}>
          {/* 左侧项目列表 */}
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

        {/* 右侧工作项：Table + 分页 */}
        <div style={{ width: rightWidth }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>工作项</div>
          <Table<TIssue>
            size="small"
            rowKey="id"
            loading={loadingIssues}
            dataSource={displayIssues}
            columns={columns as any}
            onChange={handleTableChange}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalCount ?? displayIssues.length,
              showSizeChanger: true,
              showQuickJumper: true,
              onChange: (page) => setCurrentPage(page),
              onShowSizeChange: (_current, size) => {
                setPageSize(size);
                fetchIssuesWithPageSize(size);
              },
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
            rowSelection={rowSelection as any}
          />
        </div>
      </div>
    </Modal>
  );
};

const getTypeNameById = (typeId: string | undefined, map: Record<string, TIssueType> | undefined) => {
  if (!typeId || !map) return undefined;
  return map[typeId]?.name;
};

const typeNameMatches = (
  issue: TIssue,
  map: Record<string, TIssueType> | undefined,
  force?: "Requirement" | "Task" | "Bug"
) => {
  if (!force) return true;
  const name = getTypeNameById((issue as any)?.type_id as string | undefined, map);
  return name === force;
};

const displayIssuesSelector = (
  issues: TIssue[],
  projectIssueTypesMap: Record<string, TIssueType> | undefined,
  force?: "Requirement" | "Task" | "Bug"
) => {
  if (!force) return issues;
  if (!projectIssueTypesMap) return issues;
  return (issues || []).filter((i) => typeNameMatches(i, projectIssueTypesMap, force));
};

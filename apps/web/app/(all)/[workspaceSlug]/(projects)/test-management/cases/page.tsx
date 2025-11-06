"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { PageHead } from "@/components/core/page-title";
import { Table, Tag, Input, Button, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { TableProps, InputRef, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { CaseService } from "@/services/qa/case.service";
import { formatDateTime, globalEnums } from "../util";
import { CreateCaseModal } from "@/components/qa/cases/create-modal";
import { Tree, Row, Col, Segmented } from "antd";
import type { TreeProps } from "antd";
import {
  FolderOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  DownOutlined,
} from "@ant-design/icons";

type TCreator = {
  display_name?: string;
};

type TLabel =
  | {
      id?: string;
      name?: string;
    }
  | string;

type TestCase = {
  id: string;
  name: string;
  remark?: string;
  state?: number;
  type?: number;
  priority?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: TCreator;
  repository?: string;
  labels?: TLabel[];
};

type TestCaseResponse = {
  count: number;
  data: TestCase[];
};

export default function TestCasesPage() {
  const { workspaceSlug } = useParams();
  const repositoryId = typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryId") : null;
  const repositoryName = typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryName") : "";

  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // 分页状态管理
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);

  // 筛选状态管理
  const [filters, setFilters] = useState<{
    name?: string;
    state?: number[];
    type?: number[];
    priority?: number[];
  }>({});

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

  const caseService = new CaseService();

  // 新增状态：模块树数据、选中模块
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // 新增：树主题（默认/紧凑/高对比）
  const [treeTheme, setTreeTheme] = useState<"light" | "compact" | "high-contrast">("light");

  // 自定义节点标题：统一图标+文案+间距
  const renderNodeTitle = (title: string, isLeaf: boolean) => (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
        <FolderOutlined />
      </span>
      <span className="text-sm text-custom-text-200">{title}</span>
    </div>
  );

  useEffect(() => {
    if (repositoryId) {
      fetchModules();
      fetchCases(); // 初始加载所有用例
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId]);

  // 新增：获取模块列表
  const fetchModules = async () => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      const moduleData = await caseService.getModules(workspaceSlug as string, repositoryId as string);
      setModules(moduleData); // 假设 moduleData 是树形数组
    } catch (err) {
      console.error("获取模块失败:", err);
    }
  };

  // 修改 fetchCases：支持 module_id 过滤
  const fetchCases = async (
    page: number = currentPage,
    size: number = pageSize,
    filterParams: typeof filters = filters
  ) => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      setLoading(true);
      setError(null);

      const queryParams: any = {
        page,
        page_size: size,
        repository_id: repositoryId,
      };

      // 新增：如果有选中模块，添加 module_id 参数
      if (selectedModuleId && selectedModuleId !== "all") {
        queryParams.module_id = selectedModuleId;
      }

      // 名称模糊搜索
      if (filterParams.name) {
        queryParams.name__icontains = filterParams.name;
      }
      // 状态多选
      if (filterParams.state && filterParams.state.length > 0) {
        queryParams.state__in = filterParams.state.join(",");
      }
      // 类型多选
      if (filterParams.type && filterParams.type.length > 0) {
        queryParams.type__in = filterParams.type.join(",");
      }
      // 优先级多选
      if (filterParams.priority && filterParams.priority.length > 0) {
        queryParams.priority__in = filterParams.priority.join(",");
      }

      const response: TestCaseResponse = await caseService.getCases(workspaceSlug as string, queryParams);
      setCases(response?.data || []);
      setTotal(response?.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err) {
      console.error("获取测试用例数据失败:", err);
      setError("获取测试用例数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 新增：监听模块选择变化，触发列表刷新（避免使用旧状态）
  useEffect(() => {
    if (!repositoryId) return;
    // 切换模块时，从第一页开始刷新
    fetchCases(1, pageSize, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId]);

  // 新增：Tree onSelect 处理（仅更新选中状态，不直接调用 fetchCases）
  const onSelect: TreeProps["onSelect"] = (selectedKeys, info) => {
    // 如果是“取消选择”事件（再次点击同一模块），则忽略，保持当前选中不变
    if (!info.selected) {
      // 仅当点击“全部模块”时才切换到全部
      if (String(info?.node?.key) === "all") {
        setSelectedModuleId(null);
      }
      return;
    }

    const key = selectedKeys[0] as string | undefined;
    const nextModuleId = !key || key === "all" ? null : key;
    setSelectedModuleId(nextModuleId);
  };

  const treeData = [
    {
      title: (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
            <AppstoreOutlined />
          </span>
          <span className="text-sm font-medium text-custom-text-200">全部模块</span>
        </div>
      ),
      key: "all",
      icon: <AppstoreOutlined />,
      children:
        modules?.map((mod: any) => ({
          title: renderNodeTitle(mod?.name ?? "-", !(mod?.children && mod?.children.length)),
          key: String(mod?.id),
          icon: mod?.children && mod?.children.length ? <FolderOpenOutlined /> : <FolderOutlined />,
          children:
            (mod?.children || [])?.map((child: any) => ({
              title: renderNodeTitle(child?.name ?? "-", !(child?.children && child?.children.length)),
              key: String(child?.id),
              icon: child?.children && child?.children.length ? <FolderOpenOutlined /> : <FileTextOutlined />,
              children: (child?.children || [])?.map((c2: any) => ({
                title: renderNodeTitle(c2?.name ?? "-", !(c2?.children && c2?.children.length)),
                key: String(c2?.id),
                icon: c2?.children && c2?.children.length ? <FolderOpenOutlined /> : <FileTextOutlined />,
              })),
            })) ?? [],
        })) ?? [],
    },
  ];
  const TreeToolbar = (
    <div className="flex items-center justify-between px-2 pb-2">
      <div className="text-sm text-custom-text-300">模块筛选</div>
      <Segmented
        size="small"
        value={treeTheme}
        onChange={(v) => setTreeTheme(v as any)}
        options={[
          { label: "默认", value: "light" },
          { label: "紧凑", value: "compact" },
          { label: "高对比", value: "high-contrast" },
        ]}
      />
    </div>
  );

  const getColumnSearchProps = (dataIndex: keyof TestCase | string): TableColumnType<TestCase> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex === "name" ? "名称" : "其他"}`}
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
    filteredValue: dataIndex === "name" ? (filters.name ? [filters.name] : null) : null,
  });

  const handleSearch = (selectedKeys: string[], dataIndex: keyof TestCase | string, confirm?: () => void) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);

    const newFilters = { ...filters };
    if (selectedKeys[0]) {
      if (dataIndex === "name") newFilters.name = selectedKeys[0];
    } else {
      if (dataIndex === "name") delete newFilters.name;
    }

    setFilters(newFilters);
    confirm?.();
  };

  const handleReset = (clearFilters: () => void, dataIndex: keyof TestCase | string, confirm?: () => void) => {
    clearFilters();
    setSearchText("");

    const newFilters = { ...filters };
    if (dataIndex === "name") {
      delete newFilters.name;
    }

    setFilters(newFilters);
    confirm?.();
  };

  // 表格变更回调：统一处理分页与服务端过滤
  const handleTableChange: TableProps<TestCase>["onChange"] = (pagination, tableFilters) => {
    const selectedStates = (tableFilters?.state as number[] | undefined) || [];
    const selectedTypes = (tableFilters?.type as number[] | undefined) || [];
    const selectedPriorities = (tableFilters?.priority as number[] | undefined) || [];

    const newFilters = {
      ...filters,
      state: selectedStates.length ? selectedStates.map((v) => Number(v)) : undefined,
      type: selectedTypes.length ? selectedTypes.map((v) => Number(v)) : undefined,
      priority: selectedPriorities.length ? selectedPriorities.map((v) => Number(v)) : undefined,
    };

    const nextPage = pagination.current || 1;
    const nextPageSize = pagination.pageSize || pageSize;

    setCurrentPage(nextPage);
    setPageSize(nextPageSize);
    setFilters(newFilters);
    fetchCases(nextPage, nextPageSize, newFilters);
  };

  const handlePaginationChange = (page: number, size?: number) => {
    const newPageSize = size || pageSize;
    fetchCases(page, newPageSize, filters);
  };

  const handlePageSizeChange = (_current: number, size: number) => {
    fetchCases(1, size, filters);
  };

  const renderLabels = (labels?: TLabel[]) => {
    if (!labels || labels.length === 0) return <span className="text-custom-text-400">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {labels.map((l, idx) => {
          const text = typeof l === "string" ? l : l?.name || "-";
          return (
            <Tag key={typeof l === "string" ? `${l}-${idx}` : `${(l?.id || idx).toString()}-${idx}`} color="cyan">
              {text}
            </Tag>
          );
        })}
      </div>
    );
  };

  // 根据全局枚举输出标签
  const getEnumLabel = (group: "case_state" | "case_type" | "case_priority", value?: number) => {
    if (value === null || value === undefined) return "-";
    const map = (globalEnums.Enums as any)?.[group] || {};
    const label = map[value] ?? map[String(value)] ?? value;
    return label;
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

  const columns: TableProps<TestCase>["columns"] = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
    },
    {
      title: "状态",
      dataIndex: "state",
      key: "state",
      render: (v) => renderEnumTag("case_state", v, "processing"),
      width: 140,
      filters: Object.entries((globalEnums.Enums as any)?.case_state || {}).map(([value, label]) => ({
        text: String(label),
        value: Number(value),
      })),
      filterMultiple: true,
      filteredValue: filters.state ?? null,
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (v) => renderEnumTag("case_type", v, "magenta"),
      width: 140,
      filters: Object.entries((globalEnums.Enums as any)?.case_type || {}).map(([value, label]) => ({
        text: String(label),
        value: Number(value),
      })),
      filterMultiple: true,
      filteredValue: filters.type ?? null,
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      render: (v) => renderEnumTag("case_priority", v, "warning"),
      width: 120,
      filters: Object.entries((globalEnums.Enums as any)?.case_priority || {}).map(([value, label]) => ({
        text: String(label),
        value: Number(value),
      })),
      filterMultiple: true,
      filteredValue: filters.priority ?? null,
    },
    {
      title: "创建人",
      dataIndex: "created_by",
      key: "created_by",
      render: (creator: TCreator | undefined) => creator?.display_name || "-",
      width: 140,
    },
    { title: "创建时间", dataIndex: "created_at", key: "created_at", render: (d) => formatDateTime(d), width: 180 },
    { title: "更新时间", dataIndex: "updated_at", key: "updated_at", render: (d) => formatDateTime(d), width: 180 },
  ];

  return (
    <>
      {/* 页面标题 */}
      <PageHead title={`测试用例${repositoryName ? " - " + decodeURIComponent(repositoryName) : ""}`} />
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-4 py-3 sm:px-5">
            <h3 className="text-lg font-medium">测试用例</h3>
            <div>
              <Button type="primary" onClick={() => setIsCreateModalOpen(true)} disabled={!repositoryId}>
                新增测试用例
              </Button>
            </div>
          </div>
          {/* 修改列表区域：添加 Row/Col 布局 */}
          <Row className="flex-1 overflow-hidden p-4 sm:p-5" gutter={[16, 16]}>
            {/* 左侧树形菜单 */}
            <Col span={6} className="border-r border-custom-border-200 overflow-y-auto">
              <Tree
                showLine
                defaultExpandAll
                onSelect={onSelect}
                treeData={treeData}
                selectedKeys={selectedModuleId ? [selectedModuleId] : ["all"]}
                className="py-2"
              />
            </Col>
            {/* 右侧表格 */}
            <Col span={18} className="overflow-y-auto">
              {/* 加载/错误/空状态 */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-custom-text-300">加载中...</div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}

              {!repositoryId && !loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-custom-text-300">未找到用例库ID，请先在顶部选择一个用例库</div>
                </div>
              )}

              {repositoryId && !loading && !error && (
                <Table
                  dataSource={cases}
                  columns={columns}
                  rowKey="id"
                  bordered={true}
                  onChange={handleTableChange}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    pageSizeOptions: ["10", "20", "50", "100"],
                  }}
                />
              )}
            </Col>
          </Row>
        </div>
      </div>

      {/* 新增/编辑用例弹窗（本次实现新增） */}
      {repositoryId && (
        <CreateCaseModal
          isOpen={isCreateModalOpen}
          handleClose={() => setIsCreateModalOpen(false)}
          workspaceSlug={workspaceSlug as string}
          repositoryId={repositoryId as string}
          repositoryName={decodeURIComponent(repositoryName || "")}
          onSuccess={async () => {
            // 新增成功后刷新当前列表与分页/筛选状态
            await fetchCases(currentPage, pageSize, filters);
          }}
        />
      )}
    </>
  );
}

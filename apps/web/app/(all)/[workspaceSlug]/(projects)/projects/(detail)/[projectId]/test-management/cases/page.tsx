"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { PageHead } from "@/components/core/page-title";
import { Table, Tag, Input, Button, Space, Modal, Dropdown, message } from "antd";
import { EllipsisOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { TableProps, InputRef, TableColumnType } from "antd";
import { CaseService } from "@/services/qa/case.service";
import { CreateCaseModal } from "@/components/qa/cases/create-modal";
import { Tree, Row, Col } from "antd";
import type { TreeProps } from "antd";
import { AppstoreOutlined, PlusOutlined } from "@ant-design/icons";
import { CaseModuleService } from "@/services/qa";
import UpdateModal from "@/components/qa/cases/update-modal";
import { useQueryParams } from "@/hooks/use-query-params";
import { CaseService as ReviewApiService } from "@/services/qa/review.service";
import { FolderOpenDot } from "lucide-react";
import { formatDateTime, globalEnums } from "../util";

type TCreator = {
  display_name?: string;
};

type TModule = {
  name?: string;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateQueryParams } = useQueryParams();
  const repositoryIdFromUrl = searchParams.get("repositoryId");
  const [repositoryId, setRepositoryId] = useState<string | null>(repositoryIdFromUrl);
  const [repositoryName, setRepositoryName] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedId = sessionStorage.getItem("selectedRepositoryId");
      const storedName = sessionStorage.getItem("selectedRepositoryName");
      if (!repositoryIdFromUrl && storedId) {
        setRepositoryId(storedId);
      }
      if (storedName) {
        setRepositoryName(storedName);
      }
    }
  }, [repositoryIdFromUrl]);

  const [cases, setCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [activeCase, setActiveCase] = useState<any | null>(null);

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
  const [allTotal, setAllTotal] = useState<number | undefined>(undefined);
  const searchInput = useRef<InputRef>(null);

  const caseService = new CaseService();
  const caseModuleService = new CaseModuleService();
  const reviewService = new ReviewApiService();
  const [reviewEnums, setReviewEnums] = useState<Record<string, Record<string, { label: string; color: string }>>>({});
  // 新增：创建子模块的临时状态
  const [creatingParentId, setCreatingParentId] = useState<string | "all" | null>(null);
  const [newModuleName, setNewModuleName] = useState<string>("");

  // 新增状态：模块树数据、选中模块
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // 新增：树主题（默认/紧凑/高对比）
  const [treeTheme, setTreeTheme] = useState<"light" | "compact" | "high-contrast">("light");
  const [expandedKeys, setExpandedKeys] = useState<string[]>(["all"]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const onExpand: TreeProps["onExpand"] = (keys) => {
    setExpandedKeys(keys as string[]);
    setAutoExpandParent(false);
  };
  const [searchModule, setSearchModule] = useState<string>("");

  const [leftWidth, setLeftWidth] = useState<number>(280);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const onMouseDownResize = (e: any) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    window.addEventListener("mousemove", onMouseMoveResize);
    window.addEventListener("mouseup", onMouseUpResize);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    if (e && typeof e.preventDefault === "function") e.preventDefault();
  };
  const onMouseMoveResize = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    const next = Math.min(300, Math.max(200, startWidthRef.current + delta));
    setLeftWidth(next);
  };
  const onMouseUpResize = () => {
    isDraggingRef.current = false;
    window.removeEventListener("mousemove", onMouseMoveResize);
    window.removeEventListener("mouseup", onMouseUpResize);
    document.body.style.cursor = "auto";
    document.body.style.userSelect = "auto";
  };

  // 自定义节点标题：统一图标+文案+间距
  const updateModuleCount = (modules: any[], id: string, count: number): any[] => {
    return modules.map((m) => {
      if (String(m.id) === id) {
        return { ...m, total: count };
      }
      if (m.children) {
        return { ...m, children: updateModuleCount(m.children, id, count) };
      }
      return m;
    });
  };

  const batchUpdateModuleCounts = (modules: any[], countsMap: Record<string, number>): any[] => {
    return modules.map((m) => {
      const updatedM = { ...m };
      if (m.id && countsMap[String(m.id)] !== undefined) {
        updatedM.total = countsMap[String(m.id)];
      }
      if (m.children) {
        updatedM.children = batchUpdateModuleCounts(m.children, countsMap);
      }
      return updatedM;
    });
  };

  useEffect(() => {
    if (repositoryId) {
      try {
        if (repositoryIdFromUrl) sessionStorage.setItem("selectedRepositoryId", repositoryIdFromUrl);
      } catch {}
      fetchModules();
      fetchCases(); // 初始加载所有用例
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryId]);

  useEffect(() => {
    if (!repositoryId && workspaceSlug) {
      const ws = String(workspaceSlug || "");
      const pid = typeof window !== "undefined" ? sessionStorage.getItem("currentProjectId") || "" : "";
      const current = `/${ws}/projects/${pid}/test-management/cases${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      try {
        message.warning("未检测到用例库，请选择一个用例库后自动跳回");
      } catch {}
      router.push(`/${ws}/projects/${pid}/test-management?redirect_to=${encodeURIComponent(current)}`);
    }
  }, [repositoryId, workspaceSlug, searchParams, router]);

  useEffect(() => {
    if (!workspaceSlug) return;
    reviewService
      .getReviewEnums(String(workspaceSlug))
      .then((data) => setReviewEnums(data || {}))
      .catch(() => {});
  }, [workspaceSlug]);

  // 解析 URL 参数以自动打开用例模态框
  useEffect(() => {
    const peekCase = searchParams.get("peekCase");
    if (peekCase) {
      setActiveCase({ id: peekCase });
      setIsUpdateModalOpen(true);
    }
  }, [searchParams]);

  // 新增：获取模块列表
  const fetchModules = async () => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      const moduleData = await caseService.getModules(workspaceSlug as string, repositoryId as string);

      // 调用新接口获取 counts
      const countsResponse = await caseService.getModulesCount(workspaceSlug as string, repositoryId);

      // 提取 total 和模块 countsMap
      const { total = 0, ...countsMap } = countsResponse;
      setAllTotal(total);

      // 批量更新 moduleData 的 total
      const updatedModules = batchUpdateModuleCounts(moduleData, countsMap as Record<string, number>);

      setModules(updatedModules);
    } catch (err) {
      console.error("获取模块或计数失败:", err);
    }
  };

  // 新增：添加行为 - 在当前节点下插入临时输入框
  const handleAddUnderNode = (parentId: string | "all") => {
    if (!repositoryId) return;
    setCreatingParentId(parentId);
    setNewModuleName("");

    // 新增：确保当前父节点展开，便于显示临时输入框
    setExpandedKeys((prev) => {
      const prevKeys = prev || [];
      const pid = String(parentId);
      return prevKeys.includes(pid) ? prevKeys : [...prevKeys, pid];
    });
    setAutoExpandParent(true);
  };

  // 新增：输入框失焦或回车时调用创建接口
  const handleCreateBlurOrEnter = async (parentId: string | "all") => {
    const name = newModuleName.trim();
    if (!name || !workspaceSlug || !repositoryId) {
      setCreatingParentId(null);
      setNewModuleName("");
      return;
    }
    const payload: any = {
      name,
      repository: repositoryId,
    };
    if (parentId !== "all") {
      payload.parent = parentId;
    }
    try {
      await caseService.createModules(workspaceSlug as string, payload);
      // 刷新模块树与列表
      setCreatingParentId(null);
      setNewModuleName("");
      await fetchModules();
      await fetchCases(1, pageSize, filters);
    } catch (e) {
      console.error("创建模块失败:", e);
      setCreatingParentId(null);
      setNewModuleName("");
    }
  };
  // 新增：删除确认弹窗与删除逻辑
  // 修改：仅接收模块 id，删除单个模块（及其子模块和用例）
  const confirmDeleteNode = (moduleId: string, nodeName: string) => {
    Modal.confirm({
      title: "确认删除",
      content: "将删除该模块及其所有子模块和用例，操作不可撤销。请确认是否继续？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          if (!workspaceSlug) return;
          await caseModuleService.deleteCaseModule(workspaceSlug as string, moduleId);
          if (selectedModuleId === moduleId) setSelectedModuleId(null);
          await fetchModules();
          await fetchCases(1, pageSize, filters);
        } catch (e) {
          console.error("删除失败:", e);
        }
      },
    });
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

      // name__icontains, state__in, type__in, priority__in

      const response: TestCaseResponse = await caseService.getCases(workspaceSlug as string, queryParams);
      setCases(response?.data || []);
      setTotal(response?.count || 0); // 保留：用于当前查询的分页
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
    const keyStr = String(info?.node?.key);
    // 忽略临时创建节点，避免设置成选中模块从而发起错误过滤请求
    if (keyStr.startsWith("__creating__")) {
      return;
    }

    // 如果是“取消选择”事件（再次点击同一模块），则忽略，保持当前选中不变
    if (!info.selected) {
      if (String(info?.node?.key) === "all") {
        setSelectedModuleId(null);
      }
      return;
    }
    fetchModules();
    const key = selectedKeys[0] as string | undefined;
    const nextModuleId = !key || key === "all" ? null : key;
    setSelectedModuleId(nextModuleId);
  };

  // Helper：获取节点数量（兼容不同字段名），没有则返回 undefined 不展示
  const getNodeCount = (m: any) => {
    const c = m?.case_count ?? m?.count ?? m?.total ?? m?.cases_count;
    return typeof c === "number" ? c : undefined;
  };

  // 自定义节点标题：统一图标 + 名称 + 右侧数量
  const renderNodeTitle = (title: string, count?: number, nodeId?: string | "all") => {
    const items = [
      {
        key: "add",
        label: (
          <Button type="text" size="small" onClick={() => handleAddUnderNode(nodeId || "all")}>
            添加
          </Button>
        ),
      },
      {
        key: "delete",
        label: (
          <Button type="text" danger size="small" onClick={() => confirmDeleteNode(nodeId || "all", title)}>
            删除
          </Button>
        ),
      },
    ];
    return (
      <div className="group flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
            <FolderOpenDot size={14} />
          </span>
          <span className="text-sm text-custom-text-200">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {typeof count === "number" && <span className="text-xs text-custom-text-300">{count}</span>}
          {repositoryId && (
            <Dropdown trigger={["hover"]} menu={{ items }}>
              <Button
                type="text"
                icon={<EllipsisOutlined />}
                size="small"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              ></Button>
            </Dropdown>
          )}
        </div>
      </div>
    );
  };
  const renderCreatingInput = (parentId: string | "all") => (
    <div className="w-full">
      <Input
        size="small"
        autoFocus
        placeholder="请输入模块名称"
        value={newModuleName}
        onChange={(e) => setNewModuleName(e.target.value)}
        onBlur={() => handleCreateBlurOrEnter(parentId)}
        onPressEnter={() => handleCreateBlurOrEnter(parentId)}
      />
    </div>
  );

  // 新增：递归构建树节点，任意层级都支持插入“添加”的临时输入框
  const buildTreeNodes = (list: any[]): any[] => {
    if (!Array.isArray(list)) return [];
    return list.map((node: any) => {
      const nodeId = String(node?.id);
      const childrenNodes = buildTreeNodes(node?.children || []);
      const creatingChild =
        creatingParentId === nodeId
          ? [
              {
                title: renderCreatingInput(nodeId),
                key: `__creating__${nodeId}`,
                icon: <PlusOutlined />,
                selectable: false, // 防止选中临时输入节点
              },
            ]
          : [];
      return {
        title: renderNodeTitle(node?.name ?? "-", getNodeCount(node), nodeId),
        key: nodeId,
        icon: <AppstoreOutlined />,
        children: [...creatingChild, ...childrenNodes],
      };
    });
  };

  const filterModulesByName = (list: any[], q: string): any[] => {
    if (!q) return list || [];
    const query = q.trim().toLowerCase();
    const walk = (nodes: any[]): any[] => {
      return (nodes || [])
        .map((n) => {
          const name = String(n?.name || "").toLowerCase();
          const childMatches = walk(n?.children || []);
          const selfMatch = name.includes(query);
          if (selfMatch || childMatches.length) {
            return { ...n, children: childMatches };
          }
          return null;
        })
        .filter(Boolean) as any[];
    };
    return walk(list || []);
  };

  const filteredModules = useMemo(() => filterModulesByName(modules, searchModule), [modules, searchModule]);

  const treeData = [
    {
      // 修改：根节点“全部模块”仅显示添加，不显示删除
      title: (
        <div className="group flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
              <AppstoreOutlined />
            </span>
            <span className="text-sm font-medium text-custom-text-200">全部模块</span>
          </div>
          <div className="flex items-center gap-2">
            {typeof total === "number" && <span className="text-xs text-custom-text-300">{allTotal}</span>}
            {repositoryId && (
              <Dropdown
                trigger={["hover"]}
                menu={{
                  items: [
                    {
                      key: "add",
                      label: (
                        <Button type="text" size="small" onClick={() => handleAddUnderNode("all")}>
                          添加
                        </Button>
                      ),
                    },
                  ],
                }}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<EllipsisOutlined />}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                ></Button>
              </Dropdown>
            )}
          </div>
        </div>
      ),
      key: "all",
      icon: <AppstoreOutlined />,
      children: [
        ...(creatingParentId === "all"
          ? [
              {
                title: renderCreatingInput("all"),
                key: "__creating__root",
                icon: <PlusOutlined />,
                selectable: false, // 防止选中根下临时输入节点
              },
            ]
          : []),
        // 递归构建所有模块与子模块（任意层级）
        ...buildTreeNodes(filteredModules),
      ],
    },
  ];

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

  const handleEditCase = (record: any) => {
    if (!record || !record.id) return;
    setActiveCase(record);
    setIsUpdateModalOpen(true);
    const updatedRoute = updateQueryParams({ paramsToAdd: { peekCase: String(record.id) } });
    router.push(updatedRoute);
  };

  const handleDeleteCase = (record: any) => {
    if (!record || !record.id || !workspaceSlug) return;
    Modal.confirm({
      title: "确认删除用例",
      content: "删除后不可恢复，是否继续？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await caseService.deleteCase(String(workspaceSlug), String(record.id));
          try {
            message.success("删除成功");
          } catch {}
          await fetchModules();
          await fetchCases(1, pageSize, filters);
        } catch (e) {
          console.error("删除用例失败:", e);
          try {
            message.error("删除失败，请稍后重试");
          } catch {}
        }
      },
    });
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!repositoryId) {
      message.error("请先选择用例库");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("repository_id", repositoryId);

    try {
      setLoading(true);
      const res = await caseService.importCase(workspaceSlug as string, formData);
      console.log("🚀 ~ handleImport ~ res:", res.data);

      // 如果有失败的记录，生成CSV并下载
      if (res.data?.fail && res.data.fail.length > 0) {
        message.warning(`导入完成，有 ${res.data.fail.length} 条数据导入失败，详情请查看下载的文件`);

        // 创建CSV内容
        const headers = ["用例名称", "失败原因"];
        const csvContent = [
          headers.join(","),
          ...res.data.fail.map(
            (item: any) =>
              // 处理字段中可能包含的逗号，用引号包裹
              `"${item.name || ""}","${item.error || ""}"`
          ),
        ].join("\n");

        // 创建Blob并下载
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);

        link.setAttribute("href", url);
        link.setAttribute("download", `导入失败记录_${new Date().getTime()}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        message.success("导入成功");
      }

      fetchCases();
      fetchModules();
    } catch (err: any) {
      console.error(err);
      message.error(err?.error || "导入失败");
    } finally {
      setLoading(false);
      // 清空 input value，允许重复上传同一文件
      e.target.value = "";
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const columns: TableProps<TestCase>["columns"] = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      render: (_: any, record: any) => (
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => {
            if (!record || !record.id) return;
            setActiveCase(record);
            setIsUpdateModalOpen(true);
            const updatedRoute = updateQueryParams({ paramsToAdd: { peekCase: String(record.id) } });
            router.push(updatedRoute);
          }}
        >
          {record?.name}
        </button>
      ),
    },
    {
      title: "评审",
      dataIndex: "review",
      key: "review",
      render: (v: string) => {
        const color = reviewEnums?.CaseReviewThrough_Result?.[v]?.color || "default";
        return (
          <Tag color={color} className="inline-flex justify-center w-[55px]">
            {v || "-"}
          </Tag>
        );
      },
      width: 140,
      // filters: Object.entries((globalEnums.Enums as any)?.case_state || {}).map(([value, label]) => ({
      //   text: String(label),
      //   value: Number(value),
      // })),
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
      title: "模块",
      dataIndex: "module",
      key: "module",
      render: (module: TModule | undefined) => module?.name || "",
      width: 140,
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
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_: any, record: any) => (
        <Space size={8}>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditCase(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCase(record)} />
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* 页面标题 */}
      <PageHead title={`测试用例${repositoryName ? " - " + decodeURIComponent(repositoryName) : ""}`} />
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col">
          <Row wrap={false} className="flex-1 overflow-hidden p-4 sm:p-5" gutter={[0, 16]}>
            <Col
              className="relative border-r border-custom-border-200 overflow-y-auto"
              flex="0 0 auto"
              style={{ width: leftWidth, minWidth: 200, maxWidth: 300 }}
            >
              <div className="p-2">
                <Space>
                  <Input
                    allowClear
                    placeholder="按模块名称搜索"
                    value={searchModule}
                    onChange={(e) => setSearchModule(e.target.value)}
                    style={{ width: 140 }}
                  />
                  <Button type="primary" onClick={() => setIsCreateModalOpen(true)} disabled={!repositoryId}>
                    新建
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={!repositoryId}>
                    导入
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept=".xlsx,.xls"
                    onChange={handleImport}
                  />
                </Space>
              </div>
              <div
                onMouseDown={onMouseDownResize}
                className="absolute right-0 top-0 h-full w-2"
                style={{ cursor: "col-resize", zIndex: 10 }}
              />
              <Tree
                showLine={false}
                defaultExpandAll
                onSelect={onSelect}
                onExpand={onExpand}
                expandedKeys={expandedKeys}
                autoExpandParent={autoExpandParent}
                treeData={treeData}
                selectedKeys={selectedModuleId ? [selectedModuleId] : ["all"]}
                className="py-2"
              />
            </Col>
            {/* 右侧表格 */}
            <Col flex="auto" className="overflow-y-auto">
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
          handleClose={() => {
            setIsCreateModalOpen(false);
            fetchModules();
          }}
          workspaceSlug={workspaceSlug as string}
          repositoryId={repositoryId as string}
          repositoryName={decodeURIComponent(repositoryName || "")}
          onSuccess={async () => {
            // 新增成功后刷新当前列表与分页/筛选状态
            await fetchCases(currentPage, pageSize, filters);
            fetchModules();
            fetchCases(1, pageSize, filters);
          }}
        />
      )}
      <UpdateModal
        open={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setActiveCase(null);
          fetchModules();
          fetchCases(1, pageSize, filters);
          const updatedRoute = updateQueryParams({ paramsToRemove: ["peekCase"] });
          router.push(updatedRoute);
        }}
        caseId={activeCase?.id}
      />
    </>
  );
}

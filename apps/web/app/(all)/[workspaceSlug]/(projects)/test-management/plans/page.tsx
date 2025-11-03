"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { PageHead } from "@/components/core/page-title";
// services
import { PlanService } from "@/services/qa/plan.service";
import { Space, Table, Tag, Input, Button, Dropdown, Modal } from "antd";
import { SearchOutlined, PlusOutlined, MoreOutlined } from "@ant-design/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TableProps, InputRef, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
// plane ui
import { Avatar, AvatarGroup } from "@plane/ui";
import { getFileURL } from "@plane/utils";
import { TestPlan, TestPlanResponse } from "../data-model";
import { formatDate, formatDateTime, globalEnums } from "../util";
import { CreateUpdatePlanModal } from "@/components/qa/plans/create-update-modal";

export default function TestPlanDetailPage() {
  const { workspaceSlug } = useParams();
  const Enums = globalEnums.Enums;
  const repositoryName = sessionStorage.getItem("selectedRepositoryName");
  const repositoryId = sessionStorage.getItem("selectedRepositoryId");
  // 解码URL编码的repositoryName
  const decodedRepositoryName = repositoryName ? decodeURIComponent(repositoryName as string) : "";

  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  // 新增：创建计划模态框开关
  const [showCreateModal, setShowCreateModal] = useState(false);
  // 新增：PlanService 实例
  const planService = new PlanService();

  // 分页状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 筛选状态管理（新增：状态多选与负责人名称）
  const [filters, setFilters] = useState<{
    name?: string;
    assigneeName?: string;
    states?: number[];
  }>({});

  // 当repositoryId获取到后，开始获取测试计划数据
  useEffect(() => {
    if (repositoryId) {
      fetchTestPlans();
    }
  }, [repositoryId]);

  // 搜索筛选函数（支持 name 与 assignees 两列）
  const getColumnSearchProps = (dataIndex: keyof TestPlan | string): TableColumnType<TestPlan> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex === "name" ? "名称" : dataIndex === "assignees" ? "负责人名称" : "其他"}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], dataIndex, close)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], dataIndex, close)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters, dataIndex)}
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
    filteredValue:
      dataIndex === "name"
        ? filters.name
          ? [filters.name]
          : null
        : dataIndex === "assignees"
          ? filters.assigneeName
            ? [filters.assigneeName]
            : null
          : null,
  });

  const handleSearch = (selectedKeys: string[], dataIndex: keyof TestPlan | string, close?: () => void) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);

    const newFilters = { ...filters };
    if (selectedKeys[0]) {
      if (dataIndex === "name") newFilters.name = selectedKeys[0];
      if (dataIndex === "assignees") newFilters.assigneeName = selectedKeys[0];
    } else {
      if (dataIndex === "name") delete newFilters.name;
      if (dataIndex === "assignees") delete newFilters.assigneeName;
    }

    setFilters(newFilters);
    fetchTestPlans(1, pageSize, newFilters);
    close?.();
  };

  const handleReset = (clearFilters: () => void, dataIndex: keyof TestPlan | string) => {
    clearFilters();
    setSearchText("");

    const newFilters = { ...filters };
    if (dataIndex === "name") {
      delete newFilters.name;
    }
    if (dataIndex === "assignees") {
      delete newFilters.assigneeName;
    }

    setFilters(newFilters);
    fetchTestPlans(1, pageSize, newFilters);
  };

  // 渲染分配人员
  const renderAssignees = (assignees: TestPlan["assignees"]) => {
    if (!assignees || assignees.length === 0) {
      return <span className="text-custom-text-400">-</span>;
    }

    return (
      <AvatarGroup max={3} size="md" showTooltip={true}>
        {assignees.map((assignee) => (
          <Avatar
            key={assignee.id}
            src={getFileURL(assignee.avatar_url ?? "")}
            name={assignee.display_name}
            fallbackText={assignee.display_name}
            size="lg"
            showTooltip={true}
          />
        ))}
      </AvatarGroup>
    );
  };

  // 渲染状态标签
  const renderState = (state: number) => {
    const stateConfig = {
      未开始: { color: "default", text: "未开始" },
      进行中: { color: "processing", text: "进行中" },
      已完成: { color: "success", text: "已完成" },
    };

    const stateKey = (Enums.plan_state[state] ?? "未开始") as keyof typeof stateConfig;
    const config = stateConfig[stateKey];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格变更回调：统一处理分页与服务端过滤（状态/负责人）
  const handleTableChange: TableProps<TestPlan>["onChange"] = (pagination, tableFilters) => {
    const selectedStates = (tableFilters?.state as number[] | undefined) || [];
    const newFilters = {
      ...filters,
      states: selectedStates.length ? selectedStates.map((v) => Number(v)) : undefined,
    };
    const nextPage = pagination.current || 1;
    const nextPageSize = pagination.pageSize || pageSize;

    setCurrentPage(nextPage);
    setPageSize(nextPageSize);
    setFilters(newFilters);
    fetchTestPlans(nextPage, nextPageSize, newFilters);
  };

  // 新增：编辑模态框状态与当前编辑项
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TestPlan | null>(null);

  const openEditModal = (plan: TestPlan) => {
    setEditingPlan(plan);
    setShowEditModal(true);
  };

  const handleEditSuccess = async () => {
    setShowEditModal(false);
    setEditingPlan(null);
    await fetchTestPlans(currentPage, pageSize, filters);
  };

  const confirmDelete = (plan: TestPlan) => {
    Modal.confirm({
      title: "确认删除",
      content: "确定要删除该测试计划吗？此操作不可撤销。",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await planService.deletePlan(workspaceSlug as string, [plan.id]);
          // 如果已引入 @plane/propel/toast，则复用统一提示
          // setToast({ type: TOAST_TYPE.SUCCESS, title: "成功", message: "测试计划删除成功" });
          await fetchTestPlans(currentPage, pageSize, filters);
        } catch (e: any) {
          // setToast({ type: TOAST_TYPE.ERROR, title: "失败", message: e?.message || "删除失败，请稍后重试" });
        }
      },
    });
  };

  const columns: TableProps<TestPlan>["columns"] = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      // 新增：悬停显示操作按钮 + 悬停弹出二级菜单（编辑/删除）
      render: (_name: string, record: TestPlan) => {
        const items = [
          { key: "edit", label: "编辑" },
          { key: "delete", label: "删除", danger: true },
        ];
        return (
          <div className="flex items-center justify-between group">
            <span className="truncate">{record.name}</span>
            <Dropdown
              trigger={["hover"]}
              placement="bottomRight"
              menu={{
                items,
                onClick: ({ key }) => {
                  if (key === "edit") openEditModal(record);
                  if (key === "delete") confirmDelete(record);
                },
              }}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
              />
            </Dropdown>
          </div>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "state",
      key: "state",
      render: (state) => renderState(state),
      width: 100,
      // 服务端多选过滤：提供选项并受控显示选中值
      filters: Object.entries(Enums?.plan_state || {}).map(([value, label]) => ({
        text: String(label),
        value: Number(value),
      })),
      filterMultiple: true,
      filteredValue: filters.states ?? null,
    },
    {
      title: "负责人",
      dataIndex: "assignees",
      key: "assignees",
      render: (assignees) => renderAssignees(assignees),
      // 负责人名称搜索（服务端模糊匹配）
      ...getColumnSearchProps("assignees"),
    },
    {
      title: "测试用例数",
      dataIndex: "cases",
      key: "cases",
      render: (cases) => <Tag color="blue">{cases ? cases.length : 0} 个用例</Tag>,
    },
    {
      title: "开始日期",
      dataIndex: "begin_time",
      key: "begin_time",
      render: (dateString) => (dateString ? formatDate(dateString) : "-"),
    },
    {
      title: "结束日期",
      dataIndex: "end_time",
      key: "end_time",
      render: (dateString) => (dateString ? formatDate(dateString) : "-"),
    },
  ];

  // 获取测试计划数据：严格使用 state__in 和 assignee_display_name
  const fetchTestPlans = async (
    page: number = currentPage,
    size: number = pageSize,
    filterParams: typeof filters = filters
  ) => {
    if (!workspaceSlug || !repositoryId) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: any = {
        repository_id: repositoryId,
        page: page,
        page_size: size,
      };

      // 名称模糊
      if (filterParams.name) {
        queryParams.name__icontains = filterParams.name;
      }
      // 负责人名称（服务端 icontains）
      if (filterParams.assigneeName) {
        queryParams.assignee_display_name = filterParams.assigneeName;
      }
      // 状态多选（服务端 in）
      if (filterParams.states && filterParams.states.length > 0) {
        queryParams.state__in = filterParams.states.join(",");
      }

      const response: TestPlanResponse = await planService.getPlans(workspaceSlug as string, queryParams);

      setTestPlans(response.data || []);
      setTotal(response.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err) {
      console.error("获取测试计划数据失败:", err);
      setError("获取测试计划数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理分页变化
  const handlePaginationChange = (page: number, size?: number) => {
    const newPageSize = size || pageSize;
    fetchTestPlans(page, newPageSize, filters);
  };

  // 处理每页大小变化
  const handlePageSizeChange = (current: number, size: number) => {
    fetchTestPlans(1, size, filters);
  };

  const handleCreateSuccess = async () => {
    // 创建成功后刷新当前列表数据
    await fetchTestPlans(currentPage, pageSize, filters);
  };

  return (
    <>
      <PageHead title={`测试计划 - ${decodedRepositoryName}`} />
      <div className="h-full w-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-4 py-3 sm:px-5">
            <div></div>
            <div>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
                新建
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-4 sm:p-5">
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
                <div className="text-custom-text-300">未找到用例库ID，请重新选择用例库</div>
              </div>
            )}

            {repositoryId && !loading && !error && (
              <Table
                dataSource={testPlans}
                columns={columns}
                loading={loading}
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
          </div>
        </div>
      </div>

      {/* 新增：创建/编辑测试计划模态框（当前用创建模式） */}
      <CreateUpdatePlanModal
        isOpen={showCreateModal}
        handleClose={() => setShowCreateModal(false)}
        workspaceSlug={workspaceSlug as string}
        repositoryId={repositoryId as string}
        repositoryName={decodedRepositoryName}
        mode="create"
        onSuccess={async () => {
          await fetchTestPlans(currentPage, pageSize, filters);
          setShowCreateModal(false);
        }}
      />

      {/* 新增：编辑测试计划模态框 */}
      <CreateUpdatePlanModal
        key={editingPlan?.id || "edit"} // 新增：强制不同计划编辑时重新挂载，避免状态残留
        isOpen={showEditModal}
        handleClose={() => {
          setShowEditModal(false);
          setEditingPlan(null);
        }}
        workspaceSlug={workspaceSlug as string}
        repositoryId={repositoryId as string}
        repositoryName={decodedRepositoryName}
        mode="edit"
        planId={editingPlan?.id}
        initialData={{
          name: editingPlan?.name ?? "",
          assignees: editingPlan?.assignees ? editingPlan.assignees.map((a) => a.id) : [],
          begin_time: editingPlan?.begin_time ?? null,
          end_time: editingPlan?.end_time ?? null,
        }}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
// plane imports
// components
import { PageHead } from "@/components/core/page-title";
// services
import { RepositoryService } from "@/services/qa/repository.service";
import { Space, Table, Tag, Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { TableProps, InputRef, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { Repository, RepositoryResponse } from "./data-model";
import { formatDateTime, getEnums, globalEnums } from "./util";

// 初始化服务
const repositoryService = new RepositoryService();

export default function TestManagementHomePage() {
  const { workspaceSlug } = useParams(); // ✅ 在组件内部调用
  const router = useRouter();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");

  // ✅ 使用 useEffect 处理异步初始化
  useEffect(() => {
    const initializeEnums = async () => {
      if (workspaceSlug) {
        try {
          const enumTypes = await getEnums(workspaceSlug as string);
          globalEnums.setEnums(enumTypes);
        } catch (error) {
          console.error("Failed to initialize enums:", error);
        }
      }
    };

    initializeEnums();
  }, [workspaceSlug]);

  const searchInput = useRef<InputRef>(null);

  // 分页状态管理
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // 筛选状态管理
  const [filters, setFilters] = useState<{
    name?: string;
    project?: string;
  }>({});

  // 搜索筛选函数
  const getColumnSearchProps = (dataIndex: keyof Repository | string): TableColumnType<Repository> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex === "name" ? "名称" : "项目"}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          // 将 confirm 改为 close，避免触发 Table 内部回调导致的首个“无筛选”请求
          onPressEnter={() => handleSearch(selectedKeys as string[], dataIndex, close)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            // 同样使用 close 而不是 confirm
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
    // 移除客户端的 onFilter 逻辑
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    // 显示当前筛选状态
    filteredValue:
      dataIndex === "name"
        ? filters.name
          ? [filters.name]
          : null
        : dataIndex === "project"
          ? filters.project
            ? [filters.project]
            : null
          : null,
  });

  // 移除 confirm 的参数与调用，改为手动 close 下拉，仅发起一次服务端请求
  const handleSearch = (selectedKeys: string[], dataIndex: keyof Repository | string, close?: () => void) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);

    const newFilters = { ...filters };
    if (selectedKeys[0]) {
      if (dataIndex === "name") newFilters.name = selectedKeys[0];
      else if (dataIndex === "project") newFilters.project = selectedKeys[0];
    } else {
      if (dataIndex === "name") delete newFilters.name;
      else if (dataIndex === "project") delete newFilters.project;
    }

    setFilters(newFilters);
    // 重置到第一页并应用筛选，仅此一次请求
    fetchRepositories(1, pageSize, newFilters);
    // 手动关闭下拉
    close?.();
  };

  const handleReset = (clearFilters: () => void, dataIndex: keyof Repository | string) => {
    clearFilters();
    setSearchText("");

    // 清除对应的筛选条件
    const newFilters = { ...filters };
    if (dataIndex === "name") {
      delete newFilters.name;
    } else if (dataIndex === "project") {
      delete newFilters.project;
    }

    setFilters(newFilters);
    // 重置到第一页并清除筛选
    fetchRepositories(1, pageSize, newFilters);
  };

  const columns: TableProps<Repository>["columns"] = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a
          onClick={() => {
            // 将repositoryId存储到sessionStorage
            sessionStorage.setItem("selectedRepositoryId", record.id);
            console.log("🚀 ~ TestManagementHomePage ~ record:", record);
            sessionStorage.setItem("selectedRepositoryName", record.name);
            router.push(`/${workspaceSlug}/test-management/plans/`);
          }}
          style={{ cursor: "pointer" }}
        >
          {text}
        </a>
      ),
      ...getColumnSearchProps("name"),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "项目",
      dataIndex: "project",
      key: "project",
      render: (_, record) => record.project?.name,
      ...getColumnSearchProps("project"),
    },
    {
      title: "创建者",
      key: "created_by",
      dataIndex: "created_by",
      render: (_, record) => record.created_by?.display_name,
    },
    {
      title: "创建时间",
      key: "created_at",
      dataIndex: "created_at",
      render: (dateString) => formatDateTime(dateString),
      defaultSortOrder: "descend",
      sorter: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
  ];

  // 获取用例库数据
  const fetchRepositories = async (
    page: number = currentPage,
    size: number = pageSize,
    filterParams: typeof filters = filters
  ) => {
    if (!workspaceSlug) return;

    try {
      setLoading(true);
      setError(null);

      // 构建查询参数
      const queryParams: any = {
        page: page,
        page_size: size,
      };

      // 添加筛选参数
      if (filterParams.name) {
        queryParams.name__icontains = filterParams.name;
      }
      if (filterParams.project) {
        queryParams.project__name__icontains = filterParams.project; // 假设后端支持这种嵌套查询
      }

      const response: RepositoryResponse = await repositoryService.getRepositories(
        workspaceSlug as string,
        queryParams
      );

      setRepositories(response.data || []);
      setTotal(response.count || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err) {
      console.error("获取用例库数据失败:", err);
      setError("获取用例库数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理分页变化
  const handlePaginationChange = (page: number, size?: number) => {
    const newPageSize = size || pageSize;
    fetchRepositories(page, newPageSize, filters);
  };

  // 处理每页大小变化
  const handlePageSizeChange = (current: number, size: number) => {
    // 当改变每页大小时，重置到第一页
    fetchRepositories(1, size, filters);
  };

  useEffect(() => {
    fetchRepositories();
  }, [workspaceSlug]);

  return (
    <>
      <PageHead title="测试管理" />
      <div className="">
        <div className="">
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

          {!loading && !error && (
            <>
              <div>
                <Table
                  dataSource={repositories}
                  columns={columns}
                  loading={loading}
                  rowKey="id"
                  bordered={true}
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    // 修正误写的 "1" -> "100"
                    pageSizeOptions: ["10", "20", "50", "100"],
                    onChange: handlePaginationChange,
                    onShowSizeChange: handlePageSizeChange,
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

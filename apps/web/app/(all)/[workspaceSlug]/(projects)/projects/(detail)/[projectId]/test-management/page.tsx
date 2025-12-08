"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { RepositoryService } from "@/services/qa/repository.service";
import { Space, Table, Tag, Input, Button, Modal, message } from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import type { TableProps, InputRef, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { formatDateTime, getEnums, globalEnums } from "./util";
import { Logo } from "@/components/common/logo";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import RepositoryModal from "./repository-modal";

const repositoryService = new RepositoryService();

export default function TestManagementHomePage() {
  const { workspaceSlug, projectId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");

  useEffect(() => {
    const initializeEnums = async () => {
      if (workspaceSlug) {
        try {
          const enumTypes = await getEnums(workspaceSlug as string);
          globalEnums.setEnums(enumTypes);
        } catch {}
      }
    };
    initializeEnums();
  }, [workspaceSlug]);

  useEffect(() => {
    const repositoryIdFromUrl = searchParams.get("repositoryId");
    if (!workspaceSlug || !repositoryIdFromUrl) return;
    try {
      sessionStorage.setItem("selectedRepositoryId", repositoryIdFromUrl);
    } catch {}
    const redirectTo = searchParams.get("redirect_to");
    const ws = String(workspaceSlug || "");
    const pid = String(projectId || "");
    let target = redirectTo ? decodeURIComponent(redirectTo) : `/${ws}/projects/${pid}/test-management/plans`;
    target = target.includes("?")
      ? `${target}&repositoryId=${encodeURIComponent(String(repositoryIdFromUrl))}`
      : `${target}?repositoryId=${encodeURIComponent(String(repositoryIdFromUrl))}`;
    router.push(target);
  }, [searchParams, workspaceSlug, projectId, router]);

  const searchInput = useRef<InputRef>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ name?: string; project?: string }>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const getColumnSearchProps = (dataIndex: keyof any | string): TableColumnType<any> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex === "name" ? "名称" : "项目"}`}
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
      if (visible) setTimeout(() => searchInput.current?.select(), 100);
    },
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

  const handleSearch = (selectedKeys: string[], dataIndex: keyof any | string, close?: () => void) => {
    setSearchText(selectedKeys[0]);
    setSearchedColumn(String(dataIndex));
    const newFilters = { ...filters };
    if (selectedKeys[0]) {
      if (dataIndex === "name") newFilters.name = selectedKeys[0];
      else if (dataIndex === "project") newFilters.project = selectedKeys[0];
    } else {
      if (dataIndex === "name") delete newFilters.name;
      else if (dataIndex === "project") delete newFilters.project;
    }
    setFilters(newFilters);
    fetchRepositories(1, pageSize, newFilters);
    close?.();
  };

  const handleReset = (clearFilters: () => void, dataIndex: keyof any | string) => {
    clearFilters();
    setSearchText("");
    const newFilters = { ...filters };
    if (dataIndex === "name") delete newFilters.name;
    else if (dataIndex === "project") delete newFilters.project;
    setFilters(newFilters);
    fetchRepositories(1, pageSize, newFilters);
  };

  const columns: TableProps<any>["columns"] = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a
          onClick={() => {
            sessionStorage.setItem("selectedRepositoryId", record.id);
            sessionStorage.setItem("selectedRepositoryName", record.name);
            const ws = String(workspaceSlug || "");
            const pid = String(projectId || "");
            let target = `/${ws}/projects/${pid}/test-management/plans?repositoryId=${encodeURIComponent(String(record.id))}`;
            router.push(target);
          }}
          style={{ cursor: "pointer" }}
        >
          {text}
        </a>
      ),
      ...getColumnSearchProps("name"),
    },
    { title: "描述", dataIndex: "description", key: "description" },
    {
      title: "项目",
      dataIndex: "project",
      key: "project",
      render: (_, record) => {
        const p: any = record.project as any;
        if (!p) return null;
        if (typeof p === "string") return <span className="truncate">{p}</span>;
        return (
          <div className="flex items-center gap-2">
            <Logo logo={p.logo_props} size={18} />
            <span className="truncate">{p.name}</span>
          </div>
        );
      },
      ...getColumnSearchProps("project"),
    },
    {
      title: "创建者",
      key: "created_by",
      dataIndex: "created_by",
      render: (_: any, record: any) => (
        <MemberDropdown
          multiple={true}
          value={[record.created_by.id]}
          onChange={() => {}}
          disabled={true}
          placeholder={"未知用户"}
          className="w-full text-sm"
          buttonContainerClassName="w-full text-left p-0 cursor-default"
          buttonVariant="transparent-with-text"
          buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit"
          showUserDetails={true}
          optionsClassName="z-[60]"
        />
      ),
    },
    {
      title: "创建时间",
      key: "created_at",
      dataIndex: "created_at",
      render: (dateString: string) => formatDateTime(dateString),
      defaultSortOrder: "descend",
      sorter: (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditing(record);
              setModalOpen(true);
            }}
          />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => confirmDelete(record)} />
        </Space>
      ),
    },
  ];

  const fetchRepositories = async (page: number = currentPage, size: number = pageSize, filterParams = filters) => {
    if (!workspaceSlug) return;
    try {
      setLoading(true);
      setError(null);
      const queryParams: any = { page, page_size: size };
      if (filterParams.name) queryParams.name__icontains = filterParams.name;
      if (filterParams.project) queryParams.project__name__icontains = filterParams.project;
      if (projectId) queryParams.project_id = projectId;
      const response: any = await repositoryService.getRepositories(workspaceSlug as string, queryParams);
      const list = response?.data || [];
      setRepositories(list);
      setTotal(response.count || list.length || 0);
      setCurrentPage(page);
      setPageSize(size);
    } catch (err) {
      setError("获取用例库数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (repo: any) => {
    Modal.confirm({
      title: "确认删除",
      content: `确定删除用例库“${repo.name}”吗？删除后不可恢复。`,
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!workspaceSlug || !repo?.id) return;
        try {
          setApiLoading(true);
          await repositoryService.deleteRepository(String(workspaceSlug), { ids: [repo.id] });
          message.success("删除成功");
          await fetchRepositories(1, pageSize, filters);
        } catch (e: any) {
          message.error(e?.message || e?.detail || e?.error || "删除失败，请稍后重试");
        } finally {
          setApiLoading(false);
        }
      },
    });
  };

  const handlePaginationChange = (page: number, size?: number) => {
    const newPageSize = size || pageSize;
    fetchRepositories(page, newPageSize, filters);
  };

  const handlePageSizeChange = (_current: number, size: number) => {
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
                <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-4 py-3 sm:px-5">
                  <div>测试用例库</div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditing(null);
                      setModalOpen(true);
                    }}
                  >
                    新增
                  </Button>
                </div>
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
                    pageSizeOptions: ["10", "20", "50", "100"],
                    onChange: handlePaginationChange,
                    onShowSizeChange: handlePageSizeChange,
                  }}
                />
                {apiLoading && <div className="sr-only">processing...</div>}
                <RepositoryModal
                  open={modalOpen}
                  workspaceSlug={String(workspaceSlug || "")}
                  projectId={String(projectId || "")}
                  initialValues={editing}
                  onCancel={() => setModalOpen(false)}
                  onSuccess={() => fetchRepositories(1, pageSize, filters)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

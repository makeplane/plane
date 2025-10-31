"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
// plane imports
// components
import { PageHead } from "@/components/core/page-title";
// services
import { RepositoryService } from "@/services/qa/repository.service";
import { Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import { Repository, RepositoryResponse } from "./data-model";
import { formatDateTime } from "./util";

const columns: TableProps<Repository>["columns"] = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    render: (text) => <a>{text}</a>,
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
  },
  {
    title: "创建者",
    key: "created_by",
    dataIndex: "created_by",
    render: (_, record) => record.created_by?.display_name || "未知用户",
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

// 初始化服务
const repositoryService = new RepositoryService();

export default function TestManagementHomePage() {
  const { workspaceSlug } = useParams();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取用例库数据
  const fetchRepositories = async () => {
    if (!workspaceSlug) return;

    try {
      setLoading(true);
      setError(null);
      const response: RepositoryResponse = await repositoryService.getRepositories(workspaceSlug as string);
      setRepositories(response.data || []);
    } catch (err) {
      console.error("获取用例库数据失败:", err);
      setError("获取用例库数据失败，请稍后重试");
    } finally {
      setLoading(false);
    }
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
              {repositories.length > 0 ? (
                <div>
                  <Table dataSource={repositories} columns={columns} loading={loading} rowKey="id" bordered={true} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-custom-text-300 text-sm">暂无用例库数据</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

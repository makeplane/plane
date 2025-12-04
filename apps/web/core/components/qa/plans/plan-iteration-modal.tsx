"use client";

import React, { useEffect, useRef, useState } from "react";
import { ModalCore, EModalPosition, EModalWidth } from "@plane/ui";
import { Button } from "@plane/propel/button";
import { Row, Col, Input, Pagination, Table, Tag, Progress, message } from "antd";
import { ProjectService } from "@/services/project/project.service";
import { CycleService } from "@/services/cycle.service";
import { CaseService } from "@/services/qa/case.service";
import { Logo } from "@/components/common/logo";
import type { TPartialProject } from "@/plane-web/types";
import dayjs from "dayjs";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ICycle } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  repositoryId: string;
  planId?: string;
  onClosed?: () => void;
};

const PlanIterationModal: React.FC<Props> = (props) => {
  const { isOpen, onClose, onClosed, workspaceSlug } = props;

  const service = useRef(new ProjectService()).current;
  const cycleService = useRef(new CycleService()).current;
  const [projects, setProjects] = useState<TPartialProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [cycles, setCycles] = useState<ICycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(false);
  const [cyclesError, setCyclesError] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const caseService = useRef(new CaseService()).current;

  const fetchCycles = async (projectId: string) => {
    try {
      setCyclesLoading(true);
      setCyclesError(null);
      const res = await cycleService.getCyclesWithParams(workspaceSlug, projectId, "all" as any);
      setCycles(res);
    } catch (e) {
      setCycles([]);
      setCyclesError("周期加载失败");
    } finally {
      setCyclesLoading(false);
    }
  };

  const fetchProjects = async (nextPage?: number, nextPageSize?: number, kw?: string) => {
    try {
      setLoading(true);
      setError(null);
      const search = (kw ?? keyword) || "";
      const p = {
        page: nextPage ?? page,
        page_size: nextPageSize ?? pageSize,
        ...(search.trim() ? { name__icontains: search.trim() } : {}),
      };
      const res: any = await service.getUserProjects(String(workspaceSlug), p);
      const projectList = Array.isArray(res?.data) ? res.data : [];
      setProjects(projectList);
      setTotal(Number(res?.count) || 0);
      setPage(p.page);
      setPageSize(p.page_size);

      if (projectList.length > 0 && !selectedProject) {
        const firstProject = projectList[0];
        setSelectedProject(firstProject.id);
        fetchCycles(firstProject.id);
      }
    } catch (e) {
      setProjects([]);
      setTotal(0);
      setError("项目加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !workspaceSlug) return;
    fetchProjects(1, pageSize);
  }, [isOpen, workspaceSlug]);

  useEffect(() => {
    if (selectedProject) {
      fetchCycles(selectedProject);
      setSelectedRowKeys([]);
    }
  }, [selectedProject]);

  const handleConfirm = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("请至少选择一个周期");
      return;
    }
    if (!props.planId) {
      message.error("缺少测试计划ID");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        plan_id: props.planId,
        cycle_id: selectedRowKeys as string[],
      };

      await caseService.assocateCycle(workspaceSlug, payload);
      message.success("关联成功");

      setKeyword("");
      setPage(1);
      setPageSize(10);
      onClose();
      onClosed && onClosed();
    } catch (error) {
      console.error(error);
      message.error("关联失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={() => {
        setKeyword("");
        setPage(1);
        setPageSize(10);
        onClose();
        onClosed && onClosed();
      }}
      position={EModalPosition.CENTER}
      width={EModalWidth.VXL}
    >
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-6 py-4">
          <h3 className="text-lg font-medium">迭代规划</h3>
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => {
              setKeyword("");
              setPage(1);
              setPageSize(10);
              onClose();
              onClosed && onClosed();
            }}
          >
            关闭
          </Button>
        </div>
        <Row wrap={false} className="h-[70vh] max-h-[70vh] overflow-hidden p-6" gutter={[16, 16]}>
          <Col flex="0 0 auto" className="border-r border-custom-border-200" style={{ width: 360, minWidth: 300 }}>
            <div className="flex items-center justify-between gap-2 pb-3">
              <div className="text-sm text-custom-text-300">项目列表</div>
            </div>
            <div className="pb-3">
              <Input.Search
                placeholder="输入名称进行查询"
                allowClear
                value={keyword}
                onChange={(e) => {
                  const v = e.target.value;
                  setKeyword(v);
                  if (v.trim() === "") fetchProjects(1, pageSize, "");
                }}
                onSearch={(value) => {
                  const v = String(value ?? "");
                  setKeyword(v);
                  fetchProjects(1, pageSize, v);
                }}
              />
            </div>
            <div className="h-[calc(70vh-140px)] overflow-y-auto">
              {loading && <div className="flex items-center justify-center py-12 text-custom-text-300">加载中...</div>}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm">{error}</div>
              )}
              {!loading && !error && projects.length === 0 && (
                <div className="flex items-center justify-center py-12 text-custom-text-300">暂无项目</div>
              )}
              {!loading && !error && projects.length > 0 && (
                <div className="flex flex-col gap-2">
                  {projects.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 px-2 py-2 cursor-pointer rounded-md hover:bg-custom-background-80 ${
                        selectedProject === p.id ? "bg-custom-background-80" : ""
                      }`}
                      onClick={() => setSelectedProject(p.id)}
                    >
                      <div className="size-4 grid place-items-center flex-shrink-0">
                        <Logo logo={p.logo_props} size={16} />
                      </div>
                      <div className="truncate text-sm text-custom-text-200">{p.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-3">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showQuickJumper
                onChange={(p, s) => {
                  if (s !== pageSize) return;
                  fetchProjects(p, s, keyword);
                }}
                onShowSizeChange={(_, s) => fetchProjects(1, s, keyword)}
              />
            </div>
          </Col>
          <Col flex="auto" className="h-full overflow-y-auto">
            <div className="w-full h-full">
              {cyclesLoading && (
                <div className="flex items-center justify-center py-12 text-custom-text-300">加载中...</div>
              )}
              {cyclesError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-800 text-sm m-6">
                  {cyclesError}
                </div>
              )}
              {!cyclesLoading && !cyclesError && cycles.length === 0 && (
                <div className="flex items-center justify-center py-12 text-custom-text-300">暂无迭代</div>
              )}
              {!cyclesLoading && !cyclesError && cycles.length > 0 && (
                <Table
                  dataSource={cycles}
                  rowKey="id"
                  pagination={false}
                  rowSelection={{
                    type: "checkbox",
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                  }}
                  columns={[
                    {
                      title: "名称",
                      dataIndex: "name",
                      key: "name",
                      render: (name) => <span className="text-sm text-custom-text-100">{name}</span>,
                    },
                    {
                      title: "状态",
                      dataIndex: "status",
                      key: "status",
                      render: (_, record) => {
                        const currentDate = dayjs();
                        const startDate = record.start_date ? dayjs(record.start_date) : null;
                        const endDate = record.end_date ? dayjs(record.end_date) : null;

                        let status = "未开始";
                        let color = "default";

                        if (startDate && endDate) {
                          if (currentDate.isBefore(startDate)) {
                            status = "未开始";
                            color = "default";
                          } else if (currentDate.isAfter(endDate)) {
                            status = "已完成";
                            color = "success";
                          } else {
                            status = "进行中";
                            color = "processing";
                          }
                        }

                        return <Tag color={color}>{status}</Tag>;
                      },
                    },
                    {
                      title: "进度",
                      key: "progress",
                      render: (_, record) => {
                        const totalIssues = record.total_issues || 0;
                        const completedIssues = record.completed_issues || 0;
                        const percent = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
                        return <Progress percent={percent} size="small" />;
                      },
                    },
                    {
                      title: "负责人",
                      dataIndex: "owned_by_id",
                      key: "owned_by_id",
                      render: (uid: string | null) => (
                        <MemberDropdown
                          multiple={false}
                          value={uid ?? null}
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
                      title: "时间信息",
                      key: "date",
                      render: (_, record) => (
                        <div className="flex flex-col text-xs text-custom-text-200">
                          <div>开始: {record.start_date ? dayjs(record.start_date).format("YYYY-MM-DD") : "-"}</div>
                          <div>结束: {record.end_date ? dayjs(record.end_date).format("YYYY-MM-DD") : "-"}</div>
                        </div>
                      ),
                    },
                  ]}
                />
              )}
            </div>
          </Col>
        </Row>
        <div className="sticky bottom-0 w-full bg-custom-background-100 border-t border-custom-border-200 px-6 py-3 flex items-center justify-end gap-3">
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => {
              setKeyword("");
              setPage(1);
              setPageSize(10);
              onClose();
              onClosed && onClosed();
            }}
          >
            取消
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm} loading={submitting}>
            确定
          </Button>
        </div>
      </div>
    </ModalCore>
  );
};

export default PlanIterationModal;

"use client";

import React, { useEffect, useRef, useState } from "react";
import { ModalCore, EModalPosition, EModalWidth } from "@plane/ui";
import { Button } from "@plane/propel/button";
import { Row, Col, Table, Tag, Progress, message } from "antd";
import { CycleService } from "@/services/cycle.service";
import { CaseService } from "@/services/qa/case.service";
import dayjs from "dayjs";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ICycle } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  planId?: string;
  onClosed?: () => void;
};

const PlanIterationModal: React.FC<Props> = (props) => {
  const { isOpen, onClose, onClosed, workspaceSlug, projectId } = props;

  const cycleService = useRef(new CycleService()).current;
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

  useEffect(() => {
    if (!isOpen || !workspaceSlug || !projectId) return;
    fetchCycles(projectId);
    setSelectedRowKeys([]);
  }, [isOpen, workspaceSlug, projectId]);

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
        onClose();
        onClosed && onClosed();
      }}
      position={EModalPosition.CENTER}
      width={EModalWidth.VIXL}
    >
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 border-b border-custom-border-200 px-6 py-4">
          <h3 className="text-lg font-medium">迭代规划</h3>
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => {
              onClose();
              onClosed && onClosed();
            }}
          >
            关闭
          </Button>
        </div>
        <Row wrap={false} className="h-[70vh] max-h-[70vh] overflow-hidden p-6" gutter={[16, 16]}>
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
                      title: "开始时间",
                      dataIndex: "start_date",
                      key: "start_date",
                      render: (date: string | null) => (
                        <span className="text-xs text-custom-text-200">
                          {date ? dayjs(date).format("YYYY-MM-DD") : "-"}
                        </span>
                      ),
                    },
                    {
                      title: "结束时间",
                      dataIndex: "end_date",
                      key: "end_date",
                      render: (date: string | null) => (
                        <span className="text-xs text-custom-text-200">
                          {date ? dayjs(date).format("YYYY-MM-DD") : "-"}
                        </span>
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PageHead } from "@/components/core/page-title";
import { Input, Table, Dropdown, Button, Modal, Tag, message, Tooltip, Space } from "antd";
import type { TableProps, TableColumnType, InputRef } from "antd";
import {
  FolderOutlined,
  PlusOutlined,
  EllipsisOutlined,
  DeleteOutlined,
  SearchOutlined,
  EditOutlined,
} from "@ant-design/icons";
import styles from "./reviews.module.css";
import { CaseService } from "@/services/qa/review.service";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { formatCNDateTime } from "@/components/qa/cases/util";
import { debounce } from "lodash-es";
import CreateReviewModal from "@/components/qa/review/CreateReviewModal";
import { useAppRouter } from "@/hooks/use-app-router";

type ModuleNode = {
  id: string;
  name: string;
};

type ReviewModule = {
  id: string;
  name: string;
  review_count?: number;
  is_default?: boolean;
  repository?: string;
};

type ReviewItem = {
  id: string;
  name: string;
  case_count?: number;
  state?: string;
  pass_rate?: any;
  mode?: string;
  assignees?: string[];
  created_by?: string | null;
  module_name?: string;
  started_at?: string | null;
  ended_at?: string | null;
  created_at?: string;
  module_id?: string | null;
};

const initialModules: ModuleNode[] = [];

const initialReviews: ReviewItem[] = [];

export default function ReviewsPage() {
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  const repositoryId = typeof window !== "undefined" ? sessionStorage.getItem("selectedRepositoryId") : null;
  const [leftWidth, setLeftWidth] = useState<number>(300);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const [search, setSearch] = useState<string>("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [modules, setModules] = useState<ReviewModule[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [reviewEnums, setReviewEnums] = useState<Record<string, Record<string, { label: string; color: string }>>>({});
  const [creatingOpen, setCreatingOpen] = useState<boolean>(false);
  const [creatingName, setCreatingName] = useState<string>("");
  const [filters, setFilters] = useState<{ name?: string; state?: string[]; mode?: string[] }>({});
  const searchInput = useRef<InputRef | null>(null);
  const caseService = useMemo(() => new CaseService(), []);
  const [createReviewOpen, setCreateReviewOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const [editReview, setEditReview] = useState<any>(null);

  const totalReviews = useMemo(() => modules.reduce((sum, m) => sum + (m.review_count || 0), 0), [modules]);

  const onMouseDownResize = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
    window.addEventListener("mousemove", onMouseMoveResize as any);
    window.addEventListener("mouseup", onMouseUpResize as any);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  };

  const onMouseMoveResize = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const next = Math.min(300, Math.max(200, startWidthRef.current + (e.clientX - startXRef.current)));
    setLeftWidth(next);
  };

  const onMouseUpResize = () => {
    isDraggingRef.current = false;
    window.removeEventListener("mousemove", onMouseMoveResize as any);
    window.removeEventListener("mouseup", onMouseUpResize as any);
    document.body.style.cursor = "auto";
    document.body.style.userSelect = "auto";
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMouseMoveResize as any);
      window.removeEventListener("mouseup", onMouseUpResize as any);
    };
  }, []);

  useEffect(() => {
    if (!workspaceSlug || !repositoryId) return;
    fetchModules();
    fetchEnums();
    const storageKey = `reviews_name_filter_${workspaceSlug}_${repositoryId}`;
    const savedName = sessionStorage.getItem(storageKey) || "";
    const initFilters = savedName ? { ...filters, name: savedName } : { ...filters };
    setFilters(initFilters);
    debouncedFetchReviews(1, pageSize, selectedModuleId, initFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, repositoryId]);

  const fetchModules = async () => {
    if (!workspaceSlug) return;
    try {
      const data: ReviewModule[] = await caseService.getReviewModules(workspaceSlug as string, {
        repository_id: repositoryId,
      });
      setModules(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore error for placeholder page
    }
  };

  const fetchEnums = async () => {
    if (!workspaceSlug) return;
    try {
      const data = await caseService.getReviewEnums(workspaceSlug as string);
      setReviewEnums(data || {});
    } catch (e) {}
  };

  const fetchReviews = async (
    page: number,
    size: number,
    moduleId: string | null,
    extraFilters?: { name?: string; state?: string[]; mode?: string[] }
  ) => {
    if (!workspaceSlug) return;
    setLoading(true);
    setError("");
    try {
      const params: any = { page, page_size: size };
      if (moduleId) params.module_id = moduleId;
      if (extraFilters?.name) params.name__icontains = extraFilters.name;
      if (extraFilters?.state && extraFilters.state.length) params.state__in = extraFilters.state.join(",");
      if (extraFilters?.mode && extraFilters.mode.length) params.mode__in = extraFilters.mode.join(",");
      const res = await caseService.getReviews(workspaceSlug as string, params);
      setReviews(Array.isArray(res?.data) ? res.data : []);
      setTotal(Number(res?.count || 0));
    } catch (e: any) {
      setError(e?.message || e?.detail || e?.error || "加载失败");
      message.error(e?.message || e?.detail || e?.error || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchReviews = useMemo(
    () =>
      debounce(
        (
          page: number,
          size: number,
          moduleId: string | null,
          f?: { name?: string; state?: string[]; mode?: string[] }
        ) => {
          fetchReviews(page, size, moduleId, f);
        },
        300
      ),
    [workspaceSlug]
  );

  useEffect(() => {
    return () => {
      debouncedFetchReviews.cancel();
    };
  }, [debouncedFetchReviews]);

  const getColumnSearchProps = (dataIndex: keyof ReviewItem | string): TableColumnType<ReviewItem> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`搜索 ${dataIndex === "name" ? "评审名称" : ""}`}
          value={selectedKeys[0] as string}
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
        setTimeout(() => searchInput.current?.select?.(), 100);
      }
    },
    filteredValue: dataIndex === "name" ? (filters.name ? [filters.name] : null) : null,
  });

  const handleSearch = (selectedKeys: string[], dataIndex: keyof ReviewItem | string, confirm?: () => void) => {
    const newFilters = { ...filters };
    if (selectedKeys[0]) {
      if (dataIndex === "name") newFilters.name = selectedKeys[0];
    } else {
      if (dataIndex === "name") delete newFilters.name;
    }
    setFilters(newFilters);
    const storageKey = `reviews_name_filter_${workspaceSlug}_${repositoryId}`;
    if (dataIndex === "name") {
      const v = newFilters.name || "";
      try {
        sessionStorage.setItem(storageKey, v);
      } catch {}
    }
    confirm?.();
    setCurrentPage(1);
  };

  const handleReset = (clear: () => void, dataIndex: keyof ReviewItem | string, confirm?: () => void) => {
    clear();
    const newFilters = { ...filters };
    if (dataIndex === "name") delete newFilters.name;
    setFilters(newFilters);
    const storageKey = `reviews_name_filter_${workspaceSlug}_${repositoryId}`;
    if (dataIndex === "name") {
      try {
        sessionStorage.setItem(storageKey, "");
      } catch {}
    }
    confirm?.();
    setCurrentPage(1);
  };

  const handleCreateModule = async () => {
    const name = creatingName.trim();
    if (!name || !workspaceSlug || !repositoryId) {
      setCreatingOpen(false);
      setCreatingName("");
      return;
    }
    try {
      await caseService.createReviewModule(workspaceSlug as string, { name, repository: repositoryId });
      setCreatingOpen(false);
      setCreatingName("");
      await fetchModules();
    } catch (e) {
      setCreatingOpen(false);
      setCreatingName("");
    }
  };

  const confirmDeleteModule = (module: ReviewModule) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除该评审模块将不可恢复，是否继续？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!workspaceSlug || !module?.id) return;
        try {
          await caseService.deleteReviewModule(workspaceSlug as string, { ids: [module.id] });
          if (selectedModuleId === module.id) setSelectedModuleId(null);
          await fetchModules();
        } catch (e) {
          // ignore
        }
      },
    });
  };

  const confirmDeleteReview = (review: ReviewItem) => {
    Modal.confirm({
      title: "确认删除",
      content: "删除该评审将不可恢复，是否继续？",
      okText: "删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!workspaceSlug || !review?.id) return;
        try {
          await caseService.deleteReview(workspaceSlug as string, { ids: [review.id] });
          await fetchReviews(currentPage, pageSize, selectedModuleId, filters);
          message.success("删除成功");
        } catch (e) {}
      },
    });
  };

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return modules.filter((n) => (n?.name || "").toLowerCase().includes(q));
  }, [search, modules]);

  const moduleCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    modules.forEach((m) => {
      if (!m?.id) return;
      map[m.id] = m.review_count || 0;
    });
    return map;
  }, [modules]);

  useEffect(() => {
    debouncedFetchReviews(currentPage, pageSize, selectedModuleId, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModuleId, currentPage, pageSize, filters]);

  const totalForCurrent = useMemo(() => {
    return total;
  }, [total]);

  const dateOnly = (v?: string | number | Date | null) => {
    if (!v) return "-";
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
    if (isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const columns: TableProps<ReviewItem>["columns"] = [
    {
      title: "评审名称",
      dataIndex: "name",
      key: "name",
      width: 220,
      ...getColumnSearchProps("name"),
      render: (name: string, record: ReviewItem) => (
        <Button
          type="link"
          onClick={() =>
            router.push(`/${workspaceSlug}/test-management/caseManagementReviewDetail?review_id=${record.id}`)
          }
        >
          {name}
        </Button>
      ),
    },
    { title: "用例数量", dataIndex: "case_count", key: "case_count", width: 120 },
    {
      title: "评论状态",
      dataIndex: "state",
      key: "state",
      width: 140,
      render: (state: string) => {
        const color = reviewEnums?.CaseReview_State?.[state]?.color || "default";
        return <Tag color={color}>{state || "-"}</Tag>;
      },
      filters: Object.entries(reviewEnums?.CaseReview_State || {}).map(([value, meta]) => ({
        text: (meta as any)?.label || value,
        value,
      })),
      filterMultiple: true,
      filteredValue: filters.state ?? null,
    },
    {
      title: "通过率",
      dataIndex: "pass_rate",
      key: "pass_rate",
      width: 180,
      render: (passRate: any, record: ReviewItem) => {
        const enums = reviewEnums?.CaseReviewThrough_Result || {};
        const orderKeys = Object.keys(enums);
        const totalCount =
          typeof record?.case_count === "number"
            ? record.case_count || 0
            : Object.values(passRate || {}).reduce((s: number, v: any) => s + Number(v || 0), 0);
        const passKey = orderKeys.find((k) => enums[k]?.color === "green") || "通过";
        const passed = Number(passRate?.[passKey] || 0);
        const percent = totalCount > 0 ? Math.floor((passed / totalCount) * 100) : 0;

        const colorHexMap: Record<string, string> = {
          green: "#52c41a",
          red: "#ff4d4f",
          gold: "#faad14",
          blue: "#1677ff",
          gray: "#bfbfbf",
          default: "#d9d9d9",
        };

        const segments = orderKeys.map((k) => {
          const count = Number(passRate?.[k] || 0);
          const c = enums[k]?.color || "default";
          const color = colorHexMap[c] || c;
          const widthPct = totalCount > 0 ? (count / totalCount) * 100 : 0;
          return { key: k, count, color, widthPct };
        });

        const tooltipContent = (
          <div className={styles.legend}>
            {orderKeys.map((k) => {
              const c = enums[k]?.color || "default";
              const color = colorHexMap[c] || c;
              return (
                <div key={k} className={styles.legendItem}>
                  <span className={styles.legendColor} style={{ backgroundColor: color }} />
                  <span className={styles.legendLabel}>{k}</span>
                  <span className={styles.legendCount}>{Number(passRate?.[k] || 0)}</span>
                </div>
              );
            })}
          </div>
        );

        return (
          <div className={styles.passRateCell}>
            <Tooltip mouseEnterDelay={0.25} overlayClassName={styles.lightTooltip} title={tooltipContent}>
              <div className={styles.progressWrap}>
                <div className={styles.progressBar}>
                  {segments.map((seg, idx) => (
                    <div
                      key={`${seg.key}-${idx}`}
                      className={styles.progressSegment}
                      style={{ width: `${seg.widthPct}%`, backgroundColor: seg.color }}
                    />
                  ))}
                </div>
              </div>
            </Tooltip>
            <span className={styles.progressPercent}>{percent}%</span>
          </div>
        );
      },
    },
    {
      title: "评审模式",
      dataIndex: "mode",
      key: "mode",
      width: 140,
      render: (mode: string) => {
        const color = reviewEnums?.CaseReview_ReviewMode?.[mode]?.color || "default";
        return <Tag color={color}>{mode || "-"}</Tag>;
      },
      filters: Object.entries(reviewEnums?.CaseReview_ReviewMode || {}).map(([value, meta]) => ({
        text: (meta as any)?.label || value,
        value,
      })),
      filterMultiple: true,
      filteredValue: filters.mode ?? null,
    },
    {
      title: "评审人",
      dataIndex: "assignees",
      key: "assignees",
      width: 220,
      render: (assignees: string[] = []) => (
        <MemberDropdown
          multiple={true}
          value={assignees}
          onChange={() => {}}
          disabled={true}
          placeholder={assignees?.length ? "" : "未知用户"}
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
      title: "创建人",
      dataIndex: "created_by",
      key: "created_by",
      width: 200,
      render: (uid: string | null) => (
        <MemberDropdown
          multiple={false}
          value={uid ?? null}
          onChange={() => {}}
          disabled={true}
          placeholder={""}
          className="w-full text-sm"
          buttonContainerClassName="w-full text-left p-0 cursor-default"
          buttonVariant="transparent-with-text"
          buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit"
          showUserDetails={true}
          optionsClassName="z-[60]"
        />
      ),
    },
    { title: "所属模块", dataIndex: "module_name", key: "module_name", width: 200 },
    {
      title: "评审周期",
      key: "period",
      width: 220,
      render: (_, r) => <span>{`${dateOnly(r?.started_at)} - ${dateOnly(r?.ended_at)}`}</span>,
    },
    {
      title: "创建时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 200,
      render: (v: string) => <span>{formatCNDateTime(v)}</span>,
    },
    {
      title: "操作",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            aria-label="编辑"
            onClick={() => {
              setEditReview({
                id: record.id,
                name: record.name,
                description: (record as any)?.description ?? "",
                module_id: (record as any)?.module ?? record.module_id ?? null,
                assignees: Array.isArray(record.assignees) ? record.assignees : [],
                started_at: record.started_at ?? null,
                ended_at: record.ended_at ?? null,
                cases: (record as any)?.cases ?? [],
                case_count: record.case_count ?? undefined,
              });
              setEditOpen(true);
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            aria-label="删除"
            onClick={() => confirmDeleteReview(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <PageHead title="评审" />
      <div className={styles.split}>
        <div className={styles.left} style={{ width: leftWidth }}>
          <div className={styles.leftHeader}>
            <Space>
              <Input
                allowClear
                placeholder="按模块名称搜索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button type="primary" onClick={() => setCreateReviewOpen(true)}>
                新建
              </Button>
            </Space>
          </div>
          <div className={styles.treeRoot}>
            <div
              className={`${styles.row} ${selectedModuleId === null ? styles.rowSelected : ""}`}
              onClick={() => {
                setSelectedModuleId(null);
                setCurrentPage(1);
              }}
            >
              <div className={styles.rowLeft}>
                <span className={styles.icon}>
                  <FolderOutlined />
                </span>
                <span className={styles.name}>全部评审</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.count}>{totalReviews}</span>
                <span className={styles.actionIcon} onClick={() => setCreatingOpen(true)}>
                  <PlusOutlined />
                </span>
              </div>
            </div>
            {creatingOpen && (
              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <Input
                    size="small"
                    autoFocus
                    placeholder="请输入模块名称"
                    value={creatingName}
                    onChange={(e) => setCreatingName(e.target.value)}
                    onBlur={handleCreateModule}
                    onPressEnter={handleCreateModule}
                  />
                </div>
              </div>
            )}
            <div className={styles.treeList}>
              {filteredModules.map((node) => (
                <div
                  key={node.id}
                  className={`${styles.row} ${selectedModuleId === node.id ? styles.rowSelected : ""}`}
                  style={{ paddingLeft: 20 }}
                  onClick={() => {
                    setSelectedModuleId(node.id);
                    setCurrentPage(1);
                  }}
                >
                  <div className={styles.rowLeft}>
                    <span className={styles.icon}>
                      <FolderOutlined />
                    </span>
                    <span className={styles.name}>{node.name}</span>
                  </div>
                  <div className={styles.rowRight}>
                    {typeof moduleCountsMap[node.id] === "number" && (
                      <span className={styles.count}>{moduleCountsMap[node.id]}</span>
                    )}
                    {!node.is_default && (
                      <Dropdown
                        trigger={["hover"]}
                        menu={{
                          items: [
                            {
                              key: "delete",
                              label: (
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => confirmDeleteModule(node)}
                                >
                                  删除
                                </Button>
                              ),
                            },
                          ],
                        }}
                      >
                        <Button type="text" size="small" icon={<EllipsisOutlined />} className={styles.actionMenu} />
                      </Dropdown>
                    )}
                    {node.is_default && <span className={styles.menuSpace} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.resizer} onMouseDown={onMouseDownResize} />
        </div>
        <div className={styles.right}>
          <Table
            rowKey="id"
            dataSource={reviews}
            columns={columns}
            loading={loading}
            scroll={{ x: 1400 }}
            onChange={(pagination, tableFilters) => {
              const selectedStates = ((tableFilters?.state as string[]) || []).filter(Boolean);
              const selectedModes = ((tableFilters?.mode as string[]) || []).filter(Boolean);
              const nextPage = pagination.current || 1;
              const nextPageSize = pagination.pageSize || pageSize;
              const newFilters = {
                ...filters,
                state: selectedStates.length ? selectedStates : undefined,
                mode: selectedModes.length ? selectedModes : undefined,
              };
              const filtersChanged = JSON.stringify(filters) !== JSON.stringify(newFilters);
              if (nextPage !== currentPage) setCurrentPage(nextPage);
              if (nextPageSize !== pageSize) setPageSize(nextPageSize);
              if (filtersChanged) setFilters(newFilters);
            }}
            pagination={{
              current: currentPage,
              pageSize,
              total: totalForCurrent,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (t, r) => `第 ${r[0]}-${r[1]} 条，共 ${t} 条`,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
          />
        </div>
        <CreateReviewModal
          open={createReviewOpen}
          onClose={() => {
            fetchReviews(currentPage, pageSize, selectedModuleId, filters);
            setCreateReviewOpen(false);
          }}
        />
        {editOpen && (
          <CreateReviewModal
            open={editOpen}
            mode="edit"
            initialValues={editReview || undefined}
            onClose={() => {
              fetchReviews(currentPage, pageSize, selectedModuleId, filters);
              setEditOpen(false);
              setEditReview(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

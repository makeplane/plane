/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect } from "react";
import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it, vi } from "vitest";
import { setToast } from "@plane/blocks/toast";
import { FilterInstance, workItemFiltersAdapter } from "@plane/shared-state";
import type { TWorkItemFilterExpression, TWorkItemFilterProperty } from "@plane/types";
import { WORK_ITEM_FILTER_PROPERTY_KEYS } from "@plane/types";
import { AddFilterDropdown } from "@/components/rich-filters/add-filters/dropdown";
import { createTestI18n } from "@/tests/i18n";
import { useWorkItemFiltersConfig } from "./use-work-item-filters-config";

vi.mock("@/hooks/store/use-project", () => ({
  useProject: () => ({ loader: undefined, getProjectById: () => ({ cycle_view: true, module_view: true }) }),
}));
vi.mock("@/hooks/store/use-cycle", () => ({ useCycle: () => ({ getCycleById: vi.fn() }) }));
vi.mock("@/hooks/store/use-label", () => ({ useLabel: () => ({ getLabelById: vi.fn() }) }));
vi.mock("@/hooks/store/use-member", () => ({ useMember: () => ({ getUserDetails: vi.fn() }) }));
vi.mock("@/hooks/store/use-module", () => ({ useModule: () => ({ getModuleById: vi.fn() }) }));
vi.mock("@/hooks/store/use-project-state", () => ({ useProjectState: () => ({ getStateById: vi.fn() }) }));
vi.mock("@plane/blocks/toast", () => ({ setToast: vi.fn() }));

const entityProps = {
  workspaceSlug: "local-example",
  memberIds: [],
  stateIds: [],
  labelIds: [],
  cycleIds: [],
  moduleIds: [],
  projectIds: [],
  allowedFilters: Object.values(WORK_ITEM_FILTER_PROPERTY_KEYS),
};

function createFilter(initialExpression?: TWorkItemFilterExpression) {
  return new FilterInstance<TWorkItemFilterProperty, TWorkItemFilterExpression>({
    adapter: workItemFiltersAdapter,
    initialExpression,
  });
}

function FilterMenu({
  filter,
  onSelect,
  invalid = false,
}: {
  filter: ReturnType<typeof createFilter>;
  onSelect: React.ComponentProps<
    typeof AddFilterDropdown<TWorkItemFilterProperty, TWorkItemFilterExpression>
  >["handleFilterSelect"];
  invalid?: boolean;
}) {
  const { configs } = useWorkItemFiltersConfig(entityProps);
  useEffect(() => {
    filter.configManager.registerAll(
      invalid ? configs.map((config) => ({ ...config, supportedOperatorConfigsMap: new Map() })) : configs
    );
  }, [configs, filter, invalid]);
  return (
    <AddFilterDropdown
      filter={filter}
      customButton="Add filter"
      triggerAriaLabel="Add filter"
      handleFilterSelect={onSelect}
    />
  );
}

describe("work item filter localization", () => {
  it("translates every field and retains field IDs, operators and entity values when the locale changes", async () => {
    const i18n = await createTestI18n();
    const { result } = renderHook(() => useWorkItemFiltersConfig(entityProps), {
      wrapper: ({ children }) => <I18nextProvider i18n={i18n}>{children}</I18nextProvider>,
    });
    expect(Object.fromEntries(result.current.configs.map((config) => [config.id, config.label]))).toEqual({
      state_id: "状态",
      state_group: "状态组",
      assignee_id: "负责人",
      priority: "优先级",
      project_id: "项目",
      mention_id: "提及",
      label_id: "标签",
      cycle_id: "周期",
      module_id: "模块",
      start_date: "开始日期",
      target_date: "截止日期",
      created_at: "创建时间",
      updated_at: "更新时间",
      created_by_id: "创建者",
      subscriber_id: "订阅者",
    });
    const filter = createFilter({ assignee_id__in: "example-member-id" });
    filter.configManager.registerAll(result.current.configs);
    const originalExpression = JSON.stringify(filter.expression);
    const originalPayload = filter.adapter.toExternal(filter.expression);
    const properties = result.current.configs.map(({ label: _label, icon: _icon, ...rest }) => ({
      id: rest.id,
      enabled: rest.isEnabled,
      operators: [...rest.supportedOperatorConfigsMap.keys()],
    }));
    await act(() => i18n.changeLanguage("en"));
    filter.configManager.registerAll(result.current.configs);
    expect(result.current.configMap.assignee_id?.label).toBe("Assignee");
    expect(filter.configManager.getConfigByProperty("assignee_id")?.label).toBe("Assignee");
    expect(JSON.stringify(filter.expression)).toBe(originalExpression);
    expect(filter.adapter.toExternal(filter.expression)).toEqual(originalPayload);
    expect(originalPayload).toEqual({ assignee_id__in: "example-member-id" });
    expect(
      result.current.configs.map((config) => ({
        id: config.id,
        enabled: config.isEnabled,
        operators: [...config.supportedOperatorConfigsMap.keys()],
      }))
    ).toEqual(properties);
  });

  it("finds Chinese labels and selects the original property and operator", async () => {
    const user = userEvent.setup();
    const i18n = await createTestI18n();
    const onSelect = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FilterMenu filter={createFilter()} onSelect={onSelect} />
      </I18nextProvider>
    );
    await user.click(screen.getByRole("combobox", { name: "Add filter" }));
    await user.type(screen.getByPlaceholderText(/搜索|Search/), "  负责人  ");
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(1);
    await user.click(within(list).getByRole("option", { name: "负责人" }));
    expect(onSelect).toHaveBeenCalledWith("assignee_id", "in", false);
  });

  it("refreshes an open menu after switching language and distinguishes an unmatched search", async () => {
    const user = userEvent.setup();
    const i18n = await createTestI18n("en");
    render(
      <I18nextProvider i18n={i18n}>
        <FilterMenu filter={createFilter()} onSelect={vi.fn()} />
      </I18nextProvider>
    );
    await user.click(screen.getByRole("combobox", { name: "Add filter" }));
    await user.type(screen.getByPlaceholderText(/搜索|Search/), "负责人");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    await act(() => i18n.changeLanguage("zh-CN"));
    expect(await screen.findByRole("option", { name: "负责人" })).toBeTruthy();
    await user.clear(screen.getByPlaceholderText(/搜索|Search/));
    await user.type(screen.getByPlaceholderText(/搜索|Search/), "不存在的字段");
    expect(screen.getByText(i18n.t("common.search.no_matching_results"))).toBeTruthy();
    expect(screen.queryByText("已添加所有筛选条件")).toBeNull();
  });

  it("localizes the no-remaining-filters state", async () => {
    const user = userEvent.setup();
    const i18n = await createTestI18n();
    render(
      <I18nextProvider i18n={i18n}>
        <AddFilterDropdown
          filter={createFilter()}
          customButton="Add filter"
          triggerAriaLabel="Add filter"
          handleFilterSelect={vi.fn()}
        />
      </I18nextProvider>
    );
    await user.click(screen.getByRole("combobox", { name: "Add filter" }));
    expect(screen.getByRole("status").textContent).toContain("已添加所有筛选条件");
  });

  it("localizes the configuration error without submitting a broken filter", async () => {
    const user = userEvent.setup();
    const i18n = await createTestI18n();
    const onSelect = vi.fn();
    render(
      <I18nextProvider i18n={i18n}>
        <FilterMenu filter={createFilter()} onSelect={onSelect} invalid />
      </I18nextProvider>
    );
    await user.click(screen.getByRole("combobox", { name: "Add filter" }));
    await user.click(screen.getByRole("option", { name: "负责人" }));
    await waitFor(() =>
      expect(setToast).toHaveBeenCalledWith({
        type: "error",
        title: "筛选配置错误",
        message: "此筛选条件配置有误，无法应用。",
      })
    );
    expect(onSelect).not.toHaveBeenCalled();
  });
});

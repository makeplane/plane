# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Internal addition (not part of upstream makeplane/plane): the standard set of
# project custom fields every project should carry, mirroring columns A-W of the
# source contract/delivery tracking spreadsheet this feature replaces. Single
# source of truth for two callers: apps/api/plane/app/views/project/base.py
# (bootstraps these for every newly created project) and
# apps/api/plane/db/management/commands/seed_default_project_custom_fields.py
# (backfills them for projects that already existed before this feature shipped),
# plus a third since Phase 3:
# apps/api/plane/db/management/commands/import_historical_project_data.py (matches
# a source spreadsheet's header row against these entries before importing data).
#
# Field shape: {"name": str, "field_type": one of ProjectCustomFieldType.values,
# "group_name": str, "is_unique_key": bool (omitted = False), "options": list[str]
# (dropdown fields only, in display order), "source_header": str (omitted = name;
# only set when the source spreadsheet's literal column header text differs from
# this field's display name, e.g. a "（%）" unit hint added for the Plane UI),
# "is_percent": bool (omitted = False; number fields only -- whether Phase 3's
# import command may apply Excel's percent-format-implies-multiply-by-100
# conversion to this field's cells)}.
#
# "合同号&项目号" (the first entry) is the one field with is_unique_key=True: per
# the source spreadsheet it identifies a project uniquely, so its value must not
# repeat across projects in the same workspace. See
# ProjectCustomFieldValueSerializer.validate() for the enforcement.

# Django imports
from django.db.models import Max

# Module imports
from plane.db.models import ProjectCustomField, ProjectCustomFieldOption

DEFAULT_PROJECT_CUSTOM_FIELDS = [
    {
        "name": "合同号&项目号",
        "field_type": "text",
        "group_name": "项目&合同基本信息",
        "is_unique_key": True,
    },
    {"name": "区域", "field_type": "text", "group_name": "项目&合同基本信息"},
    {"name": "省份", "field_type": "text", "group_name": "项目&合同基本信息"},
    {"name": "行业", "field_type": "text", "group_name": "项目&合同基本信息"},
    {"name": "分支", "field_type": "text", "group_name": "项目&合同基本信息"},
    {"name": "合同号", "field_type": "text", "group_name": "项目&合同基本信息"},
    {"name": "签约登记日期", "field_type": "date", "group_name": "项目&合同基本信息"},
    {
        "name": "合同净额/不含第三方（人民币万元）",
        "field_type": "number",
        "group_name": "项目&合同基本信息",
    },
    # source_header: the source spreadsheet's actual column D header text is "税率"
    # (no unit suffix); "（%）" was added only to this field's display name for
    # clarity in the Plane UI. Phase 3's import command (import_historical_project_data)
    # matches the header row against source_header when present, falling back to name
    # otherwise -- see historical_project_import.validate_headers().
    # is_percent: these are the only two "number" fields import_historical_project_data
    # is allowed to apply Excel's percent-format-implies-multiply-by-100 conversion to
    # (see historical_project_import.coerce_number()). Without this explicit flag, a
    # source cell that's accidentally percent-formatted in a field like "合同净额"
    # (a money amount, never intended as a percentage) would otherwise get silently
    # multiplied by 100 with no way to tell it apart from a legitimate percent field.
    {
        "name": "税率（%）",
        "field_type": "number",
        "group_name": "项目&合同基本信息",
        "source_header": "税率",
        "is_percent": True,
    },
    {
        "name": "合同占比（%）",
        "field_type": "number",
        "group_name": "项目&合同基本信息",
        "source_header": "合同占比",
        "is_percent": True,
    },
    {"name": "客户项目名称", "field_type": "text", "group_name": "项目&合同基本信息"},
    {"name": "项目序号", "field_type": "text", "group_name": "项目&合同基本信息"},
    {"name": "公司项目名称", "field_type": "text", "group_name": "项目&合同基本信息"},
    {
        "name": "项目类别",
        "field_type": "dropdown",
        "group_name": "项目基本类别",
        "options": ["A", "B", "C", "D"],
    },
    {
        "name": "客户域",
        "field_type": "dropdown",
        "group_name": "项目基本类别",
        # "云网域" added for the same reason as 公司产品名称/验收阶段 above: a second
        # real-data dry-run round found 39 occurrences, missing from the seed list
        # ("云网" without the "域" suffix is what got seeded originally but doesn't
        # actually appear in the real data; kept rather than replaced since removing
        # a seeded option is a bigger, less reversible change than adding one).
        "options": ["支撑", "云网", "云网域", "政企"],
    },
    {
        "name": "业务域",
        "field_type": "dropdown",
        "group_name": "项目基本类别",
        "options": ["政企支撑域", "政企使用面", "AI域", "云网域", "IBD-PaaS", "个客/家客"],
    },
    {
        "name": "生产方式类别",
        "field_type": "dropdown",
        "group_name": "项目基本类别",
        "options": ["Z", "X", "P", "D", "Y"],
    },
    {
        "name": "公司产品名称",
        "field_type": "dropdown",
        "group_name": "项目基本类别",
        # The original 2 options came from the source spreadsheet's example row
        # only, not an exhaustive list. Phase 3's real-data dry-run against
        # project_summary.xlsx surfaced these 5 as genuinely recurring (37
        # occurrences combined, not one-off noise) categories missing from the
        # seed list.
        "options": ["账务处理中心", "账务管理中心", "PaaS", "容器管理平台", "云管平台", "监控平台", "PB"],
    },
    {"name": "核心产品线", "field_type": "text", "group_name": "项目基本类别"},
    {
        "name": "生产状态",
        "field_type": "dropdown",
        "group_name": "项目状态",
        "options": [f"P{i}" for i in range(19)],
    },
    {
        "name": "验收阶段",
        "field_type": "dropdown",
        "group_name": "项目状态",
        # "开发"/"运营" added for the same reason as 公司产品名称 above: real-data
        # dry-run found 18 occurrences combined, missing from the original
        # example-row-derived list. Placed at the two ends of the delivery
        # sequence the other 7 options already progress through (开发 before
        # 签约, 运营 as ongoing support after 合同内维护 ends) -- this is a
        # display-order convenience only, not an enforced state machine.
        "options": ["开发", "未验收", "签约", "到货", "上线", "初验", "终验", "合同内维护", "运营"],
    },
    {
        "name": "成本投入状态",
        "field_type": "dropdown",
        "group_name": "项目状态",
        "options": [
            "执行（正在投入成本）",
            "管理（不再投入成本，只剩验收）",
            "暂停（暂时不投入成本、不验收）",
        ],
    },
    {
        "name": "能否验收状态",
        "field_type": "dropdown",
        "group_name": "项目状态",
        "options": [
            "已知项目（可验收，已签约已交接）",
            "拓展项目（不可验收，未签约先交接）",
            "拓展项目（不可验收，未签约未交接）",
        ],
    },
]


def seed_default_custom_fields(project, created_by=None):
    """
    Creates whichever of DEFAULT_PROJECT_CUSTOM_FIELDS this project doesn't already
    have (matched by name), plus their dropdown options. Safe to call on a project
    that already has some or all of them. Shared by ProjectViewSet.create() (new
    projects) and seed_default_project_custom_fields (backfilling existing ones) so
    the two never drift apart on sort_order math or field construction.

    Returns (fields_created, options_created).
    """
    existing_names = set(ProjectCustomField.objects.filter(project=project).values_list("name", flat=True))
    missing = [spec for spec in DEFAULT_PROJECT_CUSTOM_FIELDS if spec["name"] not in existing_names]
    if not missing:
        return 0, 0

    last_sort_order = (
        ProjectCustomField.objects.filter(project=project).aggregate(largest=Max("sort_order"))["largest"] or 0
    )
    created_fields = ProjectCustomField.objects.bulk_create(
        [
            ProjectCustomField(
                project=project,
                workspace_id=project.workspace_id,
                name=spec["name"],
                field_type=spec["field_type"],
                group_name=spec["group_name"],
                is_unique_key=spec.get("is_unique_key", False),
                sort_order=last_sort_order + (index + 1) * 10000,
                external_source="internal_default_seed",
                created_by=created_by,
            )
            for index, spec in enumerate(missing)
        ]
    )

    fields_by_name = {field.name: field for field in created_fields}
    option_rows = [
        ProjectCustomFieldOption(
            project=project,
            workspace_id=project.workspace_id,
            custom_field=fields_by_name[spec["name"]],
            name=option_name,
            sort_order=option_index * 10000,
            created_by=created_by,
        )
        for spec in missing
        for option_index, option_name in enumerate(spec.get("options", []))
    ]
    if option_rows:
        ProjectCustomFieldOption.objects.bulk_create(option_rows)

    return len(created_fields), len(option_rows)

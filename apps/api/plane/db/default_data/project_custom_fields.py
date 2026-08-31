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
# (backfills them for projects that already existed before this feature shipped).
#
# Field shape: {"name": str, "field_type": one of ProjectCustomFieldType.values,
# "group_name": str, "is_unique_key": bool (omitted = False), "options": list[str]
# (dropdown fields only, in display order)}.
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
    {"name": "税率（%）", "field_type": "number", "group_name": "项目&合同基本信息"},
    {"name": "合同占比（%）", "field_type": "number", "group_name": "项目&合同基本信息"},
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
        "options": ["支撑", "云网", "政企"],
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
        "options": ["账务处理中心", "账务管理中心"],
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
        "options": ["未验收", "签约", "到货", "上线", "初验", "终验", "合同内维护"],
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

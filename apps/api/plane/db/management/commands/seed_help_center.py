# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Seed starter content for the instance-global Help Center.

The guide is instance-wide (no workspace scope), so this runs ONCE per instance —
NOT per workspace and NOT from a migration. It is idempotent: categories and
articles are keyed by their stable global slug, and every locale row is
get_or_create'd, so re-running never duplicates or overwrites authored content.

All copy says "Shinhan Workspace" (the one unified platform), never "Plane".
Content is greenfield starter scaffolding — real articles are authored in God Mode.

    python manage.py seed_help_center
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from plane.db.models import HelpArticle, HelpCategory

# Stable slugs + per-locale (vi/en/ko) copy. Keep bodies simple, clean HTML
# (no script/style) — seed content is trusted and bypasses the God Mode sanitizer.
SEED = [
    {
        "slug": "bat-dau",
        "icon": "rocket",
        "color": "#174EFD",
        "names": {"vi": "Bắt đầu", "en": "Getting Started", "ko": "시작하기"},
        "article": {
            "slug": "lam-quen-shinhan-workspace",
            "titles": {
                "vi": "Làm quen với Shinhan Workspace",
                "en": "Get to know Shinhan Workspace",
                "ko": "Shinhan Workspace 알아보기",
            },
            "bodies": {
                "vi": "<p>Shinhan Workspace là nền tảng làm việc nội bộ. Hãy bắt đầu bằng cách "
                "mở một dự án và tạo công việc đầu tiên của bạn.</p>",
                "en": "<p>Shinhan Workspace is the internal work platform. Start by opening a "
                "project and creating your first work item.</p>",
                "ko": "<p>Shinhan Workspace는 내부 업무 플랫폼입니다. 프로젝트를 열고 첫 작업을 "
                "만들어 시작하세요.</p>",
            },
        },
    },
    {
        "slug": "du-an-cong-viec",
        "icon": "folder-kanban",
        "color": "#174EFD",
        "names": {"vi": "Dự án & Công việc", "en": "Projects & Work Items", "ko": "프로젝트 및 작업"},
        "article": {
            "slug": "tao-va-quan-ly-cong-viec",
            "titles": {
                "vi": "Tạo và quản lý công việc",
                "en": "Create and manage work items",
                "ko": "작업 생성 및 관리",
            },
            "bodies": {
                "vi": "<p>Trong Shinhan Workspace, công việc được tổ chức theo dự án. Bạn có thể "
                "gán người phụ trách, đặt trạng thái và theo dõi tiến độ.</p>",
                "en": "<p>In Shinhan Workspace, work items live inside projects. Assign owners, "
                "set states and track progress.</p>",
                "ko": "<p>Shinhan Workspace에서 작업은 프로젝트 안에 있습니다. 담당자를 지정하고 "
                "상태를 설정하며 진행 상황을 추적하세요.</p>",
            },
        },
    },
    {
        "slug": "cycles-modules",
        "icon": "refresh-cw",
        "color": "#174EFD",
        "names": {"vi": "Cycles & Modules", "en": "Cycles & Modules", "ko": "사이클 및 모듈"},
        "article": {
            "slug": "lap-ke-hoach-voi-cycles",
            "titles": {
                "vi": "Lập kế hoạch với Cycles và Modules",
                "en": "Plan with Cycles and Modules",
                "ko": "사이클과 모듈로 계획하기",
            },
            "bodies": {
                "vi": "<p>Cycles giúp bạn lập kế hoạch theo từng giai đoạn; Modules nhóm các công "
                "việc liên quan trong Shinhan Workspace.</p>",
                "en": "<p>Cycles help you plan in time-boxed iterations; Modules group related "
                "work items in Shinhan Workspace.</p>",
                "ko": "<p>사이클은 기간별 계획을, 모듈은 관련 작업 묶음을 Shinhan Workspace에서 "
                "관리하도록 돕습니다.</p>",
            },
        },
    },
    {
        "slug": "trang-tai-lieu",
        "icon": "file-text",
        "color": "#174EFD",
        "names": {"vi": "Trang & Tài liệu", "en": "Pages & Docs", "ko": "페이지 및 문서"},
        "article": {
            "slug": "viet-tai-lieu-tren-trang",
            "titles": {
                "vi": "Viết tài liệu trên Trang",
                "en": "Write docs on Pages",
                "ko": "페이지에 문서 작성하기",
            },
            "bodies": {
                "vi": "<p>Trang trong Shinhan Workspace là nơi ghi chú, biên bản họp và tài liệu "
                "nhóm với trình soạn thảo dạng văn bản phong phú.</p>",
                "en": "<p>Pages in Shinhan Workspace hold notes, meeting minutes and team docs "
                "using a rich-text editor.</p>",
                "ko": "<p>Shinhan Workspace의 페이지는 리치 텍스트 편집기로 메모, 회의록, 팀 "
                "문서를 작성하는 공간입니다.</p>",
            },
        },
    },
    {
        "slug": "cai-dat",
        "icon": "settings",
        "color": "#174EFD",
        "names": {"vi": "Cài đặt", "en": "Settings", "ko": "설정"},
        "article": {
            "slug": "quan-ly-cai-dat-workspace",
            "titles": {
                "vi": "Quản lý cài đặt workspace",
                "en": "Manage workspace settings",
                "ko": "워크스페이스 설정 관리",
            },
            "bodies": {
                "vi": "<p>Quản trị viên có thể cấu hình thành viên, quyền và tùy chọn của "
                "Shinhan Workspace trong phần Cài đặt.</p>",
                "en": "<p>Admins configure members, permissions and preferences for "
                "Shinhan Workspace under Settings.</p>",
                "ko": "<p>관리자는 설정에서 Shinhan Workspace의 멤버, 권한, 환경설정을 "
                "구성할 수 있습니다.</p>",
            },
        },
    },
]


class Command(BaseCommand):
    help = "Seed starter content for the instance-global Help Center (idempotent, all 3 locales)."

    @transaction.atomic
    def handle(self, *args, **options):
        cats_created = arts_created = 0
        for entry in SEED:
            category, made = HelpCategory.objects.get_or_create(
                slug=entry["slug"],
                defaults={"icon": entry["icon"], "color": entry["color"], "is_active": True},
            )
            cats_created += int(made)
            for locale, name in entry["names"].items():
                category.translations.get_or_create(locale=locale, defaults={"name": name})

            spec = entry["article"]
            article, made = HelpArticle.objects.get_or_create(
                slug=spec["slug"], defaults={"category": category, "status": "published"}
            )
            arts_created += int(made)
            for locale in ("vi", "en", "ko"):
                article.translations.get_or_create(
                    locale=locale,
                    defaults={
                        "title": spec["titles"][locale],
                        "description_html": spec["bodies"][locale],
                    },
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Help Center seeded: +{cats_created} categories, +{arts_created} articles "
                f"(existing rows left untouched)."
            )
        )

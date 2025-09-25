# Python imports
import pytz
from typing import Optional, Any

# Django imports
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

# Module imports
from .base import BaseModel
from plane.utils.constants import RESTRICTED_WORKSPACE_SLUGS
from plane.utils.color import get_random_color

ROLE_CHOICES = ((20, "Admin"), (15, "Member"), (5, "Guest"))


def get_default_props():
    return {
        "filters": {
            "priority": None,
            "state": None,
            "state_group": None,
            "assignees": None,
            "created_by": None,
            "labels": None,
            "start_date": None,
            "target_date": None,
            "subscriber": None,
        },
        "display_filters": {
            "group_by": None,
            "order_by": "-created_at",
            "type": None,
            "sub_issue": True,
            "show_empty_groups": True,
            "layout": "list",
            "calendar_date_range": "",
        },
        "display_properties": {
            "assignee": True,
            "attachment_count": True,
            "created_on": True,
            "due_date": True,
            "estimate": True,
            "key": True,
            "labels": True,
            "link": True,
            "priority": True,
            "start_date": True,
            "state": True,
            "sub_issue_count": True,
            "updated_on": True,
        },
    }


def get_default_filters():
    return {
        "priority": None,
        "state": None,
        "state_group": None,
        "assignees": None,
        "created_by": None,
        "labels": None,
        "start_date": None,
        "target_date": None,
        "subscriber": None,
    }


def get_default_display_filters():
    return {
        "display_filters": {
            "group_by": None,
            "order_by": "-created_at",
            "type": None,
            "sub_issue": True,
            "show_empty_groups": True,
            "layout": "list",
            "calendar_date_range": "",
        }
    }


def get_default_display_properties():
    return {
        "display_properties": {
            "assignee": True,
            "attachment_count": True,
            "created_on": True,
            "due_date": True,
            "estimate": True,
            "key": True,
            "labels": True,
            "link": True,
            "priority": True,
            "start_date": True,
            "state": True,
            "sub_issue_count": True,
            "updated_on": True,
        }
    }


def get_issue_props():
    return {"subscribed": True, "assigned": True, "created": True, "all_issues": True}


def slug_validator(value):
    if value in RESTRICTED_WORKSPACE_SLUGS:
        raise ValidationError("Slug is not valid")


class Workspace(BaseModel):
    """
    工作空间模型，项目的顶层容器。
    """
    TIMEZONE_CHOICES = tuple(zip(pytz.common_timezones, pytz.common_timezones))

    name = models.CharField(max_length=80, verbose_name="Workspace Name", help_text="工作空间名称")
    logo = models.TextField(verbose_name="Logo", blank=True, null=True, help_text="工作空间 Logo 的 URL 或 Base64 数据")
    logo_asset = models.ForeignKey(
        "db.FileAsset",
        on_delete=models.SET_NULL,
        related_name="workspace_logo",
        blank=True,
        null=True,
        help_text="关联到文件资源模型的 Logo",
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_workspace",
        help_text="工作空间的所有者",
    )
    slug = models.SlugField(
        max_length=48, db_index=True, unique=True, validators=[slug_validator], help_text="用于 URL 的唯一标识符"
    )
    organization_size = models.CharField(max_length=20, blank=True, null=True, help_text="组织规模")
    timezone = models.CharField(max_length=255, default="UTC", choices=TIMEZONE_CHOICES, help_text="工作空间所在时区")
    background_color = models.CharField(max_length=255, default=get_random_color, help_text="背景颜色")

    def __str__(self):
        """Return name of the Workspace"""
        return self.name

    @property
    def logo_url(self):
        # Return the logo asset url if it exists
        if self.logo_asset:
            return self.logo_asset.asset_url

        # Return the logo url if it exists
        if self.logo:
            return self.logo
        return None

    def delete(
        self, using: Optional[str] = None, soft: bool = True, *args: Any, **kwargs: Any
    ):
        """
        重写 delete 方法，在软删除时为 slug 附加时间戳以保持唯一性。

        Args:
            using: 用于删除的数据库别名。
            soft: 是否执行软删除 (True) 或硬删除 (False)。
            *args: 额外的 positional arguments。
            **kwargs: 额外的 keyword arguments。
        """
        # 首先调用父类的 delete 方法
        result = super().delete(using=using, soft=soft, *args, **kwargs)

        # 如果是软删除且模型仍然存在 (未被硬删除)
        if soft and hasattr(self, "deleted_at") and self.deleted_at:
            # 使用 deleted_at 时间戳来更新 slug
            deletion_timestamp: int = int(self.deleted_at.timestamp())
            self.slug = f"{self.slug}__{deletion_timestamp}"
            self.save(update_fields=["slug"])

        return result

    class Meta:
        verbose_name = "Workspace"
        verbose_name_plural = "Workspaces"
        db_table = "workspaces"
        ordering = ("-created_at",)


class WorkspaceBaseModel(BaseModel):
    """
    一个抽象基类模型，为其他模型提供 'workspace' 和 'project' 字段。
    """
    workspace = models.ForeignKey(
        "db.Workspace", models.CASCADE, related_name="workspace_%(class)s", help_text="关联的工作空间"
    )
    project = models.ForeignKey(
        "db.Project", models.CASCADE, related_name="project_%(class)s", null=True, help_text="关联的项目"
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """
        重写 save 方法，如果设置了 project，则自动关联到其 workspace。
        """
        if self.project:
            self.workspace = self.project.workspace
        super(WorkspaceBaseModel, self).save(*args, **kwargs)


class WorkspaceMember(BaseModel):
    """
    将用户和工作空间关联起来的模型，定义了用户在工作空间中的角色和属性。
    """
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="workspace_member", help_text="关联的工作空间"
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="member_workspace",
        help_text="关联的用户成员",
    )
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=5, help_text="用户角色 (20: Admin, 15: Member, 5: Guest)")
    company_role = models.TextField(null=True, blank=True, help_text="成员在公司中的职位")
    view_props = models.JSONField(default=get_default_props, help_text="视图相关的属性配置")
    default_props = models.JSONField(default=get_default_props, help_text="默认的属性配置")
    issue_props = models.JSONField(default=get_issue_props, help_text="Issue 相关的属性配置")
    is_active = models.BooleanField(default=True, help_text="成员是否在工作空间中活跃")

    class Meta:
        unique_together = ["workspace", "member", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "member"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_member_unique_workspace_member_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Member"
        verbose_name_plural = "Workspace Members"
        db_table = "workspace_members"
        ordering = ("-created_at",)

    def __str__(self):
        """返回工作空间的成员"""
        return f"{self.member.email} <{self.workspace.name}>"


class WorkspaceMemberInvite(BaseModel):
    """
    存储发送给用户的待处理工作空间邀请。
    """
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="workspace_member_invite", help_text="邀请关联的工作空间"
    )
    email = models.CharField(max_length=255, help_text="被邀请者的邮箱")
    accepted = models.BooleanField(default=False, help_text="邀请是否被接受")
    token = models.CharField(max_length=255, help_text="用于验证邀请的唯一令牌")
    message = models.TextField(null=True, help_text="邀请信息")
    responded_at = models.DateTimeField(null=True, help_text="邀请被回应的时间")
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICES, default=5, help_text="被邀请者接受邀请后将拥有的角色")

    class Meta:
        unique_together = ["email", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["email", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_member_invite_unique_email_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Member Invite"
        verbose_name_plural = "Workspace Member Invites"
        db_table = "workspace_member_invites"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.email} {self.accepted}"


class Team(BaseModel):
    """
    工作空间内的团队模型。
    """
    name = models.CharField(max_length=255, verbose_name="Team Name", help_text="团队名称")
    description = models.TextField(verbose_name="Team Description", blank=True, help_text="团队描述")
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="workspace_team", help_text="团队所属的工作空间"
    )
    logo_props = models.JSONField(default=dict, help_text="团队 Logo 的属性")

    def __str__(self):
        """返回团队的名称"""
        return f"{self.name} <{self.workspace.name}>"

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="team_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Team"
        verbose_name_plural = "Teams"
        db_table = "teams"
        ordering = ("-created_at",)


class WorkspaceTheme(BaseModel):
    """
    工作空间的主题设置。
    """
    workspace = models.ForeignKey(
        "db.Workspace", on_delete=models.CASCADE, related_name="themes", help_text="主题所属的工作空间"
    )
    name = models.CharField(max_length=300, help_text="主题名称")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="themes", help_text="创建主题的用户"
    )
    colors = models.JSONField(default=dict, help_text="主题颜色配置")

    def __str__(self):
        return str(self.name) + str(self.actor.email)

    class Meta:
        unique_together = ["workspace", "name", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "name"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_theme_unique_workspace_name_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Theme"
        verbose_name_plural = "Workspace Themes"
        db_table = "workspace_themes"
        ordering = ("-created_at",)


class WorkspaceUserProperties(BaseModel):
    """
    存储用户在特定工作空间中的个性化属性，如过滤器和显示设置。
    """
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_user_properties",
        help_text="关联的工作空间",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_user_properties",
        help_text="关联的用户",
    )
    filters = models.JSONField(default=get_default_filters, help_text="用户的过滤器设置")
    display_filters = models.JSONField(default=get_default_display_filters, help_text="用户的显示过滤器设置")
    display_properties = models.JSONField(default=get_default_display_properties, help_text="用户的显示属性设置")
    rich_filters = models.JSONField(default=dict, help_text="用户的富文本过滤器设置")

    class Meta:
        unique_together = ["workspace", "user", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_user_properties_unique_workspace_user_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace User Property"
        verbose_name_plural = "Workspace User Property"
        db_table = "workspace_user_properties"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.user.email}"


class WorkspaceUserLink(WorkspaceBaseModel):
    """
    用户在工作空间中保存的链接。
    """
    title = models.CharField(max_length=255, null=True, blank=True, help_text="链接标题")
    url = models.TextField(help_text="链接 URL")
    metadata = models.JSONField(default=dict, help_text="链接的元数据")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owner_workspace_user_link",
        help_text="创建链接的所有者",
    )

    class Meta:
        verbose_name = "Workspace User Link"
        verbose_name_plural = "Workspace User Links"
        db_table = "workspace_user_links"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.id} {self.url}"


class WorkspaceHomePreference(BaseModel):
    """用户对工作空间主页的偏好设置"""

    class HomeWidgetKeys(models.TextChoices):
        """主页小组件的 Key 定义"""
        QUICK_LINKS = "quick_links", "Quick Links"
        RECENTS = "recents", "Recents"
        MY_STICKIES = "my_stickies", "My Stickies"
        NEW_AT_PLANE = "new_at_plane", "New at Plane"
        QUICK_TUTORIAL = "quick_tutorial", "Quick Tutorial"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_user_home_preferences",
        help_text="关联的工作空间",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_user_home_preferences",
        help_text="关联的用户",
    )
    key = models.CharField(max_length=255, help_text="偏好设置的 Key")
    is_enabled = models.BooleanField(default=True, help_text="是否启用该偏好")
    config = models.JSONField(default=dict, help_text="偏好设置的具体配置")
    sort_order = models.FloatField(default=65535, help_text="排序顺序")

    class Meta:
        unique_together = ["workspace", "user", "key", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "key"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_user_home_preferences_unique_workspace_user_key_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Home Preference"
        verbose_name_plural = "Workspace Home Preferences"
        db_table = "workspace_home_preferences"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.workspace.name} {self.user.email} {self.key}"


class WorkspaceUserPreference(BaseModel):
    """用户在工作空间中的偏好设置，主要用于侧边栏等。"""

    class UserPreferenceKeys(models.TextChoices):
        """用户偏好设置的 Key 定义"""
        VIEWS = "views", "Views"
        ACTIVE_CYCLES = "active_cycles", "Active Cycles"
        ANALYTICS = "analytics", "Analytics"
        DRAFTS = "drafts", "Drafts"
        YOUR_WORK = "your_work", "Your Work"
        ARCHIVES = "archives", "Archives"

    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_user_preferences",
        help_text="关联的工作空间",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_user_preferences",
        help_text="关联的用户",
    )
    key = models.CharField(max_length=255, help_text="偏好设置的 Key")
    is_pinned = models.BooleanField(default=False, help_text="是否固定该偏好项")
    sort_order = models.FloatField(default=65535, help_text="排序顺序")

    class Meta:
        unique_together = ["workspace", "user", "key", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["workspace", "user", "key"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_user_preferences_unique_workspace_user_key_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace User Preference"
        verbose_name_plural = "Workspace User Preferences"
        db_table = "workspace_user_preferences"
        ordering = ("-created_at",)

# -*- coding: utf-8 -*-
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Workspace, WorkspaceMember, WorkspaceMemberInvite, Team, TeamMember, WorkspaceTheme, Project, ProjectMemberInvite, ProjectMember, ProjectIdentifier, ProjectFavorite, ProjectDeployBoard, ProjectPublicMember, Issue, IssueBlocker, IssueAssignee, IssueLink, IssueAttachment, IssueActivity, IssueComment, IssueProperty, Label, IssueLabel, IssueSequence, IssueSubscriber, IssueReaction, CommentReaction, IssueVote, FileAsset, SocialLoginConnection, State, Cycle, CycleIssue, CycleFavorite, IssueView, IssueViewFavorite, Module, ModuleMember, ModuleIssue, ModuleLink, ModuleFavorite, APIToken, Integration, WorkspaceIntegration, GithubRepository, GithubRepositorySync, GithubIssueSync, GithubCommentSync, SlackProjectSync, Importer, Page, PageBlock, PageFavorite, PageLabel, Estimate, EstimatePoint, Inbox, InboxIssue, AnalyticView, Notification, ExporterHistory


@admin.register(User)
class UserAdmin(UserAdmin):
    list_display = (
        'username',
        'mobile_number',
        'email',
        'first_name',
        'last_name',
         'last_login',
        'avatar',
        'cover_image',
        'date_joined',
        'created_at',
        'updated_at',
        'last_location',
        'created_location',
        'is_superuser',
        'is_managed',
        'is_password_expired',
        'is_active',
        'is_staff',
        'is_email_verified',
        'is_password_autoset',
        'is_onboarded',
        'token',
        'billing_address_country',
        'billing_address',
        'has_billing_address',
        'user_timezone',
        'last_active',
        'last_login_time',
        'last_logout_time',
        'last_login_ip',
        'last_logout_ip',
        'last_login_medium',
        'last_login_uagent',
        'token_updated_at',
        'last_workspace_id',
        'my_issues_prop',
        'role',
        'is_bot',
        'theme',
        'display_name',
        'is_tour_completed',
        'onboarding_step',
    )
    list_filter = (
        'last_login',
        'date_joined',
        'created_at',
        'updated_at',
        'is_superuser',
        'is_managed',
        'is_password_expired',
        'is_active',
        'is_staff',
        'is_email_verified',
        'is_password_autoset',
        'is_onboarded',
        'has_billing_address',
        'last_active',
        'last_login_time',
        'last_logout_time',
        'token_updated_at',
        'is_bot',
        'is_tour_completed',
    )
    raw_id_fields = ('groups', 'user_permissions')
    date_hierarchy = 'created_at'


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'name',
        'logo',
        'owner',
        'slug',
        'organization_size',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'owner',
    )
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ['name']}
    date_hierarchy = 'created_at'


@admin.register(WorkspaceMember)
class WorkspaceMemberAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'member',
        'role',
        'company_role',
        'view_props',
        'default_props',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'member',
    )
    date_hierarchy = 'created_at'


@admin.register(WorkspaceMemberInvite)
class WorkspaceMemberInviteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'email',
        'accepted',
        'token',
        'message',
        'responded_at',
        'role',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'accepted',
        'responded_at',
    )
    date_hierarchy = 'created_at'


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'name',
        'description',
        'workspace',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
    )
    raw_id_fields = ('members',)
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'team',
        'member',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'team',
        'member',
    )
    date_hierarchy = 'created_at'


@admin.register(WorkspaceTheme)
class WorkspaceThemeAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'name',
        'actor',
        'colors',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'actor',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'name',
        'description',
        'description_text',
        'description_html',
        'network',
        'workspace',
        'identifier',
        'default_assignee',
        'project_lead',
        'emoji',
        'icon_prop',
        'module_view',
        'cycle_view',
        'issue_views_view',
        'page_view',
        'inbox_view',
        'cover_image',
        'estimate',
        'archive_in',
        'close_in',
        'default_state',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'default_assignee',
        'project_lead',
        'module_view',
        'cycle_view',
        'issue_views_view',
        'page_view',
        'inbox_view',
        'estimate',
        'default_state',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(ProjectMemberInvite)
class ProjectMemberInviteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'email',
        'accepted',
        'token',
        'message',
        'responded_at',
        'role',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'accepted',
        'responded_at',
    )
    date_hierarchy = 'created_at'


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'member',
        'comment',
        'role',
        'view_props',
        'default_props',
        'preferences',
        'sort_order',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'member',
    )
    date_hierarchy = 'created_at'


@admin.register(ProjectIdentifier)
class ProjectIdentifierAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'project',
        'name',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'project',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(ProjectFavorite)
class ProjectFavoriteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'user',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'user',
    )
    date_hierarchy = 'created_at'


@admin.register(ProjectDeployBoard)
class ProjectDeployBoardAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'anchor',
        'comments',
        'reactions',
        'inbox',
        'votes',
        'views',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'comments',
        'reactions',
        'inbox',
        'votes',
    )
    date_hierarchy = 'created_at'


@admin.register(ProjectPublicMember)
class ProjectPublicMemberAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'member',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'member',
    )
    date_hierarchy = 'created_at'


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'parent',
        'state',
        'estimate_point',
        'name',
        'description',
        'description_html',
        'description_stripped',
        'priority',
        'start_date',
        'target_date',
        'sequence_id',
        'sort_order',
        'completed_at',
        'archived_at',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'parent',
        'state',
        'start_date',
        'target_date',
        'completed_at',
        'archived_at',
    )
    raw_id_fields = ('assignees', 'labels')
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(IssueBlocker)
class IssueBlockerAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'block',
        'blocked_by',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'block',
        'blocked_by',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueAssignee)
class IssueAssigneeAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'issue',
        'assignee',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'assignee',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueLink)
class IssueLinkAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'title',
        'url',
        'issue',
        'metadata',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueAttachment)
class IssueAttachmentAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'attributes',
        'asset',
        'issue',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueActivity)
class IssueActivityAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'issue',
        'verb',
        'field',
        'old_value',
        'new_value',
        'comment',
        'attachments',
        'issue_comment',
        'actor',
        'old_identifier',
        'new_identifier',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'issue_comment',
        'actor',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueComment)
class IssueCommentAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'comment_stripped',
        'comment_json',
        'comment_html',
        'attachments',
        'issue',
        'actor',
        'access',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'actor',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueProperty)
class IssuePropertyAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'user',
        'properties',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'user',
    )
    date_hierarchy = 'created_at'


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'parent',
        'name',
        'description',
        'color',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'parent',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(IssueLabel)
class IssueLabelAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'issue',
        'label',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'label',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueSequence)
class IssueSequenceAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'issue',
        'sequence',
        'deleted',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'deleted',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueSubscriber)
class IssueSubscriberAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'issue',
        'subscriber',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'subscriber',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueReaction)
class IssueReactionAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'actor',
        'issue',
        'reaction',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'actor',
        'issue',
    )
    date_hierarchy = 'created_at'


@admin.register(CommentReaction)
class CommentReactionAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'actor',
        'comment',
        'reaction',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'actor',
        'comment',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueVote)
class IssueVoteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'issue',
        'actor',
        'vote',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'actor',
    )
    date_hierarchy = 'created_at'


@admin.register(FileAsset)
class FileAssetAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'attributes',
        'asset',
        'workspace',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
    )
    date_hierarchy = 'created_at'


@admin.register(SocialLoginConnection)
class SocialLoginConnectionAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'medium',
        'last_login_at',
        'last_received_at',
        'user',
        'token_data',
        'extra_data',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'last_login_at',
        'last_received_at',
        'user',
    )
    date_hierarchy = 'created_at'


@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'description',
        'color',
        'slug',
        'sequence',
        'group',
        'default',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'default',
    )
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ['name']}
    date_hierarchy = 'created_at'


@admin.register(Cycle)
class CycleAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'description',
        'start_date',
        'end_date',
        'owned_by',
        'view_props',
        'sort_order',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'start_date',
        'end_date',
        'owned_by',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(CycleIssue)
class CycleIssueAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'issue',
        'cycle',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'cycle',
    )
    date_hierarchy = 'created_at'


@admin.register(CycleFavorite)
class CycleFavoriteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'user',
        'cycle',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'user',
        'cycle',
    )
    date_hierarchy = 'created_at'


@admin.register(IssueView)
class IssueViewAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'description',
        'query',
        'access',
        'query_data',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(IssueViewFavorite)
class IssueViewFavoriteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'user',
        'view',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'user',
        'view',
    )
    date_hierarchy = 'created_at'


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'description',
        'description_text',
        'description_html',
        'start_date',
        'target_date',
        'status',
        'lead',
        'view_props',
        'sort_order',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'start_date',
        'target_date',
        'lead',
    )
    raw_id_fields = ('members',)
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(ModuleMember)
class ModuleMemberAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'module',
        'member',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'module',
        'member',
    )
    date_hierarchy = 'created_at'


@admin.register(ModuleIssue)
class ModuleIssueAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'module',
        'issue',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'module',
        'issue',
    )
    date_hierarchy = 'created_at'


@admin.register(ModuleLink)
class ModuleLinkAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'title',
        'url',
        'module',
        'metadata',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'module',
    )
    date_hierarchy = 'created_at'


@admin.register(ModuleFavorite)
class ModuleFavoriteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'user',
        'module',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'user',
        'module',
    )
    date_hierarchy = 'created_at'


@admin.register(APIToken)
class APITokenAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'token',
        'label',
        'user',
        'user_type',
        'workspace',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'user',
        'workspace',
    )
    date_hierarchy = 'created_at'


@admin.register(Integration)
class IntegrationAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'title',
        'provider',
        'network',
        'description',
        'author',
        'webhook_url',
        'webhook_secret',
        'redirect_url',
        'metadata',
        'verified',
        'avatar_url',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'verified',
    )
    date_hierarchy = 'created_at'


@admin.register(WorkspaceIntegration)
class WorkspaceIntegrationAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'actor',
        'integration',
        'api_token',
        'metadata',
        'config',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'actor',
        'integration',
        'api_token',
    )
    date_hierarchy = 'created_at'


@admin.register(GithubRepository)
class GithubRepositoryAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'url',
        'config',
        'repository_id',
        'owner',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(GithubRepositorySync)
class GithubRepositorySyncAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'repository',
        'credentials',
        'actor',
        'workspace_integration',
        'label',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'repository',
        'actor',
        'workspace_integration',
        'label',
    )
    date_hierarchy = 'created_at'


@admin.register(GithubIssueSync)
class GithubIssueSyncAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'repo_issue_id',
        'github_issue_id',
        'issue_url',
        'issue',
        'repository_sync',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'issue',
        'repository_sync',
    )
    date_hierarchy = 'created_at'


@admin.register(GithubCommentSync)
class GithubCommentSyncAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'repo_comment_id',
        'comment',
        'issue_sync',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'comment',
        'issue_sync',
    )
    date_hierarchy = 'created_at'


@admin.register(SlackProjectSync)
class SlackProjectSyncAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'access_token',
        'scopes',
        'bot_user_id',
        'webhook_url',
        'data',
        'team_id',
        'team_name',
        'workspace_integration',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'workspace_integration',
    )
    date_hierarchy = 'created_at'


@admin.register(Importer)
class ImporterAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'service',
        'status',
        'initiated_by',
        'metadata',
        'config',
        'data',
        'token',
        'imported_data',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'initiated_by',
        'token',
    )
    date_hierarchy = 'created_at'


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'description',
        'description_html',
        'description_stripped',
        'owned_by',
        'access',
        'color',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'owned_by',
    )
    raw_id_fields = ('labels',)
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(PageBlock)
class PageBlockAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'page',
        'name',
        'description',
        'description_html',
        'description_stripped',
        'issue',
        'completed_at',
        'sort_order',
        'sync',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'page',
        'issue',
        'completed_at',
        'sync',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(PageFavorite)
class PageFavoriteAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'user',
        'page',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'user',
        'page',
    )
    date_hierarchy = 'created_at'


@admin.register(PageLabel)
class PageLabelAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'label',
        'page',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'label',
        'page',
    )
    date_hierarchy = 'created_at'


@admin.register(Estimate)
class EstimateAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'description',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(EstimatePoint)
class EstimatePointAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'estimate',
        'key',
        'description',
        'value',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'estimate',
    )
    date_hierarchy = 'created_at'


@admin.register(Inbox)
class InboxAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'name',
        'description',
        'is_default',
        'view_props',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'is_default',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(InboxIssue)
class InboxIssueAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'project',
        'workspace',
        'inbox',
        'issue',
        'status',
        'snoozed_till',
        'duplicate_to',
        'source',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'project',
        'workspace',
        'inbox',
        'issue',
        'snoozed_till',
        'duplicate_to',
    )
    date_hierarchy = 'created_at'


@admin.register(AnalyticView)
class AnalyticViewAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'name',
        'description',
        'query',
        'query_dict',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
    )
    search_fields = ('name',)
    date_hierarchy = 'created_at'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'project',
        'data',
        'entity_identifier',
        'entity_name',
        'title',
        'message',
        'message_html',
        'message_stripped',
        'sender',
        'triggered_by',
        'receiver',
        'read_at',
        'snoozed_till',
        'archived_at',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'project',
        'triggered_by',
        'receiver',
        'read_at',
        'snoozed_till',
        'archived_at',
    )
    date_hierarchy = 'created_at'


@admin.register(ExporterHistory)
class ExporterHistoryAdmin(admin.ModelAdmin):
    list_display = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'id',
        'workspace',
        'project',
        'provider',
        'status',
        'reason',
        'key',
        'url',
        'token',
        'initiated_by',
    )
    list_filter = (
        'created_at',
        'updated_at',
        'created_by',
        'updated_by',
        'workspace',
        'initiated_by',
    )
    date_hierarchy = 'created_at'

/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

export default {
  cloud_maintenance_message: {
    we_are_working_on_this_if_you_need_immediate_assistance: "我们正在处理此问题。如果您需要紧急协助，",
    reach_out_to_us: "请联系我们",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our: "否则，请偶尔刷新页面或访问我们的",
    status_page: "状态页面",
  },
  sidebar: {
    projects: "项目",
    pages: "页面",
    new_work_item: "新工作项",
    home: "主页",
    your_work: "我的工作",
    inbox: "收件箱",
    workspace: "工作区",
    views: "视图",
    analytics: "分析",
    work_items: "工作项",
    cycles: "周期",
    modules: "模块",
    intake: "收集",
    drafts: "草稿",
    favorites: "收藏",
    pro: "专业版",
    upgrade: "升级",
    pi_chat: "AI 聊天",
    initiatives: "计划",
    teamspaces: "团队空间",
    epics: "史诗",
    upgrade_plan: "升级计划",
    plane_pro: "Plane Pro",
    business: "商业版",
    customers: "客户",
    recurring_work_items: "重复工作项",
  },
  auth: {
    common: {
      email: {
        label: "邮箱",
        placeholder: "name@company.com",
        errors: {
          required: "邮箱是必填项",
          invalid: "邮箱格式无效",
        },
      },
      password: {
        label: "密码",
        set_password: "设置密码",
        placeholder: "输入密码",
        confirm_password: {
          label: "确认密码",
          placeholder: "确认密码",
        },
        current_password: {
          label: "当前密码",
        },
        new_password: {
          label: "新密码",
          placeholder: "输入新密码",
        },
        change_password: {
          label: {
            default: "修改密码",
            submitting: "正在修改密码",
          },
        },
        errors: {
          match: "密码不匹配",
          empty: "请输入密码",
          length: "密码长度应超过8个字符",
          strength: {
            weak: "密码强度较弱",
            strong: "密码强度较强",
          },
        },
        submit: "设置密码",
        toast: {
          change_password: {
            success: {
              title: "成功！",
              message: "密码修改成功。",
            },
            error: {
              title: "错误！",
              message: "出现错误。请重试。",
            },
          },
        },
      },
      unique_code: {
        label: "唯一码",
        placeholder: "123456",
        paste_code: "粘贴发送到您邮箱的验证码",
        requesting_new_code: "正在请求新验证码",
        sending_code: "正在发送验证码",
      },
      already_have_an_account: "已有账号？",
      login: "登录",
      create_account: "创建账号",
      new_to_plane: "首次使用 Plane？",
      back_to_sign_in: "返回登录",
      resend_in: "{seconds} 秒后重新发送",
      sign_in_with_unique_code: "使用唯一码登录",
      forgot_password: "忘记密码？",
      username: {
        label: "用户名",
        placeholder: "请输入您的用户名",
      },
    },
    sign_up: {
      header: {
        label: "创建账号以开始与团队一起管理工作。",
        step: {
          email: {
            header: "注册",
            sub_header: "",
          },
          password: {
            header: "注册",
            sub_header: "使用邮箱-密码组合注册。",
          },
          unique_code: {
            header: "注册",
            sub_header: "使用发送到上述邮箱的唯一码注册。",
          },
        },
      },
      errors: {
        password: {
          strength: "请设置一个强密码以继续",
        },
      },
    },
    sign_in: {
      header: {
        label: "登录以开始与团队一起管理工作。",
        step: {
          email: {
            header: "登录或注册",
            sub_header: "",
          },
          password: {
            header: "登录或注册",
            sub_header: "使用您的邮箱-密码组合登录。",
          },
          unique_code: {
            header: "登录或注册",
            sub_header: "使用发送到上述邮箱的唯一码登录。",
          },
        },
      },
    },
    forgot_password: {
      title: "重置密码",
      description: "输入您的用户账号已验证的邮箱地址，我们将向您发送密码重置链接。",
      email_sent: "我们已将重置链接发送到您的邮箱",
      send_reset_link: "发送重置链接",
      errors: {
        smtp_not_enabled: "我们发现您的管理员未启用 SMTP，我们将无法发送密码重置链接",
      },
      toast: {
        success: {
          title: "邮件已发送",
          message: "请查看您的收件箱以获取重置密码的链接。如果几分钟内未收到，请检查垃圾邮件文件夹。",
        },
        error: {
          title: "错误！",
          message: "出现错误。请重试。",
        },
      },
    },
    reset_password: {
      title: "设置新密码",
      description: "使用强密码保护您的账号",
    },
    set_password: {
      title: "保护您的账号",
      description: "设置密码有助于您安全登录",
    },
    sign_out: {
      toast: {
        error: {
          title: "错误！",
          message: "登出失败。请重试。",
        },
      },
    },
    ldap: {
      header: {
        label: "使用 {ldapProviderName} 继续",
        sub_header: "请输入您的 {ldapProviderName} 凭据",
      },
    },
  },
  submit: "提交",
  cancel: "取消",
  loading: "加载中",
  error: "错误",
  success: "成功",
  warning: "警告",
  info: "信息",
  close: "关闭",
  yes: "是",
  no: "否",
  ok: "确定",
  name: "名称",
  description: "描述",
  search: "搜索",
  add_member: "添加成员",
  adding_members: "正在添加成员",
  remove_member: "移除成员",
  add_members: "添加成员",
  adding_member: "正在添加成员",
  remove_members: "移除成员",
  add: "添加",
  adding: "添加中",
  remove: "移除",
  add_new: "添加新的",
  remove_selected: "移除所选",
  first_name: "名",
  last_name: "姓",
  email: "邮箱",
  display_name: "显示名称",
  role: "角色",
  timezone: "时区",
  avatar: "头像",
  cover_image: "封面图片",
  password: "密码",
  change_cover: "更改封面",
  language: "语言",
  saving: "保存中",
  save_changes: "保存更改",
  deactivate_account: "停用账号",
  deactivate_account_description: "停用账号后，该账号内的所有数据和资源将被永久删除且无法恢复。",
  profile_settings: "个人资料设置",
  your_account: "您的账号",
  security: "安全",
  activity: "活动",
  activity_empty_state: {
    no_activity: "暂无活动",
    no_transitions: "暂无转换",
  },
  appearance: "外观",
  notifications: "通知",
  workspaces: "工作区",
  create_workspace: "创建工作区",
  invitations: "邀请",
  summary: "摘要",
  assigned: "已分配",
  created: "已创建",
  subscribed: "已订阅",
  you_do_not_have_the_permission_to_access_this_page: "您没有访问此页面的权限。",
  something_went_wrong_please_try_again: "出现错误。请重试。",
  load_more: "加载更多",
  select_or_customize_your_interface_color_scheme: "选择或自定义您的界面配色方案。",
  select_the_cursor_motion_style_that_feels_right_for_you: "选择适合您的光标移动样式。",
  theme: "主题",
  smooth_cursor: "平滑光标",
  system_preference: "系统偏好",
  light: "浅色",
  dark: "深色",
  light_contrast: "浅色高对比度",
  dark_contrast: "深色高对比度",
  custom: "自定义主题",
  select_your_theme: "选择您的主题",
  customize_your_theme: "自定义您的主题",
  background_color: "背景颜色",
  text_color: "文字颜色",
  primary_color: "主要(主题)颜色",
  sidebar_background_color: "侧边栏背景颜色",
  sidebar_text_color: "侧边栏文字颜色",
  set_theme: "设置主题",
  enter_a_valid_hex_code_of_6_characters: "输入有效的6位十六进制代码",
  background_color_is_required: "背景颜色为必填项",
  text_color_is_required: "文字颜色为必填项",
  primary_color_is_required: "主要颜色为必填项",
  sidebar_background_color_is_required: "侧边栏背景颜色为必填项",
  sidebar_text_color_is_required: "侧边栏文字颜色为必填项",
  updating_theme: "正在更新主题",
  theme_updated_successfully: "主题更新成功",
  failed_to_update_the_theme: "主题更新失败",
  email_notifications: "邮件通知",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "及时了解您订阅的工作项。启用此功能以获取通知。",
  email_notification_setting_updated_successfully: "邮件通知设置更新成功",
  failed_to_update_email_notification_setting: "邮件通知设置更新失败",
  notify_me_when: "在以下情况通知我",
  property_changes: "属性变更",
  property_changes_description: "当工作项的属性（如负责人、优先级、估算等）发生变更时通知我。",
  state_change: "状态变更",
  state_change_description: "当工作项移动到不同状态时通知我",
  issue_completed: "工作项完成",
  issue_completed_description: "仅当工作项完成时通知我",
  comments: "评论",
  comments_description: "当有人在工作项上发表评论时通知我",
  mentions: "提及",
  mentions_description: "仅当有人在评论或描述中提及我时通知我",
  old_password: "旧密码",
  general_settings: "常规设置",
  sign_out: "退出登录",
  signing_out: "正在退出登录",
  active_cycles: "活动周期",
  active_cycles_description: "监控各个项目的周期，跟踪高优先级工作项，并关注需要注意的周期。",
  on_demand_snapshots_of_all_your_cycles: "所有周期的实时快照",
  upgrade: "升级",
  "10000_feet_view": "所有活动周期的全局视图。",
  "10000_feet_view_description": "放大视角，一次性查看所有项目中正在进行的周期，而不是在每个项目中逐个查看周期。",
  get_snapshot_of_each_active_cycle: "获取每个活动周期的快照。",
  get_snapshot_of_each_active_cycle_description:
    "跟踪所有活动周期的高级指标，查看其进度状态，并了解与截止日期相关的范围。",
  compare_burndowns: "比较燃尽图。",
  compare_burndowns_description: "通过查看每个周期的燃尽报告，监控每个团队的表现。",
  quickly_see_make_or_break_issues: "快速查看关键工作项。",
  quickly_see_make_or_break_issues_description:
    "预览每个周期中与截止日期相关的高优先级工作项。一键查看每个周期的所有工作项。",
  zoom_into_cycles_that_need_attention: "关注需要注意的周期。",
  zoom_into_cycles_that_need_attention_description: "一键调查任何不符合预期的周期状态。",
  stay_ahead_of_blockers: "提前预防阻塞。",
  stay_ahead_of_blockers_description: "发现从一个项目到另一个项目的挑战，并查看从其他视图中不易发现的周期间依赖关系。",
  analytics: "分析",
  workspace_invites: "工作区邀请",
  enter_god_mode: "进入管理员模式",
  workspace_logo: "工作区标志",
  new_issue: "新工作项",
  your_work: "我的工作",
  drafts: "草稿",
  projects: "项目",
  views: "视图",
  archives: "归档",
  settings: "设置",
  failed_to_move_favorite: "移动收藏失败",
  favorites: "收藏",
  no_favorites_yet: "暂无收藏",
  create_folder: "创建文件夹",
  new_folder: "新建文件夹",
  favorite_updated_successfully: "收藏更新成功",
  favorite_created_successfully: "收藏创建成功",
  folder_already_exists: "文件夹已存在",
  folder_name_cannot_be_empty: "文件夹名称不能为空",
  something_went_wrong: "出现错误",
  failed_to_reorder_favorite: "重新排序收藏失败",
  favorite_removed_successfully: "收藏移除成功",
  failed_to_create_favorite: "创建收藏失败",
  failed_to_rename_favorite: "重命名收藏失败",
  project_link_copied_to_clipboard: "项目链接已复制到剪贴板",
  link_copied: "链接已复制",
  add_project: "添加项目",
  create_project: "创建项目",
  failed_to_remove_project_from_favorites: "无法从收藏中移除项目。请重试。",
  project_created_successfully: "项目创建成功",
  project_created_successfully_description: "项目创建成功。您现在可以开始添加工作项了。",
  project_name_already_taken: "项目名称已被使用。",
  project_identifier_already_taken: "项目标识符已被使用。",
  project_cover_image_alt: "项目封面图片",
  name_is_required: "名称为必填项",
  title_should_be_less_than_255_characters: "标题应少于255个字符",
  project_name: "项目名称",
  project_id_must_be_at_least_1_character: "项目ID至少需要1个字符",
  project_id_must_be_at_most_5_characters: "项目ID最多只能有5个字符",
  project_id: "项目ID",
  project_id_tooltip_content: "帮助您唯一标识项目中的工作项。最多50个字符。",
  description_placeholder: "描述",
  only_alphanumeric_non_latin_characters_allowed: "仅允许字母数字和非拉丁字符。",
  project_id_is_required: "项目ID为必填项",
  project_id_allowed_char: "仅允许字母数字和非拉丁字符。",
  project_id_min_char: "项目ID至少需要1个字符",
  project_id_max_char: "项目ID最多只能有{max}个字符",
  project_description_placeholder: "输入项目描述",
  select_network: "选择网络",
  lead: "负责人",
  date_range: "日期范围",
  private: "私有",
  public: "公开",
  accessible_only_by_invite: "仅受邀者可访问",
  anyone_in_the_workspace_except_guests_can_join: "除访客外的工作区所有成员都可以加入",
  creating: "创建中",
  creating_project: "正在创建项目",
  adding_project_to_favorites: "正在将项目添加到收藏",
  project_added_to_favorites: "项目已添加到收藏",
  couldnt_add_the_project_to_favorites: "无法将项目添加到收藏。请重试。",
  removing_project_from_favorites: "正在从收藏中移除项目",
  project_removed_from_favorites: "项目已从收藏中移除",
  couldnt_remove_the_project_from_favorites: "无法从收藏中移除项目。请重试。",
  add_to_favorites: "添加到收藏",
  remove_from_favorites: "从收藏中移除",
  publish_project: "发布项目",
  publish: "发布",
  copy_link: "复制链接",
  leave_project: "离开项目",
  join_the_project_to_rearrange: "加入项目以重新排列",
  drag_to_rearrange: "拖动以重新排列",
  congrats: "恭喜！",
  open_project: "打开项目",
  issues: "工作项",
  cycles: "周期",
  modules: "模块",
  pages: {
    link_pages: "连接页面",
    show_wiki_pages: "显示 Wiki 页面",
    link_pages_to: "连接页面到",
    linked_pages: "连接的页面",
    no_description: "此页面为空。在此输入一些内容，并在此处查看此占位符",
    toasts: {
      link: {
        success: {
          title: "页面已更新",
          message: "页面已成功更新",
        },
        error: {
          title: "页面未更新",
          message: "页面无法更新",
        },
      },
      remove: {
        success: {
          title: "页面已删除",
          message: "页面已成功删除",
        },
        error: {
          title: "页面未删除",
          message: "页面无法删除",
        },
      },
    },
  },
  intake: "收集",
  renew: "更新",
  preview: "预览",
  time_tracking: "时间跟踪",
  work_management: "工作管理",
  projects_and_issues: "项目和工作项",
  projects_and_issues_description: "在此项目中开启或关闭这些功能。",
  cycles_description: "为每个项目设置时间框，并根据需要调整周期。一个周期可以是两周，下一个周期是一周。",
  modules_description: "将工作组织为子项目，并指定专门的负责人和受理人。",
  views_description: "保存自定义排序、筛选和显示选项，或与团队共享。",
  pages_description: "创建和编辑自由格式的内容：笔记、文档，任何内容。",
  intake_description: "允许非成员提交 Bug、反馈和建议，且不会干扰您的工作流程。",
  time_tracking_description: "记录在工作项和项目上花费的时间。",
  work_management_description: "轻松管理您的工作和项目。",
  documentation: "文档",
  message_support: "联系支持",
  contact_sales: "联系销售",
  hyper_mode: "超级模式",
  keyboard_shortcuts: "键盘快捷键",
  whats_new: "新功能",
  version: "版本",
  we_are_having_trouble_fetching_the_updates: "我们在获取更新时遇到问题。",
  our_changelogs: "我们的更新日志",
  for_the_latest_updates: "获取最新更新。",
  please_visit: "请访问",
  docs: "文档",
  full_changelog: "完整更新日志",
  support: "支持",
  forum: "Forum",
  powered_by_plane_pages: "由Plane Pages提供支持",
  please_select_at_least_one_invitation: "请至少选择一个邀请。",
  please_select_at_least_one_invitation_description: "请至少选择一个加入工作区的邀请。",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "我们看到有人邀请您加入工作区",
  join_a_workspace: "加入工作区",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description: "我们看到有人邀请您加入工作区",
  join_a_workspace_description: "加入工作区",
  accept_and_join: "接受并加入",
  go_home: "返回首页",
  no_pending_invites: "没有待处理的邀请",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "如果有人邀请您加入工作区，您可以在这里看到",
  back_to_home: "返回首页",
  workspace_name: "工作区名称",
  deactivate_your_account: "停用您的账户",
  deactivate_your_account_description:
    "一旦停用，您将无法被分配工作项，也不会被计入工作区的账单。要重新激活您的账户，您需要收到发送到此电子邮件地址的工作区邀请。",
  deactivating: "正在停用",
  confirm: "确认",
  confirming: "确认中",
  draft_created: "草稿已创建",
  issue_created_successfully: "工作项创建成功",
  draft_creation_failed: "草稿创建失败",
  issue_creation_failed: "工作项创建失败",
  draft_issue: "草稿工作项",
  issue_updated_successfully: "工作项更新成功",
  issue_could_not_be_updated: "工作项无法更新",
  create_a_draft: "创建草稿",
  save_to_drafts: "保存到草稿",
  save: "保存",
  update: "更新",
  updating: "更新中",
  create_new_issue: "创建新工作项",
  editor_is_not_ready_to_discard_changes: "编辑器尚未准备好放弃更改",
  failed_to_move_issue_to_project: "无法将工作项移动到项目",
  create_more: "创建更多",
  add_to_project: "添加到项目",
  discard: "放弃",
  duplicate_issue_found: "发现重复的工作项",
  duplicate_issues_found: "发现重复的工作项",
  no_matching_results: "没有匹配的结果",
  title_is_required: "标题为必填项",
  title: "标题",
  state: "状态",
  transition: "转换",
  history: "历史",
  priority: "优先级",
  none: "无",
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
  members: "成员",
  assignee: "负责人",
  assignees: "负责人",
  subscriber: "{count, plural, one{# 位订阅者} other{# 位订阅者}}",
  you: "您",
  labels: "标签",
  create_new_label: "创建新标签",
  label_name: "标签名称",
  failed_to_create_label: "创建标签失败，请重试。",
  start_date: "开始日期",
  end_date: "结束日期",
  due_date: "截止日期",
  estimate: "估算",
  change_parent_issue: "更改父工作项",
  remove_parent_issue: "移除父工作项",
  add_parent: "添加父项",
  loading_members: "正在加载成员",
  view_link_copied_to_clipboard: "视图链接已复制到剪贴板",
  required: "必填",
  optional: "可选",
  Cancel: "取消",
  edit: "编辑",
  archive: "归档",
  restore: "恢复",
  open_in_new_tab: "在新标签页中打开",
  delete: "删除",
  deleting: "删除中",
  make_a_copy: "创建副本",
  move_to_project: "移动到项目",
  good: "早上",
  morning: "早上",
  afternoon: "下午",
  evening: "晚上",
  show_all: "显示全部",
  show_less: "显示更少",
  no_data_yet: "暂无数据",
  syncing: "同步中",
  add_work_item: "添加工作项",
  advanced_description_placeholder: "按'/'使用命令",
  create_work_item: "创建工作项",
  attachments: "附件",
  declining: "拒绝中",
  declined: "已拒绝",
  decline: "拒绝",
  unassigned: "未分配",
  work_items: "工作项",
  add_link: "添加链接",
  points: "点数",
  no_assignee: "无负责人",
  no_assignees_yet: "暂无负责人",
  no_labels_yet: "暂无标签",
  ideal: "理想",
  current: "当前",
  no_matching_members: "没有匹配的成员",
  leaving: "离开中",
  removing: "移除中",
  leave: "离开",
  refresh: "刷新",
  refreshing: "刷新中",
  refresh_status: "刷新状态",
  prev: "上一个",
  next: "下一个",
  re_generating: "重新生成中",
  re_generate: "重新生成",
  re_generate_key: "重新生成密钥",
  export: "导出",
  member: "{count, plural, other{# 成员}}",
  new_password_must_be_different_from_old_password: "新密码必须不同于旧密码",
  edited: "已编辑",
  bot: "机器人",
  project_view: {
    sort_by: {
      created_at: "创建时间",
      updated_at: "更新时间",
      name: "名称",
    },
  },
  upgrade_request: "请联系工作区管理员升级。",
  copied_to_clipboard: "已复制到剪贴板",
  copied_to_clipboard_description: "URL 已成功复制到您的剪贴板",
  toast: {
    success: "成功！",
    error: "错误！",
  },
  links: {
    toasts: {
      created: {
        title: "链接已创建",
        message: "链接已成功创建",
      },
      not_created: {
        title: "链接未创建",
        message: "无法创建链接",
      },
      updated: {
        title: "链接已更新",
        message: "链接已成功更新",
      },
      not_updated: {
        title: "链接未更新",
        message: "无法更新链接",
      },
      removed: {
        title: "链接已移除",
        message: "链接已成功移除",
      },
      not_removed: {
        title: "链接未移除",
        message: "无法移除链接",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "快速入门指南",
      not_right_now: "暂时不要",
      create_project: {
        title: "创建项目",
        description: "在Plane中，大多数事情都从项目开始。",
        cta: "开始使用",
      },
      invite_team: {
        title: "邀请您的团队",
        description: "与同事一起构建、发布和管理。",
        cta: "邀请他们加入",
      },
      configure_workspace: {
        title: "设置您的工作区",
        description: "开启或关闭功能，或进行更多设置。",
        cta: "配置此工作区",
      },
      personalize_account: {
        title: "让Plane更适合您",
        description: "选择您的头像、颜色等。",
        cta: "立即个性化",
      },
      widgets: {
        title: "没有小部件看起来很安静，开启它们吧",
        description: `看起来您的所有小部件都已关闭。现在启用它们
来提升您的体验！`,
        primary_button: {
          text: "管理小部件",
        },
      },
    },
    quick_links: {
      empty: "保存您想要方便访问的工作相关链接。",
      add: "添加快速链接",
      title: "快速链接",
      title_plural: "快速链接",
    },
    recents: {
      title: "最近",
      empty: {
        project: "访问项目后，您的最近项目将显示在这里。",
        page: "访问页面后，您的最近页面将显示在这里。",
        issue: "访问工作项后，您的最近工作项将显示在这里。",
        default: "您还没有任何最近项目。",
      },
      filters: {
        all: "所有",
        projects: "项目",
        pages: "页面",
        issues: "工作项",
      },
    },
    new_at_plane: {
      title: "Plane新功能",
    },
    quick_tutorial: {
      title: "快速教程",
    },
    widget: {
      reordered_successfully: "小部件重新排序成功。",
      reordering_failed: "重新排序小部件时出错。",
    },
    manage_widgets: "管理小部件",
    title: "首页",
    star_us_on_github: "在GitHub上为我们加星",
    business_trial_banner: {
      title: "您的14天Business计划试用已开始！",
      description: "探索所有Business功能。准备好后，选择订阅。不会自动收费。",
      trial_ends_today: "试用今天结束",
      trial_ends_in_days: "试用将在{days}天后结束",
      start_subscription: "开始订阅",
      explore_business_features: "探索Business功能",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL无效",
        placeholder: "输入或粘贴URL",
      },
      title: {
        text: "显示标题",
        placeholder: "您希望如何显示此链接",
      },
    },
  },
  common: {
    all: "全部",
    no_items_in_this_group: "此组中没有项目",
    drop_here_to_move: "拖放到此处以移动",
    states: "状态",
    state: "状态",
    state_groups: "状态组",
    state_group: "状态组",
    priorities: "优先级",
    priority: "优先级",
    team_project: "团队项目",
    project: "项目",
    cycle: "周期",
    cycles: "周期",
    module: "模块",
    modules: "模块",
    labels: "标签",
    label: "标签",
    assignees: "负责人",
    assignee: "负责人",
    created_by: "创建者",
    none: "无",
    link: "链接",
    estimates: "估算",
    estimate: "估算",
    created_at: "创建于",
    updated_at: "更新时间",
    completed_at: "完成于",
    layout: "布局",
    filters: "筛选",
    display: "显示",
    load_more: "加载更多",
    activity: "活动",
    analytics: "分析",
    dates: "日期",
    success: "成功！",
    something_went_wrong: "出现错误",
    error: {
      label: "错误！",
      message: "发生错误。请重试。",
    },
    group_by: "分组方式",
    epic: "史诗",
    epics: "史诗",
    work_item: "工作项",
    work_items: "工作项",
    sub_work_item: "子工作项",
    add: "添加",
    warning: "警告",
    updating: "更新中",
    adding: "添加中",
    update: "更新",
    creating: "创建中",
    create: "创建",
    cancel: "取消",
    description: "描述",
    title: "标题",
    attachment: "附件",
    general: "常规",
    features: "功能",
    automation: "自动化",
    project_name: "项目名称",
    project_id: "项目ID",
    project_timezone: "项目时区",
    created_on: "创建于",
    update_project: "更新项目",
    identifier_already_exists: "标识符已存在",
    add_more: "添加更多",
    defaults: "默认值",
    add_label: "添加标签",
    customize_time_range: "自定义时间范围",
    loading: "加载中",
    attachments: "附件",
    property: "属性",
    properties: "属性",
    parent: "父项",
    page: "页面",
    remove: "移除",
    archiving: "归档中",
    archive: "归档",
    access: {
      public: "公开",
      private: "私有",
    },
    done: "完成",
    sub_work_items: "子工作项",
    comment: "评论",
    workspace_level: "工作区级别",
    order_by: {
      label: "排序方式",
      manual: "手动",
      last_created: "最近创建",
      last_updated: "最近更新",
      start_date: "开始日期",
      due_date: "截止日期",
      asc: "升序",
      desc: "降序",
      updated_on: "更新时间",
    },
    sort: {
      asc: "升序",
      desc: "降序",
      created_on: "创建时间",
      updated_on: "更新时间",
    },
    comments: "评论",
    updates: "更新",
    additional_updates: "额外更新",
    clear_all: "清除全部",
    copied: "已复制！",
    link_copied: "链接已复制！",
    link_copied_to_clipboard: "链接已复制到剪贴板",
    copied_to_clipboard: "工作项链接已复制到剪贴板",
    branch_name_copied_to_clipboard: "分支名称已复制到剪贴板",
    is_copied_to_clipboard: "工作项已复制到剪贴板",
    no_links_added_yet: "暂无添加的链接",
    add_link: "添加链接",
    links: "链接",
    go_to_workspace: "前往工作区",
    progress: "进度",
    optional: "可选",
    join: "加入",
    go_back: "返回",
    continue: "继续",
    resend: "重新发送",
    relations: "关系",
    errors: {
      default: {
        title: "错误！",
        message: "发生错误。请重试。",
      },
      required: "此字段为必填项",
      entity_required: "{entity}为必填项",
      restricted_entity: "{entity}已被限制",
    },
    update_link: "更新链接",
    attach: "附加",
    create_new: "创建新的",
    add_existing: "添加现有",
    type_or_paste_a_url: "输入或粘贴URL",
    url_is_invalid: "URL无效",
    display_title: "显示标题",
    link_title_placeholder: "您希望如何显示此链接",
    url: "URL",
    side_peek: "侧边预览",
    modal: "模态框",
    full_screen: "全屏",
    close_peek_view: "关闭预览视图",
    toggle_peek_view_layout: "切换预览视图布局",
    options: "选项",
    duration: "持续时间",
    today: "今天",
    week: "周",
    month: "月",
    quarter: "季度",
    press_for_commands: "按'/'使用命令",
    click_to_add_description: "点击添加描述",
    search: {
      label: "搜索",
      placeholder: "输入搜索内容",
      no_matches_found: "未找到匹配项",
      no_matching_results: "没有匹配的结果",
    },
    actions: {
      edit: "编辑",
      make_a_copy: "创建副本",
      open_in_new_tab: "在新标签页中打开",
      copy_link: "复制链接",
      copy_branch_name: "复制分支名称",
      archive: "归档",
      delete: "删除",
      remove_relation: "移除关系",
      subscribe: "订阅",
      unsubscribe: "取消订阅",
      clear_sorting: "清除排序",
      show_weekends: "显示周末",
      enable: "启用",
      disable: "禁用",
    },
    name: "名称",
    discard: "放弃",
    confirm: "确认",
    confirming: "确认中",
    read_the_docs: "阅读文档",
    default: "默认",
    active: "活动",
    enabled: "已启用",
    disabled: "已禁用",
    mandate: "授权",
    mandatory: "必需的",
    yes: "是",
    no: "否",
    please_wait: "请稍候",
    enabling: "正在启用",
    disabling: "正在禁用",
    beta: "测试版",
    or: "或",
    next: "下一步",
    back: "返回",
    cancelling: "正在取消",
    configuring: "正在配置",
    clear: "清除",
    import: "导入",
    connect: "连接",
    authorizing: "正在授权",
    processing: "正在处理",
    no_data_available: "暂无数据",
    from: "来自 {name}",
    authenticated: "已认证",
    select: "选择",
    upgrade: "升级",
    add_seats: "添加席位",
    projects: "项目",
    workspace: "工作区",
    workspaces: "工作区",
    team: "团队",
    teams: "团队",
    entity: "实体",
    entities: "实体",
    task: "任务",
    tasks: "任务",
    section: "部分",
    sections: "部分",
    edit: "编辑",
    connecting: "正在连接",
    connected: "已连接",
    disconnect: "断开连接",
    disconnecting: "正在断开连接",
    installing: "正在安装",
    install: "安装",
    reset: "重置",
    live: "实时",
    change_history: "变更历史",
    coming_soon: "即将推出",
    member: "成员",
    members: "成员",
    you: "你",
    upgrade_cta: {
      higher_subscription: "升级到更高订阅",
      talk_to_sales: "联系销售",
    },
    category: "类别",
    categories: "类别",
    saving: "保存中",
    save_changes: "保存更改",
    delete: "删除",
    deleting: "删除中",
    pending: "待处理",
    invite: "邀请",
    view: "查看",
    deactivated_user: "已停用用户",
    apply: "应用",
    applying: "应用中",
    users: "用户",
    admins: "管理员",
    guests: "访客",
    on_track: "进展顺利",
    off_track: "偏离轨道",
    at_risk: "有风险",
    timeline: "时间轴",
    completion: "完成",
    upcoming: "即将发生",
    completed: "已完成",
    in_progress: "进行中",
    planned: "已计划",
    paused: "暂停",
    no_of: "{entity} 的数量",
    resolved: "已解决",
    worklogs: "工作日志",
    project_updates: "项目更新",
    overview: "概览",
    workflows: "工作流",
    members_and_teamspaces: "成员和团队空间",
    open_in_full_screen: "在全屏中打开{page}",
  },
  chart: {
    x_axis: "X轴",
    y_axis: "Y轴",
    metric: "指标",
  },
  form: {
    title: {
      required: "标题为必填项",
      max_length: "标题应少于 {length} 个字符",
    },
  },
  entity: {
    grouping_title: "{entity}分组",
    priority: "{entity}优先级",
    all: "所有{entity}",
    drop_here_to_move: "拖放到此处以移动{entity}",
    delete: {
      label: "删除{entity}",
      success: "{entity}删除成功",
      failed: "{entity}删除失败",
    },
    update: {
      failed: "{entity}更新失败",
      success: "{entity}更新成功",
    },
    link_copied_to_clipboard: "{entity}链接已复制到剪贴板",
    fetch: {
      failed: "获取{entity}时出错",
    },
    add: {
      success: "{entity}添加成功",
      failed: "添加{entity}时出错",
    },
    remove: {
      success: "{entity}删除成功",
      failed: "删除{entity}时出错",
    },
  },
  epic: {
    all: "所有史诗",
    label: "{count, plural, one {史诗} other {史诗}}",
    new: "新建史诗",
    adding: "正在添加史诗",
    create: {
      success: "史诗创建成功",
    },
    add: {
      press_enter: "按'Enter'添加另一个史诗",
      label: "添加史诗",
    },
    title: {
      label: "史诗标题",
      required: "史诗标题为必填项",
    },
    archive: {
      description: `只有已完成或已取消的史诗
可以归档`,
      label: "归档史诗",
      confirm_message: "确定要归档该史诗吗？所有已归档的史诗之后都可以恢复。",
      success: {
        label: "归档成功",
        message: "可在项目归档中查看您的归档。",
      },
      failed: {
        message: "无法归档史诗，请重试。",
      },
    },
  },
  issue: {
    label: "{count, plural, one {工作项} other {工作项}}",
    all: "所有工作项",
    edit: "编辑工作项",
    title: {
      label: "工作项标题",
      required: "工作项标题为必填项",
    },
    add: {
      press_enter: "按'Enter'添加另一个工作项",
      label: "添加工作项",
      cycle: {
        failed: "无法将工作项添加到周期。请重试。",
        success: "{count, plural, one {工作项} other {工作项}}已成功添加到周期。",
        loading: "正在将{count, plural, one {工作项} other {工作项}}添加到周期",
      },
      assignee: "添加负责人",
      start_date: "添加开始日期",
      due_date: "添加截止日期",
      parent: "添加父工作项",
      sub_issue: "添加子工作项",
      relation: "添加关系",
      link: "添加链接",
      existing: "添加现有工作项",
    },
    remove: {
      label: "移除工作项",
      cycle: {
        loading: "正在从周期中移除工作项",
        success: "已成功从周期中移除工作项。",
        failed: "无法从周期中移除工作项。请重试。",
      },
      module: {
        loading: "正在从模块中移除工作项",
        success: "已成功从模块中移除工作项。",
        failed: "无法从模块中移除工作项。请重试。",
      },
      parent: {
        label: "移除父工作项",
      },
    },
    new: "新建工作项",
    adding: "正在添加工作项",
    create: {
      success: "工作项创建成功",
    },
    priority: {
      urgent: "紧急",
      high: "高",
      medium: "中",
      low: "低",
    },
    display: {
      properties: {
        label: "显示属性",
        id: "ID",
        issue_type: "工作项类型",
        sub_issue_count: "子工作项数量",
        attachment_count: "附件数量",
        created_on: "创建于",
        sub_issue: "子工作项",
        work_item_count: "工作项数量",
      },
      extra: {
        show_sub_issues: "显示子工作项",
        show_empty_groups: "显示空组",
      },
    },
    layouts: {
      ordered_by_label: "此布局按以下方式排序",
      list: "列表",
      kanban: "看板",
      calendar: "日历",
      spreadsheet: "表格",
      gantt: "时间线",
      title: {
        list: "列表布局",
        kanban: "看板布局",
        calendar: "日历布局",
        spreadsheet: "表格布局",
        gantt: "时间线布局",
      },
    },
    states: {
      active: "活动",
      backlog: "待办",
    },
    comments: {
      placeholder: "添加评论",
      switch: {
        private: "切换为私密评论",
        public: "切换为公开评论",
      },
      create: {
        success: "评论创建成功",
        error: "评论创建失败。请稍后重试。",
      },
      update: {
        success: "评论更新成功",
        error: "评论更新失败。请稍后重试。",
      },
      remove: {
        success: "评论删除成功",
        error: "评论删除失败。请稍后重试。",
      },
      upload: {
        error: "资源上传失败。请稍后重试。",
      },
      copy_link: {
        success: "评论链接已复制到剪贴板",
        error: "复制评论链接时出错。请稍后再试。",
      },
    },
    empty_state: {
      issue_detail: {
        title: "工作项不存在",
        description: "您查找的工作项不存在、已归档或已删除。",
        primary_button: {
          text: "查看其他工作项",
        },
      },
    },
    sibling: {
      label: "同级工作项",
    },
    archive: {
      description: `只有已完成或已取消的
工作项可以归档`,
      label: "归档工作项",
      confirm_message: "您确定要归档此工作项吗？所有已归档的工作项稍后可以恢复。",
      success: {
        label: "归档成功",
        message: "您的归档可以在项目归档中找到。",
      },
      failed: {
        message: "无法归档工作项。请重试。",
      },
    },
    restore: {
      success: {
        title: "恢复成功",
        message: "您的工作项可以在项目工作项中找到。",
      },
      failed: {
        message: "无法恢复工作项。请重试。",
      },
    },
    relation: {
      relates_to: "关联到",
      duplicate: "重复于",
      blocked_by: "被阻止于",
      blocking: "阻止",
      start_before: "开始于之前",
      start_after: "开始于之后",
      finish_before: "结束于之前",
      finish_after: "结束于之后",
      implements: "实现",
      implemented_by: "实现者",
    },
    copy_link: "复制工作项链接",
    delete: {
      label: "删除工作项",
      error: "删除工作项时出错",
    },
    subscription: {
      actions: {
        subscribed: "工作项订阅成功",
        unsubscribed: "工作项取消订阅成功",
      },
    },
    select: {
      error: "请至少选择一个工作项",
      empty: "未选择工作项",
      add_selected: "添加所选工作项",
      select_all: "全选",
      deselect_all: "取消全选",
    },
    open_in_full_screen: "在全屏中打开工作项",
    vote: {
      click_to_upvote: "点击赞成",
      click_to_downvote: "点击反对",
      click_to_view_upvotes: "点击查看赞成票",
      click_to_view_downvotes: "点击查看反对票",
    },
  },
  attachment: {
    error: "无法附加文件。请重新上传。",
    only_one_file_allowed: "一次只能上传一个文件。",
    file_size_limit: "文件大小必须小于或等于 {size}MB。",
    drag_and_drop: "拖放到任意位置以上传",
    delete: "删除附件",
  },
  label: {
    select: "选择标签",
    create: {
      success: "标签创建成功",
      failed: "标签创建失败",
      already_exists: "标签已存在",
      type: "输入以添加新标签",
    },
  },
  sub_work_item: {
    update: {
      success: "子工作项更新成功",
      error: "更新子工作项时出错",
    },
    remove: {
      success: "子工作项移除成功",
      error: "移除子工作项时出错",
    },
    empty_state: {
      sub_list_filters: {
        title: "您没有符合您应用的过滤器的子工作项。",
        description: "要查看所有子工作项，请清除所有应用的过滤器。",
        action: "清除过滤器",
      },
      list_filters: {
        title: "您没有符合您应用的过滤器的工作项。",
        description: "要查看所有工作项，请清除所有应用的过滤器。",
        action: "清除过滤器",
      },
    },
  },
  view: {
    label: "{count, plural, one {视图} other {视图}}",
    create: {
      label: "创建视图",
    },
    update: {
      label: "更新视图",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "待处理",
        description: "待处理",
      },
      declined: {
        title: "已拒绝",
        description: "已拒绝",
      },
      snoozed: {
        title: "已暂停",
        description: "还剩{days, plural, one{# 天} other{# 天}}",
      },
      accepted: {
        title: "已接受",
        description: "已接受",
      },
      duplicate: {
        title: "重复",
        description: "重复",
      },
    },
    modals: {
      decline: {
        title: "拒绝工作项",
        content: "您确定要拒绝工作项 {value} 吗？",
      },
      delete: {
        title: "删除工作项",
        content: "您确定要删除工作项 {value} 吗？",
        success: "工作项删除成功",
      },
    },
    errors: {
      snooze_permission: "只有项目管理员可以暂停/取消暂停工作项",
      accept_permission: "只有项目管理员可以接受工作项",
      decline_permission: "只有项目管理员可以拒绝工作项",
    },
    actions: {
      accept: "接受",
      decline: "拒绝",
      snooze: "暂停",
      unsnooze: "取消暂停",
      copy: "复制工作项链接",
      delete: "删除",
      open: "打开工作项",
      mark_as_duplicate: "标记为重复",
      move: "将 {value} 移至项目工作项",
    },
    source: {
      "in-app": "应用内",
    },
    order_by: {
      created_at: "创建时间",
      updated_at: "更新时间",
      id: "ID",
    },
    label: "收集",
    page_label: "{workspace} - 收集",
    modal: {
      title: "创建收集工作项",
    },
    tabs: {
      open: "未处理",
      closed: "已处理",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "没有未处理的工作项",
        description: "在此处查找未处理的工作项。创建新工作项。",
      },
      sidebar_closed_tab: {
        title: "没有已处理的工作项",
        description: "所有已接受或已拒绝的工作项都可以在这里找到。",
      },
      sidebar_filter: {
        title: "没有匹配的工作项",
        description: "收集中没有符合筛选条件的工作项。创建新工作项。",
      },
      detail: {
        title: "选择一个工作项以查看其详细信息。",
      },
    },
  },
  workspace_creation: {
    heading: "创建您的工作区",
    subheading: "要开始使用 Plane，您需要创建或加入一个工作区。",
    form: {
      name: {
        label: "为您的工作区命名",
        placeholder: "熟悉且易于识别的名称总是最好的。",
      },
      url: {
        label: "设置您的工作区 URL",
        placeholder: "输入或粘贴 URL",
        edit_slug: "您只能编辑 URL 的标识符部分",
      },
      organization_size: {
        label: "有多少人将使用这个工作区？",
        placeholder: "选择一个范围",
      },
    },
    errors: {
      creation_disabled: {
        title: "只有您的实例管理员可以创建工作区",
        description: "如果您知道实例管理员的电子邮件地址，请点击下方按钮与他们联系。",
        request_button: "请求实例管理员",
      },
      validation: {
        name_alphanumeric: "工作区名称只能包含 (' '), ('-'), ('_') 和字母数字字符。",
        name_length: "名称限制在 80 个字符以内。",
        url_alphanumeric: "URL 只能包含 ('-') 和字母数字字符。",
        url_length: "URL 限制在 48 个字符以内。",
        url_already_taken: "工作区 URL 已被占用！",
      },
    },
    request_email: {
      subject: "请求新工作区",
      body: `您好，实例管理员：

请为 [创建工作区的目的] 创建一个 URL 为 [/workspace-name] 的新工作区。

谢谢，
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "创建工作区",
      loading: "正在创建工作区",
    },
    toast: {
      success: {
        title: "成功",
        message: "工作区创建成功",
      },
      error: {
        title: "错误",
        message: "工作区创建失败。请重试。",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "项目、活动和指标概览",
        description:
          "欢迎使用 Plane，我们很高兴您能来到这里。创建您的第一个项目并跟踪您的工作项，这个页面将转变为帮助您进展的空间。管理员还将看到帮助团队进展的项目。",
        primary_button: {
          text: "构建您的第一个项目",
          comic: {
            title: "在 Plane 中一切都从项目开始",
            description: "项目可以是产品路线图、营销活动或新车发布。",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "分析",
    page_label: "{workspace} - 分析",
    open_tasks: "总开放任务",
    error: "获取数据时出现错误。",
    work_items_closed_in: "已关闭的工作项",
    selected_projects: "已选择的项目",
    total_members: "总成员数",
    total_cycles: "总周期数",
    total_modules: "总模块数",
    pending_work_items: {
      title: "待处理工作项",
      empty_state: "同事的待处理工作项分析将显示在这里。",
    },
    work_items_closed_in_a_year: {
      title: "一年内关闭的工作项",
      empty_state: "关闭工作项以查看以图表形式显示的分析。",
    },
    most_work_items_created: {
      title: "创建最多工作项",
      empty_state: "同事及其创建的工作项数量将显示在这里。",
    },
    most_work_items_closed: {
      title: "关闭最多工作项",
      empty_state: "同事及其关闭的工作项数量将显示在这里。",
    },
    tabs: {
      scope_and_demand: "范围和需求",
      custom: "自定义分析",
    },
    empty_state: {
      customized_insights: {
        description: "分配给您的工作项将按状态分类显示在此处。",
        title: "暂无数据",
      },
      created_vs_resolved: {
        description: "随着时间推移创建和解决的工作项将显示在此处。",
        title: "暂无数据",
      },
      project_insights: {
        title: "暂无数据",
        description: "分配给您的工作项将按状态分类显示在此处。",
      },
      general: {
        title: "跟踪进度、工作量和分配。发现趋势，消除障碍，加速工作进展",
        description: "查看范围与需求、估算和范围蔓延。获取团队成员和团队的性能，确保您的项目按时运行。",
        primary_button: {
          text: "开始您的第一个项目",
          comic: {
            title: "分析功能在周期 + 模块中效果最佳",
            description:
              "首先，将您的问题在周期中进行时间限制，如果可能的话，将跨越多个周期的问题分组到模块中。在左侧导航中查看这两个功能。",
          },
        },
      },
      cycle_progress: {
        title: "尚无数据",
        description: "周期进度分析将显示在此处。将工作项添加到周期中以开始跟踪进度。",
      },
      module_progress: {
        title: "尚无数据",
        description: "模块进度分析将显示在此处。将工作项添加到模块中以开始跟踪进度。",
      },
      intake_trends: {
        title: "尚无数据",
        description: "引入趋势分析将显示在此处。将工作项添加到引入中以开始跟踪趋势。",
      },
    },
    created_vs_resolved: "已创建 vs 已解决",
    customized_insights: "自定义洞察",
    backlog_work_items: "待办的{entity}",
    active_projects: "活跃项目",
    trend_on_charts: "图表趋势",
    all_projects: "所有项目",
    summary_of_projects: "项目概览",
    project_insights: "项目洞察",
    started_work_items: "已开始的{entity}",
    total_work_items: "{entity}总数",
    total_projects: "项目总数",
    total_admins: "管理员总数",
    total_users: "用户总数",
    total_intake: "总收入",
    un_started_work_items: "未开始的{entity}",
    total_guests: "访客总数",
    completed_work_items: "已完成的{entity}",
    total: "{entity}总数",
    projects_by_status: "按状态分类的项目",
    active_users: "活跃用户",
    intake_trends: "入学趋势",
    workitem_resolved_vs_pending: "已解决 vs 待处理的工作项",
    upgrade_to_plan: "升级到 {plan} 以解锁 {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {项目} other {项目}}",
    create: {
      label: "添加项目",
    },
    network: {
      private: {
        title: "私有",
        description: "仅限邀请访问",
      },
      public: {
        title: "公开",
        description: "工作区中除访客外的任何人都可以加入",
      },
    },
    error: {
      permission: "您没有执行此操作的权限。",
      cycle_delete: "删除周期失败",
      module_delete: "删除模块失败",
      issue_delete: "删除工作项失败",
    },
    state: {
      backlog: "待办",
      unstarted: "未开始",
      started: "进行中",
      completed: "已完成",
      cancelled: "已取消",
    },
    sort: {
      manual: "手动",
      name: "名称",
      created_at: "创建日期",
      members_length: "成员数量",
    },
    scope: {
      my_projects: "我的项目",
      archived_projects: "已归档",
    },
    common: {
      months_count: "{months, plural, one{# 个月} other{# 个月}}",
    },
    empty_state: {
      general: {
        title: "没有活动项目",
        description:
          "将每个项目视为目标导向工作的父级。项目是工作项、周期和模块所在的地方，与您的同事一起帮助您实现目标。创建新项目或筛选已归档的项目。",
        primary_button: {
          text: "开始您的第一个项目",
          comic: {
            title: "在 Plane 中一切都从项目开始",
            description: "项目可以是产品路线图、营销活动或新车发布。",
          },
        },
      },
      no_projects: {
        title: "没有项目",
        description: "要创建工作项或管理您的工作，您需要创建一个项目或成为项目的一部分。",
        primary_button: {
          text: "开始您的第一个项目",
          comic: {
            title: "在 Plane 中一切都从项目开始",
            description: "项目可以是产品路线图、营销活动或新车发布。",
          },
        },
      },
      filter: {
        title: "没有匹配的项目",
        description: `未检测到符合匹配条件的项目。
创建一个新项目。`,
      },
      search: {
        description: `未检测到符合匹配条件的项目。
创建一个新项目`,
      },
    },
  },
  workspace_views: {
    add_view: "添加视图",
    empty_state: {
      "all-issues": {
        title: "项目中没有工作项",
        description: "第一个项目完成！现在，将您的工作分解成可跟踪的工作项。让我们开始吧！",
        primary_button: {
          text: "创建新工作项",
        },
      },
      assigned: {
        title: "还没有工作项",
        description: "可以在这里跟踪分配给您的工作项。",
        primary_button: {
          text: "创建新工作项",
        },
      },
      created: {
        title: "还没有工作项",
        description: "您创建的所有工作项都会出现在这里，直接在这里跟踪它们。",
        primary_button: {
          text: "创建新工作项",
        },
      },
      subscribed: {
        title: "还没有工作项",
        description: "订阅您感兴趣的工作项，在这里跟踪所有这些工作项。",
      },
      "custom-view": {
        title: "还没有工作项",
        description: "符合筛选条件的工作项，在这里跟踪所有这些工作项。",
      },
    },
    delete_view: {
      title: "您确定要删除此视图吗？",
      content: "如果您确认，您为此视图选择的所有排序、筛选和显示选项 + 布局将被永久删除，无法恢复。",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "更改邮箱",
        description: "请输入新的邮箱地址以接收验证链接。",
        toasts: {
          success_title: "成功！",
          success_message: "邮箱已更新，请重新登录。",
        },
        form: {
          email: {
            label: "新邮箱",
            placeholder: "请输入邮箱",
            errors: {
              required: "邮箱为必填项",
              invalid: "邮箱格式无效",
              exists: "邮箱已存在，请使用其他邮箱。",
              validation_failed: "邮箱验证失败，请重试。",
            },
          },
          code: {
            label: "验证码",
            placeholder: "123456",
            helper_text: "验证码已发送至你的新邮箱。",
            errors: {
              required: "验证码为必填项",
              invalid: "验证码无效，请重试。",
            },
          },
        },
        actions: {
          continue: "继续",
          confirm: "确认",
          cancel: "取消",
        },
        states: {
          sending: "发送中…",
        },
      },
    },
    notifications: {
      select_default_view: "选择默认视图",
      compact: "紧凑",
      full: "全屏",
    },
  },
  workspace_settings: {
    label: "工作区设置",
    page_label: "{workspace} - 常规设置",
    key_created: "密钥已创建",
    copy_key: "复制并将此密钥保存在 Plane Pages 中。关闭后您将无法看到此密钥。包含密钥的 CSV 文件已下载。",
    token_copied: "令牌已复制到剪贴板。",
    settings: {
      general: {
        title: "常规",
        upload_logo: "上传标志",
        edit_logo: "编辑标志",
        name: "工作区名称",
        company_size: "公司规模",
        url: "工作区网址",
        workspace_timezone: "工作区时区",
        update_workspace: "更新工作区",
        delete_workspace: "删除此工作区",
        delete_workspace_description: "删除工作区时，该工作区内的所有数据和资源将被永久删除，且无法恢复。",
        delete_btn: "删除此工作区",
        delete_modal: {
          title: "确定要删除此工作区吗？",
          description: "您目前正在试用我们的付费方案。请先取消试用后再继续。",
          dismiss: "关闭",
          cancel: "取消试用",
          success_title: "工作区已删除。",
          success_message: "即将跳转到您的个人资料页面。",
          error_title: "操作失败。",
          error_message: "请重试。",
        },
        errors: {
          name: {
            required: "名称为必填项",
            max_length: "工作区名称不应超过80个字符",
          },
          company_size: {
            required: "公司规模为必填项",
            select_a_range: "选择组织规模",
          },
        },
      },
      members: {
        title: "成员",
        add_member: "添加成员",
        pending_invites: "待处理邀请",
        invitations_sent_successfully: "邀请发送成功",
        leave_confirmation: "您确定要离开工作区吗？您将无法再访问此工作区。此操作无法撤消。",
        details: {
          full_name: "全名",
          display_name: "显示名称",
          email_address: "电子邮件地址",
          account_type: "账户类型",
          authentication: "身份验证",
          joining_date: "加入日期",
        },
        modal: {
          title: "邀请人员协作",
          description: "邀请人员在您的工作区中协作。",
          button: "发送邀请",
          button_loading: "正在发送邀请",
          placeholder: "name@company.com",
          errors: {
            required: "我们需要一个电子邮件地址来邀请他们。",
            invalid: "电子邮件无效",
          },
        },
      },
      billing_and_plans: {
        title: "账单与计划",
        current_plan: "当前计划",
        free_plan: "您目前使用的是免费计划",
        view_plans: "查看计划",
      },
      exports: {
        title: "导出",
        exporting: "导出中",
        previous_exports: "以前的导出",
        export_separate_files: "将数据导出为单独的文件",
        filters_info: "应用筛选器以根据您的条件导出特定工作项。",
        modal: {
          title: "导出到",
          toasts: {
            success: {
              title: "导出成功",
              message: "您可以从之前的导出中下载导出的{entity}",
            },
            error: {
              title: "导出失败",
              message: "导出未成功。请重试。",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooks",
        add_webhook: "添加 webhook",
        modal: {
          title: "创建 webhook",
          details: "Webhook 详情",
          payload: "负载 URL",
          question: "您希望触发此 webhook 的事件有哪些？",
          error: "URL 为必填项",
        },
        secret_key: {
          title: "密钥",
          message: "生成令牌以登录 webhook 负载",
        },
        options: {
          all: "发送所有内容",
          individual: "选择单个事件",
        },
        toasts: {
          created: {
            title: "Webhook 已创建",
            message: "Webhook 已成功创建",
          },
          not_created: {
            title: "Webhook 未创建",
            message: "无法创建 webhook",
          },
          updated: {
            title: "Webhook 已更新",
            message: "Webhook 已成功更新",
          },
          not_updated: {
            title: "Webhook 未更新",
            message: "无法更新 webhook",
          },
          removed: {
            title: "Webhook 已移除",
            message: "Webhook 已成功移除",
          },
          not_removed: {
            title: "Webhook 未移除",
            message: "无法移除 webhook",
          },
          secret_key_copied: {
            message: "密钥已复制到剪贴板。",
          },
          secret_key_not_copied: {
            message: "复制密钥时出错。",
          },
        },
      },
      api_tokens: {
        heading: "API 令牌",
        description: "生成安全的 API 令牌，将您的数据与外部系统和应用程序集成。",
        title: "API 令牌",
        add_token: "添加访问令牌",
        create_token: "创建令牌",
        never_expires: "永不过期",
        generate_token: "生成令牌",
        generating: "生成中",
        delete: {
          title: "删除 API 令牌",
          description: "使用此令牌的任何应用程序将无法再访问 Plane 数据。此操作无法撤消。",
          success: {
            title: "成功！",
            message: "API 令牌已成功删除",
          },
          error: {
            title: "错误！",
            message: "无法删除 API 令牌",
          },
        },
      },
      integrations: {
        title: "集成",
        page_title: "在可用的应用或您自己的应用中使用您的 Plane 数据。",
        page_description: "查看此工作区或您正在使用的所有集成。",
      },
      imports: {
        title: "导入",
      },
      worklogs: {
        title: "工作日志",
      },
      group_syncing: {
        title: "组同步",
        heading: "组同步",
        description:
          "将身份提供者组与项目和角色关联。当 IdP 中的组成员身份发生变化时，用户访问权限将自动更新，简化入职和离职流程。",
        enable: {
          title: "启用组同步",
          description: "根据身份提供者组自动将用户添加到项目。",
        },
        config: {
          title: "配置组同步",
          description: "设置身份提供者组如何映射到项目和角色。",
          sync_on_login: {
            title: "登录时同步",
            description: "用户登录时更新组成员身份和项目访问权限。",
          },
          sync_offline: {
            title: "离线同步",
            description: "每六小时自动运行同步，无需等待用户登录。",
          },
          auto_remove: {
            title: "自动移除",
            description: "当用户不再匹配组时，自动将其从项目中移除。",
          },
          group_attribute_key: {
            title: "组属性键",
            description: "用于识别和同步用户组的身份提供者属性。",
            placeholder: "组",
          },
        },
        group_mapping: {
          title: "组映射",
          description: "将身份提供者组与项目和角色关联。",
          button_text: "添加新组同步",
        },
        toast: {
          updating: "正在更新组同步功能",
          success: "组同步功能已成功更新。",
          error: "更新组同步功能失败！",
        },
        delete_modal: {
          title: "删除组同步",
          content: "此身份组的新用户将不再被添加到项目。已添加的用户将保留其当前角色。",
        },
        modal: {
          idp_group_name: {
            text: "用户组",
            required: "用户组为必填项",
            placeholder: "输入 IdP 组名称",
          },
          project: {
            text: "项目",
            required: "项目为必填项",
            placeholder: "选择项目",
          },
          default_role: {
            text: "项目角色",
            required: "项目角色为必填项",
            placeholder: "选择项目角色",
          },
        },
      },
      identity: {
        title: "身份",
        heading: "身份",
        description: "配置您的域名并启用单点登录",
      },
      project_states: {
        title: "项目状态",
      },
      projects: {
        title: "项目",
        description: "管理项目状态、启用项目标签及其他配置。",
        tabs: {
          states: "项目状态",
          labels: "项目标签",
        },
      },
      teamspaces: {
        title: "团队空间",
      },
      initiatives: {
        title: "计划",
      },
      customers: {
        title: "客户",
      },
      releases: {
        title: "发布",
        update_release: "更新发布",
        create_release: "创建发布",
        errors: {
          release_not_found: "您要查找的发布不存在。",
          unknown: "出了点问题。请重试。",
        },
      },

      cancel_trial: {
        title: "请先取消试用期。",
        description: "您目前正在试用我们的付费计划。请先取消试用后再继续。",
        dismiss: "关闭",
        cancel: "取消试用",
        cancel_success_title: "试用已取消。",
        cancel_success_message: "现在您可以删除工作空间了。",
        cancel_error_title: "操作失败。",
        cancel_error_message: "请重试。",
      },
      applications: {
        title: "应用程序",
        applicationId_copied: "应用ID已复制到剪贴板",
        clientId_copied: "客户端ID已复制到剪贴板",
        clientSecret_copied: "客户端密钥已复制到剪贴板",
        third_party_apps: "第三方应用",
        your_apps: "您的应用",
        connect: "连接",
        connected: "已连接",
        install: "安装",
        installed: "已安装",
        configure: "配置",
        app_available: "您已使此应用可用于Plane工作空间",
        app_available_description: "连接Plane工作空间以开始使用",
        client_id_and_secret: "客户端ID和密钥",
        client_id_and_secret_description: "复制并保存此密钥。关闭后您将无法再次查看此密钥。",
        client_id_and_secret_download: "您可以从这里下载包含密钥的CSV文件。",
        application_id: "应用ID",
        client_id: "客户端ID",
        client_secret: "客户端密钥",
        export_as_csv: "导出为CSV",
        slug_already_exists: "别名已存在",
        failed_to_create_application: "创建应用程序失败",
        upload_logo: "上传标志",
        app_name_title: "您将如何命名此应用",
        app_name_error: "应用名称为必填项",
        app_short_description_title: "为此应用提供简短描述",
        app_short_description_error: "应用简短描述为必填项",
        app_description_title: {
          label: "详细描述",
          placeholder: "为市场编写详细描述。按 '/' 查看命令。",
        },
        authorization_grant_type: {
          title: "连接类型",
          description: "选择您的应用程序应该为工作区安装一次，还是让每个用户连接自己的账户",
        },
        app_description_error: "应用描述为必填项",
        app_slug_title: "应用别名",
        app_slug_error: "应用别名为必填项",
        app_maker_title: "应用制作者",
        app_maker_error: "应用制作者为必填项",
        webhook_url_title: "Webhook URL",
        webhook_url_error: "Webhook URL为必填项",
        invalid_webhook_url_error: "无效的Webhook URL",
        redirect_uris_title: "重定向URI",
        redirect_uris_error: "重定向URI为必填项",
        invalid_redirect_uris_error: "无效的重定向URI",
        redirect_uris_description:
          "输入应用将在用户后重定向到的URI，用空格分隔，例如 https://example.com https://example.com/",
        authorized_javascript_origins_title: "授权的JavaScript来源",
        authorized_javascript_origins_error: "授权的JavaScript来源为必填项",
        invalid_authorized_javascript_origins_error: "无效的授权JavaScript来源",
        authorized_javascript_origins_description:
          "输入应用将被允许发出请求的来源，用空格分隔，例如 app.com example.com",
        create_app: "创建应用",
        update_app: "更新应用",
        build_your_own_app: "构建您自己的应用",
        edit_app_details: "编辑应用详情",
        regenerate_client_secret_description: "重新生成客户端密钥。重新生成后，您可以复制密钥或将其下载到CSV文件中。",
        regenerate_client_secret: "重新生成客户端密钥",
        regenerate_client_secret_confirm_title: "确定要重新生成客户端密钥吗？",
        regenerate_client_secret_confirm_description: "使用此密钥的应用将停止工作。您需要在应用中更新密钥。",
        regenerate_client_secret_confirm_cancel: "取消",
        regenerate_client_secret_confirm_regenerate: "重新生成",
        read_only_access_to_workspace: "对您的工作空间的只读访问",
        write_access_to_workspace: "对您的工作空间的写入访问",
        read_only_access_to_user_profile: "对您的用户配置文件的只读访问",
        write_access_to_user_profile: "对您的用户配置文件的写入访问",
        connect_app_to_workspace: "将{app}连接到您的工作空间{workspace}",
        user_permissions: "用户权限",
        user_permissions_description: "用户权限用于授予对用户配置文件的访问权限。",
        workspace_permissions: "工作空间权限",
        workspace_permissions_description: "工作空间权限用于授予对工作空间的访问权限。",
        with_the_permissions: "具有权限",
        app_consent_title: "{app}正在请求访问您的Plane工作空间和配置文件。",
        choose_workspace_to_connect_app_with: "选择要连接应用的工作空间",
        app_consent_workspace_permissions_title: "{app}想要",
        app_consent_user_permissions_title: "{app}还可以请求用户对以下资源的权限。这些权限将仅由用户请求和授权。",
        app_consent_accept_title: "通过接受",
        app_consent_accept_1: "您授予应用在Plane内部或外部可以使用应用的任何地方访问您的Plane数据的权限",
        app_consent_accept_2: "您同意{app}的隐私政策和使用条款",
        accepting: "接受中...",
        accept: "接受",
        categories: "类别",
        select_app_categories: "选择应用类别",
        categories_title: "类别",
        categories_error: "类别是必填项",
        invalid_categories_error: "无效的类别",
        categories_description: "选择最能描述应用的类别",
        supported_plans: "支持的方案",
        supported_plans_description: "选择可以安装此应用的工作区方案。留空以允许所有方案。",
        select_plans: "选择方案",
        privacy_policy_url_title: "隐私政策URL",
        privacy_policy_url_error: "隐私政策URL是必填项",
        invalid_privacy_policy_url_error: "无效的隐私政策URL",
        terms_of_service_url_title: "使用条款URL",
        terms_of_service_url_error: "使用条款URL是必填项",
        invalid_terms_of_service_url_error: "无效的使用条款URL",
        support_url_title: "支持URL",
        support_url_error: "支持URL是必填项",
        invalid_support_url_error: "无效的支持URL",
        video_url_title: "视频URL",
        video_url_error: "视频URL是必填项",
        invalid_video_url_error: "无效的视频URL",
        setup_url_title: "设置URL",
        setup_url_error: "设置URL是必填项",
        invalid_setup_url_error: "无效的设置URL",
        configuration_url_title: "配置URL",
        configuration_url_error: "配置URL是必填项",
        invalid_configuration_url_error: "无效的配置URL",
        contact_email_title: "联系邮箱",
        contact_email_error: "联系邮箱是必填项",
        invalid_contact_email_error: "无效的联系邮箱",
        upload_attachments: "上传附件",
        uploading_images: "上传 {count, plural, one {张图片} other {张图片}}",
        drop_images_here: "将图片拖到这里",
        click_to_upload_images: "点击上传图片",
        invalid_file_or_exceeds_size_limit: "无效的文件或超过大小限制 ({size} MB)",
        uploading: "上传中...",
        upload_and_save: "上传并保存",
        app_credentials_regenrated: {
          title: "应用凭证已成功重新生成",
          description: "请在所有使用的地方替换客户端密钥。之前的密钥已不再有效。",
        },
        app_created: {
          title: "应用已成功创建",
          description: "使用凭证将应用安装到 Plane 工作区中",
        },
        installed_apps: "已安装的应用",
        all_apps: "所有应用",
        internal_apps: "内部应用",
        website: {
          title: "网站",
          description: "链接到您的应用程序网站。",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "应用创建者",
          description: "创建该应用的个人或组织。",
        },
        setup_url: {
          label: "设置 URL",
          description: "用户在安装应用时将被重定向到此 URL。",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "Webhook URL",
          description: "我们将在此接收来自安装了您应用的工作区的 Webhook 事件和更新。",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "重定向 URI（以空格分隔）",
          description: "用户在通过 Plane 认证后将被重定向到此路径。",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description: "此应用只能在工作区管理员安装后才能安装。请联系您的工作区管理员以继续。",
        enable_app_mentions: "启用应用提及",
        enable_app_mentions_tooltip: "启用此功能后，用户可以提及或分配工作项到此应用。",
        scopes: "范围",
        select_scopes: "选择范围",
        read_access_to: "只读访问",
        write_access_to: "写入访问",
        global_permission_expiration: "全局范围即将过期。请改用细粒度范围。例如，使用 project:read 代替全局读取。",
        selected_scopes: "已选 {count} 项",
        scopes_and_permissions: "范围与权限",
        read: "读取",
        write: "写入",
        scope_description: {
          projects: "访问项目及所有项目相关实体",
          wiki: "访问 Wiki 及所有 Wiki 相关实体",
          customers: "访问客户及所有客户相关实体",
          initiatives: "访问计划及所有计划相关实体",
          workspaces: "访问工作区及所有工作区相关实体",
          stickies: "访问便签及所有便签相关实体",
          teamspaces: "访问团队空间及所有团队空间相关实体",
          profile: "访问用户资料信息",
          agents: "访问代理以及所有代理相关实体",
          assets: "访问资产以及所有资产相关实体",
        },
        internal: "内部",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description: "使用与您的工作和知识库原生连接的 AI，让您的任务变得更智能、更快速。",
      },
    },
    empty_state: {
      api_tokens: {
        title: "尚未创建 API 令牌",
        description: "Plane API 可用于将您在 Plane 中的数据与任何外部系统集成。创建令牌以开始使用。",
      },
      webhooks: {
        title: "尚未添加 webhook",
        description: "创建 webhook 以接收实时更新并自动执行操作。",
      },
      exports: {
        title: "尚无导出",
        description: "每次导出时，您都会在这里有一个副本以供参考。",
      },
      imports: {
        title: "尚无导入",
        description: "在这里查找所有以前的导入并下载它们。",
      },
    },
  },
  profile: {
    label: "个人资料",
    page_label: "您的工作",
    work: "工作",
    details: {
      joined_on: "加入时间",
      time_zone: "时区",
    },
    stats: {
      workload: "工作量",
      overview: "概览",
      created: "已创建的工作项",
      assigned: "已分配的工作项",
      subscribed: "已订阅的工作项",
      state_distribution: {
        title: "按状态分类的工作项",
        empty: "创建工作项以在图表中查看按状态分类的工作项，以便更好地分析。",
      },
      priority_distribution: {
        title: "按优先级分类的工作项",
        empty: "创建工作项以在图表中查看按优先级分类的工作项，以便更好地分析。",
      },
      recent_activity: {
        title: "最近活动",
        empty: "我们找不到数据。请查看您的输入",
        button: "下载今天的活动",
        button_loading: "下载中",
      },
    },
    actions: {
      profile: "个人资料",
      security: "安全",
      activity: "活动",
      appearance: "外观",
      notifications: "通知",
      connections: "连接",
    },
    tabs: {
      summary: "摘要",
      assigned: "已分配",
      created: "已创建",
      subscribed: "已订阅",
      activity: "活动",
    },
    empty_state: {
      activity: {
        title: "尚无活动",
        description: "通过创建新工作项开始！为其添加详细信息和属性。在 Plane 中探索更多内容以查看您的活动。",
      },
      assigned: {
        title: "没有分配给您的工作项",
        description: "可以从这里跟踪分配给您的工作项。",
      },
      created: {
        title: "尚无工作项",
        description: "您创建的所有工作项都会出现在这里，直接在这里跟踪它们。",
      },
      subscribed: {
        title: "尚无工作项",
        description: "订阅您感兴趣的工作项，在这里跟踪所有这些工作项。",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "输入项目 ID",
      please_select_a_timezone: "请选择时区",
      archive_project: {
        title: "归档项目",
        description:
          "归档项目将从您的侧边导航中取消列出您的项目，但您仍然可以从项目页面访问它。您可以随时恢复或删除项目。",
        button: "归档项目",
      },
      delete_project: {
        title: "删除项目",
        description: "删除项目时，该项目内的所有数据和资源将被永久删除且无法恢复。",
        button: "删除我的项目",
      },
      toast: {
        success: "项目更新成功",
        error: "项目无法更新。请重试。",
      },
    },
    members: {
      label: "成员",
      project_lead: "项目负责人",
      default_assignee: "默认受理人",
      guest_super_permissions: {
        title: "为访客用户授予查看所有工作项的权限：",
        sub_heading: "这将允许访客查看所有项目工作项。",
      },
      invite_members: {
        title: "邀请成员",
        sub_heading: "邀请成员参与您的项目。",
        select_co_worker: "选择同事",
      },
      project_lead_description: "请选择该项目的项目负责人。",
      default_assignee_description: "请选择该项目的默认指派人。",
      project_subscribers: "项目订阅者",
      project_subscribers_description: "请选择将接收该项目通知的成员。",
    },
    states: {
      describe_this_state_for_your_members: "为您的成员描述此状态。",
      empty_state: {
        title: "{groupKey} 组中没有状态",
        description: "请创建一个新状态",
      },
    },
    labels: {
      label_title: "标签标题",
      label_title_is_required: "标签标题为必填项",
      label_max_char: "标签名称不应超过255个字符",
      toast: {
        error: "更新标签时出错",
      },
    },
    estimates: {
      label: "估算",
      title: "为我的项目启用估算",
      description: "它们有助于您传达团队的复杂性和工作量。",
      no_estimate: "无估算",
      new: "新估算系统",
      create: {
        custom: "自定义",
        start_from_scratch: "从头开始",
        choose_template: "选择模板",
        choose_estimate_system: "选择估算系统",
        enter_estimate_point: "输入估算点数",
        step: "步骤 {step} 共 {total}",
        label: "创建估算",
      },
      toasts: {
        created: {
          success: {
            title: "已创建估算点数",
            message: "估算点数创建成功",
          },
          error: {
            title: "无法创建估算点数",
            message: "无法创建新的估算点数，请重试",
          },
        },
        updated: {
          success: {
            title: "已更新估算",
            message: "您项目中的估算点数已更新",
          },
          error: {
            title: "无法更新估算",
            message: "无法更新估算，请重试",
          },
        },
        enabled: {
          success: {
            title: "成功！",
            message: "已启用估算",
          },
        },
        disabled: {
          success: {
            title: "成功！",
            message: "已禁用估算",
          },
          error: {
            title: "错误！",
            message: "无法禁用估算。请重试",
          },
        },
        reorder: {
          success: {
            title: "估算已重新排序",
            message: "估算已在您的项目中重新排序。",
          },
          error: {
            title: "估算重新排序失败",
            message: "我们无法重新排序估算，请重试",
          },
        },
      },
      validation: {
        min_length: "估算需要大于0。",
        unable_to_process: "我们无法处理您的请求，请重试。",
        numeric: "估算需要是数值。",
        character: "估算需要是字符值。",
        empty: "估算值不能为空。",
        already_exists: "估算值已存在。",
        unsaved_changes: "您有未保存的更改，请在点击完成前保存。",
        remove_empty: "估算不能为空。请在每个字段中输入值或删除没有值的字段。",
        fill: "请填写此估算字段",
        repeat: "估算值不能重复",
      },
      edit: {
        title: "编辑估算系统",
        add_or_update: {
          title: "添加、更新或删除估算",
          description: "通过添加、更新或删除点数或类别来管理当前系统。",
        },
        switch: {
          title: "更改估算类型",
          description: "将点数系统转换为类别系统，反之亦然。",
        },
      },
      switch: "切换估算系统",
      current: "当前估算系统",
      select: "选择估算系统",
    },
    automations: {
      label: "自动化",
      "auto-archive": {
        title: "自动归档已关闭的工作项",
        description: "Plane 将自动归档已完成或已取消的工作项。",
        duration: "自动归档已关闭",
      },
      "auto-close": {
        title: "自动关闭工作项",
        description: "Plane 将自动关闭尚未完成或取消的工作项。",
        duration: "自动关闭不活跃",
        auto_close_status: "自动关闭状态",
      },
    },
    empty_state: {
      labels: {
        title: "尚无标签",
        description: "创建标签以帮助组织和筛选项目中的工作项。",
      },
      estimates: {
        title: "尚无估算系统",
        description: "创建一组估算以传达每个工作项的工作量。",
        primary_button: "添加估算系统",
      },
      integrations: {
        title: "未配置集成",
        description: "配置 GitHub 和其他集成以同步您的项目工作项。",
      },
    },
    initiatives: {
      heading: "计划",
      sub_heading: "在 Plane 中为所有工作解锁最高级别的组织。",
      title: "启用计划",
      description: "设置更大的目标以监控进度",
      toast: {
        updating: "正在更新计划功能",
        enable_success: "计划功能已成功启用。",
        disable_success: "计划功能已成功禁用。",
        error: "更新计划功能失败！",
      },
    },
    customers: {
      heading: "客户",
      settings_heading: "根据客户的重要需求管理工作。",
      settings_sub_heading:
        "将客户请求转换为工作项，根据请求分配优先级，并将工作项的状态汇总到客户记录中。很快，你将能够集成你的 CRM 或支持工具，以更好地根据客户属性管理工作。",
    },
    epics: {
      properties: {
        title: "属性",
        description: "为您的史诗添加自定义属性。",
      },
      disabled: "已禁用",
    },
    cycles: {
      auto_schedule: {
        heading: "自动安排周期",
        description: "无需手动设置即可保持周期运行。",
        tooltip: "根据您选择的计划自动创建新周期。",
        edit_button: "编辑",
        form: {
          cycle_title: {
            label: "周期标题",
            placeholder: "标题",
            tooltip: "标题将为后续周期添加编号。例如：设计 - 1/2/3",
            validation: {
              required: "周期标题为必填项",
              max_length: "标题不得超过255个字符",
            },
          },
          cycle_duration: {
            label: "周期持续时间",
            unit: "周",
            validation: {
              required: "周期持续时间为必填项",
              min: "周期持续时间必须至少为1周",
              max: "周期持续时间不得超过30周",
              positive: "周期持续时间必须为正数",
            },
          },
          cooldown_period: {
            label: "冷却期",
            unit: "天",
            tooltip: "下一个周期开始前的周期间隔暂停期。",
            validation: {
              required: "冷却期为必填项",
              negative: "冷却期不能为负数",
            },
          },
          start_date: {
            label: "周期开始日",
            validation: {
              required: "开始日期为必填项",
              past: "开始日期不能是过去的日期",
            },
          },
          number_of_cycles: {
            label: "未来周期数",
            validation: {
              required: "周期数为必填项",
              min: "至少需要1个周期",
              max: "无法安排超过3个周期",
            },
          },
          auto_rollover: {
            label: "工作项自动结转",
            tooltip: "在周期完成的当天，将所有未完成的工作项移至下一个周期。",
          },
        },
        toast: {
          toggle: {
            loading_enable: "正在启用自动安排周期",
            loading_disable: "正在禁用自动安排周期",
            success: {
              title: "成功！",
              message: "自动安排周期已成功切换。",
            },
            error: {
              title: "错误！",
              message: "切换自动安排周期失败。",
            },
          },
          save: {
            loading: "正在保存自动安排周期配置",
            success: {
              title: "成功！",
              message_create: "自动安排周期配置已成功保存。",
              message_update: "自动安排周期配置已成功更新。",
            },
            error: {
              title: "错误！",
              message_create: "保存自动安排周期配置失败。",
              message_update: "更新自动安排周期配置失败。",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "周期",
        short_title: "周期",
        description: "在灵活的时间段内安排工作，以适应该项目独特的节奏和步调。",
        toggle_title: "启用周期",
        toggle_description: "在集中的时间段内规划工作。",
      },
      modules: {
        title: "模块",
        short_title: "模块",
        description: "将工作组织成具有专门负责人和受让人的子项目。",
        toggle_title: "启用模块",
        toggle_description: "项目成员将能够创建和编辑模块。",
      },
      views: {
        title: "视图",
        short_title: "视图",
        description: "保存自定义排序、过滤器和显示选项，或与团队共享。",
        toggle_title: "启用视图",
        toggle_description: "项目成员将能够创建和编辑视图。",
      },
      pages: {
        title: "页面",
        short_title: "页面",
        description: "创建和编辑自由格式的内容：笔记、文档、任何内容。",
        toggle_title: "启用页面",
        toggle_description: "项目成员将能够创建和编辑页面。",
      },
      intake: {
        intake_responsibility: "接收责任",
        intake_sources: "接收来源",
        title: "接收",
        short_title: "接收",
        description: "让非成员分享错误、反馈和建议；而不会中断您的工作流程。",
        toggle_title: "启用接收",
        toggle_description: "允许项目成员在应用中创建接收请求。",
        toggle_tooltip_on: "请项目管理员代为开启。",
        toggle_tooltip_off: "请项目管理员代为关闭。",
        notify_assignee: {
          title: "通知负责人",
          description: "对于新的接收请求，默认负责人将通过通知收到提醒",
        },
        in_app: {
          title: "应用内",
          description: "从工作区成员和访客获取新的工作项，不影响现有工作项。",
        },
        email: {
          title: "电子邮件",
          description: "从任何向 Plane 邮箱地址发送邮件的人收集新的工作项。",
          fieldName: "电子邮件 ID",
        },
        form: {
          title: "表单",
          description: "让工作区外的人通过专用安全表单为您创建潜在的新工作项。",
          fieldName: "默认表单 URL",
          create_forms: "使用工作项类型创建表单",
          manage_forms: "管理表单",
          manage_forms_tooltip: "请工作区管理员代为管理。",
          create_form: "创建表单",
          edit_form: "编辑表单详情",
          form_title: "表单标题",
          form_title_required: "表单标题为必填",
          work_item_type: "工作项类型",
          remove_property: "移除属性",
          select_properties: "选择属性",
          search_placeholder: "搜索属性",
          toasts: {
            success_create: "接收表单已成功创建",
            success_update: "接收表单已成功更新",
            error_create: "无法创建接收表单",
            error_update: "无法更新接收表单",
          },
        },
        toasts: {
          set: {
            loading: "正在设置负责人...",
            success: {
              title: "成功！",
              message: "负责人设置成功。",
            },
            error: {
              title: "错误！",
              message: "设置负责人时出现问题。请重试。",
            },
          },
        },
      },
      time_tracking: {
        title: "时间跟踪",
        short_title: "时间跟踪",
        description: "记录在工作项和项目上花费的时间。",
        toggle_title: "启用时间跟踪",
        toggle_description: "项目成员将能够记录工作时间。",
      },
      milestones: {
        title: "里程碑",
        short_title: "里程碑",
        description: "里程碑提供了一个层，用于将工作项对齐到共享的完成日期。",
        toggle_title: "启用里程碑",
        toggle_description: "按里程碑截止日期组织工作项。",
      },
    },
  },
  project_cycles: {
    add_cycle: "添加周期",
    more_details: "更多详情",
    cycle: "周期",
    update_cycle: "更新周期",
    create_cycle: "创建周期",
    no_matching_cycles: "没有匹配的周期",
    remove_filters_to_see_all_cycles: "移除筛选器以查看所有周期",
    remove_search_criteria_to_see_all_cycles: "移除搜索条件以查看所有周期",
    only_completed_cycles_can_be_archived: "只能归档已完成的周期",
    start_date: "开始日期",
    end_date: "结束日期",
    in_your_timezone: "在您的时区",
    transfer_work_items: "转移 {count} 工作项",
    transfer: {
      no_cycles_available: "没有其他可用的周期来转移工作项。",
    },
    date_range: "日期范围",
    add_date: "添加日期",
    active_cycle: {
      label: "活动周期",
      progress: "进度",
      chart: "燃尽图",
      priority_issue: "优先工作项",
      assignees: "受理人",
      issue_burndown: "工作项燃尽",
      ideal: "理想",
      current: "当前",
      labels: "标签",
      trailing: "落后",
      leading: "领先",
    },
    upcoming_cycle: {
      label: "即将到来的周期",
    },
    completed_cycle: {
      label: "已完成的周期",
    },
    status: {
      days_left: "剩余天数",
      completed: "已完成",
      yet_to_start: "尚未开始",
      in_progress: "进行中",
      draft: "草稿",
    },
    action: {
      restore: {
        title: "恢复周期",
        success: {
          title: "周期已恢复",
          description: "周期已被恢复。",
        },
        failed: {
          title: "周期恢复失败",
          description: "无法恢复周期。请重试。",
        },
      },
      favorite: {
        loading: "正在将周期添加到收藏",
        success: {
          description: "周期已添加到收藏。",
          title: "成功！",
        },
        failed: {
          description: "无法将周期添加到收藏。请重试。",
          title: "错误！",
        },
      },
      unfavorite: {
        loading: "正在从收藏中移除周期",
        success: {
          description: "周期已从收藏中移除。",
          title: "成功！",
        },
        failed: {
          description: "无法从收藏中移除周期。请重试。",
          title: "错误！",
        },
      },
      update: {
        loading: "正在更新周期",
        success: {
          description: "周期更新成功。",
          title: "成功！",
        },
        failed: {
          description: "更新周期时出错。请重试。",
          title: "错误！",
        },
        error: {
          already_exists: "在给定日期范围内已存在周期，如果您想创建草稿周期，可以通过移除两个日期来实现。",
        },
      },
    },
    empty_state: {
      general: {
        title: "在周期中分组和时间框定您的工作。",
        description: "将工作按时间框分解，从项目截止日期倒推设置日期，并作为团队取得切实的进展。",
        primary_button: {
          text: "设置您的第一个周期",
          comic: {
            title: "周期是重复的时间框。",
            description: "冲刺、迭代或您用于每周或每两周跟踪工作的任何其他术语都是一个周期。",
          },
        },
      },
      no_issues: {
        title: "尚未向周期添加工作项",
        description: "添加或创建您希望在此周期内时间框定和交付的工作项",
        primary_button: {
          text: "创建新工作项",
        },
        secondary_button: {
          text: "添加现有工作项",
        },
      },
      completed_no_issues: {
        title: "周期中没有工作项",
        description: "周期中没有工作项。工作项已被转移或隐藏。要查看隐藏的工作项（如果有），请相应更新您的显示属性。",
      },
      active: {
        title: "没有活动周期",
        description: "活动周期包括其范围内包含今天日期的任何时期。在这里查找活动周期的进度和详细信息。",
      },
      archived: {
        title: "尚无已归档的周期",
        description: "为了整理您的项目，归档已完成的周期。归档后可以在这里找到它们。",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "创建工作项并将其分配给某人，甚至是您自己",
        description:
          "将工作项视为工作、任务或待完成的工作。工作项及其子工作项通常是基于时间的、分配给团队成员的可执行项。您的团队通过创建、分配和完成工作项来推动项目实现其目标。",
        primary_button: {
          text: "创建您的第一个工作项",
          comic: {
            title: "工作项是 Plane 中的基本构建块。",
            description: "重新设计 Plane 界面、重塑公司品牌或启动新的燃料喷射系统都是可能包含子工作项的工作项示例。",
          },
        },
      },
      no_archived_issues: {
        title: "尚无已归档的工作项",
        description: "通过手动或自动化方式，您可以归档已完成或已取消的工作项。归档后可以在这里找到它们。",
        primary_button: {
          text: "设置自动化",
        },
      },
      issues_empty_filter: {
        title: "未找到符合筛选条件的工作项",
        secondary_button: {
          text: "清除所有筛选条件",
        },
      },
    },
  },
  project_module: {
    add_module: "添加模块",
    update_module: "更新模块",
    create_module: "创建模块",
    archive_module: "归档模块",
    restore_module: "恢复模块",
    delete_module: "删除模块",
    empty_state: {
      general: {
        title: "将项目里程碑映射到模块，轻松跟踪汇总工作。",
        description:
          "属于逻辑层次结构父级的一组工作项形成一个模块。将其视为按项目里程碑跟踪工作的方式。它们有自己的周期和截止日期以及分析功能，帮助您了解距离里程碑的远近。",
        primary_button: {
          text: "构建您的第一个模块",
          comic: {
            title: "模块帮助按层次结构对工作进行分组。",
            description: "购物车模块、底盘模块和仓库模块都是这种分组的好例子。",
          },
        },
      },
      no_issues: {
        title: "模块中没有工作项",
        description: "创建或添加您想作为此模块一部分完成的工作项",
        primary_button: {
          text: "创建新工作项",
        },
        secondary_button: {
          text: "添加现有工作项",
        },
      },
      archived: {
        title: "尚无已归档的模块",
        description: "为了整理您的项目，归档已完成或已取消的模块。归档后可以在这里找到它们。",
      },
      sidebar: {
        in_active: "此模块尚未激活。",
        invalid_date: "日期无效。请输入有效日期。",
      },
    },
    quick_actions: {
      archive_module: "归档模块",
      archive_module_description: `只有已完成或已取消的
模块可以归档。`,
      delete_module: "删除模块",
    },
    toast: {
      copy: {
        success: "模块链接已复制到剪贴板",
      },
      delete: {
        success: "模块删除成功",
        error: "删除模块失败",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "为您的项目保存筛选视图。根据需要创建任意数量",
        description:
          "视图是您经常使用或想要轻松访问的一组已保存的筛选条件。项目中的所有同事都可以看到每个人的视图，并选择最适合他们需求的视图。",
        primary_button: {
          text: "创建您的第一个视图",
          comic: {
            title: "视图基于工作项属性运作。",
            description: "您可以在此处创建一个视图，根据需要使用任意数量的属性作为筛选条件。",
          },
        },
      },
      filter: {
        title: "没有匹配的视图",
        description: `没有符合搜索条件的视图。
创建一个新视图。`,
      },
    },
    delete_view: {
      title: "您确定要删除此视图吗？",
      content: "如果您确认，您为此视图选择的所有排序、筛选和显示选项 + 布局将被永久删除，无法恢复。",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "写笔记、文档或完整的知识库。让 Plane 的 AI 助手 Galileo 帮助您开始",
        description:
          "页面是 Plane 中的思维记录空间。记录会议笔记，轻松格式化，嵌入工作项，使用组件库进行布局，并将它们全部保存在项目上下文中。要快速完成任何文档，可以通过快捷键或点击按钮调用 Plane 的 AI Galileo。",
        primary_button: {
          text: "创建您的第一个页面",
        },
      },
      private: {
        title: "尚无私人页面",
        description: "在这里保存您的私人想法。准备好分享时，团队就在一键之遥。",
        primary_button: {
          text: "创建您的第一个页面",
        },
      },
      public: {
        title: "尚无公共页面",
        description: "在这里查看与项目中所有人共享的页面。",
        primary_button: {
          text: "创建您的第一个页面",
        },
      },
      archived: {
        title: "尚无已归档的页面",
        description: "归档不在您关注范围内的页面。需要时可以在这里访问它们。",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "未找到结果",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "未找到匹配的工作项",
      },
      no_issues: {
        title: "未找到工作项",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "尚无评论",
        description: "评论可用作工作项的讨论和跟进空间",
      },
    },
  },
  notification: {
    label: "收件箱",
    page_label: "{workspace} - 收件箱",
    options: {
      mark_all_as_read: "全部标记为已读",
      mark_read: "标记为已读",
      mark_unread: "标记为未读",
      refresh: "刷新",
      filters: "收件箱筛选",
      show_unread: "显示未读",
      show_snoozed: "显示已暂停",
      show_archived: "显示已归档",
      mark_archive: "归档",
      mark_unarchive: "取消归档",
      mark_snooze: "暂停",
      mark_unsnooze: "取消暂停",
    },
    toasts: {
      read: "通知已标记为已读",
      unread: "通知已标记为未读",
      archived: "通知已标记为已归档",
      unarchived: "通知已标记为未归档",
      snoozed: "通知已暂停",
      unsnoozed: "通知已取消暂停",
    },
    empty_state: {
      detail: {
        title: "选择以查看详情。",
      },
      all: {
        title: "没有分配的工作项",
        description: "在这里可以看到分配给您的工作项的更新",
      },
      mentions: {
        title: "没有分配的工作项",
        description: "在这里可以看到分配给您的工作项的更新",
      },
    },
    tabs: {
      all: "全部",
      mentions: "提及",
    },
    filter: {
      assigned: "分配给我",
      created: "由我创建",
      subscribed: "由我订阅",
    },
    snooze: {
      "1_day": "1 天",
      "3_days": "3 天",
      "5_days": "5 天",
      "1_week": "1 周",
      "2_weeks": "2 周",
      custom: "自定义",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "向周期添加工作项以查看其进度",
      },
      chart: {
        title: "向周期添加工作项以查看燃尽图。",
      },
      priority_issue: {
        title: "一目了然地观察周期中处理的高优先级工作项。",
      },
      assignee: {
        title: "为工作项添加负责人以查看按负责人划分的工作明细。",
      },
      label: {
        title: "为工作项添加标签以查看按标签划分的工作明细。",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "项目未启用收集功能。",
        description:
          "收集功能帮助您管理项目的传入请求，并将其添加为工作流中的工作项。从项目设置启用收集功能以管理请求。",
        primary_button: {
          text: "管理功能",
        },
      },
      cycle: {
        title: "此项目未启用周期功能。",
        description:
          "按时间框将工作分解，从项目截止日期倒推设置日期，并作为团队取得切实的进展。为您的项目启用周期功能以开始使用它们。",
        primary_button: {
          text: "管理功能",
        },
      },
      module: {
        title: "项目未启用模块功能。",
        description: "模块是项目的基本构建块。从项目设置启用模块以开始使用它们。",
        primary_button: {
          text: "管理功能",
        },
      },
      page: {
        title: "项目未启用页面功能。",
        description: "页面是项目的基本构建块。从项目设置启用页面以开始使用它们。",
        primary_button: {
          text: "管理功能",
        },
      },
      view: {
        title: "项目未启用视图功能。",
        description: "视图是项目的基本构建块。从项目设置启用视图以开始使用它们。",
        primary_button: {
          text: "管理功能",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "起草工作项",
    empty_state: {
      title: "半写的工作项，以及即将推出的评论将在这里显示。",
      description: "要试用此功能，请开始添加工作项并中途离开，或在下方创建您的第一个草稿。😉",
      primary_button: {
        text: "创建您的第一个草稿",
      },
    },
    delete_modal: {
      title: "删除草稿",
      description: "您确定要删除此草稿吗？此操作无法撤消。",
    },
    toasts: {
      created: {
        success: "草稿已创建",
        error: "无法创建工作项。请重试。",
      },
      deleted: {
        success: "草稿已删除",
      },
    },
  },
  stickies: {
    title: "您的便签",
    placeholder: "点击此处输入",
    all: "所有便签",
    "no-data": "记下一个想法，捕捉一个灵感，或记录一个突发奇想。添加便签开始使用。",
    add: "添加便签",
    search_placeholder: "按标题搜索",
    delete: "删除便签",
    delete_confirmation: "您确定要删除此便签吗？",
    empty_state: {
      simple: "记下一个想法，捕捉一个灵感，或记录一个突发奇想。添加便签开始使用。",
      general: {
        title: "便签是您随手记下的快速笔记和待办事项。",
        description: "通过创建随时随地都可以访问的便签，轻松捕捉您的想法和创意。",
        primary_button: {
          text: "添加便签",
        },
      },
      search: {
        title: "这与您的任何便签都不匹配。",
        description: `尝试使用不同的术语，或如果您确定
搜索是正确的，请告诉我们。`,
        primary_button: {
          text: "添加便签",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "便签名称不能超过100个字符。",
        already_exists: "已存在一个没有描述的便签",
      },
      created: {
        title: "便签已创建",
        message: "便签已成功创建",
      },
      not_created: {
        title: "便签未创建",
        message: "无法创建便签",
      },
      updated: {
        title: "便签已更新",
        message: "便签已成功更新",
      },
      not_updated: {
        title: "便签未更新",
        message: "无法更新便签",
      },
      removed: {
        title: "便签已移除",
        message: "便签已成功移除",
      },
      not_removed: {
        title: "便签未移除",
        message: "无法移除便签",
      },
    },
  },
  role_details: {
    guest: {
      title: "访客",
      description: "组织的外部成员可以被邀请为访客。",
    },
    member: {
      title: "成员",
      description: "可以在项目、周期和模块内读取、写入、编辑和删除实体",
    },
    admin: {
      title: "管理员",
      description: "在工作区内所有权限均设置为允许。",
    },
  },
  user_roles: {
    product_or_project_manager: "产品/项目经理",
    development_or_engineering: "开发/工程",
    founder_or_executive: "创始人/高管",
    freelancer_or_consultant: "自由职业者/顾问",
    marketing_or_growth: "市场/增长",
    sales_or_business_development: "销售/业务发展",
    support_or_operations: "支持/运营",
    student_or_professor: "学生/教授",
    human_resources: "人力资源",
    other: "其他",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "从 GitHub 仓库导入工作项并同步。",
    },
    jira: {
      title: "Jira",
      description: "从 Jira 项目和史诗导入工作项和史诗。",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "将工作项导出为 CSV 文件。",
      short_description: "导出为 CSV",
    },
    excel: {
      title: "Excel",
      description: "将工作项导出为 Excel 文件。",
      short_description: "导出为 Excel",
    },
    xlsx: {
      title: "Excel",
      description: "将工作项导出为 Excel 文件。",
      short_description: "导出为 Excel",
    },
    json: {
      title: "JSON",
      description: "将工作项导出为 JSON 文件。",
      short_description: "导出为 JSON",
    },
  },
  default_global_view: {
    all_issues: "所有工作项",
    assigned: "已分配",
    created: "已创建",
    subscribed: "已订阅",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "系统偏好",
      },
      light: {
        label: "浅色",
      },
      dark: {
        label: "深色",
      },
      light_contrast: {
        label: "浅色高对比度",
      },
      dark_contrast: {
        label: "深色高对比度",
      },
      custom: {
        label: "自定义主题",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "待办",
      planned: "已计划",
      in_progress: "进行中",
      paused: "已暂停",
      completed: "已完成",
      cancelled: "已取消",
    },
    layout: {
      list: "列表布局",
      board: "画廊布局",
      timeline: "时间线布局",
    },
    order_by: {
      name: "名称",
      progress: "进度",
      issues: "工作项数量",
      due_date: "截止日期",
      created_at: "创建日期",
      manual: "手动",
    },
  },
  cycle: {
    label: "{count, plural, one {周期} other {周期}}",
    no_cycle: "无周期",
  },
  module: {
    label: "{count, plural, one {模块} other {模块}}",
    no_module: "无模块",
  },
  description_versions: {
    last_edited_by: "最后编辑者",
    previously_edited_by: "之前编辑者",
    edited_by: "编辑者",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane 未能启动。这可能是因为一个或多个 Plane 服务启动失败。",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "请选择“查看日志”来查看 setup.sh 和 Docker 日志，以确认问题。",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "大纲",
        empty_state: {
          title: "缺少标题",
          description: "让我们在这个页面添加一些标题来在这里查看它们。",
        },
      },
      info: {
        label: "信息",
        document_info: {
          words: "字数",
          characters: "字符数",
          paragraphs: "段落数",
          read_time: "阅读时间",
        },
        actors_info: {
          edited_by: "编辑者",
          created_by: "创建者",
        },
        version_history: {
          label: "版本历史",
          current_version: "当前版本",
          highlight_changes: "高亮显示更改",
        },
      },
      assets: {
        label: "资源",
        download_button: "下载",
        empty_state: {
          title: "缺少图片",
          description: "添加图片以在这里查看它们。",
        },
      },
    },
    open_button: "打开导航面板",
    close_button: "关闭导航面板",
    outline_floating_button: "打开大纲",
  },
  workspace_dashboards: "仪表板",
  pi_chat: "AI 聊天",
  in_app: "应用内",
  forms: "表单",
  choose_workspace_for_integration: "选择工作区以连接此应用程序",
  integrations_description: "与 Plane 一起工作的应用程序必须连接到您是管理员的工作区",
  create_a_new_workspace: "创建新的工作区",
  learn_more_about_workspaces: "了解更多关于工作区的信息",
  no_workspaces_to_connect: "没有工作区可连接",
  no_workspaces_to_connect_description: "您需要创建工作区才能连接此应用程序",
  updates: {
    add_update: "添加更新",
    add_update_placeholder: "在这里输入您的更新",
    empty: {
      title: "还没有更新",
      description: "您可以在这里查看更新。",
    },
    delete: {
      title: "删除更新",
      confirmation: "您确定要删除此更新吗？此操作是不可逆的。",
      success: {
        title: "更新已删除",
        message: "更新已成功删除。",
      },
      error: {
        title: "更新未删除",
        message: "更新未删除。",
      },
    },
    update: {
      success: {
        title: "更新已更新",
        message: "更新已成功更新。",
      },
      error: {
        title: "更新未更新",
        message: "更新未更新。",
      },
    },
    reaction: {
      create: {
        success: {
          title: "反应已创建",
          message: "反应已成功创建。",
        },
        error: {
          title: "反应未创建",
          message: "反应未创建。",
        },
      },
    },
    remove: {
      success: {
        title: "反应已移除",
        message: "反应已成功移除。",
      },
      error: {
        title: "反应未移除",
        message: "反应未移除。",
      },
    },
    progress: {
      title: "进度",
      since_last_update: "自上次更新以来",
      comments: "{count, plural, other{# 评论}}",
    },
    create: {
      success: {
        title: "更新已创建",
        message: "更新已成功创建。",
      },
      error: {
        title: "更新未创建",
        message: "更新未创建。",
      },
    },
  },
  teamspaces: {
    label: "团队空间",
    empty_state: {
      general: {
        title: "团队空间可在 Plane 中实现更好的组织和跟踪。",
        description:
          "为每个现实世界的团队创建专用空间，与 Plane 中的其他工作空间分开，并根据团队的工作方式进行自定义。",
        primary_button: {
          text: "创建新的团队空间",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "您还没有链接任何团队空间。",
          description: "团队空间和项目所有者可以管理项目访问权限。",
        },
      },
      primary_button: {
        text: "链接团队空间",
      },
      secondary_button: {
        text: "了解更多",
      },
      table: {
        columns: {
          teamspaceName: "团队空间名称",
          members: "成员",
          accountType: "账户类型",
        },
        actions: {
          remove: {
            button: {
              text: "移除团队空间",
            },
            confirm: {
              title: "从{projectName}中移除{teamspaceName}",
              description: "当您从链接项目中移除此团队空间时，此处的成员将失去对链接项目的访问权限。",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "未找到匹配的团队空间",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title: "{count, plural, one {您已将团队空间链接到此项目。} other {您已将#个团队空间链接到此项目。}}",
            description:
              "{additionalCount, plural, =0 {团队空间{firstTeamspaceName}现已链接到此项目。} other {团队空间{firstTeamspaceName}和其他{additionalCount}个团队空间现已链接到此项目。}}",
          },
          error: {
            title: "操作未成功。",
            description: "请重试或刷新页面后重试。",
          },
        },
        remove_teamspace: {
          success: {
            title: "您已从该项目中移除该团队空间。",
            description: "团队空间{teamspaceName}已从{projectName}中移除。",
          },
          error: {
            title: "操作未成功。",
            description: "请重试或刷新页面后重试。",
          },
        },
      },
      link_teamspace: {
        placeholder: "搜索团队空间",
        info: {
          title: "添加团队空间将授予所有团队成员对此项目的访问权限。",
          link: "了解更多",
        },
        empty_state: {
          no_teamspaces: {
            title: "您没有可链接的团队空间。",
            description: "要么您不在可以链接的团队空间中，要么您已经链接了所有可用的团队空间。",
          },
          no_results: {
            title: "未找到匹配的团队空间。",
            description: "尝试其他搜索词或确保您有可链接的团队空间。",
          },
        },
        primary_button: {
          text: "链接选中的团队空间",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "创建团队特定的工作项。",
        description:
          "在任何链接项目中分配给该团队成员的工作项将自动显示在此处。如果您期望在此处看到一些工作项，请确保您的链接项目有分配给该团队成员的工作项或创建工作项。",
        primary_button: {
          text: "向链接项目添加工作项",
        },
      },
      work_items_empty_filter: {
        title: "应用的筛选器没有团队特定的工作项",
        description: "更改一些筛选器或清除所有筛选器以查看与此空间相关的工作项。",
        secondary_button: {
          text: "清除所有筛选器",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "您的链接项目中没有活动周期。",
        description: "链接项目中的活动周期将自动显示在此处。如果您期望看到活动周期，请确保它现在正在链接项目中运行。",
      },
      completed: {
        title: "您的链接项目中没有已完成的周期。",
        description:
          "链接项目中的已完成周期将自动显示在此处。如果您期望看到已完成的周期，请确保它在链接项目中也已完成。",
      },
      upcoming: {
        title: "您的链接项目中没有即将到来的周期。",
        description:
          "链接项目中的即将到来的周期将自动显示在此处。如果您期望看到即将到来的周期，请确保它也在链接项目中。",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "您团队的工作视图，不会干扰工作空间中的其他视图",
        description: "在仅为您的团队保存的视图中查看您团队的工作，与项目的视图分开。",
        primary_button: {
          text: "创建视图",
        },
      },
      filter: {
        title: "没有匹配的视图",
        description: `没有符合搜索条件的视图。
 创建一个新视图。`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "在团队页面中存储您团队的知识。",
        description:
          "与项目中的页面不同，您可以在此处的一组单独页面中保存特定于团队的知识。获取页面的所有功能，轻松创建最佳实践文档和团队维基。",
        primary_button: {
          text: "创建您的第一个团队页面",
        },
      },
      filter: {
        title: "没有匹配的页面",
        description: "移除筛选器以查看所有页面",
      },
      search: {
        title: "没有匹配的页面",
        description: "移除搜索条件以查看所有页面",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "您的链接项目中没有已发布的工作项。",
        description: "在一个或多个项目中创建一些工作项，以按日期、状态和优先级查看进度。",
      },
      relation: {
        blocking: {
          title: "您没有任何阻碍团队成员的工作项。",
          description: "干得好！您已为团队清除了道路。您是一个好的团队成员。",
        },
        blocked: {
          title: "没有任何团队成员的工作项阻碍您。",
          description: "好消息！您可以推进所有分配给您的工作项。",
        },
      },
      stats: {
        general: {
          title: "您的链接项目中没有已发布的工作项。",
          description: "在一个或多个项目中创建一些工作项，以查看按项目和团队成员分配的工作分布。",
        },
        filter: {
          title: "应用的筛选器没有团队统计数据。",
          description: "在一个或多个项目中创建一些工作项，以查看按项目和团队成员分配的工作分布。",
        },
      },
    },
  },
  initiatives: {
    overview: "概览",
    label: "计划",
    placeholder: "{count, plural, one{# 计划} other{# 计划}}",
    add_initiative: "添加计划",
    create_initiative: "创建计划",
    update_initiative: "更新计划",
    initiative_name: "计划名称",
    all_initiatives: "所有计划",
    delete_initiative: "删除计划",
    fill_all_required_fields: "请填写所有必填字段。",
    toast: {
      create_success: "计划 {name} 创建成功。",
      create_error: "创建计划失败。请重试！",
      update_success: "计划 {name} 更新成功。",
      update_error: "更新计划失败。请重试！",
      delete: {
        success: "计划删除成功。",
        error: "删除计划失败",
      },
      link_copied: "计划链接已复制到剪贴板。",
      project_update_success: "计划项目更新成功。",
      project_update_error: "更新计划项目失败。请重试！",
      epic_update_success: "史诗{count, plural, one {已成功添加到计划。} other {已成功添加到计划。}}",
      epic_update_error: "将史诗添加到计划失败。请稍后重试。",
      state_update_success: "倡议状态已成功更新。",
      state_update_error: "更新倡议状态失败。请重试！",
      label_update_error: "无法更新倡议标签。请再试一次！",
    },
    empty_state: {
      general: {
        title: "使用计划在最高层级组织工作",
        description:
          "当您需要组织跨越多个项目和团队的工作时，计划就派上用场了。将项目和史诗连接到计划，查看自动汇总的更新，在深入细节之前先看全局。",
        primary_button: {
          text: "创建计划",
        },
      },
      search: {
        title: "没有匹配的计划",
        description: `未检测到符合匹配条件的计划。
 创建一个新计划。`,
      },
      not_found: {
        title: "计划不存在",
        description: "您要查找的计划不存在、已被归档或已被删除。",
        primary_button: {
          text: "查看其他计划",
        },
      },
      epics: {
        title: "没有匹配的史诗",
        subHeading: "要查看所有史诗，请清除所有应用的筛选器。",
        action: "清除筛选器",
      },
    },
    scope: {
      view_scope: "查看范围",
      breakdown: "范围分解",
      add_scope: "添加范围",
      label: "范围",
      empty_state: {
        title: "尚未添加范围",
        description: "将项目或史诗添加到此计划以开始。",
        primary_button: {
          text: "添加范围",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "标签",
        description: "使用标签来组织和规划您的计划。",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "删除标签",
        content: "您确定要删除 {labelName} 吗？这将从所有计划中移除该标签，并从所有正在以此标签进行筛选的视图中移除。",
      },
      toast: {
        delete_error: "无法删除计划标签。请重试。",
        label_already_exists: "标签已存在",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title: "写笔记、文档或完整的知识库。让 Galileo，Plane 的 AI 助手，帮助您开始",
        description:
          "页面是 Plane 中的思考空间。记录会议笔记，轻松格式化，嵌入工作项，使用组件库布局，并将它们全部保存在项目的上下文中。要快速完成任何文档，使用快捷键或点击按钮调用 Plane 的 AI Galileo。",
        primary_button: {
          text: "创建您的第一个页面",
        },
      },
      private: {
        title: "还没有私人页面",
        description: "在这里保存您的私人想法。当您准备好分享时，团队就在一键之遥。",
        primary_button: {
          text: "创建您的第一个页面",
        },
      },
      public: {
        title: "还没有工作空间页面",
        description: "在这里查看与工作空间中所有人共享的页面。",
        primary_button: {
          text: "创建您的第一个页面",
        },
      },
      archived: {
        title: "还没有已归档的页面",
        description: "归档不在您关注范围内的页面。需要时可以在这里访问它们。",
      },
    },
  },
  epics: {
    label: "史诗",
    no_epics_selected: "未选择史诗",
    add_selected_epics: "添加选定的史诗",
    epic_link_copied_to_clipboard: "史诗链接已复制到剪贴板。",
    project_link_copied_to_clipboard: "项目链接已复制到剪贴板",
    empty_state: {
      general: {
        title: "创建史诗并将其分配给某人，甚至是您自己",
        description:
          "对于跨越多个周期并可以跨模块的较大工作体量，创建一个史诗。将项目中的工作项和子工作项链接到史诗，并从概览中跳转到工作项。",
        primary_button: {
          text: "创建史诗",
        },
      },
      section: {
        title: "还没有史诗",
        description: "开始添加史诗以管理和跟踪进度。",
        primary_button: {
          text: "添加史诗",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "未找到匹配的史诗",
      },
      no_epics: {
        title: "未找到史诗",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "没有活动的周期",
        description: "您的项目中包含当前日期在其范围内的任何时期的周期。在这里查看所有活动周期的进度和详细信息。",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: "向周期添加工作项以查看其进度",
      },
      priority: {
        title: "一目了然地观察周期中处理的高优先级工作项",
      },
      assignee: {
        title: `为工作项添加负责人以查看按负责人
划分的工作明细`,
      },
      label: {
        title: `为工作项添加标签以查看按标签
划分的工作明细`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "从CSV导入成员",
      description: "上传包含以下列的CSV：Email, Display Name, First Name, Last Name, Role（5、15或20）",
      dropzone: {
        active: "将CSV文件放在这里",
        inactive: "拖放或点击上传",
        file_type: "仅支持.csv文件",
      },
      buttons: {
        cancel: "取消",
        import: "导入",
        try_again: "重试",
        close: "关闭",
        done: "完成",
      },
      progress: {
        uploading: "上传中...",
        importing: "导入中...",
      },
      summary: {
        title: {
          failed: "导入失败",
          complete: "导入完成",
        },
        message: {
          seat_limit: "由于席位限制，无法导入成员。",
          success: "成功将{count}名成员添加到工作区。",
          no_imports: "未从CSV文件导入任何成员。",
        },
        stats: {
          successful: "成功",
          failed: "失败",
        },
        download_errors: "下载错误",
      },
      toast: {
        invalid_file: {
          title: "无效文件",
          message: "仅支持CSV文件。",
        },
        import_failed: {
          title: "导入失败",
          message: "出了些问题。",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "无法归档工作项",
        message: "只有属于已完成或已取消状态组的工作项才能被归档。",
      },
      invalid_issue_start_date: {
        title: "无法更新工作项",
        message: "所选开始日期晚于某些工作项的截止日期。请确保开始日期在截止日期之前。",
      },
      invalid_issue_target_date: {
        title: "无法更新工作项",
        message: "所选截止日期早于某些工作项的开始日期。请确保截止日期在开始日期之后。",
      },
      invalid_state_transition: {
        title: "无法更新工作项",
        message: "某些工作项的状态更改不被允许。请确保状态更改是被允许的。",
      },
    },
  },
  work_item_types: {
    label: "工作项类型",
    label_lowercase: "工作项类型",
    settings: {
      title: "工作项类型",
      properties: {
        title: "自定义工作项属性",
        tooltip:
          "每种工作项类型都带有一组默认属性，如标题、描述、负责人、状态、优先级、开始日期、截止日期、模块、周期等。您还可以自定义并添加自己的属性以满足团队需求。",
        add_button: "添加新属性",
        dropdown: {
          label: "属性类型",
          placeholder: "选择类型",
        },
        property_type: {
          text: {
            label: "文本",
          },
          number: {
            label: "数字",
          },
          dropdown: {
            label: "下拉菜单",
          },
          boolean: {
            label: "布尔值",
          },
          date: {
            label: "日期",
          },
          member_picker: {
            label: "成员选择器",
          },
          release_picker: {
            label: "发布选择器",
          },
          formula: {
            label: "公式",
          },
        },
        attributes: {
          label: "属性",
          text: {
            single_line: {
              label: "单行",
            },
            multi_line: {
              label: "段落",
            },
            readonly: {
              label: "只读",
              header: "只读数据",
            },
            invalid_text_format: {
              label: "无效的文本格式",
            },
          },
          number: {
            default: {
              placeholder: "添加数字",
            },
          },
          relation: {
            single_select: {
              label: "单选",
            },
            multi_select: {
              label: "多选",
            },
            no_default_value: {
              label: "无默认值",
            },
          },
          boolean: {
            label: "真 | 假",
            no_default: "无默认值",
          },
          option: {
            create_update: {
              label: "选项",
              form: {
                placeholder: "添加选项",
                errors: {
                  name: {
                    required: "选项名称是必需的。",
                    integrity: "已存在同名选项。",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "选择选项",
                multi: {
                  default: "选择选项",
                  variable: "已选择 {count} 个选项",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "成功！",
              message: "属性 {name} 创建成功。",
            },
            error: {
              title: "错误！",
              message: "创建属性失败。请重试！",
            },
          },
          update: {
            success: {
              title: "成功！",
              message: "属性 {name} 更新成功。",
            },
            error: {
              title: "错误！",
              message: "更新属性失败。请重试！",
            },
          },
          delete: {
            success: {
              title: "成功！",
              message: "属性 {name} 删除成功。",
            },
            error: {
              title: "错误！",
              message: "删除属性失败。请重试！",
            },
          },
          enable_disable: {
            loading: "{action} {name} 属性",
            success: {
              title: "成功！",
              message: "属性 {name} {action} 成功。",
            },
            error: {
              title: "错误！",
              message: "{action} 属性失败。请重试！",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "标题",
            },
            description: {
              placeholder: "描述",
            },
          },
          errors: {
            name: {
              required: "您必须为属性命名。",
              max_length: "属性名称不应超过255个字符。",
            },
            property_type: {
              required: "您必须选择一个属性类型。",
            },
            options: {
              required: "您必须添加至少一个选项。",
            },
            formula: {
              required: "公式表达式是必需的。",
              invalid: "无效的公式：{error}",
              circular_reference: "检测到循环引用。公式不能直接或间接引用自身。",
              invalid_reference: "公式引用了不存在的属性。",
            },
          },
        },
        formula: {
          field_label: "公式字段",
          tooltip: "使用 '{'字段名称'}' 语法输入公式。支持 +、-、*、/ 和 & 运算符。",
          placeholder: "编写公式",
          test_button: "测试",
          validating: "验证中",
          validation_success: "公式有效！返回 {resultType}",
          validation_success_with_refs: "公式有效！返回 {resultType}（引用了 {count} 个字段）",
          error: {
            empty: "请输入公式",
            missing_context: "缺少工作空间、项目或工作项类型上下文",
            validation_failed: "验证失败",
          },
          picker: {
            no_match: "没有匹配的属性",
            no_available: "没有可用的属性",
          },
        },
        enable_disable: {
          label: "活动",
          tooltip: {
            disabled: "点击禁用",
            enabled: "点击启用",
          },
        },
        delete_confirmation: {
          title: "删除此属性",
          description: "删除属性可能导致现有数据丢失。",
          secondary_description: "您是否想要禁用该属性？",
          primary_button: "{action}，删除它",
          secondary_button: "是的，禁用它",
        },
        mandate_confirmation: {
          label: "必填属性",
          content: "此属性似乎有默认选项。将属性设为必填将删除默认值，用户必须添加他们选择的值。",
          tooltip: {
            disabled: "此属性类型无法设为必填",
            enabled: "取消选中以将字段标记为可选",
            checked: "选中以将字段标记为必填",
          },
        },
        empty_state: {
          title: "添加自定义属性",
          description: "您为此工作项类型添加的新属性将显示在此处。",
        },
      },
      item_delete_confirmation: {
        title: "删除此类型",
        description: "删除类型可能会导致现有数据丢失。",
        primary_button: "是的，删除它",
        toast: {
          success: {
            title: "成功！",
            message: "工作项类型已成功删除。",
          },
          error: {
            title: "错误！",
            message: "删除工作项类型失败。请再试一次！",
          },
        },
        can_disable_warning: "您想改为禁用该类型吗？",
      },
      cant_delete_default_message: "无法删除此工作项类型，因为它已设置为该项目的默认类型。",
    },
    create: {
      title: "创建工作项类型",
      button: "添加工作项类型",
      toast: {
        success: {
          title: "成功！",
          message: "工作项类型创建成功。",
        },
        error: {
          title: "错误！",
          message: {
            conflict: "{name} 类型已存在。请选择其他名称。",
          },
        },
      },
    },
    update: {
      title: "更新工作项类型",
      button: "更新工作项类型",
      toast: {
        success: {
          title: "成功！",
          message: "工作项类型 {name} 更新成功。",
        },
        error: {
          title: "错误！",
          message: {
            conflict: "{name} 类型已存在。请选择其他名称。",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "为此工作项类型取一个独特的名称",
        },
        description: {
          placeholder: "描述此工作项类型的用途和使用时机。",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} {name} 工作项类型",
        success: {
          title: "成功！",
          message: "工作项类型 {name} {action} 成功。",
        },
        error: {
          title: "错误！",
          message: "{action} 工作项类型失败。请重试！",
        },
      },
      tooltip: "点击 {action}",
    },
    change_confirmation: {
      title: "更改工作项类型？",
      description: "更改工作项类型可能会导致丢失特定于当前类型的自定义属性值。此操作无法撤销。",
      button: {
        loading: "更改中",
        default: "更改类型",
      },
    },
    empty_state: {
      enable: {
        title: "启用工作项类型",
        description: "使用工作项类型塑造您的工作项。使用图标、背景和属性进行自定义，并为此项目配置它们。",
        primary_button: {
          text: "启用",
        },
        confirmation: {
          title: "一旦启用，工作项类型将无法禁用。",
          description: "Plane的工作项将成为此项目的默认工作项类型，并将在此项目中显示其图标和背景。",
          button: {
            default: "启用",
            loading: "正在设置",
          },
        },
      },
      get_pro: {
        title: "获取 Pro 版以启用工作项类型。",
        description: "使用工作项类型塑造您的工作项。使用图标、背景和属性进行自定义，并为此项目配置它们。",
        primary_button: {
          text: "获取 Pro 版",
        },
      },
      upgrade: {
        title: "升级以启用工作项类型。",
        description: "使用工作项类型塑造您的工作项。使用图标、背景和属性进行自定义，并为此项目配置它们。",
        primary_button: {
          text: "升级",
        },
      },
    },
  },
  importers: {
    imports: "导入",
    logo: "标志",
    import_message: "将您的 {serviceName} 数据导入到 Plane 项目中。",
    deactivate: "停用",
    deactivating: "正在停用",
    migrating: "正在迁移",
    migrations: "迁移",
    refreshing: "正在刷新",
    import: "导入",
    serial_number: "序号",
    project: "项目",
    workspace: "工作区",
    status: "状态",
    summary: "摘要",
    total_batches: "总批次",
    imported_batches: "已导入批次",
    re_run: "重新运行",
    cancel: "取消",
    start_time: "开始时间",
    no_jobs_found: "未找到任务",
    no_project_imports: "您尚未导入任何 {serviceName} 项目。",
    cancel_import_job: "取消导入任务",
    cancel_import_job_confirmation: "您确定要取消此导入任务吗？这将停止此项目的导入过程。",
    re_run_import_job: "重新运行导入任务",
    re_run_import_job_confirmation: "您确定要重新运行此导入任务吗？这将重新启动此项目的导入过程。",
    upload_csv_file: "上传 CSV 文件以导入用户数据。",
    connect_importer: "连接 {serviceName}",
    migration_assistant: "迁移助手",
    migration_assistant_description: "使用我们强大的助手将您的 {serviceName} 项目无缝迁移到 Plane。",
    token_helper: "您可以从以下位置获取",
    personal_access_token: "个人访问令牌",
    source_token_expired: "令牌已过期",
    source_token_expired_description: "提供的令牌已过期。请停用并使用新的凭据重新连接。",
    user_email: "用户邮箱",
    select_state: "选择状态",
    select_service_project: "选择 {serviceName} 项目",
    loading_service_projects: "正在加载 {serviceName} 项目",
    select_service_workspace: "选择 {serviceName} 工作区",
    loading_service_workspaces: "正在加载 {serviceName} 工作区",
    select_priority: "选择优先级",
    select_service_team: "选择 {serviceName} 团队",
    add_seat_msg_free_trial:
      "您正在尝试导入 {additionalUserCount} 个未注册用户，但当前计划中只有 {currentWorkspaceSubscriptionAvailableSeats} 个席位可用。要继续导入，请立即升级。",
    add_seat_msg_paid:
      "您正在尝试导入 {additionalUserCount} 个未注册用户，但当前计划中只有 {currentWorkspaceSubscriptionAvailableSeats} 个席位可用。要继续导入，请至少购买 {extraSeatRequired} 个额外席位。",
    skip_user_import_title: "跳过导入用户数据",
    skip_user_import_description:
      "跳过用户导入将导致工作项、评论和来自 {serviceName} 的其他数据由在 Plane 中执行迁移的用户创建。您以后仍可以手动添加用户。",
    invalid_pat: "无效的个人访问令牌",
  },
  integrations: {
    integrations: "集成",
    loading: "正在加载",
    unauthorized: "您无权查看此页面。",
    configure: "配置",
    not_enabled: "此工作区未启用 {name}。",
    not_configured: "未配置",
    disconnect_personal_account: "断开个人 {providerName} 账户连接",
    not_configured_message_admin: "{name} 集成未配置。请联系您的实例管理员进行配置。",
    not_configured_message_support: "{name} 集成未配置。请联系支持进行配置。",
    external_api_unreachable: "无法访问外部 API。请稍后重试。",
    error_fetching_supported_integrations: "无法获取支持的集成。请稍后重试。",
    back_to_integrations: "返回集成",
    select_state: "选择状态",
    set_state: "设置状态",
    choose_project: "选择项目...",
    skip_backward_state_movement: "防止因 PR 更新将问题移回较早的状态",
  },
  github_integration: {
    name: "GitHub",
    description: "将您的 GitHub 工作项与 Plane 连接并同步",
    connect_org: "连接组织",
    connect_org_description: "将您的 GitHub 组织与 Plane 连接",
    processing: "处理中",
    org_added_desc: "GitHub org 添加于和时间",
    connection_fetch_error: "从服务器获取连接详情时出错",
    personal_account_connected: "个人账户已连接",
    personal_account_connected_description: "您的 GitHub 账户现已连接到 Plane",
    connect_personal_account: "连接个人账户",
    connect_personal_account_description: "将您的个人 GitHub 账户与 Plane 连接。",
    repo_mapping: "仓库映射",
    repo_mapping_description: "将您的 GitHub 仓库与 Plane 项目映射",
    project_issue_sync: "项目问题同步",
    project_issue_sync_description: "将 GitHub 的问题同步到您的 Plane 项目",
    project_issue_sync_empty_state: "映射的项目问题同步将在此处显示",
    configure_project_issue_sync_state: "配置问题同步状态",
    select_issue_sync_direction: "选择问题同步方向",
    allow_bidirectional_sync: "双向 - 在 GitHub 和 Plane 之间同步问题和评论",
    allow_unidirectional_sync: "单向 - 仅从 GitHub 同步问题和评论到 Plane",
    allow_unidirectional_sync_warning: "GitHub 问题的数据将替换关联 Plane 工作项中的数据（仅 GitHub → Plane）",
    remove_project_issue_sync: "移除此项目问题同步",
    remove_project_issue_sync_confirmation: "您确定要移除此项目问题同步吗？",
    add_pr_state_mapping: "添加拉取请求状态映射到 Plane 项目",
    edit_pr_state_mapping: "编辑拉取请求状态映射到 Plane 项目",
    pr_state_mapping: "拉取请求状态映射",
    pr_state_mapping_description: "将 GitHub 的拉取请求状态映射到您的 Plane 项目",
    pr_state_mapping_empty_state: "映射的 PR 状态将在此处显示",
    remove_pr_state_mapping: "移除此拉取请求状态映射",
    remove_pr_state_mapping_confirmation: "您确定要移除此拉取请求状态映射吗？",
    issue_sync_message: "工作项已同步到 {project}",
    link: "将 GitHub 仓库链接到 Plane 项目",
    pull_request_automation: "拉取请求自动化",
    pull_request_automation_description: "配置从 GitHub 到 Plane 项目的拉取请求状态映射",
    DRAFT_MR_OPENED: "草稿打开",
    MR_OPENED: "打开",
    MR_READY_FOR_MERGE: "准备合并",
    MR_REVIEW_REQUESTED: "请求审查",
    MR_MERGED: "合并",
    MR_CLOSED: "关闭",
    ISSUE_OPEN: "Issue 打开",
    ISSUE_CLOSED: "Issue 关闭",
    save: "保存",
    start_sync: "开始同步",
    choose_repository: "选择仓库...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "连接并同步您的 Gitlab 合并请求与 Plane。",
    connection_fetch_error: "从服务器获取连接详情时出错",
    connect_org: "连接组织",
    connect_org_description: "将您的 Gitlab 组织与 Plane 连接。",
    project_connections: "Gitlab 项目连接",
    project_connections_description: "从 Gitlab 同步合并请求到 Plane 项目。",
    plane_project_connection: "Plane 项目连接",
    plane_project_connection_description: "配置从 Gitlab 到 Plane 项目的拉取请求状态映射",
    remove_connection: "移除连接",
    remove_connection_confirmation: "您确定要移除此连接吗？",
    link: "将 Gitlab 仓库链接到 Plane 项目",
    pull_request_automation: "拉取请求自动化",
    pull_request_automation_description: "配置从 Gitlab 到 Plane 的拉取请求状态映射",
    DRAFT_MR_OPENED: "当草稿 MR 打开时，将状态设置为",
    MR_OPENED: "当 MR 打开时，将状态设置为",
    MR_REVIEW_REQUESTED: "当请求 MR 审查时，将状态设置为",
    MR_READY_FOR_MERGE: "当 MR 准备合并时，将状态设置为",
    MR_MERGED: "当 MR 合并时，将状态设置为",
    MR_CLOSED: "当 MR 关闭时，将状态设置为",
    integration_enabled_text: "启用 Gitlab 集成后，您可以自动化工作项工作流",
    choose_entity: "选择实体",
    choose_project: "选择项目",
    link_plane_project: "链接 Plane 项目",
    project_issue_sync: "项目问题同步",
    project_issue_sync_description: "从 Gitlab 同步问题到您的 Plane 项目",
    project_issue_sync_empty_state: "映射的项目问题同步将显示在这里",
    configure_project_issue_sync_state: "配置问题同步状态",
    select_issue_sync_direction: "选择问题同步方向",
    allow_bidirectional_sync: "双向 - 在 Gitlab 和 Plane 之间双向同步问题和评论",
    allow_unidirectional_sync: "单向 - 仅从 Gitlab 同步问题和评论到 Plane",
    allow_unidirectional_sync_warning: "Gitlab 问题中的数据将替换链接的 Plane 工作项中的数据（仅 Gitlab → Plane）",
    remove_project_issue_sync: "移除此项目问题同步",
    remove_project_issue_sync_confirmation: "您确定要移除此项目问题同步吗？",
    ISSUE_OPEN: "问题打开",
    ISSUE_CLOSED: "问题关闭",
    save: "保存",
    start_sync: "开始同步",
    choose_repository: "选择仓库...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "连接并同步您的 Gitlab Enterprise 实例与 Plane。",
    app_form_title: "Gitlab Enterprise 配置",
    app_form_description: "配置 Gitlab Enterprise 以连接到 Plane。",
    base_url_title: "基础 URL",
    base_url_description: "您的 Gitlab Enterprise 实例的基础 URL。",
    base_url_placeholder: '例如："https://glab.plane.town"',
    base_url_error: "基础 URL 是必需的",
    invalid_base_url_error: "无效的基础 URL",
    client_id_title: "应用 ID",
    client_id_description: "您在 Gitlab Enterprise 实例中创建的应用的 ID。",
    client_id_placeholder: '例如："7cd732xxxxxxxxxxxxxx"',
    client_id_error: "应用 ID 是必需的",
    client_secret_title: "客户端密钥",
    client_secret_description: "您在 Gitlab Enterprise 实例中创建的应用的客户端密钥。",
    client_secret_placeholder: '例如："gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "客户端密钥是必需的",
    webhook_secret_title: "Webhook 密钥",
    webhook_secret_description: "一个随机的 webhook 密钥，用于验证来自 Gitlab Enterprise 实例的 webhook。",
    webhook_secret_placeholder: '例如："webhook1234567890"',
    webhook_secret_error: "Webhook 密钥是必需的",
    connect_app: "连接应用",
  },
  slack_integration: {
    name: "Slack",
    description: "将您的 Slack 工作区与 Plane 连接。",
    connect_personal_account: "将您的个人 Slack 账户与 Plane 连接。",
    personal_account_connected: "您的个人 {providerName} 账户现已连接到 Plane。",
    link_personal_account: "将您的个人 {providerName} 账户链接到 Plane。",
    connected_slack_workspaces: "已连接的 Slack 工作区",
    connected_on: "连接于 {date}",
    disconnect_workspace: "断开 {name} 工作区连接",
    alerts: {
      dm_alerts: {
        title: "在 Slack 私信中接收重要更新、提醒和专属警报的通知。",
      },
    },
    project_updates: {
      title: "项目更新",
      description: "配置项目的更新通知",
      add_new_project_update: "添加新的项目更新通知",
      project_updates_empty_state: "与 Slack 频道连接的项目将在此处显示。",
      project_updates_form: {
        title: "配置项目更新",
        description: "在创建工作项时在 Slack 中接收项目更新通知",
        failed_to_load_channels: "无法从 Slack 加载频道",
        project_dropdown: {
          placeholder: "选择项目",
          label: "Plane 项目",
          no_projects: "没有可用项目",
        },
        channel_dropdown: {
          label: "Slack 频道",
          placeholder: "选择频道",
          no_channels: "没有可用频道",
        },
        all_projects_connected: "所有项目已连接到 Slack 频道。",
        all_channels_connected: "所有 Slack 频道已连接到项目。",
        project_connection_success: "项目连接创建成功",
        project_connection_updated: "项目连接更新成功",
        project_connection_deleted: "项目连接删除成功",
        failed_delete_project_connection: "删除项目连接失败",
        failed_create_project_connection: "创建项目连接失败",
        failed_upserting_project_connection: "更新项目连接失败",
        failed_loading_project_connections: "无法加载您的项目连接。这可能是由于网络问题或集成问题。",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "将您的Sentry工作空间连接到Plane。",
    connected_sentry_workspaces: "已连接的Sentry工作空间",
    connected_on: "连接于{date}",
    disconnect_workspace: "断开{name}工作空间",
    state_mapping: {
      title: "状态映射",
      description: "将Sentry事件状态映射到您的项目状态。配置当Sentry事件已解决或未解决时使用哪些状态。",
      add_new_state_mapping: "添加新状态映射",
      empty_state: "未配置状态映射。创建您的第一个映射以同步Sentry事件状态与您的项目状态。",
      failed_loading_state_mappings: "我们无法加载您的状态映射。这可能是由于网络问题或集成问题。",
      loading_project_states: "正在加载项目状态...",
      error_loading_states: "加载状态时出错",
      no_states_available: "没有可用状态",
      no_permission_states: "您没有权限访问此项目的状态",
      states_not_found: "未找到项目状态",
      server_error_states: "加载状态时服务器错误",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "连接并同步您的 GitHub Enterprise 组织与 Plane。",
    app_form_title: "GitHub Enterprise 配置",
    app_form_description: "配置 GitHub Enterprise 以连接到 Plane。",
    app_id_title: "App ID",
    app_id_description: "您在 GitHub Enterprise 组织中创建的应用程序的 ID。",
    app_id_placeholder: '例如，"1234567890"',
    app_id_error: "App ID 是必需的",
    app_name_title: "App Slug",
    app_name_description: "您在 GitHub Enterprise 组织中创建的应用程序的 slug。",
    app_name_error: "App slug 是必需的",
    app_name_placeholder: '例如，"plane-github-enterprise"',
    base_url_title: "Base URL",
    base_url_description: "您的 GitHub Enterprise 组织的基 URL。",
    base_url_placeholder: '例如，"https://gh.plane.town"',
    base_url_error: "Base URL 是必需的",
    invalid_base_url_error: "无效的基 URL",
    client_id_title: "Client ID",
    client_id_description: "您在 GitHub Enterprise 组织中创建的应用程序的客户端 ID。",
    client_id_placeholder: '例如，"1234567890"',
    client_id_error: "Client ID 是必需的",
    client_secret_title: "Client Secret",
    client_secret_description: "您在 GitHub Enterprise 组织中创建的应用程序的客户端密钥。",
    client_secret_placeholder: '例如，"1234567890"',
    client_secret_error: "Client secret 是必需的",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "您在 GitHub Enterprise 组织中创建的应用程序的 webhook 密钥。",
    webhook_secret_placeholder: '例如，"1234567890"',
    webhook_secret_error: "Webhook secret 是必需的",
    private_key_title: "私钥 (Base64 编码)",
    private_key_description: "您在 GitHub Enterprise 组织中创建的应用程序的 Base64 编码的私钥。",
    private_key_placeholder: '例如，"MIIEpAIBAAKCAQEA...',
    private_key_error: "Private key 是必需的",
    connect_app: "连接应用",
  },
  file_upload: {
    upload_text: "点击此处上传文件",
    drag_drop_text: "拖放",
    processing: "处理中",
    invalid: "无效的文件类型",
    missing_fields: "缺少字段",
    success: "{fileName} 已上传！",
  },
  silo_errors: {
    invalid_query_params: "提供的查询参数无效或缺少必需字段",
    invalid_installation_account: "提供的安装账户无效",
    generic_error: "处理您的请求时发生意外错误",
    connection_not_found: "找不到请求的连接",
    multiple_connections_found: "找到多个连接，但只期望一个",
    installation_not_found: "找不到请求的安装",
    user_not_found: "找不到请求的用户",
    error_fetching_token: "获取身份验证令牌失败",
    cannot_create_multiple_connections: "您已经将组织连接到工作区。请在连接新组织之前断开现有连接。",
    invalid_app_credentials: "提供的应用凭证无效",
    invalid_app_installation_id: "安装应用失败",
  },
  import_status: {
    queued: "排队中",
    created: "已创建",
    initiated: "已启动",
    pulling: "拉取中",
    timed_out: "超时",
    pulled: "已拉取",
    transforming: "转换中",
    transformed: "已转换",
    pushing: "推送中",
    finished: "已完成",
    error: "错误",
    cancelled: "已取消",
  },
  jira_importer: {
    jira_importer_description: "将您的 Jira 数据导入到 Plane 项目中。",
    personal_access_token: "个人访问令牌",
    user_email: "用户邮箱",
    create_project_automatically: "自动创建项目",
    create_project_automatically_description: "我们将根据 Jira 项目详情为您创建一个新项目。",
    import_to_existing_project: "导入到现有项目",
    import_to_existing_project_description: "从下面的下拉菜单中选择一个现有项目。",
    state_mapping_automatic_creation: "所有 Jira 状态都将在 Plane 中自动创建。",
    atlassian_security_settings: "Atlassian 安全设置",
    email_description: "这是与您的个人访问令牌关联的邮箱",
    jira_domain: "Jira 域名",
    jira_domain_description: "这是您的 Jira 实例的域名",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "请先在 Plane 中创建您打算迁移 Jira 数据的项目。创建项目后，在此处选择它。",
      title_configure_jira: "配置 Jira",
      description_configure_jira: "请选择您要从中迁移数据的 Jira 工作区。",
      title_import_users: "导入用户",
      description_import_users: "请添加您希望从 Jira 迁移到 Plane 的用户。或者，您可以跳过此步骤，稍后手动添加用户。",
      title_map_states: "映射状态",
      description_map_states:
        "我们已尽可能自动将 Jira 状态匹配到 Plane 状态。在继续之前，请映射任何剩余的状态，您也可以创建状态并手动映射它们。",
      title_map_priorities: "映射优先级",
      description_map_priorities: "我们已尽可能自动匹配优先级。在继续之前，请映射任何剩余的优先级。",
      title_summary: "摘要",
      description_summary: "以下是将从 Jira 迁移到 Plane 的数据摘要。",
      custom_jql_filter: "自定义 JQL 过滤器",
      jql_filter_description: "使用 JQL 筛选要导入的特定问题。",
      project_code: "项目",
      enter_filters_placeholder: "输入过滤器（例如 status = 'In Progress'）",
      validating_query: "正在验证查询...",
      validation_successful_work_items_selected: "验证成功，已选择 {count} 个工作项。",
      run_syntax_check: "运行语法检查以验证您的查询",
      refresh: "刷新",
      check_syntax: "检查语法",
      no_work_items_selected: "查询未选择任何工作项。",
      validation_error_default: "验证查询时出错。",
    },
  },
  asana_importer: {
    asana_importer_description: "将您的 Asana 数据导入到 Plane 项目中。",
    select_asana_priority_field: "选择 Asana 优先级字段",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "请先在 Plane 中创建您打算迁移 Asana 数据的项目。创建项目后，在此处选择它。",
      title_configure_asana: "配置 Asana",
      description_configure_asana: "请选择您要从中迁移数据的 Asana 工作区和项目。",
      title_map_states: "映射状态",
      description_map_states: "请选择您要映射到 Plane 项目状态的 Asana 状态。",
      title_map_priorities: "映射优先级",
      description_map_priorities: "请选择您要映射到 Plane 项目优先级的 Asana 优先级。",
      title_summary: "摘要",
      description_summary: "以下是将从 Asana 迁移到 Plane 的数据摘要。",
    },
  },
  linear_importer: {
    linear_importer_description: "将您的 Linear 数据导入到 Plane 项目中。",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "请先在 Plane 中创建您打算迁移 Linear 数据的项目。创建项目后，在此处选择它。",
      title_configure_linear: "配置 Linear",
      description_configure_linear: "请选择您要从中迁移数据的 Linear 团队。",
      title_map_states: "映射状态",
      description_map_states:
        "我们已尽可能自动将 Linear 状态匹配到 Plane 状态。在继续之前，请映射任何剩余的状态，您也可以创建状态并手动映射它们。",
      title_map_priorities: "映射优先级",
      description_map_priorities: "请选择您要映射到 Plane 项目优先级的 Linear 优先级。",
      title_summary: "摘要",
      description_summary: "以下是将从 Linear 迁移到 Plane 的数据摘要。",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "将您的 Jira Server/Data Center 数据导入到 Plane 项目中。",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "请先在 Plane 中创建您打算迁移 Jira 数据的项目。创建项目后，在此处选择它。",
      title_configure_jira: "配置 Jira",
      description_configure_jira: "请选择您要从中迁移数据的 Jira 工作区。",
      title_map_states: "映射状态",
      description_map_states: "请选择您要映射到 Plane 项目状态的 Jira 状态。",
      title_map_priorities: "映射优先级",
      description_map_priorities: "请选择您要映射到 Plane 项目优先级的 Jira 优先级。",
      title_summary: "摘要",
      description_summary: "以下是将从 Jira 迁移到 Plane 的数据摘要。",
    },
    import_epics: {
      title: "将史诗导入为工作项",
      description: "启用此选项后，您的史诗将作为具有史诗工作项类型的工作项导入。",
    },
  },
  notion_importer: {
    notion_importer_description: "将您的 Notion 数据导入到 Plane 项目中。",
    steps: {
      title_upload_zip: "上传 Notion 导出的 ZIP 文件",
      description_upload_zip: "请上传包含您的 Notion 数据的 ZIP 文件。",
    },
    upload: {
      drop_file_here: "将您的 Notion zip 文件拖放到这里",
      upload_title: "上传 Notion 导出文件",
      upload_from_url: "从 URL 导入",
      upload_from_url_description: "粘贴您的 ZIP 导出文件的公开 URL 以继续。",
      drag_drop_description: "拖放您的 Notion 导出 zip 文件，或点击浏览",
      file_type_restriction: "仅支持从 Notion 导出的 .zip 文件",
      select_file: "选择文件",
      uploading: "正在上传...",
      preparing_upload: "正在准备上传...",
      confirming_upload: "正在确认上传...",
      confirming: "正在确认...",
      upload_complete: "上传完成",
      upload_failed: "上传失败",
      start_import: "开始导入",
      retry_upload: "重试上传",
      upload: "上传",
      ready: "就绪",
      error: "错误",
      upload_complete_message: "上传完成！",
      upload_complete_description: '点击"开始导入"开始处理您的 Notion 数据。',
      upload_progress_message: "请不要关闭此窗口。",
    },
  },
  confluence_importer: {
    confluence_importer_description: "将您的 Confluence 数据导入到 Plane 维基中。",
    steps: {
      title_upload_zip: "上传 Confluence 导出的 ZIP 文件",
      description_upload_zip: "请上传包含您的 Confluence 数据的 ZIP 文件。",
    },
    upload: {
      drop_file_here: "将您的 Confluence zip 文件拖放到这里",
      upload_title: "上传 Confluence 导出文件",
      upload_from_url: "从 URL 导入",
      upload_from_url_description: "粘贴您的 ZIP 导出文件的公开 URL 以继续。",
      drag_drop_description: "拖放您的 Confluence 导出 zip 文件，或点击浏览",
      file_type_restriction: "仅支持从 Confluence 导出的 .zip 文件",
      select_file: "选择文件",
      uploading: "正在上传...",
      preparing_upload: "正在准备上传...",
      confirming_upload: "正在确认上传...",
      confirming: "正在确认...",
      upload_complete: "上传完成",
      upload_failed: "上传失败",
      start_import: "开始导入",
      retry_upload: "重试上传",
      upload: "上传",
      ready: "就绪",
      error: "错误",
      upload_complete_message: "上传完成！",
      upload_complete_description: '点击"开始导入"开始处理您的 Confluence 数据。',
      upload_progress_message: "请不要关闭此窗口。",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "将您的 CSV 数据导入到 Plane 项目中。",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "请先在 Plane 中创建您打算迁移 CSV 数据的项目。创建项目后，在此处选择它。",
      title_configure_csv: "配置 CSV",
      description_configure_csv: "请上传您的 CSV 文件并配置要映射到 Plane 字段的字段。",
    },
  },
  csv_importer: {
    csv_importer_description: "从 CSV 文件导入工作项到 Plane 项目。",
    steps: {
      title_select_project: "选择项目",
      description_select_project: "请选择您要导入工作项的 Plane 项目。",
      title_upload_csv: "上传 CSV",
      description_upload_csv: "上传包含工作项的 CSV 文件。文件应包含名称、描述、优先级、日期和状态组的列。",
    },
  },
  clickup_importer: {
    clickup_importer_description: "将您的 ClickUp 数据导入到 Plane 项目中。",
    select_service_space: "选择 {serviceName} 空间",
    select_service_folder: "选择 {serviceName} 文件夹",
    selected: "已选择",
    users: "用户",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "请先在 Plane 中创建您打算迁移 ClickUp 数据的项目。创建项目后，在此处选择它。",
      title_configure_clickup: "配置 ClickUp",
      description_configure_clickup: "请选择您要从中迁移数据的 ClickUp 团队、空间和文件夹。",
      title_map_states: "映射状态",
      description_map_states:
        "我们已尽可能自动将 ClickUp 状态匹配到 Plane 状态。在继续之前，请映射任何剩余的状态，您也可以创建状态并手动映射它们。",
      title_map_priorities: "映射优先级",
      description_map_priorities: "请选择您要映射到 Plane 项目优先级的 ClickUp 优先级。",
      title_summary: "摘要",
      description_summary: "以下是将从 ClickUp 迁移到 Plane 的数据摘要。",
      pull_additional_data_title: "导入评论和附件",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "柱状",
          long_label: "柱状图",
          chart_models: {
            basic: "基础",
            stacked: "堆叠",
            grouped: "分组",
          },
          orientation: {
            label: "方向",
            horizontal: "水平",
            vertical: "垂直",
            placeholder: "添加方向",
          },
          bar_color: "柱状颜色",
        },
        line_chart: {
          short_label: "线形",
          long_label: "线形图",
          chart_models: {
            basic: "基础",
            multi_line: "多线",
          },
          line_color: "线条颜色",
          line_type: {
            label: "线型",
            solid: "实线",
            dashed: "虚线",
            placeholder: "添加线型",
          },
        },
        area_chart: {
          short_label: "区域",
          long_label: "区域图",
          chart_models: {
            basic: "基础",
            stacked: "堆叠",
            comparison: "对比",
          },
          fill_color: "填充颜色",
        },
        donut_chart: {
          short_label: "环形",
          long_label: "环形图",
          chart_models: {
            basic: "基础",
            progress: "进度",
          },
          center_value: "中心值",
          completed_color: "完成颜色",
        },
        pie_chart: {
          short_label: "饼形",
          long_label: "饼形图",
          chart_models: {
            basic: "基础",
          },
          group: {
            label: "分组切片",
            group_thin_pieces: "分组细小切片",
            minimum_threshold: {
              label: "最小阈值",
              placeholder: "添加阈值",
            },
            name_group: {
              label: "组名",
              placeholder: '"小于5%"',
            },
          },
          show_values: "显示值",
          value_type: {
            percentage: "百分比",
            count: "计数",
          },
        },
        text: {
          short_label: "文本",
          long_label: "文本",
          alignment: {
            label: "文本对齐",
            left: "左对齐",
            center: "居中",
            right: "右对齐",
            placeholder: "添加文本对齐",
          },
          text_color: "文本颜色",
        },
        table_chart: {
          short_label: "表格",
          long_label: "表格图表",
          chart_models: {
            basic: {
              short_label: "基础",
              long_label: "表格",
            },
          },
          columns: "列",
          rows: "行",
          rows_placeholder: "添加行",
          configure_rows_hint: "选择行的属性以查看此表格。",
        },
      },
      color_palettes: {
        modern: "现代",
        horizon: "地平线",
        earthen: "土色",
      },
      common: {
        add_widget: "添加组件",
        widget_title: {
          label: "命名此组件",
          placeholder: '例如，"昨日待办", "全部完成"',
        },
        chart_type: "图表类型",
        visualization_type: {
          label: "可视化类型",
          placeholder: "添加可视化类型",
        },
        date_group: {
          label: "日期分组",
          placeholder: "添加日期分组",
        },
        group_by: "分组依据",
        stack_by: "堆叠依据",
        daily: "每日",
        weekly: "每周",
        monthly: "每月",
        yearly: "每年",
        work_item_count: "工作项计数",
        estimate_point: "估算点数",
        pending_work_item: "待处理工作项",
        completed_work_item: "已完成工作项",
        in_progress_work_item: "进行中工作项",
        blocked_work_item: "已阻塞工作项",
        work_item_due_this_week: "本周到期工作项",
        work_item_due_today: "今日到期工作项",
        color_scheme: {
          label: "配色方案",
          placeholder: "添加配色方案",
        },
        smoothing: "平滑",
        markers: "标记",
        legends: "图例",
        tooltips: "提示框",
        opacity: {
          label: "不透明度",
          placeholder: "添加不透明度",
        },
        border: "边框",
        widget_configuration: "组件配置",
        configure_widget: "配置组件",
        guides: "指南",
        style: "样式",
        area_appearance: "区域外观",
        comparison_line_appearance: "比较线外观",
        add_property: "添加属性",
        add_metric: "添加指标",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
          },
          stacked: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
            group_by: "堆叠依据缺少值。",
          },
          grouped: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
            group_by: "分组依据缺少值。",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
          },
          multi_line: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
            group_by: "分组依据缺少值。",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
          },
          stacked: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
            group_by: "堆叠依据缺少值。",
          },
          comparison: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
          },
          progress: {
            y_axis_metric: "指标缺少值。",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "X轴缺少值。",
            y_axis_metric: "指标缺少值。",
          },
        },
        text: {
          basic: {
            y_axis_metric: "指标缺少值。",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "列缺少值。",
            group_by: "行缺少值。",
          },
        },
        ask_admin: "请联系管理员配置此组件。",
      },
    },
    create_modal: {
      heading: {
        create: "创建新仪表板",
        update: "更新仪表板",
      },
      title: {
        label: "命名您的仪表板。",
        placeholder: '"跨项目容量", "按团队工作量", "跨所有项目状态"',
        required_error: "标题为必填项",
      },
      project: {
        label: "选择项目",
        placeholder: "这些项目的数据将为此仪表板提供支持。",
        required_error: "项目为必填项",
      },
      filters_label: "为上述数据源设置筛选条件",
      create_dashboard: "创建仪表板",
      update_dashboard: "更新仪表板",
    },
    delete_modal: {
      heading: "删除仪表板",
    },
    empty_state: {
      feature_flag: {
        title: "在按需永久仪表板中展示您的进度。",
        description: "构建您需要的任何仪表板，并定制数据的显示方式，以完美呈现您的进度。",
        coming_soon_to_mobile: "即将登陆移动应用",
        card_1: {
          title: "适用于您的所有项目",
          description: "通过所有项目获得工作空间的全局视图，或者为完美查看您的进度而筛选工作数据。",
        },
        card_2: {
          title: "适用于Plane中的任何数据",
          description: "超越内置分析和预制周期图表，以前所未有的方式查看团队、计划或任何其他内容。",
        },
        card_3: {
          title: "满足您所有的数据可视化需求",
          description: "从多种可定制的图表中选择，具有精细控制，以您想要的方式准确查看和展示您的工作数据。",
        },
        card_4: {
          title: "按需且永久",
          description: "构建一次，永久保存，数据自动刷新，范围变更的上下文标志，以及可共享的永久链接。",
        },
        card_5: {
          title: "导出和定时通信",
          description: "当链接不起作用时，将您的仪表板导出为一次性PDF，或计划自动发送给利益相关者。",
        },
        card_6: {
          title: "自动适应所有设备的布局",
          description: "调整组件大小以获得您想要的布局，并在移动设备、平板电脑和其他浏览器上看到完全相同的效果。",
        },
      },
      dashboards_list: {
        title: "在组件中可视化数据，用组件构建仪表板，并按需查看最新信息。",
        description:
          "使用自定义组件构建您的仪表板，在您指定的范围内显示数据。获取跨项目和团队的所有工作的仪表板，并与利益相关者共享永久链接以进行按需跟踪。",
      },
      dashboards_search: {
        title: "这与仪表板名称不匹配。",
        description: "确保您的查询正确或尝试其他查询。",
      },
      widgets_list: {
        title: "按照您想要的方式可视化数据。",
        description: "使用折线、柱状、饼图和其他格式，从您指定的数据源以您想要的方式查看数据。",
      },
      widget_data: {
        title: "这里没有内容",
        description: "刷新或添加数据以在此处查看。",
      },
    },
    common: {
      editing: "编辑中",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "允许新工作项",
      work_item_creation_disable_tooltip: "工作项创建在此状态中被禁用",
      default_state: "默认状态允许所有成员创建新工作项。不能更改",
      state_change_count: "{count, plural, one {1 个允许的状态更改} other {{count} 个允许的状态更改}}",
      movers_count: "{count, plural, one {1 个列出的评审人} other {{count} 个列出的评审人}}",
      state_changes: {
        label: {
          default: "添加允许的状态更改",
          loading: "正在添加允许的状态更改",
        },
        move_to: "移动到",
        movers: {
          label: "当被",
          tooltip: "评审人是允许从一个状态移动到另一个状态的工作项的人。",
          add: "添加评审人",
        },
      },
    },
    workflow_disabled: {
      title: "您不能在这里移动这个工作项。",
    },
    workflow_enabled: {
      label: "状态更改",
    },
    workflow_tree: {
      label: "对于在",
      state_change_label: "可以移动到",
    },
    empty_state: {
      upgrade: {
        title: "使用工作流控制更改和审查的混乱。",
        description: "使用 Plane 中的工作流定义您工作的移动规则，包括谁、何时。",
      },
    },
    quick_actions: {
      view_change_history: "查看更改历史",
      reset_workflow: "重置工作流",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "您确定要重置这个工作流吗？",
        description: "如果您重置这个工作流，您所有的状态更改规则将被删除，您将需要为这个项目重新创建它们。",
      },
      delete_state_change: {
        title: "您确定要删除这个状态更改规则吗？",
        description: "一旦删除，您不能撤销这个更改，您将需要为这个项目重新设置规则。",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} 工作流",
        success: {
          title: "成功",
          message: "工作流 {action} 成功",
        },
        error: {
          title: "错误",
          message: "工作流不能被 {action}。请重试。",
        },
      },
      reset: {
        success: {
          title: "成功",
          message: "工作流重置成功",
        },
        error: {
          title: "重置工作流错误",
          message: "工作流不能被重置。请重试。",
        },
      },
      add_state_change_rule: {
        error: {
          title: "添加状态更改规则错误",
          message: "状态更改规则不能被添加。请重试。",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "修改状态更改规则错误",
          message: "状态更改规则不能被修改。请重试。",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "删除状态更改规则错误",
          message: "状态更改规则不能被删除。请重试。",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "修改状态更改规则移交人错误",
          message: "状态更改规则移交人不能被修改。请重试。",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {客户} other {客户}}",
    dropdown: {
      placeholder: "选择客户",
      required: "请选择客户",
      no_selection: "没有客户",
    },
    upgrade: {
      title: "与客户一起优先排序并管理工作。",
      description: "将您的工作与客户关联，并根据客户属性确定优先级。",
    },
    properties: {
      default: {
        title: "默认",
        customer_name: {
          name: "客户名称",
          placeholder: "可以是个人或公司名称",
          validation: {
            required: "客户名称是必填项。",
            max_length: "客户名称不能超过255个字符。",
          },
        },
        description: {
          name: "描述",
          validation: {},
        },
        email: {
          name: "电子邮件",
          placeholder: "请输入电子邮件",
          validation: {
            required: "电子邮件是必填项。",
            pattern: "电子邮件格式不正确。",
          },
        },
        website_url: {
          name: "网站",
          placeholder: "任何以https://开头的URL都有效。",
          placeholder_short: "添加网站",
          validation: {
            pattern: "无效的网站URL",
          },
        },
        employees: {
          name: "员工",
          placeholder: "如果客户是公司，请填写员工数量。",
          validation: {
            min_length: "员工数量不能小于0。",
            max_length: "员工数量不能大于2147483647。",
          },
        },
        size: {
          name: "规模",
          placeholder: "添加公司规模",
          validation: {
            min_length: "无效的规模",
          },
        },
        domain: {
          domain: "行业",
          placeholder: "零售、电商、金融科技、银行",
          placeholder_short: "添加行业",
          validation: {},
        },
        stage: {
          name: "阶段",
          placeholder: "选择阶段",
          validation: {},
        },
        contract_status: {
          name: "合同状态",
          placeholder: "选择合同状态",
          validation: {},
        },
        revenue: {
          name: "收入",
          placeholder: "这是客户的年收入。",
          placeholder_short: "添加收入",
          validation: {
            min_length: "收入不能小于0。",
            max_length: "收入不能大于2147483647。",
          },
        },
        invalid_value: "无效的收入值。",
      },
      custom: {
        title: "自定义属性",
        info: "将客户的独特属性添加到Plane，以更好地管理工作项或客户记录。",
      },
      empty_state: {
        title: "添加自定义属性",
        description: "您希望手动或自动与CRM匹配的自定义属性将显示在此处。",
      },
      add: {
        primary_button: "添加新属性",
      },
    },
    stage: {
      lead: "潜在客户",
      sales_qualified_lead: "销售合格潜在客户",
      contract_negotiation: "合同谈判",
      closed_won: "已关闭，已赢得",
      closed_lost: "已关闭，已失去",
    },
    contract_status: {
      active: "激活",
      pre_contract: "预合同",
      signed: "已签署",
      inactive: "未激活",
    },
    empty_state: {
      detail: {
        title: "未找到此客户记录。",
        description: "此记录的链接可能无效，或已被删除。",
        primary_button: "转到客户",
        secondary_button: "添加客户",
      },
      search: {
        title: "似乎没有与该术语匹配的客户记录。",
        description: "请尝试使用其他搜索词，或者如果您确定应该看到该术语的结果，请联系我们。",
      },
      list: {
        title: "管理客户的体量、速度和流量，基于客户对你工作的重要性。",
        description:
          "在Plane中使用客户功能，您可以从头开始创建新客户，并将其与您的工作相关联。稍后您将能够将它们与其他工具一起导入，包括它们的自定义属性。",
        primary_button: "添加第一个客户",
      },
    },
    settings: {
      unauthorized: "您没有权限访问此页面。",
      description: "在您的工作流程中跟踪和管理与客户的关系。",
      enable: "启用客户",
      toasts: {
        enable: {
          loading: "正在启用客户功能...",
          success: {
            title: "您已启用此工作区的客户功能。",
            message: "成员现在可以添加客户记录、将其链接到工作项等。",
          },
          error: {
            title: "无法启用客户功能。",
            message: "请稍后重试或返回此页面。如果问题仍然存在，请联系支持。",
          },
        },
        disable: {
          loading: "正在禁用客户功能...",
          success: {
            title: "客户已禁用",
            message: "客户功能已成功禁用！",
          },
          error: {
            title: "错误",
            message: "无法禁用客户功能！",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "无法获取客户列表。",
          message: "请稍后重试或刷新此页面。",
        },
      },
      copy_link: {
        title: "您已复制客户的直接链接。",
        message: "将其粘贴到任何位置，它将直接将您带到此页面。",
      },
      create: {
        success: {
          title: "{customer_name} 现在可用",
          message: "您可以在工作项中引用此客户并跟踪来自他们的请求。",
          actions: {
            view: "查看",
            copy_link: "复制链接",
            copied: "已复制！",
          },
        },
        error: {
          title: "无法创建此记录。",
          message: "请重新保存，或将未保存的文本复制到新记录中，最好是在其他标签页中。",
        },
      },
      update: {
        success: {
          title: "成功！",
          message: "客户已成功更新！",
        },
        error: {
          title: "错误！",
          message: "无法更新客户。请重试！",
        },
      },
      logo: {
        error: {
          title: "无法加载客户的logo。",
          message: "请再次保存logo，或者从头开始。",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "您已从该客户记录中移除工作项。",
            message: "我们还自动将此客户从工作项中移除。",
          },
          error: {
            title: "此次无法从该客户记录中删除工作项。",
            message: "请重试删除此工作项，如果问题仍然存在，请联系我们。",
          },
        },
        add: {
          error: {
            title: "无法将此工作项添加到该客户记录。",
            message: "请重试，或者稍后再试。如果错误仍然存在，请联系支持。",
          },
          success: {
            title: "您已将工作项添加到该客户记录。",
            message: "我们还自动将此客户添加到工作项中。",
          },
        },
      },
    },
    quick_actions: {
      edit: "编辑",
      copy_link: "复制客户链接",
      delete: "删除",
    },
    create: {
      label: "创建客户记录",
      loading: "创建中",
      cancel: "取消",
    },
    update: {
      label: "更新客户",
      loading: "更新中",
    },
    delete: {
      title: "您确定要删除客户记录 {customer_name} 吗？",
      description: "与此记录相关的所有数据将被永久删除。您以后无法恢复此记录。",
    },
    requests: {
      empty_state: {
        list: {
          title: "目前没有要显示的请求。",
          description: "从您的客户创建请求，将它们与工作项关联。",
          button: "添加新请求",
        },
        search: {
          title: "似乎没有与该术语匹配的请求。",
          description: "请尝试使用其他搜索词，或者如果您确定应该看到该术语的结果，请联系我们。",
        },
      },
      label: "{count, plural, one {请求} other {请求}}",
      add: "添加请求",
      create: "创建请求",
      update: "更新请求",
      form: {
        name: {
          placeholder: "为此请求命名",
          validation: {
            required: "名称是必填项。",
            max_length: "请求名称不能超过255个字符。",
          },
        },
        description: {
          placeholder: "描述请求或粘贴客户从其他工具中的评论。",
        },
        source: {
          add: "添加来源",
          update: "更新来源",
          url: {
            label: "URL",
            required: "URL是必填项",
            invalid: "无效的URL",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "链接已复制",
          message: "客户请求的链接已复制到剪贴板。",
        },
        attachment: {
          upload: {
            loading: "上传附件...",
            success: {
              title: "附件上传成功",
              message: "附件已成功上传。",
            },
            error: {
              title: "上传附件失败",
              message: "无法上传附件。",
            },
          },
          size: {
            error: {
              title: "错误！",
              message: "一次只能上传一个文件。",
            },
          },
          length: {
            message: "文件大小必须小于 {size} MB",
          },
          remove: {
            success: {
              title: "附件已删除",
              message: "附件已成功删除",
            },
            error: {
              title: "无法删除附件",
              message: "无法删除附件",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "成功！",
              message: "来源已成功更新！",
            },
            error: {
              title: "错误！",
              message: "无法更新来源。",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "错误！",
              message: "无法将工作项添加到请求中。请重试。",
            },
            success: {
              title: "成功！",
              message: "工作项已添加到请求中。",
            },
          },
        },
        update: {
          success: {
            message: "请求已成功更新！",
            title: "成功！",
          },
          error: {
            title: "错误！",
            message: "无法更新请求。请重试！",
          },
        },
        create: {
          success: {
            message: "请求已成功创建！",
            title: "成功！",
          },
          error: {
            title: "错误！",
            message: "无法创建请求。请重试！",
          },
        },
      },
    },
    linked_work_items: {
      label: "关联工作项",
      link: "关联工作项",
      empty_state: {
        list: {
          title: "看起来您还没有将任何工作项关联到此客户。",
          description: "将现有工作项从任何项目中关联到此处，以便跟踪该客户。",
          button: "关联工作项",
        },
      },
      action: {
        remove_epic: "移除史诗",
        remove: "移除工作项",
      },
    },
    sidebar: {
      properties: "属性",
    },
  },
  templates: {
    settings: {
      title: "模板",
      description: "使用模板可以节省80%创建项目、工作项和页面的时间。",
      options: {
        project: {
          label: "项目模板",
        },
        work_item: {
          label: "工作项模板",
        },
        page: {
          label: "页面模板",
        },
      },
      create_template: {
        label: "创建模板",
        no_permission: {
          project: "联系您的项目管理员创建模板",
          workspace: "联系您的工作区管理员创建模板",
        },
      },
      use_template: {
        button: {
          default: "使用模板",
          loading: "使用中",
        },
      },
      template_source: {
        workspace: {
          info: "源自工作区",
        },
        project: {
          info: "源自项目",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "为您的项目模板命名。",
              validation: {
                required: "模板名称是必填项",
                maxLength: "模板名称应少于255个字符",
              },
            },
            description: {
              placeholder: "描述何时以及如何使用此模板。",
            },
          },
          name: {
            placeholder: "为您的项目命名。",
            validation: {
              required: "项目标题是必填项",
              maxLength: "项目标题应少于255个字符",
            },
          },
          description: {
            placeholder: "描述此项目的目的和目标。",
          },
          button: {
            create: "创建项目模板",
            update: "更新项目模板",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "为您的工作项模板命名。",
              validation: {
                required: "模板名称是必填项",
                maxLength: "模板名称应少于255个字符",
              },
            },
            description: {
              placeholder: "描述何时以及如何使用此模板。",
            },
          },
          name: {
            placeholder: "为此工作项提供标题。",
            validation: {
              required: "工作项标题是必填项",
              maxLength: "工作项标题应少于255个字符",
            },
          },
          description: {
            placeholder: "描述此工作项，以便清楚地了解完成后您将实现什么。",
          },
          button: {
            create: "创建工作项模板",
            update: "更新工作项模板",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "为您的页面模板命名。",
              validation: {
                required: "模板名称是必填项",
                maxLength: "模板名称应少于255个字符",
              },
            },
            description: {
              placeholder: "描述何时以及如何使用此模板。",
            },
          },
          name: {
            placeholder: "未命名页面",
            validation: {
              maxLength: "页面名称应少于255个字符",
            },
          },
          button: {
            create: "创建页面模板",
            update: "更新页面模板",
          },
        },
        publish: {
          action: "{isPublished, select, true {发布设置} other {发布到市场}}",
          unpublish_action: "从市场移除",
          title: "让您的模板可被发现和识别。",
          name: {
            label: "模板名称",
            placeholder: "为您的模板命名",
            validation: {
              required: "模板名称是必填项",
              maxLength: "模板名称应少于255个字符",
            },
          },
          short_description: {
            label: "简短描述",
            placeholder: "此模板非常适合同时管理多个项目的项目经理。",
            validation: {
              required: "简短描述是必填项",
            },
          },
          description: {
            label: "描述",
            placeholder: `通过我们的语音转文字集成提高生产力并简化沟通。
• 实时转录：立即将语音转换为准确的文本。
• 任务和评论创建：通过语音命令添加任务、描述和评论。`,
            validation: {
              required: "描述是必填项",
            },
          },
          category: {
            label: "类别",
            placeholder: "选择您认为最合适的位置。您可以选择多个。",
            validation: {
              required: "至少需要一个类别",
            },
          },
          keywords: {
            label: "关键词",
            placeholder: "使用您认为用户在查找此模板时会搜索的术语。",
            helperText: "输入逗号分隔的关键词，这些关键词可能有助于人们从搜索中找到此模板。",
            validation: {
              required: "至少需要一个关键词",
            },
          },
          company_name: {
            label: "公司名称",
            placeholder: "Plane",
            validation: {
              required: "公司名称是必填项",
              maxLength: "公司名称应少于255个字符",
            },
          },
          contact_email: {
            label: "支持邮箱",
            placeholder: "help@plane.so",
            validation: {
              invalid: "无效的邮箱地址",
              required: "支持邮箱是必填项",
              maxLength: "支持邮箱应少于255个字符",
            },
          },
          privacy_policy_url: {
            label: "隐私政策链接",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "无效的URL",
              maxLength: "URL应少于800个字符",
            },
          },
          terms_of_service_url: {
            label: "使用条款链接",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "无效的URL",
              maxLength: "URL应少于800个字符",
            },
          },
          cover_image: {
            label: "添加将在市场中显示的封面图片",
            upload_title: "上传封面图片",
            upload_placeholder: "点击上传或拖放上传封面图片",
            drop_here: "拖放到这里",
            click_to_upload: "点击上传",
            invalid_file_or_exceeds_size_limit: "无效的文件或超出大小限制。请重试。",
            upload_and_save: "上传并保存",
            uploading: "上传中",
            remove: "删除",
            removing: "删除中",
            validation: {
              required: "封面图片是必填项",
            },
          },
          attach_screenshots: {
            label: "包含您认为对查看此模板的用户有帮助的文档和图片。",
            validation: {
              required: "至少需要一张截图",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "模板",
        description: "使用Plane中的项目、工作项和页面模板，您无需从头开始创建项目或手动设置工作项属性。",
        sub_description: "使用模板可以收回80%的管理时间。",
      },
      no_templates: {
        button: "创建您的第一个模板",
      },
      no_labels: {
        description: " 还没有标签。创建标签以帮助组织和筛选项目中的工作项。",
      },
      no_work_items: {
        description: "还没有工作项。添加一个以更好地组织您的工作。",
      },
      no_sub_work_items: {
        description: "还没有子工作项。添加一个以更好地组织您的工作。",
      },
      page: {
        no_templates: {
          title: "您没有访问任何模板。",
          description: "请创建一个模板",
        },
        no_results: {
          title: "没有找到模板。",
          description: "尝试使用其他术语搜索。",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "模板已创建",
          message: "{templateName}，{templateType}模板，现已可用于您的工作区。",
        },
        error: {
          title: "这次我们无法创建该模板。",
          message: "尝试再次保存您的详细信息或将它们复制到新模板中，最好在另一个标签页中。",
        },
      },
      update: {
        success: {
          title: "模板已更改",
          message: "{templateName}，{templateType}模板，已被更改。",
        },
        error: {
          title: "我们无法保存对此模板的更改。",
          message: "尝试再次保存您的详细信息或稍后回到此模板。如果仍有问题，请联系我们。",
        },
      },
      delete: {
        success: {
          title: "模板已删除",
          message: "{templateName}，{templateType}模板，已从您的工作区中删除。",
        },
        error: {
          title: "这次我们无法删除该模板。",
          message: "尝试再次删除它或稍后再回来。如果那时您仍无法删除它，请联系我们。",
        },
      },
      unpublish: {
        success: {
          title: "模板已移除",
          message: "{templateName}，{templateType}模板，已被移除。",
        },
        error: {
          title: "这次我们无法移除该模板。",
          message: "尝试再次移除它或稍后再回来。如果那时您仍无法移除它，请联系我们。",
        },
      },
    },
    delete_confirmation: {
      title: "删除模板",
      description: {
        prefix: "您确定要删除模板-",
        suffix: "吗？与该模板相关的所有数据将被永久删除。此操作无法撤消。",
      },
    },
    unpublish_confirmation: {
      title: "移除模板",
      description: {
        prefix: "您确定要移除模板-",
        suffix: "吗？此模板将不再在市场上供用户使用。",
      },
    },
    dropdown: {
      add: {
        work_item: "添加新模板",
        project: "添加新模板",
      },
      label: {
        project: "选择项目模板",
        page: "从模板中选择",
      },
      tooltip: {
        work_item: "选择工作项模板",
      },
      no_results: {
        work_item: "未找到模板。",
        project: "未找到模板。",
      },
    },
  },
  intake_forms: {
    create: {
      title: "创建工作项",
      "sub-title": "让团队知道您希望他们处理什么。",
      name: "名称",
      email: "邮箱",
      about: "此工作项是关于什么的？",
      description: "描述应该发生什么",
      description_placeholder: "添加尽可能多的细节，帮助团队了解您的情况和需求。",
      loading: "创建中",
      create_work_item: "创建工作项",
      errors: {
        name: "名称为必填",
        name_max_length: "名称不得超过 255 个字符",
        email: "邮箱为必填",
        email_invalid: "邮箱地址无效",
        title: "标题为必填",
        title_max_length: "标题不得超过 255 个字符",
      },
    },
    success: {
      title: "您的工作项已加入团队队列。",
      description: "团队现在可以从接收队列中批准或丢弃此工作项。",
      primary_button: {
        text: "添加另一个工作项",
      },
      secondary_button: {
        text: "了解更多关于接收",
      },
    },
    how_it_works: {
      title: "如何运作？",
      heading: "这是接收表单。",
      description: "接收是 Plane 的功能，让项目管理员和经理能将外部工作项纳入项目。",
      steps: {
        step_1: "此简短表单可让您在 Plane 项目中创建新的工作项。",
        step_2: "提交此表单后，会在该项目的接收中创建新的工作项。",
        step_3: "该项目或团队的成员会进行审核。",
        step_4: "若批准，此工作项将移至项目的工作队列；否则将被拒绝。",
        step_5: "若要查询该工作项的状态，请联系项目经理、管理员或提供此页面链接的人。",
      },
    },
    type_forms: {
      select_types: {
        title: "选择工作项类型",
        search_placeholder: "搜索工作项类型",
      },
      actions: {
        select_properties: "选择属性",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "重复工作项",
      description: "设置一次重复工作，我们将处理重复。当需要时，您将在这里看到所有内容。",
      new_recurring_work_item: "创建新的重复工作项",
      update_recurring_work_item: "更新重复工作项",
      form: {
        interval: {
          title: "计划",
          start_date: {
            validation: {
              required: "开始日期为必填项",
            },
          },
          interval_type: {
            validation: {
              required: "间隔类型为必填项",
            },
          },
        },
        button: {
          create: "创建重复工作项",
          update: "更新重复工作项",
        },
      },
      create_button: {
        label: "创建重复工作项",
        no_permission: "请联系您的项目管理员以创建重复工作项",
      },
    },
    empty_state: {
      upgrade: {
        title: "让您的工作自动化",
        description: "只需设置一次，到期时我们会自动为您生成。升级到商业版，让重复工作变得轻松无忧。",
      },
      no_templates: {
        button: "创建您的第一个重复工作项",
      },
    },
    toasts: {
      create: {
        success: {
          title: "重复工作项已创建",
          message: "{name}，该重复工作项，现已在您的工作区中可用。",
        },
        error: {
          title: "本次无法创建该重复工作项。",
          message: "请重试保存您的信息，或将其复制到新的重复工作项中，建议在其他标签页操作。",
        },
      },
      update: {
        success: {
          title: "重复工作项已更改",
          message: "{name}，该重复工作项，已被更改。",
        },
        error: {
          title: "无法保存该重复工作项的更改。",
          message: "请重试保存您的信息，或稍后再回来更改该重复工作项。如果仍有问题，请联系我们。",
        },
      },
      delete: {
        success: {
          title: "重复工作项已删除",
          message: "{name}，该重复工作项，已从您的工作区中删除。",
        },
        error: {
          title: "无法删除该重复工作项。",
          message: "请重试删除，或稍后再试。如果仍无法删除，请联系我们。",
        },
      },
    },
    delete_confirmation: {
      title: "删除重复工作项",
      description: {
        prefix: "您确定要删除重复工作项-",
        suffix: "吗？与该重复工作项相关的所有数据将被永久删除。此操作无法撤销。",
      },
    },
  },
  automations: {
    settings: {
      title: "自定义自动化",
      create_automation: "创建自动化",
    },
    scope: {
      label: "范围",
      run_on: "运行于",
    },
    trigger: {
      label: "触发器",
      add_trigger: "添加触发器",
      sidebar_header: "触发器配置",
      input_label: "此自动化的触发器是什么？",
      input_placeholder: "选择一个选项",
      button: {
        previous: "返回",
        next: "添加操作",
      },
    },
    condition: {
      label: "条件",
      add_condition: "添加条件",
      adding_condition: "正在添加条件",
    },
    action: {
      label: "操作",
      add_action: "添加操作",
      sidebar_header: "操作",
      input_label: "自动化执行什么操作？",
      input_placeholder: "选择一个选项",
      handler_name: {
        add_comment: "添加评论",
        change_property: "更改属性",
      },
      configuration: {
        label: "配置",
        change_property: {
          placeholders: {
            property_name: "选择属性",
            change_type: "选择",
            property_value_select: "{count, plural, other{选择值}}",
            property_value_select_date: "选择日期",
          },
          validation: {
            property_name_required: "属性名称是必需的",
            change_type_required: "更改类型是必需的",
            property_value_required: "属性值是必需的",
          },
        },
      },
      comment_block: {
        title: "添加评论",
      },
      change_property_block: {
        title: "更改属性",
      },
      validation: {
        delete_only_action: "在删除唯一操作之前，请先禁用自动化。",
      },
    },
    conjunctions: {
      and: "并且",
      or: "或者",
      if: "如果",
      then: "那么",
    },
    enable: {
      alert: '当您的自动化完成时，点击"启用"。启用后，自动化将准备运行。',
      validation: {
        required: "自动化必须有一个触发器和至少一个操作才能启用。",
      },
    },
    delete: {
      validation: {
        enabled: "删除自动化之前必须先禁用它。",
      },
    },
    table: {
      title: "自动化标题",
      last_run_on: "最后运行时间",
      created_on: "创建时间",
      last_updated_on: "最后更新时间",
      last_run_status: "最后运行状态",
      average_duration: "平均持续时间",
      owner: "所有者",
      executions: "执行次数",
    },
    create_modal: {
      heading: {
        create: "创建自动化",
        update: "更新自动化",
      },
      title: {
        placeholder: "为您的自动化命名。",
        required_error: "标题是必需的",
      },
      description: {
        placeholder: "描述您的自动化。",
      },
      submit_button: {
        create: "创建自动化",
        update: "更新自动化",
      },
    },
    delete_modal: {
      heading: "删除自动化",
    },
    activity: {
      filters: {
        show_fails: "显示失败",
        all: "全部",
        only_activity: "仅活动",
        only_run_history: "仅运行历史",
      },
      run_history: {
        initiator: "发起者",
      },
    },
    toasts: {
      create: {
        success: {
          title: "成功！",
          message: "自动化创建成功。",
        },
        error: {
          title: "错误！",
          message: "自动化创建失败。",
        },
      },
      update: {
        success: {
          title: "成功！",
          message: "自动化更新成功。",
        },
        error: {
          title: "错误！",
          message: "自动化更新失败。",
        },
      },
      enable: {
        success: {
          title: "成功！",
          message: "自动化启用成功。",
        },
        error: {
          title: "错误！",
          message: "自动化启用失败。",
        },
      },
      disable: {
        success: {
          title: "成功！",
          message: "自动化禁用成功。",
        },
        error: {
          title: "错误！",
          message: "自动化禁用失败。",
        },
      },
      delete: {
        success: {
          title: "自动化已删除",
          message: "{name}，该自动化，现已从您的项目中删除。",
        },
        error: {
          title: "本次无法删除该自动化。",
          message: "请重试删除，或稍后再试。如果仍无法删除，请联系我们。",
        },
      },
      action: {
        create: {
          error: {
            title: "错误！",
            message: "创建操作失败。请重试！",
          },
        },
        update: {
          error: {
            title: "错误！",
            message: "更新操作失败。请重试！",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "还没有自动化可显示。",
        description: "自动化通过设置触发器、条件和操作来帮助您消除重复性任务。创建一个来节省时间并让工作轻松进行。",
      },
      upgrade: {
        title: "自动化",
        description: "自动化是在您的项目中自动执行任务的方式。",
        sub_description: "使用自动化可以节省80%的管理时间。",
      },
    },
  },
  sso: {
    header: "身份",
    description: "配置您的域名以访问安全功能，包括单点登录。",
    domain_management: {
      header: "域名管理",
      verified_domains: {
        header: "已验证的域名",
        description: "验证电子邮件域名的所有权以启用单点登录。",
        button_text: "添加域名",
        list: {
          domain_name: "域名",
          status: "状态",
          status_verified: "已验证",
          status_failed: "失败",
          status_pending: "待处理",
        },
        add_domain: {
          title: "添加域名",
          description: "添加您的域名以配置 SSO 并验证它。",
          form: {
            domain_label: "域名",
            domain_placeholder: "plane.so",
            domain_required: "域名是必需的",
            domain_invalid: "请输入有效的域名（例如 plane.so）",
          },
          primary_button_text: "添加域名",
          primary_button_loading_text: "添加中",
          toast: {
            success_title: "成功！",
            success_message: "域名已成功添加。请通过添加 DNS TXT 记录来验证它。",
            error_message: "添加域名失败。请重试。",
          },
        },
        verify_domain: {
          title: "验证您的域名",
          description: "按照以下步骤验证您的域名。",
          instructions: {
            label: "说明",
            step_1: "转到您的域名主机的 DNS 设置。",
            step_2: {
              part_1: "创建一个",
              part_2: "TXT 记录",
              part_3: "并粘贴下面提供的完整记录值。",
            },
            step_3: "此更新通常需要几分钟，但可能需要长达 72 小时才能完成。",
            step_4: "DNS 记录更新后，点击“验证域名”进行确认。",
          },
          verification_code_label: "TXT 记录值",
          verification_code_description: "将此记录添加到您的 DNS 设置",
          domain_label: "域名",
          primary_button_text: "验证域名",
          primary_button_loading_text: "验证中",
          secondary_button_text: "稍后处理",
          toast: {
            success_title: "成功！",
            success_message: "域名已成功验证。",
            error_message: "验证域名失败。请重试。",
          },
        },
        delete_domain: {
          title: "删除域名",
          description: {
            prefix: "您确定要删除",
            suffix: "吗？此操作无法撤销。",
          },
          primary_button_text: "删除",
          primary_button_loading_text: "删除中",
          secondary_button_text: "取消",
          toast: {
            success_title: "成功！",
            success_message: "域名已成功删除。",
            error_message: "删除域名失败。请重试。",
          },
        },
      },
    },
    providers: {
      header: "单点登录",
      disabled_message: "添加已验证的域名以配置 SSO",
      configure: {
        create: "配置",
        update: "编辑",
      },
      switch_alert_modal: {
        title: "将 SSO 方法切换到 {newProviderShortName}？",
        content:
          "您即将启用 {newProviderLongName}（{newProviderShortName}）。此操作将自动禁用 {activeProviderLongName}（{activeProviderShortName}）。尝试通过 {activeProviderShortName} 登录的用户将无法再访问平台，直到他们切换到新方法。您确定要继续吗？",
        primary_button_text: "切换",
        primary_button_text_loading: "切换中",
        secondary_button_text: "取消",
      },
      form_section: {
        title: "IdP 为 {workspaceName} 提供的详细信息",
      },
      form_action_buttons: {
        saving: "保存中",
        save_changes: "保存更改",
        configure_only: "仅配置",
        configure_and_enable: "配置并启用",
        default: "保存",
      },
      setup_details_section: {
        title: "{workspaceName} 为您的 IdP 提供的详细信息",
        button_text: "获取设置详细信息",
      },
      saml: {
        header: "启用 SAML",
        description: "配置您的 SAML 身份提供商以启用单点登录。",
        configure: {
          title: "启用 SAML",
          description: "验证电子邮件域名的所有权以访问安全功能，包括单点登录。",
          toast: {
            success_title: "成功！",
            create_success_message: "SAML 提供商已成功创建。",
            update_success_message: "SAML 提供商已成功更新。",
            error_title: "错误！",
            error_message: "保存 SAML 提供商失败。请重试。",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web 详细信息",
            entity_id: {
              label: "实体 ID | 受众 | 元数据信息",
              description: "我们将生成这部分元数据，将 Plane 应用识别为 IdP 上的授权服务。",
            },
            callback_url: {
              label: "单点登录 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的登录重定向 URL 字段中。",
            },
            logout_url: {
              label: "单点注销 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的单点注销重定向 URL 字段中。",
            },
          },
          mobile_details: {
            header: "移动端详细信息",
            entity_id: {
              label: "实体 ID | 受众 | 元数据信息",
              description: "我们将生成这部分元数据，将 Plane 应用识别为 IdP 上的授权服务。",
            },
            callback_url: {
              label: "单点登录 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的登录重定向 URL 字段中。",
            },
            logout_url: {
              label: "单点注销 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的注销重定向 URL 字段中。",
            },
          },
          mapping_table: {
            header: "映射详细信息",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "启用 OIDC",
        description: "配置您的 OIDC 身份提供商以启用单点登录。",
        configure: {
          title: "启用 OIDC",
          description: "验证电子邮件域名的所有权以访问安全功能，包括单点登录。",
          toast: {
            success_title: "成功！",
            create_success_message: "OIDC 提供商已成功创建。",
            update_success_message: "OIDC 提供商已成功更新。",
            error_title: "错误！",
            error_message: "保存 OIDC 提供商失败。请重试。",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web 详细信息",
            origin_url: {
              label: "源 URL",
              description: "我们将为此 Plane 应用生成此内容。将其作为受信任的源添加到 IdP 的相应字段中。",
            },
            callback_url: {
              label: "重定向 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的登录重定向 URL 字段中。",
            },
            logout_url: {
              label: "注销 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的注销重定向 URL 字段中。",
            },
          },
          mobile_details: {
            header: "移动端详细信息",
            origin_url: {
              label: "源 URL",
              description: "我们将为此 Plane 应用生成此内容。将其作为受信任的源添加到 IdP 的相应字段中。",
            },
            callback_url: {
              label: "重定向 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的登录重定向 URL 字段中。",
            },
            logout_url: {
              label: "注销 URL",
              description: "我们将为您生成此内容。将其添加到 IdP 的注销重定向 URL 字段中。",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "项目名称不能包含特殊字符。",
  pql: {
    functions: {
      date: {
        now: {
          description: "当前日期和时间",
        },
        today: {
          description: "今天的日期",
        },
        start_of_day: {
          description: "今天开始",
        },
        end_of_day: {
          description: "今天结束",
        },
        start_of_week: {
          description: "本周开始",
        },
        end_of_week: {
          description: "本周结束",
        },
        start_of_month: {
          description: "本月开始",
        },
        end_of_month: {
          description: "本月结束",
        },
        start_of_year: {
          description: "今年开始",
        },
        end_of_year: {
          description: "今年结束",
        },
        days_ago: {
          description: "n 天前的日期",
        },
        days_from_now: {
          description: "n 天后的日期",
        },
        weeks_ago: {
          description: "n 周前的日期",
        },
        weeks_from_now: {
          description: "n 周后的日期",
        },
        months_ago: {
          description: "n 个月前的日期",
        },
        months_from_now: {
          description: "n 个月后的日期",
        },
      },
      user: {
        current_user: {
          description: "当前登录用户",
        },
        members_of: {
          description: '"project:<id>" 或 "teamspace:<id>" 的成员',
        },
        workspace_members: {
          description: "所有工作区成员",
        },
      },
      cycle: {
        active_cycle: {
          description: "今天活跃的周期",
        },
        completed_cycles: {
          description: "结束日期已过的周期",
        },
        upcoming_cycles: {
          description: "开始日期在未来的周期",
        },
      },
      state: {
        open_states: {
          description: "backlog, unstarted, started",
        },
        closed_states: {
          description: "completed, canceled",
        },
        active_states: {
          description: "unstarted, started",
        },
      },
      predicate: {
        is_overdue: {
          description: "截止日期已过且状态为开放",
        },
        has_no_assignee: {
          description: "工作项没有负责人",
        },
        has_no_label: {
          description: "工作项没有标签",
        },
        is_top_level: {
          description: "不是子工作项（没有父项）",
        },
        is_sub_work_item: {
          description: "是子工作项（有父项）",
        },
        is_epic: {
          description: "史诗",
        },
        is_intake: {
          description: "是接收工作项",
        },
        is_draft: {
          description: "是草稿工作项",
        },
        is_archived: {
          description: "已归档",
        },
        has_children: {
          description: "至少有一个子工作项",
        },
        has_start_and_due_dates: {
          description: "同时有开始日期和截止日期",
        },
      },
      relation: {
        linked_to: {
          description: "与给定工作项相关的工作项",
        },
        blocked_by: {
          description: "被给定工作项阻塞的工作项",
        },
        blocks: {
          description: "阻塞给定工作项的工作项",
        },
        child_of: {
          description: "给定工作项的子工作项",
        },
        parent_of: {
          description: "给定工作项的父工作项",
        },
        duplicate_of: {
          description: "标记为给定工作项重复项的工作项",
        },
      },
      history: {
        was_ever: {
          description: "字段曾经被设置为此值",
        },
        was: {
          description: "字段之前是此值（已更改）",
        },
        changed_from: {
          description: "字段从此值更改",
        },
        changed_to: {
          description: "字段更改为此值",
        },
        changed: {
          description: "字段已更改",
        },
        updated_by: {
          description: "此用户更新的工作项",
        },
        commented_by: {
          description: "此用户评论的工作项",
        },
        field_changed_by: {
          description: "此用户更改的字段",
        },
        was_assigned_to: {
          description: "分配给此用户的工作项",
        },
        changed_after: {
          description: "在此日期之后更改的字段",
        },
        changed_before: {
          description: "在此日期之前更改的字段",
        },
        field_changed_after: {
          description: "在此日期之后更改的字段",
        },
        field_changed_before: {
          description: "在此日期之前更改的字段",
        },
        changed_to_after: {
          description: "在此日期之后更改为此值的字段",
        },
        changed_to_before: {
          description: "在此日期之前更改为此值的字段",
        },
        field_changed_between: {
          description: "在这些日期之间更改的字段",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "导航",
      accept: "确认",
      close: "关闭",
      pick_date: "选择日期",
    },
    placeholder: '输入查询并按 "ENTER" 进行筛选...',
    error: "提交查询时出错。请检查后重试。",
  },
  releases: {
    label: "{count, plural, one {发布} other {发布}}",
    no_release: "暂无发布",
    unreleased: "未发布",
    select_releases: "选择发布",
    overview: "概览",
    scope: "范围",
    page_title: {
      scope: "发布 - {name} | 范围",
      scope_fallback: "发布 | 范围",
    },
    properties: "属性",
    target_date: "目标日期",
    lead: "负责人",
    release_tag: "标签",
    labels: "标签",
    description_placeholder: "添加描述...",
    progress: "进度",
    completed_work_items: "已完成工作项",
    pending_work_items: "待处理工作项",
    cancelled_work_items: "已取消工作项",
    scope_page: {
      work_items: "工作项",
      add_work_items: "添加工作项",
      remove_from_release: "从发布中移除",
      empty_state: {
        title: "暂无工作项",
        description: "添加工作项以定义发布范围。",
      },
      confirm_remove: {
        content: "确定要从发布中移除此工作项吗？它仍将保留在项目中。",
        primary_button: {
          default: "移除",
          loading: "正在移除",
        },
      },
    },
    empty_state: {
      title: "暂无范围",
      description: "将工作项添加到此发布，以跟踪它们在此发布中的完成情况。",
      add_scope: "添加范围",
      not_found: {
        title: "未找到发布",
        description: "该发布可能已被删除。",
        primary_button: "返回发布列表",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {已添加工作项} other {已添加工作项}}",
      work_items_error: "添加工作项失败",
    },
    count_releases: "{count, plural, one {# 发布} other {# 发布}}",
    actions: {
      delete: "删除",
    },
    delete_modal: {
      title: "删除发布",
      content: "您确定要删除发布“{releaseName}”吗？此操作无法撤销。",
    },
    settings: {
      heading: {
        title: "发布",
        description: "使用发布精准管理项目交付物。",
      },
      toggle: {
        title: "启用发布",
        description: "工作区成员将在各自的项目中拥有该范围的查看权限。",
      },
      toasts: {
        enable: {
          loading: "正在启用发布...",
          success: {
            title: "已启用发布",
            message: "已为该工作区启用发布。",
          },
          error: {
            title: "错误",
            message: "启用发布失败。请重试。",
          },
        },
        disable: {
          loading: "正在禁用发布...",
          success: {
            title: "已禁用发布",
            message: "已为该工作区禁用发布。",
          },
          error: {
            title: "错误",
            message: "禁用发布失败。请重试。",
          },
        },
      },
      tabs: {
        tags: "发布标签",
        labels: "标签",
      },
      tags: {
        title: "发布标签",
        description: "使用标签对发布进行分类和筛选。",
        add: "添加标签",
        empty_state: "还没有标签。创建您的第一个标签。",
        errors: {
          version_required: "版本为必填项。",
          version_already_exists: "已存在具有此版本的标签。",
          generic: "出了点问题。请重试。",
        },
        delete_modal: {
          title: "删除标签",
          content: "您确定要删除标签“{tagVersion}”吗？此操作无法撤销。",
        },
        actions: {
          edit: "编辑标签",
          delete: "删除标签",
        },
        toasts: {
          delete: {
            success: "标签已成功删除。",
            error: "删除标签失败。请重试。",
          },
        },
      },
      labels: {
        title: "标签",
        description: "使用标签来整理和组织您的计划。",
        add: "添加标签",
        empty_state: "还没有标签。创建您的第一个标签。",
        errors: {
          name_required: "名称为必填项。",
          name_already_exists: "已存在同名标签。",
          generic: "出了点问题。请重试。",
        },
        modal: {
          name_placeholder: "标签名称",
          pick_color: "选择标签颜色",
        },
        actions: {
          edit: "编辑标签",
          delete: "删除标签",
        },
        drag_to_reorder: "拖动以重新排序",
        delete_modal: {
          title: "删除标签",
          content: "您确定要删除标签“{labelName}”吗？此操作无法撤销。",
        },
        toasts: {
          delete: {
            success: "标签已成功删除。",
            error: "删除标签失败。请重试。",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "层级",
      tab_label: "层级",
      description: "设置层级结构以整理您的工作。每个层级定义与直接上方项目的父关系，以及与直接下方项目的子关系。 ",
      sidebar_label: "层级",
      enable_control: {
        title: "启用层级",
        description: "在不同工作项类型之间建立父子关系。",
        tooltip: "层级一旦启用便无法停用。",
      },
      workspace_work_item_types_disabled_banner: {
        content: "请先定义工作项类型，再创建新的层级。",
        cta: "工作项类型设置",
      },
    },
    levels: {
      add_level_button: "添加层级",
      empty_level_placeholder: "向第 {level} 层添加工作项类型",
      empty_level_unauthorized: "此层级中未找到工作项类型。",
      zero_level_description: "默认情况下，所有工作项类型在分配到层级结构之前均处于第 0 层。",
    },
    add_level_modal: {
      title: "添加层级",
      description: "为工作项类型添加新的层级。",
      work_item_type: "工作项类型",
      empty_state: {
        title: "所有工作项类型已在使用中",
        description: "此工作区中定义的每个工作项类型已是您层级的一部分。",
      },
      invalid_level_toast: {
        title: "错误！",
        message: "{type_name} 无法添加至第 {level} 层，因为这违反了层级规则。",
      },
      not_found_toast: {
        title: "错误",
        message: "未找到工作项类型。",
      },
      error_toast: {
        title: "错误",
        message: "无法将工作项类型添加至层级。",
      },
    },
    remove_from_level_toast: {
      loading: "正在从层级移除工作项类型",
      success: {
        title: "成功！",
        message: "已成功从层级移除工作项类型。",
      },
      error: {
        title: "错误！",
        message: "无法从层级移除工作项类型。",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "错误！",
        message: "所选工作项类型违反层级规则，无法用于创建新的工作项。",
      },
      invalid_work_item_type_update_toast: {
        title: "错误！",
        message: "工作项类型因违反层级规则而无法更新。",
      },
    },
  },
} as const;

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
    we_are_working_on_this_if_you_need_immediate_assistance: "我們正在處理此問題。如果您需要緊急協助，",
    reach_out_to_us: "請聯絡我們",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our: "否則，請偶爾重新整理頁面或造訪我們的",
    status_page: "狀態頁面",
  },
  sidebar: {
    projects: "專案",
    pages: "頁面",
    new_work_item: "新工作項目",
    home: "首頁",
    your_work: "你的工作",
    inbox: "收件匣",
    workspace: "工作區",
    views: "視圖",
    analytics: "分析",
    work_items: "工作項目",
    cycles: "週期",
    modules: "模組",
    intake: "接收",
    drafts: "草稿",
    favorites: "收藏",
    pro: "專業版",
    upgrade: "升級",
    pi_chat: "AI 聊天",
    initiatives: "計劃",
    teamspaces: "團隊空間",
    epics: "史詩",
    upgrade_plan: "升級方案",
    plane_pro: "平面專業版",
    business: "商業",
    customers: "客戶",
    recurring_work_items: "重複工作項目",
  },
  auth: {
    common: {
      email: {
        label: "電子郵件",
        placeholder: "name@company.com",
        errors: {
          required: "必須填寫電子郵件",
          invalid: "電子郵件無效",
        },
      },
      password: {
        label: "密碼",
        set_password: "設定密碼",
        placeholder: "輸入密碼",
        confirm_password: {
          label: "確認密碼",
          placeholder: "確認密碼",
        },
        current_password: {
          label: "目前密碼",
        },
        new_password: {
          label: "新密碼",
          placeholder: "輸入新密碼",
        },
        change_password: {
          label: {
            default: "更改密碼",
            submitting: "正在更改密碼",
          },
        },
        errors: {
          match: "密碼不匹配",
          empty: "請輸入密碼",
          length: "密碼長度應超過8個字符",
          strength: {
            weak: "密碼強度弱",
            strong: "密碼強度強",
          },
        },
        submit: "設定密碼",
        toast: {
          change_password: {
            success: {
              title: "成功！",
              message: "密碼已成功更改。",
            },
            error: {
              title: "錯誤！",
              message: "出現問題。請重試。",
            },
          },
        },
      },
      unique_code: {
        label: "唯一代碼",
        placeholder: "123456",
        paste_code: "貼上傳送到您電子郵件的代碼",
        requesting_new_code: "正在請求新代碼",
        sending_code: "正在發送代碼",
      },
      already_have_an_account: "已有帳戶？",
      login: "登入",
      create_account: "創建帳戶",
      new_to_plane: "初次使用Plane？",
      back_to_sign_in: "返回登入",
      resend_in: "{seconds}秒後重新發送",
      sign_in_with_unique_code: "使用唯一代碼登入",
      forgot_password: "忘記密碼？",
      username: {
        label: "使用者名稱",
        placeholder: "請輸入您的使用者名稱",
      },
    },
    sign_up: {
      header: {
        label: "創建帳戶開始與團隊一起管理工作。",
        step: {
          email: {
            header: "註冊",
            sub_header: "",
          },
          password: {
            header: "註冊",
            sub_header: "使用電子郵件-密碼組合註冊。",
          },
          unique_code: {
            header: "註冊",
            sub_header: "使用發送到上述電子郵件的唯一代碼註冊。",
          },
        },
      },
      errors: {
        password: {
          strength: "請設定強密碼以繼續",
        },
      },
    },
    sign_in: {
      header: {
        label: "登入開始與團隊一起管理工作。",
        step: {
          email: {
            header: "登入或註冊",
            sub_header: "",
          },
          password: {
            header: "登入或註冊",
            sub_header: "使用您的電子郵件-密碼組合登入。",
          },
          unique_code: {
            header: "登入或註冊",
            sub_header: "使用發送到上述電子郵件地址的唯一代碼登入。",
          },
        },
      },
    },
    forgot_password: {
      title: "重設密碼",
      description: "輸入您的用戶帳戶已驗證的電子郵件地址，我們將向您發送密碼重設連結。",
      email_sent: "我們已將重設連結發送到您的電子郵件地址",
      send_reset_link: "發送重設連結",
      errors: {
        smtp_not_enabled: "我們發現您的管理員尚未啟用SMTP，我們將無法發送密碼重設連結",
      },
      toast: {
        success: {
          title: "郵件已發送",
          message: "請查看您的收件箱以獲取重設密碼的連結。如果幾分鐘內未收到，請檢查垃圾郵件文件夾。",
        },
        error: {
          title: "錯誤！",
          message: "出現問題。請重試。",
        },
      },
    },
    reset_password: {
      title: "設定新密碼",
      description: "使用強密碼保護您的帳戶",
    },
    set_password: {
      title: "保護您的帳戶",
      description: "設定密碼有助於您安全登入",
    },
    sign_out: {
      toast: {
        error: {
          title: "錯誤！",
          message: "登出失敗。請重試。",
        },
      },
    },
    ldap: {
      header: {
        label: "使用 {ldapProviderName} 繼續",
        sub_header: "請輸入您的 {ldapProviderName} 憑證",
      },
    },
  },
  submit: "送出",
  cancel: "取消",
  loading: "載入中",
  error: "錯誤",
  success: "成功",
  warning: "警告",
  info: "資訊",
  close: "關閉",
  yes: "是",
  no: "否",
  ok: "確定",
  name: "名稱",
  description: "描述",
  search: "搜尋",
  add_member: "新增成員",
  adding_members: "新增成員中",
  remove_member: "移除成員",
  add_members: "新增成員",
  adding_member: "新增成員中",
  remove_members: "移除成員",
  add: "新增",
  adding: "新增中",
  remove: "移除",
  add_new: "新增",
  remove_selected: "移除已選取項目",
  first_name: "名字",
  last_name: "姓氏",
  email: "電子郵件",
  display_name: "顯示名稱",
  role: "角色",
  timezone: "時區",
  avatar: "大頭貼",
  cover_image: "封面圖片",
  password: "密碼",
  change_cover: "更換封面",
  language: "語言",
  saving: "儲存中",
  save_changes: "儲存變更",
  deactivate_account: "停用帳號",
  deactivate_account_description: "停用帳號時，該帳號內的所有資料和資源將被永久移除，且無法復原。",
  profile_settings: "個人資料設定",
  your_account: "您的帳號",
  security: "安全性",
  activity: "活動",
  appearance: "外觀",
  notifications: "通知",
  workspaces: "工作區",
  create_workspace: "建立工作區",
  invitations: "邀請",
  summary: "摘要",
  assigned: "已指派",
  created: "已建立",
  subscribed: "已訂閱",
  you_do_not_have_the_permission_to_access_this_page: "您沒有權限存取此頁面。",
  something_went_wrong_please_try_again: "發生錯誤，請再試一次。",
  load_more: "載入更多",
  select_or_customize_your_interface_color_scheme: "選擇或自訂您的介面配色方案。",
  select_the_cursor_motion_style_that_feels_right_for_you: "選擇適合您的游標移動樣式。",
  theme: "主題",
  smooth_cursor: "平滑游標",
  system_preference: "系統偏好",
  light: "淺色",
  dark: "深色",
  light_contrast: "高對比淺色",
  dark_contrast: "高對比深色",
  custom: "自訂主題",
  select_your_theme: "選擇您的主題",
  customize_your_theme: "自訂您的主題",
  background_color: "背景顏色",
  text_color: "文字顏色",
  primary_color: "主要 (主題) 顏色",
  sidebar_background_color: "側邊欄背景顏色",
  sidebar_text_color: "側邊欄文字顏色",
  set_theme: "設定主題",
  enter_a_valid_hex_code_of_6_characters: "請輸入有效的 6 位數十六進位色碼",
  background_color_is_required: "背景顏色為必填",
  text_color_is_required: "文字顏色為必填",
  primary_color_is_required: "主要顏色為必填",
  sidebar_background_color_is_required: "側邊欄背景顏色為必填",
  sidebar_text_color_is_required: "側邊欄文字顏色為必填",
  updating_theme: "更新主題中",
  theme_updated_successfully: "主題更新成功",
  failed_to_update_the_theme: "主題更新失敗",
  email_notifications: "電子郵件通知",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "持續追蹤您訂閱的工作事項。啟用此功能以接收通知。",
  email_notification_setting_updated_successfully: "電子郵件通知設定更新成功",
  failed_to_update_email_notification_setting: "電子郵件通知設定更新失敗",
  notify_me_when: "在以下情況通知我",
  property_changes: "屬性變更",
  property_changes_description: "當工作事項的屬性 (如：指派對象、優先順序、評估等) 發生變更時通知我。",
  state_change: "狀態變更",
  state_change_description: "當工作事項狀態變更時通知我",
  issue_completed: "工作事項完成",
  issue_completed_description: "僅在工作事項完成時通知我",
  comments: "留言",
  comments_description: "當有人在工作事項上留下留言時通知我",
  mentions: "提及",
  mentions_description: "僅在有人在留言或描述中提及我時通知我",
  old_password: "舊密碼",
  general_settings: "一般設定",
  sign_out: "登出",
  signing_out: "登出中",
  active_cycles: "進行中的週期",
  active_cycles_description: "監控跨專案的週期、追蹤高優先順序工作事項，並關注需要注意的週期。",
  on_demand_snapshots_of_all_your_cycles: "依需求檢視所有週期的快照",
  upgrade: "升級",
  "10000_feet_view": "俯瞰所有進行中的週期。",
  "10000_feet_view_description": "一次檢視所有專案的進行中週期，不需逐一檢視每個專案的週期。",
  get_snapshot_of_each_active_cycle: "取得每個進行中週期的快照。",
  get_snapshot_of_each_active_cycle_description: "追蹤所有進行中週期的高階指標，檢視其進度狀態，並根據期限衡量範圍。",
  compare_burndowns: "比較燃盡圖。",
  compare_burndowns_description: "透過檢視每個週期的燃盡報告來監控每個團隊的表現。",
  quickly_see_make_or_break_issues: "快速檢視關鍵工作事項。",
  quickly_see_make_or_break_issues_description:
    "預覽每個週期中相對於截止日期的高優先順序工作事項。一鍵檢視每個週期的所有工作事項。",
  zoom_into_cycles_that_need_attention: "關注需要注意的週期。",
  zoom_into_cycles_that_need_attention_description: "一鍵調查任何不符合預期的週期狀態。",
  stay_ahead_of_blockers: "預防阻礙。",
  stay_ahead_of_blockers_description: "發現跨專案的挑戰，並檢視其他檢視無法明顯看出的週期間相依性。",
  analytics: "分析",
  workspace_invites: "工作區邀請",
  enter_god_mode: "進入管理員模式",
  workspace_logo: "工作區標誌",
  new_issue: "新增工作事項",
  your_work: "您的工作",
  drafts: "草稿",
  projects: "專案",
  views: "檢視",
  archives: "封存",
  settings: "設定",
  failed_to_move_favorite: "無法移動我的最愛",
  favorites: "我的最愛",
  no_favorites_yet: "尚無我的最愛",
  create_folder: "建立資料夾",
  new_folder: "新資料夾",
  favorite_updated_successfully: "我的最愛更新成功",
  favorite_created_successfully: "我的最愛建立成功",
  folder_already_exists: "資料夾已存在",
  folder_name_cannot_be_empty: "資料夾名稱不能為空",
  something_went_wrong: "發生錯誤",
  failed_to_reorder_favorite: "無法重新排序我的最愛",
  favorite_removed_successfully: "我的最愛移除成功",
  failed_to_create_favorite: "無法建立我的最愛",
  failed_to_rename_favorite: "無法重新命名我的最愛",
  project_link_copied_to_clipboard: "專案連結已複製到剪貼簿",
  link_copied: "連結已複製",
  add_project: "新增專案",
  create_project: "建立專案",
  failed_to_remove_project_from_favorites: "無法從我的最愛移除專案。請再試一次。",
  project_created_successfully: "專案建立成功",
  project_created_successfully_description: "專案建立成功。您現在可以開始新增工作事項。",
  project_name_already_taken: "專案名稱已被使用。",
  project_identifier_already_taken: "專案識別碼已被使用。",
  project_cover_image_alt: "專案封面圖片",
  name_is_required: "名稱為必填",
  title_should_be_less_than_255_characters: "標題不應超過 255 個字元",
  project_name: "專案名稱",
  project_id_must_be_at_least_1_character: "專案 ID 至少必須有 1 個字元",
  project_id_must_be_at_most_5_characters: "專案 ID 最多只能有 5 個字元",
  project_id: "專案 ID",
  project_id_tooltip_content: "協助您唯一識別專案中的工作事項。最多 10 個字元。",
  description_placeholder: "描述",
  only_alphanumeric_non_latin_characters_allowed: "僅允許英數字元和非拉丁字元。",
  project_id_is_required: "專案 ID 為必填",
  project_id_allowed_char: "僅允許英數字元和非拉丁字元。",
  project_id_min_char: "專案 ID 至少必須有 1 個字元",
  project_id_max_char: "專案 ID 最多只能有 10 個字元",
  project_description_placeholder: "輸入專案描述",
  select_network: "選擇網路",
  lead: "負責人",
  date_range: "日期範圍",
  private: "私人",
  public: "公開",
  accessible_only_by_invite: "僅受邀者可存取",
  anyone_in_the_workspace_except_guests_can_join: "工作區中除了訪客以外的任何人都可以加入",
  creating: "建立中",
  creating_project: "建立專案中",
  adding_project_to_favorites: "將專案加入我的最愛",
  project_added_to_favorites: "專案已加入我的最愛",
  couldnt_add_the_project_to_favorites: "無法將專案加入我的最愛。請再試一次。",
  removing_project_from_favorites: "從我的最愛移除專案中",
  project_removed_from_favorites: "專案已從我的最愛移除",
  couldnt_remove_the_project_from_favorites: "無法從我的最愛移除專案。請再試一次。",
  add_to_favorites: "加入我的最愛",
  remove_from_favorites: "從我的最愛移除",
  publish_project: "發佈專案",
  publish: "發布",
  copy_link: "複製連結",
  leave_project: "離開專案",
  join_the_project_to_rearrange: "加入專案以重新排列",
  drag_to_rearrange: "拖曳以重新排列",
  congrats: "恭喜！",
  open_project: "開啟專案",
  issues: "工作事項",
  cycles: "週期",
  modules: "模組",
  pages: {
    link_pages: "連接頁面",
    show_wiki_pages: "顯示 Wiki 頁面",
    link_pages_to: "連接頁面到",
    linked_pages: "連接的頁面",
    no_description: "此頁面為空。在此輸入一些內容，並在此處查看此佔位符",
    toasts: {
      link: {
        success: {
          title: "頁面已更新",
          message: "頁面已成功更新",
        },
        error: {
          title: "頁面未更新",
          message: "頁面無法更新",
        },
      },
      remove: {
        success: {
          title: "頁面已刪除",
          message: "頁面已成功刪除",
        },
        error: {
          title: "頁面未刪除",
          message: "頁面無法刪除",
        },
      },
    },
  },
  intake: "進件",
  renew: "更新",
  preview: "預覽",
  time_tracking: "時間追蹤",
  work_management: "工作管理",
  projects_and_issues: "專案與工作事項",
  projects_and_issues_description: "為此專案開啟或關閉這些功能。",
  cycles_description: "為每個專案設定工作時間區段，並依需求調整週期。一個週期可以是兩週，下一個是一週。",
  modules_description: "將工作組織成子專案，並指派專屬的負責人與任務對象。",
  views_description: "儲存自訂排序、篩選和顯示選項，或與團隊分享。",
  pages_description: "建立與編輯自由格式內容：筆記、文件，任何內容皆可。",
  intake_description: "允許非成員分享錯誤、回饋和建議，而不會中斷您的工作流程。",
  time_tracking_description: "記錄在工作事項和專案上花費的時間。",
  work_management_description: "輕鬆管理您的工作和專案。",
  documentation: "文件",
  message_support: "聯絡支援",
  contact_sales: "聯絡業務",
  hyper_mode: "極速模式",
  keyboard_shortcuts: "鍵盤快速鍵",
  whats_new: "新功能",
  version: "版本",
  we_are_having_trouble_fetching_the_updates: "我們在取得更新時遇到問題。",
  our_changelogs: "我們的更新日誌",
  for_the_latest_updates: "以取得最新更新。",
  please_visit: "請造訪",
  docs: "文件",
  full_changelog: "完整更新日誌",
  support: "支援",
  forum: "Forum",
  powered_by_plane_pages: "由 Plane Pages 提供",
  please_select_at_least_one_invitation: "請至少選擇一個邀請。",
  please_select_at_least_one_invitation_description: "請至少選擇一個邀請加入工作區。",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "我們發現有人邀請您加入工作區",
  join_a_workspace: "加入工作區",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description: "我們發現有人邀請您加入工作區",
  join_a_workspace_description: "加入工作區",
  accept_and_join: "接受並加入",
  go_home: "回首頁",
  no_pending_invites: "沒有待處理的邀請",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "如果有人邀請您加入工作區，您可以在此處檢視",
  back_to_home: "回到首頁",
  workspace_name: "工作區名稱",
  deactivate_your_account: "停用您的帳號",
  deactivate_your_account_description:
    "一旦停用，您將無法被指派工作事項，並且不會被收費。若要重新啟用帳號，您需要使用此電子郵件地址收到工作區的邀請。",
  deactivating: "停用中",
  confirm: "確認",
  confirming: "確認中",
  draft_created: "草稿已建立",
  issue_created_successfully: "工作事項建立成功",
  draft_creation_failed: "草稿建立失敗",
  issue_creation_failed: "工作事項建立失敗",
  draft_issue: "草稿工作事項",
  issue_updated_successfully: "工作事項更新成功",
  issue_could_not_be_updated: "工作事項無法更新",
  create_a_draft: "建立草稿",
  save_to_drafts: "儲存為草稿",
  save: "儲存",
  update: "更新",
  updating: "更新中",
  create_new_issue: "建立新工作事項",
  editor_is_not_ready_to_discard_changes: "編輯器尚未準備好捨棄變更",
  failed_to_move_issue_to_project: "無法將工作事項移至專案",
  create_more: "建立更多",
  add_to_project: "新增至專案",
  discard: "捨棄",
  duplicate_issue_found: "找到重複的工作事項",
  duplicate_issues_found: "找到重複的工作事項",
  no_matching_results: "沒有符合的結果",
  title_is_required: "標題為必填",
  title: "標題",
  state: "狀態",
  priority: "優先順序",
  none: "無",
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
  members: "成員",
  assignee: "指派對象",
  assignees: "指派對象",
  subscriber: "{count, plural, one{# 位訂閱者} other{# 位訂閱者}}",
  you: "您",
  labels: "標籤",
  create_new_label: "建立新標籤",
  label_name: "標籤名稱",
  failed_to_create_label: "建立標籤失敗，請重試。",
  start_date: "開始日期",
  end_date: "結束日期",
  due_date: "截止日期",
  estimate: "評估",
  change_parent_issue: "變更父工作事項",
  remove_parent_issue: "移除父工作事項",
  add_parent: "新增上層",
  loading_members: "載入成員中",
  view_link_copied_to_clipboard: "檢視連結已複製到剪貼簿。",
  required: "必填",
  optional: "選填",
  Cancel: "取消",
  edit: "編輯",
  archive: "封存",
  restore: "還原",
  open_in_new_tab: "在新分頁中開啟",
  delete: "刪除",
  deleting: "刪除中",
  make_a_copy: "複製一份",
  move_to_project: "移至專案",
  good: "早安",
  morning: "早上",
  afternoon: "下午",
  evening: "晚上",
  show_all: "顯示全部",
  show_less: "顯示較少",
  no_data_yet: "尚無資料",
  syncing: "同步中",
  add_work_item: "新增工作事項",
  advanced_description_placeholder: "按 '/' 以使用指令",
  create_work_item: "建立工作事項",
  attachments: "附件",
  declining: "拒絕中",
  declined: "已拒絕",
  decline: "拒絕",
  unassigned: "未指派",
  work_items: "工作事項",
  add_link: "新增連結",
  points: "點數",
  no_assignee: "無指派對象",
  no_assignees_yet: "尚無指派對象",
  no_labels_yet: "尚無標籤",
  ideal: "理想",
  current: "目前",
  no_matching_members: "沒有符合的成員",
  leaving: "離開中",
  removing: "移除中",
  leave: "離開",
  refresh: "重新整理",
  refreshing: "重新整理中",
  refresh_status: "重新整理狀態",
  prev: "上一頁",
  next: "下一頁",
  re_generating: "重新產生中",
  re_generate: "重新產生",
  re_generate_key: "重新產生金鑰",
  export: "匯出",
  member: "{count, plural, one{# 位成員} other{# 位成員}}",
  new_password_must_be_different_from_old_password: "新密碼必須與舊密碼不同",
  edited: "已編輯",
  bot: "機器人",
  project_view: {
    sort_by: {
      created_at: "建立時間",
      updated_at: "更新時間",
      name: "名稱",
    },
  },
  upgrade_request: "請洽工作區管理員升級。",
  copied_to_clipboard: "已複製到剪貼簿",
  copied_to_clipboard_description: "URL 已成功複製到您的剪貼簿",
  toast: {
    success: "成功！",
    error: "錯誤！",
  },
  links: {
    toasts: {
      created: {
        title: "連結已建立",
        message: "連結已成功建立",
      },
      not_created: {
        title: "連結未建立",
        message: "無法建立連結",
      },
      updated: {
        title: "連結已更新",
        message: "連結已成功更新",
      },
      not_updated: {
        title: "連結未更新",
        message: "無法更新連結",
      },
      removed: {
        title: "連結已移除",
        message: "連結已成功移除",
      },
      not_removed: {
        title: "連結未移除",
        message: "無法移除連結",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "您的快速入門指南",
      not_right_now: "現在不要",
      create_project: {
        title: "建立專案",
        description: "Plane 中的大多數事情都始於一個專案。",
        cta: "開始使用",
      },
      invite_team: {
        title: "邀請您的團隊",
        description: "與同事一起建立、發佈和管理。",
        cta: "邀請他們",
      },
      configure_workspace: {
        title: "設定您的工作區。",
        description: "開啟或關閉功能，或進一步調整。",
        cta: "設定此工作區",
      },
      personalize_account: {
        title: "讓 Plane 成為您的。",
        description: "選擇您的圖片、配色及其他個人化設定。",
        cta: "立即個人化",
      },
      widgets: {
        title: "沒有小工具很安靜，開啟它們吧",
        description: `看起來您的所有小工具都已關閉。現在
啟用它們以提升您的體驗！`,
        primary_button: {
          text: "管理小工具",
        },
      },
    },
    quick_links: {
      empty: "儲存您想要隨手可得的工作連結。",
      add: "新增快速連結",
      title: "快速連結",
      title_plural: "快速連結",
    },
    recents: {
      title: "最近",
      empty: {
        project: "一旦您造訪專案，您的最近專案就會出現在這裡。",
        page: "一旦您造訪頁面，您的最近頁面就會出現在這裡。",
        issue: "一旦您造訪工作事項，您的最近工作事項就會出現在這裡。",
        default: "您還沒有任何最近項目。",
      },
      filters: {
        all: "所有",
        projects: "專案",
        pages: "頁面",
        issues: "工作事項",
      },
    },
    new_at_plane: {
      title: "Plane 新功能",
    },
    quick_tutorial: {
      title: "快速教學",
    },
    widget: {
      reordered_successfully: "小工具重新排序成功。",
      reordering_failed: "重新排序小工具時發生錯誤。",
    },
    manage_widgets: "管理小工具",
    title: "首頁",
    star_us_on_github: "在 GitHub 上給我們星星",
    business_trial_banner: {
      title: "您的14天Business方案試用已啟動！",
      description: "探索所有Business功能。準備好後，選擇訂閱。不會自動收費。",
      trial_ends_today: "試用今天結束",
      trial_ends_in_days: "試用將在{days}天後結束",
      start_subscription: "開始訂閱",
      explore_business_features: "探索Business功能",
    },
  },
  link: {
    modal: {
      url: {
        text: "網址",
        required: "網址無效",
        placeholder: "輸入或貼上網址",
      },
      title: {
        text: "顯示標題",
        placeholder: "您希望如何顯示這個連結",
      },
    },
  },
  common: {
    all: "全部",
    no_items_in_this_group: "此群組中沒有項目",
    drop_here_to_move: "拖放到此處以移動",
    states: "狀態",
    state: "狀態",
    state_groups: "狀態群組",
    state_group: "狀態群組",
    priorities: "優先順序",
    priority: "優先順序",
    team_project: "團隊專案",
    project: "專案",
    cycle: "週期",
    cycles: "週期",
    module: "模組",
    modules: "模組",
    labels: "標籤",
    label: "標籤",
    assignees: "指派對象",
    assignee: "指派對象",
    created_by: "建立者",
    none: "無",
    link: "連結",
    estimates: "評估",
    estimate: "評估",
    created_at: "建立於",
    updated_at: "更新時間",
    completed_at: "完成於",
    layout: "版面配置",
    filters: "篩選器",
    display: "顯示",
    load_more: "載入更多",
    activity: "活動",
    analytics: "分析",
    dates: "日期",
    success: "成功！",
    something_went_wrong: "發生錯誤",
    error: {
      label: "錯誤！",
      message: "發生錯誤。請再試一次。",
    },
    group_by: "分組依據",
    epic: "Epic",
    epics: "史詩",
    work_item: "工作事項",
    work_items: "工作事項",
    sub_work_item: "子工作事項",
    add: "新增",
    warning: "警告",
    updating: "更新中",
    adding: "新增中",
    update: "更新",
    creating: "建立中",
    create: "建立",
    cancel: "取消",
    description: "描述",
    title: "標題",
    attachment: "附件",
    general: "一般",
    features: "功能",
    automation: "自動化",
    project_name: "專案名稱",
    project_id: "專案 ID",
    project_timezone: "專案時區",
    created_on: "建立於",
    update_project: "更新專案",
    identifier_already_exists: "識別碼已存在",
    add_more: "新增更多",
    defaults: "預設值",
    add_label: "新增標籤",
    customize_time_range: "自訂時間範圍",
    loading: "載入中",
    attachments: "附件",
    property: "屬性",
    properties: "屬性",
    parent: "上層",
    page: "頁面",
    remove: "移除",
    archiving: "封存中",
    archive: "封存",
    access: {
      public: "公開",
      private: "私人",
    },
    done: "完成",
    sub_work_items: "子工作事項",
    comment: "留言",
    workspace_level: "工作區層級",
    order_by: {
      label: "排序依據",
      manual: "手動",
      last_created: "最後建立",
      last_updated: "最後更新",
      start_date: "開始日期",
      due_date: "截止日期",
      asc: "遞增",
      desc: "遞減",
      updated_on: "更新於",
    },
    sort: {
      asc: "遞增",
      desc: "遞減",
      created_on: "建立於",
      updated_on: "更新於",
    },
    comments: "留言",
    updates: "更新",
    additional_updates: "額外更新",
    clear_all: "清除全部",
    copied: "已複製！",
    link_copied: "連結已複製！",
    link_copied_to_clipboard: "連結已複製到剪貼簿",
    copied_to_clipboard: "工作事項連結已複製到剪貼簿",
    branch_name_copied_to_clipboard: "分支名稱已複製到剪貼簿",
    is_copied_to_clipboard: "工作事項已複製到剪貼簿",
    no_links_added_yet: "尚未新增連結",
    add_link: "新增連結",
    links: "連結",
    go_to_workspace: "前往工作區",
    progress: "進度",
    optional: "選填",
    join: "加入",
    go_back: "返回",
    continue: "繼續",
    resend: "重新傳送",
    relations: "關聯",
    errors: {
      default: {
        title: "錯誤！",
        message: "發生錯誤。請再試一次。",
      },
      required: "此欄位為必填",
      entity_required: "{entity} 為必填",
      restricted_entity: "{entity}已被限制",
    },
    update_link: "更新連結",
    attach: "附加",
    create_new: "建立新的",
    add_existing: "新增現有的",
    type_or_paste_a_url: "輸入或貼上網址",
    url_is_invalid: "網址無效",
    display_title: "顯示標題",
    link_title_placeholder: "您希望如何顯示這個連結",
    url: "網址",
    side_peek: "側邊預覽",
    modal: "彈出視窗",
    full_screen: "全螢幕",
    close_peek_view: "關閉預覽檢視",
    toggle_peek_view_layout: "切換預覽檢視版面配置",
    options: "選項",
    duration: "時長",
    today: "今天",
    week: "週",
    month: "月",
    quarter: "季",
    press_for_commands: "按 '/' 以使用指令",
    click_to_add_description: "點選以新增描述",
    search: {
      label: "搜尋",
      placeholder: "輸入以搜尋",
      no_matches_found: "找不到符合的項目",
      no_matching_results: "沒有符合的結果",
    },
    actions: {
      edit: "編輯",
      make_a_copy: "複製一份",
      open_in_new_tab: "在新分頁中開啟",
      copy_link: "複製連結",
      copy_branch_name: "複製分支名稱",
      archive: "封存",
      restore: "還原",
      delete: "刪除",
      remove_relation: "移除關聯",
      subscribe: "訂閱",
      unsubscribe: "取消訂閱",
      clear_sorting: "清除排序",
      show_weekends: "顯示週末",
      enable: "啟用",
      disable: "停用",
    },
    name: "名稱",
    discard: "捨棄",
    confirm: "確認",
    confirming: "確認中",
    read_the_docs: "閱讀文件",
    default: "預設",
    active: "使用中",
    enabled: "已啟用",
    disabled: "已停用",
    mandate: "授權",
    mandatory: "必要的",
    yes: "是",
    no: "否",
    please_wait: "請稍候",
    enabling: "啟用中",
    disabling: "停用中",
    beta: "測試版",
    or: "或",
    next: "下一步",
    back: "返回",
    cancelling: "取消中",
    configuring: "設定中",
    clear: "清除",
    import: "匯入",
    connect: "連線",
    authorizing: "授權中",
    processing: "處理中",
    no_data_available: "無可用資料",
    from: "來自 {name}",
    authenticated: "已認證",
    select: "選擇",
    upgrade: "升級",
    add_seats: "新增席位",
    projects: "專案",
    workspace: "工作區",
    workspaces: "工作區",
    team: "團隊",
    teams: "團隊",
    entity: "實體",
    entities: "實體",
    task: "任務",
    tasks: "任務",
    section: "區段",
    sections: "區段",
    edit: "編輯",
    connecting: "連線中",
    connected: "已連線",
    disconnect: "中斷連線",
    disconnecting: "中斷連線中",
    installing: "安裝中",
    install: "安裝",
    reset: "重設",
    live: "即時",
    change_history: "變更歷史記錄",
    coming_soon: "即將推出",
    member: "成員",
    members: "成員",
    you: "您",
    upgrade_cta: {
      higher_subscription: "升級至更高等級的訂閱方案",
      talk_to_sales: "聯絡業務",
    },
    category: "類別",
    categories: "類別",
    saving: "儲存中",
    save_changes: "儲存變更",
    delete: "刪除",
    deleting: "刪除中",
    pending: "待處理",
    invite: "邀請",
    view: "檢視",
    deactivated_user: "已停用用戶",
    apply: "應用",
    applying: "應用中",
    users: "使用者",
    admins: "管理員",
    guests: "訪客",
    on_track: "進展順利",
    off_track: "偏離軌道",
    timeline: "時間軸",
    completion: "完成",
    upcoming: "即將發生",
    completed: "已完成",
    in_progress: "進行中",
    planned: "已計劃",
    paused: "暫停",
    at_risk: "有風險",
    no_of: "{entity} 的數量",
    resolved: "已解決",
    worklogs: "工作日誌",
    project_updates: "專案更新",
    overview: "概覽",
    workflows: "工作流程",
    templates: "模板",
    members_and_teamspaces: "成員和團隊空間",
    open_in_full_screen: "以全螢幕開啟{page}",
  },
  chart: {
    x_axis: "X 軸",
    y_axis: "Y 軸",
    metric: "指標",
  },
  form: {
    title: {
      required: "標題為必填",
      max_length: "標題不應超過 {length} 個字元",
    },
  },
  entity: {
    grouping_title: "{entity} 分組",
    priority: "{entity} 優先順序",
    all: "所有 {entity}",
    drop_here_to_move: "拖曳到此處以移動 {entity}",
    delete: {
      label: "刪除 {entity}",
      success: "{entity} 刪除成功",
      failed: "{entity} 刪除失敗",
    },
    update: {
      failed: "{entity} 更新失敗",
      success: "{entity} 更新成功",
    },
    link_copied_to_clipboard: "{entity} 連結已複製到剪貼簿",
    fetch: {
      failed: "取得 {entity} 時發生錯誤",
    },
    add: {
      success: "{entity} 新增成功",
      failed: "新增 {entity} 時發生錯誤",
    },
    remove: {
      success: "{entity} 刪除成功",
      failed: "刪除 {entity} 時發生錯誤",
    },
  },
  epic: {
    all: "所有 Epic",
    label: "{count, plural, one {Epic} other {Epic}}",
    new: "新 Epic",
    adding: "新增 Epic 中",
    create: {
      success: "Epic 建立成功",
    },
    add: {
      press_enter: "按 'Enter' 以新增另一個 Epic",
      label: "新增 Epic",
    },
    title: {
      label: "Epic 標題",
      required: "Epic 標題為必填。",
    },
    archive: {
      description: `只有已完成或取消的 Epic
可以歸檔`,
      label: "歸檔 Epic",
      confirm_message: "確定要歸檔此 Epic 嗎？所有已歸檔的 Epic 之後都可以還原。",
      success: {
        label: "歸檔成功",
        message: "可在專案歸檔中查看您的歸檔。",
      },
      failed: {
        message: "無法歸檔 Epic，請重試。",
      },
    },
  },
  issue: {
    label: "{count, plural, one {工作事項} other {工作事項}}",
    all: "所有工作事項",
    edit: "編輯工作事項",
    title: {
      label: "工作事項標題",
      required: "工作事項標題為必填。",
    },
    add: {
      press_enter: "按 'Enter' 以新增另一個工作事項",
      label: "新增工作事項",
      cycle: {
        failed: "無法將工作事項新增到週期。請再試一次。",
        success: "{count, plural, one {工作事項} other {工作事項}} 已成功新增到週期。",
        loading: "正在將 {count, plural, one {工作事項} other {工作事項}} 新增到週期",
      },
      assignee: "新增指派對象",
      start_date: "新增開始日期",
      due_date: "新增截止日期",
      parent: "新增父工作事項",
      sub_issue: "新增子工作事項",
      relation: "新增關聯",
      link: "新增連結",
      existing: "新增現有工作事項",
    },
    remove: {
      label: "移除工作事項",
      cycle: {
        loading: "正在從週期移除工作事項",
        success: "已成功從週期移除工作事項。",
        failed: "無法從週期移除工作事項。請再試一次。",
      },
      module: {
        loading: "正在從模組移除工作事項",
        success: "已成功從模組移除工作事項。",
        failed: "無法從模組移除工作事項。請再試一次。",
      },
      parent: {
        label: "移除父工作事項",
      },
    },
    new: "新工作事項",
    adding: "新增工作事項中",
    create: {
      success: "工作事項建立成功",
    },
    priority: {
      urgent: "緊急",
      high: "高",
      medium: "中",
      low: "低",
    },
    display: {
      properties: {
        label: "顯示屬性",
        id: "ID",
        issue_type: "工作事項類型",
        sub_issue_count: "子工作事項數量",
        attachment_count: "附件數量",
        created_on: "建立於",
        sub_issue: "子工作事項",
        work_item_count: "工作事項數量",
      },
      extra: {
        show_sub_issues: "顯示子工作事項",
        show_empty_groups: "顯示空群組",
      },
    },
    layouts: {
      ordered_by_label: "此版面配置依據以下條件排序",
      list: "清單",
      kanban: "看板",
      calendar: "日曆",
      spreadsheet: "試算表",
      gantt: "甘特圖",
      title: {
        list: "清單版面配置",
        kanban: "看板版面配置",
        calendar: "日曆版面配置",
        spreadsheet: "試算表版面配置",
        gantt: "甘特圖版面配置",
      },
    },
    states: {
      active: "使用中",
      backlog: "待辦事項",
    },
    comments: {
      placeholder: "新增留言",
      switch: {
        private: "切換為私人留言",
        public: "切換為公開留言",
      },
      create: {
        success: "留言建立成功",
        error: "留言建立失敗。請稍後再試。",
      },
      update: {
        success: "留言更新成功",
        error: "留言更新失敗。請稍後再試。",
      },
      remove: {
        success: "留言移除成功",
        error: "留言移除失敗。請稍後再試。",
      },
      upload: {
        error: "資產上傳失敗。請稍後再試。",
      },
      copy_link: {
        success: "評論連結已複製到剪貼簿",
        error: "複製評論連結時出錯。請稍後再試。",
      },
    },
    empty_state: {
      issue_detail: {
        title: "工作事項不存在",
        description: "您尋找的工作事項不存在、已封存或已刪除。",
        primary_button: {
          text: "檢視其他工作事項",
        },
      },
    },
    sibling: {
      label: "同層級工作事項",
    },
    archive: {
      description: `只有已完成或取消的
工作事項可以封存`,
      label: "封存工作事項",
      confirm_message: "您確定要封存工作事項嗎？所有已封存的工作事項稍後都可以還原。",
      success: {
        label: "封存成功",
        message: "您的封存可以在專案封存中找到。",
      },
      failed: {
        message: "無法封存工作事項。請再試一次。",
      },
    },
    restore: {
      success: {
        title: "還原成功",
        message: "您的工作事項可以在專案工作事項中找到。",
      },
      failed: {
        message: "無法還原工作事項。請再試一次。",
      },
    },
    relation: {
      relates_to: "與此相關",
      duplicate: "此項重複",
      blocked_by: "被此阻礙",
      blocking: "阻礙此項",
      start_before: "在之前開始",
      start_after: "在之後開始",
      finish_before: "在之前完成",
      finish_after: "在之後完成",
      implements: "實現",
      implemented_by: "實現者",
    },
    copy_link: "複製工作事項連結",
    delete: {
      label: "刪除工作事項",
      error: "刪除工作事項時發生錯誤",
    },
    subscription: {
      actions: {
        subscribed: "已成功訂閱工作事項",
        unsubscribed: "已成功取消訂閱工作事項",
      },
    },
    select: {
      error: "請至少選擇一個工作事項",
      empty: "未選擇工作事項",
      add_selected: "新增已選取的工作事項",
      select_all: "全選",
      deselect_all: "取消全選",
    },
    open_in_full_screen: "以全螢幕開啟工作事項",
  },
  attachment: {
    error: "無法附加檔案。請重新上傳。",
    only_one_file_allowed: "一次只能上傳一個檔案。",
    file_size_limit: "檔案大小必須小於或等於 {size}MB。",
    drag_and_drop: "拖曳到任何位置以上傳",
    delete: "刪除附件",
  },
  label: {
    select: "選擇標籤",
    create: {
      success: "標籤建立成功",
      failed: "標籤建立失敗",
      already_exists: "標籤已存在",
      type: "輸入以新增標籤",
    },
  },
  sub_work_item: {
    update: {
      success: "子工作事項更新成功",
      error: "更新子工作事項時發生錯誤",
    },
    remove: {
      success: "子工作事項移除成功",
      error: "移除子工作事項時發生錯誤",
    },
    empty_state: {
      sub_list_filters: {
        title: "您沒有符合您應用過的過濾器的子工作事項。",
        description: "要查看所有子工作事項，請清除所有應用過的過濾器。",
        action: "清除過濾器",
      },
      list_filters: {
        title: "您沒有符合您應用過的過濾器的工作事項。",
        description: "要查看所有工作事項，請清除所有應用過的過濾器。",
        action: "清除過濾器",
      },
    },
  },
  view: {
    label: "{count, plural, one {檢視} other {檢視}}",
    create: {
      label: "建立檢視",
    },
    update: {
      label: "更新檢視",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "待處理",
        description: "待處理",
      },
      declined: {
        title: "已拒絕",
        description: "已拒絕",
      },
      snoozed: {
        title: "已延後",
        description: "還剩 {days, plural, one{# 天} other{# 天}}",
      },
      accepted: {
        title: "已接受",
        description: "已接受",
      },
      duplicate: {
        title: "重複",
        description: "重複",
      },
    },
    modals: {
      decline: {
        title: "拒絕工作事項",
        content: "您確定要拒絕工作事項 {value} 嗎？",
      },
      delete: {
        title: "刪除工作事項",
        content: "您確定要刪除工作事項 {value} 嗎？",
        success: "工作事項刪除成功",
      },
    },
    errors: {
      snooze_permission: "只有專案管理員可以延後/取消延後工作事項",
      accept_permission: "只有專案管理員可以接受工作事項",
      decline_permission: "只有專案管理員可以拒絕工作事項",
    },
    actions: {
      accept: "接受",
      decline: "拒絕",
      snooze: "延後",
      unsnooze: "取消延後",
      copy: "複製工作事項連結",
      delete: "刪除",
      open: "開啟工作事項",
      mark_as_duplicate: "標記為重複",
      move: "將 {value} 移至專案工作事項",
    },
    source: {
      "in-app": "應用程式內",
    },
    order_by: {
      created_at: "建立時間",
      updated_at: "更新時間",
      id: "ID",
    },
    label: "進件",
    page_label: "{workspace} - 進件",
    modal: {
      title: "建立進件工作事項",
    },
    tabs: {
      open: "開啟",
      closed: "已關閉",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "沒有開啟的工作事項",
        description: "在這裡尋找開啟的工作事項。建立新工作事項。",
      },
      sidebar_closed_tab: {
        title: "沒有已關閉的工作事項",
        description: "所有已接受或拒絕的工作事項都可以在這裡找到。",
      },
      sidebar_filter: {
        title: "沒有符合的工作事項",
        description: "沒有工作事項符合進件中套用的篩選條件。建立新工作事項。",
      },
      detail: {
        title: "選擇工作事項以檢視其詳細資訊。",
      },
    },
  },
  workspace_creation: {
    heading: "建立您的工作區",
    subheading: "若要開始使用 Plane，您需要建立或加入工作區。",
    form: {
      name: {
        label: "為您的工作區命名",
        placeholder: "最好使用熟悉且容易識別的名稱。",
      },
      url: {
        label: "設定您的工作區網址",
        placeholder: "輸入或貼上網址",
        edit_slug: "您只能編輯網址的片段",
      },
      organization_size: {
        label: "有多少人會使用這個工作區？",
        placeholder: "選擇一個範圍",
      },
    },
    errors: {
      creation_disabled: {
        title: "只有您的執行個體管理員可以建立工作區",
        description: "如果您知道您的執行個體管理員的電子郵件地址，請點選下方按鈕與他們聯絡。",
        request_button: "請求執行個體管理員",
      },
      validation: {
        name_alphanumeric: "工作區名稱只能包含 (' ')、('-')、('_') 和英數字元。",
        name_length: "名稱請限制在 80 個字元以內。",
        url_alphanumeric: "網址只能包含 ('-') 和英數字元。",
        url_length: "網址請限制在 48 個字元以內。",
        url_already_taken: "工作區網址已被使用！",
      },
    },
    request_email: {
      subject: "請求新工作區",
      body: `您好，執行個體管理員：

請以網址 [/workspace-name] 建立一個新工作區，用於 [建立工作區的目的]。

謝謝，
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "建立工作區",
      loading: "建立工作區中",
    },
    toast: {
      success: {
        title: "成功",
        message: "工作區建立成功",
      },
      error: {
        title: "錯誤",
        message: "無法建立工作區。請再試一次。",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "您的專案、活動和指標概覽",
        description:
          "歡迎使用 Plane，我們很高興您在這裡。建立您的第一個專案並追蹤您的工作事項，這個頁面將會變成一個協助您進展的空間。管理員也會看到協助他們團隊進展的項目。",
        primary_button: {
          text: "建立您的第一個專案",
          comic: {
            title: "在 Plane 中，一切都始於專案",
            description: "專案可以是產品的藍圖、行銷活動，或是推出新車。",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "分析",
    page_label: "{workspace} - 分析",
    open_tasks: "開啟任務總數",
    error: "取得資料時發生錯誤。",
    work_items_closed_in: "已完成的工作事項數量在",
    selected_projects: "已選取的專案",
    total_members: "成員總數",
    total_cycles: "週期總數",
    total_modules: "模組總數",
    pending_work_items: {
      title: "待處理工作事項",
      empty_state: "在此顯示同事待處理工作事項的分析。",
    },
    work_items_closed_in_a_year: {
      title: "年度完成工作事項",
      empty_state: "完成工作事項以圖表形式檢視分析。",
    },
    most_work_items_created: {
      title: "最多工作事項建立者",
      empty_state: "在此顯示同事及其建立的工作事項數量。",
    },
    most_work_items_closed: {
      title: "最多工作事項完成者",
      empty_state: "在此顯示同事及其完成的工作事項數量。",
    },
    tabs: {
      scope_and_demand: "範圍與需求",
      custom: "自訂分析",
    },
    empty_state: {
      customized_insights: {
        description: "指派給您的工作項目將依狀態分類顯示在此處。",
        title: "尚無資料",
      },
      created_vs_resolved: {
        description: "隨著時間推移所建立與解決的工作項目將顯示在此處。",
        title: "尚無資料",
      },
      project_insights: {
        title: "尚無資料",
        description: "指派給您的工作項目將依狀態分類顯示在此處。",
      },
      general: {
        title: "追蹤進度、工作量和分配。發現趨勢，消除障礙，加速工作進展",
        description: "查看範圍與需求、估算和範圍蔓延。獲取團隊成員和團隊的績效，確保您的專案按時運行。",
        primary_button: {
          text: "開始您的第一個專案",
          comic: {
            title: "分析功能在週期 + 模組中效果最佳",
            description:
              "首先，將您的問題在週期中進行時間限制，如果可能的話，將跨越多個週期的問題分組到模組中。在左側導覽中查看這兩個功能。",
          },
        },
      },
      cycle_progress: {
        title: "尚無資料",
        description: "循環進度分析將顯示在此處。將工作項目加入循環以開始追蹤進度。",
      },
      module_progress: {
        title: "尚無資料",
        description: "模組進度分析將顯示在此處。將工作項目加入模組以開始追蹤進度。",
      },
      intake_trends: {
        title: "尚無資料",
        description: "引入趨勢分析將顯示在此處。將工作項目加入引入以開始追蹤趨勢。",
      },
    },
    created_vs_resolved: "已建立 vs 已解決",
    customized_insights: "自訂化洞察",
    backlog_work_items: "待辦的{entity}",
    active_projects: "啟用中的專案",
    trend_on_charts: "圖表趨勢",
    all_projects: "所有專案",
    summary_of_projects: "專案摘要",
    project_insights: "專案洞察",
    started_work_items: "已開始的{entity}",
    total_work_items: "{entity}總數",
    total_projects: "專案總數",
    total_admins: "管理員總數",
    total_users: "使用者總數",
    total_intake: "總收入",
    un_started_work_items: "未開始的{entity}",
    total_guests: "訪客總數",
    completed_work_items: "已完成的{entity}",
    total: "{entity}總數",
    projects_by_status: "按狀態分類的專案",
    active_users: "活躍使用者",
    intake_trends: "入學趨勢",
    workitem_resolved_vs_pending: "已解決 vs 待處理的工作項目",
    upgrade_to_plan: "升級至 {plan} 以解鎖 {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {專案} other {專案}}",
    create: {
      label: "新增專案",
    },
    network: {
      label: "網路",
      private: {
        title: "私人",
        description: "僅受邀者可存取",
      },
      public: {
        title: "公開",
        description: "工作區中除了訪客以外的任何人都可以加入",
      },
    },
    error: {
      permission: "您沒有執行此操作的權限。",
      cycle_delete: "無法刪除週期",
      module_delete: "無法刪除模組",
      issue_delete: "無法刪除工作事項",
    },
    state: {
      backlog: "待辦事項",
      unstarted: "未開始",
      started: "已開始",
      completed: "已完成",
      cancelled: "已取消",
    },
    sort: {
      manual: "手動",
      name: "名稱",
      created_at: "建立日期",
      members_length: "成員數量",
    },
    scope: {
      my_projects: "我的專案",
      archived_projects: "已封存",
    },
    common: {
      months_count: "{months, plural, one{# 個月} other{# 個月}}",
    },
    empty_state: {
      general: {
        title: "沒有使用中的專案",
        description:
          "請將每個專案視為目標導向工作的上層。專案是工作、週期和模組所在的地方，並與您的同事一起協助您達成目標。建立新專案或篩選已封存的專案。",
        primary_button: {
          text: "開始您的第一個專案",
          comic: {
            title: "在 Plane 中，一切都始於專案",
            description: "專案可以是產品的藍圖、行銷活動，或是推出新車。",
          },
        },
      },
      no_projects: {
        title: "沒有專案",
        description: "若要建立工作事項或管理您的工作，您需要建立專案或成為專案的一部分。",
        primary_button: {
          text: "開始您的第一個專案",
          comic: {
            title: "在 Plane 中，一切都始於專案",
            description: "專案可以是產品的藍圖、行銷活動，或是推出新車。",
          },
        },
      },
      filter: {
        title: "沒有符合的專案",
        description: `找不到符合篩選條件的專案。
改為建立新專案。`,
      },
      search: {
        description: `找不到符合篩選條件的專案。
改為建立新專案`,
      },
    },
  },
  workspace_views: {
    add_view: "新增檢視",
    empty_state: {
      "all-issues": {
        title: "專案中沒有工作事項",
        description: "第一個專案完成！現在，將您的工作分割成可追蹤的工作事項。讓我們開始吧！",
        primary_button: {
          text: "建立新工作事項",
        },
      },
      assigned: {
        title: "尚無工作事項",
        description: "從這裡可以追蹤指派給您的工作事項。",
        primary_button: {
          text: "建立新工作事項",
        },
      },
      created: {
        title: "尚無工作事項",
        description: "您建立的所有工作事項都會出現在這裡，直接在這裡追蹤它們。",
        primary_button: {
          text: "建立新工作事項",
        },
      },
      subscribed: {
        title: "尚無工作事項",
        description: "訂閱您感興趣的工作事項，在這裡追蹤它們。",
      },
      "custom-view": {
        title: "尚無工作事項",
        description: "符合篩選條件的工作事項，在這裡追蹤它們。",
      },
    },
    delete_view: {
      title: "您確定要刪除此視圖嗎？",
      content: "如果您確認，您為此視圖選擇的所有排序、篩選和顯示選項 + 布局將被永久刪除，無法恢復。",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "變更電子郵件",
        description: "請輸入新的電子郵件地址以接收驗證連結。",
        toasts: {
          success_title: "成功！",
          success_message: "電子郵件已更新，請重新登入。",
        },
        form: {
          email: {
            label: "新電子郵件",
            placeholder: "請輸入電子郵件",
            errors: {
              required: "電子郵件為必填",
              invalid: "電子郵件格式無效",
              exists: "電子郵件已存在，請使用其他信箱。",
              validation_failed: "電子郵件驗證失敗，請再試一次。",
            },
          },
          code: {
            label: "驗證碼",
            placeholder: "123456",
            helper_text: "驗證碼已傳送到你的新電子郵件。",
            errors: {
              required: "驗證碼為必填",
              invalid: "驗證碼無效，請再試一次。",
            },
          },
        },
        actions: {
          continue: "繼續",
          confirm: "確認",
          cancel: "取消",
        },
        states: {
          sending: "傳送中…",
        },
      },
    },
    notifications: {
      select_default_view: "選擇預設檢視",
      compact: "緊湊",
      full: "全螢幕",
    },
  },
  workspace_settings: {
    label: "工作區設定",
    page_label: "{workspace} - 一般設定",
    key_created: "金鑰已建立",
    copy_key: "複製並儲存此金鑰到 Plane Pages。關閉後您將無法看到此金鑰。已下載包含金鑰的 CSV 檔案。",
    token_copied: "權杖已複製到剪貼簿。",
    settings: {
      general: {
        title: "一般",
        upload_logo: "上傳標誌",
        edit_logo: "編輯標誌",
        name: "工作區名稱",
        company_size: "公司規模",
        url: "工作區網址",
        workspace_timezone: "工作區時區",
        update_workspace: "更新工作區",
        delete_workspace: "刪除此工作區",
        delete_workspace_description: "刪除工作區時，該工作區內的所有資料和資源都將被永久移除且無法復原。",
        delete_btn: "刪除此工作區",
        delete_modal: {
          title: "您確定要刪除此工作區嗎？",
          description: "您有一個使用中的付費方案試用期。請先取消試用期再繼續。",
          dismiss: "關閉",
          cancel: "取消試用",
          success_title: "工作區已刪除。",
          success_message: "您很快就會進入個人資料頁面。",
          error_title: "操作失敗。",
          error_message: "請重試。",
        },
        errors: {
          name: {
            required: "名稱為必填",
            max_length: "工作區名稱不應超過 80 個字元",
          },
          company_size: {
            required: "公司規模為必填",
            select_a_range: "選擇組織規模",
          },
        },
      },
      members: {
        title: "成員",
        add_member: "新增成員",
        pending_invites: "待處理的邀請",
        invitations_sent_successfully: "邀請傳送成功",
        leave_confirmation: "您確定要離開工作區嗎？您將無法再存取此工作區。此操作無法復原。",
        details: {
          full_name: "全名",
          display_name: "顯示名稱",
          email_address: "電子郵件地址",
          account_type: "帳號類型",
          authentication: "驗證",
          joining_date: "加入日期",
        },
        modal: {
          title: "邀請人員協作",
          description: "邀請人員加入您的工作區進行協作。",
          button: "傳送邀請",
          button_loading: "傳送邀請中",
          placeholder: "name@company.com",
          errors: {
            required: "我們需要電子郵件地址才能邀請他們。",
            invalid: "電子郵件無效",
          },
        },
      },
      billing_and_plans: {
        title: "計費和方案",
        current_plan: "目前方案",
        free_plan: "您目前使用的是免費方案",
        view_plans: "檢視方案",
      },
      exports: {
        title: "匯出",
        exporting: "匯出中",
        previous_exports: "先前的匯出",
        export_separate_files: "將資料匯出為個別檔案",
        filters_info: "應用篩選器以根據您的條件匯出特定工作項。",
        modal: {
          title: "匯出至",
          toasts: {
            success: {
              title: "匯出成功",
              message: "您可以從先前的匯出下載匯出的 {entity}",
            },
            error: {
              title: "匯出失敗",
              message: "匯出未成功。請再試一次。",
            },
          },
        },
      },
      webhooks: {
        title: "Webhook",
        add_webhook: "新增 Webhook",
        modal: {
          title: "建立 Webhook",
          details: "Webhook 詳細資訊",
          payload: "承載網址",
          question: "您希望觸發此 Webhook 的事件有哪些？",
          error: "網址為必填",
        },
        secret_key: {
          title: "金鑰",
          message: "產生權杖以簽署 Webhook 承載",
        },
        options: {
          all: "傳送所有資訊給我",
          individual: "選擇個別事件",
        },
        toasts: {
          created: {
            title: "Webhook 已建立",
            message: "Webhook 已成功建立",
          },
          not_created: {
            title: "Webhook 未建立",
            message: "無法建立 Webhook",
          },
          updated: {
            title: "Webhook 已更新",
            message: "Webhook 已成功更新",
          },
          not_updated: {
            title: "Webhook 未更新",
            message: "無法更新 Webhook",
          },
          removed: {
            title: "Webhook 已移除",
            message: "Webhook 已成功移除",
          },
          not_removed: {
            title: "Webhook 未移除",
            message: "無法移除 Webhook",
          },
          secret_key_copied: {
            message: "金鑰已複製到剪貼簿。",
          },
          secret_key_not_copied: {
            message: "複製金鑰時發生錯誤。",
          },
        },
      },
      api_tokens: {
        heading: "API 權杖",
        description: "產生安全的 API 權杖，將您的資料與外部系統和應用程式整合。",
        title: "API 權杖",
        add_token: "新增存取權杖",
        create_token: "建立權杖",
        never_expires: "永不過期",
        generate_token: "產生權杖",
        generating: "產生中",
        delete: {
          title: "刪除 API 權杖",
          description: "使用此權杖的任何應用程式將無法再存取 Plane 資料。此操作無法復原。",
          success: {
            title: "成功！",
            message: "API 權杖已成功刪除",
          },
          error: {
            title: "錯誤！",
            message: "無法刪除 API 權杖",
          },
        },
      },
      integrations: {
        title: "整合",
        page_title: "在可用的應用程式或您自己的應用程式中使用您的 Plane 資料。",
        page_description: "查看此工作區或您正在使用的所有整合。",
      },
      imports: {
        title: "導入",
      },
      worklogs: {
        title: "工作日誌",
      },
      group_syncing: {
        title: "群組同步",
        heading: "群組同步",
        description:
          "將身份提供者群組與專案和角色連結。當 IdP 中的群組成員資格變更時，使用者存取權會自動更新，簡化入職與離職流程。",
        enable: {
          title: "啟用群組同步",
          description: "根據身份提供者群組自動將使用者加入專案。",
        },
        config: {
          title: "設定群組同步",
          description: "設定身份提供者群組如何對應至專案和角色。",
          sync_on_login: {
            title: "登入時同步",
            description: "使用者登入時更新群組成員資格與專案存取權。",
          },
          sync_offline: {
            title: "離線同步",
            description: "每六小時自動執行同步，無需等待使用者登入。",
          },
          auto_remove: {
            title: "自動移除",
            description: "當使用者不再符合群組時，自動將其從專案中移除。",
          },
          group_attribute_key: {
            title: "群組屬性鍵",
            description: "用於識別與同步使用者群組的身份提供者屬性。",
            placeholder: "群組",
          },
        },
        group_mapping: {
          title: "群組對應",
          description: "將身份提供者群組與專案和角色連結。",
          button_text: "新增群組同步",
        },
        toast: {
          updating: "正在更新群組同步功能",
          success: "群組同步功能已成功更新。",
          error: "更新群組同步功能失敗！",
        },
        delete_modal: {
          title: "刪除群組同步",
          content: "此身份群組的新使用者將不再被加入專案。已加入的使用者將保留其目前角色。",
        },
        modal: {
          idp_group_name: {
            text: "使用者群組",
            required: "使用者群組為必填",
            placeholder: "輸入 IdP 群組名稱",
          },
          project: {
            text: "專案",
            required: "專案為必填",
            placeholder: "選擇專案",
          },
          default_role: {
            text: "專案角色",
            required: "專案角色為必填",
            placeholder: "選擇專案角色",
          },
        },
      },
      identity: {
        title: "身份",
        heading: "身份",
        description: "配置您的網域並啟用單一登入",
      },
      project_states: {
        title: "專案狀態",
      },
      projects: {
        title: "專案",
        description: "管理專案狀態、啟用專案標籤及其他設定。",
        tabs: {
          states: "專案狀態",
          labels: "專案標籤",
        },
      },
      teamspaces: {
        title: "團隊空間",
      },
      initiatives: {
        title: "倡議",
      },
      customers: {
        title: "客戶",
      },
      releases: {
        title: "發佈",
        update_release: "更新發佈",
        create_release: "建立發佈",
        errors: {
          release_not_found: "您要尋找的發佈不存在。",
          unknown: "發生錯誤。請再試一次。",
        },
      },

      cancel_trial: {
        title: "請先取消您的試用期。",
        description: "您有一個我們付費方案的有效試用期。請先取消它才能繼續。",
        dismiss: "忽略",
        cancel: "取消試用期",
        cancel_success_title: "試用期已取消。",
        cancel_success_message: "您現在可以刪除工作空間。",
        cancel_error_title: "操作失敗。",
        cancel_error_message: "請再試一次。",
      },
      applications: {
        title: "應用程式",
        applicationId_copied: "應用程式ID已複製到剪貼簿",
        clientId_copied: "客戶端ID已複製到剪貼簿",
        clientSecret_copied: "客戶端密鑰已複製到剪貼簿",
        third_party_apps: "第三方應用",
        your_apps: "您的應用",
        connect: "連接",
        connected: "已連接",
        install: "安裝",
        installed: "已安裝",
        configure: "配置",
        app_available: "您已使此應用可用於Plane工作空間",
        app_available_description: "連接Plane工作空間以開始使用",
        client_id_and_secret: "客戶端ID和密鑰",
        client_id_and_secret_description: "複製並保存此密鑰。關閉後您將無法再次查看此密鑰。",
        client_id_and_secret_download: "您可以從這裡下載包含密鑰的CSV檔案。",
        application_id: "應用程式ID",
        client_id: "客戶端ID",
        client_secret: "客戶端密鑰",
        export_as_csv: "匯出為CSV",
        slug_already_exists: "別名已存在",
        failed_to_create_application: "建立應用程式失敗",
        upload_logo: "上傳標誌",
        app_name_title: "您將如何命名此應用",
        app_name_error: "應用名稱為必填項",
        app_short_description_title: "為此應用提供簡短描述",
        app_short_description_error: "應用簡短描述為必填項",
        app_description_title: {
          label: "詳細描述",
          placeholder: "為市集撰寫詳細描述。按 '/' 查看指令。",
        },
        authorization_grant_type: {
          title: "連接類型",
          description: "選擇您的應用程式應該為工作區安裝一次，還是讓每個使用者連接自己的帳戶",
        },
        app_description_error: "應用描述為必填項",
        app_slug_title: "應用別名",
        app_slug_error: "應用別名為必填項",
        app_maker_title: "應用製作者",
        app_maker_error: "應用製作者為必填項",
        webhook_url_title: "Webhook URL",
        webhook_url_error: "Webhook URL為必填項",
        invalid_webhook_url_error: "無效的Webhook URL",
        redirect_uris_title: "重定向URI",
        redirect_uris_error: "重定向URI為必填項",
        invalid_redirect_uris_error: "無效的重定向URI",
        redirect_uris_description:
          "輸入應用將在用戶後重定向到的URI，用空格分隔，例如 https://example.com https://example.com/",
        authorized_javascript_origins_title: "授權的JavaScript來源",
        authorized_javascript_origins_error: "授權的JavaScript來源為必填項",
        invalid_authorized_javascript_origins_error: "無效的授權JavaScript來源",
        authorized_javascript_origins_description:
          "輸入應用將被允許發出請求的來源，用空格分隔，例如 app.com example.com",
        create_app: "建立應用",
        update_app: "更新應用",
        regenerate_client_secret_description: "重新生成客戶端密鑰。重新生成後，您可以複製密鑰或將其下載到CSV檔案中。",
        regenerate_client_secret: "重新生成客戶端密鑰",
        regenerate_client_secret_confirm_title: "確定要重新生成客戶端密鑰嗎？",
        regenerate_client_secret_confirm_description: "使用此密鑰的應用將停止工作。您需要在應用中更新密鑰。",
        regenerate_client_secret_confirm_cancel: "取消",
        regenerate_client_secret_confirm_regenerate: "重新生成",
        read_only_access_to_workspace: "對您的工作空間的唯讀存取",
        write_access_to_workspace: "對您的工作空間的寫入存取",
        read_only_access_to_user_profile: "對您的用戶設定檔的唯讀存取",
        write_access_to_user_profile: "對您的用戶設定檔的寫入存取",
        connect_app_to_workspace: "將{app}連接到您的工作空間{workspace}",
        user_permissions: "用戶權限",
        user_permissions_description: "用戶權限用於授予對用戶設定檔的存取權限。",
        workspace_permissions: "工作空間權限",
        workspace_permissions_description: "工作空間權限用於授予對工作空間的存取權限。",
        with_the_permissions: "具有權限",
        app_consent_title: "{app}正在請求存取您的Plane工作空間和設定檔。",
        choose_workspace_to_connect_app_with: "選擇要連接應用的工作空間",
        app_consent_workspace_permissions_title: "{app}想要",
        app_consent_user_permissions_title: "{app}還可以請求用戶對以下資源的權限。這些權限將僅由用戶請求和授權。",
        app_consent_accept_title: "通過接受",
        app_consent_accept_1: "您授予應用在Plane內部或外部可以使用應用的任何地方存取您的Plane資料的權限",
        app_consent_accept_2: "您同意{app}的隱私政策和使用條款",
        accepting: "接受中...",
        accept: "接受",
        categories: "類別",
        select_app_categories: "選擇應用類別",
        categories_title: "類別",
        categories_error: "類別是必填項",
        invalid_categories_error: "無效的類別",
        categories_description: "選擇最能描述應用的類別",
        supported_plans: "支援的方案",
        supported_plans_description: "選擇可以安裝此應用程式的工作區方案。留空以允許所有方案。",
        select_plans: "選擇方案",
        privacy_policy_url_title: "隱私政策URL",
        privacy_policy_url_error: "隱私政策URL是必填項",
        invalid_privacy_policy_url_error: "無效的隱私政策URL",
        terms_of_service_url_title: "使用條款URL",
        terms_of_service_url_error: "使用條款URL是必填項",
        invalid_terms_of_service_url_error: "無效的使用條款URL",
        support_url_title: "支持URL",
        support_url_error: "支持URL是必填項",
        invalid_support_url_error: "無效的支持URL",
        video_url_title: "視頻URL",
        video_url_error: "視頻URL是必填項",
        invalid_video_url_error: "無效的視頻URL",
        setup_url_title: "設置URL",
        setup_url_error: "設置URL是必填項",
        invalid_setup_url_error: "無效的設置URL",
        configuration_url_title: "配置URL",
        configuration_url_error: "配置URL是必填項",
        invalid_configuration_url_error: "無效的配置URL",
        contact_email_title: "聯絡電子郵件",
        contact_email_error: "聯絡電子郵件是必填項",
        invalid_contact_email_error: "無效的聯絡電子郵件",
        upload_attachments: "上傳附件",
        uploading_images: "上傳 {count, plural, one {張圖片} other {張圖片}}",
        drop_images_here: "將圖片拖到這裡",
        click_to_upload_images: "點擊上傳圖片",
        invalid_file_or_exceeds_size_limit: "無效的文件或超過大小限制 ({size} MB)",
        uploading: "上傳中...",
        upload_and_save: "上傳並保存",
        app_credentials_regenrated: {
          title: "應用程式憑證已成功重新生成",
          description: "請在所有使用的地方替換客戶端密鑰。之前的密鑰已不再有效。",
        },
        app_created: {
          title: "應用程式已成功建立",
          description: "使用憑證將應用程式安裝到 Plane 工作區中",
        },
        installed_apps: "已安裝的應用程式",
        all_apps: "所有應用程式",
        internal_apps: "內部應用程式",
        website: {
          title: "網站",
          description: "連結到您的應用程式網站。",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "應用程式建立者",
          description: "建立該應用程式的個人或組織。",
        },
        setup_url: {
          label: "設定 URL",
          description: "使用者在安裝應用程式時將被重新導向到此 URL。",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "Webhook URL",
          description: "我們將在此接收來自已安裝您應用的工作區的 Webhook 事件和更新。",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "重定向 URI（以空格分隔）",
          description: "使用者在透過 Plane 認證後將被重新導向到此路徑。",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description: "此應用程式只能在工作區管理員安裝後才能安裝。請聯絡您的工作區管理員以繼續。",
        enable_app_mentions: "啟用應用程式提及",
        enable_app_mentions_tooltip: "啟用此功能後，使用者可以提及或指派工作項目給此應用程式。",
        scopes: "範圍",
        select_scopes: "選擇範圍",
        read_access_to: "唯讀存取",
        write_access_to: "寫入存取",
        global_permission_expiration: "全域範圍即將過期。請改用細粒度範圍。例如，使用 project:read 取代全域讀取。",
        selected_scopes: "已選 {count} 項",
        scopes_and_permissions: "範圍與權限",
        read: "讀取",
        write: "寫入",
        scope_description: {
          projects: "存取專案及所有專案相關實體",
          wiki: "存取 Wiki 及所有 Wiki 相關實體",
          customers: "存取客戶及所有客戶相關實體",
          initiatives: "存取計畫及所有計畫相關實體",
          workspaces: "存取工作區及所有工作區相關實體",
          stickies: "存取便利貼及所有便利貼相關實體",
          teamspaces: "存取團隊空間及所有團隊空間相關實體",
          profile: "存取使用者個人資料資訊",
          agents: "存取代理以及所有代理相關實體",
          assets: "存取資產以及所有資產相關實體",
        },
        build_your_own_app: "建立您自己的應用程式",
        edit_app_details: "編輯應用程式詳情",
        internal: "內部",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description: "使用與您的工作和知識庫原生連接的 AI，讓您的任務變得更智能、更快速。",
      },
    },
    empty_state: {
      api_tokens: {
        title: "尚未建立 API 權杖",
        description: "Plane API 可用於將您在 Plane 中的資料與任何外部系統整合。建立權杖以開始使用。",
      },
      webhooks: {
        title: "尚未新增 Webhook",
        description: "建立 Webhook 以接收即時更新並自動執行操作。",
      },
      exports: {
        title: "尚無匯出",
        description: "每當您匯出時，也會在這裡保留一份副本供參考。",
      },
      imports: {
        title: "尚無匯入",
        description: "在這裡找到所有您先前的匯入並下載它們。",
      },
    },
  },
  profile: {
    label: "個人資料",
    page_label: "您的工作",
    work: "工作",
    details: {
      joined_on: "加入於",
      time_zone: "時區",
    },
    stats: {
      workload: "工作量",
      overview: "概覽",
      created: "已建立的工作事項",
      assigned: "已指派的工作事項",
      subscribed: "已訂閱的工作事項",
      state_distribution: {
        title: "依狀態分類的工作事項",
        empty: "建立工作事項以在圖表中檢視依狀態分類的工作事項，以便進行更好的分析。",
      },
      priority_distribution: {
        title: "依優先順序分類的工作事項",
        empty: "建立工作事項以在圖表中檢視依優先順序分類的工作事項，以便進行更好的分析。",
      },
      recent_activity: {
        title: "最近活動",
        empty: "我們找不到資料。請檢查您的輸入",
        button: "下載今天的活動",
        button_loading: "下載中",
      },
    },
    actions: {
      profile: "個人資料",
      security: "安全性",
      activity: "活動",
      appearance: "外觀",
      notifications: "通知",
      connections: "連接",
    },
    tabs: {
      summary: "摘要",
      assigned: "已指派",
      created: "已建立",
      subscribed: "已訂閱",
      activity: "活動",
    },
    empty_state: {
      activity: {
        title: "尚無活動",
        description: "開始建立新工作事項！為其新增詳細資訊和屬性。探索更多 Plane 功能以檢視您的活動。",
      },
      assigned: {
        title: "沒有指派給您的工作事項",
        description: "從這裡可以追蹤指派給您的工作事項。",
      },
      created: {
        title: "尚無工作事項",
        description: "您建立的所有工作事項都會出現在這裡，直接在這裡追蹤它們。",
      },
      subscribed: {
        title: "尚無工作事項",
        description: "訂閱您感興趣的工作事項，在這裡追蹤它們。",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "輸入專案 ID",
      please_select_a_timezone: "請選擇時區",
      archive_project: {
        title: "封存專案",
        description:
          "封存專案將不再從您的側邊導覽列中列出您的專案，但您仍然可以從專案頁面存取它。您可以隨時還原專案或刪除它。",
        button: "封存專案",
      },
      delete_project: {
        title: "刪除專案",
        description: "刪除專案時，該專案內的所有資料和資源都將被永久移除且無法復原。",
        button: "刪除我的專案",
      },
      toast: {
        success: "專案更新成功",
        error: "無法更新專案。請再試一次。",
      },
    },
    members: {
      label: "成員",
      project_lead: "專案負責人",
      default_assignee: "預設指派對象",
      guest_super_permissions: {
        title: "授予訪客使用者檢視所有工作事項的權限：",
        sub_heading: "這將允許訪客檢視所有專案工作事項。",
      },
      invite_members: {
        title: "邀請成員",
        sub_heading: "邀請成員參與您的專案。",
        select_co_worker: "選擇同事",
      },
      project_lead_description: "請選擇該專案的專案負責人。",
      default_assignee_description: "請選擇該專案的預設指派人。",
      project_subscribers: "專案訂閱者",
      project_subscribers_description: "請選擇將接收此專案通知的成員。",
    },
    states: {
      describe_this_state_for_your_members: "為您的成員描述此狀態。",
      empty_state: {
        title: "{groupKey} 群組沒有可用的狀態",
        description: "請建立新狀態",
      },
    },
    labels: {
      label_title: "標籤標題",
      label_title_is_required: "標籤標題為必填",
      label_max_char: "標籤名稱不應超過 255 個字元",
      toast: {
        error: "更新標籤時發生錯誤",
      },
    },
    estimates: {
      label: "預估",
      title: "為我的專案啟用預估",
      description: "幫助你傳達團隊的複雜性和工作負荷。",
      no_estimate: "無預估",
      new: "新估算系統",
      create: {
        custom: "自訂",
        start_from_scratch: "從頭開始",
        choose_template: "選擇範本",
        choose_estimate_system: "選擇預估系統",
        enter_estimate_point: "輸入預估",
        step: "步驟 {step} 共 {total}",
        label: "建立預估",
      },
      toasts: {
        created: {
          success: {
            title: "預估已建立",
            message: "預估已成功建立",
          },
          error: {
            title: "預估建立失敗",
            message: "我們無法建立新的預估，請重試。",
          },
        },
        updated: {
          success: {
            title: "預估已修改",
            message: "專案中的預估已更新。",
          },
          error: {
            title: "預估修改失敗",
            message: "我們無法修改預估，請重試",
          },
        },
        enabled: {
          success: {
            title: "成功！",
            message: "預估已啟用。",
          },
        },
        disabled: {
          success: {
            title: "成功！",
            message: "預估已停用。",
          },
          error: {
            title: "錯誤！",
            message: "無法停用預估。請重試",
          },
        },
        reorder: {
          success: {
            title: "估算已重新排序",
            message: "估算已在您的專案中重新排序。",
          },
          error: {
            title: "估算重新排序失敗",
            message: "我們無法重新排序估算，請再試一次",
          },
        },
      },
      validation: {
        min_length: "預估必須大於0。",
        unable_to_process: "我們無法處理你的請求，請重試。",
        numeric: "預估必須是數值。",
        character: "預估必須是字元值。",
        empty: "預估值不能為空。",
        already_exists: "預估值已存在。",
        unsaved_changes: "你有未儲存的變更。請在點擊完成前儲存",
        remove_empty: "預估不能為空。在每個欄位中輸入值或移除沒有值的欄位。",
        fill: "請填寫此估算欄位",
        repeat: "估算值不能重複",
      },
      systems: {
        points: {
          label: "點數",
          fibonacci: "費波那契數列",
          linear: "線性",
          squares: "平方數",
          custom: "自訂",
        },
        categories: {
          label: "類別",
          t_shirt_sizes: "T恤尺寸",
          easy_to_hard: "簡單到困難",
          custom: "自訂",
        },
        time: {
          label: "時間",
          hours: "小時",
        },
      },
      edit: {
        title: "編輯估算系統",
        add_or_update: {
          title: "新增、更新或移除估算",
          description: "透過新增、更新或移除點數或類別來管理目前系統。",
        },
        switch: {
          title: "變更估算類型",
          description: "將點數系統轉換為類別系統，反之亦然。",
        },
      },
      switch: "切換估算系統",
      current: "目前估算系統",
      select: "選擇估算系統",
    },
    automations: {
      label: "自動化",
      "auto-archive": {
        title: "自動封存已關閉的工作項目",
        description: "Plane將自動封存已完成或已取消的工作項目。",
        duration: "自動封存已關閉的工作項目",
      },
      "auto-close": {
        title: "自動關閉工作項目",
        description: "Plane將自動關閉未完成或未取消的工作項目。",
        duration: "自動關閉非活動工作項目",
        auto_close_status: "自動關閉狀態",
      },
    },
    empty_state: {
      labels: {
        title: "尚無標籤",
        description: "建立標籤以協助組織和篩選專案中的工作事項。",
      },
      estimates: {
        title: "尚無評估系統",
        description: "建立一組評估以傳達每個工作事項的工作量。",
        primary_button: "新增評估系統",
      },
      integrations: {
        title: "未配置整合",
        description: "配置 GitHub 和其他整合以同步您的專案工作項目。",
      },
    },
    initiatives: {
      heading: "倡議",
      sub_heading: "為您在 Plane 中的所有工作解鎖最高級別的組織。",
      title: "啟用倡議",
      description: "設定更大的目標以監控進度",
      toast: {
        updating: "更新倡議功能",
        enable_success: "倡議功能已成功啟用。",
        disable_success: "倡議功能已成功停用。",
        error: "更新倡議功能失敗！",
      },
    },
    customers: {
      heading: "客戶",
      settings_heading: "根據對客戶重要的事項管理工作。",
      settings_sub_heading:
        "將客戶請求帶入工作項目，根據請求分配優先級，並將工作項目狀態匯總到客戶記錄中。很快，您將與您的 CRM 或支援工具整合，以實現更好的客戶屬性工作管理。",
    },
    epics: {
      properties: {
        title: "屬性",
        description: "為您的史詩添加自定義屬性。",
      },
      disabled: "已停用",
    },
    cycles: {
      auto_schedule: {
        heading: "自動排程週期",
        description: "無需手動設定即可保持週期運作。",
        tooltip: "根據您選擇的排程自動建立新週期。",
        edit_button: "編輯",
        form: {
          cycle_title: {
            label: "週期標題",
            placeholder: "標題",
            tooltip: "標題將為後續週期添加編號。例如：設計 - 1/2/3",
            validation: {
              required: "週期標題為必填項",
              max_length: "標題不得超過255個字元",
            },
          },
          cycle_duration: {
            label: "週期持續時間",
            unit: "週",
            validation: {
              required: "週期持續時間為必填項",
              min: "週期持續時間必須至少為1週",
              max: "週期持續時間不得超過30週",
              positive: "週期持續時間必須為正數",
            },
          },
          cooldown_period: {
            label: "冷卻期",
            unit: "天",
            tooltip: "下一個週期開始前的週期間隔暫停期。",
            validation: {
              required: "冷卻期為必填項",
              negative: "冷卻期不能為負數",
            },
          },
          start_date: {
            label: "週期開始日",
            validation: {
              required: "開始日期為必填項",
              past: "開始日期不能是過去的日期",
            },
          },
          number_of_cycles: {
            label: "未來週期數",
            validation: {
              required: "週期數為必填項",
              min: "至少需要1個週期",
              max: "無法排程超過3個週期",
            },
          },
          auto_rollover: {
            label: "工作項自動結轉",
            tooltip: "在週期完成的當天，將所有未完成的工作項移至下一個週期。",
          },
        },
        toast: {
          toggle: {
            loading_enable: "正在啟用自動排程週期",
            loading_disable: "正在停用自動排程週期",
            success: {
              title: "成功！",
              message: "自動排程週期已成功切換。",
            },
            error: {
              title: "錯誤！",
              message: "切換自動排程週期失敗。",
            },
          },
          save: {
            loading: "正在儲存自動排程週期設定",
            success: {
              title: "成功！",
              message_create: "自動排程週期設定已成功儲存。",
              message_update: "自動排程週期設定已成功更新。",
            },
            error: {
              title: "錯誤！",
              message_create: "儲存自動排程週期設定失敗。",
              message_update: "更新自動排程週期設定失敗。",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "週期",
        short_title: "週期",
        description: "在靈活的時間段內安排工作，以適應該專案獨特的節奏和步調。",
        toggle_title: "啟用週期",
        toggle_description: "在集中的時間段內規劃工作。",
      },
      modules: {
        title: "模組",
        short_title: "模組",
        description: "將工作組織成具有專門負責人和受讓人的子專案。",
        toggle_title: "啟用模組",
        toggle_description: "專案成員將能夠建立和編輯模組。",
      },
      views: {
        title: "檢視",
        short_title: "檢視",
        description: "儲存自訂排序、篩選器和顯示選項，或與團隊共享。",
        toggle_title: "啟用檢視",
        toggle_description: "專案成員將能夠建立和編輯檢視。",
      },
      pages: {
        title: "頁面",
        short_title: "頁面",
        description: "建立和編輯自由格式的內容：筆記、文件、任何內容。",
        toggle_title: "啟用頁面",
        toggle_description: "專案成員將能夠建立和編輯頁面。",
      },
      intake: {
        intake_responsibility: "接收責任",
        intake_sources: "接收來源",
        title: "接收",
        short_title: "接收",
        description: "讓非成員分享錯誤、回饋和建議；而不會中斷您的工作流程。",
        toggle_title: "啟用接收",
        toggle_description: "允許專案成員在應用程式中建立接收請求。",
        toggle_tooltip_on: "請專案管理員代為開啟。",
        toggle_tooltip_off: "請專案管理員代為關閉。",
        notify_assignee: {
          title: "通知負責人",
          description: "對於新的接收請求，預設負責人將透過通知收到提醒",
        },
        in_app: {
          title: "應用程式內",
          description: "從工作區的成員與訪客取得新的工作項目，不影響現有工作項目。",
        },
        email: {
          title: "電子郵件",
          description: "從任何寄信到 Plane 電子郵件地址的人收集新的工作項目。",
          fieldName: "電子郵件 ID",
        },
        form: {
          title: "表單",
          description: "讓工作區外的人透過專用安全表單為您建立潛在的新工作項目。",
          fieldName: "預設表單 URL",
          create_forms: "使用工作項目類型建立表單",
          manage_forms: "管理表單",
          manage_forms_tooltip: "請工作區管理員代為管理。",
          create_form: "建立表單",
          edit_form: "編輯表單詳細資訊",
          form_title: "表單標題",
          form_title_required: "表單標題為必填",
          work_item_type: "工作項目類型",
          remove_property: "移除屬性",
          select_properties: "選擇屬性",
          search_placeholder: "搜尋屬性",
          toasts: {
            success_create: "接收表單已成功建立",
            success_update: "接收表單已成功更新",
            error_create: "無法建立接收表單",
            error_update: "無法更新接收表單",
          },
        },
        toasts: {
          set: {
            loading: "正在設定負責人...",
            success: {
              title: "成功！",
              message: "負責人設定成功。",
            },
            error: {
              title: "錯誤！",
              message: "設定負責人時出現問題。請重試。",
            },
          },
        },
      },
      time_tracking: {
        title: "時間追蹤",
        short_title: "時間追蹤",
        description: "記錄在工作項目和專案上花費的時間。",
        toggle_title: "啟用時間追蹤",
        toggle_description: "專案成員將能夠記錄工作時間。",
      },
      milestones: {
        title: "里程碑",
        short_title: "里程碑",
        description: "里程碑提供了一個層，用於將工作項目對齊到共享的完成日期。",
        toggle_title: "啟用里程碑",
        toggle_description: "按里程碑截止日期組織工作項目。",
      },
    },
  },
  project_cycles: {
    add_cycle: "新增週期",
    more_details: "更多詳細資訊",
    cycle: "週期",
    update_cycle: "更新週期",
    create_cycle: "建立週期",
    no_matching_cycles: "沒有符合的週期",
    remove_filters_to_see_all_cycles: "移除篩選器以檢視所有週期",
    remove_search_criteria_to_see_all_cycles: "移除搜尋條件以檢視所有週期",
    only_completed_cycles_can_be_archived: "只有已完成的週期可以封存",
    start_date: "開始日期",
    end_date: "結束日期",
    in_your_timezone: "在您的時區",
    transfer_work_items: "轉移 {count} 工作事項",
    transfer: {
      no_cycles_available: "沒有其他可用的週期來轉移工作項目。",
    },
    date_range: "日期範圍",
    add_date: "新增日期",
    active_cycle: {
      label: "使用中的週期",
      progress: "進度",
      chart: "燃盡圖",
      priority_issue: "優先順序工作事項",
      assignees: "指派對象",
      issue_burndown: "工作事項燃盡",
      ideal: "理想",
      current: "目前",
      labels: "標籤",
      trailing: "落後",
      leading: "領先",
    },
    upcoming_cycle: {
      label: "即將到來的週期",
    },
    completed_cycle: {
      label: "已完成的週期",
    },
    status: {
      days_left: "剩餘天數",
      completed: "已完成",
      yet_to_start: "尚未開始",
      in_progress: "進行中",
      draft: "草稿",
    },
    action: {
      restore: {
        title: "還原週期",
        success: {
          title: "週期已還原",
          description: "週期已還原。",
        },
        failed: {
          title: "週期還原失敗",
          description: "無法還原週期。請再試一次。",
        },
      },
      favorite: {
        loading: "將週期加入我的最愛",
        success: {
          description: "週期已加入我的最愛。",
          title: "成功！",
        },
        failed: {
          description: "無法將週期加入我的最愛。請再試一次。",
          title: "錯誤！",
        },
      },
      unfavorite: {
        loading: "從我的最愛移除週期",
        success: {
          description: "週期已從我的最愛移除。",
          title: "成功！",
        },
        failed: {
          description: "無法從我的最愛移除週期。請再試一次。",
          title: "錯誤！",
        },
      },
      update: {
        loading: "更新週期中",
        success: {
          description: "週期更新成功。",
          title: "成功！",
        },
        failed: {
          description: "更新週期時發生錯誤。請再試一次。",
          title: "錯誤！",
        },
        error: {
          already_exists: "給定日期範圍內已有週期，如果您要建立草稿週期，可以移除兩個日期來執行此操作。",
        },
      },
    },
    empty_state: {
      general: {
        title: "在週期中分組和時間區段化您的工作。",
        description: "將工作分解為時間區段化的區塊，從您的專案截止日期向後設定日期，並以團隊的方式取得具體進展。",
        primary_button: {
          text: "設定您的第一個週期",
          comic: {
            title: "週期是重複的時間區段。",
            description: "衝刺、迭代，或您用於每週或每兩週追蹤工作的任何其他術語都是週期。",
          },
        },
      },
      no_issues: {
        title: "週期中沒有新增工作事項",
        description: "新增或建立您希望在此週期內時間區段化和交付的工作事項",
        primary_button: {
          text: "建立新工作事項",
        },
        secondary_button: {
          text: "新增現有工作事項",
        },
      },
      completed_no_issues: {
        title: "週期中沒有工作事項",
        description:
          "週期中沒有工作事項。工作事項已被轉移或隱藏。若要檢視隱藏的工作事項（如果有），請相應地更新您的顯示屬性。",
      },
      active: {
        title: "沒有使用中的週期",
        description: "使用中的週期包括任何期間內包含今天日期的週期。在這裡找到使用中週期的進度和詳細資訊。",
      },
      archived: {
        title: "尚無已封存的週期",
        description: "為了整理您的專案，可以封存已完成的週期。一旦封存，您可以在這裡找到它們。",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "建立工作事項並指派給某人，甚至是您自己",
        description:
          "將工作事項視為工作、任務、工作或待辦事項。我們喜歡這樣。工作事項及其子工作事項通常是指派給團隊成員的以時間為基礎的可執行項目。您的團隊建立、指派和完成工作事項，以推動您的專案朝向其目標前進。",
        primary_button: {
          text: "建立您的第一個工作事項",
          comic: {
            title: "工作事項是 Plane 中的基本單位。",
            description:
              "重新設計 Plane 使用者介面、重塑公司品牌或推出新的燃料噴射系統都是可能有子工作事項的工作事項範例。",
          },
        },
      },
      no_archived_issues: {
        title: "尚無已封存的工作事項",
        description: "透過手動或自動化的方式，您可以封存已完成或取消的工作事項。一旦封存，您可以在這裡找到它們。",
        primary_button: {
          text: "設定自動化",
        },
      },
      issues_empty_filter: {
        title: "找不到符合套用篩選器的工作事項",
        secondary_button: {
          text: "清除所有篩選器",
        },
      },
    },
  },
  project_module: {
    add_module: "新增模組",
    update_module: "更新模組",
    create_module: "建立模組",
    archive_module: "封存模組",
    restore_module: "還原模組",
    delete_module: "刪除模組",
    empty_state: {
      general: {
        title: "將您的專案里程碑對應到模組並輕鬆追蹤彙總工作。",
        description:
          "屬於邏輯、階層式上層的一組工作事項形成一個模組。將其視為一種依專案里程碑追蹤工作的方式。它們有自己的期間和截止日期以及分析，可協助您了解您距離里程碑有多近或多遠。",
        primary_button: {
          text: "建立您的第一個模組",
          comic: {
            title: "模組協助依階層結構分組工作。",
            description: "購物車模組、底盤模組和倉庫模組都是這種分組的好例子。",
          },
        },
      },
      no_issues: {
        title: "模組中沒有工作事項",
        description: "建立或新增您想要作為此模組一部分完成的工作事項",
        primary_button: {
          text: "建立新工作事項",
        },
        secondary_button: {
          text: "新增現有工作事項",
        },
      },
      archived: {
        title: "尚無已封存的模組",
        description: "為了整理您的專案，可以封存已完成或取消的模組。一旦封存，您可以在這裡找到它們。",
      },
      sidebar: {
        in_active: "此模組尚未啟用。",
        invalid_date: "日期無效。請輸入有效日期。",
      },
    },
    quick_actions: {
      archive_module: "封存模組",
      archive_module_description: `只有已完成或取消的
模組可以封存。`,
      delete_module: "刪除模組",
    },
    toast: {
      copy: {
        success: "模組連結已複製到剪貼簿",
      },
      delete: {
        success: "模組刪除成功",
        error: "刪除模組失敗",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "為您的專案儲存篩選的檢視。依需要建立多個檢視",
        description:
          "檢視是您經常使用或想要輕鬆存取的已儲存篩選器集。專案中的所有同事都可以看到每個人的檢視，並選擇最適合他們需求的檢視。",
        primary_button: {
          text: "建立您的第一個檢視",
          comic: {
            title: "檢視基於工作事項屬性運作。",
            description: "您可以從這裡建立檢視，使用您認為合適的屬性作為篩選器。",
          },
        },
      },
      filter: {
        title: "沒有符合的檢視",
        description: `沒有檢視符合搜尋條件。
改為建立新檢視。`,
      },
    },
    delete_view: {
      title: "您確定要刪除此視圖嗎？",
      content: "如果您確認，您為此視圖選擇的所有排序、篩選和顯示選項 + 布局將被永久刪除，無法恢復。",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "撰寫筆記、文件或完整的知識庫。讓 Galileo（Plane 的 AI 助手）協助您開始",
        description:
          "頁面是 Plane 中的思考筆記空間。記下會議筆記，輕鬆格式化，嵌入工作事項，使用元件庫排版，並將它們全部保留在專案的上下文中。若要快速完成任何文件，可以使用快速鍵或按鈕來呼叫 Plane 的 AI Galileo。",
        primary_button: {
          text: "建立您的第一個頁面",
        },
      },
      private: {
        title: "尚無私人頁面",
        description: "在這裡保留您的私人想法。當您準備好分享時，團隊只需點選一下即可。",
        primary_button: {
          text: "建立您的第一個頁面",
        },
      },
      public: {
        title: "尚無公開頁面",
        description: "在這裡檢視與專案中所有人分享的頁面。",
        primary_button: {
          text: "建立您的第一個頁面",
        },
      },
      archived: {
        title: "尚無已封存的頁面",
        description: "封存不在您雷達上的頁面。需要時在這裡存取它們。",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "找不到結果",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "找不到符合的工作事項",
      },
      no_issues: {
        title: "找不到工作事項",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "尚無留言",
        description: "留言可用作工作事項的討論和後續追蹤空間",
      },
    },
  },
  notification: {
    label: "收件匣",
    page_label: "{workspace} - 收件匣",
    options: {
      mark_all_as_read: "全部標記為已讀",
      mark_read: "標記為已讀",
      mark_unread: "標記為未讀",
      refresh: "重新整理",
      filters: "收件匣篩選器",
      show_unread: "顯示未讀",
      show_snoozed: "顯示已延後",
      show_archived: "顯示已封存",
      mark_archive: "封存",
      mark_unarchive: "取消封存",
      mark_snooze: "延後",
      mark_unsnooze: "取消延後",
    },
    toasts: {
      read: "通知已標記為已讀",
      unread: "通知已標記為未讀",
      archived: "通知已標記為已封存",
      unarchived: "通知已標記為未封存",
      snoozed: "通知已延後",
      unsnoozed: "通知已取消延後",
    },
    empty_state: {
      detail: {
        title: "選擇以檢視詳細資訊。",
      },
      all: {
        title: "沒有指派的工作事項",
        description: "您可以在這裡看到指派給您的工作事項的更新",
      },
      mentions: {
        title: "沒有指派的工作事項",
        description: "您可以在這裡看到指派給您的工作事項的更新",
      },
    },
    tabs: {
      all: "全部",
      mentions: "提及",
    },
    filter: {
      assigned: "指派給我",
      created: "由我建立",
      subscribed: "由我訂閱",
    },
    snooze: {
      "1_day": "1 天",
      "3_days": "3 天",
      "5_days": "5 天",
      "1_week": "1 週",
      "2_weeks": "2 週",
      custom: "自訂",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "新增工作事項到週期以檢視其進度",
      },
      chart: {
        title: "新增工作事項到週期以檢視燃盡圖。",
      },
      priority_issue: {
        title: "快速檢視週期中處理的高優先順序工作事項。",
      },
      assignee: {
        title: "新增指派對象到工作事項以檢視依指派對象分類的工作分析。",
      },
      label: {
        title: "新增標籤到工作事項以檢視依標籤分類的工作分析。",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "進件功能未啟用於此專案。",
        description:
          "進件可協助您管理專案的傳入請求，並將它們新增為工作流程中的工作事項。從專案設定啟用進件以管理請求。",
        primary_button: {
          text: "管理功能",
        },
      },
      cycle: {
        title: "週期功能未啟用於此專案。",
        description:
          "將工作分解成時間區段化的區塊，從專案截止日期向後設定日期，並以團隊的方式取得具體進展。啟用專案的週期功能以開始使用。",
        primary_button: {
          text: "管理功能",
        },
      },
      module: {
        title: "模組未啟用於此專案。",
        description: "模組是專案的基本組成部分。從專案設定啟用模組以開始使用。",
        primary_button: {
          text: "管理功能",
        },
      },
      page: {
        title: "頁面未啟用於此專案。",
        description: "頁面是專案的基本組成部分。從專案設定啟用頁面以開始使用。",
        primary_button: {
          text: "管理功能",
        },
      },
      view: {
        title: "檢視未啟用於此專案。",
        description: "檢視是專案的基本組成部分。從專案設定啟用檢視以開始使用。",
        primary_button: {
          text: "管理功能",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "建立工作事項草稿",
    empty_state: {
      title: "寫到一半的工作事項，以及即將推出的留言會出現在這裡。",
      description: "若要試用此功能，請開始新增工作事項並中途離開，或在下方建立您的第一個草稿。😉",
      primary_button: {
        text: "建立您的第一個草稿",
      },
    },
    delete_modal: {
      title: "刪除草稿",
      description: "您確定要刪除此草稿嗎？此操作無法復原。",
    },
    toasts: {
      created: {
        success: "草稿已建立",
        error: "無法建立工作事項。請再試一次。",
      },
      deleted: {
        success: "草稿已刪除",
      },
    },
  },
  stickies: {
    title: "您的便利貼",
    placeholder: "點選此處輸入",
    all: "所有便利貼",
    "no-data": "記下想法、捕捉靈感或記錄突發奇想。新增便利貼以開始。",
    add: "新增便利貼",
    search_placeholder: "依標題搜尋",
    delete: "刪除便利貼",
    delete_confirmation: "您確定要刪除此便利貼嗎？",
    empty_state: {
      simple: "記下想法、捕捉靈感或記錄突發奇想。新增便利貼以開始。",
      general: {
        title: "便利貼是您隨手記下的快速筆記和待辦事項。",
        description: "透過建立可隨時隨地存取的便利貼，輕鬆捕捉您的想法和點子。",
        primary_button: {
          text: "新增便利貼",
        },
      },
      search: {
        title: "這與您的便利貼都不符。",
        description: `嘗試使用不同的詞彙或讓我們知道
如果您確定您的搜尋是正確的。`,
        primary_button: {
          text: "新增便利貼",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "便利貼名稱不能超過 100 個字元。",
        already_exists: "已存在一個沒有描述的便利貼",
      },
      created: {
        title: "便利貼已建立",
        message: "便利貼已成功建立",
      },
      not_created: {
        title: "便利貼未建立",
        message: "無法建立便利貼",
      },
      updated: {
        title: "便利貼已更新",
        message: "便利貼已成功更新",
      },
      not_updated: {
        title: "便利貼未更新",
        message: "無法更新便利貼",
      },
      removed: {
        title: "便利貼已移除",
        message: "便利貼已成功移除",
      },
      not_removed: {
        title: "便利貼未移除",
        message: "無法移除便利貼",
      },
    },
  },
  role_details: {
    guest: {
      title: "訪客",
      description: "組織的外部成員可以被邀請為訪客。",
    },
    member: {
      title: "成員",
      description: "在專案、週期和模組內具有讀取、寫入、編輯和刪除實體的能力",
    },
    admin: {
      title: "管理員",
      description: "工作區內的所有權限都設為允許。",
    },
  },
  user_roles: {
    product_or_project_manager: "產品/專案經理",
    development_or_engineering: "開發/工程",
    founder_or_executive: "創辦人/主管",
    freelancer_or_consultant: "自由工作者/顧問",
    marketing_or_growth: "行銷/成長",
    sales_or_business_development: "業務/業務發展",
    support_or_operations: "支援/營運",
    student_or_professor: "學生/教授",
    human_resources: "人力資源",
    other: "其他",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "從 GitHub 儲存庫匯入工作事項並同步。",
    },
    jira: {
      title: "Jira",
      description: "從 Jira 專案和 Epic 匯入工作事項和 Epic。",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "將工作事項匯出為 CSV 檔案。",
      short_description: "匯出為 CSV",
    },
    excel: {
      title: "Excel",
      description: "將工作事項匯出為 Excel 檔案。",
      short_description: "匯出為 Excel",
    },
    xlsx: {
      title: "Excel",
      description: "將工作事項匯出為 Excel 檔案。",
      short_description: "匯出為 Excel",
    },
    json: {
      title: "JSON",
      description: "將工作事項匯出為 JSON 檔案。",
      short_description: "匯出為 JSON",
    },
  },
  default_global_view: {
    all_issues: "所有工作事項",
    assigned: "已指派",
    created: "已建立",
    subscribed: "已訂閱",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "系統偏好設定",
      },
      light: {
        label: "淺色",
      },
      dark: {
        label: "深色",
      },
      light_contrast: {
        label: "高對比淺色",
      },
      dark_contrast: {
        label: "高對比深色",
      },
      custom: {
        label: "自訂主題",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "待辦事項",
      planned: "已規劃",
      in_progress: "進行中",
      paused: "已暫停",
      completed: "已完成",
      cancelled: "已取消",
    },
    layout: {
      list: "清單版面配置",
      board: "圖庫版面配置",
      timeline: "時間軸版面配置",
    },
    order_by: {
      name: "名稱",
      progress: "進度",
      issues: "工作事項數量",
      due_date: "截止日期",
      created_at: "建立日期",
      manual: "手動",
    },
  },
  cycle: {
    label: "{count, plural, one {週期} other {週期}}",
    no_cycle: "無週期",
  },
  module: {
    label: "{count, plural, one {模組} other {模組}}",
    no_module: "無模組",
  },
  description_versions: {
    last_edited_by: "最後編輯者",
    previously_edited_by: "先前編輯者",
    edited_by: "編輯者",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane 未能啟動。這可能是因為一個或多個 Plane 服務啟動失敗。",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure: "從 setup.sh 和 Docker 日誌中選擇 View Logs 來確認。",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "大綱",
        empty_state: {
          title: "缺少標題",
          description: "讓我們在這個頁面添加一些標題來在這裡查看它們。",
        },
      },
      info: {
        label: "資訊",
        document_info: {
          words: "字數",
          characters: "字元數",
          paragraphs: "段落數",
          read_time: "閱讀時間",
        },
        actors_info: {
          edited_by: "編輯者",
          created_by: "建立者",
        },
        version_history: {
          label: "版本歷史",
          current_version: "目前版本",
          highlight_changes: "標示變更",
        },
      },
      assets: {
        label: "資源",
        download_button: "下載",
        empty_state: {
          title: "缺少圖片",
          description: "添加圖片以在這裡查看它們。",
        },
      },
    },
    open_button: "打開導航面板",
    close_button: "關閉導航面板",
    outline_floating_button: "打開大綱",
  },
  workspace_dashboards: "儀表板",
  pi_chat: "AI 聊天",
  in_app: "應用內",
  forms: "表單",
  choose_workspace_for_integration: "選擇工作區以連接此應用程式",
  integrations_description: "與 Plane 一起工作的應用程式必須連接到您是管理員的工作區",
  create_a_new_workspace: "建立新的工作區",
  learn_more_about_workspaces: "了解更多關於工作區的資訊",
  no_workspaces_to_connect: "沒有工作區可連接",
  no_workspaces_to_connect_description: "您需要建立工作區才能連接整合和模板",
  updates: {
    add_update: "新增更新",
    add_update_placeholder: "在此輸入您的更新",
    empty: {
      title: "尚無更新",
      description: "您可以在此查看更新。",
    },
    delete: {
      title: "刪除更新",
      confirmation: "您確定要刪除此更新嗎？此操作是不可逆的。",
      success: {
        title: "更新已刪除",
        message: "更新已成功刪除。",
      },
      error: {
        title: "更新未刪除",
        message: "更新未刪除。",
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
    progress: {
      title: "進度",
      since_last_update: "自最後更新以來",
      comments: "{count, plural, one{# 評論} other{# 評論}}",
    },
    create: {
      success: {
        title: "更新已創建",
        message: "更新已成功創建。",
      },
      error: {
        title: "更新未創建",
        message: "更新未創建。",
      },
    },
    reaction: {
      create: {
        success: {
          title: "反應已創建",
          message: "反應已成功創建。",
        },
        error: {
          title: "反應未創建",
          message: "反應未創建。",
        },
      },
      remove: {
        success: {
          title: "反應已移除",
          message: "反應已成功移除。",
        },
        error: {
          title: "反應未移除",
          message: "反應未移除。",
        },
      },
    },
  },
  teamspaces: {
    label: "團隊空間",
    empty_state: {
      general: {
        title: "團隊空間在 Plane 中解鎖更好的組織和追蹤。",
        description:
          "為每個現實世界的團隊創建一個專用表面，與 Plane 中的所有其他工作表面分開，並根據您的團隊工作方式進行自定義。",
        primary_button: {
          text: "創建新的團隊空間",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "您尚未連結任何團隊空間。",
          description: "團隊空間和專案所有者可以管理專案的訪問權限。",
        },
      },
      primary_button: {
        text: "連結團隊空間",
      },
      secondary_button: {
        text: "了解更多",
      },
      table: {
        columns: {
          teamspaceName: "團隊空間名稱",
          members: "成員",
          accountType: "帳戶類型",
        },
        actions: {
          remove: {
            button: {
              text: "移除團隊空間",
            },
            confirm: {
              title: "從 {projectName} 移除 {teamspaceName}",
              description: "當您從連結的專案中移除此團隊空間時，此處的成員將失去對連結專案的訪問權限。",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "未找到匹配的團隊空間",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title: "{count, plural, one {您已將一個團隊空間連結到此專案。} other {您已將 # 個團隊空間連結到此專案。}}",
            description:
              "{additionalCount, plural, =0 {團隊空間 {firstTeamspaceName} 現在已連結到此專案。} other {團隊空間 {firstTeamspaceName} 和其他 {additionalCount} 個團隊空間現在已連結到此專案。}}",
          },
          error: {
            title: "操作未成功。",
            description: "請重試或重新載入頁面後再試一次。",
          },
        },
        remove_teamspace: {
          success: {
            title: "您已從此專案中移除該團隊空間。",
            description: "團隊空間 {teamspaceName} 已從 {projectName} 中移除。",
          },
          error: {
            title: "操作未成功。",
            description: "請重試或重新載入頁面後再試一次。",
          },
        },
      },
      link_teamspace: {
        placeholder: "搜尋團隊空間",
        info: {
          title: "新增團隊空間將授予所有團隊空間成員對此專案的訪問權限。",
          link: "了解更多",
        },
        empty_state: {
          no_teamspaces: {
            title: "您沒有任何可連結的團隊空間。",
            description: "您可能不在可以連結的團隊空間中，或者您已經連結了所有可用的團隊空間。",
          },
          no_results: {
            title: "沒有匹配您的團隊空間。",
            description: "請嘗試其他搜尋詞或確保您有可連結的團隊空間。",
          },
        },
        primary_button: {
          text: "連結選定的團隊空間",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "創建團隊特定的工作項目。",
        description:
          "在任何連結專案中分配給此團隊成員的工作項目將自動顯示在此處。如果您希望在此處看到一些工作項目，請確保您的連結專案有分配給此團隊成員的工作項目或創建工作項目。",
        primary_button: {
          text: "將工作項目添加到連結專案",
        },
      },
      work_items_empty_filter: {
        title: "應用的過濾器沒有團隊特定的工作項目",
        description: "更改其中一些過濾器或清除所有過濾器以查看與此空間相關的工作項目。",
        secondary_button: {
          text: "清除所有過濾器",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "您的連結專案沒有活動週期。",
        description: "連結專案中的活動週期將自動顯示在此處。如果您希望看到活動週期，請確保它現在正在連結專案中運行。",
      },
      completed: {
        title: "您的連結專案沒有完成的週期。",
        description: "連結專案中完成的週期將自動顯示在此處。如果您希望看到完成的週期，請確保它也在連結專案中完成。",
      },
      upcoming: {
        title: "您的連結專案沒有即將到來的週期。",
        description: "連結專案中即將到來的週期將自動顯示在此處。如果您希望看到即將到來的週期，請確保它也在連結專案中。",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "您團隊對工作的視圖，不會干擾工作空間中的任何其他視圖",
        description: "在為您的團隊單獨保存的視圖中查看您團隊的工作，與專案的視圖分開。",
        primary_button: {
          text: "創建視圖",
        },
      },
      filter: {
        title: "沒有匹配的視圖",
        description: `沒有視圖符合搜索條件。
 創建一個新視圖代替。`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "在團隊頁面中存放您團隊的知識。",
        description:
          "與專案中的頁面不同，您可以在此處的一組單獨頁面中保存特定於團隊的知識。獲得頁面的所有功能，輕鬆創建最佳實踐文檔和團隊維基。",
        primary_button: {
          text: "創建您的第一個團隊頁面",
        },
      },
      filter: {
        title: "沒有匹配的頁面",
        description: "移除過濾器以查看所有頁面",
      },
      search: {
        title: "沒有匹配的頁面",
        description: "移除搜索條件以查看所有頁面",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "您的連結專案沒有發布的工作項目。",
        description: "在一個或多個這些專案中創建一些工作項目，以查看按日期、狀態和優先級的進度。",
      },
      relation: {
        blocking: {
          title: "您沒有任何阻礙團隊成員的工作項目。",
          description: "做得好！您已為您的團隊清除了道路。您是一個優秀的團隊成員。",
        },
        blocked: {
          title: "您沒有任何團隊成員的工作項目阻礙您。",
          description: "好消息！您可以在所有分配給您的工作項目上取得進展。",
        },
      },
      stats: {
        general: {
          title: "您的連結專案沒有發布的工作項目。",
          description: "在一個或多個這些專案中創建一些工作項目，以查看按專案和團隊成員的工作分配。",
        },
        filter: {
          title: "應用的過濾器沒有團隊統計數據。",
          description: "在一個或多個這些專案中創建一些工作項目，以查看按專案和團隊成員的工作分配。",
        },
      },
    },
  },
  initiatives: {
    overview: "概覽",
    label: "倡議",
    placeholder: "{count, plural, one{# 倡議} other{# 倡議}}",
    add_initiative: "添加倡議",
    create_initiative: "創建倡議",
    update_initiative: "更新倡議",
    initiative_name: "倡議名稱",
    all_initiatives: "所有倡議",
    delete_initiative: "刪除倡議",
    fill_all_required_fields: "請填寫所有必填欄位。",
    toast: {
      create_success: "倡議 {name} 已成功創建。",
      create_error: "創建倡議失敗。請再試一次！",
      update_success: "倡議 {name} 已成功更新。",
      update_error: "更新倡議失敗。請再試一次！",
      delete: {
        success: "倡議已成功刪除。",
        error: "刪除倡議失敗",
      },
      link_copied: "倡議連結已複製到剪貼板。",
      project_update_success: "倡議專案已成功更新。",
      project_update_error: "更新倡議專案失敗。請再試一次！",
      epic_update_success: "史詩{count, plural, one {已成功添加到倡議。} other {已成功添加到倡議。}}",
      epic_update_error: "史詩添加到倡議失敗。請稍後再試。",
      state_update_success: "倡議狀態已成功更新。",
      state_update_error: "更新倡議狀態失敗。請再試一次！",
      label_update_error: "無法更新倡議標籤。請再試一次！",
    },
    empty_state: {
      general: {
        title: "使用倡議在最高級別組織工作",
        description:
          "當您需要組織跨越多個專案和團隊的工作時，倡議就派上用場了。將專案和史詩連接到倡議，自動查看匯總的更新，並在深入樹木之前看到森林。",
        primary_button: {
          text: "創建倡議",
        },
      },
      search: {
        title: "沒有匹配的倡議",
        description: `沒有檢測到與匹配條件相符的倡議。
 創建一個新的倡議代替。`,
      },
      not_found: {
        title: "倡議不存在",
        description: "您正在尋找的倡議不存在、已被歸檔或已被刪除。",
        primary_button: {
          text: "查看其他倡議",
        },
      },
      epics: {
        title: "沒有匹配的史詩",
        subHeading: "要查看所有史詩，請清除所有應用的篩選器。",
        action: "清除篩選器",
      },
    },
    scope: {
      view_scope: "查看範圍",
      breakdown: "範圍分解",
      add_scope: "添加範圍",
      label: "範圍",
      empty_state: {
        title: "尚未添加範圍",
        description: "將項目或史詩連接到此倡議以開始。",
        primary_button: {
          text: "添加範圍",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "標籤",
        description: "使用標籤來組織和規劃您的計畫。",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "刪除標籤",
        content: "您確定要刪除 {labelName} 嗎？這將從所有計畫中移除該標籤，並從所有以該標籤進行篩選的檢視中移除。",
      },
      toast: {
        delete_error: "無法刪除計畫標籤。請重試。",
        label_already_exists: "標籤已存在",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title: "寫一個筆記、文檔或完整的知識庫。讓 Galileo，Plane 的 AI 助手，幫助您開始",
        description:
          "頁面是 Plane 中的思想沉澱空間。記下會議筆記，輕鬆格式化，嵌入工作項目，使用組件庫佈局，並將它們全部保存在您的專案上下文中。要快速完成任何文檔，使用快捷方式或點擊按鈕來調用 Galileo，Plane 的 AI。",
        primary_button: {
          text: "創建您的第一個頁面",
        },
      },
      private: {
        title: "還沒有私人頁面",
        description: "在這裡保留您的私人想法。當您準備好分享時，團隊只需點擊一下即可。",
        primary_button: {
          text: "創建您的第一個頁面",
        },
      },
      public: {
        title: "還沒有工作空間頁面",
        description: "在這裡查看與工作空間中的每個人共享的頁面。",
        primary_button: {
          text: "創建您的第一個頁面",
        },
      },
      archived: {
        title: "還沒有歸檔的頁面",
        description: "歸檔不在您雷達上的頁面。需要時在這裡訪問它們。",
      },
    },
  },
  epics: {
    label: "史詩",
    no_epics_selected: "未選擇史詩",
    add_selected_epics: "添加選定的史詩",
    epic_link_copied_to_clipboard: "史詩連結已複製到剪貼板。",
    project_link_copied_to_clipboard: "專案連結已複製到剪貼板",
    empty_state: {
      general: {
        title: "創建一個史詩並分配給某人，甚至是您自己",
        description:
          "對於跨越多個週期並可以跨模塊存在的較大工作體，請創建一個史詩。將專案中的工作項目和子工作項目連接到史詩，並從概覽跳轉到工作項目。",
        primary_button: {
          text: "創建史詩",
        },
      },
      section: {
        title: "還沒有史詩",
        description: "開始添加史詩以管理和追蹤進度。",
        primary_button: {
          text: "添加史詩",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "未找到匹配的史詩",
      },
      no_epics: {
        title: "未找到史詩",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "沒有活動週期",
        description: "您的專案的週期，包括其範圍內包含今天日期的任何期間。在這裡查找所有活動週期的進度和詳情。",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `將工作項目添加到週期以查看其
進度`,
      },
      priority: {
        title: `一目了然地觀察在週期中處理的高優先級
工作項目。`,
      },
      assignee: {
        title: `為工作項目添加負責人，以查看按負責人
劃分的工作明細。`,
      },
      label: {
        title: `為工作項目添加標籤，以查看按標籤
劃分的工作明細。`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "從CSV匯入成員",
      description: "上傳包含以下欄位的CSV：Email, Display Name, First Name, Last Name, Role（5、15或20）",
      dropzone: {
        active: "將CSV檔案放在這裡",
        inactive: "拖放或點擊上傳",
        file_type: "僅支援.csv檔案",
      },
      buttons: {
        cancel: "取消",
        import: "匯入",
        try_again: "重試",
        close: "關閉",
        done: "完成",
      },
      progress: {
        uploading: "上傳中...",
        importing: "匯入中...",
      },
      summary: {
        title: {
          failed: "匯入失敗",
          complete: "匯入完成",
        },
        message: {
          seat_limit: "由於席位限制，無法匯入成員。",
          success: "成功將{count}名成員新增至工作區。",
          no_imports: "未從CSV檔案匯入任何成員。",
        },
        stats: {
          successful: "成功",
          failed: "失敗",
        },
        download_errors: "下載錯誤",
      },
      toast: {
        invalid_file: {
          title: "無效檔案",
          message: "僅支援CSV檔案。",
        },
        import_failed: {
          title: "匯入失敗",
          message: "發生錯誤。",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "無法歸檔工作項目",
        message: "只有屬於已完成或已取消狀態組的工作項目可以被歸檔。",
      },
      invalid_issue_start_date: {
        title: "無法更新工作項目",
        message: "選擇的開始日期晚於某些工作項目的截止日期。請確保開始日期早於截止日期。",
      },
      invalid_issue_target_date: {
        title: "無法更新工作項目",
        message: "選擇的截止日期早於某些工作項目的開始日期。請確保截止日期晚於開始日期。",
      },
      invalid_state_transition: {
        title: "無法更新工作項目",
        message: "某些工作項目不允許狀態變更。請確保狀態變更是允許的。",
      },
    },
  },
  work_item_types: {
    label: "工作項目類型",
    label_lowercase: "工作項目類型",
    settings: {
      title: "工作項目類型",
      properties: {
        title: "自定義屬性",
        tooltip:
          "每種工作項目類型都有一組默認屬性，如標題、描述、負責人、狀態、優先級、開始日期、截止日期、模塊、週期等。您還可以自定義並添加自己的屬性，以適應您團隊的需求。",
        add_button: "添加新屬性",
        dropdown: {
          label: "屬性類型",
          placeholder: "選擇類型",
        },
        property_type: {
          text: {
            label: "文字",
          },
          number: {
            label: "數字",
          },
          dropdown: {
            label: "下拉選單",
          },
          boolean: {
            label: "布林值",
          },
          date: {
            label: "日期",
          },
          member_picker: {
            label: "成員選擇器",
          },
          release_picker: {
            label: "發佈選擇器",
          },
          formula: {
            label: "公式",
          },
        },
        attributes: {
          label: "屬性",
          text: {
            single_line: {
              label: "單行",
            },
            multi_line: {
              label: "段落",
            },
            readonly: {
              label: "僅讀",
              header: "僅讀數據",
            },
            invalid_text_format: {
              label: "無效的文字格式",
            },
          },
          number: {
            default: {
              placeholder: "添加數字",
            },
          },
          relation: {
            single_select: {
              label: "單選",
            },
            multi_select: {
              label: "多選",
            },
            no_default_value: {
              label: "無默認值",
            },
          },
          boolean: {
            label: "真 | 假",
            no_default: "無默認值",
          },
          option: {
            create_update: {
              label: "選項",
              form: {
                placeholder: "添加選項",
                errors: {
                  name: {
                    required: "選項名稱是必填的。",
                    integrity: "已存在同名選項。",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "選擇選項",
                multi: {
                  default: "選擇選項",
                  variable: "已選擇 {count} 個選項",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "成功！",
              message: "屬性 {name} 已成功創建。",
            },
            error: {
              title: "錯誤！",
              message: "創建屬性失敗。請再試一次！",
            },
          },
          update: {
            success: {
              title: "成功！",
              message: "屬性 {name} 已成功更新。",
            },
            error: {
              title: "錯誤！",
              message: "更新屬性失敗。請再試一次！",
            },
          },
          delete: {
            success: {
              title: "成功！",
              message: "屬性 {name} 已成功刪除。",
            },
            error: {
              title: "錯誤！",
              message: "刪除屬性失敗。請再試一次！",
            },
          },
          enable_disable: {
            loading: "{action} {name} 屬性",
            success: {
              title: "成功！",
              message: "屬性 {name} 已成功{action}。",
            },
            error: {
              title: "錯誤！",
              message: "{action}屬性失敗。請再試一次！",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "標題",
            },
            description: {
              placeholder: "描述",
            },
          },
          errors: {
            name: {
              required: "您必須為您的屬性命名。",
              max_length: "屬性名稱不應超過255個字符。",
            },
            property_type: {
              required: "您必須選擇一個屬性類型。",
            },
            options: {
              required: "您必須添加至少一個選項。",
            },
            formula: {
              required: "公式表達式為必填。",
              invalid: "無效的公式：{error}",
              circular_reference: "偵測到循環參照。公式不能直接或間接參照自身。",
              invalid_reference: "公式參照了不存在的屬性。",
            },
          },
        },
        formula: {
          field_label: "公式欄位",
          tooltip: "使用 '{'欄位名稱'}' 語法輸入公式。支援 +、-、*、/ 和 & 運算子。",
          placeholder: "編寫公式",
          test_button: "測試",
          validating: "驗證中",
          validation_success: "公式有效！回傳 {resultType}",
          validation_success_with_refs: "公式有效！回傳 {resultType}（參照了 {count} 個欄位）",
          error: {
            empty: "請輸入公式",
            missing_context: "缺少工作空間、專案或工作項目類型上下文",
            validation_failed: "驗證失敗",
          },
          picker: {
            no_match: "沒有相符的屬性",
            no_available: "沒有可用的屬性",
          },
        },
        enable_disable: {
          label: "活躍",
          tooltip: {
            disabled: "點擊以禁用",
            enabled: "點擊以啟用",
          },
        },
        delete_confirmation: {
          title: "刪除此屬性",
          description: "刪除屬性可能導致現有數據丟失。",
          secondary_description: "您是否想要禁用屬性代替刪除？",
          primary_button: "{action}，刪除它",
          secondary_button: "是的，禁用它",
        },
        mandate_confirmation: {
          label: "必填屬性",
          content: "此屬性似乎有一個默認選項。將屬性設為必填將移除默認值，用戶必須添加他們選擇的值。",
          tooltip: {
            disabled: "此屬性類型不能設為必填",
            enabled: "取消勾選以將字段標記為可選",
            checked: "勾選以將字段標記為必填",
          },
        },
        empty_state: {
          title: "添加自定義屬性",
          description: "您為此工作項目類型添加的新屬性將顯示在此處。",
        },
      },
      item_delete_confirmation: {
        title: "刪除此類型",
        description: "刪除類型可能會導致現有資料遺失。",
        primary_button: "是的，刪除它",
        toast: {
          success: {
            title: "成功！",
            message: "工作項目類型已成功刪除。",
          },
          error: {
            title: "錯誤！",
            message: "刪除工作項目類型失敗。請再試一次！",
          },
        },
        can_disable_warning: "您想改為停用此類型嗎？",
      },
      cant_delete_default_message: "無法刪除此工作項目類型，因為它已設置為該專案的預設類型。",
    },
    create: {
      title: "創建工作項目類型",
      button: "添加工作項目類型",
      toast: {
        success: {
          title: "成功！",
          message: "工作項目類型已成功創建。",
        },
        error: {
          title: "錯誤！",
          message: {
            conflict: "{name} 類型已存在。請選擇其他名稱。",
          },
        },
      },
    },
    update: {
      title: "更新工作項目類型",
      button: "更新工作項目類型",
      toast: {
        success: {
          title: "成功！",
          message: "工作項目類型 {name} 已成功更新。",
        },
        error: {
          title: "錯誤！",
          message: {
            conflict: "{name} 類型已存在。請選擇其他名稱。",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "為此工作項目類型提供一個獨特的名稱",
        },
        description: {
          placeholder: "描述此工作項目類型的用途以及何時使用。",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} {name} 工作項目類型",
        success: {
          title: "成功！",
          message: "工作項目類型 {name} 已成功{action}。",
        },
        error: {
          title: "錯誤！",
          message: "{action}工作項目類型失敗。請再試一次！",
        },
      },
      tooltip: "點擊以{action}",
    },
    change_confirmation: {
      title: "更改工作項目類型？",
      description: "更改工作項目類型可能會導致丟失特定於當前類型的自定義屬性值。此操作無法撤銷。",
      button: {
        loading: "更改中",
        default: "更改類型",
      },
    },
    empty_state: {
      enable: {
        title: "啟用工作項目類型",
        description: "使用工作項目類型為您的工作塑造工作項目。使用圖標、背景和屬性自定義它們，並為此專案配置它們。",
        primary_button: {
          text: "啟用",
        },
        confirmation: {
          title: "一旦啟用，工作項目類型不能被禁用。",
          description: "Plane的工作項目將成為此專案的默認工作項目類型，並將在此專案中顯示其圖標和背景。",
          button: {
            default: "啟用",
            loading: "設置中",
          },
        },
      },
      get_pro: {
        title: "獲取專業版以啟用工作項目類型。",
        description: "使用工作項目類型為您的工作塑造工作項目。使用圖標、背景和屬性自定義它們，並為此專案配置它們。",
        primary_button: {
          text: "獲取專業版",
        },
      },
      upgrade: {
        title: "升級以啟用工作項目類型。",
        description: "使用工作項目類型為您的工作塑造工作項目。使用圖標、背景和屬性自定義它們，並為此專案配置它們。",
        primary_button: {
          text: "升級",
        },
      },
    },
  },
  importers: {
    imports: "導入",
    logo: "標誌",
    import_message: "將您的 {serviceName} 數據導入到 Plane 專案中。",
    deactivate: "停用",
    deactivating: "停用中",
    migrating: "遷移中",
    migrations: "遷移",
    refreshing: "刷新中",
    import: "導入",
    serial_number: "序號",
    project: "專案",
    workspace: "工作區",
    status: "狀態",
    summary: "摘要",
    total_batches: "總批次",
    imported_batches: "已導入批次",
    re_run: "重新運行",
    cancel: "取消",
    start_time: "開始時間",
    no_jobs_found: "未找到任務",
    no_project_imports: "您尚未導入任何 {serviceName} 專案。",
    cancel_import_job: "取消導入任務",
    cancel_import_job_confirmation: "您確定要取消此導入任務嗎？這將停止此專案的導入過程。",
    re_run_import_job: "重新運行導入任務",
    re_run_import_job_confirmation: "您確定要重新運行此導入任務嗎？這將重新啟動此專案的導入過程。",
    upload_csv_file: "上傳 CSV 文件以導入用戶數據。",
    connect_importer: "連接 {serviceName}",
    migration_assistant: "遷移助手",
    migration_assistant_description: "使用我們強大的助手，將您的 {serviceName} 專案無縫遷移到 Plane。",
    token_helper: "您將從您的以下位置獲取",
    personal_access_token: "個人訪問令牌",
    source_token_expired: "令牌已過期",
    source_token_expired_description: "提供的令牌已過期。請停用並使用新的憑證重新連接。",
    user_email: "用戶郵箱",
    select_state: "選擇狀態",
    select_service_project: "選擇 {serviceName} 專案",
    loading_service_projects: "加載 {serviceName} 專案中",
    select_service_workspace: "選擇 {serviceName} 工作區",
    loading_service_workspaces: "加載 {serviceName} 工作區中",
    select_priority: "選擇優先級",
    select_service_team: "選擇 {serviceName} 團隊",
    add_seat_msg_free_trial:
      "您正嘗試導入 {additionalUserCount} 個未註冊用戶，但您當前計劃只有 {currentWorkspaceSubscriptionAvailableSeats} 個座位可用。要繼續導入，請立即升級。",
    add_seat_msg_paid:
      "您正嘗試導入 {additionalUserCount} 個未註冊用戶，但您當前計劃只有 {currentWorkspaceSubscriptionAvailableSeats} 個座位可用。要繼續導入，請至少購買 {extraSeatRequired} 個額外座位。",
    skip_user_import_title: "跳過導入用戶數據",
    skip_user_import_description:
      "跳過用戶導入將導致來自 {serviceName} 的工作項目、評論和其他數據由在 Plane 中執行遷移的用戶創建。您仍然可以稍後手動添加用戶。",
    invalid_pat: "無效的個人訪問令牌",
  },
  integrations: {
    integrations: "整合",
    loading: "加載中",
    unauthorized: "您無權查看此頁面。",
    configure: "配置",
    not_enabled: "{name} 未為此工作區啟用。",
    not_configured: "未配置",
    disconnect_personal_account: "斷開個人 {providerName} 帳戶",
    not_configured_message_admin: "{name} 整合未配置。請聯繫您的實例管理員進行配置。",
    not_configured_message_support: "{name} 整合未配置。請聯繫支持進行配置。",
    external_api_unreachable: "無法訪問外部 API。請稍後再試。",
    error_fetching_supported_integrations: "無法獲取支持的整合。請稍後再試。",
    back_to_integrations: "返回整合",
    select_state: "選擇狀態",
    set_state: "設置狀態",
    choose_project: "選擇專案...",
    skip_backward_state_movement: "防止因 PR 更新而將問題移回較早的狀態",
  },
  github_integration: {
    name: "GitHub",
    description: "將您的 GitHub 工作項目與 Plane 連接並同步",
    connect_org: "連接組織",
    connect_org_description: "將您的 GitHub 組織與 Plane 連接",
    processing: "處理中",
    org_added_desc: "GitHub org 添加於和時間",
    connection_fetch_error: "從服務器獲取連接詳情時出錯",
    personal_account_connected: "個人帳戶已連接",
    personal_account_connected_description: "您的 GitHub 帳戶現已連接到 Plane",
    connect_personal_account: "連接個人帳戶",
    connect_personal_account_description: "將您的個人 GitHub 帳戶與 Plane 連接。",
    repo_mapping: "倉庫映射",
    repo_mapping_description: "將您的 GitHub 倉庫與 Plane 專案映射",
    project_issue_sync: "專案問題同步",
    project_issue_sync_description: "將 GitHub 的問題同步到您的 Plane 專案",
    project_issue_sync_empty_state: "映射的專案問題同步將在此處顯示",
    configure_project_issue_sync_state: "配置問題同步狀態",
    select_issue_sync_direction: "選擇問題同步方向",
    allow_bidirectional_sync: "雙向 - 在 GitHub 和 Plane 之間同步問題和評論",
    allow_unidirectional_sync: "單向 - 僅從 GitHub 同步問題和評論到 Plane",
    allow_unidirectional_sync_warning: "GitHub 問題的資料將替換關聯 Plane 工作項中的資料（僅 GitHub → Plane）",
    remove_project_issue_sync: "移除此專案問題同步",
    remove_project_issue_sync_confirmation: "您確定要移除此專案問題同步嗎？",
    add_pr_state_mapping: "添加拉取請求狀態映射到 Plane 專案",
    edit_pr_state_mapping: "編輯拉取請求狀態映射到 Plane 專案",
    pr_state_mapping: "拉取請求狀態映射",
    pr_state_mapping_description: "將 GitHub 的拉取請求狀態映射到您的 Plane 專案",
    pr_state_mapping_empty_state: "映射的 PR 狀態將在此處顯示",
    remove_pr_state_mapping: "移除此拉取請求狀態映射",
    remove_pr_state_mapping_confirmation: "您確定要移除此拉取請求狀態映射嗎？",
    issue_sync_message: "工作項目已同步到 {project}",
    link: "將 GitHub 倉庫連接到 Plane 專案",
    pull_request_automation: "拉取請求自動化",
    pull_request_automation_description: "配置從 GitHub 到 Plane 專案的拉取請求狀態映射",
    DRAFT_MR_OPENED: "草稿開啟",
    MR_OPENED: "開啟",
    MR_READY_FOR_MERGE: "準備合併",
    MR_REVIEW_REQUESTED: "請求審核",
    MR_MERGED: "已合併",
    MR_CLOSED: "關閉",
    ISSUE_OPEN: "問題開啟",
    ISSUE_CLOSED: "問題關閉",
    save: "保存",
    start_sync: "開始同步",
    choose_repository: "選擇倉庫...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "連接並同步您的 Gitlab 合併請求與 Plane。",
    connection_fetch_error: "從服務器獲取連接詳情時出錯",
    connect_org: "連接組織",
    connect_org_description: "將您的 Gitlab 組織與 Plane 連接。",
    project_connections: "Gitlab 專案連接",
    project_connections_description: "從 Gitlab 同步合併請求到 Plane 專案。",
    plane_project_connection: "Plane 專案連接",
    plane_project_connection_description: "配置從 Gitlab 到 Plane 專案的拉取請求狀態映射",
    remove_connection: "移除連接",
    remove_connection_confirmation: "您確定要移除此連接嗎？",
    link: "將 Gitlab 倉庫連接到 Plane 專案",
    pull_request_automation: "拉取請求自動化",
    pull_request_automation_description: "配置從 Gitlab 到 Plane 的拉取請求狀態映射",
    DRAFT_MR_OPENED: "當草稿 MR 開啟時，將狀態設置為",
    MR_OPENED: "當 MR 開啟時，將狀態設置為",
    MR_REVIEW_REQUESTED: "當 MR 請求審核時，將狀態設置為",
    MR_READY_FOR_MERGE: "當 MR 準備合併時，將狀態設置為",
    MR_MERGED: "當 MR 已合併時，將狀態設置為",
    MR_CLOSED: "當 MR 關閉時，將狀態設置為",
    integration_enabled_text: "啟用 Gitlab 整合後，您可以自動化工作項目工作流程",
    choose_entity: "選擇實體",
    choose_project: "選擇專案",
    link_plane_project: "連接 Plane 專案",
    project_issue_sync: "專案問題同步",
    project_issue_sync_description: "從 Gitlab 同步問題到您的 Plane 專案",
    project_issue_sync_empty_state: "映射的專案問題同步將顯示在這裡",
    configure_project_issue_sync_state: "配置問題同步狀態",
    select_issue_sync_direction: "選擇問題同步方向",
    allow_bidirectional_sync: "雙向 - 在 Gitlab 和 Plane 之間雙向同步問題和評論",
    allow_unidirectional_sync: "單向 - 僅從 Gitlab 同步問題和評論到 Plane",
    allow_unidirectional_sync_warning: "Gitlab 問題中的資料將替換連結的 Plane 工作項中的資料（僅 Gitlab → Plane）",
    remove_project_issue_sync: "移除此專案問題同步",
    remove_project_issue_sync_confirmation: "您確定要移除此專案問題同步嗎？",
    ISSUE_OPEN: "問題開啟",
    ISSUE_CLOSED: "問題關閉",
    save: "保存",
    start_sync: "開始同步",
    choose_repository: "選擇儲存庫...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "連接並同步您的 Gitlab Enterprise 實例與 Plane。",
    app_form_title: "Gitlab Enterprise 配置",
    app_form_description: "配置 Gitlab Enterprise 以連接到 Plane。",
    base_url_title: "基礎 URL",
    base_url_description: "您的 Gitlab Enterprise 實例的基礎 URL。",
    base_url_placeholder: '例如："https://glab.plane.town"',
    base_url_error: "基礎 URL 是必需的",
    invalid_base_url_error: "無效的基礎 URL",
    client_id_title: "應用 ID",
    client_id_description: "您在 Gitlab Enterprise 實例中創建的應用的 ID。",
    client_id_placeholder: '例如："7cd732xxxxxxxxxxxxxx"',
    client_id_error: "應用 ID 是必需的",
    client_secret_title: "客戶端密鑰",
    client_secret_description: "您在 Gitlab Enterprise 實例中創建的應用的客戶端密鑰。",
    client_secret_placeholder: '例如："gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "客戶端密鑰是必需的",
    webhook_secret_title: "Webhook 密鑰",
    webhook_secret_description: "一個隨機的 webhook 密鑰，用於驗證來自 Gitlab Enterprise 實例的 webhook。",
    webhook_secret_placeholder: '例如："webhook1234567890"',
    webhook_secret_error: "Webhook 密鑰是必需的",
    connect_app: "連接應用",
  },
  slack_integration: {
    name: "Slack",
    description: "將您的 Slack 工作區與 Plane 連接。",
    connect_personal_account: "將您的個人 Slack 帳戶與 Plane 連接。",
    personal_account_connected: "您的個人 {providerName} 帳戶現已連接到 Plane。",
    link_personal_account: "將您的個人 {providerName} 帳戶連接到 Plane。",
    connected_slack_workspaces: "已連接的 Slack 工作區",
    connected_on: "連接於 {date}",
    disconnect_workspace: "斷開 {name} 工作區",
    alerts: {
      dm_alerts: {
        title: "在 Slack 私訊中接收重要更新、提醒和專屬警報的通知。",
      },
    },
    project_updates: {
      title: "專案更新",
      description: "為您的專案配置更新通知",
      add_new_project_update: "添加新的專案更新通知",
      project_updates_empty_state: "與 Slack 頻道連接的專案將在此處顯示。",
      project_updates_form: {
        title: "配置專案更新",
        description: "在創建工作項時在 Slack 中接收專案更新通知",
        failed_to_load_channels: "無法從 Slack 加載頻道",
        project_dropdown: {
          placeholder: "選擇專案",
          label: "Plane 專案",
          no_projects: "沒有可用專案",
        },
        channel_dropdown: {
          label: "Slack 頻道",
          placeholder: "選擇頻道",
          no_channels: "沒有可用頻道",
        },
        all_projects_connected: "所有專案已連接到 Slack 頻道。",
        all_channels_connected: "所有 Slack 頻道已連接到專案。",
        project_connection_success: "專案連接創建成功",
        project_connection_updated: "專案連接更新成功",
        project_connection_deleted: "專案連接刪除成功",
        failed_delete_project_connection: "刪除專案連接失敗",
        failed_create_project_connection: "創建專案連接失敗",
        failed_upserting_project_connection: "更新專案連接失敗",
        failed_loading_project_connections: "無法加載您的專案連接。這可能是由於網絡問題或集成問題。",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "將您的Sentry工作空間連接到Plane。",
    connected_sentry_workspaces: "已連接的Sentry工作空間",
    connected_on: "連接於{date}",
    disconnect_workspace: "斷開{name}工作空間",
    state_mapping: {
      title: "狀態映射",
      description: "將Sentry事件狀態映射到您的專案狀態。配置當Sentry事件已解決或未解決時使用哪些狀態。",
      add_new_state_mapping: "添加新狀態映射",
      empty_state: "未配置狀態映射。建立您的第一個映射以同步Sentry事件狀態與您的專案狀態。",
      failed_loading_state_mappings: "我們無法載入您的狀態映射。這可能是由於網路問題或整合問題。",
      loading_project_states: "正在載入專案狀態...",
      error_loading_states: "載入狀態時出錯",
      no_states_available: "沒有可用狀態",
      no_permission_states: "您沒有權限存取此專案的狀態",
      states_not_found: "未找到專案狀態",
      server_error_states: "載入狀態時伺服器錯誤",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "連接並同步您的 GitHub Enterprise 組織與 Plane。",
    app_form_title: "GitHub Enterprise 配置",
    app_form_description: "配置 GitHub Enterprise 以連接 Plane。",
    app_id_title: "應用 ID",
    app_id_description: "您在 GitHub Enterprise 組織中創建的應用的 ID。",
    app_id_placeholder: '例如，"1234567890"',
    app_id_error: "App ID 是必需的",
    app_name_title: "應用 Slug",
    app_name_description: "您在 GitHub Enterprise 組織中創建的應用的 slug。",
    app_name_error: "App slug 是必需的",
    app_name_placeholder: '例如，"plane-github-enterprise"',
    base_url_title: "Base URL",
    base_url_description: "您的 GitHub Enterprise 組織的基礎 URL。",
    base_url_placeholder: '例如，"https://gh.plane.town"',
    base_url_error: "Base URL 是必需的",
    invalid_base_url_error: "無效的基礎 URL",
    client_id_title: "Client ID",
    client_id_description: "您在 GitHub Enterprise 組織中創建的應用的 client ID。",
    client_id_placeholder: '例如，"1234567890"',
    client_id_error: "Client ID 是必需的",
    client_secret_title: "Client Secret客戶端密碼",
    client_secret_description: "您在 GitHub Enterprise 組織中創建的應用的 client secret。",
    client_secret_placeholder: '例如，"1234567890"',
    client_secret_error: "Client secret 是必需的",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "您在 GitHub Enterprise 組織中創建的應用的 webhook secret。",
    webhook_secret_placeholder: '例如，"1234567890"',
    webhook_secret_error: "Webhook secret 是必需的",
    private_key_title: "Private Key (Base64 編碼)",
    private_key_description: "您在 GitHub Enterprise 組織中創建的應用的 private key。",
    private_key_placeholder: '例如，"MIIEpAIBAAKCAQEA...',
    private_key_error: "Private key 是必需的",
    connect_app: "連接應用",
  },
  file_upload: {
    upload_text: "點擊此處上傳文件",
    drag_drop_text: "拖放",
    processing: "處理中",
    invalid: "無效的文件類型",
    missing_fields: "缺少字段",
    success: "{fileName} 已上傳！",
  },
  silo_errors: {
    invalid_query_params: "提供的查詢參數無效或缺少必填字段",
    invalid_installation_account: "提供的安裝帳戶無效",
    generic_error: "處理您的請求時發生意外錯誤",
    connection_not_found: "找不到請求的連接",
    multiple_connections_found: "在只期望一個連接時找到了多個連接",
    installation_not_found: "找不到請求的安裝",
    user_not_found: "找不到請求的用戶",
    error_fetching_token: "獲取認證令牌失敗",
    invalid_app_credentials: "提供的應用憑證無效",
    invalid_app_installation_id: "安裝應用失敗",
  },
  import_status: {
    queued: "排隊中",
    created: "已創建",
    initiated: "已啟動",
    pulling: "拉取中",
    timed_out: "超時",
    pulled: "已拉取",
    transforming: "轉換中",
    transformed: "已轉換",
    pushing: "推送中",
    finished: "已完成",
    error: "錯誤",
    cancelled: "已取消",
  },
  jira_importer: {
    jira_importer_description: "將您的 Jira 數據導入到 Plane 專案中。",
    personal_access_token: "個人訪問令牌",
    user_email: "用戶郵箱",
    create_project_automatically: "自動建立專案",
    create_project_automatically_description: "我們將根據 Jira 專案詳情為您建立一個新專案。",
    import_to_existing_project: "匯入到現有專案",
    import_to_existing_project_description: "從下方的下拉選選單中選擇一個現有專案。",
    state_mapping_automatic_creation: "所有 Jira 狀態都將在 Plane 中自動建立。",
    atlassian_security_settings: "Atlassian 安全設置",
    email_description: "這是與您的個人訪問令牌關聯的郵箱",
    jira_domain: "Jira 域名",
    jira_domain_description: "這是您的 Jira 實例的域名",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "請先在 Plane 中創建您打算遷移 Jira 數據的專案。專案創建後，在此處選擇它。",
      title_configure_jira: "配置 Jira",
      description_configure_jira: "請選擇您想要遷移數據的 Jira 工作區。",
      title_import_users: "導入用戶",
      description_import_users: "請添加您希望從 Jira 遷移到 Plane 的用戶。或者，您可以跳過此步驟，稍後手動添加用戶。",
      title_map_states: "映射狀態",
      description_map_states:
        "我們已盡力自動將 Jira 狀態匹配到 Plane 狀態。繼續之前，請映射任何剩餘的狀態，您也可以創建狀態並手動映射它們。",
      title_map_priorities: "映射優先級",
      description_map_priorities: "我們已盡力自動匹配優先級。繼續之前，請映射任何剩餘的優先級。",
      title_summary: "摘要",
      description_summary: "以下是將從 Jira 遷移到 Plane 的數據摘要。",
      custom_jql_filter: "自訂 JQL 過濾器",
      jql_filter_description: "使用 JQL 篩選要匯入的特定問題。",
      project_code: "專案",
      enter_filters_placeholder: "輸入過濾器（例如 status = 'In Progress'）",
      validating_query: "正在驗證查詢...",
      validation_successful_work_items_selected: "驗證成功，已選擇 {count} 個工作項目。",
      run_syntax_check: "執行語法檢查以驗證您的查詢",
      refresh: "重新整理",
      check_syntax: "檢查語法",
      no_work_items_selected: "查詢未選擇任何工作項目。",
      validation_error_default: "驗證查詢時出錯。",
    },
  },
  asana_importer: {
    asana_importer_description: "將您的 Asana 數據導入到 Plane 專案中。",
    select_asana_priority_field: "選擇 Asana 優先級字段",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "請先在 Plane 中創建您打算遷移 Asana 數據的專案。專案創建後，在此處選擇它。",
      title_configure_asana: "配置 Asana",
      description_configure_asana: "請選擇您想要遷移數據的 Asana 工作區和專案。",
      title_map_states: "映射狀態",
      description_map_states: "請選擇您想要映射到 Plane 專案狀態的 Asana 狀態。",
      title_map_priorities: "映射優先級",
      description_map_priorities: "請選擇您想要映射到 Plane 專案優先級的 Asana 優先級。",
      title_summary: "摘要",
      description_summary: "以下是將從 Asana 遷移到 Plane 的數據摘要。",
    },
  },
  linear_importer: {
    linear_importer_description: "將您的 Linear 數據導入到 Plane 專案中。",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "請先在 Plane 中創建您打算遷移 Linear 數據的專案。專案創建後，在此處選擇它。",
      title_configure_linear: "配置 Linear",
      description_configure_linear: "請選擇您想要遷移數據的 Linear 團隊。",
      title_map_states: "映射狀態",
      description_map_states:
        "我們已盡力自動將 Linear 狀態匹配到 Plane 狀態。繼續之前，請映射任何剩餘的狀態，您也可以創建狀態並手動映射它們。",
      title_map_priorities: "映射優先級",
      description_map_priorities: "請選擇您想要映射到 Plane 專案優先級的 Linear 優先級。",
      title_summary: "摘要",
      description_summary: "以下是將從 Linear 遷移到 Plane 的數據摘要。",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "將您的 Jira Server/Data Center 數據導入到 Plane 專案中。",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "請先在 Plane 中創建您打算遷移 Jira 數據的專案。專案創建後，在此處選擇它。",
      title_configure_jira: "配置 Jira",
      description_configure_jira: "請選擇您想要遷移數據的 Jira 工作區。",
      title_map_states: "映射狀態",
      description_map_states: "請選擇您想要映射到 Plane 專案狀態的 Jira 狀態。",
      title_map_priorities: "映射優先級",
      description_map_priorities: "請選擇您想要映射到 Plane 專案優先級的 Jira 優先級。",
      title_summary: "摘要",
      description_summary: "以下是將從 Jira 遷移到 Plane 的數據摘要。",
    },
    import_epics: {
      title: "將史詩匯入為工作項",
      description: "啟用此選項後，您的史詩將作為具有史詩工作項類型的工作項匯入。",
    },
  },
  notion_importer: {
    notion_importer_description: "將您的 Notion 資料匯入到 Plane 專案中。",
    steps: {
      title_upload_zip: "上傳 Notion 匯出的 ZIP 檔案",
      description_upload_zip: "請上傳包含您的 Notion 資料的 ZIP 檔案。",
    },
    upload: {
      drop_file_here: "將您的 Notion zip 檔案拖放到這裡",
      upload_title: "上傳 Notion 匯出檔案",
      upload_from_url: "從 URL 匯入",
      upload_from_url_description: "貼上您 ZIP 匯出檔案的公開 URL 以繼續。",
      drag_drop_description: "拖放您的 Notion 匯出 zip 檔案，或點擊瀏覽",
      file_type_restriction: "僅支援從 Notion 匯出的 .zip 檔案",
      select_file: "選擇檔案",
      uploading: "正在上傳...",
      preparing_upload: "正在準備上傳...",
      confirming_upload: "正在確認上傳...",
      confirming: "正在確認...",
      upload_complete: "上傳完成",
      upload_failed: "上傳失敗",
      start_import: "開始匯入",
      retry_upload: "重試上傳",
      upload: "上傳",
      ready: "就緒",
      error: "錯誤",
      upload_complete_message: "上傳完成！",
      upload_complete_description: "點擊「開始匯入」開始處理您的 Notion 資料。",
      upload_progress_message: "請不要關閉此視窗。",
    },
  },
  confluence_importer: {
    confluence_importer_description: "將您的 Confluence 資料匯入到 Plane 維基中。",
    steps: {
      title_upload_zip: "上傳 Confluence 匯出的 ZIP 檔案",
      description_upload_zip: "請上傳包含您的 Confluence 資料的 ZIP 檔案。",
    },
    upload: {
      drop_file_here: "將您的 Confluence zip 檔案拖放到這裡",
      upload_title: "上傳 Confluence 匯出檔案",
      upload_from_url: "從 URL 匯入",
      upload_from_url_description: "貼上您 ZIP 匯出檔案的公開 URL 以繼續。",
      drag_drop_description: "拖放您的 Confluence 匯出 zip 檔案，或點擊瀏覽",
      file_type_restriction: "僅支援從 Confluence 匯出的 .zip 檔案",
      select_file: "選擇檔案",
      uploading: "正在上傳...",
      preparing_upload: "正在準備上傳...",
      confirming_upload: "正在確認上傳...",
      confirming: "正在確認...",
      upload_complete: "上傳完成",
      upload_failed: "上傳失敗",
      start_import: "開始匯入",
      retry_upload: "重試上傳",
      upload: "上傳",
      ready: "就緒",
      error: "錯誤",
      upload_complete_message: "上傳完成！",
      upload_complete_description: "點擊「開始匯入」開始處理您的 Confluence 資料。",
      upload_progress_message: "請不要關閉此視窗。",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "將您的 CSV 數據導入到 Plane 專案中。",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "請先在 Plane 中創建您打算遷移 CSV 數據的專案。專案創建後，在此處選擇它。",
      title_configure_csv: "配置 CSV",
      description_configure_csv: "請上傳您的 CSV 文件並配置要映射到 Plane 字段的字段。",
    },
  },
  csv_importer: {
    csv_importer_description: "從 CSV 檔案匯入工作項到 Plane 專案。",
    steps: {
      title_select_project: "選擇專案",
      description_select_project: "請選擇您要匯入工作項的 Plane 專案。",
      title_upload_csv: "上傳 CSV",
      description_upload_csv: "上傳包含工作項的 CSV 檔案。檔案應包含名稱、描述、優先級、日期和狀態組的欄位。",
    },
  },
  clickup_importer: {
    clickup_importer_description: "將您的 ClickUp 數據遷移到 Plane 專案中。",
    select_service_space: "選擇 {serviceName} 空間",
    select_service_folder: "選擇 {serviceName} 文件夾",
    selected: "已選擇",
    users: "用戶",
    steps: {
      title_configure_plane: "配置 Plane",
      description_configure_plane: "請先在 Plane 中創建您打算遷移 ClickUp 數據的專案。專案創建後，在此處選擇它。",
      title_configure_clickup: "配置 ClickUp",
      description_configure_clickup: "請選擇您想要遷移數據的 ClickUp 團隊、空間和文件夾。",
      title_map_states: "映射狀態",
      description_map_states:
        "我們已盡力自動將 ClickUp 狀態匹配到 Plane 狀態。繼續之前，請映射任何剩餘的狀態，您也可以創建狀態並手動映射它們。",
      title_map_priorities: "映射優先級",
      description_map_priorities: "請選擇您想要映射到 Plane 專案優先級的 ClickUp 優先級。",
      title_summary: "摘要",
      description_summary: "以下是將從 ClickUp 遷移到 Plane 的數據摘要。",
      pull_additional_data_title: "導入評論和附件",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "條形",
          long_label: "條形圖",
          chart_models: {
            basic: "基本",
            stacked: "堆疊",
            grouped: "分組",
          },
          orientation: {
            label: "方向",
            horizontal: "水平",
            vertical: "垂直",
            placeholder: "添加方向",
          },
          bar_color: "條形顏色",
        },
        line_chart: {
          short_label: "線形",
          long_label: "線形圖",
          chart_models: {
            basic: "基本",
            multi_line: "多線",
          },
          line_color: "線條顏色",
          line_type: {
            label: "線條類型",
            solid: "實線",
            dashed: "虛線",
            placeholder: "添加線條類型",
          },
        },
        area_chart: {
          short_label: "面積",
          long_label: "面積圖",
          chart_models: {
            basic: "基本",
            stacked: "堆疊",
            comparison: "比較",
          },
          fill_color: "填充顏色",
        },
        donut_chart: {
          short_label: "環形",
          long_label: "環形圖",
          chart_models: {
            basic: "基本",
            progress: "進度",
          },
          center_value: "中心值",
          completed_color: "完成顏色",
        },
        pie_chart: {
          short_label: "餅形",
          long_label: "餅形圖",
          chart_models: {
            basic: "基本",
          },
          group: {
            label: "分組片段",
            group_thin_pieces: "分組細片段",
            minimum_threshold: {
              label: "最小閾值",
              placeholder: "添加閾值",
            },
            name_group: {
              label: "命名組",
              placeholder: '"小於5%"',
            },
          },
          show_values: "顯示數值",
          value_type: {
            percentage: "百分比",
            count: "計數",
          },
        },
        text: {
          short_label: "文字",
          long_label: "文字",
          alignment: {
            label: "文字對齊",
            left: "左對齊",
            center: "居中",
            right: "右對齊",
            placeholder: "添加文字對齊",
          },
          text_color: "文字顏色",
        },
        table_chart: {
          short_label: "表格",
          long_label: "表格圖表",
          chart_models: {
            basic: {
              short_label: "基本",
              long_label: "表格",
            },
          },
          columns: "列",
          rows: "行",
          rows_placeholder: "添加行",
          configure_rows_hint: "選擇行的屬性以查看此表格。",
        },
      },
      color_palettes: {
        modern: "現代",
        horizon: "地平線",
        earthen: "大地",
      },
      common: {
        add_widget: "添加小工具",
        widget_title: {
          label: "為此小工具命名",
          placeholder: '例如，"昨日待辦", "全部完成"',
        },
        chart_type: "圖表類型",
        visualization_type: {
          label: "視覺化類型",
          placeholder: "添加視覺化類型",
        },
        date_group: {
          label: "日期分組",
          placeholder: "添加日期分組",
        },
        group_by: "分組依據",
        stack_by: "堆疊依據",
        daily: "每日",
        weekly: "每週",
        monthly: "每月",
        yearly: "每年",
        work_item_count: "工作項目數量",
        estimate_point: "估算點數",
        pending_work_item: "待處理工作項目",
        completed_work_item: "已完成工作項目",
        in_progress_work_item: "進行中工作項目",
        blocked_work_item: "被阻礙工作項目",
        work_item_due_this_week: "本週到期工作項目",
        work_item_due_today: "今日到期工作項目",
        color_scheme: {
          label: "配色方案",
          placeholder: "添加配色方案",
        },
        smoothing: "平滑",
        markers: "標記",
        legends: "圖例",
        tooltips: "提示框",
        opacity: {
          label: "透明度",
          placeholder: "添加透明度",
        },
        border: "邊框",
        widget_configuration: "小工具配置",
        configure_widget: "配置小工具",
        guides: "指南",
        style: "樣式",
        area_appearance: "區域外觀",
        comparison_line_appearance: "比較線外觀",
        add_property: "添加屬性",
        add_metric: "添加指標",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
          },
          stacked: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
            group_by: "堆疊依據缺少值。",
          },
          grouped: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
            group_by: "分組依據缺少值。",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
          },
          multi_line: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
            group_by: "分組依據缺少值。",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
          },
          stacked: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
            group_by: "堆疊依據缺少值。",
          },
          comparison: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
          },
          progress: {
            y_axis_metric: "指標缺少值。",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "X軸缺少值。",
            y_axis_metric: "指標缺少值。",
          },
        },
        text: {
          basic: {
            y_axis_metric: "指標缺少值。",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "列缺少值。",
            group_by: "行缺少值。",
          },
        },
        ask_admin: "請管理員配置此小工具。",
      },
    },
    create_modal: {
      heading: {
        create: "創建新儀表板",
        update: "更新儀表板",
      },
      title: {
        label: "為您的儀表板命名。",
        placeholder: '"跨專案的容量", "團隊的工作負載", "跨所有專案的狀態"',
        required_error: "標題為必填項",
      },
      project: {
        label: "選擇專案",
        placeholder: "來自這些專案的數據將為此儀表板提供支持。",
        required_error: "專案為必填項",
      },
      filters_label: "為上述資料來源設定篩選條件",
      create_dashboard: "創建儀表板",
      update_dashboard: "更新儀表板",
    },
    delete_modal: {
      heading: "刪除儀表板",
    },
    empty_state: {
      feature_flag: {
        title: "在按需、永久的儀表板中展示您的進度。",
        description: "構建您需要的任何儀表板，並自定義數據的外觀，以完美地展示您的進度。",
        coming_soon_to_mobile: "即將登陸移動應用",
        card_1: {
          title: "適用於所有專案",
          description: "通過所有專案獲得工作區的完整全局視圖，或者切片您的工作數據，獲得完美的進度視圖。",
        },
        card_2: {
          title: "適用於Plane中的任何數據",
          description: "超越現成的分析和預製的週期圖表，以前所未有的方式查看團隊、倡議或其他任何內容。",
        },
        card_3: {
          title: "滿足所有數據可視化需求",
          description: "從多種可自定義的圖表中選擇，具有精細的控制，以準確地按照您想要的方式查看和展示您的工作數據。",
        },
        card_4: {
          title: "按需和永久",
          description: "一次構建，永久保留，自動刷新您的數據，範圍變更的上下文標誌，以及可共享的永久鏈接。",
        },
        card_5: {
          title: "導出和定時通訊",
          description: "對於鏈接不起作用的時候，將您的儀表板導出為一次性PDF，或者安排自動發送給利益相關者。",
        },
        card_6: {
          title: "適用於所有設備的自動佈局",
          description: "調整小工具大小以獲得您想要的佈局，並在移動設備、平板電腦和其他瀏覽器上以完全相同的方式查看。",
        },
      },
      dashboards_list: {
        title: "在小工具中可視化數據，用小工具構建儀表板，並按需查看最新信息。",
        description:
          "使用自定義小工具構建儀表板，以您指定的範圍顯示數據。獲取跨專案和團隊的所有工作的儀表板，並與利益相關者共享永久鏈接，以便按需追踪。",
      },
      dashboards_search: {
        title: "這與儀表板名稱不匹配。",
        description: "確保您的查詢正確或嘗試另一個查詢。",
      },
      widgets_list: {
        title: "按照您想要的方式可視化數據。",
        description: `使用線條、條形、餅圖和其他格式，以您想要的方式
從您指定的源查看數據。`,
      },
      widget_data: {
        title: "這裡沒有內容",
        description: "刷新或添加數據以在此處查看。",
      },
    },
    common: {
      editing: "編輯中",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "允許新工作項目",
      work_item_creation_disable_tooltip: "此狀態已禁用工作項目創建",
      default_state: "默認狀態允許所有成員創建新工作項目。這無法更改",
      state_change_count: "{count, plural, one {1個允許的狀態變更} other {{count}個允許的狀態變更}}",
      movers_count: "{count, plural, one {1個列出的審核者} other {{count}個列出的審核者}}",
      state_changes: {
        label: {
          default: "添加允許的狀態變更",
          loading: "添加允許的狀態變更中",
        },
        move_to: "變更狀態為",
        movers: {
          label: "當審核者為",
          tooltip: "審核者是被允許將工作項目從一個狀態移動到另一個狀態的人。",
          add: "添加審核者",
        },
      },
    },
    workflow_disabled: {
      title: "您不能將此工作項目移動到這裡。",
    },
    workflow_enabled: {
      label: "狀態變更",
    },
    workflow_tree: {
      label: "對於工作項目在",
      state_change_label: "可以將其移動到",
    },
    empty_state: {
      upgrade: {
        title: "使用工作流程控制變更和審核的混亂。",
        description: "在Plane中使用工作流程設置工作移動、由誰移動以及何時移動的規則。",
      },
    },
    quick_actions: {
      view_change_history: "查看變更歷史",
      reset_workflow: "重置工作流程",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "您確定要重置此工作流程嗎？",
        description: "如果您重置此工作流程，所有狀態變更規則都將被刪除，您將需要重新創建它們才能在此專案中運行。",
      },
      delete_state_change: {
        title: "您確定要刪除此狀態變更規則嗎？",
        description: "一旦刪除，您將無法撤消此更改，如果您希望此規則在此專案中運行，您將需要重新設置。",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action}工作流程",
        success: {
          title: "成功",
          message: "工作流程已成功{action}",
        },
        error: {
          title: "錯誤",
          message: "工作流程無法{action}。請再試一次。",
        },
      },
      reset: {
        success: {
          title: "成功",
          message: "工作流程已成功重置",
        },
        error: {
          title: "重置工作流程時出錯",
          message: "工作流程無法重置。請再試一次。",
        },
      },
      add_state_change_rule: {
        error: {
          title: "添加狀態變更規則時出錯",
          message: "無法添加狀態變更規則。請再試一次。",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "修改狀態變更規則時出錯",
          message: "無法修改狀態變更規則。請再試一次。",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "移除狀態變更規則時出錯",
          message: "無法移除狀態變更規則。請再試一次。",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "修改狀態變更規則審核者時出錯",
          message: "無法修改狀態變更規則審核者。請再試一次。",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {客戶} other {客戶}}",
    open: "開啟客戶",
    dropdown: {
      placeholder: "選擇客戶",
      required: "請選擇客戶",
      no_selection: "沒有客戶",
    },
    upgrade: {
      title: "使用客戶功能優先處理和管理工作。",
      description: "將您的工作映射到客戶並按客戶屬性進行優先排序。",
    },
    properties: {
      default: {
        title: "默認屬性",
        customer_name: {
          name: "客戶名稱",
          placeholder: "這可以是個人或企業的名稱",
          validation: {
            required: "客戶名稱為必填項。",
            max_length: "客戶名稱不能超過255個字符。",
          },
        },
        description: {
          name: "描述",
          validation: {},
        },
        email: {
          name: "電子郵件",
          placeholder: "輸入電子郵件",
          validation: {
            required: "電子郵件為必填項。",
            pattern: "無效的電子郵件地址。",
          },
        },
        website_url: {
          name: "網站",
          placeholder: "任何帶有https://的網址都可以使用。",
          placeholder_short: "添加網站",
          validation: {
            pattern: "無效的網站網址",
          },
        },
        employees: {
          name: "員工數",
          placeholder: "如果您的客戶是企業，則為員工數量。",
          validation: {
            min_length: "員工數不能少於0。",
            max_length: "員工數不能大於2147483647。",
          },
        },
        size: {
          name: "規模",
          placeholder: "添加公司規模",
          validation: {
            min_length: "無效的規模",
          },
        },
        domain: {
          name: "行業",
          placeholder: "零售、電子商務、金融科技、銀行",
          placeholder_short: "添加行業",
          validation: {},
        },
        stage: {
          name: "階段",
          placeholder: "選擇階段",
          validation: {},
        },
        contract_status: {
          name: "合約狀態",
          placeholder: "選擇合約狀態",
          validation: {},
        },
        revenue: {
          name: "收入",
          placeholder: "這是您的客戶每年產生的收入。",
          placeholder_short: "添加收入",
          validation: {
            min_length: "收入不能少於0。",
          },
        },
        invalid_value: "無效的收入值。",
      },
      custom: {
        title: "自定義屬性",
        info: "將您客戶的獨特屬性添加到Plane，以便您可以更好地管理工作項目或客戶記錄。",
      },
      empty_state: {
        title: "您還沒有任何自定義屬性。",
        description:
          "您希望在工作項目中、Plane其他地方或Plane外部的CRM或其他工具中看到的自定義屬性，當您添加它們時將顯示在這裡。",
      },
      add: {
        primary_button: "添加新屬性",
      },
    },
    stage: {
      lead: "潛在客戶",
      sales_qualified_lead: "合格銷售線索",
      contract_negotiation: "合約談判",
      closed_won: "已成交",
      closed_lost: "未成交",
    },
    contract_status: {
      active: "活躍",
      pre_contract: "合約前",
      signed: "已簽署",
      inactive: "非活躍",
    },
    empty_state: {
      detail: {
        title: "我們無法找到該客戶記錄。",
        description: "此記錄的鏈接可能錯誤或此記錄可能已被刪除。",
        primary_button: "前往客戶",
        secondary_button: "添加客戶",
      },
      search: {
        title: "您似乎沒有與該條件匹配的客戶記錄。",
        description: "嘗試使用其他搜索條件，或者如果您確信應該看到該條件的結果，請聯繫我們。",
      },
      list: {
        title: "根據對您客戶重要的事項管理您工作的量、節奏和流程。",
        description:
          "使用客戶功能（Plane獨有功能），您現在可以從頭開始創建新客戶並將其連接到您的工作。很快，您將能夠從其他工具中引入客戶，以及對您重要的自定義屬性。",
        primary_button: "添加您的第一個客戶",
      },
    },
    settings: {
      unauthorized: "您無權訪問此頁面。",
      description: "在您的工作流程中追踪和管理客戶關係。",
      enable: "啟用客戶功能",
      toasts: {
        enable: {
          loading: "正在啟用客戶功能...",
          success: {
            title: "您已為此工作區開啟客戶功能。",
            message: "您無法再次關閉它。",
          },
          error: {
            title: "我們無法這次開啟客戶功能。",
            message: "請再試一次或稍後回到此畫面。如果仍然不起作用。",
            action: "聯繫支持",
          },
        },
        disable: {
          loading: "正在禁用客戶功能...",
          success: {
            title: "客戶功能已禁用",
            message: "客戶功能已成功禁用！",
          },
          error: {
            title: "錯誤",
            message: "禁用客戶功能失敗！",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "我們無法獲取您的客戶列表。",
          message: "請再試一次或刷新此頁面。",
        },
      },
      copy_link: {
        title: "您已複製此客戶的直接鏈接。",
        message: "粘貼在任何地方，它都會直接帶回這裡。",
      },
      create: {
        success: {
          title: "{customer_name}現已可用",
          message: "您可以在工作項目中引用此客戶，並追踪來自他們的請求。",
          actions: {
            view: "查看",
            copy_link: "複製鏈接",
            copied: "已複製！",
          },
        },
        error: {
          title: "我們這次無法創建該記錄。",
          message: "嘗試再次保存它或將未保存的文本複製到新條目，最好在另一個標籤頁中。",
        },
      },
      update: {
        success: {
          title: "成功！",
          message: "客戶更新成功！",
        },
        error: {
          title: "錯誤！",
          message: "無法更新客戶。請再試一次！",
        },
      },
      logo: {
        error: {
          title: "我們無法上傳客戶的標誌。",
          message: "嘗試再次保存標誌或從頭開始。",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "您已從此客戶記錄中移除工作項目。",
            message: "我們也已自動從工作項目中移除此客戶。",
          },
          error: {
            title: "錯誤！",
            message: "我們這次無法從此客戶記錄中移除該工作項目。",
          },
        },
        add: {
          error: {
            title: "我們這次無法將該工作項目添加到此客戶記錄。",
            message: "嘗試再次添加該工作項目或稍後再來。如果仍然不起作用，請聯繫我們。",
          },
          success: {
            title: "您已將工作項目添加到此客戶記錄。",
            message: "我們也已自動將此客戶添加到工作項目中。",
          },
        },
      },
    },
    quick_actions: {
      edit: "編輯",
      copy_link: "複製客戶鏈接",
      delete: "刪除",
    },
    create: {
      label: "創建客戶記錄",
      loading: "創建中",
      cancel: "取消",
    },
    update: {
      label: "更新客戶",
      loading: "更新中",
    },
    delete: {
      title: "您確定要刪除客戶記錄{customer_name}嗎？",
      description: "與此記錄關聯的所有數據將被永久刪除。您以後無法恢復此記錄。",
    },
    requests: {
      empty_state: {
        list: {
          title: "目前還沒有要顯示的請求。",
          description: "創建來自您客戶的請求，以便您可以將它們鏈接到工作項目。",
          button: "添加新請求",
        },
        search: {
          title: "您似乎沒有與該條件匹配的請求。",
          description: "嘗試使用其他搜索條件，或者如果您確信應該看到該條件的結果，請聯繫我們。",
        },
      },
      label: "{count, plural, one {請求} other {請求}}",
      add: "添加請求",
      create: "創建請求",
      update: "更新請求",
      form: {
        name: {
          placeholder: "為此請求命名",
          validation: {
            required: "名稱為必填項。",
            max_length: "請求名稱不應超過255個字符。",
          },
        },
        description: {
          placeholder: "描述請求的性質或從另一個工具粘貼此客戶的評論。",
        },
        source: {
          add: "添加來源",
          update: "更新來源",
          url: {
            label: "網址",
            required: "網址為必填項",
            invalid: "無效的網站網址",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "鏈接已複製",
          message: "客戶請求鏈接已複製到剪貼板。",
        },
        attachment: {
          upload: {
            loading: "正在上傳附件...",
            success: {
              title: "附件已上傳",
              message: "附件已成功上傳。",
            },
            error: {
              title: "附件未上傳",
              message: "無法上傳附件。",
            },
          },
          size: {
            error: {
              title: "錯誤！",
              message: "一次只能上傳一個文件。",
            },
          },
          length: {
            message: "文件大小必須為{size}MB或更小",
          },
          remove: {
            success: {
              title: "附件已移除",
              message: "附件已成功移除",
            },
            error: {
              title: "附件未移除",
              message: "無法移除附件",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "成功！",
              message: "來源更新成功！",
            },
            error: {
              title: "錯誤！",
              message: "無法更新來源。",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "錯誤！",
              message: "無法將工作項目添加到請求中。請再試一次。",
            },
            success: {
              title: "成功！",
              message: "已將工作項目添加到請求中。",
            },
          },
        },
        update: {
          success: {
            message: "請求更新成功！",
            title: "成功！",
          },
          error: {
            title: "錯誤！",
            message: "無法更新請求。請再試一次！",
          },
        },
        create: {
          success: {
            message: "請求創建成功！",
            title: "成功！",
          },
          error: {
            title: "錯誤！",
            message: "無法創建請求。請再試一次！",
          },
        },
      },
    },
    linked_work_items: {
      label: "鏈接的工作項目",
      link: "鏈接工作項目",
      empty_state: {
        list: {
          title: "您似乎還沒有將工作項目鏈接到此客戶。",
          description: "在此處鏈接任何專案的現有工作項目，以便您可以按此客戶追踪它們。",
          button: "鏈接工作項目",
        },
      },
      action: {
        remove_epic: "移除史詩",
        remove: "移除工作項目",
      },
    },
    sidebar: {
      properties: "屬性",
    },
  },
  templates: {
    settings: {
      title: "模板",
      description: "使用模板可節省80%的專案、工作項目和頁面創建時間。",
      options: {
        project: {
          label: "專案模板",
        },
        work_item: {
          label: "工作項目模板",
        },
        page: {
          label: "頁面模板",
        },
      },
      create_template: {
        label: "創建模板",
        no_permission: {
          project: "聯繫您的專案管理員創建模板",
          workspace: "聯繫您的workspace管理員創建模板",
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
          info: "源自workspace",
        },
        project: {
          info: "源自專案",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "為您的專案模板命名。",
              validation: {
                required: "模板名稱為必填項",
                maxLength: "模板名稱應少於255個字符",
              },
            },
            description: {
              placeholder: "描述何時以及如何使用此模板。",
            },
          },
          name: {
            placeholder: "為您的專案命名。",
            validation: {
              required: "專案標題為必填項",
              maxLength: "專案標題應少於255個字符",
            },
          },
          description: {
            placeholder: "描述此專案的目的和目標。",
          },
          button: {
            create: "創建專案模板",
            update: "更新專案模板",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "為您的工作項目模板命名。",
              validation: {
                required: "模板名稱為必填項",
                maxLength: "模板名稱應少於255個字符",
              },
            },
            description: {
              placeholder: "描述何時以及如何使用此模板。",
            },
          },
          name: {
            placeholder: "為此工作項目提供標題。",
            validation: {
              required: "工作項目標題為必填項",
              maxLength: "工作項目標題應少於255個字符",
            },
          },
          description: {
            placeholder: "描述此工作項目，以便清楚地了解完成時將實現什麼。",
          },
          button: {
            create: "創建工作項目模板",
            update: "更新工作項目模板",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "為您的頁面模板命名。",
              validation: {
                required: "模板名稱為必填項",
                maxLength: "模板名稱應少於255個字符",
              },
            },
            description: {
              placeholder: "描述何時以及如何使用此模板。",
            },
          },
          name: {
            placeholder: "未命名頁面",
            validation: {
              maxLength: "頁面名稱應少於255個字符",
            },
          },
          button: {
            create: "創建頁面模板",
            update: "更新頁面模板",
          },
        },
        publish: {
          action: "{isPublished, select, true {發布設定} other {發布到市場}}",
          unpublish_action: "從市場移除",
          title: "讓您的模板可被發現和識別。",
          name: {
            label: "模板名稱",
            placeholder: "為您的模板命名",
            validation: {
              required: "模板名稱為必填項",
              maxLength: "模板名稱應少於255個字符",
            },
          },
          short_description: {
            label: "簡短描述",
            placeholder: "此模板非常適合同時管理多個專案的專案經理。",
            validation: {
              required: "簡短描述為必填項",
            },
          },
          description: {
            label: "描述",
            placeholder: `通過我們的語音轉文字整合提高生產力並簡化溝通。
• 即時轉錄：立即將口語轉換為準確的文字。
• 任務和評論創建：通過語音命令添加任務、描述和評論。`,
            validation: {
              required: "描述為必填項",
            },
          },
          category: {
            label: "類別",
            placeholder: "選擇您認為最適合的位置。您可以選擇多個。",
            validation: {
              required: "至少需要一個類別",
            },
          },
          keywords: {
            label: "關鍵字",
            placeholder: "使用您認為用戶在尋找此模板時會搜索的術語。",
            helperText: "輸入逗號分隔的關鍵詞，這些關鍵詞可能會幫助人們從搜索中找到此模板。",
            validation: {
              required: "至少需要一個關鍵詞",
            },
          },
          company_name: {
            label: "公司名稱",
            placeholder: "Plane",
            validation: {
              required: "公司名稱為必填項",
              maxLength: "公司名稱應少於255個字符",
            },
          },
          contact_email: {
            label: "支持電子郵件",
            placeholder: "help@plane.so",
            validation: {
              invalid: "無效的電子郵件地址",
              required: "支持電子郵件為必填項",
              maxLength: "支持電子郵件應少於255個字符",
            },
          },
          privacy_policy_url: {
            label: "隱私政策連結",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "無效的URL",
              maxLength: "URL應少於800個字符",
            },
          },
          terms_of_service_url: {
            label: "使用條款連結",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "無效的URL",
              maxLength: "URL應少於800個字符",
            },
          },
          cover_image: {
            label: "添加將在市場中顯示的封面圖片",
            upload_title: "上傳封面圖片",
            upload_placeholder: "點擊上傳或拖放上傳封面圖片",
            drop_here: "拖放到這裡",
            click_to_upload: "點擊上傳",
            invalid_file_or_exceeds_size_limit: "無效的文件或超出大小限制。請重試。",
            upload_and_save: "上傳並保存",
            uploading: "上傳中",
            remove: "刪除",
            removing: "刪除中",
            validation: {
              required: "封面圖片為必填項",
            },
          },
          attach_screenshots: {
            label: "包含您認為會讓此模板的查看者感興趣的文檔和圖片。",
            validation: {
              required: "至少需要一張截圖",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "模板",
        description: "使用Plane中的專案、工作項目和頁面模板，您無需從頭創建專案或手動設置工作項目屬性。",
        sub_description: "使用模板可節省80%的管理時間。",
      },
      no_templates: {
        button: "創建您的第一個模板",
      },
      no_labels: {
        description: " 尚無標籤。創建標籤以幫助組織和篩選專案中的工作項目。",
      },
      no_work_items: {
        description: "尚無工作項目。添加一個以更好地組織您的工作。",
      },
      no_sub_work_items: {
        description: "尚無子工作項目。添加一個以更好地組織您的工作。",
      },
      page: {
        no_templates: {
          title: "您沒有訪問任何模板。",
          description: "請創建一個模板",
        },
        no_results: {
          title: "沒有找到模板。",
          description: "嘗試使用其他術語搜索。",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "模板已創建",
          message: "{templateName}，{templateType}模板，現已可用於您的workspace。",
        },
        error: {
          title: "我們這次無法創建該模板。",
          message: "嘗試再次保存您的詳細信息或將它們複製到新模板中，最好在另一個標籤頁中。",
        },
      },
      update: {
        success: {
          title: "模板已更改",
          message: "{templateName}，{templateType}模板，已更改。",
        },
        error: {
          title: "我們無法保存對此模板的更改。",
          message: "嘗試再次保存您的詳細信息或稍後返回此模板。如果仍有問題，請聯繫我們。",
        },
      },
      delete: {
        success: {
          title: "模板已刪除",
          message: "{templateName}，{templateType}模板，現已從您的workspace中刪除。",
        },
        error: {
          title: "我們無法刪除該模板。",
          message: "嘗試再次刪除它或稍後再試。如果您仍然無法刪除它，請聯繫我們。",
        },
      },
      unpublish: {
        success: {
          title: "模板已移除",
          message: "{templateName}，{templateType}模板，已被移除。",
        },
        error: {
          title: "我們無法移除該模板。",
          message: "嘗試再次移除它或稍後再試。如果您仍然無法移除它，請聯繫我們。",
        },
      },
    },
    delete_confirmation: {
      title: "刪除模板",
      description: {
        prefix: "您確定要刪除模板-",
        suffix: "嗎？與模板相關的所有數據將被永久移除。此操作無法撤銷。",
      },
    },
    unpublish_confirmation: {
      title: "移除模板",
      description: {
        prefix: "您確定要移除模板-",
        suffix: "嗎？此模板將不再在市場上供用戶使用。",
      },
    },
    dropdown: {
      add: {
        work_item: "新增範本",
        project: "新增範本",
      },
      label: {
        project: "選擇專案範本",
        page: "從範本中選擇",
      },
      tooltip: {
        work_item: "選擇工作項目範本",
      },
      no_results: {
        work_item: "找不到範本。",
        project: "找不到範本。",
      },
    },
  },
  intake_forms: {
    create: {
      title: "建立工作項目",
      "sub-title": "讓團隊知道您希望他們處理的內容。",
      name: "名稱",
      email: "電子郵件",
      about: "此工作項目的內容是什麼？",
      description: "描述應該發生什麼",
      description_placeholder: "盡量提供詳細資訊，協助團隊了解您的情況與需求。",
      loading: "建立中",
      create_work_item: "建立工作項目",
      errors: {
        name: "名稱為必填",
        name_max_length: "名稱不得超過 255 個字元",
        email: "電子郵件為必填",
        email_invalid: "電子郵件地址無效",
        title: "標題為必填",
        title_max_length: "標題不得超過 255 個字元",
      },
    },
    success: {
      title: "您的工作項目已加入團隊佇列。",
      description: "團隊現在可以從進件佇列中核准或捨棄此工作項目。",
      primary_button: {
        text: "新增另一個工作項目",
      },
      secondary_button: {
        text: "進一步了解進件",
      },
    },
    how_it_works: {
      title: "運作方式",
      heading: "這是進件表單。",
      description: "進件是 Plane 的功能，讓專案管理員與經理能將外部工作項目納入專案。",
      steps: {
        step_1: "此簡短表單可讓您在 Plane 專案中建立新的工作項目。",
        step_2: "提交此表單後，會在該專案的進件中建立新的工作項目。",
        step_3: "該專案或團隊的成員會進行審核。",
        step_4: "若核准，此工作項目將移至專案的工作佇列；否則將被拒絕。",
        step_5: "若要查詢該工作項目的狀態，請聯絡專案經理、管理員或提供此頁面連結的人。",
      },
    },
    type_forms: {
      select_types: {
        title: "選擇工作項目類型",
        search_placeholder: "搜尋工作項目類型",
      },
      actions: {
        select_properties: "選擇屬性",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "重複工作項目",
      description: "設定一次重複工作，我們將處理重複。當需要時，您將在此處看到所有內容。",
      new_recurring_work_item: "新增重複工作項目",
      update_recurring_work_item: "更新重複工作項目",
      form: {
        interval: {
          title: "排程",
          start_date: {
            validation: {
              required: "開始日期為必填",
            },
          },
          interval_type: {
            validation: {
              required: "間隔類型為必填",
            },
          },
        },
        button: {
          create: "建立重複工作項目",
          update: "更新重複工作項目",
        },
      },
      create_button: {
        label: "建立重複工作項目",
        no_permission: "請聯繫您的專案管理員以建立重複工作項目",
      },
    },
    empty_state: {
      upgrade: {
        title: "自動化您的工作",
        description: "只需設定一次，到期時我們會自動為您建立。升級至商業版，讓重複工作變得輕鬆無憂。",
      },
      no_templates: {
        button: "建立您的第一個重複工作項目",
      },
    },
    toasts: {
      create: {
        success: {
          title: "已建立重複工作項目",
          message: "{name}，該重複工作項目，現已在您的工作區中可用。",
        },
        error: {
          title: "本次無法建立該重複工作項目。",
          message: "請再試一次儲存您的資訊，或將其複製到新的重複工作項目中，建議在其他分頁操作。",
        },
      },
      update: {
        success: {
          title: "重複工作項目已變更",
          message: "{name}，該重複工作項目，已被變更。",
        },
        error: {
          title: "無法儲存該重複工作項目的變更。",
          message: "請再試一次儲存您的資訊，或稍後再回來變更該重複工作項目。如果仍有問題，請聯繫我們。",
        },
      },
      delete: {
        success: {
          title: "已刪除重複工作項目",
          message: "{name}，該重複工作項目，已從您的工作區中刪除。",
        },
        error: {
          title: "無法刪除該重複工作項目。",
          message: "請再試一次刪除，或稍後再試。如果仍無法刪除，請聯繫我們。",
        },
      },
    },
    delete_confirmation: {
      title: "刪除重複工作項目",
      description: {
        prefix: "您確定要刪除重複工作項目-",
        suffix: "嗎？與該重複工作項目相關的所有資料將被永久移除。此操作無法撤銷。",
      },
    },
  },
  automations: {
    settings: {
      title: "自訂自動化",
      create_automation: "建立自動化",
    },
    scope: {
      label: "範圍",
      run_on: "執行於",
    },
    trigger: {
      label: "觸發器",
      add_trigger: "新增觸發器",
      sidebar_header: "觸發器設定",
      input_label: "此自動化的觸發器是什麼？",
      input_placeholder: "選擇一個選項",
      button: {
        previous: "返回",
        next: "新增動作",
      },
    },
    condition: {
      label: "條件",
      add_condition: "新增條件",
      adding_condition: "正在新增條件",
    },
    action: {
      label: "動作",
      add_action: "新增動作",
      sidebar_header: "動作",
      input_label: "自動化執行什麼動作？",
      input_placeholder: "選擇一個選項",
      handler_name: {
        add_comment: "新增評論",
        change_property: "變更屬性",
      },
      configuration: {
        label: "設定",
        change_property: {
          placeholders: {
            property_name: "選擇屬性",
            change_type: "選擇",
            property_value_select: "{count, plural, one{選擇值} other{選擇值}}",
            property_value_select_date: "選擇日期",
          },
          validation: {
            property_name_required: "屬性名稱為必填",
            change_type_required: "變更類型為必填",
            property_value_required: "屬性值為必填",
          },
        },
      },
      comment_block: {
        title: "新增評論",
      },
      change_property_block: {
        title: "變更屬性",
      },
      validation: {
        delete_only_action: "在刪除唯一動作之前，請先停用自動化。",
      },
    },
    conjunctions: {
      and: "且",
      or: "或",
      if: "如果",
      then: "則",
    },
    enable: {
      alert: "當您的自動化完成時，點擊「啟用」。啟用後，自動化將準備執行。",
      validation: {
        required: "自動化必須有一個觸發器和至少一個動作才能啟用。",
      },
    },
    delete: {
      validation: {
        enabled: "刪除自動化之前必須先停用它。",
      },
    },
    table: {
      title: "自動化標題",
      last_run_on: "最後執行時間",
      created_on: "建立時間",
      last_updated_on: "最後更新時間",
      last_run_status: "最後執行狀態",
      average_duration: "平均持續時間",
      owner: "擁有者",
      executions: "執行次數",
    },
    create_modal: {
      heading: {
        create: "建立自動化",
        update: "更新自動化",
      },
      title: {
        placeholder: "為您的自動化命名。",
        required_error: "標題為必填",
      },
      description: {
        placeholder: "描述您的自動化。",
      },
      submit_button: {
        create: "建立自動化",
        update: "更新自動化",
      },
    },
    delete_modal: {
      heading: "刪除自動化",
    },
    activity: {
      filters: {
        show_fails: "顯示失敗",
        all: "全部",
        only_activity: "僅活動",
        only_run_history: "僅執行歷史",
      },
      run_history: {
        initiator: "發起者",
      },
    },
    toasts: {
      create: {
        success: {
          title: "成功！",
          message: "自動化建立成功。",
        },
        error: {
          title: "錯誤！",
          message: "自動化建立失敗。",
        },
      },
      update: {
        success: {
          title: "成功！",
          message: "自動化更新成功。",
        },
        error: {
          title: "錯誤！",
          message: "自動化更新失敗。",
        },
      },
      enable: {
        success: {
          title: "成功！",
          message: "自動化啟用成功。",
        },
        error: {
          title: "錯誤！",
          message: "自動化啟用失敗。",
        },
      },
      disable: {
        success: {
          title: "成功！",
          message: "自動化停用成功。",
        },
        error: {
          title: "錯誤！",
          message: "自動化停用失敗。",
        },
      },
      delete: {
        success: {
          title: "已刪除自動化",
          message: "{name}，該自動化，現已從您的專案中刪除。",
        },
        error: {
          title: "本次無法刪除該自動化。",
          message: "請再試一次刪除，或稍後再試。如果仍無法刪除，請聯繫我們。",
        },
      },
      action: {
        create: {
          error: {
            title: "錯誤！",
            message: "建立動作失敗。請再試一次！",
          },
        },
        update: {
          error: {
            title: "錯誤！",
            message: "更新動作失敗。請再試一次！",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "尚無自動化可顯示。",
        description: "自動化透過設定觸發器、條件和動作來幫助您消除重複性任務。建立一個來節省時間並讓工作輕鬆進行。",
      },
      upgrade: {
        title: "自動化",
        description: "自動化是在您的專案中自動執行任務的方式。",
        sub_description: "使用自動化可以節省80%的管理時間。",
      },
    },
  },
  sso: {
    header: "身分",
    description: "設定您的網域以存取安全功能，包括單一登入。",
    domain_management: {
      header: "網域管理",
      verified_domains: {
        header: "已驗證的網域",
        description: "驗證電子郵件網域的所有權以啟用單一登入。",
        button_text: "新增網域",
        list: {
          domain_name: "網域名稱",
          status: "狀態",
          status_verified: "已驗證",
          status_failed: "失敗",
          status_pending: "待處理",
        },
        add_domain: {
          title: "新增網域",
          description: "新增您的網域以設定 SSO 並驗證它。",
          form: {
            domain_label: "網域",
            domain_placeholder: "plane.so",
            domain_required: "網域為必填",
            domain_invalid: "請輸入有效的網域名稱（例如 plane.so）",
          },
          primary_button_text: "新增網域",
          primary_button_loading_text: "新增中",
          toast: {
            success_title: "成功！",
            success_message: "網域已成功新增。請透過新增 DNS TXT 記錄來驗證它。",
            error_message: "新增網域失敗。請重試。",
          },
        },
        verify_domain: {
          title: "驗證您的網域",
          description: "請按照以下步驟驗證您的網域。",
          instructions: {
            label: "說明",
            step_1: "前往您的網域主機的 DNS 設定。",
            step_2: {
              part_1: "建立一個",
              part_2: "TXT 記錄",
              part_3: "並貼上下面提供的完整記錄值。",
            },
            step_3: "此更新通常需要幾分鐘，但可能需要長達 72 小時才能完成。",
            step_4: "DNS 記錄更新後，點擊「驗證網域」進行確認。",
          },
          verification_code_label: "TXT 記錄值",
          verification_code_description: "將此記錄新增到您的 DNS 設定",
          domain_label: "網域",
          primary_button_text: "驗證網域",
          primary_button_loading_text: "驗證中",
          secondary_button_text: "稍後處理",
          toast: {
            success_title: "成功！",
            success_message: "網域已成功驗證。",
            error_message: "驗證網域失敗。請重試。",
          },
        },
        delete_domain: {
          title: "刪除網域",
          description: {
            prefix: "您確定要刪除",
            suffix: "嗎？此操作無法復原。",
          },
          primary_button_text: "刪除",
          primary_button_loading_text: "刪除中",
          secondary_button_text: "取消",
          toast: {
            success_title: "成功！",
            success_message: "網域已成功刪除。",
            error_message: "刪除網域失敗。請重試。",
          },
        },
      },
    },
    providers: {
      header: "單一登入",
      disabled_message: "新增已驗證的網域以設定 SSO",
      configure: {
        create: "設定",
        update: "編輯",
      },
      switch_alert_modal: {
        title: "將 SSO 方法切換到 {newProviderShortName}？",
        content:
          "您即將啟用 {newProviderLongName}（{newProviderShortName}）。此操作將自動停用 {activeProviderLongName}（{activeProviderShortName}）。嘗試透過 {activeProviderShortName} 登入的使用者將無法再存取平台，直到他們切換到新方法。您確定要繼續嗎？",
        primary_button_text: "切換",
        primary_button_text_loading: "切換中",
        secondary_button_text: "取消",
      },
      form_section: {
        title: "IdP 為 {workspaceName} 提供的詳細資訊",
      },
      form_action_buttons: {
        saving: "儲存中",
        save_changes: "儲存變更",
        configure_only: "僅設定",
        configure_and_enable: "設定並啟用",
        default: "儲存",
      },
      setup_details_section: {
        title: "{workspaceName} 為您的 IdP 提供的詳細資訊",
        button_text: "取得設定詳細資訊",
      },
      saml: {
        header: "啟用 SAML",
        description: "設定您的 SAML 身分提供者以啟用單一登入。",
        configure: {
          title: "啟用 SAML",
          description: "驗證電子郵件網域的所有權以存取安全功能，包括單一登入。",
          toast: {
            success_title: "成功！",
            create_success_message: "SAML 提供者已成功建立。",
            update_success_message: "SAML 提供者已成功更新。",
            error_title: "錯誤！",
            error_message: "儲存 SAML 提供者失敗。請重試。",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web 詳細資訊",
            entity_id: {
              label: "實體 ID | 對象 | 中繼資料資訊",
              description: "我們將產生此部分中繼資料，將此 Plane 應用程式識別為您 IdP 上的授權服務。",
            },
            callback_url: {
              label: "單一登入 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的登入重新導向 URL 欄位中。",
            },
            logout_url: {
              label: "單一登出 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的單一登出重新導向 URL 欄位中。",
            },
          },
          mobile_details: {
            header: "行動裝置詳細資訊",
            entity_id: {
              label: "實體 ID | 對象 | 中繼資料資訊",
              description: "我們將產生此部分中繼資料，將此 Plane 應用程式識別為您 IdP 上的授權服務。",
            },
            callback_url: {
              label: "單一登入 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的登入重新導向 URL 欄位中。",
            },
            logout_url: {
              label: "單一登出 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的登出重新導向 URL 欄位中。",
            },
          },
          mapping_table: {
            header: "對應詳細資訊",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "啟用 OIDC",
        description: "設定您的 OIDC 身分提供者以啟用單一登入。",
        configure: {
          title: "啟用 OIDC",
          description: "驗證電子郵件網域的所有權以存取安全功能，包括單一登入。",
          toast: {
            success_title: "成功！",
            create_success_message: "OIDC 提供者已成功建立。",
            update_success_message: "OIDC 提供者已成功更新。",
            error_title: "錯誤！",
            error_message: "儲存 OIDC 提供者失敗。請重試。",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web 詳細資訊",
            origin_url: {
              label: "來源 URL",
              description: "我們將為此 Plane 應用程式產生此內容。將其作為受信任的來源新增到您 IdP 的對應欄位中。",
            },
            callback_url: {
              label: "重新導向 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的登入重新導向 URL 欄位中。",
            },
            logout_url: {
              label: "登出 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的登出重新導向 URL 欄位中。",
            },
          },
          mobile_details: {
            header: "行動裝置詳細資訊",
            origin_url: {
              label: "來源 URL",
              description: "我們將為此 Plane 應用程式產生此內容。將其作為受信任的來源新增到您 IdP 的對應欄位中。",
            },
            callback_url: {
              label: "重新導向 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的登入重新導向 URL 欄位中。",
            },
            logout_url: {
              label: "登出 URL",
              description: "我們將為您產生此內容。將其新增到您 IdP 的登出重新導向 URL 欄位中。",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "專案名稱不能包含特殊字元。",
  pql: {
    functions: {
      date: {
        now: {
          description: "目前日期和時間",
        },
        today: {
          description: "今天的日期",
        },
        start_of_day: {
          description: "今天開始",
        },
        end_of_day: {
          description: "今天結束",
        },
        start_of_week: {
          description: "本週開始",
        },
        end_of_week: {
          description: "本週結束",
        },
        start_of_month: {
          description: "本月開始",
        },
        end_of_month: {
          description: "本月結束",
        },
        start_of_year: {
          description: "今年開始",
        },
        end_of_year: {
          description: "今年結束",
        },
        days_ago: {
          description: "n 天前的日期",
        },
        days_from_now: {
          description: "n 天後的日期",
        },
        weeks_ago: {
          description: "n 週前的日期",
        },
        weeks_from_now: {
          description: "n 週後的日期",
        },
        months_ago: {
          description: "n 個月前的日期",
        },
        months_from_now: {
          description: "n 個月後的日期",
        },
      },
      user: {
        current_user: {
          description: "目前登入的使用者",
        },
        members_of: {
          description: '"project:<id>" 或 "teamspace:<id>" 的成員',
        },
        workspace_members: {
          description: "所有工作區成員",
        },
      },
      cycle: {
        active_cycle: {
          description: "今天活躍的週期",
        },
        completed_cycles: {
          description: "結束日期已過的週期",
        },
        upcoming_cycles: {
          description: "開始日期在未來的週期",
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
          description: "截止日期已過且狀態為開放",
        },
        has_no_assignee: {
          description: "工作項目沒有負責人",
        },
        has_no_label: {
          description: "工作項目沒有標籤",
        },
        is_top_level: {
          description: "不是子工作項目（沒有父項）",
        },
        is_sub_work_item: {
          description: "是子工作項目（有父項）",
        },
        is_epic: {
          description: "史詩",
        },
        is_intake: {
          description: "是接收工作項目",
        },
        is_draft: {
          description: "是草稿工作項目",
        },
        is_archived: {
          description: "已封存",
        },
        has_children: {
          description: "至少有一個子工作項目",
        },
        has_start_and_due_dates: {
          description: "同時有開始日期和截止日期",
        },
      },
      relation: {
        linked_to: {
          description: "與給定工作項目相關的工作項目",
        },
        blocked_by: {
          description: "被給定工作項目阻塞的工作項目",
        },
        blocks: {
          description: "阻塞給定工作項目的工作項目",
        },
        child_of: {
          description: "給定工作項目的子工作項目",
        },
        parent_of: {
          description: "給定工作項目的父工作項目",
        },
        duplicate_of: {
          description: "標記為給定工作項目重複項的工作項目",
        },
      },
      history: {
        was_ever: {
          description: "欄位曾經被設定為此值",
        },
        was: {
          description: "欄位之前是此值（已更改）",
        },
        changed_from: {
          description: "欄位從此值更改",
        },
        changed_to: {
          description: "欄位更改為此值",
        },
        changed: {
          description: "欄位已更改",
        },
        updated_by: {
          description: "此使用者更新的工作項目",
        },
        commented_by: {
          description: "此使用者評論的工作項目",
        },
        field_changed_by: {
          description: "此使用者更改的欄位",
        },
        was_assigned_to: {
          description: "指派給此使用者的工作項目",
        },
        changed_after: {
          description: "在此日期之後更改的欄位",
        },
        changed_before: {
          description: "在此日期之前更改的欄位",
        },
        field_changed_after: {
          description: "在此日期之後更改的欄位",
        },
        field_changed_before: {
          description: "在此日期之前更改的欄位",
        },
        changed_to_after: {
          description: "在此日期之後更改為此值的欄位",
        },
        changed_to_before: {
          description: "在此日期之前更改為此值的欄位",
        },
        field_changed_between: {
          description: "在這些日期之間更改的欄位",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "導航",
      accept: "確認",
      close: "關閉",
      pick_date: "選擇日期",
    },
    placeholder: '輸入查詢並按 "ENTER" 進行篩選...',
    error: "提交查詢時發生錯誤。請檢查後重試。",
  },
  releases: {
    releases: "發佈",
    release: "發佈",
    no_release: "尚無發佈",
    select_releases: "選擇發佈",
    count_releases: "{count, plural, one {# 發佈} other {# 發佈}}",
    actions: {
      delete: "刪除",
    },
    delete_modal: {
      title: "刪除發佈",
      content: "您確定要刪除發佈「{releaseName}」嗎？此操作無法復原。",
    },
    settings: {
      heading: {
        title: "發佈",
        description: "使用發佈精準管理專案交付物。",
      },
      toggle: {
        title: "啟用發佈",
        description: "工作區成員將在各自的專案中擁有此範圍的檢視權限。",
      },
      toasts: {
        enable: {
          loading: "正在啟用發佈...",
          success: {
            title: "已啟用發佈",
            message: "此工作區已啟用發佈。",
          },
          error: {
            title: "錯誤",
            message: "啟用發佈失敗。請再試一次。",
          },
        },
        disable: {
          loading: "正在停用發佈...",
          success: {
            title: "已停用發佈",
            message: "此工作區已停用發佈。",
          },
          error: {
            title: "錯誤",
            message: "停用發佈失敗。請再試一次。",
          },
        },
      },
      tabs: {
        tags: "發佈標籤",
        labels: "標籤",
      },
      tags: {
        title: "發佈標籤",
        description: "使用標籤對發佈進行分類與篩選。",
        add: "新增標籤",
        empty_state: "還沒有標籤。建立您的第一個標籤。",
        errors: {
          version_required: "版本為必填項。",
          version_already_exists: "已存在具有此版本的標籤。",
          generic: "發生錯誤。請再試一次。",
        },
        delete_modal: {
          title: "刪除標籤",
          content: "您確定要刪除標籤「{tagVersion}」嗎？此操作無法復原。",
        },
        actions: {
          edit: "編輯標籤",
          delete: "刪除標籤",
        },
        toasts: {
          delete: {
            success: "標籤已成功刪除。",
            error: "刪除標籤失敗。請再試一次。",
          },
        },
      },
      labels: {
        title: "標籤",
        description: "使用標籤來整理與組織您的計劃。",
        add: "新增標籤",
        empty_state: "還沒有標籤。建立您的第一個標籤。",
        errors: {
          name_required: "名稱為必填項。",
          name_already_exists: "已存在同名標籤。",
          generic: "發生錯誤。請再試一次。",
        },
        modal: {
          name_placeholder: "標籤名稱",
          pick_color: "選擇標籤顏色",
        },
        actions: {
          edit: "編輯標籤",
          delete: "刪除標籤",
        },
        drag_to_reorder: "拖曳以重新排序",
        delete_modal: {
          title: "刪除標籤",
          content: "您確定要刪除標籤「{labelName}」嗎？此操作無法復原。",
        },
        toasts: {
          delete: {
            success: "標籤已成功刪除。",
            error: "刪除標籤失敗。請再試一次。",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "層級",
      tab_label: "層級",
      description: "設定層級結構以整理您的工作。每個層級定義與直接上方項目的父關係，以及與直接下方項目的子關係。 ",
      sidebar_label: "層級",
      enable_control: {
        title: "啟用層級",
        description: "在不同工作項目類型之間建立父子關係。",
        tooltip: "層級一旦啟用便無法停用。",
      },
      workspace_work_item_types_disabled_banner: {
        content: "請先定義工作項目類型，再建立新的層級。",
        cta: "工作項目類型設定",
      },
    },
    levels: {
      add_level_button: "新增層級",
      empty_level_placeholder: "新增工作項目類型至第 {level} 層",
      empty_level_unauthorized: "此層級中未找到工作項目類型。",
      zero_level_description: "預設情況下，所有工作項目類型在分配至層級結構之前均處於第 0 層。",
    },
    add_level_modal: {
      title: "新增層級",
      description: "為工作項目類型新增一個新層級。",
      work_item_type: "工作項目類型",
      empty_state: {
        title: "所有工作項目類型已在使用中",
        description: "此工作區中定義的每個工作項目類型已是您階層的一部分。",
      },
      invalid_level_toast: {
        title: "錯誤！",
        message: "{type_name} 無法新增至第 {level} 層，因為這違反了層級規則。",
      },
      not_found_toast: {
        title: "錯誤",
        message: "找不到工作項目類型。",
      },
      error_toast: {
        title: "錯誤",
        message: "無法將工作項目類型新增至層級。",
      },
    },
    remove_from_level_toast: {
      loading: "正在從層級移除工作項目類型",
      success: {
        title: "成功！",
        message: "已成功從層級移除工作項目類型。",
      },
      error: {
        title: "錯誤！",
        message: "無法從層級移除工作項目類型。",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "錯誤！",
        message: "所選工作項目類型違反層級規則，無法用於建立新的工作項目。",
      },
      invalid_work_item_type_update_toast: {
        title: "錯誤！",
        message: "工作項目類型因違反層級規則而無法更新。",
      },
    },
  },
} as const;

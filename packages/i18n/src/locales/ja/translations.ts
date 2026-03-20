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
    we_are_working_on_this_if_you_need_immediate_assistance:
      "現在この問題に取り組んでいます。緊急のサポートが必要な場合は、",
    reach_out_to_us: "お問い合わせください",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our: "それ以外の場合は、時々ページを更新するか、こちらの",
    status_page: "ステータスページ",
  },
  sidebar: {
    projects: "プロジェクト",
    pages: "ページ",
    new_work_item: "新規作業項目",
    home: "ホーム",
    your_work: "あなたの作業",
    inbox: "受信トレイ",
    workspace: "ワークスペース",
    views: "ビュー",
    analytics: "アナリティクス",
    work_items: "作業項目",
    cycles: "サイクル",
    modules: "モジュール",
    intake: "インテーク",
    drafts: "下書き",
    favorites: "お気に入り",
    pro: "プロ",
    upgrade: "アップグレード",
    pi_chat: "AIチャット",
    initiatives: "イニシアチブ",
    teamspaces: "チームスペース",
    epics: "エピック",
    upgrade_plan: "プランをアップグレード",
    plane_pro: "Plane Pro",
    business: "ビジネス",
    customers: "顧客",
    recurring_work_items: "繰り返し作業項目",
  },
  auth: {
    common: {
      email: {
        label: "メールアドレス",
        placeholder: "name@company.com",
        errors: {
          required: "メールアドレスは必須です",
          invalid: "メールアドレスが無効です",
        },
      },
      password: {
        label: "パスワード",
        set_password: "パスワードを設定",
        placeholder: "パスワードを入力",
        confirm_password: {
          label: "パスワードの確認",
          placeholder: "パスワードを確認",
        },
        current_password: {
          label: "現在のパスワード",
        },
        new_password: {
          label: "新しいパスワード",
          placeholder: "新しいパスワードを入力",
        },
        change_password: {
          label: {
            default: "パスワードを変更",
            submitting: "パスワードを変更中",
          },
        },
        errors: {
          match: "パスワードが一致しません",
          empty: "パスワードを入力してください",
          length: "パスワードは8文字以上である必要があります",
          strength: {
            weak: "パスワードが弱すぎます",
            strong: "パスワードは十分な強度です",
          },
        },
        submit: "パスワードを設定",
        toast: {
          change_password: {
            success: {
              title: "成功！",
              message: "パスワードが正常に変更されました。",
            },
            error: {
              title: "エラー！",
              message: "問題が発生しました。もう一度お試しください。",
            },
          },
        },
      },
      unique_code: {
        label: "ユニークコード",
        placeholder: "123456",
        paste_code: "メールで送信されたコードを貼り付けてください",
        requesting_new_code: "新しいコードをリクエスト中",
        sending_code: "コードを送信中",
      },
      already_have_an_account: "すでにアカウントをお持ちですか？",
      login: "ログイン",
      create_account: "アカウントを作成",
      new_to_plane: "Planeは初めてですか？",
      back_to_sign_in: "サインインに戻る",
      resend_in: "{seconds}秒後に再送信",
      sign_in_with_unique_code: "ユニークコードでサインイン",
      forgot_password: "パスワードをお忘れですか？",
      username: {
        label: "ユーザー名",
        placeholder: "ユーザー名を入力してください",
      },
    },
    sign_up: {
      header: {
        label: "チームと作業を管理するためのアカウントを作成してください。",
        step: {
          email: {
            header: "サインアップ",
            sub_header: "",
          },
          password: {
            header: "サインアップ",
            sub_header: "メールアドレスとパスワードの組み合わせでサインアップ。",
          },
          unique_code: {
            header: "サインアップ",
            sub_header: "上記のメールアドレスに送信されたユニークコードでサインアップ。",
          },
        },
      },
      errors: {
        password: {
          strength: "強力なパスワードを設定して続行してください",
        },
      },
    },
    sign_in: {
      header: {
        label: "チームと作業を管理するためにログインしてください。",
        step: {
          email: {
            header: "ログインまたはサインアップ",
            sub_header: "",
          },
          password: {
            header: "ログインまたはサインアップ",
            sub_header: "メールアドレスとパスワードの組み合わせでログイン。",
          },
          unique_code: {
            header: "ログインまたはサインアップ",
            sub_header: "上記のメールアドレスに送信されたユニークコードでログイン。",
          },
        },
      },
    },
    forgot_password: {
      title: "パスワードをリセット",
      description:
        "確認済みのユーザーアカウントのメールアドレスを入力してください。パスワードリセットリンクを送信します。",
      email_sent: "リセットリンクをメールアドレスに送信しました",
      send_reset_link: "リセットリンクを送信",
      errors: {
        smtp_not_enabled: "管理者がSMTPを有効にしていないため、パスワードリセットリンクを送信できません",
      },
      toast: {
        success: {
          title: "メール送信完了",
          message:
            "パスワードをリセットするためのリンクを受信トレイで確認してください。数分以内に表示されない場合は、迷惑メールフォルダを確認してください。",
        },
        error: {
          title: "エラー！",
          message: "問題が発生しました。もう一度お試しください。",
        },
      },
    },
    reset_password: {
      title: "新しいパスワードを設定",
      description: "強力なパスワードでアカウントを保護",
    },
    set_password: {
      title: "アカウントを保護",
      description: "パスワードを設定して安全にログイン",
    },
    sign_out: {
      toast: {
        error: {
          title: "エラー！",
          message: "サインアウトに失敗しました。もう一度お試しください。",
        },
      },
    },
    ldap: {
      header: {
        label: "{ldapProviderName}で続行",
        sub_header: "{ldapProviderName}の認証情報を入力してください",
      },
    },
  },
  submit: "送信",
  cancel: "キャンセル",
  loading: "読み込み中",
  error: "エラー",
  success: "成功",
  warning: "警告",
  info: "情報",
  close: "閉じる",
  yes: "はい",
  no: "いいえ",
  ok: "OK",
  name: "名前",
  description: "説明",
  search: "検索",
  add_member: "メンバーを追加",
  adding_members: "メンバーを追加中",
  remove_member: "メンバーを削除",
  add_members: "メンバーを追加",
  adding_member: "メンバーを追加中",
  remove_members: "メンバーを削除",
  add: "追加",
  adding: "追加中",
  remove: "削除",
  add_new: "新規追加",
  remove_selected: "選択項目を削除",
  first_name: "名",
  last_name: "姓",
  email: "メールアドレス",
  display_name: "表示名",
  role: "役割",
  timezone: "タイムゾーン",
  avatar: "アバター",
  cover_image: "カバー画像",
  password: "パスワード",
  change_cover: "カバーを変更",
  language: "言語",
  saving: "保存中",
  save_changes: "変更を保存",
  deactivate_account: "アカウントを無効化",
  deactivate_account_description:
    "アカウントを無効化すると、そのアカウント内のすべてのデータとリソースが完全に削除され、復元できなくなります。",
  profile_settings: "プロフィール設定",
  your_account: "あなたのアカウント",
  security: "セキュリティ",
  activity: "アクティビティ",
  appearance: "外観",
  notifications: "通知",
  workspaces: "ワークスペース",
  create_workspace: "ワークスペースを作成",
  invitations: "招待",
  summary: "概要",
  assigned: "割り当て済み",
  created: "作成済み",
  subscribed: "購読中",
  you_do_not_have_the_permission_to_access_this_page: "このページにアクセスする権限がありません。",
  something_went_wrong_please_try_again: "問題が発生しました。もう一度お試しください。",
  load_more: "もっと読み込む",
  select_or_customize_your_interface_color_scheme: "インターフェースのカラースキームを選択またはカスタマイズします。",
  select_the_cursor_motion_style_that_feels_right_for_you: "自分に合ったカーソル移動スタイルを選択してください。",
  theme: "テーマ",
  smooth_cursor: "スムーズカーソル",
  system_preference: "システム設定",
  light: "ライト",
  dark: "ダーク",
  light_contrast: "ライトハイコントラスト",
  dark_contrast: "ダークハイコントラスト",
  custom: "カスタムテーマ",
  select_your_theme: "テーマを選択",
  customize_your_theme: "テーマをカスタマイズ",
  background_color: "背景色",
  text_color: "文字色",
  primary_color: "プライマリ（テーマ）カラー",
  sidebar_background_color: "サイドバーの背景色",
  sidebar_text_color: "サイドバーの文字色",
  set_theme: "テーマを設定",
  enter_a_valid_hex_code_of_6_characters: "6文字の有効な16進コードを入力してください",
  background_color_is_required: "背景色は必須です",
  text_color_is_required: "文字色は必須です",
  primary_color_is_required: "プライマリカラーは必須です",
  sidebar_background_color_is_required: "サイドバーの背景色は必須です",
  sidebar_text_color_is_required: "サイドバーの文字色は必須です",
  updating_theme: "テーマを更新中",
  theme_updated_successfully: "テーマが正常に更新されました",
  failed_to_update_the_theme: "テーマの更新に失敗しました",
  email_notifications: "メール通知",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "購読している作業項目の最新情報を受け取ります。通知を受け取るには有効にしてください。",
  email_notification_setting_updated_successfully: "メール通知設定が正常に更新されました",
  failed_to_update_email_notification_setting: "メール通知設定の更新に失敗しました",
  notify_me_when: "通知を受け取るタイミング",
  property_changes: "プロパティの変更",
  property_changes_description: "作業項目の担当者、優先度、見積もりなどのプロパティが変更されたときに通知します。",
  state_change: "状態の変更",
  state_change_description: "作業項目が異なる状態に移動したときに通知します",
  issue_completed: "作業項目の完了",
  issue_completed_description: "作業項目が完了したときのみ通知します",
  comments: "コメント",
  comments_description: "誰かが作業項目にコメントを残したときに通知します",
  mentions: "メンション",
  mentions_description: "誰かがコメントや説明で自分をメンションしたときのみ通知します",
  old_password: "現在のパスワード",
  general_settings: "一般設定",
  sign_out: "サインアウト",
  signing_out: "サインアウト中",
  active_cycles: "アクティブサイクル",
  active_cycles_description:
    "プロジェクト全体のサイクルを監視し、優先度の高い作業項目を追跡し、注意が必要なサイクルにズームインします。",
  on_demand_snapshots_of_all_your_cycles: "すべてのサイクルのオンデマンドスナップショット",
  upgrade: "アップグレード",
  "10000_feet_view": "すべてのアクティブサイクルの俯瞰図",
  "10000_feet_view_description":
    "各プロジェクトのサイクル間を移動する代わりに、すべてのプロジェクトの実行中のサイクルを一度に確認できます。",
  get_snapshot_of_each_active_cycle: "各アクティブサイクルのスナップショットを取得",
  get_snapshot_of_each_active_cycle_description:
    "すべてのアクティブサイクルの主要な指標を追跡し、進捗状況を確認し、期限に対する範囲を把握します。",
  compare_burndowns: "バーンダウンを比較",
  compare_burndowns_description: "各サイクルのバーンダウンレポートを確認して、各チームのパフォーマンスを監視します。",
  quickly_see_make_or_break_issues: "重要な作業項目をすぐに確認",
  quickly_see_make_or_break_issues_description:
    "期限に対する各サイクルの優先度の高い作業項目をプレビューします。ワンクリックでサイクルごとにすべての項目を確認できます。",
  zoom_into_cycles_that_need_attention: "注意が必要なサイクルにズームイン",
  zoom_into_cycles_that_need_attention_description: "期待に沿わないサイクルの状態をワンクリックで調査します。",
  stay_ahead_of_blockers: "ブロッカーに先手を打つ",
  stay_ahead_of_blockers_description:
    "プロジェクト間の課題を特定し、他のビューでは明らかでないサイクル間の依存関係を確認します。",
  analytics: "アナリティクス",
  workspace_invites: "ワークスペースの招待",
  enter_god_mode: "ゴッドモードに入る",
  workspace_logo: "ワークスペースのロゴ",
  new_issue: "新規作業項目",
  your_work: "あなたの作業",
  drafts: "下書き",
  projects: "プロジェクト",
  views: "ビュー",
  archives: "アーカイブ",
  settings: "設定",
  failed_to_move_favorite: "お気に入りの移動に失敗しました",
  favorites: "お気に入り",
  no_favorites_yet: "まだお気に入りがありません",
  create_folder: "フォルダを作成",
  new_folder: "新規フォルダ",
  favorite_updated_successfully: "お気に入りが正常に更新されました",
  favorite_created_successfully: "お気に入りが正常に作成されました",
  folder_already_exists: "フォルダは既に存在します",
  folder_name_cannot_be_empty: "フォルダ名を空にすることはできません",
  something_went_wrong: "問題が発生しました",
  failed_to_reorder_favorite: "お気に入りの並び替えに失敗しました",
  favorite_removed_successfully: "お気に入りが正常に削除されました",
  failed_to_create_favorite: "お気に入りの作成に失敗しました",
  failed_to_rename_favorite: "お気に入りの名前変更に失敗しました",
  project_link_copied_to_clipboard: "プロジェクトリンクがクリップボードにコピーされました",
  link_copied: "リンクがコピーされました",
  add_project: "プロジェクトを追加",
  create_project: "プロジェクトを作成",
  failed_to_remove_project_from_favorites: "プロジェクトをお気に入りから削除できませんでした。もう一度お試しください。",
  project_created_successfully: "プロジェクトが正常に作成されました",
  project_created_successfully_description:
    "プロジェクトが正常に作成されました。作業項目を追加できるようになりました。",
  project_name_already_taken: "プロジェクト名は既に使用されています。",
  project_identifier_already_taken: "プロジェクト識別子は既に使用されています。",
  project_cover_image_alt: "プロジェクトのカバー画像",
  name_is_required: "名前は必須です",
  title_should_be_less_than_255_characters: "タイトルは255文字未満である必要があります",
  project_name: "プロジェクト名",
  project_id_must_be_at_least_1_character: "プロジェクトIDは最低1文字必要です",
  project_id_must_be_at_most_5_characters: "プロジェクトIDは最大5文字までです",
  project_id: "プロジェクトID",
  project_id_tooltip_content: "プロジェクト内の作業項目を一意に識別するのに役立ちます。最大10文字。",
  description_placeholder: "説明",
  only_alphanumeric_non_latin_characters_allowed: "英数字と非ラテン文字のみ使用できます。",
  project_id_is_required: "プロジェクトIDは必須です",
  project_id_allowed_char: "英数字と非ラテン文字のみ使用できます。",
  project_id_min_char: "プロジェクトIDは最低1文字必要です",
  project_id_max_char: "プロジェクトIDは最大10文字までです",
  project_description_placeholder: "プロジェクトの説明を入力",
  select_network: "ネットワークを選択",
  lead: "リード",
  date_range: "日付範囲",
  private: "プライベート",
  public: "パブリック",
  accessible_only_by_invite: "招待のみアクセス可能",
  anyone_in_the_workspace_except_guests_can_join: "ゲスト以外のワークスペースのメンバーが参加可能",
  creating: "作成中",
  creating_project: "プロジェクトを作成中",
  adding_project_to_favorites: "プロジェクトをお気に入りに追加中",
  project_added_to_favorites: "プロジェクトがお気に入りに追加されました",
  couldnt_add_the_project_to_favorites: "プロジェクトをお気に入りに追加できませんでした。もう一度お試しください。",
  removing_project_from_favorites: "プロジェクトをお気に入りから削除中",
  project_removed_from_favorites: "プロジェクトがお気に入りから削除されました",
  couldnt_remove_the_project_from_favorites:
    "プロジェクトをお気に入りから削除できませんでした。もう一度お試しください。",
  add_to_favorites: "お気に入りに追加",
  remove_from_favorites: "お気に入りから削除",
  publish_project: "プロジェクトを公開",
  publish: "公開",
  copy_link: "リンクをコピー",
  leave_project: "プロジェクトを退出",
  join_the_project_to_rearrange: "並び替えるにはプロジェクトに参加してください",
  drag_to_rearrange: "ドラッグして並び替え",
  congrats: "おめでとうございます！",
  open_project: "プロジェクトを開く",
  issues: "作業項目",
  cycles: "Cycles",
  modules: "Modules",
  pages: {
    link_pages: "ページを接続",
    show_wiki_pages: "Wikiページを表示",
    link_pages_to: "ページを接続",
    linked_pages: "リンクされたページ",
    no_description: "このページは空です。何かを書いて、ここにこのプレースホルダーとして表示してください。",
    toasts: {
      link: {
        success: {
          title: "ページが更新されました",
          message: "ページが正常に更新されました",
        },
        error: {
          title: "ページが更新されませんでした",
          message: "ページを更新できませんでした",
        },
      },
      remove: {
        success: {
          title: "ページが削除されました",
          message: "ページが正常に削除されました",
        },
        error: {
          title: "ページが削除されませんでした",
          message: "ページを削除できませんでした",
        },
      },
    },
  },
  intake: "Intake",
  renew: "更新",
  preview: "プレビュー",
  time_tracking: "時間トラッキング",
  work_management: "作業管理",
  projects_and_issues: "プロジェクトと作業項目",
  projects_and_issues_description: "このプロジェクトでオン/オフを切り替えます。",
  cycles_description:
    "プロジェクトごとに作業の時間枠を設定し、必要に応じて期間を調整します。1サイクルは2週間、次は1週間でもかまいません。",
  modules_description: "専任のリーダーと担当者を持つサブプロジェクトに作業を整理します。",
  views_description: "カスタムの並び替え、フィルター、表示オプションを保存するか、チームと共有します。",
  pages_description: "自由形式のコンテンツを作成・編集できます。メモ、ドキュメント、何でもOKです。",
  intake_description:
    "非メンバーがバグ、フィードバック、提案を共有できるようにし、ワークフローを妨げないようにします。",
  time_tracking_description: "作業項目やプロジェクトに費やした時間を記録します。",
  work_management_description: "作業とプロジェクトを簡単に管理します。",
  documentation: "ドキュメント",
  message_support: "サポートにメッセージ",
  contact_sales: "営業に問い合わせ",
  hyper_mode: "Hyper Mode",
  keyboard_shortcuts: "キーボードショートカット",
  whats_new: "新機能",
  version: "バージョン",
  we_are_having_trouble_fetching_the_updates: "更新情報の取得に問題が発生しています。",
  our_changelogs: "変更履歴",
  for_the_latest_updates: "最新の更新情報については",
  please_visit: "をご覧ください",
  docs: "ドキュメント",
  full_changelog: "完全な変更履歴",
  support: "サポート",
  forum: "Forum",
  powered_by_plane_pages: "Powered by Plane Pages",
  please_select_at_least_one_invitation: "少なくとも1つの招待を選択してください。",
  please_select_at_least_one_invitation_description:
    "ワークスペースに参加するには少なくとも1つの招待を選択してください。",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "誰かがあなたをワークスペースに招待しています",
  join_a_workspace: "ワークスペースに参加",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description: "誰かがあなたをワークスペースに招待しています",
  join_a_workspace_description: "ワークスペースに参加",
  accept_and_join: "承諾して参加",
  go_home: "ホームへ",
  no_pending_invites: "保留中の招待はありません",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "誰かがワークスペースに招待した場合、ここで確認できます",
  back_to_home: "ホームに戻る",
  workspace_name: "ワークスペース名",
  deactivate_your_account: "アカウントを無効化",
  deactivate_your_account_description:
    "無効化すると、作業項目を割り当てられなくなり、ワークスペースの請求対象外となります。アカウントを再有効化するには、このメールアドレスでワークスペースへの招待が必要です。",
  deactivating: "無効化中",
  confirm: "確認",
  confirming: "確認中",
  draft_created: "下書きが作成されました",
  issue_created_successfully: "作業項目が正常に作成されました",
  draft_creation_failed: "下書きの作成に失敗しました",
  issue_creation_failed: "作業項目の作成に失敗しました",
  draft_issue: "作業項目の下書き",
  issue_updated_successfully: "作業項目が正常に更新されました",
  issue_could_not_be_updated: "作業項目を更新できませんでした",
  create_a_draft: "下書きを作成",
  save_to_drafts: "下書きに保存",
  save: "保存",
  update: "更新",
  updating: "更新中",
  create_new_issue: "新規作業項目を作成",
  editor_is_not_ready_to_discard_changes: "エディターは変更を破棄する準備ができていません",
  failed_to_move_issue_to_project: "作業項目をプロジェクトに移動できませんでした",
  create_more: "さらに作成",
  add_to_project: "プロジェクトに追加",
  discard: "破棄",
  duplicate_issue_found: "重複する作業項目が見つかりました",
  duplicate_issues_found: "重複する作業項目が見つかりました",
  no_matching_results: "一致する結果がありません",
  title_is_required: "タイトルは必須です",
  title: "タイトル",
  state: "状態",
  priority: "優先度",
  none: "なし",
  urgent: "緊急",
  high: "高",
  medium: "中",
  low: "低",
  members: "メンバー",
  assignee: "担当者",
  assignees: "担当者",
  subscriber: "{count, plural, one{# 人の購読者} other{# 人の購読者}}",
  you: "あなた",
  labels: "ラベル",
  create_new_label: "新規ラベルを作成",
  label_name: "ラベル名",
  failed_to_create_label: "ラベルの作成に失敗しました。もう一度お試しください。",
  start_date: "開始日",
  end_date: "終了日",
  due_date: "期限",
  estimate: "見積もり",
  change_parent_issue: "親作業項目を変更",
  remove_parent_issue: "親作業項目を削除",
  add_parent: "親を追加",
  loading_members: "メンバーを読み込み中",
  view_link_copied_to_clipboard: "ビューリンクがクリップボードにコピーされました。",
  required: "必須",
  optional: "任意",
  Cancel: "キャンセル",
  edit: "編集",
  archive: "アーカイブ",
  restore: "復元",
  open_in_new_tab: "新しいタブで開く",
  delete: "削除",
  deleting: "削除中",
  make_a_copy: "コピーを作成",
  move_to_project: "プロジェクトに移動",
  good: "おはよう",
  morning: "ございます",
  afternoon: "こんにちは",
  evening: "こんばんは",
  show_all: "すべて表示",
  show_less: "表示を減らす",
  no_data_yet: "まだデータがありません",
  syncing: "同期中",
  add_work_item: "作業項目を追加",
  advanced_description_placeholder: "コマンドには '/' を押してください",
  create_work_item: "作業項目を作成",
  attachments: "添付ファイル",
  declining: "辞退中",
  declined: "辞退済み",
  decline: "辞退",
  unassigned: "未割り当て",
  work_items: "作業項目",
  add_link: "リンクを追加",
  points: "ポイント",
  no_assignee: "担当者なし",
  no_assignees_yet: "まだ担当者がいません",
  no_labels_yet: "まだラベルがありません",
  ideal: "理想",
  current: "現在",
  no_matching_members: "一致するメンバーがいません",
  leaving: "退出中",
  removing: "削除中",
  leave: "退出",
  refresh: "更新",
  refreshing: "更新中",
  refresh_status: "状態を更新",
  prev: "前へ",
  next: "次へ",
  re_generating: "再生成中",
  re_generate: "再生成",
  re_generate_key: "キーを再生成",
  export: "エクスポート",
  member: "{count, plural, other{# メンバー}}",
  new_password_must_be_different_from_old_password: "新しいパスワードは古いパスワードと異なる必要があります",
  edited: "編集済み",
  bot: "ボット",
  project_view: {
    sort_by: {
      created_at: "作成日時",
      updated_at: "更新日時",
      name: "名前",
    },
  },
  upgrade_request: "ワークスペース管理者にアップグレードを依頼してください。",
  copied_to_clipboard: "クリップボードにコピーしました",
  copied_to_clipboard_description: "URLがクリップボードに正常にコピーされました",
  toast: {
    success: "成功！",
    error: "エラー！",
  },
  links: {
    toasts: {
      created: {
        title: "リンクが作成されました",
        message: "リンクが正常に作成されました",
      },
      not_created: {
        title: "リンクが作成されませんでした",
        message: "リンクを作成できませんでした",
      },
      updated: {
        title: "リンクが更新されました",
        message: "リンクが正常に更新されました",
      },
      not_updated: {
        title: "リンクが更新されませんでした",
        message: "リンクを更新できませんでした",
      },
      removed: {
        title: "リンクが削除されました",
        message: "リンクが正常に削除されました",
      },
      not_removed: {
        title: "リンクが削除されませんでした",
        message: "リンクを削除できませんでした",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "クイックスタートガイド",
      not_right_now: "今はしない",
      create_project: {
        title: "プロジェクトを作成",
        description: "Planeのほとんどはプロジェクトから始まります。",
        cta: "始める",
      },
      invite_team: {
        title: "チームを招待",
        description: "同僚と一緒に構築、デプロイ、管理しましょう。",
        cta: "招待する",
      },
      configure_workspace: {
        title: "ワークスペースを設定する。",
        description: "機能のオン/オフを切り替えたり、さらに詳細な設定を行ったりできます。",
        cta: "このワークスペースを設定",
      },
      personalize_account: {
        title: "Planeをあなた好みにカスタマイズ。",
        description: "プロフィール画像、カラー、その他の設定を選択してください。",
        cta: "今すぐパーソナライズ",
      },
      widgets: {
        title: "ウィジェットがないと静かですね、オンにしましょう",
        description: `すべてのウィジェットがオフになっているようです。体験を向上させるために
今すぐ有効にしましょう！`,
        primary_button: {
          text: "ウィジェットを管理",
        },
      },
    },
    quick_links: {
      empty: "手元に置いておきたい作業関連のリンクを保存してください。",
      add: "クイックリンクを追加",
      title: "クイックリンク",
      title_plural: "クイックリンク",
    },
    recents: {
      title: "最近",
      empty: {
        project: "プロジェクトを訪問すると、最近のプロジェクトがここに表示されます。",
        page: "ページを訪問すると、最近のページがここに表示されます。",
        issue: "作業項目を訪問すると、最近の作業項目がここに表示されます。",
        default: "まだ最近の項目がありません。",
      },
      filters: {
        all: "すべて",
        projects: "プロジェクト",
        pages: "ページ",
        issues: "作業項目",
      },
    },
    new_at_plane: {
      title: "Planeの新機能",
    },
    quick_tutorial: {
      title: "クイックチュートリアル",
    },
    widget: {
      reordered_successfully: "ウィジェットの並び替えが完了しました。",
      reordering_failed: "ウィジェットの並び替え中にエラーが発生しました。",
    },
    manage_widgets: "ウィジェットを管理",
    title: "ホーム",
    star_us_on_github: "GitHubでスターをつける",
    business_trial_banner: {
      title: "14日間のBusinessプラントライアルが開始されました！",
      description:
        "すべてのBusiness機能をお試しください。準備ができたら、サブスクリプションをお選びください。自動的に請求されることはありません。",
      trial_ends_today: "トライアルは本日終了",
      trial_ends_in_days: "トライアル終了まであと{days}日",
      start_subscription: "サブスクリプションを開始",
      explore_business_features: "Business機能を探索",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URLが無効です",
        placeholder: "URLを入力または貼り付け",
      },
      title: {
        text: "表示タイトル",
        placeholder: "このリンクをどのように表示したいか",
      },
    },
  },
  common: {
    all: "すべて",
    no_items_in_this_group: "このグループにアイテムはありません",
    drop_here_to_move: "移動するにはここにドロップ",
    states: "ステータス",
    state: "ステータス",
    state_groups: "ステータスグループ",
    state_group: "ステート グループ",
    priorities: "優先度",
    priority: "優先度",
    team_project: "チームプロジェクト",
    project: "プロジェクト",
    cycle: "サイクル",
    cycles: "サイクル",
    module: "モジュール",
    modules: "モジュール",
    labels: "ラベル",
    label: "ラベル",
    assignees: "担当者",
    assignee: "担当者",
    created_by: "作成者",
    none: "なし",
    link: "リンク",
    estimates: "見積もり",
    estimate: "見積もり",
    created_at: "クリエイテッド アット",
    updated_at: "更新日時",
    completed_at: "コンプリーテッド アット",
    layout: "レイアウト",
    filters: "フィルター",
    display: "表示",
    load_more: "もっと読み込む",
    activity: "アクティビティ",
    analytics: "アナリティクス",
    dates: "日付",
    success: "成功！",
    something_went_wrong: "問題が発生しました",
    error: {
      label: "エラー！",
      message: "エラーが発生しました。もう一度お試しください。",
    },
    group_by: "グループ化",
    epic: "エピック",
    epics: "エピック",
    work_item: "作業項目",
    work_items: "作業項目",
    sub_work_item: "サブ作業項目",
    add: "追加",
    warning: "警告",
    updating: "更新中",
    adding: "追加中",
    update: "更新",
    creating: "作成中",
    create: "作成",
    cancel: "キャンセル",
    description: "説明",
    title: "タイトル",
    attachment: "添付ファイル",
    general: "一般",
    features: "機能",
    automation: "自動化",
    project_name: "プロジェクト名",
    project_id: "プロジェクトID",
    project_timezone: "プロジェクトのタイムゾーン",
    created_on: "作成日",
    update_project: "プロジェクトを更新",
    identifier_already_exists: "識別子は既に存在します",
    add_more: "さらに追加",
    defaults: "デフォルト",
    add_label: "ラベルを追加",
    customize_time_range: "期間をカスタマイズ",
    loading: "読み込み中",
    attachments: "添付ファイル",
    property: "プロパティ",
    properties: "プロパティ",
    parent: "親",
    page: "ページ",
    remove: "削除",
    archiving: "アーカイブ中",
    archive: "アーカイブ",
    access: {
      public: "公開",
      private: "非公開",
    },
    done: "完了",
    sub_work_items: "サブ作業項目",
    comment: "コメント",
    workspace_level: "ワークスペースレベル",
    order_by: {
      label: "並び順",
      manual: "手動",
      last_created: "最終作成日",
      last_updated: "最終更新日",
      start_date: "開始日",
      due_date: "期限日",
      asc: "昇順",
      desc: "降順",
      updated_on: "更新日",
    },
    sort: {
      asc: "昇順",
      desc: "降順",
      created_on: "作成日",
      updated_on: "更新日",
    },
    comments: "コメント",
    updates: "更新",
    additional_updates: "追加の更新",
    clear_all: "すべてクリア",
    copied: "コピーしました！",
    link_copied: "リンクをコピーしました！",
    link_copied_to_clipboard: "リンクをクリップボードにコピーしました",
    copied_to_clipboard: "作業項目のリンクをクリップボードにコピーしました",
    branch_name_copied_to_clipboard: "ブランチ名をクリップボードにコピーしました",
    is_copied_to_clipboard: "作業項目をクリップボードにコピーしました",
    no_links_added_yet: "リンクはまだ追加されていません",
    add_link: "リンクを追加",
    links: "リンク",
    go_to_workspace: "ワークスペースへ移動",
    progress: "進捗",
    optional: "任意",
    join: "参加",
    go_back: "戻る",
    continue: "続ける",
    resend: "再送信",
    relations: "関連",
    errors: {
      default: {
        title: "エラー！",
        message: "問題が発生しました。もう一度お試しください。",
      },
      required: "この項目は必須です",
      entity_required: "{entity}は必須です",
      restricted_entity: "{entity} は制限されています",
    },
    update_link: "リンクを更新",
    attach: "添付",
    create_new: "新規作成",
    add_existing: "既存を追加",
    type_or_paste_a_url: "URLを入力または貼り付け",
    url_is_invalid: "URLが無効です",
    display_title: "表示タイトル",
    link_title_placeholder: "このリンクをどのように表示したいか",
    url: "URL",
    side_peek: "サイドピーク",
    modal: "モーダル",
    full_screen: "全画面",
    close_peek_view: "ピークビューを閉じる",
    toggle_peek_view_layout: "ピークビューのレイアウトを切り替え",
    options: "オプション",
    duration: "期間",
    today: "今日",
    week: "週",
    month: "月",
    quarter: "四半期",
    press_for_commands: "コマンドは「/」を押してください",
    click_to_add_description: "クリックして説明を追加",
    search: {
      label: "検索",
      placeholder: "検索するキーワードを入力",
      no_matches_found: "一致する結果が見つかりません",
      no_matching_results: "一致する結果がありません",
    },
    actions: {
      edit: "編集",
      make_a_copy: "コピーを作成",
      open_in_new_tab: "新しいタブで開く",
      copy_link: "リンクをコピー",
      copy_branch_name: "ブランチ名をコピー",
      archive: "アーカイブ",
      delete: "削除",
      remove_relation: "関連を削除",
      subscribe: "購読",
      unsubscribe: "購読解除",
      clear_sorting: "並び替えをクリア",
      show_weekends: "週末を表示",
      enable: "有効化",
      disable: "無効化",
    },
    name: "名前",
    discard: "破棄",
    confirm: "確認",
    confirming: "確認中",
    read_the_docs: "ドキュメントを読む",
    default: "デフォルト",
    active: "アクティブ",
    enabled: "有効",
    disabled: "無効",
    mandate: "必須",
    mandatory: "必須",
    yes: "はい",
    no: "いいえ",
    please_wait: "お待ちください",
    enabling: "有効化中",
    disabling: "無効化中",
    beta: "ベータ",
    or: "または",
    next: "次へ",
    back: "戻る",
    cancelling: "キャンセル中",
    configuring: "設定中",
    clear: "クリア",
    import: "インポート",
    connect: "接続",
    authorizing: "認証中",
    processing: "処理中",
    no_data_available: "データがありません",
    from: "{name}から",
    authenticated: "認証済み",
    select: "選択",
    upgrade: "アップグレード",
    add_seats: "シートを追加",
    projects: "プロジェクト",
    workspace: "ワークスペース",
    workspaces: "ワークスペース",
    team: "チーム",
    teams: "チーム",
    entity: "エンティティ",
    entities: "エンティティ",
    task: "タスク",
    tasks: "タスク",
    section: "セクション",
    sections: "セクション",
    edit: "編集",
    connecting: "接続中",
    connected: "接続済み",
    disconnect: "切断",
    disconnecting: "切断中",
    installing: "インストール中",
    install: "インストール",
    reset: "リセット",
    live: "ライブ",
    change_history: "変更履歴",
    coming_soon: "近日公開",
    member: "メンバー",
    members: "メンバー",
    you: "あなた",
    upgrade_cta: {
      higher_subscription: "高いサブスクリプションにアップグレード",
      talk_to_sales: "トーク トゥ セールス",
    },
    category: "カテゴリー",
    categories: "カテゴリーズ",
    saving: "セービング",
    save_changes: "セーブ チェンジズ",
    delete: "デリート",
    deleting: "デリーティング",
    pending: "保留中",
    invite: "招待",
    view: "ビュー",
    deactivated_user: "無効化されたユーザー",
    apply: "適用",
    applying: "適用中",
    users: "ユーザー",
    admins: "管理者",
    guests: "ゲスト",
    on_track: "順調",
    off_track: "遅れ",
    at_risk: "リスクあり",
    timeline: "タイムライン",
    completion: "完了",
    upcoming: "今後の予定",
    completed: "完了",
    in_progress: "進行中",
    planned: "計画済み",
    paused: "一時停止",
    no_of: "{entity} の数",
    resolved: "解決済み",
    worklogs: "作業ログ",
    project_updates: "プロジェクトの更新",
    overview: "概要",
    workflows: "ワークフロー",
    members_and_teamspaces: "メンバーとチームスペース",
    open_in_full_screen: "{page}をフルスクリーンで開く",
  },
  chart: {
    x_axis: "エックス アクシス",
    y_axis: "ワイ アクシス",
    metric: "メトリック",
  },
  form: {
    title: {
      required: "タイトルは必須です",
      max_length: "タイトルは{length}文字未満である必要があります",
    },
  },
  entity: {
    grouping_title: "{entity}のグループ化",
    priority: "{entity}の優先度",
    all: "すべての{entity}",
    drop_here_to_move: "ここにドロップして{entity}を移動",
    delete: {
      label: "{entity}を削除",
      success: "{entity}を削除しました",
      failed: "{entity}の削除に失敗しました",
    },
    update: {
      failed: "{entity}の更新に失敗しました",
      success: "{entity}を更新しました",
    },
    link_copied_to_clipboard: "{entity}のリンクをクリップボードにコピーしました",
    fetch: {
      failed: "{entity}の取得中にエラーが発生しました",
    },
    add: {
      success: "{entity}を追加しました",
      failed: "{entity}の追加中にエラーが発生しました",
    },
    remove: {
      success: "{entity}を削除しました",
      failed: "{entity}の削除中にエラーが発生しました",
    },
  },
  epic: {
    all: "すべてのエピック",
    label: "{count, plural, one {エピック} other {エピック}}",
    new: "新規エピック",
    adding: "エピックを追加中",
    create: {
      success: "エピックを作成しました",
    },
    add: {
      press_enter: "Enterを押して別のエピックを追加",
      label: "エピックを追加",
    },
    title: {
      label: "エピックのタイトル",
      required: "エピックのタイトルは必須です。",
    },
    archive: {
      description: `完了またはキャンセルされたエピックのみ
アーカイブできます`,
      label: "エピックをアーカイブ",
      confirm_message: "エピックをアーカイブしてもよろしいですか？アーカイブしたエピックは後で復元できます。",
      success: {
        label: "アーカイブ成功",
        message: "アーカイブはプロジェクトのアーカイブで確認できます。",
      },
      failed: {
        message: "エピックをアーカイブできませんでした。もう一度お試しください。",
      },
    },
  },
  issue: {
    label: "{count, plural, one {作業項目} other {作業項目}}",
    all: "すべての作業項目",
    edit: "作業項目を編集",
    title: {
      label: "作業項目のタイトル",
      required: "作業項目のタイトルは必須です。",
    },
    add: {
      press_enter: "Enterを押して別の作業項目を追加",
      label: "作業項目を追加",
      cycle: {
        failed: "作業項目をサイクルに追加できませんでした。もう一度お試しください。",
        success: "{count, plural, one {作業項目} other {作業項目}}をサイクルに追加しました。",
        loading: "{count, plural, one {作業項目} other {作業項目}}をサイクルに追加中",
      },
      assignee: "担当者を追加",
      start_date: "開始日を追加",
      due_date: "期限日を追加",
      parent: "親作業項目を追加",
      sub_issue: "サブ作業項目を追加",
      relation: "関連を追加",
      link: "リンクを追加",
      existing: "既存の作業項目を追加",
    },
    remove: {
      label: "作業項目を削除",
      cycle: {
        loading: "サイクルから作業項目を削除中",
        success: "作業項目をサイクルから削除しました。",
        failed: "作業項目をサイクルから削除できませんでした。もう一度お試しください。",
      },
      module: {
        loading: "モジュールから作業項目を削除中",
        success: "作業項目をモジュールから削除しました。",
        failed: "作業項目をモジュールから削除できませんでした。もう一度お試しください。",
      },
      parent: {
        label: "親作業項目を削除",
      },
    },
    new: "新規作業項目",
    adding: "作業項目を追加中",
    create: {
      success: "作業項目を作成しました",
    },
    priority: {
      urgent: "緊急",
      high: "高",
      medium: "中",
      low: "低",
    },
    display: {
      properties: {
        label: "表示プロパティ",
        id: "ID",
        issue_type: "作業項目タイプ",
        sub_issue_count: "サブ作業項目数",
        attachment_count: "添付ファイル数",
        created_on: "作成日",
        sub_issue: "サブ作業項目",
        work_item_count: "作業項目数",
      },
      extra: {
        show_sub_issues: "サブ作業項目を表示",
        show_empty_groups: "空のグループを表示",
      },
    },
    layouts: {
      ordered_by_label: "このレイアウトは次の順序で並べ替えられています：",
      list: "リスト",
      kanban: "ボード",
      calendar: "カレンダー",
      spreadsheet: "テーブル",
      gantt: "タイムライン",
      title: {
        list: "リストレイアウト",
        kanban: "ボードレイアウト",
        calendar: "カレンダーレイアウト",
        spreadsheet: "テーブルレイアウト",
        gantt: "タイムラインレイアウト",
      },
    },
    states: {
      active: "アクティブ",
      backlog: "バックログ",
    },
    comments: {
      placeholder: "コメントを追加",
      switch: {
        private: "プライベートコメントに切り替え",
        public: "公開コメントに切り替え",
      },
      create: {
        success: "コメントを作成しました",
        error: "コメントの作成に失敗しました。後でもう一度お試しください。",
      },
      update: {
        success: "コメントを更新しました",
        error: "コメントの更新に失敗しました。後でもう一度お試しください。",
      },
      remove: {
        success: "コメントを削除しました",
        error: "コメントの削除に失敗しました。後でもう一度お試しください。",
      },
      upload: {
        error: "アセットのアップロードに失敗しました。後でもう一度お試しください。",
      },
      copy_link: {
        success: "コメントリンクがクリップボードにコピーされました",
        error: "コメントリンクのコピーに失敗しました。後でもう一度お試しください。",
      },
    },
    empty_state: {
      issue_detail: {
        title: "作業項目が存在しません",
        description: "お探しの作業項目は存在しないか、アーカイブされているか、削除されています。",
        primary_button: {
          text: "他の作業項目を表示",
        },
      },
    },
    sibling: {
      label: "兄弟作業項目",
    },
    archive: {
      description: `完了またはキャンセルされた
作業項目のみアーカイブできます`,
      label: "作業項目をアーカイブ",
      confirm_message: "作業項目をアーカイブしてもよろしいですか？アーカイブされた作業項目は後で復元できます。",
      success: {
        label: "アーカイブ成功",
        message: "アーカイブはプロジェクトのアーカイブで確認できます。",
      },
      failed: {
        message: "作業項目をアーカイブできませんでした。もう一度お試しください。",
      },
    },
    restore: {
      success: {
        title: "復元成功",
        message: "作業項目はプロジェクトの作業項目で確認できます。",
      },
      failed: {
        message: "作業項目を復元できませんでした。もう一度お試しください。",
      },
    },
    relation: {
      relates_to: "関連する",
      duplicate: "重複する",
      blocked_by: "ブロックされている",
      blocking: "ブロックしている",
      start_before: "開始前",
      start_after: "開始後",
      finish_before: "終了前",
      finish_after: "終了後",
      implements: "実装",
      implemented_by: "実装元",
    },
    copy_link: "作業項目のリンクをコピー",
    delete: {
      label: "作業項目を削除",
      error: "作業項目の削除中にエラーが発生しました",
    },
    subscription: {
      actions: {
        subscribed: "作業項目を購読しました",
        unsubscribed: "作業項目の購読を解除しました",
      },
    },
    select: {
      error: "少なくとも1つの作業項目を選択してください",
      empty: "作業項目が選択されていません",
      add_selected: "選択した作業項目を追加",
      select_all: "すべて選択",
      deselect_all: "すべての選択を解除",
    },
    open_in_full_screen: "作業項目をフルスクリーンで開く",
  },
  attachment: {
    error: "ファイルを添付できませんでした。もう一度アップロードしてください。",
    only_one_file_allowed: "一度にアップロードできるファイルは1つだけです。",
    file_size_limit: "ファイルサイズは{size}MB以下である必要があります。",
    drag_and_drop: "どこにでもドラッグ＆ドロップでアップロード",
    delete: "添付ファイルを削除",
  },
  label: {
    select: "ラベルを選択",
    create: {
      success: "ラベルを作成しました",
      failed: "ラベルの作成に失敗しました",
      already_exists: "ラベルは既に存在します",
      type: "新しいラベルを追加するには入力してください",
    },
  },
  sub_work_item: {
    update: {
      success: "サブ作業項目を更新しました",
      error: "サブ作業項目の更新中にエラーが発生しました",
    },
    remove: {
      success: "サブ作業項目を削除しました",
      error: "サブ作業項目の削除中にエラーが発生しました",
    },
    empty_state: {
      sub_list_filters: {
        title: "適用されたフィルターに一致するサブ作業項目がありません。",
        description: "すべてのサブ作業項目を表示するには、すべての適用されたフィルターをクリアしてください。",
        action: "フィルターをクリア",
      },
      list_filters: {
        title: "適用されたフィルターに一致する作業項目がありません。",
        description: "すべての作業項目を表示するには、すべての適用されたフィルターをクリアしてください。",
        action: "フィルターをクリア",
      },
    },
  },
  view: {
    label: "{count, plural, one {ビュー} other {ビュー}}",
    create: {
      label: "ビューを作成",
    },
    update: {
      label: "ビューを更新",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "保留中",
        description: "保留中",
      },
      declined: {
        title: "却下",
        description: "却下",
      },
      snoozed: {
        title: "スヌーズ",
        description: "残り{days, plural, one{# 日} other{# 日}}",
      },
      accepted: {
        title: "承認済み",
        description: "承認済み",
      },
      duplicate: {
        title: "重複",
        description: "重複",
      },
    },
    modals: {
      decline: {
        title: "作業項目を却下",
        content: "作業項目{value}を却下してもよろしいですか？",
      },
      delete: {
        title: "作業項目を削除",
        content: "作業項目{value}を削除してもよろしいですか？",
        success: "作業項目を削除しました",
      },
    },
    errors: {
      snooze_permission: "プロジェクト管理者のみが作業項目をスヌーズ/スヌーズ解除できます",
      accept_permission: "プロジェクト管理者のみが作業項目を承認できます",
      decline_permission: "プロジェクト管理者のみが作業項目を却下できます",
    },
    actions: {
      accept: "承認",
      decline: "却下",
      snooze: "スヌーズ",
      unsnooze: "スヌーズ解除",
      copy: "作業項目のリンクをコピー",
      delete: "削除",
      open: "作業項目を開く",
      mark_as_duplicate: "重複としてマーク",
      move: "{value}をプロジェクトの作業項目に移動",
    },
    source: {
      "in-app": "アプリ内",
    },
    order_by: {
      created_at: "作成日",
      updated_at: "更新日",
      id: "ID",
    },
    label: "インテーク",
    page_label: "{workspace} - インテーク",
    modal: {
      title: "インテーク作業項目を作成",
    },
    tabs: {
      open: "オープン",
      closed: "クローズ",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "オープンな作業項目がありません",
        description: "オープンな作業項目はここで見つかります。新しい作業項目を作成してください。",
      },
      sidebar_closed_tab: {
        title: "クローズされた作業項目がありません",
        description: "承認または却下されたすべての作業項目はここで見つかります。",
      },
      sidebar_filter: {
        title: "一致する作業項目がありません",
        description:
          "インテークに適用されたフィルターに一致する作業項目がありません。新しい作業項目を作成してください。",
      },
      detail: {
        title: "詳細を表示する作業項目を選択してください。",
      },
    },
  },
  workspace_creation: {
    heading: "ワークスペースを作成",
    subheading: "Planeを使用するには、ワークスペースを作成するか参加する必要があります。",
    form: {
      name: {
        label: "ワークスペース名を設定",
        placeholder: "馴染みがあり認識しやすい名前が最適です。",
      },
      url: {
        label: "ワークスペースのURLを設定",
        placeholder: "URLを入力または貼り付け",
        edit_slug: "URLのスラッグのみ編集可能です",
      },
      organization_size: {
        label: "このワークスペースを何人で使用しますか？",
        placeholder: "範囲を選択",
      },
    },
    errors: {
      creation_disabled: {
        title: "インスタンス管理者のみがワークスペースを作成できます",
        description:
          "インスタンス管理者のメールアドレスをご存知の場合は、下のボタンをクリックして連絡を取ってください。",
        request_button: "インスタンス管理者にリクエスト",
      },
      validation: {
        name_alphanumeric: "ワークスペース名には (' '), ('-'), ('_') と英数字のみ使用できます。",
        name_length: "名前は80文字以内にしてください。",
        url_alphanumeric: "URLには ('-') と英数字のみ使用できます。",
        url_length: "URLは48文字以内にしてください。",
        url_already_taken: "ワークスペースのURLは既に使用されています！",
      },
    },
    request_email: {
      subject: "新規ワークスペースのリクエスト",
      body: `インスタンス管理者様

[ワークスペース作成の目的]のために、URL [/workspace-name] の新規ワークスペースを作成していただけますでしょうか。

よろしくお願いいたします。
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "ワークスペースを作成",
      loading: "ワークスペースを作成中",
    },
    toast: {
      success: {
        title: "成功",
        message: "ワークスペースが正常に作成されました",
      },
      error: {
        title: "エラー",
        message: "ワークスペースを作成できませんでした。もう一度お試しください。",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "プロジェクト、アクティビティ、メトリクスの概要",
        description:
          "Planeへようこそ。ご利用いただき嬉しく思います。最初のプロジェクトを作成して作業項目を追跡すると、このページは進捗を把握するのに役立つスペースに変わります。管理者はチームの進捗に役立つ項目も表示されます。",
        primary_button: {
          text: "最初のプロジェクトを作成",
          comic: {
            title: "Planeではすべてがプロジェクトから始まります",
            description: "プロジェクトは製品のロードマップ、マーケティングキャンペーン、新車の発売などになります。",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "アナリティクス",
    page_label: "{workspace} - アナリティクス",
    open_tasks: "オープンタスクの合計",
    error: "データの取得中にエラーが発生しました。",
    work_items_closed_in: "クローズされた作業項目",
    selected_projects: "選択されたプロジェクト",
    total_members: "メンバー総数",
    total_cycles: "サイクル総数",
    total_modules: "モジュール総数",
    pending_work_items: {
      title: "保留中の作業項目",
      empty_state: "同僚による保留中の作業項目の分析がここに表示されます。",
    },
    work_items_closed_in_a_year: {
      title: "1年間でクローズされた作業項目",
      empty_state: "作業項目をクローズすると、グラフ形式で分析が表示されます。",
    },
    most_work_items_created: {
      title: "作成された作業項目が最も多い",
      empty_state: "同僚と作成した作業項目の数がここに表示されます。",
    },
    most_work_items_closed: {
      title: "クローズされた作業項目が最も多い",
      empty_state: "同僚とクローズした作業項目の数がここに表示されます。",
    },
    tabs: {
      scope_and_demand: "スコープと需要",
      custom: "カスタムアナリティクス",
    },
    empty_state: {
      customized_insights: {
        description: "あなたに割り当てられた作業項目は、ステータスごとに分類されてここに表示されます。",
        title: "まだデータがありません",
      },
      created_vs_resolved: {
        description: "時間の経過とともに作成および解決された作業項目がここに表示されます。",
        title: "まだデータがありません",
      },
      project_insights: {
        title: "まだデータがありません",
        description: "あなたに割り当てられた作業項目は、ステータスごとに分類されてここに表示されます。",
      },
      general: {
        title: "進捗、ワークロード、割り当てを追跡する。傾向を発見し、障害を除去し、作業をより迅速に進める",
        description:
          "範囲と需要、見積もり、スコープクリープを確認する。チームメンバーとチームのパフォーマンスを把握し、プロジェクトが時間通りに実行されることを確実にする。",
        primary_button: {
          text: "最初のプロジェクトを開始",
          comic: {
            title: "アナリティクスはサイクル + モジュールで最もよく機能します",
            description:
              "まず、作業項目をサイクルに時間枠を設定し、可能であれば、複数のサイクルにまたがる作業項目をモジュールにグループ化してください。左側のナビゲーションで両方をチェックしてください。",
          },
        },
      },
      cycle_progress: {
        title: "データがまだありません",
        description:
          "サイクルの進捗分析がここに表示されます。作業項目をサイクルに追加して進捗の追跡を開始してください。",
      },
      module_progress: {
        title: "データがまだありません",
        description:
          "モジュールの進捗分析がここに表示されます。作業項目をモジュールに追加して進捗の追跡を開始してください。",
      },
      intake_trends: {
        title: "データがまだありません",
        description:
          "インテークの傾向分析がここに表示されます。作業項目をインテークに追加して傾向の追跡を開始してください。",
      },
    },
    created_vs_resolved: "作成 vs 解決",
    customized_insights: "カスタマイズされたインサイト",
    backlog_work_items: "バックログの{entity}",
    active_projects: "アクティブなプロジェクト",
    trend_on_charts: "グラフの傾向",
    all_projects: "すべてのプロジェクト",
    summary_of_projects: "プロジェクトの概要",
    project_insights: "プロジェクトのインサイト",
    started_work_items: "開始された{entity}",
    total_work_items: "{entity}の合計",
    total_projects: "プロジェクト合計",
    total_admins: "管理者の合計",
    total_users: "ユーザー総数",
    total_intake: "総収入",
    un_started_work_items: "未開始の{entity}",
    total_guests: "ゲストの合計",
    completed_work_items: "完了した{entity}",
    total: "{entity}の合計",
    projects_by_status: "ステータス別のプロジェクト",
    active_users: "アクティブユーザー",
    intake_trends: "受け入れの傾向",
    workitem_resolved_vs_pending: "解決済み vs 保留中の作業項目",
    upgrade_to_plan: "{tab} をアンロックするには {plan} にアップグレードしてください",
  },
  workspace_projects: {
    label: "{count, plural, one {プロジェクト} other {プロジェクト}}",
    create: {
      label: "プロジェクトを追加",
    },
    network: {
      private: {
        title: "非公開",
        description: "招待された人のみアクセス可能",
      },
      public: {
        title: "公開",
        description: "ゲスト以外のワークスペースの全員が参加可能",
      },
    },
    error: {
      permission: "この操作を実行する権限がありません。",
      cycle_delete: "サイクルの削除に失敗しました",
      module_delete: "モジュールの削除に失敗しました",
      issue_delete: "作業項目の削除に失敗しました",
    },
    state: {
      backlog: "バックログ",
      unstarted: "未開始",
      started: "開始済み",
      completed: "完了",
      cancelled: "キャンセル",
    },
    sort: {
      manual: "手動",
      name: "名前",
      created_at: "作成日",
      members_length: "メンバー数",
    },
    scope: {
      my_projects: "自分のプロジェクト",
      archived_projects: "アーカイブ済み",
    },
    common: {
      months_count: "{months, plural, one{# ヶ月} other{# ヶ月}}",
    },
    empty_state: {
      general: {
        title: "アクティブなプロジェクトがありません",
        description:
          "各プロジェクトは目標指向の作業の親として考えてください。プロジェクトには作業、サイクル、モジュールが含まれ、同僚と共にその目標の達成を支援します。新しいプロジェクトを作成するか、アーカイブされたプロジェクトをフィルタリングしてください。",
        primary_button: {
          text: "最初のプロジェクトを開始",
          comic: {
            title: "Planeではすべてがプロジェクトから始まります",
            description: "プロジェクトは製品のロードマップ、マーケティングキャンペーン、新車の発売などになります。",
          },
        },
      },
      no_projects: {
        title: "プロジェクトがありません",
        description:
          "作業項目を作成したり作業を管理したりするには、プロジェクトを作成するか、プロジェクトのメンバーになる必要があります。",
        primary_button: {
          text: "最初のプロジェクトを開始",
          comic: {
            title: "Planeではすべてがプロジェクトから始まります",
            description: "プロジェクトは製品のロードマップ、マーケティングキャンペーン、新車の発売などになります。",
          },
        },
      },
      filter: {
        title: "一致するプロジェクトがありません",
        description: `条件に一致するプロジェクトが見つかりません。
代わりに新しいプロジェクトを作成してください。`,
      },
      search: {
        description: `条件に一致するプロジェクトが見つかりません。
代わりに新しいプロジェクトを作成してください。`,
      },
    },
  },
  workspace_views: {
    add_view: "ビューを追加",
    empty_state: {
      "all-issues": {
        title: "プロジェクトに作業項目がありません",
        description: "最初のプロジェクトが完了しました！次は、作業を追跡可能な作業項目に分割しましょう。始めましょう！",
        primary_button: {
          text: "新しい作業項目を作成",
        },
      },
      assigned: {
        title: "作業項目がまだありません",
        description: "あなたに割り当てられた作業項目をここで追跡できます。",
        primary_button: {
          text: "新しい作業項目を作成",
        },
      },
      created: {
        title: "作業項目がまだありません",
        description: "あなたが作成したすべての作業項目がここに表示され、直接追跡できます。",
        primary_button: {
          text: "新しい作業項目を作成",
        },
      },
      subscribed: {
        title: "作業項目がまだありません",
        description: "興味のある作業項目を購読して、ここですべてを追跡できます。",
      },
      "custom-view": {
        title: "作業項目がまだありません",
        description: "フィルターに該当する作業項目をここで追跡できます。",
      },
    },
    delete_view: {
      title: "このビューを削除してもよろしいですか？",
      content:
        "確認すると、このビューに選択したすべてのソート、フィルター、表示オプション + レイアウトが復元不可能な形で完全に削除されます。",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "メールアドレスを変更",
        description: "確認リンクを受け取るには、新しいメールアドレスを入力してください。",
        toasts: {
          success_title: "成功",
          success_message: "メールアドレスを更新しました。再度サインインしてください。",
        },
        form: {
          email: {
            label: "新しいメールアドレス",
            placeholder: "メールアドレスを入力",
            errors: {
              required: "メールアドレスは必須です",
              invalid: "メールアドレスが無効です",
              exists: "メールアドレスは既に存在します。別のものを使用してください。",
              validation_failed: "メールアドレスの確認に失敗しました。もう一度お試しください。",
            },
          },
          code: {
            label: "認証コード",
            placeholder: "123456",
            helper_text: "認証コードを新しいメールに送信しました。",
            errors: {
              required: "認証コードは必須です",
              invalid: "認証コードが無効です。もう一度お試しください。",
            },
          },
        },
        actions: {
          continue: "続行",
          confirm: "確認",
          cancel: "キャンセル",
        },
        states: {
          sending: "送信中…",
        },
      },
    },
    notifications: {
      select_default_view: "デフォルト表示を選択",
      compact: "コンパクト",
      full: "全画面",
    },
  },
  workspace_settings: {
    label: "ワークスペース設定",
    page_label: "{workspace} - 一般設定",
    key_created: "キーが作成されました",
    copy_key:
      "このシークレットキーをコピーしてPlaneページに保存してください。閉じた後はこのキーを見ることができません。キーを含むCSVファイルがダウンロードされました。",
    token_copied: "トークンがクリップボードにコピーされました。",
    settings: {
      general: {
        title: "一般",
        upload_logo: "ロゴをアップロード",
        edit_logo: "ロゴを編集",
        name: "ワークスペース名",
        company_size: "会社の規模",
        url: "ワークスペースURL",
        workspace_timezone: "ワークスペースのタイムゾーン",
        update_workspace: "ワークスペースを更新",
        delete_workspace: "このワークスペースを削除",
        delete_workspace_description:
          "ワークスペースを削除すると、そのワークスペース内のすべてのデータとリソースが完全に削除され、復元することはできません。",
        delete_btn: "このワークスペースを削除",
        delete_modal: {
          title: "このワークスペースを削除してもよろしいですか？",
          description: "有料プランの無料トライアルが有効です。続行するには、まずトライアルをキャンセルしてください。",
          dismiss: "閉じる",
          cancel: "トライアルをキャンセル",
          success_title: "ワークスペースが削除されました。",
          success_message: "まもなくプロフィールページに移動します。",
          error_title: "操作に失敗しました。",
          error_message: "もう一度お試しください。",
        },
        errors: {
          name: {
            required: "名前は必須です",
            max_length: "ワークスペース名は80文字を超えることはできません",
          },
          company_size: {
            required: "会社の規模は必須です",
            select_a_range: "組織の規模を選択",
          },
        },
      },
      members: {
        title: "メンバー",
        add_member: "メンバーを追加",
        pending_invites: "保留中の招待",
        invitations_sent_successfully: "招待が正常に送信されました",
        leave_confirmation:
          "ワークスペースから退出してもよろしいですか？このワークスペースにアクセスできなくなります。この操作は取り消せません。",
        details: {
          full_name: "フルネーム",
          display_name: "表示名",
          email_address: "メールアドレス",
          account_type: "アカウントタイプ",
          authentication: "認証",
          joining_date: "参加日",
        },
        modal: {
          title: "共同作業者を招待",
          description: "ワークスペースに共同作業者を招待します。",
          button: "招待を送信",
          button_loading: "招待を送信中",
          placeholder: "name@company.com",
          errors: {
            required: "招待するにはメールアドレスが必要です。",
            invalid: "メールアドレスが無効です",
          },
        },
      },
      billing_and_plans: {
        title: "請求とプラン",
        current_plan: "現在のプラン",
        free_plan: "現在フリープランを使用中です",
        view_plans: "プランを表示",
      },
      exports: {
        title: "エクスポート",
        exporting: "エクスポート中",
        previous_exports: "過去のエクスポート",
        export_separate_files: "データを個別のファイルにエクスポート",
        filters_info: "フィルターを適用して、条件に基づいて特定の作業項目をエクスポートします。",
        modal: {
          title: "エクスポート先",
          toasts: {
            success: {
              title: "エクスポート成功",
              message: "エクスポートした{entity}は過去のエクスポートからダウンロードできます。",
            },
            error: {
              title: "エクスポート失敗",
              message: "エクスポートに失敗しました。もう一度お試しください。",
            },
          },
        },
      },
      webhooks: {
        title: "Webhook",
        add_webhook: "Webhookを追加",
        modal: {
          title: "Webhookを作成",
          details: "Webhook詳細",
          payload: "ペイロードURL",
          question: "このWebhookをトリガーするイベントを選択してください",
          error: "URLは必須です",
        },
        secret_key: {
          title: "シークレットキー",
          message: "Webhookペイロードにサインインするためのトークンを生成",
        },
        options: {
          all: "すべてを送信",
          individual: "個別のイベントを選択",
        },
        toasts: {
          created: {
            title: "Webhook作成完了",
            message: "Webhookが正常に作成されました",
          },
          not_created: {
            title: "Webhook作成失敗",
            message: "Webhookを作成できませんでした",
          },
          updated: {
            title: "Webhook更新完了",
            message: "Webhookが正常に更新されました",
          },
          not_updated: {
            title: "Webhook更新失敗",
            message: "Webhookを更新できませんでした",
          },
          removed: {
            title: "Webhook削除完了",
            message: "Webhookが正常に削除されました",
          },
          not_removed: {
            title: "Webhook削除失敗",
            message: "Webhookを削除できませんでした",
          },
          secret_key_copied: {
            message: "シークレットキーがクリップボードにコピーされました。",
          },
          secret_key_not_copied: {
            message: "シークレットキーのコピー中にエラーが発生しました。",
          },
        },
      },
      api_tokens: {
        heading: "APIトークン",
        description: "セキュアなAPIトークンを生成して、データを外部システムやアプリケーションと統合します。",
        title: "APIトークン",
        add_token: "アクセストークンを追加",
        create_token: "トークンを作成",
        never_expires: "無期限",
        generate_token: "トークンを生成",
        generating: "生成中",
        delete: {
          title: "APIトークンを削除",
          description:
            "このトークンを使用しているアプリケーションはPlaneのデータにアクセスできなくなります。この操作は取り消せません。",
          success: {
            title: "成功！",
            message: "APIトークンが正常に削除されました",
          },
          error: {
            title: "エラー！",
            message: "APIトークンを削除できませんでした",
          },
        },
      },
      integrations: {
        title: "インテグレーション",
        page_title: "Plane のデータを利用可能なアプリや自分のアプリで利用できます。",
        page_description: "このワークスペースまたはあなたが使用しているすべての連携を表示します。",
      },
      imports: {
        title: "インポート",
      },
      worklogs: {
        title: "作業ログ",
      },
      group_syncing: {
        title: "グループ同期",
        heading: "グループ同期",
        description:
          "IDプロバイダーのグループをプロジェクトとロールにリンクします。IdPのグループメンバーシップが変更されるとユーザーアクセスが自動的に更新され、オンボーディングとオフボーディングが簡素化されます。",
        enable: {
          title: "グループ同期を有効にする",
          description: "IDプロバイダーのグループに基づいて、ユーザーをプロジェクトに自動的に追加します。",
        },
        config: {
          title: "グループ同期の設定",
          description: "IDプロバイダーのグループがプロジェクトとロールにどのようにマッピングされるかを設定します。",
          sync_on_login: {
            title: "ログイン時同期",
            description: "ユーザーがログインしたときにグループメンバーシップとプロジェクトアクセスを更新します。",
          },
          sync_offline: {
            title: "オフライン同期",
            description: "ユーザーのログインを待たずに、6時間ごとに自動的に同期を実行します。",
          },
          auto_remove: {
            title: "自動削除",
            description: "グループに一致しなくなったユーザーをプロジェクトから自動的に削除します。",
          },
          group_attribute_key: {
            title: "グループ属性キー",
            description: "ユーザーグループの識別と同期に使用するIDプロバイダーの属性。",
            placeholder: "グループ",
          },
        },
        group_mapping: {
          title: "グループマッピング",
          description: "IDプロバイダーのグループをプロジェクトとロールにリンクします。",
          button_text: "新しいグループ同期を追加",
        },
        toast: {
          updating: "グループ同期機能を更新中",
          success: "グループ同期機能が正常に更新されました。",
          error: "グループ同期機能の更新に失敗しました！",
        },
        delete_modal: {
          title: "グループ同期を削除",
          content:
            "このIDグループの新規ユーザーはプロジェクトに追加されなくなります。既に追加されたユーザーは現在のロールを維持します。",
        },
        modal: {
          idp_group_name: {
            text: "ユーザーグループ",
            required: "ユーザーグループは必須です",
            placeholder: "IdPグループ名を入力",
          },
          project: {
            text: "プロジェクト",
            required: "プロジェクトは必須です",
            placeholder: "プロジェクトを選択",
          },
          default_role: {
            text: "プロジェクトロール",
            required: "プロジェクトロールは必須です",
            placeholder: "プロジェクトロールを選択",
          },
        },
      },
      identity: {
        title: "アイデンティティ",
        heading: "アイデンティティ",
        description: "ドメインを設定し、シングルサインオンを有効にします",
      },
      project_states: {
        title: "プロジェクトの状態",
      },
      projects: {
        title: "プロジェクト",
        description: "プロジェクトの状態管理、プロジェクトラベルの有効化、その他の設定を行います。",
        tabs: {
          states: "プロジェクトの状態",
          labels: "プロジェクトラベル",
        },
      },
      teamspaces: {
        title: "チームスペース",
      },
      initiatives: {
        title: "イニシアチブ",
      },
      customers: {
        title: "顧客",
      },
      releases: {
        title: "リリース",
        update_release: "リリースを更新",
        create_release: "リリースを作成",
        errors: {
          release_not_found: "お探しのリリースは存在しません。",
          unknown: "問題が発生しました。もう一度お試しください。",
        },
      },

      cancel_trial: {
        title: "まずトライアルをキャンセルしてください。",
        description: "有料プランのトライアルが有効です。続行するには、まずキャンセルしてください。",
        dismiss: "閉じる",
        cancel: "トライアルをキャンセル",
        cancel_success_title: "トライアルがキャンセルされました。",
        cancel_success_message: "ワークスペースを削除できるようになりました。",
        cancel_error_title: "エラーが発生しました。",
        cancel_error_message: "もう一度お試しください。",
      },
      applications: {
        title: "アプリケーション",
        applicationId_copied: "アプリケーションIDをクリップボードにコピーしました",
        clientId_copied: "クライアントIDをクリップボードにコピーしました",
        clientSecret_copied: "クライアントシークレットをクリップボードにコピーしました",
        third_party_apps: "サードパーティアプリ",
        your_apps: "あなたのアプリ",
        connect: "接続",
        connected: "接続済み",
        install: "インストール",
        installed: "インストール済み",
        configure: "設定",
        app_available: "このアプリをPlaneワークスペースで使用できるようにしました",
        app_available_description: "使用を開始するにはPlaneワークスペースに接続してください",
        client_id_and_secret: "クライアントIDとシークレット",
        client_id_and_secret_description:
          "このシークレットキーをコピーして保存してください。閉じた後はこのキーを見ることができません。",
        client_id_and_secret_download: "ここからキーをCSVでダウンロードできます。",
        application_id: "アプリケーションID",
        client_id: "クライアントID",
        client_secret: "クライアントシークレット",
        export_as_csv: "CSVとしてエクスポート",
        slug_already_exists: "スラッグは既に存在します",
        failed_to_create_application: "アプリケーションの作成に失敗しました",
        upload_logo: "ロゴをアップロード",
        app_name_title: "このアプリの名前を入力してください",
        app_name_error: "アプリ名は必須です",
        app_short_description_title: "このアプリの短い説明を入力してください",
        app_short_description_error: "アプリの短い説明は必須です",
        app_description_title: {
          label: "詳細な説明",
          placeholder:
            "マーケットプレイス用の詳細な説明を書いてください。コマンドを表示するには '/' を押してください。",
        },
        authorization_grant_type: {
          title: "接続タイプ",
          description:
            "アプリをワークスペースに一度インストールするか、各ユーザーが自分のアカウントを接続できるようにするかを選択してください",
        },
        app_description_error: "アプリの説明は必須です",
        app_slug_title: "アプリのスラッグ",
        app_slug_error: "アプリのスラッグは必須です",
        app_maker_title: "アプリ作成者",
        app_maker_error: "アプリ作成者は必須です",
        webhook_url_title: "WebhookのURL",
        webhook_url_error: "WebhookのURLは必須です",
        invalid_webhook_url_error: "無効なWebhookのURL",
        redirect_uris_title: "リダイレクトURI",
        redirect_uris_error: "リダイレクトURIは必須です",
        invalid_redirect_uris_error: "無効なリダイレクトURI",
        redirect_uris_description:
          "アプリがユーザーをリダイレクトする先のURIをスペース区切りで入力してください（例：https://example.com https://example.com/）",
        authorized_javascript_origins_title: "許可されたJavaScriptオリジン",
        authorized_javascript_origins_error: "許可されたJavaScriptオリジンは必須です",
        invalid_authorized_javascript_origins_error: "無効な許可されたJavaScriptオリジン",
        authorized_javascript_origins_description:
          "アプリがリクエストを行うことができるオリジンをスペース区切りで入力してください（例：app.com example.com）",
        create_app: "アプリを作成",
        update_app: "アプリを更新",
        build_your_own_app: "独自のアプリを構築",
        edit_app_details: "アプリの詳細を編集",
        regenerate_client_secret_description:
          "クライアントシークレットを再生成します。再生成後、キーをコピーするかCSVファイルとしてダウンロードできます。",
        regenerate_client_secret: "クライアントシークレットを再生成",
        regenerate_client_secret_confirm_title: "クライアントシークレットを再生成してもよろしいですか？",
        regenerate_client_secret_confirm_description:
          "このシークレットを使用しているアプリは動作しなくなります。アプリでシークレットを更新する必要があります。",
        regenerate_client_secret_confirm_cancel: "キャンセル",
        regenerate_client_secret_confirm_regenerate: "再生成",
        read_only_access_to_workspace: "ワークスペースへの読み取り専用アクセス",
        write_access_to_workspace: "ワークスペースへの書き込みアクセス",
        read_only_access_to_user_profile: "ユーザープロフィールへの読み取り専用アクセス",
        write_access_to_user_profile: "ユーザープロフィールへの書き込みアクセス",
        connect_app_to_workspace: "{app}を{workspace}ワークスペースに接続",
        user_permissions: "ユーザー権限",
        user_permissions_description: "ユーザー権限は、ユーザープロフィールへのアクセスを許可するために使用されます。",
        workspace_permissions: "ワークスペース権限",
        workspace_permissions_description:
          "ワークスペース権限は、ワークスペースへのアクセスを許可するために使用されます。",
        with_the_permissions: "権限付きで",
        app_consent_title: "{app}があなたのPlaneワークスペースとプロフィールへのアクセスを要求しています。",
        choose_workspace_to_connect_app_with: "アプリを接続するワークスペースを選択してください",
        app_consent_workspace_permissions_title: "{app}は以下を要求しています",
        app_consent_user_permissions_title:
          "{app}は以下のリソースに対するユーザーの許可も要求できます。これらの権限はユーザーによってのみ要求され、承認されます。",
        app_consent_accept_title: "承認することで",
        app_consent_accept_1: "アプリにPlane内外でアプリを使用できる場所であなたのPlaneデータへのアクセスを許可します",
        app_consent_accept_2: "{app}のプライバシーポリシーと利用規約に同意します",
        accepting: "承認中...",
        accept: "承認",
        categories: "カテゴリー",
        select_app_categories: "アプリのカテゴリーを選択",
        categories_title: "カテゴリー",
        categories_error: "カテゴリーは必須です",
        invalid_categories_error: "無効なカテゴリー",
        categories_description: "アプリを最もよく説明するカテゴリーを選択してください",
        supported_plans: "サポートされているプラン",
        supported_plans_description:
          "このアプリケーションをインストールできるワークスペースプランを選択してください。空のままにすると、すべてのプランが許可されます。",
        select_plans: "プランを選択",
        privacy_policy_url_title: "プライバシーポリシーURL",
        privacy_policy_url_error: "プライバシーポリシーURLは必須です",
        invalid_privacy_policy_url_error: "無効なプライバシーポリシーURL",
        terms_of_service_url_title: "利用規約URL",
        terms_of_service_url_error: "利用規約URLは必須です",
        invalid_terms_of_service_url_error: "無効な利用規約URL",
        support_url_title: "サポートURL",
        support_url_error: "サポートURLは必須です",
        invalid_support_url_error: "無効なサポートURL",
        video_url_title: "ビデオURL",
        video_url_error: "ビデオURLは必須です",
        invalid_video_url_error: "無効なビデオURL",
        setup_url_title: "セットアップURL",
        setup_url_error: "セットアップURLは必須です",
        invalid_setup_url_error: "無効なセットアップURL",
        configuration_url_title: "設定URL",
        configuration_url_error: "設定URLは必須です",
        invalid_configuration_url_error: "無効な設定URL",
        contact_email_title: "連絡先メール",
        contact_email_error: "連絡先メールは必須です",
        invalid_contact_email_error: "無効な連絡先メール",
        upload_attachments: "添付ファイルをアップロード",
        uploading_images: "アップロード中 {count} 画像{count, plural, one {s} other {s}}",
        drop_images_here: "画像をここにドラッグ&ドロップ",
        click_to_upload_images: "画像をクリックしてアップロード",
        invalid_file_or_exceeds_size_limit: "無効なファイルまたはサイズの制限を超えています ({size} MB)",
        uploading: "アップロード中...",
        upload_and_save: "アップロードして保存",
        app_credentials_regenrated: {
          title: "アプリの認証情報が正常に再生成されました",
          description:
            "クライアントシークレットを使用しているすべての場所で置き換えてください。以前のシークレットは無効になっています。",
        },
        app_created: {
          title: "アプリが正常に作成されました",
          description: "認証情報を使用して、Plane ワークスペースにアプリをインストールしてください",
        },
        installed_apps: "インストール済みアプリ",
        all_apps: "すべてのアプリ",
        internal_apps: "内部アプリ",
        website: {
          title: "ウェブサイト",
          description: "アプリのウェブサイトへのリンク。",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "アプリ作成者",
          description: "アプリを作成している人物または組織。",
        },
        setup_url: {
          label: "セットアップURL",
          description: "ユーザーはアプリをインストールすると、このURLにリダイレクトされます。",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "Webhook URL",
          description:
            "これは、アプリがインストールされているワークスペースからのWebhookイベントや更新を送信する場所です。",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "リダイレクトURI（スペース区切り）",
          description: "ユーザーは Plane で認証した後、このパスにリダイレクトされます。",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "このアプリは、ワークスペースの管理者がインストールした後にのみインストールできます。続行するには、ワークスペースの管理者に連絡してください。",
        enable_app_mentions: "アプリのメンションを有効にする",
        enable_app_mentions_tooltip:
          "これを有効にすると、ユーザーは作業項目をこのアプリにメンションしたり割り当てたりできます。",
        scopes: "スコープ",
        select_scopes: "スコープを選択",
        read_access_to: "読み取り専用アクセス先",
        write_access_to: "書き込みアクセス先",
        global_permission_expiration:
          "グローバルスコープはまもなく期限切れになります。代わりに細かいスコープを使用してください。例：グローバル読み取りの代わりに project:read を使用します。",
        selected_scopes: "{count} 件選択中",
        scopes_and_permissions: "スコープと権限",
        read: "読み取り",
        write: "書き込み",
        scope_description: {
          projects: "プロジェクトおよびプロジェクト関連エンティティへのアクセス",
          wiki: "WikiおよびWiki関連エンティティへのアクセス",
          customers: "顧客および顧客関連エンティティへのアクセス",
          initiatives: "イニシアチブおよびイニシアチブ関連エンティティへのアクセス",
          workspaces: "ワークスペースおよびワークスペース関連エンティティへのアクセス",
          stickies: "付箋および付箋関連エンティティへのアクセス",
          teamspaces: "チームスペースおよびチームスペース関連エンティティへのアクセス",
          profile: "ユーザープロフィール情報へのアクセス",
          agents: "エージェントおよびすべてのエージェント関連エンティティへのアクセス",
          assets: "アセットおよびすべてのアセット関連エンティティへのアクセス",
        },
        internal: "内部",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description: "あなたの作業がより知能的で速くなるように、ネイティブに接続されたAIを使用してください。",
      },
    },
    empty_state: {
      api_tokens: {
        title: "APIトークンがまだ作成されていません",
        description:
          "PlaneのAPIを使用して、Planeのデータを外部システムと統合できます。トークンを作成して始めましょう。",
      },
      webhooks: {
        title: "Webhookが追加されていません",
        description: "Webhookを作成してリアルタイムの更新を受け取り、アクションを自動化します。",
      },
      exports: {
        title: "エクスポートがまだありません",
        description: "エクスポートすると、参照用のコピーがここに保存されます。",
      },
      imports: {
        title: "インポートがまだありません",
        description: "過去のインポートをここで確認し、ダウンロードできます。",
      },
    },
  },
  profile: {
    label: "プロフィール",
    page_label: "あなたの作業",
    work: "作業",
    details: {
      joined_on: "参加日",
      time_zone: "タイムゾーン",
    },
    stats: {
      workload: "作業負荷",
      overview: "概要",
      created: "作成した作業項目",
      assigned: "割り当てられた作業項目",
      subscribed: "購読中の作業項目",
      state_distribution: {
        title: "状態別作業項目",
        empty: "より良い分析のために、作業項目を作成してグラフで状態別に表示します。",
      },
      priority_distribution: {
        title: "優先度別作業項目",
        empty: "より良い分析のために、作業項目を作成してグラフで優先度別に表示します。",
      },
      recent_activity: {
        title: "最近のアクティビティ",
        empty: "データが見つかりませんでした。入力内容を確認してください",
        button: "今日のアクティビティをダウンロード",
        button_loading: "ダウンロード中",
      },
    },
    actions: {
      profile: "プロフィール",
      security: "セキュリティ",
      activity: "アクティビティ",
      appearance: "外観",
      notifications: "通知",
      connections: "接続",
    },
    tabs: {
      summary: "サマリー",
      assigned: "割り当て済み",
      created: "作成済み",
      subscribed: "購読中",
      activity: "アクティビティ",
    },
    empty_state: {
      activity: {
        title: "アクティビティがまだありません",
        description:
          "新しい作業項目を作成して始めましょう！詳細とプロパティを追加してください。Planeをさらに探索してアクティビティを確認しましょう。",
      },
      assigned: {
        title: "割り当てられた作業項目がありません",
        description: "あなたに割り当てられた作業項目をここで追跡できます。",
      },
      created: {
        title: "作業項目がまだありません",
        description: "あなたが作成したすべての作業項目がここに表示され、直接追跡できます。",
      },
      subscribed: {
        title: "作業項目がまだありません",
        description: "興味のある作業項目を購読して、ここですべてを追跡できます。",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "プロジェクトIDを入力",
      please_select_a_timezone: "タイムゾーンを選択してください",
      archive_project: {
        title: "プロジェクトをアーカイブ",
        description:
          "プロジェクトをアーカイブすると、サイドナビゲーションから非表示になりますが、プロジェクトページからアクセスすることはできます。プロジェクトを復元または削除することもできます。",
        button: "プロジェクトをアーカイブ",
      },
      delete_project: {
        title: "プロジェクトを削除",
        description:
          "プロジェクトを削除すると、そのプロジェクト内のすべてのデータとリソースが永久に削除され、復元できなくなります。",
        button: "プロジェクトを削除",
      },
      toast: {
        success: "プロジェクトが正常に更新されました",
        error: "プロジェクトを更新できませんでした。もう一度お試しください。",
      },
    },
    members: {
      label: "メンバー",
      project_lead: "プロジェクトリーダー",
      default_assignee: "デフォルトの担当者",
      guest_super_permissions: {
        title: "ゲストユーザーにすべての作業項目の閲覧権限を付与:",
        sub_heading: "これにより、ゲストはプロジェクトのすべての作業項目を閲覧できるようになります。",
      },
      invite_members: {
        title: "メンバーを招待",
        sub_heading: "プロジェクトに参加するメンバーを招待します。",
        select_co_worker: "共同作業者を選択",
      },
      project_lead_description: "プロジェクトのプロジェクトリーダーを選択してください。",
      default_assignee_description: "プロジェクトのデフォルトの担当者を選択してください。",
      project_subscribers: "プロジェクトの購読者",
      project_subscribers_description: "このプロジェクトの通知を受け取るメンバーを選択してください。",
    },
    states: {
      describe_this_state_for_your_members: "このステータスについてメンバーに説明してください。",
      empty_state: {
        title: "{groupKey}グループのステータスがありません",
        description: "新しいステータスを作成してください",
      },
    },
    labels: {
      label_title: "ラベルタイトル",
      label_title_is_required: "ラベルタイトルは必須です",
      label_max_char: "ラベル名は255文字を超えることはできません",
      toast: {
        error: "ラベルの更新中にエラーが発生しました",
      },
    },
    estimates: {
      label: "見積もり",
      title: "プロジェクトの見積もりを有効にする",
      description: "チームの複雑さと作業負荷を伝えるのに役立ちます。",
      no_estimate: "見積もりなし",
      new: "新しい見積もりシステム",
      create: {
        custom: "カスタム",
        start_from_scratch: "最初から開始",
        choose_template: "テンプレートを選択",
        choose_estimate_system: "見積もりシステムを選択",
        enter_estimate_point: "見積もりを入力",
        step: "ステップ {step} の {total}",
        label: "見積もりを作成",
      },
      toasts: {
        created: {
          success: {
            title: "見積もりを作成",
            message: "見積もりが正常に作成されました",
          },
          error: {
            title: "見積もり作成に失敗",
            message: "新しい見積もりを作成できませんでした。もう一度お試しください。",
          },
        },
        updated: {
          success: {
            title: "見積もりを更新",
            message: "プロジェクトの見積もりが更新されました。",
          },
          error: {
            title: "見積もり更新に失敗",
            message: "見積もりを更新できませんでした。もう一度お試しください",
          },
        },
        enabled: {
          success: {
            title: "成功！",
            message: "見積もりが有効になりました。",
          },
        },
        disabled: {
          success: {
            title: "成功！",
            message: "見積もりが無効になりました。",
          },
          error: {
            title: "エラー！",
            message: "見積もりを無効にできませんでした。もう一度お試しください",
          },
        },
        reorder: {
          success: {
            title: "見積もりを並べ替えました",
            message: "プロジェクトの見積もりが並べ替えられました。",
          },
          error: {
            title: "見積もりの並べ替えに失敗",
            message: "見積もりを並べ替えできませんでした。もう一度お試しください。",
          },
        },
      },
      validation: {
        min_length: "見積もりは0より大きい必要があります。",
        unable_to_process: "リクエストを処理できません。もう一度お試しください。",
        numeric: "見積もりは数値である必要があります。",
        character: "見積もりは文字値である必要があります。",
        empty: "見積もり値は空にできません。",
        already_exists: "見積もり値は既に存在します。",
        unsaved_changes: "未保存の変更があります。完了をクリックする前に保存してください",
        remove_empty: "見積もりは空にできません。各フィールドに値を入力するか、値がないフィールドを削除してください。",
        fill: "この見積もりフィールドを入力してください",
        repeat: "見積もり値を重複させることはできません",
      },
      systems: {
        points: {
          label: "ポイント",
          fibonacci: "フィボナッチ",
          linear: "リニア",
          squares: "二乗",
          custom: "カスタム",
        },
        categories: {
          label: "カテゴリー",
          t_shirt_sizes: "Tシャツサイズ",
          easy_to_hard: "簡単から難しい",
          custom: "カスタム",
        },
        time: {
          label: "時間",
          hours: "時間",
        },
      },
      edit: {
        title: "見積もりシステムを編集",
        add_or_update: {
          title: "見積もりの追加、更新、削除",
          description: "ポイントまたはカテゴリーを追加、更新、削除して現在のシステムを管理します。",
        },
        switch: {
          title: "見積もりタイプの変更",
          description: "ポイントシステムをカテゴリーシステムに変換、またはその逆を行います。",
        },
      },
      switch: "見積もりシステムの切り替え",
      current: "現在の見積もりシステム",
      select: "見積もりシステムを選択",
    },
    automations: {
      label: "自動化",
      "auto-archive": {
        title: "完了した作業項目を自動的にアーカイブ",
        description: "Planeは完了またはキャンセルされた作業項目を自動的にアーカイブします。",
        duration: "閉じられた作業項目を自動的にアーカイブ",
      },
      "auto-close": {
        title: "作業項目を自動的に閉じる",
        description: "Planeは完了またはキャンセルされていない作業項目を自動的に閉じます。",
        duration: "非アクティブな作業項目を自動的に閉じる",
        auto_close_status: "自動クローズステータス",
      },
    },
    empty_state: {
      labels: {
        title: "ラベルがまだありません",
        description: "プロジェクトの作業項目を整理してフィルタリングするためのラベルを作成します。",
      },
      estimates: {
        title: "見積もりシステムがまだありません",
        description: "作業項目ごとの作業量を伝えるための見積もりセットを作成します。",
        primary_button: "見積もりシステムを追加",
      },
      integrations: {
        title: "設定された統合がありません",
        description: "GitHubやその他の統合を設定して、プロジェクトの作業項目を同期します。",
      },
    },
    initiatives: {
      heading: "イニシアチブ",
      sub_heading: "Planeですべての作業に対して最高レベルの組織化を実現します。",
      title: "イニシアチブを有効にする",
      description: "進捗を監視するためのより大きな目標を設定",
      toast: {
        updating: "イニシアチブ機能を更新中",
        enable_success: "イニシアチブ機能が正常に有効化されました。",
        disable_success: "イニシアチブ機能が正常に無効化されました。",
        error: "イニシアチブ機能の更新に失敗しました！",
      },
    },
    customers: {
      heading: "顧客",
      settings_heading: "顧客にとって重要なことに基づいて業務を管理しましょう。",
      settings_sub_heading:
        "顧客のリクエストを作業項目に変換し、リクエストに応じて優先順位を設定し、作業項目の状態を顧客記録に反映させます。まもなく、CRMやサポートツールと統合し、顧客属性に基づいたより良い業務管理が可能になります。",
    },
    epics: {
      properties: {
        title: "プロパティ",
        description: "エピックにカスタムプロパティを追加します。",
      },
      disabled: "無効",
    },
    cycles: {
      auto_schedule: {
        heading: "サイクルの自動スケジュール",
        description: "手動設定なしでサイクルを維持します。",
        tooltip: "選択したスケジュールに基づいて新しいサイクルを自動的に作成します。",
        edit_button: "編集",
        form: {
          cycle_title: {
            label: "サイクルタイトル",
            placeholder: "タイトル",
            tooltip: "タイトルは後続のサイクルに番号が追加されます。例：デザイン - 1/2/3",
            validation: {
              required: "サイクルタイトルは必須です",
              max_length: "タイトルは255文字を超えてはいけません",
            },
          },
          cycle_duration: {
            label: "サイクル期間",
            unit: "週",
            validation: {
              required: "サイクル期間は必須です",
              min: "サイクル期間は少なくとも1週間である必要があります",
              max: "サイクル期間は30週を超えてはいけません",
              positive: "サイクル期間は正の値である必要があります",
            },
          },
          cooldown_period: {
            label: "クールダウン期間",
            unit: "日",
            tooltip: "次のサイクルが始まる前のサイクル間の休止期間。",
            validation: {
              required: "クールダウン期間は必須です",
              negative: "クールダウン期間は負の値にはできません",
            },
          },
          start_date: {
            label: "サイクル開始日",
            validation: {
              required: "開始日は必須です",
              past: "開始日を過去の日付にすることはできません",
            },
          },
          number_of_cycles: {
            label: "将来のサイクル数",
            validation: {
              required: "サイクル数は必須です",
              min: "少なくとも1つのサイクルが必要です",
              max: "3つを超えるサイクルをスケジュールすることはできません",
            },
          },
          auto_rollover: {
            label: "作業項目の自動繰り越し",
            tooltip: "サイクルが完了した日に、未完了のすべての作業項目を次のサイクルに移動します。",
          },
        },
        toast: {
          toggle: {
            loading_enable: "サイクルの自動スケジュールを有効化中",
            loading_disable: "サイクルの自動スケジュールを無効化中",
            success: {
              title: "成功！",
              message: "サイクルの自動スケジュールが正常に切り替えられました。",
            },
            error: {
              title: "エラー！",
              message: "サイクルの自動スケジュールの切り替えに失敗しました。",
            },
          },
          save: {
            loading: "サイクルの自動スケジュール設定を保存中",
            success: {
              title: "成功！",
              message_create: "サイクルの自動スケジュール設定が正常に保存されました。",
              message_update: "サイクルの自動スケジュール設定が正常に更新されました。",
            },
            error: {
              title: "エラー！",
              message_create: "サイクルの自動スケジュール設定の保存に失敗しました。",
              message_update: "サイクルの自動スケジュール設定の更新に失敗しました。",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "サイクル",
        short_title: "サイクル",
        description: "このプロジェクト独自のリズムとペースに適応する柔軟な期間で作業をスケジュールします。",
        toggle_title: "サイクルを有効にする",
        toggle_description: "集中的な期間で作業を計画します。",
      },
      modules: {
        title: "モジュール",
        short_title: "モジュール",
        description: "専任のリーダーと担当者を持つサブプロジェクトに作業を整理します。",
        toggle_title: "モジュールを有効にする",
        toggle_description: "プロジェクトメンバーはモジュールを作成および編集できるようになります。",
      },
      views: {
        title: "ビュー",
        short_title: "ビュー",
        description: "カスタムソート、フィルター、表示オプションを保存したり、チームと共有したりします。",
        toggle_title: "ビューを有効にする",
        toggle_description: "プロジェクトメンバーはビューを作成および編集できるようになります。",
      },
      pages: {
        title: "ページ",
        short_title: "ページ",
        description: "自由形式のコンテンツを作成および編集します：メモ、ドキュメント、何でも。",
        toggle_title: "ページを有効にする",
        toggle_description: "プロジェクトメンバーはページを作成および編集できるようになります。",
      },
      intake: {
        intake_responsibility: "受付責任",
        intake_sources: "受付ソース",
        title: "受付",
        short_title: "受付",
        description: "ワークフローを中断することなく、非メンバーがバグ、フィードバック、提案を共有できるようにします。",
        toggle_title: "受付を有効にする",
        toggle_description: "プロジェクトメンバーがアプリ内で受付リクエストを作成できるようにします。",
        toggle_tooltip_on: "プロジェクト管理者に有効化を依頼してください。",
        toggle_tooltip_off: "プロジェクト管理者に無効化を依頼してください。",
        notify_assignee: {
          title: "担当者に通知",
          description: "新しい受付リクエストの場合、デフォルトの担当者が通知を通じてアラートを受け取ります",
        },
        in_app: {
          title: "アプリ内",
          description:
            "既存の作業項目を妨げることなく、ワークスペースのメンバーとゲストから新しい作業項目を受け取ります。",
        },
        email: {
          title: "メール",
          description: "Planeのメールアドレスにメールを送信した誰からでも新しい作業項目を収集します。",
          fieldName: "メールID",
        },
        form: {
          title: "フォーム",
          description:
            "専用の安全なフォームを通じて、ワークスペース外の方が潜在的な新しい作業項目を作成できるようにします。",
          fieldName: "デフォルトフォームURL",
          create_forms: "作業項目タイプを使用してフォームを作成",
          manage_forms: "フォームを管理",
          manage_forms_tooltip: "ワークスペース管理者に管理を依頼してください。",
          create_form: "フォームを作成",
          edit_form: "フォームの詳細を編集",
          form_title: "フォームタイトル",
          form_title_required: "フォームタイトルは必須です",
          work_item_type: "作業項目タイプ",
          remove_property: "プロパティを削除",
          select_properties: "プロパティを選択",
          search_placeholder: "プロパティを検索",
          toasts: {
            success_create: "受付フォームが正常に作成されました",
            success_update: "受付フォームが正常に更新されました",
            error_create: "受付フォームの作成に失敗しました",
            error_update: "受付フォームの更新に失敗しました",
          },
        },
        toasts: {
          set: {
            loading: "担当者を設定中...",
            success: {
              title: "成功！",
              message: "担当者が正常に設定されました。",
            },
            error: {
              title: "エラー！",
              message: "担当者の設定中に問題が発生しました。もう一度お試しください。",
            },
          },
        },
      },
      time_tracking: {
        title: "時間追跡",
        short_title: "時間追跡",
        description: "作業項目やプロジェクトに費やした時間を記録します。",
        toggle_title: "時間追跡を有効にする",
        toggle_description: "プロジェクトメンバーは作業時間を記録できるようになります。",
      },
      milestones: {
        title: "マイルストーン",
        short_title: "マイルストーン",
        description: "マイルストーンは、作業項目を共有の完了日に向けて調整するレイヤーを提供します。",
        toggle_title: "マイルストーンを有効にする",
        toggle_description: "マイルストーンの期限ごとに作業項目を整理します。",
      },
      toasts: {
        loading: "プロジェクト機能を更新中...",
        success: "プロジェクト機能が正常に更新されました。",
        error: "プロジェクト機能の更新中に問題が発生しました。もう一度お試しください。",
      },
    },
  },
  project_cycles: {
    add_cycle: "サイクルを追加",
    more_details: "詳細情報",
    cycle: "サイクル",
    update_cycle: "サイクルを更新",
    create_cycle: "サイクルを作成",
    no_matching_cycles: "一致するサイクルがありません",
    remove_filters_to_see_all_cycles: "すべてのサイクルを表示するにはフィルターを解除してください",
    remove_search_criteria_to_see_all_cycles: "すべてのサイクルを表示するには検索条件を解除してください",
    only_completed_cycles_can_be_archived: "完了したサイクルのみアーカイブできます",
    start_date: "開始日",
    end_date: "終了日",
    in_your_timezone: "あなたのタイムゾーン",
    transfer_work_items: "作業項目を転送 {count}",
    transfer: {
      no_cycles_available: "作業アイテムを転送できる他のサイクルがありません。",
    },
    date_range: "日付範囲",
    add_date: "日付を追加",
    active_cycle: {
      label: "アクティブなサイクル",
      progress: "進捗",
      chart: "バーンダウンチャート",
      priority_issue: "優先作業項目",
      assignees: "担当者",
      issue_burndown: "作業項目バーンダウン",
      ideal: "理想",
      current: "現在",
      labels: "ラベル",
      trailing: "遅れ",
      leading: "リード",
    },
    upcoming_cycle: {
      label: "今後のサイクル",
    },
    completed_cycle: {
      label: "完了したサイクル",
    },
    status: {
      days_left: "残り日数",
      completed: "完了",
      yet_to_start: "開始前",
      in_progress: "進行中",
      draft: "下書き",
    },
    action: {
      restore: {
        title: "サイクルを復元",
        success: {
          title: "サイクルが復元されました",
          description: "サイクルが復元されました。",
        },
        failed: {
          title: "サイクルの復元に失敗",
          description: "サイクルを復元できませんでした。もう一度お試しください。",
        },
      },
      favorite: {
        loading: "お気に入りにサイクルを追加中",
        success: {
          description: "サイクルがお気に入りに追加されました。",
          title: "成功！",
        },
        failed: {
          description: "サイクルをお気に入りに追加できませんでした。もう一度お試しください。",
          title: "エラー！",
        },
      },
      unfavorite: {
        loading: "お気に入りからサイクルを削除中",
        success: {
          description: "サイクルがお気に入りから削除されました。",
          title: "成功！",
        },
        failed: {
          description: "サイクルをお気に入りから削除できませんでした。もう一度お試しください。",
          title: "エラー！",
        },
      },
      update: {
        loading: "サイクルを更新中",
        success: {
          description: "サイクルが正常に更新されました。",
          title: "成功！",
        },
        failed: {
          description: "サイクルの更新中にエラーが発生しました。もう一度お試しください。",
          title: "エラー！",
        },
        error: {
          already_exists:
            "指定した日付のサイクルは既に存在します。下書きサイクルを作成する場合は、両方の日付を削除してください。",
        },
      },
    },
    empty_state: {
      general: {
        title: "サイクルで作業をグループ化してタイムボックス化します。",
        description:
          "作業をタイムボックス化された単位に分割し、プロジェクトの期限から逆算して日付を設定し、チームとして具体的な進捗を作ります。",
        primary_button: {
          text: "最初のサイクルを設定",
          comic: {
            title: "サイクルは繰り返されるタイムボックスです。",
            description: "スプリント、イテレーション、または週次や隔週の作業追跡に使用するその他の用語がサイクルです。",
          },
        },
      },
      no_issues: {
        title: "サイクルに作業項目が追加されていません",
        description: "このサイクル内でタイムボックス化して提供したい作業項目を追加または作成します",
        primary_button: {
          text: "新しい作業項目を作成",
        },
        secondary_button: {
          text: "既存の作業項目を追加",
        },
      },
      completed_no_issues: {
        title: "サイクルに作業項目がありません",
        description:
          "サイクルに作業項目がありません。作業項目は転送されたか非表示になっています。非表示の作業項目がある場合は、表示プロパティを更新して確認してください。",
      },
      active: {
        title: "アクティブなサイクルがありません",
        description:
          "アクティブなサイクルには、その期間内に今日の日付が含まれるものが該当します。アクティブなサイクルの進捗と詳細をここで確認できます。",
      },
      archived: {
        title: "アーカイブされたサイクルがまだありません",
        description:
          "プロジェクトを整理するために、完了したサイクルをアーカイブします。アーカイブ後はここで確認できます。",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "作業項目を作成して誰かに割り当てましょう。自分自身でも構いません",
        description:
          "作業項目は、仕事、タスク、作業、またはJTBD（私たちが好む用語）と考えてください。作業項目とそのサブ作業項目は通常、チームメンバーに割り当てられる時間ベースのアクションアイテムです。チームは作業項目を作成、割り当て、完了することでプロジェクトの目標に向かって進みます。",
        primary_button: {
          text: "最初の作業項目を作成",
          comic: {
            title: "作業項目はPlaneの構成要素です。",
            description:
              "PlaneのUIの再設計、会社のリブランド、新しい燃料噴射システムの立ち上げなどは、サブ作業項目を持つ可能性が高い作業項目の例です。",
          },
        },
      },
      no_archived_issues: {
        title: "アーカイブされた作業項目がまだありません",
        description:
          "手動または自動化を通じて、完了またはキャンセルされた作業項目をアーカイブできます。アーカイブ後はここで確認できます。",
        primary_button: {
          text: "自動化を設定",
        },
      },
      issues_empty_filter: {
        title: "適用されたフィルターに一致する作業項目が見つかりません",
        secondary_button: {
          text: "すべてのフィルターをクリア",
        },
      },
    },
  },
  project_module: {
    add_module: "モジュールを追加",
    update_module: "モジュールを更新",
    create_module: "モジュールを作成",
    archive_module: "モジュールをアーカイブ",
    restore_module: "モジュールを復元",
    delete_module: "モジュールを削除",
    empty_state: {
      general: {
        title: "プロジェクトのマイルストーンをモジュールにマッピングし、集計された作業を簡単に追跡できます。",
        description:
          "論理的で階層的な親に属する作業項目のグループがモジュールを形成します。プロジェクトのマイルストーンで作業を追跡する方法として考えてください。期間や期限があり、マイルストーンまでの進捗状況を確認できる分析機能も備えています。",
        primary_button: {
          text: "最初のモジュールを作成",
          comic: {
            title: "モジュールは階層的に作業をグループ化するのに役立ちます。",
            description: "カートモジュール、シャーシモジュール、倉庫モジュールは、このグループ化の良い例です。",
          },
        },
      },
      no_issues: {
        title: "モジュールに作業項目がありません",
        description: "このモジュールの一部として達成したい作業項目を作成または追加してください",
        primary_button: {
          text: "新しい作業項目を作成",
        },
        secondary_button: {
          text: "既存の作業項目を追加",
        },
      },
      archived: {
        title: "アーカイブされたモジュールがまだありません",
        description:
          "プロジェクトを整理するために、完了またはキャンセルされたモジュールをアーカイブします。アーカイブ後はここで確認できます。",
      },
      sidebar: {
        in_active: "このモジュールはまだアクティブではありません。",
        invalid_date: "無効な日付です。有効な日付を入力してください。",
      },
    },
    quick_actions: {
      archive_module: "モジュールをアーカイブ",
      archive_module_description: `完了またはキャンセルされた
モジュールのみアーカイブできます。`,
      delete_module: "モジュールを削除",
    },
    toast: {
      copy: {
        success: "モジュールのリンクがクリップボードにコピーされました",
      },
      delete: {
        success: "モジュールが正常に削除されました",
        error: "モジュールを削除できませんでした",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "プロジェクトのフィルター付きビューを保存します。必要な数だけ作成できます",
        description:
          "ビューは、頻繁に使用するフィルターや簡単にアクセスしたいフィルターの集合です。プロジェクト内のすべての同僚が全員のビューを確認でき、自分のニーズに最も合うものを選択できます。",
        primary_button: {
          text: "最初のビューを作成",
          comic: {
            title: "ビューは作業項目のプロパティの上で機能します。",
            description: "ここから、必要に応じて多くのプロパティやフィルターを使用してビューを作成できます。",
          },
        },
      },
      filter: {
        title: "一致するビューがありません",
        description: `検索条件に一致するビューがありません。
代わりに新しいビューを作成してください。`,
      },
    },
    delete_view: {
      title: "このビューを削除してもよろしいですか？",
      content:
        "確認すると、このビューに選択したすべてのソート、フィルター、表示オプション + レイアウトが復元不可能な形で完全に削除されます。",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "メモ、ドキュメント、または完全なナレッジベースを作成しましょう。PlaneのAIアシスタントGalileoが開始をサポートします",
        description:
          "ページはPlaneの思考整理スペースです。会議のメモを取り、簡単に整形し、作業項目を埋め込み、コンポーネントライブラリを使用してレイアウトし、すべてをプロジェクトのコンテキストに保存できます。ドキュメントを素早く作成するには、ショートカットまたはボタンのクリックでPlaneのAI、Galileoを呼び出してください。",
        primary_button: {
          text: "最初のページを作成",
        },
      },
      private: {
        title: "プライベートページがまだありません",
        description:
          "プライベートな考えをここに保存しましょう。共有する準備ができたら、チームはクリック一つで共有できます。",
        primary_button: {
          text: "最初のページを作成",
        },
      },
      public: {
        title: "公開ページがまだありません",
        description: "プロジェクト内の全員と共有されているページをここで確認できます。",
        primary_button: {
          text: "最初のページを作成",
        },
      },
      archived: {
        title: "アーカイブされたページがまだありません",
        description: "注目していないページをアーカイブします。必要な時にここでアクセスできます。",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "結果が見つかりません",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "一致する作業項目が見つかりません",
      },
      no_issues: {
        title: "作業項目が見つかりません",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "コメントがまだありません",
        description: "コメントは作業項目のディスカッションとフォローアップのスペースとして使用できます",
      },
    },
  },
  notification: {
    label: "受信トレイ",
    page_label: "{workspace} - 受信トレイ",
    options: {
      mark_all_as_read: "すべて既読にする",
      mark_read: "既読にする",
      mark_unread: "未読にする",
      refresh: "更新",
      filters: "受信トレイフィルター",
      show_unread: "未読を表示",
      show_snoozed: "スヌーズを表示",
      show_archived: "アーカイブを表示",
      mark_archive: "アーカイブ",
      mark_unarchive: "アーカイブ解除",
      mark_snooze: "スヌーズ",
      mark_unsnooze: "スヌーズ解除",
    },
    toasts: {
      read: "通知を既読にしました",
      unread: "通知を未読にしました",
      archived: "通知をアーカイブしました",
      unarchived: "通知をアーカイブ解除しました",
      snoozed: "通知をスヌーズしました",
      unsnoozed: "通知のスヌーズを解除しました",
    },
    empty_state: {
      detail: {
        title: "詳細を表示するには選択してください。",
      },
      all: {
        title: "割り当てられた作業項目がありません",
        description: `あなたに割り当てられた作業項目の更新が
ここに表示されます`,
      },
      mentions: {
        title: "割り当てられた作業項目がありません",
        description: `あなたに割り当てられた作業項目の更新が
ここに表示されます`,
      },
    },
    tabs: {
      all: "すべて",
      mentions: "メンション",
    },
    filter: {
      assigned: "自分に割り当て",
      created: "自分が作成",
      subscribed: "自分が購読",
    },
    snooze: {
      "1_day": "1日",
      "3_days": "3日",
      "5_days": "5日",
      "1_week": "1週間",
      "2_weeks": "2週間",
      custom: "カスタム",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "サイクルの進捗を表示するには作業項目を追加してください",
      },
      chart: {
        title: "バーンダウンチャートを表示するには作業項目を追加してください。",
      },
      priority_issue: {
        title: "サイクルで取り組まれている優先度の高い作業項目を一目で確認できます。",
      },
      assignee: {
        title: "担当者別の作業の内訳を確認するには、作業項目に担当者を追加してください。",
      },
      label: {
        title: "ラベル別の作業の内訳を確認するには、作業項目にラベルを追加してください。",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "インテークがプロジェクトで有効になっていません。",
        description:
          "インテークは、プロジェクトへの受信リクエストを管理し、ワークフローに作業項目として追加するのに役立ちます。リクエストを管理するには、プロジェクト設定でインテークを有効にしてください。",
        primary_button: {
          text: "機能を管理",
        },
      },
      cycle: {
        title: "サイクルがこのプロジェクトで有効になっていません。",
        description:
          "時間枠で作業を分割し、プロジェクトの期限から逆算して日付を設定し、チームとして具体的な進捗を作ります。サイクルを使用するには、プロジェクトでサイクル機能を有効にしてください。",
        primary_button: {
          text: "機能を管理",
        },
      },
      module: {
        title: "モジュールがプロジェクトで有効になっていません。",
        description:
          "モジュールはプロジェクトの構成要素です。モジュールを使用するには、プロジェクト設定でモジュールを有効にしてください。",
        primary_button: {
          text: "機能を管理",
        },
      },
      page: {
        title: "ページがプロジェクトで有効になっていません。",
        description:
          "ページはプロジェクトの構成要素です。ページを使用するには、プロジェクト設定でページを有効にしてください。",
        primary_button: {
          text: "機能を管理",
        },
      },
      view: {
        title: "ビューがプロジェクトで有効になっていません。",
        description:
          "ビューはプロジェクトの構成要素です。ビューを使用するには、プロジェクト設定でビューを有効にしてください。",
        primary_button: {
          text: "機能を管理",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "作業項目の下書き",
    empty_state: {
      title: "書きかけの作業項目、そしてまもなくコメントがここに表示されます。",
      description: "試してみるには、作業項目の追加を開始して途中で中断するか、以下で最初の下書きを作成してください。😉",
      primary_button: {
        text: "最初の下書きを作成",
      },
    },
    delete_modal: {
      title: "下書きを削除",
      description: "この下書きを削除してもよろしいですか？この操作は取り消せません。",
    },
    toasts: {
      created: {
        success: "下書きを作成しました",
        error: "作業項目を作成できませんでした。もう一度お試しください。",
      },
      deleted: {
        success: "下書きを削除しました",
      },
    },
  },
  stickies: {
    title: "あなたの付箋",
    placeholder: "ここをクリックして入力",
    all: "すべての付箋",
    "no-data":
      "アイデアをメモしたり、ひらめきをキャプチャしたり、閃きを記録したりしましょう。付箋を追加して始めましょう。",
    add: "付箋を追加",
    search_placeholder: "タイトルで検索",
    delete: "付箋を削除",
    delete_confirmation: "この付箋を削除してもよろしいですか？",
    empty_state: {
      simple:
        "アイデアをメモしたり、ひらめきをキャプチャしたり、閃きを記録したりしましょう。付箋を追加して始めましょう。",
      general: {
        title: "付箋は、その場で素早く取るメモやToDoです。",
        description: "いつでもどこからでもアクセスできる付箋を作成して、思考やアイデアを簡単にキャプチャできます。",
        primary_button: {
          text: "付箋を追加",
        },
      },
      search: {
        title: "付箋に一致するものがありません。",
        description: `別の用語を試すか、検索が正しいと
確信がある場合はお知らせください。`,
        primary_button: {
          text: "付箋を追加",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "付箋の名前は100文字を超えることはできません。",
        already_exists: "説明のない付箋がすでに存在します",
      },
      created: {
        title: "付箋を作成しました",
        message: "付箋が正常に作成されました",
      },
      not_created: {
        title: "付箋を作成できませんでした",
        message: "付箋を作成できませんでした",
      },
      updated: {
        title: "付箋を更新しました",
        message: "付箋が正常に更新されました",
      },
      not_updated: {
        title: "付箋を更新できませんでした",
        message: "付箋を更新できませんでした",
      },
      removed: {
        title: "付箋を削除しました",
        message: "付箋が正常に削除されました",
      },
      not_removed: {
        title: "付箋を削除できませんでした",
        message: "付箋を削除できませんでした",
      },
    },
  },
  role_details: {
    guest: {
      title: "ゲスト",
      description: "組織の外部メンバーをゲストとして招待できます。",
    },
    member: {
      title: "メンバー",
      description: "プロジェクト、サイクル、モジュール内のエンティティの読み取り、書き込み、編集、削除が可能",
    },
    admin: {
      title: "管理者",
      description: "ワークスペース内のすべての権限が有効。",
    },
  },
  user_roles: {
    product_or_project_manager: "プロダクト/プロジェクトマネージャー",
    development_or_engineering: "開発/エンジニアリング",
    founder_or_executive: "創業者/エグゼクティブ",
    freelancer_or_consultant: "フリーランス/コンサルタント",
    marketing_or_growth: "マーケティング/グロース",
    sales_or_business_development: "営業/ビジネス開発",
    support_or_operations: "サポート/オペレーション",
    student_or_professor: "学生/教授",
    human_resources: "人事",
    other: "その他",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "GitHubリポジトリから作業項目をインポートして同期します。",
    },
    jira: {
      title: "Jira",
      description: "Jiraプロジェクトとエピックから作業項目とエピックをインポートします。",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "作業項目をCSVファイルにエクスポートします。",
      short_description: "CSVとしてエクスポート",
    },
    excel: {
      title: "Excel",
      description: "作業項目をExcelファイルにエクスポートします。",
      short_description: "Excelとしてエクスポート",
    },
    xlsx: {
      title: "Excel",
      description: "作業項目をExcelファイルにエクスポートします。",
      short_description: "Excelとしてエクスポート",
    },
    json: {
      title: "JSON",
      description: "作業項目をJSONファイルにエクスポートします。",
      short_description: "JSONとしてエクスポート",
    },
  },
  default_global_view: {
    all_issues: "すべての作業項目",
    assigned: "割り当て済み",
    created: "作成済み",
    subscribed: "購読中",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "システム設定",
      },
      light: {
        label: "ライト",
      },
      dark: {
        label: "ダーク",
      },
      light_contrast: {
        label: "ライトハイコントラスト",
      },
      dark_contrast: {
        label: "ダークハイコントラスト",
      },
      custom: {
        label: "カスタムテーマ",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "バックログ",
      planned: "計画済み",
      in_progress: "進行中",
      paused: "一時停止",
      completed: "完了",
      cancelled: "キャンセル",
    },
    layout: {
      list: "リスト表示",
      board: "ギャラリー表示",
      timeline: "タイムライン表示",
    },
    order_by: {
      name: "名前",
      progress: "進捗",
      issues: "作業項目数",
      due_date: "期限",
      created_at: "作成日",
      manual: "手動",
    },
  },
  cycle: {
    label: "{count, plural, one {サイクル} other {サイクル}}",
    no_cycle: "サイクルなし",
  },
  module: {
    label: "{count, plural, one {モジュール} other {モジュール}}",
    no_module: "モジュールなし",
  },
  description_versions: {
    last_edited_by: "最終編集者",
    previously_edited_by: "以前の編集者",
    edited_by: "編集者",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Planeが起動しませんでした。これは1つまたは複数のPlaneサービスの起動に失敗したことが原因である可能性があります。",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "setup.shとDockerログからView Logsを選択して確認してください。",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "アウトライン",
        empty_state: {
          title: "見出しがありません",
          description: "このページに見出しを追加してここで確認しましょう。",
        },
      },
      info: {
        label: "情報",
        document_info: {
          words: "単語数",
          characters: "文字数",
          paragraphs: "段落数",
          read_time: "読了時間",
        },
        actors_info: {
          edited_by: "編集者",
          created_by: "作成者",
        },
        version_history: {
          label: "バージョン履歴",
          current_version: "現在のバージョン",
          highlight_changes: "変更を強調表示",
        },
      },
      assets: {
        label: "アセット",
        download_button: "ダウンロード",
        empty_state: {
          title: "画像がありません",
          description: "画像を追加してここで確認してください。",
        },
      },
    },
    open_button: "ナビゲーションパネルを開く",
    close_button: "ナビゲーションパネルを閉じる",
    outline_floating_button: "アウトラインを開く",
  },
  workspace_dashboards: "ダッシュボード",
  pi_chat: "AIチャット",
  in_app: "アプリ内",
  forms: "フォーム",
  choose_workspace_for_integration: "このアプリケーションに接続するワークスペースを選択してください",
  integrations_description: "Planeのアプリケーションは、管理者であるワークスペースに接続する必要があります。",
  create_a_new_workspace: "新しいワークスペースを作成",
  learn_more_about_workspaces: "ワークスペースについて詳しくはこちら",
  no_workspaces_to_connect: "接続するワークスペースがありません",
  no_workspaces_to_connect_description: "接続するワークスペースを作成する必要があります",
  updates: {
    add_update: "更新を追加",
    add_update_placeholder: "ここに更新を入力してください",
    empty: {
      title: "まだ更新がありません",
      description: "ここで更新を確認できます。",
    },
    delete: {
      title: "更新を削除",
      confirmation: "この更新を削除してもよろしいですか？この操作は元に戻すことができません。",
      success: {
        title: "更新が削除されました",
        message: "更新が正常に削除されました。",
      },
      error: {
        title: "更新が削除されませんでした",
        message: "更新を削除できませんでした。",
      },
    },
    reaction: {
      create: {
        success: {
          title: "反応が作成されました",
          message: "反応が正常に作成されました。",
        },
        error: {
          title: "反応が作成されませんでした",
          message: "反応を作成できませんでした。",
        },
      },
      remove: {
        success: {
          title: "反応が削除されました",
          message: "反応が正常に削除されました。",
        },
        error: {
          title: "反応が削除されませんでした",
          message: "反応を削除できませんでした。",
        },
      },
    },
    progress: {
      title: "進捗",
      since_last_update: "最後の更新以来",
      comments: "{count, plural, one{# コメント} other{# コメント}}",
    },
    create: {
      success: {
        title: "更新が作成されました",
        message: "更新が正常に作成されました。",
      },
      error: {
        title: "更新が作成されませんでした",
        message: "更新を作成できませんでした。",
      },
    },
    update: {
      success: {
        title: "更新が更新されました",
        message: "更新が正常に更新されました。",
      },
      error: {
        title: "更新が更新されませんでした",
        message: "更新を更新できませんでした。",
      },
    },
  },
  teamspaces: {
    label: "チームスペース",
    empty_state: {
      general: {
        title: "チームスペースでPlaneのより良い組織化とトラッキングが可能になります。",
        description:
          "実際のチームごとに専用のスペースを作成し、Planeの他の作業スペースから分離して、チームの作業方法に合わせてカスタマイズできます。",
        primary_button: {
          text: "新しいチームスペースを作成",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "まだチームスペースをリンクしていません。",
          description: "チームスペースとプロジェクトの所有者はプロジェクトへのアクセスを管理できます。",
        },
      },
      primary_button: {
        text: "チームスペースをリンク",
      },
      secondary_button: {
        text: "詳細を見る",
      },
      table: {
        columns: {
          teamspaceName: "チームスペース名",
          members: "メンバー",
          accountType: "アカウントタイプ",
        },
        actions: {
          remove: {
            button: {
              text: "チームスペースを削除",
            },
            confirm: {
              title: "{projectName}から{teamspaceName}を削除",
              description:
                "リンクされたプロジェクトからこのチームスペースを削除すると、ここのメンバーはリンクされたプロジェクトへのアクセス権を失います。",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "一致するチームスペースが見つかりません",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {このプロジェクトにチームスペースをリンクしました。} other {このプロジェクトに#つのチームスペースをリンクしました。}}",
            description:
              "{additionalCount, plural, =0 {チームスペース{firstTeamspaceName}がこのプロジェクトにリンクされました。} other {チームスペース{firstTeamspaceName}と{additionalCount}つのチームスペースがこのプロジェクトにリンクされました。}}",
          },
          error: {
            title: "処理が完了しませんでした。",
            description: "もう一度試すか、ページを再読み込みしてから再試行してください。",
          },
        },
        remove_teamspace: {
          success: {
            title: "このプロジェクトからチームスペースを削除しました。",
            description: "チームスペース{teamspaceName}が{projectName}から削除されました。",
          },
          error: {
            title: "処理が完了しませんでした。",
            description: "もう一度試すか、ページを再読み込みしてから再試行してください。",
          },
        },
      },
      link_teamspace: {
        placeholder: "チームスペースを検索",
        info: {
          title:
            "チームスペースを追加すると、そのチームスペースの全メンバーがこのプロジェクトにアクセスできるようになります。",
          link: "詳細を見る",
        },
        empty_state: {
          no_teamspaces: {
            title: "リンクできるチームスペースがありません。",
            description:
              "リンクできるチームスペースに所属していないか、利用可能なチームスペースをすべてリンク済みです。",
          },
          no_results: {
            title: "一致するチームスペースが見つかりません。",
            description: "別の検索語を試すか、リンクできるチームスペースがあることを確認してください。",
          },
        },
        primary_button: {
          text: "選択したチームスペースをリンク",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "チーム固有の作業項目を作成します。",
        description:
          "リンクされたプロジェクトでこのチームのメンバーに割り当てられた作業項目は、自動的にここに表示されます。作業項目が表示されるはずの場合は、リンクされたプロジェクトにこのチームのメンバーに割り当てられた作業項目があることを確認するか、作業項目を作成してください。",
        primary_button: {
          text: "リンクされたプロジェクトに作業項目を追加",
        },
      },
      work_items_empty_filter: {
        title: "適用されたフィルターに該当するチーム固有の作業項目はありません",
        description: "フィルターの一部を変更するか、すべてクリアしてこのスペースに関連する作業項目を表示します。",
        secondary_button: {
          text: "すべてのフィルターをクリア",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "リンクされたプロジェクトにアクティブなサイクルがありません。",
        description:
          "リンクされたプロジェクトのアクティブなサイクルは自動的にここに表示されます。アクティブなサイクルが表示されるはずの場合は、リンクされたプロジェクトで現在実行中であることを確認してください。",
      },
      completed: {
        title: "リンクされたプロジェクトに完了したサイクルがありません。",
        description:
          "リンクされたプロジェクトの完了したサイクルは自動的にここに表示されます。完了したサイクルが表示されるはずの場合は、リンクされたプロジェクトでも完了していることを確認してください。",
      },
      upcoming: {
        title: "リンクされたプロジェクトに今後のサイクルがありません。",
        description:
          "リンクされたプロジェクトの今後のサイクルは自動的にここに表示されます。今後のサイクルが表示されるはずの場合は、リンクされたプロジェクトにもあることを確認してください。",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "ワークスペースの他のビューを妨げることなく、チームの作業を表示",
        description: "チームの作業を、プロジェクトのビューとは別に、チーム専用に保存されたビューで確認できます。",
        primary_button: {
          text: "ビューを作成",
        },
      },
      filter: {
        title: "一致するビューがありません",
        description: `検索条件に一致するビューがありません。
 代わりに新しいビューを作成してください。`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "チームの知識をチームページに保存します。",
        description:
          "プロジェクトのページとは異なり、チーム固有の知識をここで別のページセットに保存できます。ページのすべての機能を利用して、ベストプラクティスのドキュメントやチームのウィキを簡単に作成できます。",
        primary_button: {
          text: "最初のチームページを作成",
        },
      },
      filter: {
        title: "一致するページがありません",
        description: "すべてのページを表示するにはフィルターを削除してください",
      },
      search: {
        title: "一致するページがありません",
        description: "すべてのページを表示するには検索条件を削除してください",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "リンクされたプロジェクトに公開された作業項目がありません。",
        description:
          "日付、状態、優先度による進捗を確認するには、それらのプロジェクトのいずれかで作業項目を作成してください。",
      },
      relation: {
        blocking: {
          title: "チームメイトをブロックしている作業項目はありません。",
          description: "よくできました！チームの進路を開いています。あなたは良いチームプレイヤーです。",
        },
        blocked: {
          title: "チームメイトの作業項目があなたをブロックしていません。",
          description: "良いニュースです！割り当てられたすべての作業項目で進捗を出すことができます。",
        },
      },
      stats: {
        general: {
          title: "リンクされたプロジェクトに公開された作業項目がありません。",
          description:
            "プロジェクトとチームメンバーによる作業の分布を確認するには、それらのプロジェクトのいずれかで作業項目を作成してください。",
        },
        filter: {
          title: "適用されたフィルターに該当するチーム統計はありません。",
          description:
            "プロジェクトとチームメンバーによる作業の分布を確認するには、それらのプロジェクトのいずれかで作業項目を作成してください。",
        },
      },
    },
  },
  initiatives: {
    overview: "概要",
    label: "イニシアチブ",
    placeholder: "{count, plural, one{# イニシアチブ} other{# イニシアチブ}}",
    add_initiative: "イニシアチブを追加",
    create_initiative: "イニシアチブを作成",
    update_initiative: "イニシアチブを更新",
    initiative_name: "イニシアチブ名",
    all_initiatives: "すべてのイニシアチブ",
    delete_initiative: "イニシアチブを削除",
    fill_all_required_fields: "すべての必須フィールドに入力してください。",
    toast: {
      create_success: "イニシアチブ {name} が正常に作成されました。",
      create_error: "イニシアチブの作成に失敗しました。もう一度お試しください！",
      update_success: "イニシアチブ {name} が正常に更新されました。",
      update_error: "イニシアチブの更新に失敗しました。もう一度お試しください！",
      delete: {
        success: "イニシアチブが正常に削除されました。",
        error: "イニシアチブの削除に失敗しました",
      },
      link_copied: "イニシアチブのリンクがクリップボードにコピーされました。",
      project_update_success: "イニシアチブのプロジェクトが正常に更新されました。",
      project_update_error: "イニシアチブのプロジェクトの更新に失敗しました。もう一度お試しください！",
      epic_update_success:
        "エピック{count, plural, one {がイニシアチブに正常に追加されました。} other {がイニシアチブに正常に追加されました。}}",
      epic_update_error: "イニシアチブへのエピックの追加に失敗しました。後でもう一度お試しください。",
      state_update_success: "イニシアチブの状態が正常に更新されました。",
      state_update_error: "イニシアチブの状態を更新できませんでした。もう一度お試しください！",
      label_update_error: "イニシアティブのラベルの更新に失敗しました。もう一度お試しください！",
    },
    empty_state: {
      general: {
        title: "イニシアチブで最高レベルの作業を整理",
        description:
          "複数のプロジェクトやチームにまたがる作業を整理する必要がある場合、イニシアチブが役立ちます。プロジェクトとエピックをイニシアチブに接続し、自動的に集計された更新を確認し、木々を見る前に森を見ることができます。",
        primary_button: {
          text: "イニシアチブを作成",
        },
      },
      search: {
        title: "一致するイニシアチブがありません",
        description: `一致する条件のイニシアチブは検出されませんでした。
 代わりに新しいイニシアチブを作成してください。`,
      },
      not_found: {
        title: "イニシアチブが存在しません",
        description: "お探しのイニシアチブは存在しないか、アーカイブされたか、削除されました。",
        primary_button: {
          text: "他のイニシアチブを表示",
        },
      },
      epics: {
        title: "イニシアチブが存在しません",
        subHeading: "すべてのイニシアチブを表示するには、すべての適用されたフィルターを削除してください。",
        action: "フィルターを削除",
      },
    },
    scope: {
      view_scope: "スコープを表示",
      breakdown: "スコープの分解",
      add_scope: "スコープを追加",
      label: "スコープ",
      empty_state: {
        title: "まだスコープが追加されていません",
        description: "このイニシアチブにプロジェクトとエピックをリンクし、その作業をこのスペースで追跡します。",
        primary_button: {
          text: "スコープを追加",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "ラベル",
        description: "ラベルであなたの取り組みを整理・構造化しましょう。",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "ラベルを削除",
        content:
          "{labelName} を削除してもよろしいですか？これにより、すべてのイニシアチブおよびラベルがフィルタリングされているビューからラベルが削除されます。",
      },
      toast: {
        delete_error: "イニシアチブのラベルを削除できませんでした。もう一度お試しください。",
        label_already_exists: "ラベルは既に存在します",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "メモ、ドキュメント、または完全なナレッジベースを作成します。Planeのアシスタント、ガリレオが開始をサポートします",
        description:
          "ページはPlaneの思考整理スペースです。会議のメモを取り、簡単に整形し、作業項目を埋め込み、コンポーネントライブラリを使用してレイアウトし、すべてをプロジェクトのコンテキストに保存します。どんなドキュメントも短時間で作成するために、PlaneのAI、ガリレオをショートカットやボタンのクリックで呼び出すことができます。",
        primary_button: {
          text: "最初のページを作成",
        },
      },
      private: {
        title: "まだプライベートページがありません",
        description: "プライベートな考えをここに保存します。共有する準備ができたら、チームは1クリックで共有できます。",
        primary_button: {
          text: "最初のページを作成",
        },
      },
      public: {
        title: "まだワークスペースページがありません",
        description: "ワークスペースの全員と共有されているページをここで確認します。",
        primary_button: {
          text: "最初のページを作成",
        },
      },
      archived: {
        title: "まだアーカイブされたページがありません",
        description: "注目していないページをアーカイブします。必要な時にここでアクセスできます。",
      },
    },
  },
  epics: {
    label: "エピック",
    no_epics_selected: "エピックが選択されていません",
    add_selected_epics: "選択したエピックを追加",
    epic_link_copied_to_clipboard: "エピックのリンクがクリップボードにコピーされました。",
    project_link_copied_to_clipboard: "プロジェクトのリンクがクリップボードにコピーされました",
    empty_state: {
      general: {
        title: "エピックを作成し、誰か（自分自身でも）に割り当てます",
        description:
          "複数のサイクルにまたがり、モジュール間で存在する可能性のある大きな作業のために、エピックを作成します。プロジェクト内の作業項目とサブ作業項目をエピックにリンクし、概要から作業項目にジャンプできます。",
        primary_button: {
          text: "エピックを作成",
        },
      },
      section: {
        title: "まだエピックがありません",
        description: "進捗を管理・追跡するためにエピックの追加を開始します。",
        primary_button: {
          text: "エピックを追加",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "一致するエピックが見つかりません",
      },
      no_epics: {
        title: "エピックが見つかりません",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "アクティブなサイクルがありません",
        description:
          "プロジェクトのサイクルには、その範囲内に今日の日付を含む期間が含まれます。ここですべてのアクティブなサイクルの進捗状況と詳細を確認できます。",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: "サイクルの進捗を表示するには作業項目を追加してください",
      },
      priority: {
        title: `サイクル内で取り組まれた高優先度の作業項目を
一目で確認できます。`,
      },
      assignee: {
        title: `作業項目に担当者を追加して、
担当者別の作業内訳を確認できます。`,
      },
      label: {
        title: `作業項目にラベルを追加して、
ラベル別の作業内訳を確認できます。`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "CSVからメンバーをインポート",
      description: "次の列を含むCSVをアップロード：Email, Display Name, First Name, Last Name, Role（5、15、または20）",
      dropzone: {
        active: "CSVファイルをここにドロップ",
        inactive: "ドラッグ＆ドロップまたはクリックしてアップロード",
        file_type: ".csvファイルのみサポートされています",
      },
      buttons: {
        cancel: "キャンセル",
        import: "インポート",
        try_again: "再試行",
        close: "閉じる",
        done: "完了",
      },
      progress: {
        uploading: "アップロード中...",
        importing: "インポート中...",
      },
      summary: {
        title: {
          failed: "インポート失敗",
          complete: "インポート完了",
        },
        message: {
          seat_limit: "シート制限によりメンバーをインポートできません。",
          success: "{count}人のメンバーをワークスペースに追加しました。",
          no_imports: "CSVファイルからメンバーがインポートされませんでした。",
        },
        stats: {
          successful: "成功",
          failed: "失敗",
        },
        download_errors: "エラーをダウンロード",
      },
      toast: {
        invalid_file: {
          title: "無効なファイル",
          message: "CSVファイルのみサポートされています。",
        },
        import_failed: {
          title: "インポート失敗",
          message: "問題が発生しました。",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "作業項目をアーカイブできません",
        message: "完了または取り消し状態グループに属する作業項目のみアーカイブできます。",
      },
      invalid_issue_start_date: {
        title: "作業項目を更新できません",
        message:
          "選択された開始日が一部の作業項目の期限日を超えています。開始日が期限日より前になるようにしてください。",
      },
      invalid_issue_target_date: {
        title: "作業項目を更新できません",
        message:
          "選択された期限日が一部の作業項目の開始日より前になっています。期限日が開始日より後になるようにしてください。",
      },
      invalid_state_transition: {
        title: "作業項目を更新できません",
        message: "一部の作業項目では状態の変更が許可されていません。状態の変更が許可されていることを確認してください。",
      },
    },
  },
  work_item_types: {
    label: "作業項目タイプ",
    label_lowercase: "作業項目タイプ",
    settings: {
      title: "作業項目タイプ",
      properties: {
        title: "カスタム作業項目プロパティ",
        tooltip:
          "各作業項目タイプには、タイトル、説明、担当者、状態、優先度、開始日、期限日、モジュール、サイクルなどのデフォルトのプロパティセットが付属しています。チームのニーズに合わせて独自のプロパティをカスタマイズして追加することもできます。",
        add_button: "新しいプロパティを追加",
        dropdown: {
          label: "プロパティタイプ",
          placeholder: "タイプを選択",
        },
        property_type: {
          text: {
            label: "テキスト",
          },
          number: {
            label: "数値",
          },
          dropdown: {
            label: "ドロップダウン",
          },
          boolean: {
            label: "ブール値",
          },
          date: {
            label: "日付",
          },
          member_picker: {
            label: "メンバー選択",
          },
          release_picker: {
            label: "リリース選択",
          },
          formula: {
            label: "数式",
          },
        },
        attributes: {
          label: "属性",
          text: {
            single_line: {
              label: "一行",
            },
            multi_line: {
              label: "段落",
            },
            readonly: {
              label: "読み取り専用",
              header: "読み取り専用データ",
            },
            invalid_text_format: {
              label: "無効なテキスト形式",
            },
          },
          number: {
            default: {
              placeholder: "数値を追加",
            },
          },
          relation: {
            single_select: {
              label: "単一選択",
            },
            multi_select: {
              label: "複数選択",
            },
            no_default_value: {
              label: "デフォルト値なし",
            },
          },
          boolean: {
            label: "真 | 偽",
            no_default: "デフォルト値なし",
          },
          option: {
            create_update: {
              label: "オプション",
              form: {
                placeholder: "オプションを追加",
                errors: {
                  name: {
                    required: "オプション名は必須です。",
                    integrity: "同じ名前のオプションが既に存在します。",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "オプションを選択",
                multi: {
                  default: "オプションを選択",
                  variable: "{count}個のオプションが選択されました",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "成功！",
              message: "プロパティ{name}が正常に作成されました。",
            },
            error: {
              title: "エラー！",
              message: "プロパティの作成に失敗しました。もう一度お試しください！",
            },
          },
          update: {
            success: {
              title: "成功！",
              message: "プロパティ{name}が正常に更新されました。",
            },
            error: {
              title: "エラー！",
              message: "プロパティの更新に失敗しました。もう一度お試しください！",
            },
          },
          delete: {
            success: {
              title: "成功！",
              message: "プロパティ{name}が正常に削除されました。",
            },
            error: {
              title: "エラー！",
              message: "プロパティの削除に失敗しました。もう一度お試しください！",
            },
          },
          enable_disable: {
            loading: "プロパティ{name}を{action}中",
            success: {
              title: "成功！",
              message: "プロパティ{name}が正常に{action}されました。",
            },
            error: {
              title: "エラー！",
              message: "プロパティの{action}に失敗しました。もう一度お試しください！",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "タイトル",
            },
            description: {
              placeholder: "説明",
            },
          },
          errors: {
            name: {
              required: "プロパティに名前を付ける必要があります。",
              max_length: "プロパティ名は255文字を超えることはできません。",
            },
            property_type: {
              required: "プロパティタイプを選択する必要があります。",
            },
            options: {
              required: "少なくとも1つのオプションを追加する必要があります。",
            },
            formula: {
              required: "数式の式が必要です。",
              invalid: "無効な数式: {error}",
              circular_reference:
                "循環参照が検出されました。数式は直接的にも間接的にも自身を参照することはできません。",
              invalid_reference: "数式が存在しないプロパティを参照しています。",
            },
          },
        },
        formula: {
          field_label: "数式フィールド",
          tooltip:
            "'{'フィールド名'}'の構文を使用して数式を入力してください。+、-、*、/、&の演算子をサポートしています。",
          placeholder: "数式を入力",
          test_button: "テスト",
          validating: "検証中",
          validation_success: "数式は有効です！{resultType}を返します",
          validation_success_with_refs: "数式は有効です！{resultType}を返します（{count}フィールド参照）",
          error: {
            empty: "数式を入力してください",
            missing_context: "ワークスペース、プロジェクト、またはワークアイテムタイプのコンテキストがありません",
            validation_failed: "検証に失敗しました",
          },
          picker: {
            no_match: "一致するプロパティがありません",
            no_available: "利用可能なプロパティがありません",
          },
        },
        enable_disable: {
          label: "アクティブ",
          tooltip: {
            disabled: "クリックして無効化",
            enabled: "クリックして有効化",
          },
        },
        delete_confirmation: {
          title: "このプロパティを削除",
          description: "プロパティの削除は既存のデータの損失につながる可能性があります。",
          secondary_description: "代わりにプロパティを無効化しますか？",
          primary_button: "{action}、削除します",
          secondary_button: "はい、無効化します",
        },
        mandate_confirmation: {
          label: "必須プロパティ",
          content:
            "このプロパティにはデフォルトオプションが設定されているようです。プロパティを必須にすると、デフォルト値が削除され、ユーザーは自分で値を選択する必要があります。",
          tooltip: {
            disabled: "このプロパティタイプは必須にできません",
            enabled: "チェックを外して任意フィールドにする",
            checked: "チェックして必須フィールドにする",
          },
        },
        empty_state: {
          title: "カスタムプロパティを追加",
          description: "この作業項目タイプに追加する新しいプロパティがここに表示されます。",
        },
      },
      item_delete_confirmation: {
        title: "このタイプを削除",
        description: "タイプの削除は既存データの損失につながる可能性があります。",
        primary_button: "はい、削除します",
        toast: {
          success: {
            title: "成功！",
            message: "作業項目のタイプが正常に削除されました。",
          },
          error: {
            title: "エラー！",
            message: "作業項目のタイプを削除できませんでした。もう一度お試しください！",
          },
        },
        can_disable_warning: "代わりにタイプを無効にしますか？",
      },
      cant_delete_default_message:
        "この作業項目タイプは削除できません。このプロジェクトのデフォルトの作業項目タイプとして設定されているためです。",
    },
    create: {
      title: "作業項目タイプを作成",
      button: "作業項目タイプを追加",
      toast: {
        success: {
          title: "成功！",
          message: "作業項目タイプが正常に作成されました。",
        },
        error: {
          title: "エラー！",
          message: {
            conflict: "{name} タイプはすでに存在します。別の名前を選んでください。",
          },
        },
      },
    },
    update: {
      title: "作業項目タイプを更新",
      button: "作業項目タイプを更新",
      toast: {
        success: {
          title: "成功！",
          message: "作業項目タイプ{name}が正常に更新されました。",
        },
        error: {
          title: "エラー！",
          message: {
            conflict: "{name} タイプはすでに存在します。別の名前を選んでください。",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "この作業項目タイプに一意の名前を付けてください",
        },
        description: {
          placeholder: "この作業項目タイプの目的と使用時期について説明してください。",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "作業項目タイプ{name}を{action}中",
        success: {
          title: "成功！",
          message: "作業項目タイプ{name}が正常に{action}されました。",
        },
        error: {
          title: "エラー！",
          message: "作業項目タイプの{action}に失敗しました。もう一度お試しください！",
        },
      },
      tooltip: "クリックして{action}",
    },
    change_confirmation: {
      title: "作業項目タイプを変更しますか？",
      description:
        "作業項目タイプを変更すると、現在のタイプに固有のカスタムプロパティ値が失われる可能性があります。この操作は元に戻せません。",
      button: {
        loading: "変更中",
        default: "タイプを変更",
      },
    },
    empty_state: {
      enable: {
        title: "作業項目タイプを有効化",
        description:
          "作業項目タイプで作業項目を形作ります。アイコン、背景、プロパティでカスタマイズし、このプロジェクト用に設定します。",
        primary_button: {
          text: "有効化",
        },
        confirmation: {
          title: "一度有効化すると、作業項目タイプは無効化できません。",
          description:
            "PlaneのWork itemがこのプロジェクトのデフォルトの作業項目タイプとなり、そのアイコンと背景がこのプロジェクトに表示されます。",
          button: {
            default: "有効化",
            loading: "設定中",
          },
        },
      },
      get_pro: {
        title: "作業項目タイプを有効化するにはProにアップグレードしてください。",
        description:
          "作業項目タイプで作業項目を形作ります。アイコン、背景、プロパティでカスタマイズし、このプロジェクト用に設定します。",
        primary_button: {
          text: "Proを取得",
        },
      },
      upgrade: {
        title: "作業項目タイプを有効化するにはアップグレードしてください。",
        description:
          "作業項目タイプで作業項目を形作ります。アイコン、背景、プロパティでカスタマイズし、このプロジェクト用に設定します。",
        primary_button: {
          text: "アップグレード",
        },
      },
    },
  },
  importers: {
    imports: "インポート",
    logo: "ロゴ",
    import_message: "{serviceName}のデータをPlaneプロジェクトにインポートします。",
    deactivate: "無効化",
    deactivating: "無効化中",
    migrating: "移行中",
    migrations: "移行",
    refreshing: "更新中",
    import: "インポート",
    serial_number: "番号",
    project: "プロジェクト",
    workspace: "ワークスペース",
    status: "ステータス",
    summary: "概要",
    total_batches: "合計バッチ数",
    imported_batches: "インポート済みバッチ",
    re_run: "再実行",
    cancel: "キャンセル",
    start_time: "開始時間",
    no_jobs_found: "ジョブが見つかりません",
    no_project_imports: "まだ{serviceName}プロジェクトをインポートしていません。",
    cancel_import_job: "インポートジョブをキャンセル",
    cancel_import_job_confirmation:
      "このインポートジョブをキャンセルしてもよろしいですか？このプロジェクトのインポートプロセスが停止します。",
    re_run_import_job: "インポートジョブを再実行",
    re_run_import_job_confirmation:
      "このインポートジョブを再実行してもよろしいですか？このプロジェクトのインポートプロセスが再開されます。",
    upload_csv_file: "ユーザーデータをインポートするためにCSVファイルをアップロードしてください。",
    connect_importer: "{serviceName}に接続",
    migration_assistant: "移行アシスタント",
    migration_assistant_description: "強力なアシスタントで{serviceName}プロジェクトをPlaneにシームレスに移行します。",
    token_helper: "これはあなたの以下から取得できます",
    personal_access_token: "個人アクセストークン",
    source_token_expired: "トークンの有効期限切れ",
    source_token_expired_description:
      "提供されたトークンの有効期限が切れています。無効化して新しい認証情報で再接続してください。",
    user_email: "ユーザーメール",
    select_state: "状態を選択",
    select_service_project: "{serviceName}プロジェクトを選択",
    loading_service_projects: "{serviceName}プロジェクトを読み込み中",
    select_service_workspace: "{serviceName}ワークスペースを選択",
    loading_service_workspaces: "{serviceName}ワークスペースを読み込み中",
    select_priority: "優先度を選択",
    select_service_team: "{serviceName}チームを選択",
    add_seat_msg_free_trial:
      "未登録の{additionalUserCount}人のユーザーをインポートしようとしていますが、現在のプランでは{currentWorkspaceSubscriptionAvailableSeats}席しか利用できません。インポートを続けるにはアップグレードしてください。",
    add_seat_msg_paid:
      "未登録の{additionalUserCount}人のユーザーをインポートしようとしていますが、現在のプランでは{currentWorkspaceSubscriptionAvailableSeats}席しか利用できません。インポートを続けるには少なくとも{extraSeatRequired}席追加購入してください。",
    skip_user_import_title: "ユーザーデータのインポートをスキップ",
    skip_user_import_description:
      "ユーザーのインポートをスキップすると、{serviceName}からの作業項目、コメント、その他のデータはPlaneで移行を実行しているユーザーによって作成されます。後でユーザーを手動で追加することもできます。",
    invalid_pat: "無効な個人アクセストークン",
  },
  integrations: {
    integrations: "インテグレーション",
    loading: "読み込み中",
    unauthorized: "このページを表示する権限がありません。",
    configure: "設定",
    not_enabled: "{name}はこのワークスペースで有効になっていません。",
    not_configured: "未設定",
    disconnect_personal_account: "個人{providerName}アカウントを切断",
    not_configured_message_admin:
      "{name}インテグレーションが設定されていません。インスタンス管理者に設定を依頼してください。",
    not_configured_message_support: "{name}インテグレーションが設定されていません。サポートに設定を依頼してください。",
    external_api_unreachable: "外部APIにアクセスできません。後でもう一度お試しください。",
    error_fetching_supported_integrations:
      "サポートされているインテグレーションを取得できません。後でもう一度お試しください。",
    back_to_integrations: "インテグレーションに戻る",
    select_state: "状態を選択",
    set_state: "状態を設定",
    choose_project: "プロジェクトを選択...",
    skip_backward_state_movement: "PRの更新により課題が以前の状態に戻ることを防ぐ",
  },
  github_integration: {
    name: "GitHub",
    description: "GitHubの作業項目をPlaneと連携・同期します。",
    connect_org: "Connect Organization",
    connect_org_description: "GitHub組織をPlaneと連携します。",
    processing: "処理中",
    org_added_desc: "GitHub orgが追加された時間",
    connection_fetch_error: "サーバーから接続詳細の取得に失敗しました",
    personal_account_connected: "個人アカウントが接続されました",
    personal_account_connected_description: "あなたのGitHubアカウントがPlaneに接続されました",
    connect_personal_account: "個人アカウントを接続",
    connect_personal_account_description: "個人GitHubアカウントをPlaneと連携します。",
    repo_mapping: "リポジトリマッピング",
    repo_mapping_description: "GitHubリポジトリをPlaneプロジェクトにマッピングします。",
    project_issue_sync: "プロジェクトIssue同期",
    project_issue_sync_description: "GitHubからPlaneプロジェクトへIssueを同期します。",
    project_issue_sync_empty_state: "マッピングされたプロジェクトIssue同期がここに表示されます",
    configure_project_issue_sync_state: "Issue同期状態を設定",
    select_issue_sync_direction: "Issue同期方向を選択",
    allow_bidirectional_sync: "双方向 - GitHubとPlaneの両方からIssueとコメントを同期",
    allow_unidirectional_sync: "単方向 - GitHubからPlaneへのIssueとコメントの同期のみ",
    allow_unidirectional_sync_warning:
      "GitHub Issueのデータが、リンクされたPlaneワークアイテムのデータを置き換えます（GitHub → Planeのみ）",
    remove_project_issue_sync: "プロジェクトIssue同期を削除",
    remove_project_issue_sync_confirmation: "このプロジェクトIssue同期を削除してもよろしいですか？",
    add_pr_state_mapping: "Planeプロジェクトのプルリクエスト状態マッピングを追加",
    edit_pr_state_mapping: "Planeプロジェクトのプルリクエスト状態マッピングを編集",
    pr_state_mapping: "プルリクエスト状態マッピング",
    pr_state_mapping_description: "GitHubからPlaneプロジェクトへのプルリクエスト状態マッピングを設定",
    pr_state_mapping_empty_state: "マッピングされたPR状態がここに表示されます",
    remove_pr_state_mapping: "プルリクエスト状態マッピングを削除",
    remove_pr_state_mapping_confirmation: "このプルリクエスト状態マッピングを削除してもよろしいですか？",
    issue_sync_message: "作業項目が{project}に同期されました",
    link: "GitHubリポジトリをPlaneプロジェクトにリンク",
    pull_request_automation: "プルリクエスト自動化",
    pull_request_automation_description: "GitHubからPlaneプロジェクトへのプルリクエスト状態マッピングを設定",
    DRAFT_MR_OPENED: "下書きMRがオープンされたとき、状態を次に設定",
    MR_OPENED: "MRがオープンされたとき、状態を次に設定",
    MR_READY_FOR_MERGE: "マージ準備完了",
    MR_REVIEW_REQUESTED: "レビュー要求",
    MR_MERGED: "マージされた",
    MR_CLOSED: "クローズ",
    ISSUE_OPEN: "Issueオープン",
    ISSUE_CLOSED: "Issueクローズ",
    save: "保存",
    start_sync: "同期を開始",
    choose_repository: "リポジトリを選択...",
  },
  gitlab_integration: {
    name: "GitLab",
    description: "GitLabのマージリクエストをPlaneと連携・同期します。",
    connection_fetch_error: "サーバーから接続詳細の取得に失敗しました",
    connect_org: "組織を接続",
    connect_org_description: "GitLab組織をPlaneと接続します。",
    project_connections: "GitLabプロジェクト接続",
    project_connections_description: "GitLabからPlaneプロジェクトへマージリクエストを同期します。",
    plane_project_connection: "Planeプロジェクト接続",
    plane_project_connection_description: "GitLabからPlaneプロジェクトへのプルリクエスト状態マッピングを設定",
    remove_connection: "接続を削除",
    remove_connection_confirmation: "この接続を削除してもよろしいですか？",
    link: "GitLabリポジトリをPlaneプロジェクトにリンク",
    pull_request_automation: "プルリクエスト自動化",
    pull_request_automation_description: "GitLabからPlaneへのプルリクエスト状態マッピングを設定",
    DRAFT_MR_OPENED: "下書きMRがオープンされたとき、状態を次に設定",
    MR_OPENED: "MRがオープンされたとき、状態を次に設定",
    MR_REVIEW_REQUESTED: "MRのレビューが要求されたとき、状態を次に設定",
    MR_READY_FOR_MERGE: "MRがマージ準備完了のとき、状態を次に設定",
    MR_MERGED: "MRがマージされたとき、状態を次に設定",
    MR_CLOSED: "MRがクローズされたとき、状態を次に設定",
    integration_enabled_text: "GitLabインテグレーションを有効にすると、作業項目のワークフローを自動化できます",
    choose_entity: "エンティティを選択",
    choose_project: "プロジェクトを選択",
    link_plane_project: "Planeプロジェクトをリンク",
    project_issue_sync: "プロジェクト課題同期",
    project_issue_sync_description: "GitlabからPlaneプロジェクトに課題を同期します",
    project_issue_sync_empty_state: "マッピングされたプロジェクト課題同期がここに表示されます",
    configure_project_issue_sync_state: "課題同期状態を設定",
    select_issue_sync_direction: "課題同期の方向を選択",
    allow_bidirectional_sync: "双方向 - GitlabとPlane間で課題とコメントを双方向に同期",
    allow_unidirectional_sync: "一方向 - GitlabからPlaneへのみ課題とコメントを同期",
    allow_unidirectional_sync_warning:
      "Gitlab Issueのデータがリンクされた Plane ワークアイテムのデータを置き換えます（Gitlab → Planeのみ）",
    remove_project_issue_sync: "このプロジェクト課題同期を削除",
    remove_project_issue_sync_confirmation: "このプロジェクト課題同期を削除してもよろしいですか？",
    ISSUE_OPEN: "課題オープン",
    ISSUE_CLOSED: "課題クローズ",
    save: "保存",
    start_sync: "同期開始",
    choose_repository: "リポジトリを選択...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Gitlab EnterpriseインスタンスをPlaneと接続・同期します。",
    app_form_title: "Gitlab Enterprise設定",
    app_form_description: "Gitlab EnterpriseをPlaneに接続するよう設定します。",
    base_url_title: "ベースURL",
    base_url_description: "Gitlab EnterpriseインスタンスのベースURL。",
    base_url_placeholder: '例："https://glab.plane.town"',
    base_url_error: "ベースURLは必須です",
    invalid_base_url_error: "無効なベースURL",
    client_id_title: "アプリID",
    client_id_description: "Gitlab Enterpriseインスタンスで作成したアプリのID。",
    client_id_placeholder: '例："7cd732xxxxxxxxxxxxxx"',
    client_id_error: "アプリIDは必須です",
    client_secret_title: "クライアントシークレット",
    client_secret_description: "Gitlab Enterpriseインスタンスで作成したアプリのクライアントシークレット。",
    client_secret_placeholder: '例："gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "クライアントシークレットは必須です",
    webhook_secret_title: "Webhookシークレット",
    webhook_secret_description:
      "Gitlab EnterpriseインスタンスからのWebhookを検証するために使用されるランダムなWebhookシークレット。",
    webhook_secret_placeholder: '例："webhook1234567890"',
    webhook_secret_error: "Webhookシークレットは必須です",
    connect_app: "アプリを接続",
  },
  slack_integration: {
    name: "Slack",
    description: "SlackワークスペースをPlaneと接続します。",
    connect_personal_account: "個人Slackアカウントを接続します。",
    personal_account_connected: "あなたの個人{providerName}アカウントがPlaneに接続されました。",
    link_personal_account: "あなたの個人{providerName}アカウントをPlaneにリンクします。",
    connected_slack_workspaces: "接続済みSlackワークスペース",
    connected_on: "{date}に接続",
    disconnect_workspace: "{name}ワークスペースを切断",
    alerts: {
      dm_alerts: {
        title: "重要な更新、リマインダー、あなた専用のアラートについて、SlackのDMで通知を受け取ります。",
      },
    },
    project_updates: {
      title: "プロジェクトアップデート",
      description: "プロジェクトのアップデート通知を設定します",
      add_new_project_update: "新しいプロジェクトアップデート通知を追加",
      project_updates_empty_state: "Slackチャンネルに接続されたプロジェクトがここに表示されます。",
      project_updates_form: {
        title: "プロジェクトアップデートを設定",
        description: "作業項目が作成されたときにSlackでプロジェクトアップデート通知を受け取る",
        failed_to_load_channels: "Slackからチャンネルを読み込めませんでした",
        project_dropdown: {
          placeholder: "プロジェクトを選択",
          label: "Planeプロジェクト",
          no_projects: "利用可能なプロジェクトがありません",
        },
        channel_dropdown: {
          label: "Slackチャンネル",
          placeholder: "チャンネルを選択",
          no_channels: "利用可能なチャンネルがありません",
        },
        all_projects_connected: "すべてのプロジェクトはすでにSlackチャンネルに接続されています。",
        all_channels_connected: "すべてのSlackチャンネルはすでにプロジェクトに接続されています。",
        project_connection_success: "プロジェクト接続が正常に作成されました",
        project_connection_updated: "プロジェクト接続が正常に更新されました",
        project_connection_deleted: "プロジェクト接続が正常に削除されました",
        failed_delete_project_connection: "プロジェクト接続の削除に失敗しました",
        failed_create_project_connection: "プロジェクト接続の作成に失敗しました",
        failed_upserting_project_connection: "プロジェクト接続の更新に失敗しました",
        failed_loading_project_connections:
          "プロジェクト接続を読み込めませんでした。ネットワークの問題または統合の問題が原因かもしれません。",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "SentryワークスペースをPlaneに接続します。",
    connected_sentry_workspaces: "接続されたSentryワークスペース",
    connected_on: "{date}に接続",
    disconnect_workspace: "{name}ワークスペースを切断",
    state_mapping: {
      title: "状態マッピング",
      description:
        "Sentryインシデントの状態をプロジェクトの状態にマッピングします。Sentryインシデントが解決されたり未解決の場合に使用する状態を設定します。",
      add_new_state_mapping: "新しい状態マッピングを追加",
      empty_state:
        "状態マッピングが設定されていません。Sentryインシデントの状態をプロジェクトの状態と同期するための最初のマッピングを作成してください。",
      failed_loading_state_mappings:
        "状態マッピングを読み込めませんでした。ネットワークの問題または統合の問題が原因である可能性があります。",
      loading_project_states: "プロジェクトの状態を読み込み中...",
      error_loading_states: "状態の読み込みエラー",
      no_states_available: "利用可能な状態がありません",
      no_permission_states: "このプロジェクトの状態にアクセスする権限がありません",
      states_not_found: "プロジェクトの状態が見つかりません",
      server_error_states: "状態の読み込み中にサーバーエラーが発生しました",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "GitHub Enterpriseの組織をPlaneと連携・同期します。",
    app_form_title: "GitHub Enterpriseの設定",
    app_form_description: "GitHub EnterpriseをPlaneと連携するための設定を行います。",
    app_id_title: "App ID",
    app_id_description: "GitHub Enterpriseの組織に作成したAppのIDです。",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App IDは必須です",
    app_name_title: "App Slug",
    app_name_description: "GitHub Enterpriseの組織に作成したAppのSlugです。",
    app_name_error: "App slugは必須です",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "Base URL",
    base_url_description: "GitHub Enterpriseの組織のBase URLです。",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "Base URLは必須です",
    invalid_base_url_error: "Base URLが無効です",
    client_id_title: "Client ID",
    client_id_description: "GitHub Enterpriseの組織に作成したAppのClient IDです。",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "Client IDは必須です",
    client_secret_title: "Client Secret",
    client_secret_description: "GitHub Enterpriseの組織に作成したAppのClient Secretです。",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Client Secretは必須です",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "GitHub Enterpriseの組織に作成したAppのWebhook Secretです。",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Webhook Secretは必須です",
    private_key_title: "Private Key (Base64 encoded)",
    private_key_description: "GitHub Enterpriseの組織に作成したAppのPrivate Keyです。",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Private Keyは必須です",
    connect_app: "Appを接続",
  },
  file_upload: {
    upload_text: "クリックしてファイルをアップロード",
    drag_drop_text: "ドラッグ＆ドロップ",
    processing: "処理中",
    invalid: "無効なファイル形式",
    missing_fields: "必須フィールドが不足しています",
    success: "{fileName}がアップロードされました！",
  },
  silo_errors: {
    invalid_query_params: "提供されたクエリパラメータが無効か、必須フィールドが不足しています",
    invalid_installation_account: "提供されたインストールアカウントが無効です",
    generic_error: "リクエストの処理中に予期せぬエラーが発生しました",
    connection_not_found: "要求された接続が見つかりませんでした",
    multiple_connections_found: "1つの接続が期待される場合に複数の接続が見つかりました",
    installation_not_found: "要求されたインストールが見つかりませんでした",
    user_not_found: "要求されたユーザーが見つかりませんでした",
    error_fetching_token: "認証トークンの取得に失敗しました",
    cannot_create_multiple_connections:
      "あなたはすでに組織をワークスペースと接続しています。新しい接続を作成する前に、既存の接続を切断してください。",
    invalid_app_credentials: "提供されたアプリの資格情報が無効です",
    invalid_app_installation_id: "アプリのインストールに失敗しました",
  },
  import_status: {
    queued: "キューに登録済み",
    created: "作成済み",
    initiated: "開始済み",
    pulling: "取得中",
    timed_out: "タイムアウト",
    pulled: "取得済み",
    transforming: "変換中",
    transformed: "変換済み",
    pushing: "送信中",
    finished: "完了",
    error: "エラー",
    cancelled: "キャンセル済み",
  },
  jira_importer: {
    jira_importer_description: "JiraのデータをPlaneプロジェクトにインポートします。",
    create_project_automatically: "プロジェクトを自動的に作成する",
    create_project_automatically_description: "Jiraのプロジェクト詳細に基づいて、新しいプロジェクトを作成します。",
    import_to_existing_project: "既存のプロジェクトにインポートする",
    import_to_existing_project_description: "下のドロップダウンメニューから既存のプロジェクトを選択してください。",
    state_mapping_automatic_creation: "すべてのJiraステータスがPlaneで自動的に作成されます。",
    personal_access_token: "個人アクセストークン",
    user_email: "ユーザーメール",
    atlassian_security_settings: "Atlassianセキュリティ設定",
    email_description: "これは個人アクセストークンに紐付けられたメールアドレスです",
    jira_domain: "Jiraドメイン",
    jira_domain_description: "これはあなたのJiraインスタンスのドメインです",
    steps: {
      title_configure_plane: "Planeを設定",
      description_configure_plane:
        "まずJiraデータを移行したいPlaneプロジェクトを作成してください。プロジェクトを作成したら、ここで選択してください。",
      title_configure_jira: "Jiraを設定",
      description_configure_jira: "データを移行したいJiraワークスペースを選択してください。",
      title_import_users: "ユーザーをインポート",
      description_import_users:
        "JiraからPlaneに移行したいユーザーを追加してください。または、このステップをスキップして後でユーザーを手動で追加することもできます。",
      title_map_states: "状態をマッピング",
      description_map_states:
        "Jiraのステータスを可能な限り自動的にPlaneの状態にマッチングしました。残りの状態をマッピングしてから進めてください。状態を作成して手動でマッピングすることもできます。",
      title_map_priorities: "優先度をマッピング",
      description_map_priorities:
        "優先度を可能な限り自動的にマッチングしました。残りの優先度をマッピングしてから進めてください。",
      title_summary: "サマリー",
      description_summary: "JiraからPlaneに移行されるデータのサマリーです。",
      custom_jql_filter: "カスタム JQL フィルター",
      jql_filter_description: "JQLを使用して、インポートする特定の課題をフィルタリングします。",
      project_code: "プロジェクト",
      enter_filters_placeholder: "フィルターを入力 (例: status = 'In Progress')",
      validating_query: "クエリを検証中...",
      validation_successful_work_items_selected: "検証に成功しました。{count} 件の作業項目が選択されました。",
      run_syntax_check: "構文チェックを実行してクエリを確認する",
      refresh: "更新",
      check_syntax: "構文チェック",
      no_work_items_selected: "クエリによって選択された作業項目はありません。",
      validation_error_default: "クエリの検証中に問題が発生しました。",
    },
  },
  asana_importer: {
    asana_importer_description: "AsanaのデータをPlaneプロジェクトにインポートします。",
    select_asana_priority_field: "Asana優先度フィールドを選択",
    steps: {
      title_configure_plane: "Planeを設定",
      description_configure_plane:
        "まずAsanaデータを移行したいPlaneプロジェクトを作成してください。プロジェクトを作成したら、ここで選択してください。",
      title_configure_asana: "Asanaを設定",
      description_configure_asana: "データを移行したいAsanaワークスペースとプロジェクトを選択してください。",
      title_map_states: "状態をマッピング",
      description_map_states: "PlaneプロジェクトのステータスにマッピングしたいAsanaの状態を選択してください。",
      title_map_priorities: "優先度をマッピング",
      description_map_priorities: "Planeプロジェクトの優先度にマッピングしたいAsanaの優先度を選択してください。",
      title_summary: "サマリー",
      description_summary: "AsanaからPlaneに移行されるデータのサマリーです。",
    },
  },
  linear_importer: {
    linear_importer_description: "LinearのデータをPlaneプロジェクトにインポートします。",
    steps: {
      title_configure_plane: "Planeを設定",
      description_configure_plane:
        "まずLinearデータを移行したいPlaneプロジェクトを作成してください。プロジェクトを作成したら、ここで選択してください。",
      title_configure_linear: "Linearを設定",
      description_configure_linear: "データを移行したいLinearチームを選択してください。",
      title_map_states: "状態をマッピング",
      description_map_states:
        "Linearのステータスを可能な限り自動的にPlaneの状態にマッチングしました。残りの状態をマッピングしてから進めてください。状態を作成して手動でマッピングすることもできます。",
      title_map_priorities: "優先度をマッピング",
      description_map_priorities: "Planeプロジェクトの優先度にマッピングしたいLinearの優先度を選択してください。",
      title_summary: "サマリー",
      description_summary: "LinearからPlaneに移行されるデータのサマリーです。",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Jira Server/Data CenterのデータをPlaneプロジェクトにインポートします。",
    steps: {
      title_configure_plane: "Planeを設定",
      description_configure_plane:
        "まずJiraデータを移行したいPlaneプロジェクトを作成してください。プロジェクトを作成したら、ここで選択してください。",
      title_configure_jira: "Jiraを設定",
      description_configure_jira: "データを移行したいJiraワークスペースを選択してください。",
      title_map_states: "状態をマッピング",
      description_map_states: "PlaneプロジェクトのステータスにマッピングしたいJiraの状態を選択してください。",
      title_map_priorities: "優先度をマッピング",
      description_map_priorities: "Planeプロジェクトの優先度にマッピングしたいJiraの優先度を選択してください。",
      title_summary: "サマリー",
      description_summary: "JiraからPlaneに移行されるデータのサマリーです。",
    },
    import_epics: {
      title: "エピックを作業アイテムとしてインポートする",
      description:
        "これを有効にすると、エピックはエピック作業アイテムタイプを持つ作業アイテムとしてインポートされます。",
    },
  },
  notion_importer: {
    notion_importer_description: "NotionデータをPlaneプロジェクトにインポートします。",
    steps: {
      title_upload_zip: "Notion エクスポート ZIP をアップロード",
      description_upload_zip: "Notionデータを含むZIPファイルをアップロードしてください。",
    },
    upload: {
      drop_file_here: "Notion zip ファイルをここにドロップ",
      upload_title: "Notion エクスポートをアップロード",
      upload_from_url: "URLからインポート",
      upload_from_url_description: "ZIPエクスポートの公開URLを貼り付けて続行してください。",
      drag_drop_description: "Notion エクスポート zip ファイルをドラッグ＆ドロップするか、クリックして参照",
      file_type_restriction: "Notionからエクスポートされた.zipファイルのみサポートされています",
      select_file: "ファイルを選択",
      uploading: "アップロード中...",
      preparing_upload: "アップロードを準備中...",
      confirming_upload: "アップロードを確認中...",
      confirming: "確認中...",
      upload_complete: "アップロード完了",
      upload_failed: "アップロード失敗",
      start_import: "インポートを開始",
      retry_upload: "アップロードを再試行",
      upload: "アップロード",
      ready: "準備完了",
      error: "エラー",
      upload_complete_message: "アップロード完了！",
      upload_complete_description: "「インポートを開始」をクリックして、Notionデータの処理を開始してください。",
      upload_progress_message: "このウィンドウを閉じないでください。",
    },
  },
  confluence_importer: {
    confluence_importer_description: "ConfluenceデータをPlaneウィキにインポートします。",
    steps: {
      title_upload_zip: "Confluence エクスポート ZIP をアップロード",
      description_upload_zip: "Confluenceデータを含むZIPファイルをアップロードしてください。",
    },
    upload: {
      drop_file_here: "Confluence zip ファイルをここにドロップ",
      upload_title: "Confluence エクスポートをアップロード",
      upload_from_url: "URLからインポート",
      upload_from_url_description: "ZIPエクスポートの公開URLを貼り付けて続行してください。",
      drag_drop_description: "Confluence エクスポート zip ファイルをドラッグ＆ドロップするか、クリックして参照",
      file_type_restriction: "Confluenceからエクスポートされた.zipファイルのみサポートされています",
      select_file: "ファイルを選択",
      uploading: "アップロード中...",
      preparing_upload: "アップロードを準備中...",
      confirming_upload: "アップロードを確認中...",
      confirming: "確認中...",
      upload_complete: "アップロード完了",
      upload_failed: "アップロード失敗",
      start_import: "インポートを開始",
      retry_upload: "アップロードを再試行",
      upload: "アップロード",
      ready: "準備完了",
      error: "エラー",
      upload_complete_message: "アップロード完了！",
      upload_complete_description: "「インポートを開始」をクリックして、Confluenceデータの処理を開始してください。",
      upload_progress_message: "このウィンドウを閉じないでください。",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "CSVデータをPlaneプロジェクトにインポートします。",
    steps: {
      title_configure_plane: "Planeを設定",
      description_configure_plane:
        "まずCSVデータを移行したいPlaneプロジェクトを作成してください。プロジェクトを作成したら、ここで選択してください。",
      title_configure_csv: "CSVを設定",
      description_configure_csv:
        "CSVファイルをアップロードし、Planeのフィールドにマッピングするフィールドを設定してください。",
    },
  },
  csv_importer: {
    csv_importer_description: "CSVファイルからPlaneプロジェクトにワークアイテムをインポートします。",
    steps: {
      title_select_project: "プロジェクトを選択",
      description_select_project: "ワークアイテムをインポートするPlaneプロジェクトを選択してください。",
      title_upload_csv: "CSVをアップロード",
      description_upload_csv:
        "ワークアイテムを含むCSVファイルをアップロードしてください。ファイルには、名前、説明、優先度、日付、およびステータスグループの列が含まれている必要があります。",
    },
  },
  clickup_importer: {
    clickup_importer_description: "ClickUpのデータをPlaneプロジェクトにインポートします。",
    select_service_space: "{serviceName}スペースを選択",
    select_service_folder: "{serviceName}フォルダーを選択",
    selected: "選択済み",
    users: "ユーザー",
    steps: {
      title_configure_plane: "Planeを設定",
      description_configure_plane:
        "まずClickUpデータを移行したいPlaneプロジェクトを作成してください。プロジェクトを作成したら、ここで選択してください。",
      title_configure_clickup: "ClickUpを設定",
      description_configure_clickup: "ClickUpチーム、スペース、フォルダーを選択してください。",
      title_map_states: "状態をマッピング",
      description_map_states:
        "ClickUpのステータスを可能な限り自動的にPlaneの状態にマッチングしました。残りの状態をマッピングしてから進めてください。状態を作成して手動でマッピングすることもできます。",
      title_map_priorities: "優先度をマッピング",
      description_map_priorities: "ClickUpの優先度をPlaneの優先度にマッピングしてください。",
      title_summary: "サマリー",
      description_summary: "ClickUpからPlaneに移行されるデータのサマリーです。",
      pull_additional_data_title: "コメントと添付ファイルをインポート",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "バー",
          long_label: "バー チャート",
          chart_models: {
            basic: "ベーシック",
            stacked: "スタックド",
            grouped: "グループド",
          },
          orientation: {
            label: "オリエンテーション",
            horizontal: "ホリゾンタル",
            vertical: "バーティカル",
            placeholder: "オリエンテーション アッド",
          },
          bar_color: "バー カラー",
        },
        line_chart: {
          short_label: "ライン",
          long_label: "ライン チャート",
          chart_models: {
            basic: "ベーシック",
            multi_line: "マルチライン",
          },
          line_color: "ライン カラー",
          line_type: {
            label: "ライン タイプ",
            solid: "ソリッド",
            dashed: "ダッシュド",
            placeholder: "ライン タイプ アッド",
          },
        },
        area_chart: {
          short_label: "エリア",
          long_label: "エリア チャート",
          chart_models: {
            basic: "ベーシック",
            stacked: "スタックド",
            comparison: "コンパリソン",
          },
          fill_color: "フィル カラー",
        },
        donut_chart: {
          short_label: "ドーナツ",
          long_label: "ドーナツ チャート",
          chart_models: {
            basic: "ベーシック",
            progress: "プログレス",
          },
          center_value: "センター バリュー",
          completed_color: "コンプリーテッド カラー",
        },
        pie_chart: {
          short_label: "パイ",
          long_label: "パイ チャート",
          chart_models: {
            basic: "ベーシック",
          },
          group: {
            label: "グループド ピーセズ",
            group_thin_pieces: "グループ シン ピーセズ",
            minimum_threshold: {
              label: "ミニマム スレショルド",
              placeholder: "スレショルド アッド",
            },
            name_group: {
              label: "ネーム グループ",
              placeholder: '"レス ザン 5%"',
            },
          },
          show_values: "ショー バリューズ",
          value_type: {
            percentage: "パーセンテージ",
            count: "カウント",
          },
        },
        text: {
          short_label: "テキスト",
          long_label: "テキスト",
          alignment: {
            label: "テキスト アラインメント",
            left: "レフト",
            center: "センター",
            right: "ライト",
            placeholder: "テキスト アラインメント アッド",
          },
          text_color: "テキスト カラー",
        },
        table_chart: {
          short_label: "表",
          long_label: "表グラフ",
          chart_models: {
            basic: {
              short_label: "基本",
              long_label: "表",
            },
          },
          columns: "列",
          rows: "行",
          rows_placeholder: "行を追加",
          configure_rows_hint: "この表を表示するには行のプロパティを選択してください。",
        },
      },
      color_palettes: {
        modern: "モダン",
        horizon: "ホライゾン",
        earthen: "アーセン",
      },
      common: {
        add_widget: "アッド ウィジェット",
        widget_title: {
          label: "ネーム ディス ウィジェット",
          placeholder: '例: "トゥードゥー イェスタデイ", "オール コンプリート"',
        },
        chart_type: "チャート タイプ",
        visualization_type: {
          label: "ビジュアライゼーション タイプ",
          placeholder: "ビジュアライゼーション タイプ アッド",
        },
        date_group: {
          label: "デート グループ",
          placeholder: "デート グループ アッド",
        },
        group_by: "グループ バイ",
        stack_by: "スタック バイ",
        daily: "デイリー",
        weekly: "ウィークリー",
        monthly: "マンスリー",
        yearly: "イヤーリー",
        work_item_count: "ワーク アイテム カウント",
        estimate_point: "エスティメート ポイント",
        pending_work_item: "ペンディング ワーク アイテムズ",
        completed_work_item: "コンプリーテッド ワーク アイテムズ",
        in_progress_work_item: "イン プログレス ワーク アイテムズ",
        blocked_work_item: "ブロックド ワーク アイテムズ",
        work_item_due_this_week: "ワーク アイテムズ デュー ディス ウィーク",
        work_item_due_today: "ワーク アイテムズ デュー トゥデイ",
        color_scheme: {
          label: "カラー スキーム",
          placeholder: "カラー スキーム アッド",
        },
        smoothing: "スムージング",
        markers: "マーカーズ",
        legends: "レジェンズ",
        tooltips: "ツールチップス",
        opacity: {
          label: "オパシティ",
          placeholder: "オパシティ アッド",
        },
        border: "ボーダー",
        widget_configuration: "ウィジェット コンフィギュレーション",
        configure_widget: "コンフィギュア ウィジェット",
        guides: "ガイズ",
        style: "スタイル",
        area_appearance: "エリア アピアランス",
        comparison_line_appearance: "コンペア ライン アピアランス",
        add_property: "アッド プロパティ",
        add_metric: "アッド メトリック",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
          stacked: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
            group_by: "スタック バイ イズ ミッシング ア バリュー",
          },
          grouped: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
            group_by: "グループ バイ イズ ミッシング ア バリュー",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
          multi_line: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
            group_by: "グループ バイ イズ ミッシング ア バリュー",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
          stacked: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
            group_by: "スタック バイ イズ ミッシング ア バリュー",
          },
          comparison: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
          progress: {
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "エックス アクシス イズ ミッシング ア バリュー",
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
        },
        text: {
          basic: {
            y_axis_metric: "メトリック イズ ミッシング ア バリュー",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "列に値がありません。",
            group_by: "行に値がありません。",
          },
        },
        ask_admin: "アスク ユア アドミン トゥ コンフィギュア ディス ウィジェット",
      },
    },
    create_modal: {
      heading: {
        create: "クリエイト ニュー ダッシュボード",
        update: "アップデート ダッシュボード",
      },
      title: {
        label: "ネーム ユア ダッシュボード",
        placeholder:
          '"キャパシティ アクロス プロジェクツ", "ワークロード バイ チーム", "ステート アクロス オール プロジェクツ"',
        required_error: "タイトル イズ リクワイアド",
      },
      project: {
        label: "チューズ プロジェクツ",
        placeholder: "データ フロム ジーズ プロジェクツ ウィル パワー ディス ダッシュボード",
        required_error: "プロジェクツ アー リクワイアド",
      },
      filters_label: "上記のデータソースにフィルターを設定",
      create_dashboard: "クリエイト ダッシュボード",
      update_dashboard: "アップデート ダッシュボード",
    },
    delete_modal: {
      heading: "デリート ダッシュボード",
    },
    empty_state: {
      feature_flag: {
        title: "プレゼント ユア プログレス イン オンデマンド、フォーエバー ダッシュボーズ",
        description:
          "ビルド エニー ダッシュボード ユー ニード トゥ アンド カスタマイズ ハウ ユア データ ルックス フォー ザ パーフェクト プレゼンテーション オブ ユア プログレス",
        coming_soon_to_mobile: "カミング スーン トゥ ザ モバイル アップ",
        card_1: {
          title: "フォー オール ユア プロジェクツ",
          description:
            "ゲット ア トータル ゴッドビュー オブ ユア ワークスペース ウィズ オール ユア プロジェクツ オア スライス ユア ワーク データ フォー ザット パーフェクト ビュー ユア プログレス",
        },
        card_2: {
          title: "フォー エニー データ イン プレーン",
          description:
            "ゴー ビヨンド アウトオブザボックス アナリティクス アンド レディメイド サイクル チャーツ トゥ ルック アット チームズ、イニシアティブス、オア エニシング エルス ライク ユー ハブント ビフォー",
        },
        card_3: {
          title: "フォー オール ユア データ ビズ ニーズ",
          description:
            "チューズ フロム セベラル カスタマイザブル チャーツ ウィズ ファイングレインド コントロールズ トゥ シー アンド ショー ユア ワーク データ イグザクトリー ハウ ユー ウォント トゥ",
        },
        card_4: {
          title: "オンデマンド アンド パーマネント",
          description:
            "ビルド ワンス、キープ フォーエバー ウィズ オートマティック リフレッシュズ オブ ユア データ、コンテクスチュアル フラッグズ フォー スコープ チェンジズ、アンド シェアラブル パーマリンクス",
        },
        card_5: {
          title: "エクスポーツ アンド スケジュールド コムズ",
          description:
            "フォー ゾーズ タイムズ ウェン リンクス ドント ワーク、ゲット ユア ダッシュボーズ アウト イントゥ ワンタイム ピーディーエフス オア スケジュール ゼム トゥ ビー セント トゥ ステークホルダーズ オートマティカリー",
        },
        card_6: {
          title: "オートレイドアウト フォー オール デバイセズ",
          description:
            "リサイズ ユア ウィジェッツ フォー ザ レイアウト ユー ウォント アンド シー イット ザ イグザクト セイム アクロス モバイル、タブレット、アンド アザー ブラウザーズ",
        },
      },
      dashboards_list: {
        title:
          "ビジュアライズ データ イン ウィジェッツ、ビルド ユア ダッシュボーズ ウィズ ウィジェッツ、アンド シー ザ レイテスト オン デマンド",
        description:
          "ビルド ユア ダッシュボーズ ウィズ カスタム ウィジェッツ ザット ショー ユア データ イン ザ スコープ ユー スペシファイ。ゲット ダッシュボーズ フォー オール ユア ワーク アクロス プロジェクツ アンド チームズ アンド シェア パーマリンクス ウィズ ステークホルダーズ フォー オンデマンド トラッキング",
      },
      dashboards_search: {
        title: "ザット ダズント マッチ ア ダッシュボーズ ネーム",
        description: "メイク シュア ユア クエリー イズ ライト オア トライ アナザー クエリー",
      },
      widgets_list: {
        title: "ビジュアライズ ユア データ ハウ ユー ウォント トゥ",
        description:
          "ユーズ ラインズ、バーズ、パイズ、アンド アザー フォーマッツ トゥ シー ユア データ ザ ウェイ ユー ウォント トゥ フロム ザ ソーセズ ユー スペシファイ",
      },
      widget_data: {
        title: "ナッシング トゥ シー ヒア",
        description: "リフレッシュ オア アッド データ トゥ シー イット ヒア",
      },
    },
    common: {
      editing: "エディティング",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "新しい作業項目を許可",
      work_item_creation_disable_tooltip: "作業項目の作成はこの状態では無効になっています",
      default_state:
        "デフォルトの状態は、すべてのメンバーが新しい作業項目を作成できるように設定されています。これは変更できません",
      state_change_count: "{count, plural, one {1つの許可された状態変更} other {{count}つの許可された状態変更}}",
      movers_count: "{count, plural, one {1人のリストされたレビューア} other {{count}人のリストされたレビューア}}",
      state_changes: {
        label: {
          default: "許可された状態変更を追加",
          loading: "許可された状態変更を追加中",
        },
        move_to: "状態を変更",
        movers: {
          label: "誰によって移動された場合",
          tooltip: "レビューアは、作業項目を一つの状態から別の状態に移動することを許可されている人々です。",
          add: "レビューアを追加",
        },
      },
    },
    workflow_disabled: {
      title: "この作業項目をここに移動できません。",
    },
    workflow_enabled: {
      label: "状態変更",
    },
    workflow_tree: {
      label: "作業項目が",
      state_change_label: "をここに移動できます",
    },
    empty_state: {
      upgrade: {
        title: "変更とレビューの混沌をワークフローで制御。",
        description:
          "Plane内のワークフローで、作業がどこに移動するか、誰によって、そしていつによって移動するかを規則を設定します。",
      },
    },
    quick_actions: {
      view_change_history: "変更履歴を表示",
      reset_workflow: "ワークフローをリセット",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "このワークフローをリセットしてよろしいですか？",
        description:
          "このワークフローをリセットすると、すべての状態変更ルールが削除され、このプロジェクトで再度実行するために再作成が必要になります。",
      },
      delete_state_change: {
        title: "この状態変更ルールを削除してよろしいですか？",
        description: "削除すると、変更ができなくなり、このプロジェクトで再度実行するために再設定が必要になります。",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action}ワークフロー",
        success: {
          title: "成功",
          message: "ワークフローが{action}されました",
        },
        error: {
          title: "エラー",
          message: "ワークフローが{action}できませんでした。もう一度お試しください。",
        },
      },
      reset: {
        success: {
          title: "成功",
          message: "ワークフローがリセットされました",
        },
        error: {
          title: "ワークフローのリセットエラー",
          message: "ワークフローがリセットできませんでした。もう一度お試しください。",
        },
      },
      add_state_change_rule: {
        error: {
          title: "状態変更ルールの追加エラー",
          message: "状態変更ルールが追加できませんでした。もう一度お試しください。",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "状態変更ルールの変更エラー",
          message: "状態変更ルールが変更できませんでした。もう一度お試しください。",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "状態変更ルールの削除エラー",
          message: "状態変更ルールが削除できませんでした。もう一度お試しください。",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "状態変更ルールのレビューアの変更エラー",
          message: "状態変更ルールのレビューアが変更できませんでした。もう一度お試しください。",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {顧客} other {顧客たち}}",
    dropdown: {
      placeholder: "顧客を選択",
      required: "顧客を選択してください",
      no_selection: "顧客なし",
    },
    upgrade: {
      title: "顧客とともに優先順位をつけて業務を管理しましょう。",
      description: "業務を顧客に関連付け、顧客属性に基づいて優先順位を設定しましょう。",
    },
    properties: {
      default: {
        title: "デフォルトのプロパティ",
        customer_name: {
          name: "顧客名",
          placeholder: "これは人または企業の名前かもしれません",
          validation: {
            required: "顧客名は必須です。",
            max_length: "顧客名は255文字を超えてはいけません。",
          },
        },
        description: {
          name: "説明",
          validation: {},
        },
        email: {
          name: "Eメール",
          placeholder: "メールアドレスを入力してください",
          validation: {
            required: "Eメールは必須です。",
            pattern: "無効なEメールアドレスです。",
          },
        },
        website_url: {
          name: "ウェブサイト",
          placeholder: "https://で始まる任意のURLが機能します。",
          placeholder_short: "ウェブサイトを追加",
          validation: {
            pattern: "無効なウェブサイトのURL",
          },
        },
        employees: {
          name: "従業員数",
          placeholder: "顧客が企業であれば従業員数を入力してください。",
          validation: {
            min_length: "従業員数は0未満であってはなりません。",
            max_length: "従業員数は2147483647を超えてはなりません。",
          },
        },
        size: {
          name: "サイズ",
          placeholder: "企業の規模を追加",
          validation: {
            min_length: "無効なサイズ",
          },
        },
        domain: {
          domain: "業界",
          placeholder: "小売、eコマース、フィンテック、銀行",
          placeholder_short: "業界を追加",
          validation: {},
        },
        stage: {
          name: "ステージ",
          placeholder: "ステージを選択",
          validation: {},
        },
        contract_status: {
          name: "契約状況",
          placeholder: "契約状況を選択",
          validation: {},
        },
        revenue: {
          name: "収益",
          placeholder: "顧客が生成した年間収益です。",
          placeholder_short: "収益を追加",
          validation: {
            min_length: "収益は0未満であってはなりません。",
          },
        },
        invalid_value: "無効なプロパティ値です。",
      },
      custom: {
        title: "カスタムプロパティ",
        info: "顧客の固有の属性をPlaneに追加し、作業項目や顧客記録をより適切に管理しましょう。",
      },
      empty_state: {
        title: "カスタムプロパティを追加",
        description: "手動または自動でCRMにマッピングしたいカスタムプロパティがここに表示されます。",
      },
      add: {
        primary_button: "新しいプロパティを追加",
      },
    },
    stage: {
      lead: "リード",
      sales_qualified_lead: "営業確認済リード",
      contract_negotiation: "契約交渉",
      closed_won: "クロージング完了",
      closed_lost: "クロージング失敗",
    },
    contract_status: {
      active: "アクティブ",
      pre_contract: "契約前",
      signed: "署名済み",
      inactive: "非アクティブ",
    },
    empty_state: {
      detail: {
        title: "この顧客レコードは見つかりませんでした。",
        description: "このリンクが間違っているか、レコードが削除された可能性があります。",
        primary_button: "顧客へ移動",
        secondary_button: "顧客を追加",
      },
      search: {
        title: "その用語に一致する顧客記録が見つかりませんでした。",
        description: "別の検索語を試すか、その用語で結果が表示されるはずだと確信している場合はお問い合わせください。",
      },
      list: {
        title: "顧客の重要な情報に基づいてワークフローの量、ペース、フローを管理します。",
        description:
          "Plane専用の顧客機能を使用すると、新しい顧客をゼロから作成してワークにリンクできます。まもなく、カスタム属性とともに他のツールからインポートできるようになります。",
        primary_button: "最初の顧客を追加",
      },
    },
    settings: {
      unauthorized: "このページにアクセスする権限がありません。",
      description: "ワークフロー内で顧客との関係を監視・管理します。",
      enable: "顧客機能を有効にする",
      toasts: {
        enable: {
          loading: "顧客機能を有効にしています...",
          success: {
            title: "このワークスペースに対して顧客機能を有効にしました。",
            message:
              "メンバーは今、顧客記録を追加し、それを作業項目にリンクするなど、さまざまな操作が可能になりました。",
          },
          error: {
            title: "顧客機能を有効にできませんでした。",
            message: "もう一度お試しください。それでもうまくいかない場合は、サポートに連絡してください。",
            action: "サポートに連絡",
          },
        },
        disable: {
          loading: "顧客機能を無効にしています...",
          success: {
            title: "顧客が無効になりました",
            message: "顧客機能は正常に無効化されました！",
          },
          error: {
            title: "エラー",
            message: "顧客機能を無効にできませんでした！",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "顧客リストを取得できませんでした。",
          message: "もう一度お試しください、またはページを更新してください。",
        },
      },
      copy_link: {
        title: "顧客のリンクをコピーしました。",
        message: "どこにでも貼り付けて、このページに直接戻れます。",
      },
      create: {
        success: {
          title: "{customer_name} が利用可能になりました",
          message: "この顧客を作業項目に参照し、リクエストを追跡できます。",
          actions: {
            view: "表示",
            copy_link: "リンクをコピー",
            copied: "コピーしました！",
          },
        },
        error: {
          title: "このレコードを作成できませんでした。",
          message:
            "もう一度保存してみてください、または保存していないテキストを新しい項目にコピーしてください。別のタブで試してみると良いでしょう。",
        },
      },
      update: {
        success: {
          title: "成功！",
          message: "顧客が正常に更新されました！",
        },
        error: {
          title: "エラー！",
          message: "顧客の更新に失敗しました。もう一度お試しください！",
        },
      },
      logo: {
        error: {
          title: "顧客のロゴを読み込めませんでした。",
          message: "ロゴを再保存するか、最初からやり直してください。",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "この顧客の作業項目を削除しました。",
            message: "この顧客も自動的に作業項目から削除されました。",
          },
          error: {
            title: "エラー！",
            message: "この顧客のレコードからその作業項目を削除できませんでした。",
          },
        },
        add: {
          error: {
            title: "この顧客の作業項目を追加できませんでした。",
            message:
              "もう一度作業項目を追加してみてください。それでもうまくいかない場合は、サポートに連絡してください。",
          },
          success: {
            title: "作業項目をこの顧客のレコードに追加しました。",
            message: "この顧客も自動的に作業項目に追加されました。",
          },
        },
      },
    },
    quick_actions: {
      edit: "編集",
      copy_link: "顧客リンクをコピー",
      delete: "削除",
    },
    create: {
      label: "顧客記録を作成",
      loading: "作成中",
      cancel: "キャンセル",
    },
    update: {
      label: "顧客を更新",
      loading: "更新中",
    },
    delete: {
      title: "顧客記録 {customer_name} を削除してもよろしいですか？",
      description: "この記録に関連するすべてのデータは完全に削除されます。後でこの記録を復元することはできません。",
    },
    requests: {
      empty_state: {
        list: {
          title: "まだリクエストはありません。",
          description: "顧客からリクエストを作成して、それらを作業項目にリンクできます。",
          button: "新しいリクエストを追加",
        },
        search: {
          title: "その用語に一致するリクエストが見つかりませんでした。",
          description: "別の検索語を試すか、その用語で結果が表示されるはずだと確信している場合はお問い合わせください。",
        },
      },
      label: "{count, plural, one {リクエスト} other {リクエストたち}}",
      add: "リクエストを追加",
      create: "リクエストを作成",
      update: "リクエストを更新",
      form: {
        name: {
          placeholder: "このリクエストに名前を付けてください",
          validation: {
            required: "名前は必須です。",
            max_length: "リクエストの名前は255文字以内である必要があります。",
          },
        },
        description: {
          placeholder: "リクエストの性質を記述するか、他のツールからこの顧客のコメントを貼り付けてください。",
        },
        source: {
          add: "ソースを追加",
          update: "ソースを更新",
          url: {
            label: "URL",
            required: "URLは必須です",
            invalid: "無効なウェブサイトのURL",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "リンクをコピーしました",
          message: "顧客のリクエストのリンクがクリップボードにコピーされました。",
        },
        attachment: {
          upload: {
            loading: "添付ファイルのアップロード中...",
            success: {
              title: "添付ファイルのアップロード成功",
              message: "添付ファイルが正常にアップロードされました。",
            },
            error: {
              title: "添付ファイルのアップロード失敗",
              message: "添付ファイルをアップロードできませんでした。",
            },
          },
          size: {
            error: {
              title: "エラー！",
              message: "一度に1つのファイルしかアップロードできません。",
            },
          },
          length: {
            message: "ファイルは{size}MB以内でなければなりません",
          },
          remove: {
            success: {
              title: "添付ファイルを削除しました",
              message: "添付ファイルが正常に削除されました",
            },
            error: {
              title: "添付ファイルを削除できません",
              message: "添付ファイルを削除できませんでした",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "成功！",
              message: "ソースが正常に更新されました！",
            },
            error: {
              title: "エラー！",
              message: "ソースを更新できませんでした。",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "エラー！",
              message: "リクエストに作業項目を追加できませんでした。再試行してください。",
            },
            success: {
              title: "成功！",
              message: "作業項目がリクエストに追加されました。",
            },
          },
        },
        update: {
          success: {
            message: "リクエストが正常に更新されました！",
            title: "成功！",
          },
          error: {
            title: "エラー！",
            message: "リクエストの更新に失敗しました。再試行してください！",
          },
        },
        create: {
          success: {
            message: "リクエストが正常に作成されました！",
            title: "成功！",
          },
          error: {
            title: "エラー！",
            message: "リクエストの作成に失敗しました。再試行してください！",
          },
        },
      },
    },
    linked_work_items: {
      label: "リンクされた作業項目",
      link: "作業項目をリンク",
      empty_state: {
        list: {
          title: "まだこの顧客に作業項目をリンクしていません。",
          description: "既存の作業項目をここにリンクして、この顧客に関連付けて追跡できます。",
          button: "作業項目をリンク",
        },
      },
      action: {
        remove_epic: "エピックを削除",
        remove: "作業項目を削除",
      },
    },
    sidebar: {
      properties: "プロパティ",
    },
  },
  templates: {
    settings: {
      title: "テンプレート",
      description: "テンプレートを使用すると、プロジェクト、作業項目、ページの作成に費やす時間を80％節約できます。",
      options: {
        project: {
          label: "プロジェクトテンプレート",
        },
        work_item: {
          label: "作業項目テンプレート",
        },
        page: {
          label: "ページテンプレート",
        },
      },
      create_template: {
        label: "テンプレートを作成",
        no_permission: {
          project: "テンプレートを作成するには、プロジェクト管理者に連絡してください",
          workspace: "テンプレートを作成するには、ワークスペース管理者に連絡してください",
        },
      },
      use_template: {
        button: {
          default: "テンプレートを使用",
          loading: "使用中",
        },
      },
      template_source: {
        workspace: {
          info: "ワークスペースから派生",
        },
        project: {
          info: "プロジェクトから派生",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "プロジェクトテンプレートに名前を付けてください。",
              validation: {
                required: "テンプレート名は必須です",
                maxLength: "テンプレート名は255文字未満にしてください",
              },
            },
            description: {
              placeholder: "このテンプレートをいつ、どのように使用するかを説明してください。",
            },
          },
          name: {
            placeholder: "プロジェクトに名前を付けてください。",
            validation: {
              required: "プロジェクトのタイトルは必須です",
              maxLength: "プロジェクトのタイトルは255文字未満にしてください",
            },
          },
          description: {
            placeholder: "このプロジェクトの目的と目標を説明してください。",
          },
          button: {
            create: "プロジェクトテンプレートを作成",
            update: "プロジェクトテンプレートを更新",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "作業項目テンプレートに名前を付けてください。",
              validation: {
                required: "テンプレート名は必須です",
                maxLength: "テンプレート名は255文字未満にしてください",
              },
            },
            description: {
              placeholder: "このテンプレートをいつ、どのように使用するかを説明してください。",
            },
          },
          name: {
            placeholder: "この作業項目にタイトルを付けてください。",
            validation: {
              required: "作業項目のタイトルは必須です",
              maxLength: "作業項目のタイトルは255文字未満にしてください",
            },
          },
          description: {
            placeholder: "この作業項目を完了したときに何を達成するのかが明確になるように説明してください。",
          },
          button: {
            create: "作業項目テンプレートを作成",
            update: "作業項目テンプレートを更新",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "ページテンプレートに名前を付けてください。",
              validation: {
                required: "テンプレート名は必須です",
                maxLength: "テンプレート名は255文字未満にしてください",
              },
            },
            description: {
              placeholder: "このテンプレートをいつ、どのように使用するかを説明してください。",
            },
          },
          name: {
            placeholder: "未命名のページ",
            validation: {
              maxLength: "ページ名は255文字未満にしてください",
            },
          },
          button: {
            create: "ページテンプレートを作成",
            update: "ページテンプレートを更新",
          },
        },
        publish: {
          action: "{isPublished, select, true {公開設定} other {マーケットプレイスに公開}}",
          unpublish_action: "マーケットプレイスから削除",
          title: "テンプレートを発見可能かつ認識可能にする",
          name: {
            label: "テンプレート名",
            placeholder: "テンプレートに名前を付けてください",
            validation: {
              required: "テンプレート名は必須です",
              maxLength: "テンプレート名は255文字未満にしてください",
            },
          },
          short_description: {
            label: "短い説明",
            placeholder: "このテンプレートは、同時に複数のプロジェクトを管理するプロジェクトマネージャーに最適です。",
            validation: {
              required: "短い説明は必須です",
            },
          },
          description: {
            label: "説明",
            placeholder: `音声認識機能を活用して生産性を向上させ、コミュニケーションを効率化しましょう。
• リアルタイム文字起こし：話した言葉を瞬時に正確なテキストに変換します。
• タスクとコメントの作成：音声コマンドでタスク、説明、コメントを追加できます。`,
            validation: {
              required: "説明は必須です",
            },
          },
          category: {
            label: "カテゴリ",
            placeholder: "最も適切な場所を選択してください。複数のカテゴリを選択できます。",
            validation: {
              required: "少なくとも1つのカテゴリが必要です",
            },
          },
          keywords: {
            label: "キーワード",
            placeholder: "ユーザーがこのテンプレートを検索するときに使用する用語を使用してください。",
            helperText:
              "カンマで区切られたキーワードを入力して、人々がこれを検索から見つけるのに役立つようにしてください。",
            validation: {
              required: "少なくとも1つのキーワードが必要です",
            },
          },
          company_name: {
            label: "会社名",
            placeholder: "Plane",
            validation: {
              required: "会社名は必須です",
              maxLength: "会社名は255文字未満にしてください",
            },
          },
          contact_email: {
            label: "サポートメールアドレス",
            placeholder: "help@plane.so",
            validation: {
              invalid: "無効なメールアドレス",
              required: "サポートメールアドレスは必須です",
              maxLength: "サポートメールアドレスは255文字未満にしてください",
            },
          },
          privacy_policy_url: {
            label: "プライバシーポリシーのURL",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "無効なURL",
              maxLength: "URLは800文字未満にしてください",
            },
          },
          terms_of_service_url: {
            label: "利用規約のURL",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "無効なURL",
              maxLength: "URLは800文字未満にしてください",
            },
          },
          cover_image: {
            label: "マーケットプレイスに表示されるカバー画像を追加",
            upload_title: "カバー画像をアップロード",
            upload_placeholder: "クリックしてアップロードするか、ドラッグ＆ドロップでカバー画像をアップロード",
            drop_here: "ここにドロップ",
            click_to_upload: "クリックしてアップロード",
            invalid_file_or_exceeds_size_limit:
              "無効なファイルまたはサイズ制限を超えています。もう一度お試しください。",
            upload_and_save: "アップロードして保存",
            uploading: "アップロード中",
            remove: "削除",
            removing: "削除中",
            validation: {
              required: "カバー画像は必須です",
            },
          },
          attach_screenshots: {
            label: "ビューアーにこのテンプレートを理解させるためのドキュメントと画像を含めます。",
            validation: {
              required: "少なくとも1つのスクリーンショットが必要です",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "テンプレート",
        description:
          "Planeのプロジェクト、作業項目、ページテンプレートを使用すれば、ゼロからプロジェクトを作成したり、作業項目のプロパティを手動で設定したりする必要はありません。",
        sub_description: "テンプレートを使用すると、管理時間の80％を取り戻せます。",
      },
      no_templates: {
        button: "最初のテンプレートを作成",
      },
      no_labels: {
        description:
          " まだラベルがありません。プロジェクト内の作業項目を整理してフィルタリングするためのラベルを作成してください。",
      },
      no_work_items: {
        description: "まだ作業項目がありません。1つ追加して、より良い構造にしてください。",
      },
      no_sub_work_items: {
        description: "まだサブ作業項目がありません。1つ追加して、より良い構造にしてください。",
      },
      page: {
        no_templates: {
          title: "アクセス可能なテンプレートがありません。",
          description: "テンプレートを作成してください",
        },
        no_results: {
          title: "テンプレートと一致しませんでした。",
          description: "他の用語で検索してみてください。",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "テンプレートが作成されました",
          message: "{templateType}テンプレート「{templateName}」がワークスペースで利用できるようになりました。",
        },
        error: {
          title: "今回はそのテンプレートを作成できませんでした。",
          message: "詳細を再度保存するか、できれば別のタブで新しいテンプレートにコピーしてください。",
        },
      },
      update: {
        success: {
          title: "テンプレートが変更されました",
          message: "{templateType}テンプレート「{templateName}」が変更されました。",
        },
        error: {
          title: "このテンプレートの変更を保存できませんでした。",
          message:
            "詳細を再度保存するか、後でこのテンプレートに戻ってください。それでも問題が続く場合は、お問い合わせください。",
        },
      },
      delete: {
        success: {
          title: "テンプレートが削除されました",
          message: "{templateType}テンプレート「{templateName}」がワークスペースから削除されました。",
        },
        error: {
          title: "今回はそのテンプレートを削除できませんでした。",
          message: "再度削除を試みるか、後で戻ってきてください。それでも削除できない場合は、お問い合わせください。",
        },
      },
      unpublish: {
        success: {
          title: "テンプレートが削除されました",
          message: "{templateType}テンプレート「{templateName}」が削除されました。",
        },
        error: {
          title: "今回はそのテンプレートを削除できませんでした。",
          message: "再度削除を試みるか、後で戻ってきてください。それでも削除できない場合は、お問い合わせください。",
        },
      },
    },
    delete_confirmation: {
      title: "テンプレートを削除",
      description: {
        prefix: "テンプレート「",
        suffix:
          "」を削除してもよろしいですか？テンプレートに関連するすべてのデータは完全に削除されます。このアクションは元に戻せません。",
      },
    },
    unpublish_confirmation: {
      title: "テンプレートを削除",
      description: {
        prefix: "テンプレート「",
        suffix: "」を削除してもよろしいですか？このテンプレートはマーケットプレイスでユーザーが利用できなくなります。",
      },
    },
    dropdown: {
      add: {
        work_item: "新しいテンプレートを追加",
        project: "新しいテンプレートを追加",
      },
      label: {
        project: "プロジェクトテンプレートを選択",
        page: "テンプレートから選択",
      },
      tooltip: {
        work_item: "作業項目テンプレートを選択",
      },
      no_results: {
        work_item: "テンプレートが見つかりません。",
        project: "テンプレートが見つかりません。",
      },
    },
  },
  intake_forms: {
    create: {
      title: "作業項目を作成",
      "sub-title": "チームに何を作業してほしいか伝えましょう。",
      name: "名前",
      email: "メール",
      about: "この作業項目は何についてですか？",
      description: "何が起きるべきか説明してください",
      description_placeholder: "チームが状況とニーズを把握できるよう、必要なだけ詳細を追加してください。",
      loading: "作成中",
      create_work_item: "作業項目を作成",
      errors: {
        name: "名前は必須です",
        name_max_length: "名前は255文字以内にしてください",
        email: "メールは必須です",
        email_invalid: "無効なメールアドレスです",
        title: "タイトルは必須です",
        title_max_length: "タイトルは255文字以内にしてください",
      },
    },
    success: {
      title: "作業項目がチームのキューに追加されました。",
      description: "チームはこの作業項目をインテークキューで承認または破棄できます。",
      primary_button: {
        text: "別の作業項目を追加",
      },
      secondary_button: {
        text: "インテークの詳細",
      },
    },
    how_it_works: {
      title: "仕組み",
      heading: "これはインテークフォームです。",
      description:
        "インテークは、プロジェクトの管理者やマネージャーが外部から作業項目をプロジェクトに取り込めるPlaneの機能です。",
      steps: {
        step_1: "この短いフォームでPlaneプロジェクトに新しい作業項目を作成できます。",
        step_2: "このフォームを送信すると、そのプロジェクトのインテークに新しい作業項目が作成されます。",
        step_3: "そのプロジェクトまたはチームの誰かが確認します。",
        step_4: "承認されれば、この作業項目はプロジェクトの作業キューに移動します。そうでなければ却下されます。",
        step_5:
          "その作業項目のステータスを確認するには、プロジェクトマネージャー、管理者、またはこのページのリンクを送った方に連絡してください。",
      },
    },
    type_forms: {
      select_types: {
        title: "作業項目タイプを選択",
        search_placeholder: "作業項目タイプを検索",
      },
      actions: {
        select_properties: "プロパティを選択",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "定期作業項目",
      description: "繰り返しの作業を1回設定するだけで、繰り返しを管理します。時間が来たらここにすべて表示されます。",
      new_recurring_work_item: "新しい定期作業項目",
      update_recurring_work_item: "定期作業項目を更新",
      form: {
        interval: {
          title: "スケジュール",
          start_date: {
            validation: {
              required: "開始日は必須です",
            },
          },
          interval_type: {
            validation: {
              required: "間隔タイプは必須です",
            },
          },
        },
        button: {
          create: "定期作業項目を作成",
          update: "定期作業項目を更新",
        },
      },
      create_button: {
        label: "定期作業項目を作成",
        no_permission: "定期作業項目を作成するにはプロジェクト管理者に連絡してください",
      },
    },
    empty_state: {
      upgrade: {
        title: "あなたの作業を自動化",
        description:
          "一度設定すれば、期限が来たときに自動で再作成します。定期作業をより簡単にするにはBusinessへアップグレードしてください。",
      },
      no_templates: {
        button: "最初の定期作業項目を作成",
      },
    },
    toasts: {
      create: {
        success: {
          title: "定期作業項目が作成されました",
          message: "{name}（定期作業項目）がワークスペースで利用可能になりました。",
        },
        error: {
          title: "定期作業項目を作成できませんでした。",
          message: "もう一度詳細を保存するか、別のタブで新しい定期作業項目にコピーしてください。",
        },
      },
      update: {
        success: {
          title: "定期作業項目が変更されました",
          message: "{name}（定期作業項目）が変更されました。",
        },
        error: {
          title: "この定期作業項目の変更を保存できませんでした。",
          message:
            "もう一度詳細を保存するか、後でこの定期作業項目に戻ってください。問題が解決しない場合はご連絡ください。",
        },
      },
      delete: {
        success: {
          title: "定期作業項目が削除されました",
          message: "{name}（定期作業項目）がワークスペースから削除されました。",
        },
        error: {
          title: "定期作業項目を削除できませんでした。",
          message: "もう一度削除するか、後で再度お試しください。それでも削除できない場合はご連絡ください。",
        },
      },
    },
    delete_confirmation: {
      title: "定期作業項目を削除",
      description: {
        prefix: "定期作業項目「",
        suffix:
          "」を削除してもよろしいですか？この定期作業項目に関連するすべてのデータは完全に削除されます。この操作は元に戻せません。",
      },
    },
  },
  automations: {
    settings: {
      title: "カスタム自動化",
      create_automation: "自動化を作成",
    },
    scope: {
      label: "スコープ",
      run_on: "実行対象",
    },
    trigger: {
      label: "トリガー",
      add_trigger: "トリガーを追加",
      sidebar_header: "トリガー設定",
      input_label: "この自動化のトリガーは何ですか？",
      input_placeholder: "オプションを選択",
      button: {
        previous: "戻る",
        next: "アクションを追加",
      },
    },
    condition: {
      label: "条件",
      add_condition: "条件を追加",
      adding_condition: "条件を追加中",
    },
    action: {
      label: "アクション",
      add_action: "アクションを追加",
      sidebar_header: "アクション",
      input_label: "自動化は何を行いますか？",
      input_placeholder: "オプションを選択",
      handler_name: {
        add_comment: "コメントを追加",
        change_property: "プロパティを変更",
      },
      configuration: {
        label: "設定",
        change_property: {
          placeholders: {
            property_name: "プロパティを選択",
            change_type: "選択",
            property_value_select: "{count, plural, one{値を選択} other{値を選択}}",
            property_value_select_date: "日付を選択",
          },
          validation: {
            property_name_required: "プロパティ名は必須です",
            change_type_required: "変更タイプは必須です",
            property_value_required: "プロパティ値は必須です",
          },
        },
      },
      comment_block: {
        title: "コメントを追加",
      },
      change_property_block: {
        title: "プロパティを変更",
      },
      validation: {
        delete_only_action: "唯一のアクションを削除する前に自動化を無効にしてください。",
      },
    },
    conjunctions: {
      and: "かつ",
      or: "または",
      if: "もし",
      then: "ならば",
    },
    enable: {
      alert: "自動化が完了したら「有効化」を押してください。有効化されると、自動化が実行可能になります。",
      validation: {
        required: "自動化を有効にするには、トリガーと少なくとも1つのアクションが必要です。",
      },
    },
    delete: {
      validation: {
        enabled: "自動化を削除する前に無効にする必要があります。",
      },
    },
    table: {
      title: "自動化タイトル",
      last_run_on: "最終実行日",
      created_on: "作成日",
      last_updated_on: "最終更新日",
      last_run_status: "最終実行ステータス",
      average_duration: "平均実行時間",
      owner: "所有者",
      executions: "実行回数",
    },
    create_modal: {
      heading: {
        create: "自動化を作成",
        update: "自動化を更新",
      },
      title: {
        placeholder: "自動化に名前を付けてください。",
        required_error: "タイトルは必須です",
      },
      description: {
        placeholder: "自動化について説明してください。",
      },
      submit_button: {
        create: "自動化を作成",
        update: "自動化を更新",
      },
    },
    delete_modal: {
      heading: "自動化を削除",
    },
    activity: {
      filters: {
        show_fails: "失敗を表示",
        all: "すべて",
        only_activity: "アクティビティのみ",
        only_run_history: "実行履歴のみ",
      },
      run_history: {
        initiator: "実行者",
      },
    },
    toasts: {
      create: {
        success: {
          title: "成功！",
          message: "自動化が正常に作成されました。",
        },
        error: {
          title: "エラー！",
          message: "自動化の作成に失敗しました。",
        },
      },
      update: {
        success: {
          title: "成功！",
          message: "自動化が正常に更新されました。",
        },
        error: {
          title: "エラー！",
          message: "自動化の更新に失敗しました。",
        },
      },
      enable: {
        success: {
          title: "成功！",
          message: "自動化が正常に有効化されました。",
        },
        error: {
          title: "エラー！",
          message: "自動化の有効化に失敗しました。",
        },
      },
      disable: {
        success: {
          title: "成功！",
          message: "自動化が正常に無効化されました。",
        },
        error: {
          title: "エラー！",
          message: "自動化の無効化に失敗しました。",
        },
      },
      delete: {
        success: {
          title: "自動化が削除されました",
          message: "{name}（自動化）がプロジェクトから削除されました。",
        },
        error: {
          title: "自動化を削除できませんでした。",
          message: "もう一度削除するか、後で再度お試しください。それでも削除できない場合はご連絡ください。",
        },
      },
      action: {
        create: {
          error: {
            title: "エラー！",
            message: "アクションの作成に失敗しました。もう一度お試しください！",
          },
        },
        update: {
          error: {
            title: "エラー！",
            message: "アクションの更新に失敗しました。もう一度お試しください！",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "まだ表示する自動化がありません。",
        description:
          "自動化は、トリガー、条件、アクションを設定することで繰り返し作業を排除するのに役立ちます。時間を節約し、作業を効率的に進めるために作成してください。",
      },
      upgrade: {
        title: "自動化",
        description: "自動化は、プロジェクト内のタスクを自動化する方法です。",
        sub_description: "自動化を使用すると、管理時間の80%を節約できます。",
      },
    },
  },
  sso: {
    header: "アイデンティティ",
    description: "シングルサインオンを含むセキュリティ機能にアクセスするためにドメインを設定します。",
    domain_management: {
      header: "ドメイン管理",
      verified_domains: {
        header: "検証済みドメイン",
        description: "メールドメインの所有権を確認してシングルサインオンを有効にします。",
        button_text: "ドメインを追加",
        list: {
          domain_name: "ドメイン名",
          status: "ステータス",
          status_verified: "検証済み",
          status_failed: "失敗",
          status_pending: "保留中",
        },
        add_domain: {
          title: "ドメインを追加",
          description: "SSOを設定して検証するためにドメインを追加します。",
          form: {
            domain_label: "ドメイン",
            domain_placeholder: "plane.so",
            domain_required: "ドメインは必須です",
            domain_invalid: "有効なドメイン名を入力してください（例：plane.so）",
          },
          primary_button_text: "ドメインを追加",
          primary_button_loading_text: "追加中",
          toast: {
            success_title: "成功！",
            success_message: "ドメインが正常に追加されました。DNS TXTレコードを追加して検証してください。",
            error_message: "ドメインの追加に失敗しました。もう一度お試しください。",
          },
        },
        verify_domain: {
          title: "ドメインを検証",
          description: "これらの手順に従ってドメインを検証します。",
          instructions: {
            label: "手順",
            step_1: "ドメインホストのDNS設定に移動します。",
            step_2: {
              part_1: "",
              part_2: "TXTレコード",
              part_3: "を作成し、以下に提供された完全なレコード値を貼り付けます。",
            },
            step_3: "この更新は通常数分かかりますが、完了まで最大72時間かかる場合があります。",
            step_4: "DNSレコードが更新されたら、「ドメインを検証」をクリックして確認します。",
          },
          verification_code_label: "TXTレコードの値",
          verification_code_description: "このレコードをDNS設定に追加してください",
          domain_label: "ドメイン",
          primary_button_text: "ドメインを検証",
          primary_button_loading_text: "検証中",
          secondary_button_text: "後で行います",
          toast: {
            success_title: "成功！",
            success_message: "ドメインが正常に検証されました。",
            error_message: "ドメインの検証に失敗しました。もう一度お試しください。",
          },
        },
        delete_domain: {
          title: "ドメインを削除",
          description: {
            prefix: "本当に削除しますか",
            suffix: "？この操作は元に戻せません。",
          },
          primary_button_text: "削除",
          primary_button_loading_text: "削除中",
          secondary_button_text: "キャンセル",
          toast: {
            success_title: "成功！",
            success_message: "ドメインが正常に削除されました。",
            error_message: "ドメインの削除に失敗しました。もう一度お試しください。",
          },
        },
      },
    },
    providers: {
      header: "シングルサインオン",
      disabled_message: "SSOを設定するには検証済みドメインを追加してください",
      configure: {
        create: "設定",
        update: "編集",
      },
      switch_alert_modal: {
        title: "SSOメソッドを{newProviderShortName}に切り替えますか？",
        content:
          "{newProviderLongName}（{newProviderShortName}）を有効にしようとしています。この操作により、{activeProviderLongName}（{activeProviderShortName}）が自動的に無効になります。{activeProviderShortName}経由でサインインしようとするユーザーは、新しいメソッドに切り替えるまでプラットフォームにアクセスできなくなります。続行してもよろしいですか？",
        primary_button_text: "切り替え",
        primary_button_text_loading: "切り替え中",
        secondary_button_text: "キャンセル",
      },
      form_section: {
        title: "{workspaceName}のIdP提供の詳細",
      },
      form_action_buttons: {
        saving: "保存中",
        save_changes: "変更を保存",
        configure_only: "設定のみ",
        configure_and_enable: "設定して有効化",
        default: "保存",
      },
      setup_details_section: {
        title: "{workspaceName}がIdPに提供する詳細",
        button_text: "設定詳細を取得",
      },
      saml: {
        header: "SAMLを有効化",
        description: "SAMLアイデンティティプロバイダーを設定してシングルサインオンを有効にします。",
        configure: {
          title: "SAMLを有効化",
          description: "メールドメインの所有権を確認してシングルサインオンを含むセキュリティ機能にアクセスします。",
          toast: {
            success_title: "成功！",
            create_success_message: "SAMLプロバイダーが正常に作成されました。",
            update_success_message: "SAMLプロバイダーが正常に更新されました。",
            error_title: "エラー！",
            error_message: "SAMLプロバイダーの保存に失敗しました。もう一度お試しください。",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web詳細",
            entity_id: {
              label: "エンティティID | オーディエンス | メタデータ情報",
              description: "このPlaneアプリをIdP上の認証済みサービスとして識別するメタデータのこの部分を生成します。",
            },
            callback_url: {
              label: "シングルサインオンURL",
              description: "これを生成します。IdPのサインインリダイレクトURLフィールドに追加してください。",
            },
            logout_url: {
              label: "シングルログアウトURL",
              description: "これを生成します。IdPのシングルログアウトリダイレクトURLフィールドに追加してください。",
            },
          },
          mobile_details: {
            header: "モバイル詳細",
            entity_id: {
              label: "エンティティID | オーディエンス | メタデータ情報",
              description: "このPlaneアプリをIdP上の認証済みサービスとして識別するメタデータのこの部分を生成します。",
            },
            callback_url: {
              label: "シングルサインオンURL",
              description: "これを生成します。IdPのサインインリダイレクトURLフィールドに追加してください。",
            },
            logout_url: {
              label: "シングルログアウトURL",
              description: "これを生成します。IdPのログアウトリダイレクトURLフィールドに追加してください。",
            },
          },
          mapping_table: {
            header: "マッピング詳細",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "OIDCを有効化",
        description: "OIDCアイデンティティプロバイダーを設定してシングルサインオンを有効にします。",
        configure: {
          title: "OIDCを有効化",
          description: "メールドメインの所有権を確認してシングルサインオンを含むセキュリティ機能にアクセスします。",
          toast: {
            success_title: "成功！",
            create_success_message: "OIDCプロバイダーが正常に作成されました。",
            update_success_message: "OIDCプロバイダーが正常に更新されました。",
            error_title: "エラー！",
            error_message: "OIDCプロバイダーの保存に失敗しました。もう一度お試しください。",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web詳細",
            origin_url: {
              label: "オリジンURL",
              description:
                "このPlaneアプリ用にこれを生成します。IdPの対応するフィールドに信頼できるオリジンとして追加してください。",
            },
            callback_url: {
              label: "リダイレクトURL",
              description: "これを生成します。IdPのサインインリダイレクトURLフィールドに追加してください。",
            },
            logout_url: {
              label: "ログアウトURL",
              description: "これを生成します。IdPのログアウトリダイレクトURLフィールドに追加してください。",
            },
          },
          mobile_details: {
            header: "モバイル詳細",
            origin_url: {
              label: "オリジンURL",
              description:
                "このPlaneアプリ用にこれを生成します。IdPの対応するフィールドに信頼できるオリジンとして追加してください。",
            },
            callback_url: {
              label: "リダイレクトURL",
              description: "これを生成します。IdPのサインインリダイレクトURLフィールドに追加してください。",
            },
            logout_url: {
              label: "ログアウトURL",
              description: "これを生成します。IdPのログアウトリダイレクトURLフィールドに追加してください。",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "プロジェクト名に特殊文字を含めることはできません。",
  pql: {
    functions: {
      date: {
        now: {
          description: "現在の日時",
        },
        today: {
          description: "今日の日付",
        },
        start_of_day: {
          description: "今日の開始",
        },
        end_of_day: {
          description: "今日の終了",
        },
        start_of_week: {
          description: "今週の開始",
        },
        end_of_week: {
          description: "今週の終了",
        },
        start_of_month: {
          description: "今月の開始",
        },
        end_of_month: {
          description: "今月の終了",
        },
        start_of_year: {
          description: "今年の開始",
        },
        end_of_year: {
          description: "今年の終了",
        },
        days_ago: {
          description: "n日前の日付",
        },
        days_from_now: {
          description: "n日後の日付",
        },
        weeks_ago: {
          description: "n週前の日付",
        },
        weeks_from_now: {
          description: "n週後の日付",
        },
        months_ago: {
          description: "nヶ月前の日付",
        },
        months_from_now: {
          description: "nヶ月後の日付",
        },
      },
      user: {
        current_user: {
          description: "現在ログイン中のユーザー",
        },
        members_of: {
          description: '"project:<id>" または "teamspace:<id>" のメンバー',
        },
        workspace_members: {
          description: "すべてのワークスペースメンバー",
        },
      },
      cycle: {
        active_cycle: {
          description: "今日アクティブなサイクル",
        },
        completed_cycles: {
          description: "終了日が過ぎたサイクル",
        },
        upcoming_cycles: {
          description: "開始日が将来のサイクル",
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
          description: "期限切れかつ状態がオープン",
        },
        has_no_assignee: {
          description: "作業アイテムに担当者がいない",
        },
        has_no_label: {
          description: "作業アイテムにラベルがない",
        },
        is_top_level: {
          description: "サブ作業アイテムでない（親がない）",
        },
        is_sub_work_item: {
          description: "サブ作業アイテム（親がある）",
        },
        is_epic: {
          description: "エピック",
        },
        is_intake: {
          description: "受付作業アイテム",
        },
        is_draft: {
          description: "下書き作業アイテム",
        },
        is_archived: {
          description: "アーカイブ済み",
        },
        has_children: {
          description: "少なくとも1つのサブ作業アイテムがある",
        },
        has_start_and_due_dates: {
          description: "開始日と期日の両方がある",
        },
      },
      relation: {
        linked_to: {
          description: "指定された作業アイテムに関連する作業アイテム",
        },
        blocked_by: {
          description: "指定された作業アイテムによってブロックされた作業アイテム",
        },
        blocks: {
          description: "指定された作業アイテムをブロックする作業アイテム",
        },
        child_of: {
          description: "指定された作業アイテムのサブ作業アイテム",
        },
        parent_of: {
          description: "指定された作業アイテムの親作業アイテム",
        },
        duplicate_of: {
          description: "指定された作業アイテムの複製としてマークされた作業アイテム",
        },
      },
      history: {
        was_ever: {
          description: "フィールドがこの値に設定されたことがある",
        },
        was: {
          description: "フィールドは以前この値だった（変更済み）",
        },
        changed_from: {
          description: "フィールドがこの値から変更された",
        },
        changed_to: {
          description: "フィールドがこの値に変更された",
        },
        changed: {
          description: "フィールドが変更された",
        },
        updated_by: {
          description: "このユーザーによって更新された作業アイテム",
        },
        commented_by: {
          description: "このユーザーによってコメントされた作業アイテム",
        },
        field_changed_by: {
          description: "このユーザーによって変更されたフィールド",
        },
        was_assigned_to: {
          description: "このユーザーに割り当てられた作業アイテム",
        },
        changed_after: {
          description: "この日付以降に変更されたフィールド",
        },
        changed_before: {
          description: "この日付以前に変更されたフィールド",
        },
        field_changed_after: {
          description: "この日付以降に変更されたフィールド",
        },
        field_changed_before: {
          description: "この日付以前に変更されたフィールド",
        },
        changed_to_after: {
          description: "この日付以降にこの値に変更されたフィールド",
        },
        changed_to_before: {
          description: "この日付以前にこの値に変更されたフィールド",
        },
        field_changed_between: {
          description: "これらの日付の間に変更されたフィールド",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "ナビゲート",
      accept: "確定",
      close: "閉じる",
      pick_date: "日付を選択",
    },
    placeholder: 'クエリを入力して "ENTER" を押してフィルタリング...',
    error: "クエリの送信中にエラーが発生しました。確認して再試行してください。",
  },
  releases: {
    releases: "リリース",
    release: "リリース",
    no_release: "リリースなし",
    select_releases: "リリースを選択",
    count_releases: "{count, plural, one {# リリース} other {# リリース}}",
    actions: {
      delete: "削除",
    },
    delete_modal: {
      title: "リリースを削除",
      content: 'リリース "{releaseName}" を削除してもよろしいですか？ この操作は元に戻せません。',
    },
    settings: {
      heading: {
        title: "リリース",
        description: "リリースを使って、プロジェクトの成果物を正確に管理します。",
      },
      toggle: {
        title: "リリースを有効にする",
        description: "ワークスペースのメンバーは、それぞれのプロジェクト内のスコープを閲覧できます。",
      },
      toasts: {
        enable: {
          loading: "リリースを有効化しています...",
          success: {
            title: "リリースを有効にしました",
            message: "このワークスペースでリリースが有効になりました。",
          },
          error: {
            title: "エラー",
            message: "リリースを有効にできませんでした。もう一度お試しください。",
          },
        },
        disable: {
          loading: "リリースを無効化しています...",
          success: {
            title: "リリースを無効にしました",
            message: "このワークスペースでリリースが無効になりました。",
          },
          error: {
            title: "エラー",
            message: "リリースを無効にできませんでした。もう一度お試しください。",
          },
        },
      },
      tabs: {
        tags: "リリースタグ",
        labels: "ラベル",
      },
      tags: {
        title: "リリースタグ",
        description: "タグを使ってリリースを分類し、絞り込みできます。",
        add: "タグを追加",
        empty_state: "タグはまだありません。最初のタグを作成してください。",
        errors: {
          version_required: "バージョンは必須です。",
          version_already_exists: "このバージョンのタグは既に存在します。",
          generic: "問題が発生しました。もう一度お試しください。",
        },
        delete_modal: {
          title: "タグを削除",
          content: 'タグ "{tagVersion}" を削除してもよろしいですか？ この操作は元に戻せません。',
        },
        actions: {
          edit: "タグを編集",
          delete: "タグを削除",
        },
        toasts: {
          delete: {
            success: "タグを削除しました。",
            error: "タグを削除できませんでした。もう一度お試しください。",
          },
        },
      },
      labels: {
        title: "ラベル",
        description: "ラベルを使ってイニシアチブを整理できます。",
        add: "ラベルを追加",
        empty_state: "ラベルはまだありません。最初のラベルを作成してください。",
        errors: {
          name_required: "名前は必須です。",
          name_already_exists: "この名前のラベルは既に存在します。",
          generic: "問題が発生しました。もう一度お試しください。",
        },
        modal: {
          name_placeholder: "ラベル名",
          pick_color: "ラベルの色を選択",
        },
        actions: {
          edit: "ラベルを編集",
          delete: "ラベルを削除",
        },
        drag_to_reorder: "ドラッグして並べ替え",
        delete_modal: {
          title: "ラベルを削除",
          content: 'ラベル "{labelName}" を削除してもよろしいですか？ この操作は元に戻せません。',
        },
        toasts: {
          delete: {
            success: "ラベルを削除しました。",
            error: "ラベルを削除できませんでした。もう一度お試しください。",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "階層",
      tab_label: "階層",
      description:
        "作業を整理するための階層レベルを設定します。各レベルは、直接上のアイテムとの親関係と、直接下のアイテムとの子関係を定義します。 ",
      sidebar_label: "階層",
      enable_control: {
        title: "階層を有効にする",
        description: "異なる作業アイテムタイプ間に親子関係を作成します。",
        tooltip: "一度有効にすると、階層を無効にすることはできません。",
      },
      workspace_work_item_types_disabled_banner: {
        content: "新しい階層を作成するには、まず作業アイテムタイプを定義してください。",
        cta: "作業アイテムタイプの設定",
      },
    },
    levels: {
      add_level_button: "階層レベルを追加",
      empty_level_placeholder: "レベル {level} に作業アイテムタイプを追加",
      empty_level_unauthorized: "このレベルに作業アイテムタイプが見つかりません。",
      zero_level_description: "デフォルトでは、すべての作業アイテムタイプは階層に割り当てられるまでレベル0にあります。",
    },
    add_level_modal: {
      title: "階層レベルを追加",
      description: "作業アイテムタイプに新しい階層レベルを追加します。",
      work_item_type: "作業アイテムタイプ",
      empty_state: {
        title: "すべての作業アイテムタイプが使用中",
        description: "このワークスペースで定義されたすべての作業アイテムタイプはすでに階層の一部です。",
      },
      invalid_level_toast: {
        title: "エラー！",
        message: "{type_name} は階層ルールに違反するため、レベル {level} に追加できません。",
      },
      not_found_toast: {
        title: "エラー",
        message: "作業アイテムタイプが見つかりません。",
      },
      error_toast: {
        title: "エラー",
        message: "作業アイテムタイプを階層に追加できませんでした。",
      },
    },
    remove_from_level_toast: {
      loading: "作業アイテムタイプをレベルから削除しています",
      success: {
        title: "成功！",
        message: "作業アイテムタイプをレベルから正常に削除しました。",
      },
      error: {
        title: "エラー！",
        message: "作業アイテムタイプをレベルから削除できませんでした。",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "エラー！",
        message:
          "選択した作業アイテムタイプは階層ルールに違反するため、新しい作業アイテムの作成に使用できません。",
      },
      invalid_work_item_type_update_toast: {
        title: "エラー！",
        message: "作業アイテムタイプは階層ルールに違反するため更新できません。",
      },
    },
  },
} as const;

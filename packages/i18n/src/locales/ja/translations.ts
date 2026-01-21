export default {
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
  select_or_customize_your_interface_color_scheme: "インターフェースの配色を選択またはカスタマイズしてください。",
  theme: "テーマ",
  system_preference: "システム設定に従う",
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
  workspace: "ワークスペース",
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
  pages: "Pages",
  intake: "Intake",
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
  discord: "Discord",
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
  you: "あなた",
  labels: "ラベル",
  create_new_label: "新規ラベルを作成",
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
        description: "すべてのウィジェットがオフになっているようです。体験を向上させるために\n今すぐ有効にしましょう！",
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
    clear_all: "すべてクリア",
    copied: "コピーしました！",
    link_copied: "リンクをコピーしました！",
    link_copied_to_clipboard: "リンクをクリップボードにコピーしました",
    copied_to_clipboard: "作業項目のリンクをクリップボードにコピーしました",
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
      description: "完了またはキャンセルされた\n作業項目のみアーカイブできます",
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
      body: "インスタンス管理者様\n\n[ワークスペース作成の目的]のために、URL [/workspace-name] の新規ワークスペースを作成していただけますでしょうか。\n\nよろしくお願いいたします。\n{firstName} {lastName}\n{email}",
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
        description: "条件に一致するプロジェクトが見つかりません。\n代わりに新しいプロジェクトを作成してください。",
      },
      search: {
        description: "条件に一致するプロジェクトが見つかりません。\n代わりに新しいプロジェクトを作成してください。",
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
        title: "APIトークン",
        add_token: "APIトークンを追加",
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
        title: "受付",
        short_title: "受付",
        description: "ワークフローを中断することなく、非メンバーがバグ、フィードバック、提案を共有できるようにします。",
        toggle_title: "受付を有効にする",
        toggle_description: "プロジェクトメンバーがアプリ内で受付リクエストを作成できるようにします。",
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
      archive_module_description: "完了またはキャンセルされた\nモジュールのみアーカイブできます。",
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
        description: "検索条件に一致するビューがありません。\n代わりに新しいビューを作成してください。",
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
        description: "あなたに割り当てられた作業項目の更新が\nここに表示されます",
      },
      mentions: {
        title: "割り当てられた作業項目がありません",
        description: "あなたに割り当てられた作業項目の更新が\nここに表示されます",
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
        description: "別の用語を試すか、検索が正しいと\n確信がある場合はお知らせください。",
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
} as const;

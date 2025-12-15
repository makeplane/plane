export default {
  common_empty_state: {
    progress: {
      title: "表示する進捗メトリクスがまだありません。",
      description: "作業項目にプロパティ値を設定して、ここに進捗メトリクスを表示します。",
    },
    updates: {
      title: "更新はまだありません。",
      description: "プロジェクトメンバーが更新を追加すると、ここに表示されます",
    },
    search: {
      title: "一致する結果が見つかりません。",
      description: "結果が見つかりませんでした。検索条件を調整してください。",
    },
    not_found: {
      title: "おっと!何か問題があるようです",
      description: "現在、Planeアカウントを取得できません。ネットワークエラーの可能性があります。",
      cta_primary: "再読み込みを試す",
    },
    server_error: {
      title: "サーバーエラー",
      description: "サーバーに接続してデータを取得できません。ご心配なく、対応中です。",
      cta_primary: "再読み込みを試す",
    },
  },
  project_empty_state: {
    no_access: {
      title: "このプロジェクトへのアクセス権がないようです",
      restricted_description: "管理者に連絡してアクセス権をリクエストすると、ここで作業を続けられます。",
      join_description: "下のボタンをクリックして参加してください。",
      cta_primary: "プロジェクトに参加",
      cta_loading: "プロジェクトに参加中",
    },
    invalid_project: {
      title: "プロジェクトが見つかりません",
      description: "お探しのプロジェクトは存在しません。",
    },
    work_items: {
      title: "最初の作業項目から始めましょう。",
      description:
        "作業項目はプロジェクトの構成要素です — 担当者の割り当て、優先度の設定、進捗の追跡が簡単に行えます。",
      cta_primary: "最初の作業項目を作成",
    },
    cycles: {
      title: "サイクルで作業をグループ化してタイムボックス化します。",
      description:
        "作業をタイムボックスで区切り、プロジェクトの締め切りから逆算して日付を設定し、チームとして具体的な進捗を達成します。",
      cta_primary: "最初のサイクルを設定",
    },
    cycle_work_items: {
      title: "このサイクルに表示する作業項目はありません",
      description: "作業項目を作成して、このサイクルでチームの進捗を監視し、目標を時間内に達成しましょう。",
      cta_primary: "作業項目を作成",
      cta_secondary: "既存の作業項目を追加",
    },
    modules: {
      title: "プロジェクトの目標をモジュールにマッピングして簡単に追跡します。",
      description:
        "モジュールは相互接続された作業項目で構成されています。プロジェクトフェーズを通じた進捗の監視を支援し、それぞれに特定の締め切りと分析があり、それらのフェーズをどれだけ達成に近づいているかを示します。",
      cta_primary: "最初のモジュールを設定",
    },
    module_work_items: {
      title: "このモジュールに表示する作業項目はありません",
      description: "作業項目を作成して、このモジュールの監視を開始します。",
      cta_primary: "作業項目を作成",
      cta_secondary: "既存の作業項目を追加",
    },
    views: {
      title: "プロジェクトのカスタムビューを保存",
      description:
        "ビューは保存されたフィルターで、最も頻繁に使用する情報に素早くアクセスできます。チームメイトがビューを共有し、それぞれのニーズに合わせて調整することで、簡単に協力できます。",
      cta_primary: "ビューを作成",
    },
    no_work_items_in_project: {
      title: "プロジェクトにはまだ作業項目がありません",
      description: "プロジェクトに作業項目を追加し、ビューを使用して作業を追跡可能な部分に分割します。",
      cta_primary: "作業項目を追加",
    },
    work_item_filter: {
      title: "作業項目が見つかりません",
      description: "現在のフィルターでは結果が返されませんでした。フィルターを変更してみてください。",
      cta_primary: "作業項目を追加",
    },
    pages: {
      title: "メモからPRDまで、すべてを文書化",
      description:
        "ページを使用すると、情報を1か所でキャプチャして整理できます。会議のメモ、プロジェクトドキュメント、PRDを作成し、作業項目を埋め込み、すぐに使えるコンポーネントで構造化します。",
      cta_primary: "最初のページを作成",
    },
    archive_pages: {
      title: "アーカイブされたページはまだありません",
      description: "注目していないページをアーカイブします。必要に応じてここでアクセスできます。",
    },
    intake_sidebar: {
      title: "インテークリクエストを記録",
      description: "新しいリクエストを送信して、プロジェクトのワークフロー内でレビュー、優先順位付け、追跡を行います。",
      cta_primary: "インテークリクエストを作成",
    },
    intake_main: {
      title: "インテーク作業項目を選択して詳細を表示",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "アーカイブされた作業項目はまだありません",
      description:
        "手動または自動化により、完了またはキャンセルされた作業項目をアーカイブできます。アーカイブされると、ここで見つけられます。",
      cta_primary: "自動化を設定",
    },
    archive_cycles: {
      title: "アーカイブされたサイクルはまだありません",
      description:
        "プロジェクトを整理するために、完了したサイクルをアーカイブします。アーカイブされると、ここで見つけられます。",
    },
    archive_modules: {
      title: "アーカイブされたモジュールはまだありません",
      description:
        "プロジェクトを整理するために、完了またはキャンセルされたモジュールをアーカイブします。アーカイブされると、ここで見つけられます。",
    },
    home_widget_quick_links: {
      title: "作業に重要な参照、リソース、またはドキュメントを手元に保管",
    },
    inbox_sidebar_all: {
      title: "購読している作業項目の更新がここに表示されます",
    },
    inbox_sidebar_mentions: {
      title: "作業項目でのメンションがここに表示されます",
    },
    your_work_by_priority: {
      title: "割り当てられた作業項目はまだありません",
    },
    your_work_by_state: {
      title: "割り当てられた作業項目はまだありません",
    },
    views: {
      title: "ビューはまだありません",
      description: "プロジェクトに作業項目を追加し、ビューを使用してフィルター、ソート、進捗の監視を簡単に行います。",
      cta_primary: "作業項目を追加",
    },
    drafts: {
      title: "途中の作業項目",
      description: "これを試すには、作業項目の追加を開始して途中で離れるか、以下で最初の下書きを作成してください。😉",
      cta_primary: "下書き作業項目を作成",
    },
    projects_archived: {
      title: "アーカイブされたプロジェクトはありません",
      description: "すべてのプロジェクトがまだアクティブです — 素晴らしい!",
    },
    analytics_projects: {
      title: "プロジェクトを作成して、ここでプロジェクトメトリクスを視覚化します。",
    },
    analytics_work_items: {
      title: "作業項目と担当者を含むプロジェクトを作成して、パフォーマンス、進捗、チームの影響をここで追跡開始します。",
    },
    analytics_no_cycle: {
      title: "サイクルを作成して、作業を期限付きフェーズに整理し、スプリント全体の進捗を追跡します。",
    },
    analytics_no_module: {
      title: "モジュールを作成して、作業を整理し、さまざまな段階での進捗を追跡します。",
    },
    analytics_no_intake: {
      title: "インテークを設定して、受信リクエストを管理し、承認と拒否を追跡します",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "まだ見積もりはありません",
      description: "チームが労力をどのように測定するかを定義し、すべての作業項目で一貫して追跡します。",
      cta_primary: "見積もりシステムを追加",
    },
    labels: {
      title: "まだラベルはありません",
      description: "作業項目を効果的に分類および管理するためのパーソナライズされたラベルを作成します。",
      cta_primary: "最初のラベルを作成",
    },
    exports: {
      title: "まだエクスポートはありません",
      description: "現在、エクスポート記録はありません。データをエクスポートすると、すべての記録がここに表示されます。",
    },
    tokens: {
      title: "まだ個人トークンはありません",
      description: "ワークスペースを外部システムおよびアプリケーションと接続するための安全なAPIトークンを生成します。",
      cta_primary: "APIトークンを追加",
    },
    webhooks: {
      title: "まだWebhookが追加されていません",
      description: "プロジェクトイベントが発生したときに外部サービスへの通知を自動化します。",
      cta_primary: "Webhookを追加",
    },
  },
} as const;

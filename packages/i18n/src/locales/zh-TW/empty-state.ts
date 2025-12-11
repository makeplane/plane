export default {
  common_empty_state: {
    progress: {
      title: "暫無進度指標可顯示。",
      description: "開始在工作項中設定屬性值以在此查看進度指標。",
    },
    updates: {
      title: "暫無更新。",
      description: "專案成員新增更新後將顯示在此處",
    },
    search: {
      title: "未找到符合結果。",
      description: "未找到結果。請嘗試調整搜尋條件。",
    },
    not_found: {
      title: "糟糕!似乎出了點問題",
      description: "我們目前無法取得您的 Plane 帳戶。這可能是網路錯誤。",
      cta_primary: "嘗試重新載入",
    },
    server_error: {
      title: "伺服器錯誤",
      description: "我們無法連線並從伺服器取得資料。請放心,我們正在處理。",
      cta_primary: "嘗試重新載入",
    },
  },
  project_empty_state: {
    no_access: {
      title: "您似乎無權存取此專案",
      restricted_description: "請聯絡管理員以申請存取權，核准後即可在此繼續。",
      join_description: "點擊下方按鈕加入專案。",
      cta_primary: "加入專案",
      cta_loading: "正在加入專案",
    },
    invalid_project: {
      title: "找不到專案",
      description: "您所查找的專案不存在。",
    },
    work_items: {
      title: "從您的第一個工作項開始。",
      description: "工作項是專案的建構模組 — 指派負責人、設定優先順序並輕鬆追蹤進度。",
      cta_primary: "建立您的第一個工作項",
    },
    cycles: {
      title: "在週期中分組和限時您的工作。",
      description: "將工作分解為限時區塊,從專案截止日期倒推設定日期,並作為團隊取得實質性進展。",
      cta_primary: "設定您的第一個週期",
    },
    cycle_work_items: {
      title: "此週期中沒有要顯示的工作項",
      description: "建立工作項以開始監控團隊在此週期中的進度並按時實現目標。",
      cta_primary: "建立工作項",
      cta_secondary: "新增現有工作項",
    },
    modules: {
      title: "將專案目標對應到模組並輕鬆追蹤。",
      description:
        "模組由相互關聯的工作項組成。它們有助於監控專案階段的進度,每個階段都有特定的截止日期和分析,以指示您離實現這些階段有多近。",
      cta_primary: "設定您的第一個模組",
    },
    module_work_items: {
      title: "此模組中沒有要顯示的工作項",
      description: "建立工作項以開始監控此模組。",
      cta_primary: "建立工作項",
      cta_secondary: "新增現有工作項",
    },
    views: {
      title: "為專案儲存自訂檢視",
      description:
        "檢視是已儲存的篩選器,可協助您快速存取最常用的資訊。團隊成員可以輕鬆協作,共用檢視並根據特定需求進行調整。",
      cta_primary: "建立檢視",
    },
    no_work_items_in_project: {
      title: "專案中暫無工作項",
      description: "將工作項新增至專案中,並使用檢視將工作切分為可追蹤的部分。",
      cta_primary: "新增工作項",
    },
    work_item_filter: {
      title: "未找到工作項",
      description: "您目前的篩選器未傳回任何結果。請嘗試變更篩選器。",
      cta_primary: "新增工作項",
    },
    pages: {
      title: "記錄一切 — 從筆記到 PRD",
      description:
        "頁面讓您在一個地方擷取和組織資訊。撰寫會議筆記、專案文件和 PRD,嵌入工作項,並使用現成的元件進行結構化。",
      cta_primary: "建立您的第一個頁面",
    },
    archive_pages: {
      title: "暫無已封存頁面",
      description: "封存不在您關注範圍內的頁面。需要時在此處存取它們。",
    },
    intake_sidebar: {
      title: "記錄接收請求",
      description: "提交新請求以在專案工作流程中進行審查、優先順序排序和追蹤。",
      cta_primary: "建立接收請求",
    },
    intake_main: {
      title: "選擇一個接收工作項以查看其詳細資訊",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "暫無已封存工作項",
      description: "透過手動或自動化,您可以封存已完成或已取消的工作項。封存後在此處尋找它們。",
      cta_primary: "設定自動化",
    },
    archive_cycles: {
      title: "暫無已封存週期",
      description: "為了整理專案,請封存已完成的週期。封存後在此處尋找它們。",
    },
    archive_modules: {
      title: "暫無已封存模組",
      description: "為了整理專案,請封存已完成或已取消的模組。封存後在此處尋找它們。",
    },
    home_widget_quick_links: {
      title: "為您的工作保留重要的參考、資源或文件",
    },
    inbox_sidebar_all: {
      title: "您訂閱的工作項的更新將顯示在此處",
    },
    inbox_sidebar_mentions: {
      title: "您的工作項的提及將顯示在此處",
    },
    your_work_by_priority: {
      title: "尚未分配工作項",
    },
    your_work_by_state: {
      title: "尚未分配工作項",
    },
    views: {
      title: "暫無檢視",
      description: "將工作項新增至專案中並使用檢視輕鬆篩選、排序和監控進度。",
      cta_primary: "新增工作項",
    },
    drafts: {
      title: "半成品工作項",
      description: "要試用此功能,請開始新增工作項並在中途離開,或在下方建立您的第一個草稿。😉",
      cta_primary: "建立草稿工作項",
    },
    projects_archived: {
      title: "沒有已封存專案",
      description: "看起來您的所有專案仍然活躍 — 做得好!",
    },
    analytics_projects: {
      title: "建立專案以在此處視覺化專案指標。",
    },
    analytics_work_items: {
      title: "建立包含工作項和受託人的專案,以開始在此處追蹤績效、進度和團隊影響。",
    },
    analytics_no_cycle: {
      title: "建立週期以將工作組織成有時限的階段並追蹤衝刺進度。",
    },
    analytics_no_module: {
      title: "建立模組以組織工作並追蹤不同階段的進度。",
    },
    analytics_no_intake: {
      title: "設定接收以管理傳入請求並追蹤它們的接受和拒絕情況",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "暫無估算",
      description: "定義團隊如何衡量工作量,並在所有工作項中一致地追蹤它。",
      cta_primary: "新增估算系統",
    },
    labels: {
      title: "暫無標籤",
      description: "建立個人化標籤以有效分類和管理工作項。",
      cta_primary: "建立您的第一個標籤",
    },
    exports: {
      title: "暫無匯出",
      description: "您目前沒有任何匯出記錄。匯出資料後,所有記錄將顯示在此處。",
    },
    tokens: {
      title: "暫無個人權杖",
      description: "產生安全的 API 權杖以將工作區與外部系統和應用程式連線。",
      cta_primary: "新增 API 權杖",
    },
    webhooks: {
      title: "尚未新增 Webhook",
      description: "在專案事件發生時自動向外部服務傳送通知。",
      cta_primary: "新增 webhook",
    },
  },
} as const;

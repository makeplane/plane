export default {
  common_empty_state: {
    progress: {
      title: "暂无进度指标可显示。",
      description: "开始在工作项中设置属性值以在此查看进度指标。",
    },
    updates: {
      title: "暂无更新。",
      description: "项目成员添加更新后将显示在此处",
    },
    search: {
      title: "未找到匹配结果。",
      description: "未找到结果。请尝试调整搜索条件。",
    },
    not_found: {
      title: "糟糕!似乎出了点问题",
      description: "我们目前无法获取您的 Plane 账户。这可能是网络错误。",
      cta_primary: "尝试重新加载",
    },
    server_error: {
      title: "服务器错误",
      description: "我们无法连接并从服务器获取数据。请放心,我们正在处理。",
      cta_primary: "尝试重新加载",
    },
  },
  project_empty_state: {
    no_access: {
      title: "您似乎无权访问该项目",
      restricted_description: "请联系管理员申请访问权限，通过后您可以在此继续。",
      join_description: "点击下方按钮加入该项目。",
      cta_primary: "加入项目",
      cta_loading: "正在加入项目",
    },
    invalid_project: {
      title: "未找到项目",
      description: "您查找的项目不存在。",
    },
    work_items: {
      title: "从您的第一个工作项开始。",
      description: "工作项是项目的构建块 — 分配负责人、设置优先级并轻松跟踪进度。",
      cta_primary: "创建您的第一个工作项",
    },
    cycles: {
      title: "在周期中分组和限时您的工作。",
      description: "将工作分解为限时块,从项目截止日期倒推设置日期,并作为团队取得实质性进展。",
      cta_primary: "设置您的第一个周期",
    },
    cycle_work_items: {
      title: "此周期中没有要显示的工作项",
      description: "创建工作项以开始监控团队在此周期中的进度并按时实现目标。",
      cta_primary: "创建工作项",
      cta_secondary: "添加现有工作项",
    },
    modules: {
      title: "将项目目标映射到模块并轻松跟踪。",
      description:
        "模块由相互关联的工作项组成。它们有助于监控项目阶段的进度,每个阶段都有特定的截止日期和分析,以指示您离实现这些阶段有多近。",
      cta_primary: "设置您的第一个模块",
    },
    module_work_items: {
      title: "此模块中没有要显示的工作项",
      description: "创建工作项以开始监控此模块。",
      cta_primary: "创建工作项",
      cta_secondary: "添加现有工作项",
    },
    views: {
      title: "为项目保存自定义视图",
      description:
        "视图是保存的过滤器,可帮助您快速访问最常用的信息。团队成员可以轻松协作,共享视图并根据特定需求进行调整。",
      cta_primary: "创建视图",
    },
    no_work_items_in_project: {
      title: "项目中暂无工作项",
      description: "将工作项添加到项目中,并使用视图将工作切分为可跟踪的部分。",
      cta_primary: "添加工作项",
    },
    work_item_filter: {
      title: "未找到工作项",
      description: "您当前的过滤器未返回任何结果。请尝试更改过滤器。",
      cta_primary: "添加工作项",
    },
    pages: {
      title: "记录一切 — 从笔记到 PRD",
      description:
        "页面让您在一个地方捕获和组织信息。编写会议笔记、项目文档和 PRD,嵌入工作项,并使用现成的组件进行结构化。",
      cta_primary: "创建您的第一个页面",
    },
    archive_pages: {
      title: "暂无已归档页面",
      description: "归档不在您关注范围内的页面。需要时在此处访问它们。",
    },
    intake_sidebar: {
      title: "记录接收请求",
      description: "提交新请求以在项目工作流程中进行审查、优先排序和跟踪。",
      cta_primary: "创建接收请求",
    },
    intake_main: {
      title: "选择一个接收工作项以查看其详细信息",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "暂无已归档工作项",
      description: "通过手动或自动化,您可以归档已完成或已取消的工作项。归档后在此处查找它们。",
      cta_primary: "设置自动化",
    },
    archive_cycles: {
      title: "暂无已归档周期",
      description: "为了整理项目,请归档已完成的周期。归档后在此处查找它们。",
    },
    archive_modules: {
      title: "暂无已归档模块",
      description: "为了整理项目,请归档已完成或已取消的模块。归档后在此处查找它们。",
    },
    home_widget_quick_links: {
      title: "为您的工作保留重要的参考、资源或文档",
    },
    inbox_sidebar_all: {
      title: "您订阅的工作项的更新将显示在此处",
    },
    inbox_sidebar_mentions: {
      title: "您的工作项的提及将显示在此处",
    },
    your_work_by_priority: {
      title: "尚未分配工作项",
    },
    your_work_by_state: {
      title: "尚未分配工作项",
    },
    views: {
      title: "暂无视图",
      description: "将工作项添加到项目中并使用视图轻松过滤、排序和监控进度。",
      cta_primary: "添加工作项",
    },
    drafts: {
      title: "半成品工作项",
      description: "要试用此功能,请开始添加工作项并在中途离开,或在下方创建您的第一个草稿。😉",
      cta_primary: "创建草稿工作项",
    },
    projects_archived: {
      title: "没有已归档项目",
      description: "看起来您的所有项目仍然活跃 — 做得好!",
    },
    analytics_projects: {
      title: "创建项目以在此处可视化项目指标。",
    },
    analytics_work_items: {
      title: "创建包含工作项和受理人的项目,以开始在此处跟踪绩效、进度和团队影响。",
    },
    analytics_no_cycle: {
      title: "创建周期以将工作组织成有时限的阶段并跟踪冲刺进度。",
    },
    analytics_no_module: {
      title: "创建模块以组织工作并跟踪不同阶段的进度。",
    },
    analytics_no_intake: {
      title: "设置接收以管理传入请求并跟踪它们的接受和拒绝情况",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "暂无估算",
      description: "定义团队如何衡量工作量,并在所有工作项中一致地跟踪它。",
      cta_primary: "添加估算系统",
    },
    labels: {
      title: "暂无标签",
      description: "创建个性化标签以有效分类和管理工作项。",
      cta_primary: "创建您的第一个标签",
    },
    exports: {
      title: "暂无导出",
      description: "您目前没有任何导出记录。导出数据后,所有记录将显示在此处。",
    },
    tokens: {
      title: "暂无个人令牌",
      description: "生成安全的 API 令牌以将工作空间与外部系统和应用程序连接。",
      cta_primary: "添加 API 令牌",
    },
    webhooks: {
      title: "尚未添加 Webhook",
      description: "在项目事件发生时自动向外部服务发送通知。",
      cta_primary: "添加 webhook",
    },
  },
} as const;

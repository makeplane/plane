export default {
  common_empty_state: {
    progress: {
      title: "아직 표시할 진행 지표가 없습니다.",
      description: "작업 항목에서 속성 값을 설정하여 여기에서 진행 지표를 확인하세요.",
    },
    updates: {
      title: "아직 업데이트가 없습니다.",
      description: "프로젝트 멤버가 업데이트를 추가하면 여기에 표시됩니다",
    },
    search: {
      title: "일치하는 결과가 없습니다.",
      description: "결과를 찾을 수 없습니다. 검색어를 조정해 보세요.",
    },
    not_found: {
      title: "앗! 문제가 발생한 것 같습니다",
      description: "현재 Plane 계정을 가져올 수 없습니다. 네트워크 오류일 수 있습니다.",
      cta_primary: "다시 로드 시도",
    },
    server_error: {
      title: "서버 오류",
      description: "서버에 연결하여 데이터를 가져올 수 없습니다. 걱정하지 마세요, 작업 중입니다.",
      cta_primary: "다시 로드 시도",
    },
  },
  project_empty_state: {
    no_access: {
      title: "이 프로젝트에 접근할 수 없는 것 같습니다",
      restricted_description: "관리자에게 접근 권한을 요청하시면 여기서 계속 진행하실 수 있습니다.",
      join_description: "아래 버튼을 클릭하여 프로젝트에 참여하세요.",
      cta_primary: "프로젝트 참여",
      cta_loading: "프로젝트 참여 중",
    },
    invalid_project: {
      title: "프로젝트를 찾을 수 없습니다",
      description: "찾으시는 프로젝트가 존재하지 않습니다.",
    },
    work_items: {
      title: "첫 번째 작업 항목으로 시작하세요.",
      description:
        "작업 항목은 프로젝트의 구성 요소입니다. 소유자를 할당하고 우선순위를 설정하며 진행 상황을 쉽게 추적할 수 있습니다.",
      cta_primary: "첫 번째 작업 항목 생성",
    },
    cycles: {
      title: "사이클로 작업을 그룹화하고 시간을 정하세요.",
      description:
        "시간 제한이 있는 단위로 작업을 나누고, 프로젝트 마감일로부터 역으로 날짜를 설정하며, 팀으로서 구체적인 진전을 이루세요.",
      cta_primary: "첫 번째 사이클 설정",
    },
    cycle_work_items: {
      title: "이 사이클에 표시할 작업 항목이 없습니다",
      description: "작업 항목을 생성하여 이 사이클 동안 팀의 진행 상황을 모니터링하고 제시간에 목표를 달성하세요.",
      cta_primary: "작업 항목 생성",
      cta_secondary: "기존 작업 항목 추가",
    },
    modules: {
      title: "프로젝트 목표를 모듈에 매핑하고 쉽게 추적하세요.",
      description:
        "모듈은 상호 연결된 작업 항목으로 구성됩니다. 특정 기한과 분석을 통해 프로젝트 단계를 통한 진행 상황을 모니터링하여 해당 단계 달성에 얼마나 가까운지 나타냅니다.",
      cta_primary: "첫 번째 모듈 설정",
    },
    module_work_items: {
      title: "이 모듈에 표시할 작업 항목이 없습니다",
      description: "작업 항목을 생성하여 이 모듈을 모니터링하기 시작하세요.",
      cta_primary: "작업 항목 생성",
      cta_secondary: "기존 작업 항목 추가",
    },
    views: {
      title: "프로젝트를 위한 사용자 정의 보기 저장",
      description:
        "보기는 가장 자주 사용하는 정보에 빠르게 액세스하는 데 도움이 되는 저장된 필터입니다. 팀원들이 특정 요구 사항에 맞게 보기를 공유하고 조정하면서 손쉽게 협업하세요.",
      cta_primary: "보기 생성",
    },
    no_work_items_in_project: {
      title: "프로젝트에 아직 작업 항목이 없습니다",
      description: "프로젝트에 작업 항목을 추가하고 보기를 사용하여 작업을 추적 가능한 조각으로 나누세요.",
      cta_primary: "작업 항목 추가",
    },
    work_item_filter: {
      title: "작업 항목을 찾을 수 없습니다",
      description: "현재 필터가 결과를 반환하지 않았습니다. 필터를 변경해 보세요.",
      cta_primary: "작업 항목 추가",
    },
    pages: {
      title: "메모부터 PRD까지 모든 것을 문서화하세요",
      description:
        "페이지를 사용하면 정보를 한 곳에서 캡처하고 구성할 수 있습니다. 회의록, 프로젝트 문서 및 PRD를 작성하고, 작업 항목을 삽입하며, 바로 사용할 수 있는 구성 요소로 구조화하세요.",
      cta_primary: "첫 번째 페이지 생성",
    },
    archive_pages: {
      title: "아직 보관된 페이지가 없습니다",
      description: "주목하지 않는 페이지를 보관하세요. 필요할 때 여기에서 액세스하세요.",
    },
    intake_sidebar: {
      title: "접수 요청 기록",
      description: "프로젝트 워크플로우 내에서 검토, 우선순위 지정 및 추적할 새로운 요청을 제출하세요.",
      cta_primary: "접수 요청 생성",
    },
    intake_main: {
      title: "접수 작업 항목을 선택하여 세부 정보 보기",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "아직 보관된 작업 항목이 없습니다",
      description:
        "수동으로 또는 자동화를 통해 완료되거나 취소된 작업 항목을 보관할 수 있습니다. 보관되면 여기에서 찾을 수 있습니다.",
      cta_primary: "자동화 설정",
    },
    archive_cycles: {
      title: "아직 보관된 사이클이 없습니다",
      description: "프로젝트를 정리하려면 완료된 사이클을 보관하세요. 보관되면 여기에서 찾을 수 있습니다.",
    },
    archive_modules: {
      title: "아직 보관된 모듈이 없습니다",
      description: "프로젝트를 정리하려면 완료되거나 취소된 모듈을 보관하세요. 보관되면 여기에서 찾을 수 있습니다.",
    },
    home_widget_quick_links: {
      title: "작업에 편리한 중요한 참조 자료, 리소스 또는 문서 보관",
    },
    inbox_sidebar_all: {
      title: "구독한 작업 항목에 대한 업데이트가 여기에 표시됩니다",
    },
    inbox_sidebar_mentions: {
      title: "작업 항목에 대한 언급이 여기에 표시됩니다",
    },
    your_work_by_priority: {
      title: "아직 할당된 작업 항목이 없습니다",
    },
    your_work_by_state: {
      title: "아직 할당된 작업 항목이 없습니다",
    },
    views: {
      title: "아직 보기가 없습니다",
      description: "프로젝트에 작업 항목을 추가하고 보기를 사용하여 쉽게 필터링, 정렬 및 진행 상황을 모니터링하세요.",
      cta_primary: "작업 항목 추가",
    },
    drafts: {
      title: "작성 중인 작업 항목",
      description: "이를 시도하려면 작업 항목 추가를 시작하고 중간에 남겨두거나 아래에 첫 번째 초안을 만드세요. 😉",
      cta_primary: "초안 작업 항목 생성",
    },
    projects_archived: {
      title: "보관된 프로젝트가 없습니다",
      description: "모든 프로젝트가 여전히 활성 상태인 것 같습니다. 잘하셨습니다!",
    },
    analytics_projects: {
      title: "여기에서 프로젝트 지표를 시각화하려면 프로젝트를 생성하세요.",
    },
    analytics_work_items: {
      title:
        "작업 항목 및 담당자가 있는 프로젝트를 생성하여 여기에서 성과, 진행 상황 및 팀 영향을 추적하기 시작하세요.",
    },
    analytics_no_cycle: {
      title: "사이클을 생성하여 작업을 시간 제한 단계로 구성하고 스프린트 전반에 걸쳐 진행 상황을 추적하세요.",
    },
    analytics_no_module: {
      title: "모듈을 생성하여 작업을 구성하고 다양한 단계에서 진행 상황을 추적하세요.",
    },
    analytics_no_intake: {
      title: "접수를 설정하여 들어오는 요청을 관리하고 승인 및 거부 방법을 추적하세요",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "아직 추정치가 없습니다",
      description: "팀이 노력을 측정하는 방법을 정의하고 모든 작업 항목에서 일관되게 추적하세요.",
      cta_primary: "추정 시스템 추가",
    },
    labels: {
      title: "아직 레이블이 없습니다",
      description: "작업 항목을 효과적으로 분류하고 관리하기 위한 개인화된 레이블을 만드세요.",
      cta_primary: "첫 번째 레이블 생성",
    },
    exports: {
      title: "아직 내보내기가 없습니다",
      description: "현재 내보내기 기록이 없습니다. 데이터를 내보내면 모든 기록이 여기에 표시됩니다.",
    },
    tokens: {
      title: "아직 개인 토큰이 없습니다",
      description: "작업 공간을 외부 시스템 및 애플리케이션과 연결하기 위한 보안 API 토큰을 생성하세요.",
      cta_primary: "API 토큰 추가",
    },
    webhooks: {
      title: "아직 웹훅이 추가되지 않았습니다",
      description: "프로젝트 이벤트가 발생할 때 외부 서비스에 대한 알림을 자동화하세요.",
      cta_primary: "웹훅 추가",
    },
  },
} as const;

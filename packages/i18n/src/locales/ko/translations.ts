export default {
  sidebar: {
    projects: "프로젝트",
    pages: "페이지",
    new_work_item: "새 작업 항목",
    home: "홈",
    your_work: "나의 작업",
    inbox: "받은 편지함",
    workspace: "작업 공간",
    views: "보기",
    analytics: "분석",
    work_items: "작업 항목",
    cycles: "주기",
    modules: "모듈",
    intake: "접수",
    drafts: "초안",
    favorites: "즐겨찾기",
    pro: "프로",
    upgrade: "업그레이드",
  },
  auth: {
    common: {
      email: {
        label: "이메일",
        placeholder: "name@company.com",
        errors: {
          required: "이메일이 필요합니다",
          invalid: "유효하지 않은 이메일입니다",
        },
      },
      password: {
        label: "비밀번호",
        set_password: "비밀번호 설정",
        placeholder: "비밀번호 입력",
        confirm_password: {
          label: "비밀번호 확인",
          placeholder: "비밀번호 확인",
        },
        current_password: {
          label: "현재 비밀번호",
        },
        new_password: {
          label: "새 비밀번호",
          placeholder: "새 비밀번호 입력",
        },
        change_password: {
          label: {
            default: "비밀번호 변경",
            submitting: "비밀번호 변경 중",
          },
        },
        errors: {
          match: "비밀번호가 일치하지 않습니다",
          empty: "비밀번호를 입력해주세요",
          length: "비밀번호는 8자 이상이어야 합니다",
          strength: {
            weak: "비밀번호가 약합니다",
            strong: "비밀번호가 강합니다",
          },
        },
        submit: "비밀번호 설정",
        toast: {
          change_password: {
            success: {
              title: "성공!",
              message: "비밀번호가 성공적으로 변경되었습니다.",
            },
            error: {
              title: "오류!",
              message: "문제가 발생했습니다. 다시 시도해주세요.",
            },
          },
        },
      },
      unique_code: {
        label: "고유 코드",
        placeholder: "123456",
        paste_code: "이메일로 전송된 코드를 붙여넣기",
        requesting_new_code: "새 코드 요청 중",
        sending_code: "코드 전송 중",
      },
      already_have_an_account: "이미 계정이 있으신가요?",
      login: "로그인",
      create_account: "계정 만들기",
      new_to_plane: "Plane을 처음 사용하시나요?",
      back_to_sign_in: "로그인으로 돌아가기",
      resend_in: "{seconds}초 후 다시 전송",
      sign_in_with_unique_code: "고유 코드로 로그인",
      forgot_password: "비밀번호를 잊으셨나요?",
    },
    sign_up: {
      header: {
        label: "팀과 함께 작업을 관리하려면 계정을 만드세요.",
        step: {
          email: {
            header: "가입",
            sub_header: "",
          },
          password: {
            header: "가입",
            sub_header: "이메일-비밀번호 조합으로 가입하세요.",
          },
          unique_code: {
            header: "가입",
            sub_header: "위 이메일 주소로 전송된 고유 코드로 가입하세요.",
          },
        },
      },
      errors: {
        password: {
          strength: "강력한 비밀번호를 설정하여 진행하세요",
        },
      },
    },
    sign_in: {
      header: {
        label: "팀과 함께 작업을 관리하려면 로그인하세요.",
        step: {
          email: {
            header: "로그인 또는 가입",
            sub_header: "",
          },
          password: {
            header: "로그인 또는 가입",
            sub_header: "이메일-비밀번호 조합을 사용하여 로그인하세요.",
          },
          unique_code: {
            header: "로그인 또는 가입",
            sub_header: "위 이메일 주소로 전송된 고유 코드로 로그인하세요.",
          },
        },
      },
    },
    forgot_password: {
      title: "비밀번호 재설정",
      description: "사용자 계정의 인증된 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드립니다.",
      email_sent: "이메일 주소로 재설정 링크를 보냈습니다",
      send_reset_link: "재설정 링크 보내기",
      errors: {
        smtp_not_enabled: "SMTP가 활성화되지 않았습니다. 비밀번호 재설정 링크를 보낼 수 없습니다.",
      },
      toast: {
        success: {
          title: "이메일 전송됨",
          message: "비밀번호 재설정 링크를 확인하세요. 몇 분 내에 나타나지 않으면 스팸 폴더를 확인하세요.",
        },
        error: {
          title: "오류!",
          message: "문제가 발생했습니다. 다시 시도해주세요.",
        },
      },
    },
    reset_password: {
      title: "새 비밀번호 설정",
      description: "강력한 비밀번호로 계정을 보호하세요",
    },
    set_password: {
      title: "계정 보호",
      description: "비밀번호 설정은 안전한 로그인을 도와줍니다",
    },
    sign_out: {
      toast: {
        error: {
          title: "오류!",
          message: "로그아웃에 실패했습니다. 다시 시도해주세요.",
        },
      },
    },
  },
  submit: "제출",
  cancel: "취소",
  loading: "로딩 중",
  error: "오류",
  success: "성공",
  warning: "경고",
  info: "정보",
  close: "닫기",
  yes: "예",
  no: "아니오",
  ok: "확인",
  name: "이름",
  description: "설명",
  search: "검색",
  add_member: "멤버 추가",
  adding_members: "멤버 추가 중",
  remove_member: "멤버 제거",
  add_members: "멤버 추가",
  adding_member: "멤버 추가 중",
  remove_members: "멤버 제거",
  add: "추가",
  adding: "추가 중",
  remove: "제거",
  add_new: "새로 추가",
  remove_selected: "선택 제거",
  first_name: "이름",
  last_name: "성",
  email: "이메일",
  display_name: "표시 이름",
  role: "역할",
  timezone: "시간대",
  avatar: "아바타",
  cover_image: "커버 이미지",
  password: "비밀번호",
  change_cover: "커버 변경",
  language: "언어",
  saving: "저장 중",
  save_changes: "변경 사항 저장",
  deactivate_account: "계정 비활성화",
  deactivate_account_description:
    "계정을 비활성화하면 해당 계정 내의 모든 데이터와 리소스가 영구적으로 삭제되며 복구할 수 없습니다.",
  profile_settings: "프로필 설정",
  your_account: "나의 계정",
  security: "보안",
  activity: "활동",
  appearance: "외관",
  notifications: "알림",
  workspaces: "작업 공간",
  create_workspace: "작업 공간 생성",
  invitations: "초대",
  summary: "요약",
  assigned: "할당됨",
  created: "생성됨",
  subscribed: "구독됨",
  you_do_not_have_the_permission_to_access_this_page: "이 페이지에 접근할 권한이 없습니다.",
  something_went_wrong_please_try_again: "문제가 발생했습니다. 다시 시도해주세요.",
  load_more: "더 보기",
  select_or_customize_your_interface_color_scheme: "인터페이스 색상 테마를 선택하거나 사용자 정의하세요.",
  theme: "테마",
  system_preference: "시스템 기본값",
  light: "라이트",
  dark: "다크",
  light_contrast: "라이트 고대비",
  dark_contrast: "다크 고대비",
  custom: "사용자 정의 테마",
  select_your_theme: "테마 선택",
  customize_your_theme: "테마 사용자 정의",
  background_color: "배경 색상",
  text_color: "텍스트 색상",
  primary_color: "기본(테마) 색상",
  sidebar_background_color: "사이드바 배경 색상",
  sidebar_text_color: "사이드바 텍스트 색상",
  set_theme: "테마 설정",
  enter_a_valid_hex_code_of_6_characters: "유효한 6자리 헥스 코드를 입력하세요",
  background_color_is_required: "배경 색상이 필요합니다",
  text_color_is_required: "텍스트 색상이 필요합니다",
  primary_color_is_required: "기본 색상이 필요합니다",
  sidebar_background_color_is_required: "사이드바 배경 색상이 필요합니다",
  sidebar_text_color_is_required: "사이드바 텍스트 색상이 필요합니다",
  updating_theme: "테마 업데이트 중",
  theme_updated_successfully: "테마가 성공적으로 업데이트되었습니다",
  failed_to_update_the_theme: "테마 업데이트에 실패했습니다",
  email_notifications: "이메일 알림",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "구독한 작업 항목에 대한 최신 정보를 유지하세요. 알림을 받으려면 이 기능을 활성화하세요.",
  email_notification_setting_updated_successfully: "이메일 알림 설정이 성공적으로 업데이트되었습니다",
  failed_to_update_email_notification_setting: "이메일 알림 설정 업데이트에 실패했습니다",
  notify_me_when: "다음 경우 알림",
  property_changes: "속성 변경",
  property_changes_description: "작업 항목의 속성(담당자, 우선순위, 추정치 등)이 변경될 때 알림을 받습니다.",
  state_change: "상태 변경",
  state_change_description: "작업 항목이 다른 상태로 이동할 때 알림을 받습니다",
  issue_completed: "작업 항목 완료",
  issue_completed_description: "작업 항목이 완료될 때만 알림을 받습니다",
  comments: "댓글",
  comments_description: "작업 항목에 누군가 댓글을 남길 때 알림을 받습니다",
  mentions: "멘션",
  mentions_description: "댓글이나 설명에서 누군가 나를 멘션할 때만 알림을 받습니다",
  old_password: "기존 비밀번호",
  general_settings: "일반 설정",
  sign_out: "로그아웃",
  signing_out: "로그아웃 중",
  active_cycles: "활성 주기",
  active_cycles_description:
    "프로젝트 전반의 주기를 모니터링하고, 고우선 작업 항목을 추적하며, 주의가 필요한 주기를 확대합니다.",
  on_demand_snapshots_of_all_your_cycles: "모든 주기의 주문형 스냅샷",
  upgrade: "업그레이드",
  "10000_feet_view": "10,000피트 뷰",
  "10000_feet_view_description": "모든 프로젝트의 주기를 한 번에 확인할 수 있습니다.",
  get_snapshot_of_each_active_cycle: "각 활성 주기의 스냅샷을 얻으세요.",
  get_snapshot_of_each_active_cycle_description:
    "모든 활성 주기의 고수준 메트릭을 추적하고, 진행 상태를 확인하며, 마감일에 대한 범위를 파악합니다.",
  compare_burndowns: "버다운 비교",
  compare_burndowns_description: "각 팀의 성과를 모니터링하고 각 주기의 버다운 보고서를 확인합니다.",
  quickly_see_make_or_break_issues: "빠르게 중요한 작업 항목을 확인하세요.",
  quickly_see_make_or_break_issues_description:
    "각 주기의 고우선 작업 항목을 미리 보고 마감일에 대한 모든 작업 항목을 한 번에 확인합니다.",
  zoom_into_cycles_that_need_attention: "주의가 필요한 주기를 확대하세요.",
  zoom_into_cycles_that_need_attention_description: "기대에 부합하지 않는 주기의 상태를 한 번에 조사합니다.",
  stay_ahead_of_blockers: "차단 요소를 미리 파악하세요.",
  stay_ahead_of_blockers_description:
    "프로젝트 간의 문제를 파악하고 다른 뷰에서 명확하지 않은 주기 간의 종속성을 확인합니다.",
  analytics: "분석",
  workspace_invites: "작업 공간 초대",
  enter_god_mode: "갓 모드로 전환",
  workspace_logo: "작업 공간 로고",
  new_issue: "새 작업 항목",
  your_work: "나의 작업",
  drafts: "초안",
  projects: "프로젝트",
  views: "보기",
  workspace: "작업 공간",
  archives: "아카이브",
  settings: "설정",
  failed_to_move_favorite: "즐겨찾기 이동 실패",
  favorites: "즐겨찾기",
  no_favorites_yet: "아직 즐겨찾기가 없습니다",
  create_folder: "폴더 생성",
  new_folder: "새 폴더",
  favorite_updated_successfully: "즐겨찾기가 성공적으로 업데이트되었습니다",
  favorite_created_successfully: "즐겨찾기가 성공적으로 생성되었습니다",
  folder_already_exists: "폴더가 이미 존재합니다",
  folder_name_cannot_be_empty: "폴더 이름은 비워둘 수 없습니다",
  something_went_wrong: "문제가 발생했습니다",
  failed_to_reorder_favorite: "즐겨찾기 재정렬 실패",
  favorite_removed_successfully: "즐겨찾기가 성공적으로 제거되었습니다",
  failed_to_create_favorite: "즐겨찾기 생성 실패",
  failed_to_rename_favorite: "즐겨찾기 이름 변경 실패",
  project_link_copied_to_clipboard: "프로젝트 링크가 클립보드에 복사되었습니다",
  link_copied: "링크 복사됨",
  add_project: "프로젝트 추가",
  create_project: "프로젝트 생성",
  failed_to_remove_project_from_favorites: "프로젝트를 즐겨찾기에서 제거하지 못했습니다. 다시 시도해주세요.",
  project_created_successfully: "프로젝트가 성공적으로 생성되었습니다",
  project_created_successfully_description:
    "프로젝트가 성공적으로 생성되었습니다. 이제 작업 항목을 추가할 수 있습니다.",
  project_name_already_taken: "프로젝트 이름이 이미 사용 중입니다.",
  project_identifier_already_taken: "프로젝트 식별자가 이미 사용 중입니다.",
  project_cover_image_alt: "프로젝트 커버 이미지",
  name_is_required: "이름이 필요합니다",
  title_should_be_less_than_255_characters: "제목은 255자 미만이어야 합니다",
  project_name: "프로젝트 이름",
  project_id_must_be_at_least_1_character: "프로젝트 ID는 최소 1자 이상이어야 합니다",
  project_id_must_be_at_most_5_characters: "프로젝트 ID는 최대 5자 이하여야 합니다",
  project_id: "프로젝트 ID",
  project_id_tooltip_content: "작업 항목을 고유하게 식별하는 데 도움이 됩니다. 최대 10자.",
  description_placeholder: "설명",
  only_alphanumeric_non_latin_characters_allowed: "영숫자 및 비라틴 문자만 허용됩니다.",
  project_id_is_required: "프로젝트 ID가 필요합니다",
  project_id_allowed_char: "영숫자 및 비라틴 문자만 허용됩니다.",
  project_id_min_char: "프로젝트 ID는 최소 1자 이상이어야 합니다",
  project_id_max_char: "프로젝트 ID는 최대 10자 이하여야 합니다",
  project_description_placeholder: "프로젝트 설명 입력",
  select_network: "네트워크 선택",
  lead: "리드",
  date_range: "날짜 범위",
  private: "비공개",
  public: "공개",
  accessible_only_by_invite: "초대에 의해서만 접근 가능",
  anyone_in_the_workspace_except_guests_can_join: "게스트를 제외한 작업 공간의 모든 사람이 참여할 수 있습니다",
  creating: "생성 중",
  creating_project: "프로젝트 생성 중",
  adding_project_to_favorites: "프로젝트를 즐겨찾기에 추가 중",
  project_added_to_favorites: "프로젝트가 즐겨찾기에 추가되었습니다",
  couldnt_add_the_project_to_favorites: "프로젝트를 즐겨찾기에 추가하지 못했습니다. 다시 시도해주세요.",
  removing_project_from_favorites: "프로젝트를 즐겨찾기에서 제거 중",
  project_removed_from_favorites: "프로젝트가 즐겨찾기에서 제거되었습니다",
  couldnt_remove_the_project_from_favorites: "프로젝트를 즐겨찾기에서 제거하지 못했습니다. 다시 시도해주세요.",
  add_to_favorites: "즐겨찾기에 추가",
  remove_from_favorites: "즐겨찾기에서 제거",
  publish_project: "프로젝트 게시",
  publish: "게시",
  copy_link: "링크 복사",
  leave_project: "프로젝트 떠나기",
  join_the_project_to_rearrange: "프로젝트에 참여하여 재정렬",
  drag_to_rearrange: "드래그하여 재정렬",
  congrats: "축하합니다!",
  open_project: "프로젝트 열기",
  issues: "작업 항목",
  cycles: "주기",
  modules: "모듈",
  pages: "페이지",
  intake: "접수",
  time_tracking: "시간 추적",
  work_management: "작업 관리",
  projects_and_issues: "프로젝트 및 작업 항목",
  projects_and_issues_description: "이 프로젝트에서 이들을 켜거나 끕니다.",
  cycles_description:
    "프로젝트별로 작업 시간을 설정하고 필요에 따라 기간을 조정하세요. 한 주기는 2주일일 수 있고, 다음은 1주일일 수 있습니다.",
  modules_description: "작업을 전담 리더와 담당자가 있는 하위 프로젝트로 구성하세요.",
  views_description: "사용자 정의 정렬, 필터 및 표시 옵션을 저장하거나 팀과 공유하세요.",
  pages_description: "자유 형식의 콘텐츠를 작성하고 편집하세요. 메모, 문서, 무엇이든 가능합니다.",
  intake_description: "비회원이 버그, 피드백, 제안을 공유할 수 있도록 하되, 워크플로우를 방해하지 않도록 합니다.",
  time_tracking_description: "작업 항목 및 프로젝트에 소요된 시간을 기록하세요.",
  work_management_description: "작업 및 프로젝트를 쉽게 관리합니다.",
  documentation: "문서",
  message_support: "지원 메시지",
  contact_sales: "영업 문의",
  hyper_mode: "하이퍼 모드",
  keyboard_shortcuts: "키보드 단축키",
  whats_new: "새로운 기능",
  version: "버전",
  we_are_having_trouble_fetching_the_updates: "업데이트를 가져오는 데 문제가 발생했습니다.",
  our_changelogs: "우리의 변경 로그",
  for_the_latest_updates: "최신 업데이트를 위해",
  please_visit: "방문해주세요",
  docs: "문서",
  full_changelog: "전체 변경 로그",
  support: "지원",
  discord: "디스코드",
  powered_by_plane_pages: "Plane Pages 제공",
  please_select_at_least_one_invitation: "최소 하나의 초대를 선택하세요.",
  please_select_at_least_one_invitation_description: "작업 공간에 참여하려면 최소 하나의 초대를 선택하세요.",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "누군가가 작업 공간에 참여하도록 초대했습니다",
  join_a_workspace: "작업 공간 참여",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description: "누군가가 작업 공간에 참여하도록 초대했습니다",
  join_a_workspace_description: "작업 공간 참여",
  accept_and_join: "수락하고 참여",
  go_home: "홈으로 이동",
  no_pending_invites: "보류 중인 초대 없음",
  you_can_see_here_if_someone_invites_you_to_a_workspace: "누군가가 작업 공간에 초대하면 여기에 표시됩니다",
  back_to_home: "홈으로 돌아가기",
  workspace_name: "작업 공간 이름",
  deactivate_your_account: "계정 비활성화",
  deactivate_your_account_description:
    "계정을 비활성화하면 작업 항목에 할당될 수 없으며 작업 공간에 대한 청구가 발생하지 않습니다. 계정을 다시 활성화하려면 이 이메일 주소로 작업 공간 초대가 필요합니다.",
  deactivating: "비활성화 중",
  confirm: "확인",
  confirming: "확인 중",
  draft_created: "초안 생성됨",
  issue_created_successfully: "작업 항목이 성공적으로 생성되었습니다",
  draft_creation_failed: "초안 생성 실패",
  issue_creation_failed: "작업 항목 생성 실패",
  draft_issue: "초안 작업 항목",
  issue_updated_successfully: "작업 항목이 성공적으로 업데이트되었습니다",
  issue_could_not_be_updated: "작업 항목을 업데이트할 수 없습니다",
  create_a_draft: "초안 생성",
  save_to_drafts: "초안에 저장",
  save: "저장",
  update: "업데이트",
  updating: "업데이트 중",
  create_new_issue: "새 작업 항목 생성",
  editor_is_not_ready_to_discard_changes: "편집기가 변경 사항을 폐기할 준비가 되지 않았습니다",
  failed_to_move_issue_to_project: "작업 항목을 프로젝트로 이동하지 못했습니다",
  create_more: "더 많이 생성",
  add_to_project: "프로젝트에 추가",
  discard: "폐기",
  duplicate_issue_found: "중복된 작업 항목 발견",
  duplicate_issues_found: "중복된 작업 항목 발견",
  no_matching_results: "일치하는 결과 없음",
  title_is_required: "제목이 필요합니다",
  title: "제목",
  state: "상태",
  priority: "우선순위",
  none: "없음",
  urgent: "긴급",
  high: "높음",
  medium: "중간",
  low: "낮음",
  members: "멤버",
  assignee: "담당자",
  assignees: "담당자",
  you: "나",
  labels: "레이블",
  create_new_label: "새 레이블 생성",
  start_date: "시작 날짜",
  end_date: "종료 날짜",
  due_date: "마감일",
  estimate: "추정",
  change_parent_issue: "상위 작업 항목 변경",
  remove_parent_issue: "상위 작업 항목 제거",
  add_parent: "상위 항목 추가",
  loading_members: "멤버 로딩 중",
  view_link_copied_to_clipboard: "뷰 링크가 클립보드에 복사되었습니다.",
  required: "필수",
  optional: "선택",
  Cancel: "취소",
  edit: "편집",
  archive: "아카이브",
  restore: "복원",
  open_in_new_tab: "새 탭에서 열기",
  delete: "삭제",
  deleting: "삭제 중",
  make_a_copy: "복사본 만들기",
  move_to_project: "프로젝트로 이동",
  good: "좋은",
  morning: "아침",
  afternoon: "오후",
  evening: "저녁",
  show_all: "모두 보기",
  show_less: "간략히 보기",
  no_data_yet: "아직 데이터 없음",
  syncing: "동기화 중",
  add_work_item: "작업 항목 추가",
  advanced_description_placeholder: "명령어를 위해 '/'를 누르세요",
  create_work_item: "작업 항목 생성",
  attachments: "첨부 파일",
  declining: "거절 중",
  declined: "거절됨",
  decline: "거절",
  unassigned: "미할당",
  work_items: "작업 항목",
  add_link: "링크 추가",
  points: "포인트",
  no_assignee: "담당자 없음",
  no_assignees_yet: "아직 담당자 없음",
  no_labels_yet: "아직 레이블 없음",
  ideal: "이상적인",
  current: "현재",
  no_matching_members: "일치하는 멤버 없음",
  leaving: "떠나는 중",
  removing: "제거 중",
  leave: "떠나기",
  refresh: "새로 고침",
  refreshing: "새로 고침 중",
  refresh_status: "상태 새로 고침",
  prev: "이전",
  next: "다음",
  re_generating: "다시 생성 중",
  re_generate: "다시 생성",
  re_generate_key: "키 다시 생성",
  export: "내보내기",
  member: "{count, plural, one{# 멤버} other{# 멤버}}",
  new_password_must_be_different_from_old_password: "새 비밀번호는 이전 비밀번호와 다르게 설정해야 합니다",
  edited: "수정됨",
  bot: "봇",
  project_view: {
    sort_by: {
      created_at: "생성일",
      updated_at: "업데이트일",
      name: "이름",
    },
  },
  toast: {
    success: "성공!",
    error: "오류!",
  },
  links: {
    toasts: {
      created: {
        title: "링크 생성됨",
        message: "링크가 성공적으로 생성되었습니다",
      },
      not_created: {
        title: "링크 생성되지 않음",
        message: "링크를 생성할 수 없습니다",
      },
      updated: {
        title: "링크 업데이트됨",
        message: "링크가 성공적으로 업데이트되었습니다",
      },
      not_updated: {
        title: "링크 업데이트되지 않음",
        message: "링크를 업데이트할 수 없습니다",
      },
      removed: {
        title: "링크 제거됨",
        message: "링크가 성공적으로 제거되었습니다",
      },
      not_removed: {
        title: "링크 제거되지 않음",
        message: "링크를 제거할 수 없습니다",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "빠른 시작 가이드",
      not_right_now: "지금은 안 함",
      create_project: {
        title: "프로젝트 생성",
        description: "Plane에서 대부분의 작업은 프로젝트로 시작됩니다.",
        cta: "시작하기",
      },
      invite_team: {
        title: "팀 초대",
        description: "동료와 함께 빌드, 배포 및 관리하세요.",
        cta: "초대하기",
      },
      configure_workspace: {
        title: "작업 공간 설정",
        description: "기능을 켜거나 끄거나 그 이상을 수행하세요.",
        cta: "이 작업 공간 설정",
      },
      personalize_account: {
        title: "Plane을 개인화하세요.",
        description: "사진, 색상 등을 선택하세요.",
        cta: "지금 개인화",
      },
      widgets: {
        title: "위젯이 없으면 조용합니다. 켜세요",
        description: "모든 위젯이 꺼져 있는 것 같습니다. 지금 활성화하여 경험을 향상시키세요!",
        primary_button: {
          text: "위젯 관리",
        },
      },
    },
    quick_links: {
      empty: "작업과 관련된 링크를 저장하세요.",
      add: "빠른 링크 추가",
      title: "빠른 링크",
      title_plural: "빠른 링크",
    },
    recents: {
      title: "최근 항목",
      empty: {
        project: "최근 방문한 프로젝트가 여기에 표시됩니다.",
        page: "최근 방문한 페이지가 여기에 표시됩니다.",
        issue: "최근 방문한 작업 항목이 여기에 표시됩니다.",
        default: "아직 최근 항목이 없습니다.",
      },
      filters: {
        all: "모든",
        projects: "프로젝트",
        pages: "페이지",
        issues: "작업 항목",
      },
    },
    new_at_plane: {
      title: "Plane의 새로운 기능",
    },
    quick_tutorial: {
      title: "빠른 튜토리얼",
    },
    widget: {
      reordered_successfully: "위젯이 성공적으로 재정렬되었습니다.",
      reordering_failed: "위젯 재정렬 중 오류가 발생했습니다.",
    },
    manage_widgets: "위젯 관리",
    title: "홈",
    star_us_on_github: "GitHub에서 별표",
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL이 유효하지 않습니다",
        placeholder: "URL 입력 또는 붙여넣기",
      },
      title: {
        text: "표시 제목",
        placeholder: "이 링크를 어떻게 표시할지 입력하세요",
      },
    },
  },
  common: {
    all: "모두",
    no_items_in_this_group: "이 그룹에 항목이 없습니다",
    drop_here_to_move: "이동하려면 여기에 드롭하세요",
    states: "상태",
    state: "상태",
    state_groups: "상태 그룹",
    state_group: "상태 그룹",
    priorities: "우선순위",
    priority: "우선순위",
    team_project: "팀 프로젝트",
    project: "프로젝트",
    cycle: "주기",
    cycles: "주기",
    module: "모듈",
    modules: "모듈",
    labels: "레이블",
    label: "레이블",
    assignees: "담당자",
    assignee: "담당자",
    created_by: "생성자",
    none: "없음",
    link: "링크",
    estimates: "추정",
    estimate: "추정",
    created_at: "생성일",
    completed_at: "완료일",
    layout: "레이아웃",
    filters: "필터",
    display: "디스플레이",
    load_more: "더 보기",
    activity: "활동",
    analytics: "분석",
    dates: "날짜",
    success: "성공!",
    something_went_wrong: "문제가 발생했습니다",
    error: {
      label: "오류!",
      message: "오류가 발생했습니다. 다시 시도해주세요.",
    },
    group_by: "그룹화 기준",
    epic: "에픽",
    epics: "에픽",
    work_item: "작업 항목",
    work_items: "작업 항목",
    sub_work_item: "하위 작업 항목",
    add: "추가",
    warning: "경고",
    updating: "업데이트 중",
    adding: "추가 중",
    update: "업데이트",
    creating: "생성 중",
    create: "생성",
    cancel: "취소",
    description: "설명",
    title: "제목",
    attachment: "첨부 파일",
    general: "일반",
    features: "기능",
    automation: "자동화",
    project_name: "프로젝트 이름",
    project_id: "프로젝트 ID",
    project_timezone: "프로젝트 시간대",
    created_on: "생성일",
    update_project: "프로젝트 업데이트",
    identifier_already_exists: "식별자가 이미 존재합니다",
    add_more: "더 추가",
    defaults: "기본값",
    add_label: "레이블 추가",
    customize_time_range: "시간 범위 사용자 정의",
    loading: "로딩 중",
    attachments: "첨부 파일",
    property: "속성",
    properties: "속성",
    parent: "상위 항목",
    page: "페이지",
    remove: "제거",
    archiving: "아카이브 중",
    archive: "아카이브",
    access: {
      public: "공개",
      private: "비공개",
    },
    done: "완료",
    sub_work_items: "하위 작업 항목",
    comment: "댓글",
    workspace_level: "작업 공간 수준",
    order_by: {
      label: "정렬 기준",
      manual: "수동",
      last_created: "마지막 생성",
      last_updated: "마지막 업데이트",
      start_date: "시작 날짜",
      due_date: "마감일",
      asc: "오름차순",
      desc: "내림차순",
      updated_on: "업데이트일",
    },
    sort: {
      asc: "오름차순",
      desc: "내림차순",
      created_on: "생성일",
      updated_on: "업데이트일",
    },
    comments: "댓글",
    updates: "업데이트",
    clear_all: "모두 지우기",
    copied: "복사됨!",
    link_copied: "링크 복사됨!",
    link_copied_to_clipboard: "링크가 클립보드에 복사되었습니다",
    copied_to_clipboard: "작업 항목 링크가 클립보드에 복사되었습니다",
    is_copied_to_clipboard: "작업 항목이 클립보드에 복사되었습니다",
    no_links_added_yet: "아직 추가된 링크 없음",
    add_link: "링크 추가",
    links: "링크",
    go_to_workspace: "작업 공간으로 이동",
    progress: "진행",
    optional: "선택",
    join: "참여",
    go_back: "뒤로 가기",
    continue: "계속",
    resend: "다시 보내기",
    relations: "관계",
    errors: {
      default: {
        title: "오류!",
        message: "문제가 발생했습니다. 다시 시도해주세요.",
      },
      required: "이 필드는 필수입니다",
      entity_required: "{entity}가 필요합니다",
      restricted_entity: "{entity}은(는) 제한되어 있습니다",
    },
    update_link: "링크 업데이트",
    attach: "첨부",
    create_new: "새로 생성",
    add_existing: "기존 항목 추가",
    type_or_paste_a_url: "URL 입력 또는 붙여넣기",
    url_is_invalid: "URL이 유효하지 않습니다",
    display_title: "표시 제목",
    link_title_placeholder: "이 링크를 어떻게 표시할지 입력하세요",
    url: "URL",
    side_peek: "사이드 피크",
    modal: "모달",
    full_screen: "전체 화면",
    close_peek_view: "피크 뷰 닫기",
    toggle_peek_view_layout: "피크 뷰 레이아웃 전환",
    options: "옵션",
    duration: "기간",
    today: "오늘",
    week: "주",
    month: "월",
    quarter: "분기",
    press_for_commands: "명령어를 위해 '/'를 누르세요",
    click_to_add_description: "설명 추가를 위해 클릭하세요",
    search: {
      label: "검색",
      placeholder: "검색어 입력",
      no_matches_found: "일치하는 항목 없음",
      no_matching_results: "일치하는 결과 없음",
    },
    actions: {
      edit: "편집",
      make_a_copy: "복사본 만들기",
      open_in_new_tab: "새 탭에서 열기",
      copy_link: "링크 복사",
      archive: "아카이브",
      restore: "복원",
      delete: "삭제",
      remove_relation: "관계 제거",
      subscribe: "구독",
      unsubscribe: "구독 취소",
      clear_sorting: "정렬 지우기",
      show_weekends: "주말 표시",
      enable: "활성화",
      disable: "비활성화",
    },
    name: "이름",
    discard: "폐기",
    confirm: "확인",
    confirming: "확인 중",
    read_the_docs: "문서 읽기",
    default: "기본값",
    active: "활성",
    enabled: "활성화됨",
    disabled: "비활성화됨",
    mandate: "의무",
    mandatory: "필수",
    yes: "예",
    no: "아니오",
    please_wait: "기다려주세요",
    enabling: "활성화 중",
    disabling: "비활성화 중",
    beta: "베타",
    or: "또는",
    next: "다음",
    back: "뒤로",
    cancelling: "취소 중",
    configuring: "구성 중",
    clear: "지우기",
    import: "가져오기",
    connect: "연결",
    authorizing: "인증 중",
    processing: "처리 중",
    no_data_available: "사용 가능한 데이터 없음",
    from: "{name}에서",
    authenticated: "인증됨",
    select: "선택",
    upgrade: "업그레이드",
    add_seats: "좌석 추가",
    projects: "프로젝트",
    workspace: "작업 공간",
    workspaces: "작업 공간",
    team: "팀",
    teams: "팀",
    entity: "엔티티",
    entities: "엔티티",
    task: "작업",
    tasks: "작업",
    section: "섹션",
    sections: "섹션",
    edit: "편집",
    connecting: "연결 중",
    connected: "연결됨",
    disconnect: "연결 해제",
    disconnecting: "연결 해제 중",
    installing: "설치 중",
    install: "설치",
    reset: "재설정",
    live: "라이브",
    change_history: "변경 기록",
    coming_soon: "곧 출시",
    member: "멤버",
    members: "멤버",
    you: "나",
    upgrade_cta: {
      higher_subscription: "더 높은 구독으로 업그레이드",
      talk_to_sales: "영업팀과 상담",
    },
    category: "카테고리",
    categories: "카테고리",
    saving: "저장 중",
    save_changes: "변경 사항 저장",
    delete: "삭제",
    deleting: "삭제 중",
    pending: "보류 중",
    invite: "초대",
    view: "보기",
    deactivated_user: "비활성화된 사용자",
    apply: "적용",
    applying: "적용 중",
    users: "사용자",
    admins: "관리자",
    guests: "게스트",
    on_track: "계획대로 진행 중",
    off_track: "계획 이탈",
    at_risk: "위험",
    timeline: "타임라인",
    completion: "완료",
    upcoming: "예정된",
    completed: "완료됨",
    in_progress: "진행 중",
    planned: "계획된",
    paused: "일시 중지됨",
    no_of: "{entity} 수",
    resolved: "해결됨",
  },
  chart: {
    x_axis: "X축",
    y_axis: "Y축",
    metric: "메트릭",
  },
  form: {
    title: {
      required: "제목이 필요합니다",
      max_length: "제목은 {length}자 미만이어야 합니다",
    },
  },
  entity: {
    grouping_title: "{entity} 그룹화",
    priority: "{entity} 우선순위",
    all: "모든 {entity}",
    drop_here_to_move: "{entity}를 이동하려면 여기에 드롭하세요",
    delete: {
      label: "{entity} 삭제",
      success: "{entity}가 성공적으로 삭제되었습니다",
      failed: "{entity} 삭제 실패",
    },
    update: {
      failed: "{entity} 업데이트 실패",
      success: "{entity}가 성공적으로 업데이트되었습니다",
    },
    link_copied_to_clipboard: "{entity} 링크가 클립보드에 복사되었습니다",
    fetch: {
      failed: "{entity}를 가져오는 중 오류 발생",
    },
    add: {
      success: "{entity}가 성공적으로 추가되었습니다",
      failed: "{entity} 추가 중 오류 발생",
    },
    remove: {
      success: "{entity}가 성공적으로 제거되었습니다",
      failed: "{entity} 제거 중 오류 발생",
    },
  },
  epic: {
    all: "모든 에픽",
    label: "{count, plural, one {에픽} other {에픽}}",
    new: "새 에픽",
    adding: "에픽 추가 중",
    create: {
      success: "에픽이 성공적으로 생성되었습니다",
    },
    add: {
      press_enter: "다른 에픽을 추가하려면 'Enter'를 누르세요",
      label: "에픽 추가",
    },
    title: {
      label: "에픽 제목",
      required: "에픽 제목이 필요합니다.",
    },
  },
  issue: {
    label: "{count, plural, one {작업 항목} other {작업 항목}}",
    all: "모든 작업 항목",
    edit: "작업 항목 편집",
    title: {
      label: "작업 항목 제목",
      required: "작업 항목 제목이 필요합니다.",
    },
    add: {
      press_enter: "다른 작업 항목을 추가하려면 'Enter'를 누르세요",
      label: "작업 항목 추가",
      cycle: {
        failed: "작업 항목을 주기에 추가할 수 없습니다. 다시 시도해주세요.",
        success: "{count, plural, one {작업 항목} other {작업 항목}}이 주기에 성공적으로 추가되었습니다.",
        loading: "{count, plural, one {작업 항목} other {작업 항목}}을 주기에 추가 중",
      },
      assignee: "담당자 추가",
      start_date: "시작 날짜 추가",
      due_date: "마감일 추가",
      parent: "상위 작업 항목 추가",
      sub_issue: "하위 작업 항목 추가",
      relation: "관계 추가",
      link: "링크 추가",
      existing: "기존 작업 항목 추가",
    },
    remove: {
      label: "작업 항목 제거",
      cycle: {
        loading: "작업 항목을 주기에서 제거 중",
        success: "작업 항목이 주기에서 성공적으로 제거되었습니다.",
        failed: "작업 항목을 주기에서 제거할 수 없습니다. 다시 시도해주세요.",
      },
      module: {
        loading: "작업 항목을 모듈에서 제거 중",
        success: "작업 항목이 모듈에서 성공적으로 제거되었습니다.",
        failed: "작업 항목을 모듈에서 제거할 수 없습니다. 다시 시도해주세요.",
      },
      parent: {
        label: "상위 작업 항목 제거",
      },
    },
    new: "새 작업 항목",
    adding: "작업 항목 추가 중",
    create: {
      success: "작업 항목이 성공적으로 생성되었습니다",
    },
    priority: {
      urgent: "긴급",
      high: "높음",
      medium: "중간",
      low: "낮음",
    },
    display: {
      properties: {
        label: "디스플레이 속성",
        id: "ID",
        issue_type: "작업 항목 유형",
        sub_issue_count: "하위 작업 항목 수",
        attachment_count: "첨부 파일 수",
        created_on: "생성일",
        sub_issue: "하위 작업 항목",
        work_item_count: "작업 항목 수",
      },
      extra: {
        show_sub_issues: "하위 작업 항목 표시",
        show_empty_groups: "빈 그룹 표시",
      },
    },
    layouts: {
      ordered_by_label: "이 레이아웃은 다음 기준으로 정렬됩니다",
      list: "목록",
      kanban: "보드",
      calendar: "캘린더",
      spreadsheet: "테이블",
      gantt: "타임라인",
      title: {
        list: "목록 레이아웃",
        kanban: "보드 레이아웃",
        calendar: "캘린더 레이아웃",
        spreadsheet: "테이블 레이아웃",
        gantt: "타임라인 레이아웃",
      },
    },
    states: {
      active: "활성",
      backlog: "백로그",
    },
    comments: {
      placeholder: "댓글 추가",
      switch: {
        private: "비공개 댓글로 전환",
        public: "공개 댓글로 전환",
      },
      create: {
        success: "댓글이 성공적으로 생성되었습니다",
        error: "댓글 생성 실패. 나중에 다시 시도해주세요.",
      },
      update: {
        success: "댓글이 성공적으로 업데이트되었습니다",
        error: "댓글 업데이트 실패. 나중에 다시 시도해주세요.",
      },
      remove: {
        success: "댓글이 성공적으로 제거되었습니다",
        error: "댓글 제거 실패. 나중에 다시 시도해주세요.",
      },
      upload: {
        error: "자산 업로드 실패. 나중에 다시 시도해주세요.",
      },
      copy_link: {
        success: "댓글 링크가 클립보드에 복사되었습니다",
        error: "댓글 링크 복사 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "작업 항목이 존재하지 않습니다",
        description: "찾고 있는 작업 항목이 존재하지 않거나, 아카이브되었거나, 삭제되었습니다.",
        primary_button: {
          text: "다른 작업 항목 보기",
        },
      },
    },
    sibling: {
      label: "형제 작업 항목",
    },
    archive: {
      description: "완료되거나 취소된 작업 항목만 아카이브할 수 있습니다",
      label: "작업 항목 아카이브",
      confirm_message: "작업 항목을 아카이브하시겠습니까? 모든 아카이브된 작업 항목은 나중에 복원할 수 있습니다.",
      success: {
        label: "아카이브 성공",
        message: "아카이브된 항목은 프로젝트 아카이브에서 찾을 수 있습니다.",
      },
      failed: {
        message: "작업 항목을 아카이브할 수 없습니다. 다시 시도해주세요.",
      },
    },
    restore: {
      success: {
        title: "복원 성공",
        message: "작업 항목을 프로젝트 작업 항목에서 찾을 수 있습니다.",
      },
      failed: {
        message: "작업 항목을 복원할 수 없습니다. 다시 시도해주세요.",
      },
    },
    relation: {
      relates_to: "관련 있음",
      duplicate: "중복",
      blocked_by: "차단됨",
      blocking: "차단 중",
    },
    copy_link: "작업 항목 링크 복사",
    delete: {
      label: "작업 항목 삭제",
      error: "작업 항목 삭제 중 오류 발생",
    },
    subscription: {
      actions: {
        subscribed: "작업 항목이 성공적으로 구독되었습니다",
        unsubscribed: "작업 항목 구독이 성공적으로 취소되었습니다",
      },
    },
    select: {
      error: "최소 하나의 작업 항목을 선택하세요",
      empty: "선택된 작업 항목 없음",
      add_selected: "선택된 작업 항목 추가",
      select_all: "모두 선택",
      deselect_all: "모두 선택 해제",
    },
    open_in_full_screen: "작업 항목을 전체 화면으로 열기",
  },
  attachment: {
    error: "파일을 첨부할 수 없습니다. 다시 업로드하세요.",
    only_one_file_allowed: "한 번에 하나의 파일만 업로드할 수 있습니다.",
    file_size_limit: "파일 크기는 {size}MB 이하이어야 합니다.",
    drag_and_drop: "업로드하려면 아무 곳에나 드래그 앤 드롭하세요",
    delete: "첨부 파일 삭제",
  },
  label: {
    select: "레이블 선택",
    create: {
      success: "레이블이 성공적으로 생성되었습니다",
      failed: "레이블 생성 실패",
      already_exists: "레이블이 이미 존재합니다",
      type: "새 레이블을 추가하려면 입력하세요",
    },
  },
  sub_work_item: {
    update: {
      success: "하위 작업 항목이 성공적으로 업데이트되었습니다",
      error: "하위 작업 항목 업데이트 중 오류 발생",
    },
    remove: {
      success: "하위 작업 항목이 성공적으로 제거되었습니다",
      error: "하위 작업 항목 제거 중 오류 발생",
    },
    empty_state: {
      sub_list_filters: {
        title: "적용된 필터에 일치하는 하위 작업 항목이 없습니다.",
        description: "모든 하위 작업 항목을 보려면 모든 적용된 필터를 지우세요.",
        action: "필터 지우기",
      },
      list_filters: {
        title: "적용된 필터에 일치하는 작업 항목이 없습니다.",
        description: "모든 작업 항목을 보려면 모든 적용된 필터를 지우세요.",
        action: "필터 지우기",
      },
    },
  },
  view: {
    label: "{count, plural, one {뷰} other {뷰}}",
    create: {
      label: "뷰 생성",
    },
    update: {
      label: "뷰 업데이트",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "보류 중",
        description: "보류 중",
      },
      declined: {
        title: "거절됨",
        description: "거절됨",
      },
      snoozed: {
        title: "미루기",
        description: "{days, plural, one{# 일} other{# 일}} 남음",
      },
      accepted: {
        title: "수락됨",
        description: "수락됨",
      },
      duplicate: {
        title: "중복",
        description: "중복",
      },
    },
    modals: {
      decline: {
        title: "작업 항목 거절",
        content: "작업 항목 {value}을(를) 거절하시겠습니까?",
      },
      delete: {
        title: "작업 항목 삭제",
        content: "작업 항목 {value}을(를) 삭제하시겠습니까?",
        success: "작업 항목이 성공적으로 삭제되었습니다",
      },
    },
    errors: {
      snooze_permission: "프로젝트 관리자만 작업 항목을 미루거나 미루기 해제할 수 있습니다",
      accept_permission: "프로젝트 관리자만 작업 항목을 수락할 수 있습니다",
      decline_permission: "프로젝트 관리자만 작업 항목을 거절할 수 있습니다",
    },
    actions: {
      accept: "수락",
      decline: "거절",
      snooze: "미루기",
      unsnooze: "미루기 해제",
      copy: "작업 항목 링크 복사",
      delete: "삭제",
      open: "작업 항목 열기",
      mark_as_duplicate: "중복으로 표시",
      move: "{value}을(를) 프로젝트 작업 항목으로 이동",
    },
    source: {
      "in-app": "앱 내",
    },
    order_by: {
      created_at: "생성일",
      updated_at: "업데이트일",
      id: "ID",
    },
    label: "접수",
    page_label: "{workspace} - 접수",
    modal: {
      title: "접수 작업 항목 생성",
    },
    tabs: {
      open: "열기",
      closed: "닫기",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "열린 작업 항목 없음",
        description: "여기에서 열린 작업 항목을 찾을 수 있습니다. 새 작업 항목을 생성하세요.",
      },
      sidebar_closed_tab: {
        title: "닫힌 작업 항목 없음",
        description: "수락되거나 거절된 모든 작업 항목을 여기에서 찾을 수 있습니다.",
      },
      sidebar_filter: {
        title: "일치하는 작업 항목 없음",
        description: "적용된 필터와 일치하는 작업 항목이 없습니다. 새 작업 항목을 생성하세요.",
      },
      detail: {
        title: "작업 항목의 세부 정보를 보려면 선택하세요.",
      },
    },
  },
  workspace_creation: {
    heading: "작업 공간 생성",
    subheading: "Plane을 사용하려면 작업 공간을 생성하거나 참여해야 합니다.",
    form: {
      name: {
        label: "작업 공간 이름",
        placeholder: "익숙하고 인식 가능한 이름이 가장 좋습니다.",
      },
      url: {
        label: "작업 공간 URL 설정",
        placeholder: "URL 입력 또는 붙여넣기",
        edit_slug: "URL의 슬러그만 편집할 수 있습니다",
      },
      organization_size: {
        label: "이 작업 공간을 사용할 사람 수",
        placeholder: "범위 선택",
      },
    },
    errors: {
      creation_disabled: {
        title: "작업 공간은 인스턴스 관리자만 생성할 수 있습니다",
        description: "인스턴스 관리자 이메일 주소를 알고 있다면 아래 버튼을 클릭하여 연락하세요.",
        request_button: "인스턴스 관리자 요청",
      },
      validation: {
        name_alphanumeric: "작업 공간 이름에는 (' '), ('-'), ('_') 및 영숫자 문자만 포함될 수 있습니다.",
        name_length: "이름은 80자 이내로 제한하세요.",
        url_alphanumeric: "URL에는 ('-') 및 영숫자 문자만 포함될 수 있습니다.",
        url_length: "URL은 48자 이내로 제한하세요.",
        url_already_taken: "작업 공간 URL이 이미 사용 중입니다!",
      },
    },
    request_email: {
      subject: "새 작업 공간 요청",
      body: "안녕하세요 인스턴스 관리자님,\n\n[목적]을 위해 [/workspace-name] URL로 새 작업 공간을 생성해 주세요.\n\n감사합니다,\n{firstName} {lastName}\n{email}",
    },
    button: {
      default: "작업 공간 생성",
      loading: "작업 공간 생성 중",
    },
    toast: {
      success: {
        title: "성공",
        message: "작업 공간이 성공적으로 생성되었습니다",
      },
      error: {
        title: "오류",
        message: "작업 공간을 생성할 수 없습니다. 다시 시도해주세요.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "프로젝트, 활동 및 메트릭 개요",
        description:
          "Plane에 오신 것을 환영합니다. 첫 번째 프로젝트를 생성하고 작업 항목을 추적하면 이 페이지가 진행 상황을 돕는 공간으로 변합니다. 관리자도 팀의 진행을 돕는 항목을 볼 수 있습니다.",
        primary_button: {
          text: "첫 번째 프로젝트 생성",
          comic: {
            title: "Plane에서 모든 것은 프로젝트로 시작됩니다",
            description: "프로젝트는 제품 로드맵, 마케팅 캠페인 또는 새로운 자동차 출시일 수 있습니다.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "분석",
    page_label: "{workspace} - 분석",
    open_tasks: "열린 작업 항목",
    error: "데이터를 가져오는 중 오류가 발생했습니다.",
    work_items_closed_in: "닫힌 작업 항목",
    selected_projects: "선택된 프로젝트",
    total_members: "총 멤버",
    total_cycles: "총 주기",
    total_modules: "총 모듈",
    pending_work_items: {
      title: "보류 중인 작업 항목",
      empty_state: "동료의 보류 중인 작업 항목 분석이 여기에 표시됩니다.",
    },
    work_items_closed_in_a_year: {
      title: "1년 동안 닫힌 작업 항목",
      empty_state: "작업 항목을 닫아 그래프에서 분석을 확인하세요.",
    },
    most_work_items_created: {
      title: "가장 많은 작업 항목 생성",
      empty_state: "동료와 그들이 생성한 작업 항목 수가 여기에 표시됩니다.",
    },
    most_work_items_closed: {
      title: "가장 많은 작업 항목 닫힘",
      empty_state: "동료와 그들이 닫은 작업 항목 수가 여기에 표시됩니다.",
    },
    tabs: {
      scope_and_demand: "범위 및 수요",
      custom: "맞춤형 분석",
    },
    empty_state: {
      customized_insights: {
        description: "귀하에게 할당된 작업 항목이 상태별로 나누어 여기에 표시됩니다.",
        title: "아직 데이터가 없습니다",
      },
      created_vs_resolved: {
        description: "시간이 지나면서 생성되고 해결된 작업 항목이 여기에 표시됩니다.",
        title: "아직 데이터가 없습니다",
      },
      project_insights: {
        title: "아직 데이터가 없습니다",
        description: "귀하에게 할당된 작업 항목이 상태별로 나누어 여기에 표시됩니다.",
      },
      general: {
        title: "진행 상황, 워크로드 및 할당을 추적하세요. 트렌드를 파악하고 장애물을 제거하며 더 빠르게 작업하세요",
        description:
          "범위 대 수요, 추정치 및 범위 크리프를 확인하세요. 팀 구성원과 팀의 성과를 파악하고 프로젝트가 제시간에 실행되도록 하세요.",
        primary_button: {
          text: "첫 번째 프로젝트 시작",
          comic: {
            title: "분석은 사이클 + 모듈과 함께 가장 잘 작동합니다",
            description:
              "먼저 작업 항목을 사이클로 시간 제한을 두고, 가능하다면 한 사이클 이상 걸리는 작업 항목을 모듈로 그룹화하세요. 왼쪽 탐색에서 둘 다 확인하세요.",
          },
        },
      },
    },
    created_vs_resolved: "생성됨 vs 해결됨",
    customized_insights: "맞춤형 인사이트",
    backlog_work_items: "백로그 {entity}",
    active_projects: "활성 프로젝트",
    trend_on_charts: "차트의 추세",
    all_projects: "모든 프로젝트",
    summary_of_projects: "프로젝트 요약",
    project_insights: "프로젝트 인사이트",
    started_work_items: "시작된 {entity}",
    total_work_items: "총 {entity}",
    total_projects: "총 프로젝트 수",
    total_admins: "총 관리자 수",
    total_users: "총 사용자 수",
    total_intake: "총 수입",
    un_started_work_items: "시작되지 않은 {entity}",
    total_guests: "총 게스트 수",
    completed_work_items: "완료된 {entity}",
    total: "총 {entity}",
  },
  workspace_projects: {
    label: "{count, plural, one {프로젝트} other {프로젝트}}",
    create: {
      label: "프로젝트 추가",
    },
    network: {
      label: "네트워크",
      private: {
        title: "비공개",
        description: "초대에 의해서만 접근 가능",
      },
      public: {
        title: "공개",
        description: "게스트를 제외한 작업 공간의 모든 사람이 참여할 수 있습니다",
      },
    },
    error: {
      permission: "이 작업을 수행할 권한이 없습니다.",
      cycle_delete: "주기 삭제 실패",
      module_delete: "모듈 삭제 실패",
      issue_delete: "작업 항목 삭제 실패",
    },
    state: {
      backlog: "백로그",
      unstarted: "시작되지 않음",
      started: "시작됨",
      completed: "완료됨",
      cancelled: "취소됨",
    },
    sort: {
      manual: "수동",
      name: "이름",
      created_at: "생성일",
      members_length: "멤버 수",
    },
    scope: {
      my_projects: "내 프로젝트",
      archived_projects: "아카이브",
    },
    common: {
      months_count: "{months, plural, one{# 개월} other{# 개월}}",
    },
    empty_state: {
      general: {
        title: "활성 프로젝트 없음",
        description:
          "각 프로젝트를 목표 지향 작업의 부모로 생각하세요. 프로젝트는 작업, 주기 및 모듈이 존재하는 곳이며, 동료와 함께 목표를 달성하는 데 도움이 됩니다. 새 프로젝트를 생성하거나 아카이브된 프로젝트를 필터링하세요.",
        primary_button: {
          text: "첫 번째 프로젝트 시작",
          comic: {
            title: "Plane에서 모든 것은 프로젝트로 시작됩니다",
            description: "프로젝트는 제품 로드맵, 마케팅 캠페인 또는 새로운 자동차 출시일 수 있습니다.",
          },
        },
      },
      no_projects: {
        title: "프로젝트 없음",
        description: "작업 항목을 생성하거나 작업을 관리하려면 프로젝트를 생성하거나 참여해야 합니다.",
        primary_button: {
          text: "첫 번째 프로젝트 시작",
          comic: {
            title: "Plane에서 모든 것은 프로젝트로 시작됩니다",
            description: "프로젝트는 제품 로드맵, 마케팅 캠페인 또는 새로운 자동차 출시일 수 있습니다.",
          },
        },
      },
      filter: {
        title: "일치하는 프로젝트 없음",
        description: "일치하는 프로젝트가 없습니다. 대신 새 프로젝트를 생성하세요.",
      },
      search: {
        description: "일치하는 프로젝트가 없습니다. 대신 새 프로젝트를 생성하세요",
      },
    },
  },
  workspace_views: {
    add_view: "뷰 추가",
    empty_state: {
      "all-issues": {
        title: "프로젝트에 작업 항목 없음",
        description: "첫 번째 프로젝트 완료! 이제 작업 항목을 추적 가능한 조각으로 나누세요. 시작합시다!",
        primary_button: {
          text: "새 작업 항목 생성",
        },
      },
      assigned: {
        title: "작업 항목 없음",
        description: "할당된 작업 항목을 여기에서 추적할 수 있습니다.",
        primary_button: {
          text: "새 작업 항목 생성",
        },
      },
      created: {
        title: "작업 항목 없음",
        description: "생성한 모든 작업 항목이 여기에 표시됩니다. 여기에서 직접 추적하세요.",
        primary_button: {
          text: "새 작업 항목 생성",
        },
      },
      subscribed: {
        title: "작업 항목 없음",
        description: "관심 있는 작업 항목을 구독하고 여기에서 모두 추적하세요.",
      },
      "custom-view": {
        title: "작업 항목 없음",
        description: "필터가 적용된 작업 항목을 여기에서 모두 추적하세요.",
      },
    },
    delete_view: {
      title: "이 뷰를 삭제하시겠습니까?",
      content:
        "확인하면 이 뷰에 대해 선택한 모든 정렬, 필터 및 표시 옵션 + 레이아웃이 복원할 수 없는 방식으로 영구적으로 삭제됩니다.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "이메일 변경",
        description: "확인 링크를 받으려면 새 이메일 주소를 입력하세요.",
        toasts: {
          success_title: "성공!",
          success_message: "이메일이 업데이트되었습니다. 다시 로그인하세요.",
        },
        form: {
          email: {
            label: "새 이메일",
            placeholder: "이메일을 입력하세요",
            errors: {
              required: "이메일은 필수입니다",
              invalid: "유효하지 않은 이메일입니다",
              exists: "이미 존재하는 이메일입니다. 다른 주소를 사용하세요.",
              validation_failed: "이메일 확인에 실패했습니다. 다시 시도하세요.",
            },
          },
          code: {
            label: "고유 코드",
            placeholder: "123456",
            helper_text: "인증 코드가 새 이메일로 전송되었습니다.",
            errors: {
              required: "고유 코드는 필수입니다",
              invalid: "잘못된 인증 코드입니다. 다시 시도하세요.",
            },
          },
        },
        actions: {
          continue: "계속",
          confirm: "확인",
          cancel: "취소",
        },
        states: {
          sending: "전송 중…",
        },
      },
    },
  },
  workspace_settings: {
    label: "작업 공간 설정",
    page_label: "{workspace} - 일반 설정",
    key_created: "키 생성됨",
    copy_key:
      "이 비밀 키를 Plane Pages에 복사하고 저장하세요. 닫기 버튼을 누른 후에는 이 키를 볼 수 없습니다. 키가 포함된 CSV 파일이 다운로드되었습니다.",
    token_copied: "토큰이 클립보드에 복사되었습니다.",
    settings: {
      general: {
        title: "일반",
        upload_logo: "로고 업로드",
        edit_logo: "로고 편집",
        name: "작업 공간 이름",
        company_size: "회사 규모",
        url: "작업 공간 URL",
        workspace_timezone: "작업 공간 시간대",
        update_workspace: "작업 공간 업데이트",
        delete_workspace: "이 작업 공간 삭제",
        delete_workspace_description:
          "작업 공간을 삭제하면 해당 작업 공간 내의 모든 데이터와 리소스가 영구적으로 삭제되며 복구할 수 없습니다.",
        delete_btn: "이 작업 공간 삭제",
        delete_modal: {
          title: "이 작업 공간을 삭제하시겠습니까?",
          description: "유료 플랜의 활성화된 평가판이 있습니다. 먼저 취소해야 진행할 수 있습니다.",
          dismiss: "무시",
          cancel: "평가판 취소",
          success_title: "작업 공간 삭제됨.",
          success_message: "곧 프로필 페이지로 이동합니다.",
          error_title: "작업이 실패했습니다.",
          error_message: "다시 시도해주세요.",
        },
        errors: {
          name: {
            required: "이름이 필요합니다",
            max_length: "작업 공간 이름은 80자를 초과할 수 없습니다",
          },
          company_size: {
            required: "회사 규모가 필요합니다",
            select_a_range: "조직 규모 선택",
          },
        },
      },
      members: {
        title: "멤버",
        add_member: "멤버 추가",
        pending_invites: "보류 중인 초대",
        invitations_sent_successfully: "초대가 성공적으로 전송되었습니다",
        leave_confirmation:
          "작업 공간을 떠나시겠습니까? 더 이상 이 작업 공간에 접근할 수 없습니다. 이 작업은 되돌릴 수 없습니다.",
        details: {
          full_name: "전체 이름",
          display_name: "표시 이름",
          email_address: "이메일 주소",
          account_type: "계정 유형",
          authentication: "인증",
          joining_date: "가입 날짜",
        },
        modal: {
          title: "사람들을 초대하여 협업하세요",
          description: "작업 공간에서 협업할 사람들을 초대하세요.",
          button: "초대 전송",
          button_loading: "초대 전송 중",
          placeholder: "name@company.com",
          errors: {
            required: "초대하려면 이메일 주소가 필요합니다.",
            invalid: "이메일이 유효하지 않습니다",
          },
        },
      },
      billing_and_plans: {
        title: "청구 및 플랜",
        current_plan: "현재 플랜",
        free_plan: "현재 무료 플랜을 사용 중입니다",
        view_plans: "플랜 보기",
      },
      exports: {
        title: "내보내기",
        exporting: "내보내기 중",
        previous_exports: "이전 내보내기",
        export_separate_files: "데이터를 별도의 파일로 내보내기",
        filters_info: "기준에 따라 특정 작업 항목을 내보내려면 필터를 적용하세요.",
        modal: {
          title: "내보내기",
          toasts: {
            success: {
              title: "내보내기 성공",
              message: "이전 내보내기에서 내보낸 {entity}를 다운로드할 수 있습니다.",
            },
            error: {
              title: "내보내기 실패",
              message: "내보내기가 실패했습니다. 다시 시도해주세요.",
            },
          },
        },
      },
      webhooks: {
        title: "웹훅",
        add_webhook: "웹훅 추가",
        modal: {
          title: "웹훅 생성",
          details: "웹훅 세부 정보",
          payload: "페이로드 URL",
          question: "어떤 이벤트가 이 웹훅을 트리거하길 원하십니까?",
          error: "URL이 필요합니다",
        },
        secret_key: {
          title: "비밀 키",
          message: "웹훅 페이로드에 로그인하려면 토큰을 생성하세요",
        },
        options: {
          all: "모든 항목 보내기",
          individual: "개별 이벤트 선택",
        },
        toasts: {
          created: {
            title: "웹훅 생성됨",
            message: "웹훅이 성공적으로 생성되었습니다",
          },
          not_created: {
            title: "웹훅 생성되지 않음",
            message: "웹훅을 생성할 수 없습니다",
          },
          updated: {
            title: "웹훅 업데이트됨",
            message: "웹훅이 성공적으로 업데이트되었습니다",
          },
          not_updated: {
            title: "웹훅 업데이트되지 않음",
            message: "웹훅을 업데이트할 수 없습니다",
          },
          removed: {
            title: "웹훅 제거됨",
            message: "웹훅이 성공적으로 제거되었습니다",
          },
          not_removed: {
            title: "웹훅 제거되지 않음",
            message: "웹훅을 제거할 수 없습니다",
          },
          secret_key_copied: {
            message: "비밀 키가 클립보드에 복사되었습니다.",
          },
          secret_key_not_copied: {
            message: "비밀 키를 복사하는 중 오류가 발생했습니다.",
          },
        },
      },
      api_tokens: {
        title: "API 토큰",
        add_token: "API 토큰 추가",
        create_token: "토큰 생성",
        never_expires: "만료되지 않음",
        generate_token: "토큰 생성",
        generating: "생성 중",
        delete: {
          title: "API 토큰 삭제",
          description:
            "이 토큰을 사용하는 애플리케이션은 더 이상 Plane 데이터에 접근할 수 없습니다. 이 작업은 되돌릴 수 없습니다.",
          success: {
            title: "성공!",
            message: "API 토큰이 성공적으로 삭제되었습니다",
          },
          error: {
            title: "오류!",
            message: "API 토큰을 삭제할 수 없습니다",
          },
        },
      },
    },
    empty_state: {
      api_tokens: {
        title: "생성된 API 토큰 없음",
        description:
          "Plane API를 사용하여 Plane의 데이터를 외부 시스템과 통합할 수 있습니다. 토큰을 생성하여 시작하세요.",
      },
      webhooks: {
        title: "추가된 웹훅 없음",
        description: "실시간 업데이트를 받고 작업을 자동화하려면 웹훅을 생성하세요.",
      },
      exports: {
        title: "아직 내보내기 없음",
        description: "내보낼 때마다 참조용으로 여기에 복사본이 있습니다.",
      },
      imports: {
        title: "아직 가져오기 없음",
        description: "이전 가져오기를 모두 여기에서 찾고 다운로드하세요.",
      },
    },
  },
  profile: {
    label: "프로필",
    page_label: "나의 작업",
    work: "작업",
    details: {
      joined_on: "가입일",
      time_zone: "시간대",
    },
    stats: {
      workload: "작업량",
      overview: "개요",
      created: "생성된 작업 항목",
      assigned: "할당된 작업 항목",
      subscribed: "구독된 작업 항목",
      state_distribution: {
        title: "상태별 작업 항목",
        empty: "작업 항목을 생성하여 상태별 그래프에서 분석을 확인하세요.",
      },
      priority_distribution: {
        title: "우선순위별 작업 항목",
        empty: "작업 항목을 생성하여 우선순위별 그래프에서 분석을 확인하세요.",
      },
      recent_activity: {
        title: "최근 활동",
        empty: "데이터를 찾을 수 없습니다. 입력을 확인하세요",
        button: "오늘의 활동 다운로드",
        button_loading: "다운로드 중",
      },
    },
    actions: {
      profile: "프로필",
      security: "보안",
      activity: "활동",
      appearance: "외관",
      notifications: "알림",
    },
    tabs: {
      summary: "요약",
      assigned: "할당됨",
      created: "생성됨",
      subscribed: "구독됨",
      activity: "활동",
    },
    empty_state: {
      activity: {
        title: "아직 활동 없음",
        description:
          "새 작업 항목을 생성하여 시작하세요! 세부 정보와 속성을 추가하세요. Plane에서 더 많은 것을 탐색하여 활동을 확인하세요.",
      },
      assigned: {
        title: "할당된 작업 항목 없음",
        description: "할당된 작업 항목을 여기에서 추적할 수 있습니다.",
      },
      created: {
        title: "작업 항목 없음",
        description: "생성한 모든 작업 항목이 여기에 표시됩니다. 여기에서 직접 추적하세요.",
      },
      subscribed: {
        title: "작업 항목 없음",
        description: "관심 있는 작업 항목을 구독하고 여기에서 모두 추적하세요.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "프로젝트 ID 입력",
      please_select_a_timezone: "시간대를 선택하세요",
      archive_project: {
        title: "프로젝트 아카이브",
        description:
          "프로젝트를 아카이브하면 사이드 내비게이션에서 프로젝트가 목록에서 제외되지만 프로젝트 페이지에서 여전히 접근할 수 있습니다. 언제든지 프로젝트를 복원하거나 삭제할 수 있습니다.",
        button: "프로젝트 아카이브",
      },
      delete_project: {
        title: "프로젝트 삭제",
        description:
          "프로젝트를 삭제하면 해당 프로젝트 내의 모든 데이터와 리소스가 영구적으로 삭제되며 복구할 수 없습니다.",
        button: "프로젝트 삭제",
      },
      toast: {
        success: "프로젝트가 성공적으로 업데이트되었습니다",
        error: "프로젝트를 업데이트할 수 없습니다. 다시 시도해주세요.",
      },
    },
    members: {
      label: "멤버",
      project_lead: "프로젝트 리드",
      default_assignee: "기본 담당자",
      guest_super_permissions: {
        title: "게스트 사용자에게 모든 작업 항목에 대한 보기 권한 부여:",
        sub_heading: "이렇게 하면 게스트가 모든 프로젝트 작업 항목에 대한 보기 권한을 갖게 됩니다.",
      },
      invite_members: {
        title: "멤버 초대",
        sub_heading: "프로젝트에서 작업할 멤버를 초대하세요.",
        select_co_worker: "동료 선택",
      },
    },
    states: {
      describe_this_state_for_your_members: "멤버를 위해 이 상태를 설명하세요.",
      empty_state: {
        title: "{groupKey} 그룹에 사용할 수 있는 상태 없음",
        description: "새 상태를 생성하세요",
      },
    },
    labels: {
      label_title: "레이블 제목",
      label_title_is_required: "레이블 제목이 필요합니다",
      label_max_char: "레이블 이름은 255자를 초과할 수 없습니다",
      toast: {
        error: "레이블 업데이트 중 오류 발생",
      },
    },
    estimates: {
      label: "추정",
      title: "프로젝트 추정 활성화",
      description: "팀의 복잡성과 작업량을 전달하는 데 도움이 됩니다.",
      no_estimate: "추정 없음",
      new: "새 추정 시스템",
      create: {
        custom: "사용자 지정",
        start_from_scratch: "처음부터 시작",
        choose_template: "템플릿 선택",
        choose_estimate_system: "추정 시스템 선택",
        enter_estimate_point: "추정 입력",
        step: "단계 {step}/{total}",
        label: "추정 생성",
      },
      toasts: {
        created: {
          success: {
            title: "추정 생성됨",
            message: "추정이 성공적으로 생성되었습니다",
          },
          error: {
            title: "추정 생성 실패",
            message: "새 추정을 생성할 수 없습니다. 다시 시도해 주세요.",
          },
        },
        updated: {
          success: {
            title: "추정 수정됨",
            message: "프로젝트의 추정이 업데이트되었습니다.",
          },
          error: {
            title: "추정 수정 실패",
            message: "추정을 수정할 수 없습니다. 다시 시도해 주세요",
          },
        },
        enabled: {
          success: {
            title: "성공!",
            message: "추정이 활성화되었습니다.",
          },
        },
        disabled: {
          success: {
            title: "성공!",
            message: "추정이 비활성화되었습니다.",
          },
          error: {
            title: "오류!",
            message: "추정을 비활성화할 수 없습니다. 다시 시도해 주세요",
          },
        },
      },
      validation: {
        min_length: "추정은 0보다 커야 합니다.",
        unable_to_process: "요청을 처리할 수 없습니다. 다시 시도해 주세요.",
        numeric: "추정은 숫자 값이어야 합니다.",
        character: "추정은 문자 값이어야 합니다.",
        empty: "추정 값은 비어있을 수 없습니다.",
        already_exists: "추정 값이 이미 존재합니다.",
        unsaved_changes: "저장되지 않은 변경 사항이 있습니다. 완료를 클릭하기 전에 저장하세요",
        remove_empty: "추정은 비어있을 수 없습니다. 각 필드에 값을 입력하거나 값이 없는 필드를 제거하세요.",
      },
      systems: {
        points: {
          label: "포인트",
          fibonacci: "피보나치",
          linear: "선형",
          squares: "제곱",
          custom: "사용자 정의",
        },
        categories: {
          label: "카테고리",
          t_shirt_sizes: "티셔츠 사이즈",
          easy_to_hard: "쉬움에서 어려움",
          custom: "사용자 정의",
        },
        time: {
          label: "시간",
          hours: "시간",
        },
      },
    },
    automations: {
      label: "자동화",
      "auto-archive": {
        title: "완료된 작업 항목 자동 보관",
        description: "Plane은 완료되거나 취소된 작업 항목을 자동으로 보관합니다.",
        duration: "다음 기간 동안 닫힌 작업 항목 자동 보관",
      },
      "auto-close": {
        title: "작업 항목 자동 닫기",
        description: "Plane은 완료되거나 취소되지 않은 작업 항목을 자동으로 닫습니다.",
        duration: "다음 기간 동안 비활성 작업 항목 자동 닫기",
        auto_close_status: "자동 닫기 상태",
      },
    },
    empty_state: {
      labels: {
        title: "레이블 없음",
        description: "프로젝트에서 작업 항목을 구성하고 필터링하는 데 도움이 되는 레이블을 생성하세요.",
      },
      estimates: {
        title: "추정 시스템 없음",
        description: "작업 항목당 작업량을 전달하는 추정 세트를 생성하세요.",
        primary_button: "추정 시스템 추가",
      },
    },
    features: {
      cycles: {
        title: "사이클",
        short_title: "사이클",
        description: "이 프로젝트의 고유한 리듬과 속도에 적응하는 유연한 기간으로 작업을 예약합니다.",
        toggle_title: "사이클 활성화",
        toggle_description: "집중된 기간에 작업을 계획합니다.",
      },
      modules: {
        title: "모듈",
        short_title: "모듈",
        description: "전담 리더와 담당자가 있는 하위 프로젝트로 작업을 구성합니다.",
        toggle_title: "모듈 활성화",
        toggle_description: "프로젝트 멤버가 모듈을 생성하고 편집할 수 있습니다.",
      },
      views: {
        title: "보기",
        short_title: "보기",
        description: "사용자 정의 정렬, 필터 및 표시 옵션을 저장하거나 팀과 공유합니다.",
        toggle_title: "보기 활성화",
        toggle_description: "프로젝트 멤버가 보기를 생성하고 편집할 수 있습니다.",
      },
      pages: {
        title: "페이지",
        short_title: "페이지",
        description: "자유 형식 콘텐츠를 생성하고 편집합니다: 메모, 문서, 무엇이든.",
        toggle_title: "페이지 활성화",
        toggle_description: "프로젝트 멤버가 페이지를 생성하고 편집할 수 있습니다.",
      },
      intake: {
        title: "접수",
        short_title: "접수",
        description: "워크플로를 방해하지 않고 비회원이 버그, 피드백 및 제안을 공유할 수 있도록 합니다.",
        toggle_title: "접수 활성화",
        toggle_description: "프로젝트 멤버가 앱 내에서 접수 요청을 생성할 수 있도록 허용합니다.",
      },
    },
  },
  project_cycles: {
    add_cycle: "주기 추가",
    more_details: "자세히 보기",
    cycle: "주기",
    update_cycle: "주기 업데이트",
    create_cycle: "주기 생성",
    no_matching_cycles: "일치하는 주기 없음",
    remove_filters_to_see_all_cycles: "모든 주기를 보려면 필터를 제거하세요",
    remove_search_criteria_to_see_all_cycles: "모든 주기를 보려면 검색 기준을 제거하세요",
    only_completed_cycles_can_be_archived: "완료된 주기만 아카이브할 수 있습니다",
    start_date: "시작일",
    end_date: "종료일",
    in_your_timezone: "내 시간대",
    transfer_work_items: "{count}개의 작업 항목 이전",
    date_range: "날짜 범위",
    add_date: "날짜 추가",
    active_cycle: {
      label: "활성 주기",
      progress: "진행",
      chart: "버다운 차트",
      priority_issue: "우선순위 작업 항목",
      assignees: "담당자",
      issue_burndown: "작업 항목 버다운",
      ideal: "이상적인",
      current: "현재",
      labels: "레이블",
    },
    upcoming_cycle: {
      label: "다가오는 주기",
    },
    completed_cycle: {
      label: "완료된 주기",
    },
    status: {
      days_left: "남은 일수",
      completed: "완료됨",
      yet_to_start: "시작되지 않음",
      in_progress: "진행 중",
      draft: "초안",
    },
    action: {
      restore: {
        title: "주기 복원",
        success: {
          title: "주기 복원됨",
          description: "주기가 복원되었습니다.",
        },
        failed: {
          title: "주기 복원 실패",
          description: "주기를 복원할 수 없습니다. 다시 시도해주세요.",
        },
      },
      favorite: {
        loading: "주기를 즐겨찾기에 추가 중",
        success: {
          description: "주기가 즐겨찾기에 추가되었습니다.",
          title: "성공!",
        },
        failed: {
          description: "주기를 즐겨찾기에 추가할 수 없습니다. 다시 시도해주세요.",
          title: "오류!",
        },
      },
      unfavorite: {
        loading: "주기를 즐겨찾기에서 제거 중",
        success: {
          description: "주기가 즐겨찾기에서 제거되었습니다.",
          title: "성공!",
        },
        failed: {
          description: "주기를 즐겨찾기에서 제거할 수 없습니다. 다시 시도해주세요.",
          title: "오류!",
        },
      },
      update: {
        loading: "주기 업데이트 중",
        success: {
          description: "주기가 성공적으로 업데이트되었습니다.",
          title: "성공!",
        },
        failed: {
          description: "주기 업데이트 중 오류 발생. 다시 시도해주세요.",
          title: "오류!",
        },
        error: {
          already_exists: "주어진 날짜에 이미 주기가 있습니다. 초안 주기를 생성하려면 두 날짜를 모두 제거하세요.",
        },
      },
    },
    empty_state: {
      general: {
        title: "작업을 주기로 그룹화하고 시간 상자화하세요.",
        description:
          "작업을 시간 상자로 나누고, 프로젝트 마감일에서 역으로 날짜를 설정하며, 팀으로서 실질적인 진전을 이루세요.",
        primary_button: {
          text: "첫 번째 주기 설정",
          comic: {
            title: "주기는 반복적인 시간 상자입니다.",
            description:
              "스프린트, 반복 또는 주간 또는 격주로 작업을 추적하는 데 사용하는 다른 용어는 모두 주기입니다.",
          },
        },
      },
      no_issues: {
        title: "주기에 추가된 작업 항목 없음",
        description: "이 주기 내에서 시간 상자화하고 전달하려는 작업 항목을 추가하거나 생성하세요",
        primary_button: {
          text: "새 작업 항목 생성",
        },
        secondary_button: {
          text: "기존 작업 항목 추가",
        },
      },
      completed_no_issues: {
        title: "주기에 작업 항목 없음",
        description:
          "주기에 작업 항목이 없습니다. 작업 항목이 전송되었거나 숨겨져 있습니다. 숨겨진 작업 항목을 보려면 표시 속성을 적절히 업데이트하세요.",
      },
      active: {
        title: "활성 주기 없음",
        description:
          "활성 주기에는 오늘 날짜가 범위 내에 포함된 모든 기간이 포함됩니다. 여기에서 활성 주기의 진행 상황과 세부 정보를 확인하세요.",
      },
      archived: {
        title: "아카이브된 주기 없음",
        description: "프로젝트를 정리하려면 완료된 주기를 아카이브하세요. 아카이브된 주기는 여기에서 찾을 수 있습니다.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "작업 항목을 생성하고 누군가에게 할당하세요, 심지어 자신에게도",
        description:
          "작업 항목을 작업, 작업, 작업 또는 JTBD로 생각하세요. 작업 항목과 하위 작업 항목은 일반적으로 팀원에게 할당된 시간 기반 작업입니다. 팀은 작업 항목을 생성, 할당 및 완료하여 프로젝트 목표를 향해 나아갑니다.",
        primary_button: {
          text: "첫 번째 작업 항목 생성",
          comic: {
            title: "작업 항목은 Plane의 구성 요소입니다.",
            description:
              "Plane UI 재설계, 회사 리브랜딩 또는 새로운 연료 주입 시스템 출시와 같은 작업 항목은 하위 작업 항목이 있을 가능성이 큽니다.",
          },
        },
      },
      no_archived_issues: {
        title: "아카이브된 작업 항목 없음",
        description:
          "수동으로 또는 자동화를 통해 완료되거나 취소된 작업 항목을 아카이브할 수 있습니다. 아카이브된 항목은 여기에서 찾을 수 있습니다.",
        primary_button: {
          text: "자동화 설정",
        },
      },
      issues_empty_filter: {
        title: "적용된 필터와 일치하는 작업 항목 없음",
        secondary_button: {
          text: "모든 필터 지우기",
        },
      },
    },
  },
  project_module: {
    add_module: "모듈 추가",
    update_module: "모듈 업데이트",
    create_module: "모듈 생성",
    archive_module: "모듈 아카이브",
    restore_module: "모듈 복원",
    delete_module: "모듈 삭제",
    empty_state: {
      general: {
        title: "프로젝트 마일스톤을 모듈로 매핑하고 집계된 작업을 쉽게 추적하세요.",
        description:
          "논리적이고 계층적인 부모에 속하는 작업 항목 그룹이 모듈을 형성합니다. 이를 프로젝트 마일스톤별로 작업을 추적하는 방법으로 생각하세요. 모듈은 자체 기간과 마감일을 가지며, 마일스톤에 얼마나 가까운지 또는 먼지를 확인하는 데 도움이 되는 분석을 제공합니다.",
        primary_button: {
          text: "첫 번째 모듈 생성",
          comic: {
            title: "모듈은 계층별로 작업을 그룹화하는 데 도움이 됩니다.",
            description: "카트 모듈, 섀시 모듈 및 창고 모듈은 모두 이 그룹화의 좋은 예입니다.",
          },
        },
      },
      no_issues: {
        title: "모듈에 작업 항목 없음",
        description: "이 모듈의 일부로 완료하려는 작업 항목을 생성하거나 추가하세요",
        primary_button: {
          text: "새 작업 항목 생성",
        },
        secondary_button: {
          text: "기존 작업 항목 추가",
        },
      },
      archived: {
        title: "아카이브된 모듈 없음",
        description:
          "프로젝트를 정리하려면 완료되거나 취소된 모듈을 아카이브하세요. 아카이브된 모듈은 여기에서 찾을 수 있습니다.",
      },
      sidebar: {
        in_active: "이 모듈은 아직 활성화되지 않았습니다.",
        invalid_date: "유효하지 않은 날짜입니다. 유효한 날짜를 입력하세요.",
      },
    },
    quick_actions: {
      archive_module: "모듈 아카이브",
      archive_module_description: "완료되거나 취소된 모듈만 아카이브할 수 있습니다.",
      delete_module: "모듈 삭제",
    },
    toast: {
      copy: {
        success: "모듈 링크가 클립보드에 복사되었습니다",
      },
      delete: {
        success: "모듈이 성공적으로 삭제되었습니다",
        error: "모듈 삭제 실패",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "프로젝트에 대한 필터링된 뷰를 저장하세요. 필요한 만큼 생성하세요",
        description:
          "뷰는 자주 사용하는 필터 또는 쉽게 접근하고 싶은 필터 세트입니다. 프로젝트의 모든 동료가 모든 사람의 뷰를 보고 자신에게 가장 적합한 뷰를 선택할 수 있습니다.",
        primary_button: {
          text: "첫 번째 뷰 생성",
          comic: {
            title: "뷰는 작업 항목 속성 위에서 작동합니다.",
            description: "여기에서 원하는 만큼의 속성을 필터로 사용하여 뷰를 생성할 수 있습니다.",
          },
        },
      },
      filter: {
        title: "일치하는 뷰 없음",
        description: "검색 기준과 일치하는 뷰가 없습니다. 대신 새 뷰를 생성하세요.",
      },
    },
    delete_view: {
      title: "이 뷰를 삭제하시겠습니까?",
      content:
        "확인하면 이 뷰에 대해 선택한 모든 정렬, 필터 및 표시 옵션 + 레이아웃이 복원할 수 없는 방식으로 영구적으로 삭제됩니다.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "메모, 문서 또는 전체 지식 기반을 작성하세요. Galileo, Plane의 AI 도우미가 시작을 도와줍니다",
        description:
          "페이지는 Plane에서 생각을 정리하는 공간입니다. 회의 메모를 작성하고, 쉽게 형식을 지정하고, 작업 항목을 포함하고, 구성 요소 라이브러리를 사용하여 레이아웃을 작성하고, 모든 것을 프로젝트의 맥락에서 유지하세요. 문서를 빠르게 작성하려면 단축키나 버튼 클릭으로 Galileo, Plane의 AI를 호출하세요.",
        primary_button: {
          text: "첫 번째 페이지 생성",
        },
      },
      private: {
        title: "비공개 페이지 없음",
        description: "비공개 생각을 여기에 보관하세요. 공유할 준비가 되면 팀이 클릭 한 번으로 접근할 수 있습니다.",
        primary_button: {
          text: "첫 번째 페이지 생성",
        },
      },
      public: {
        title: "공개 페이지 없음",
        description: "프로젝트의 모든 사람과 공유된 페이지를 여기에서 확인하세요.",
        primary_button: {
          text: "첫 번째 페이지 생성",
        },
      },
      archived: {
        title: "아카이브된 페이지 없음",
        description: "레이더에 없는 페이지를 아카이브하세요. 필요할 때 여기에서 접근하세요.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "결과 없음",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "일치하는 작업 항목 없음",
      },
      no_issues: {
        title: "작업 항목 없음",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "댓글 없음",
        description: "댓글은 작업 항목에 대한 토론 및 후속 공간으로 사용할 수 있습니다",
      },
    },
  },
  notification: {
    label: "받은 편지함",
    page_label: "{workspace} - 받은 편지함",
    options: {
      mark_all_as_read: "모두 읽음으로 표시",
      mark_read: "읽음으로 표시",
      mark_unread: "읽지 않음으로 표시",
      refresh: "새로 고침",
      filters: "받은 편지함 필터",
      show_unread: "읽지 않음 표시",
      show_snoozed: "미루기 표시",
      show_archived: "아카이브 표시",
      mark_archive: "아카이브",
      mark_unarchive: "아카이브 해제",
      mark_snooze: "미루기",
      mark_unsnooze: "미루기 해제",
    },
    toasts: {
      read: "알림이 읽음으로 표시되었습니다",
      unread: "알림이 읽지 않음으로 표시되었습니다",
      archived: "알림이 아카이브되었습니다",
      unarchived: "알림이 아카이브 해제되었습니다",
      snoozed: "알림이 미루기되었습니다",
      unsnoozed: "알림이 미루기 해제되었습니다",
    },
    empty_state: {
      detail: {
        title: "세부 정보를 보려면 선택하세요.",
      },
      all: {
        title: "할당된 작업 항목 없음",
        description: "할당된 작업 항목의 업데이트를 여기에서 확인할 수 있습니다",
      },
      mentions: {
        title: "할당된 작업 항목 없음",
        description: "할당된 작업 항목의 업데이트를 여기에서 확인할 수 있습니다",
      },
    },
    tabs: {
      all: "모두",
      mentions: "멘션",
    },
    filter: {
      assigned: "나에게 할당됨",
      created: "내가 생성함",
      subscribed: "내가 구독함",
    },
    snooze: {
      "1_day": "1일",
      "3_days": "3일",
      "5_days": "5일",
      "1_week": "1주",
      "2_weeks": "2주",
      custom: "사용자 정의",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "주기에 작업 항목을 추가하여 진행 상황을 확인하세요",
      },
      chart: {
        title: "주기에 작업 항목을 추가하여 버다운 차트를 확인하세요.",
      },
      priority_issue: {
        title: "주기에서 처리된 고우선 작업 항목을 한눈에 확인하세요.",
      },
      assignee: {
        title: "작업 항목에 담당자를 추가하여 담당자별 작업 분포를 확인하세요.",
      },
      label: {
        title: "작업 항목에 레이블을 추가하여 레이블별 작업 분포를 확인하세요.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "프로젝트에 접수가 활성화되지 않았습니다.",
        description:
          "접수는 프로젝트로 들어오는 요청을 관리하고 이를 워크플로우의 작업 항목으로 추가하는 데 도움이 됩니다. 프로젝트 설정에서 접수를 활성화하여 요청을 관리하세요.",
        primary_button: {
          text: "기능 관리",
        },
      },
      cycle: {
        title: "이 프로젝트에 주기가 활성화되지 않았습니다.",
        description:
          "작업을 시간 상자로 나누고, 프로젝트 마감일에서 역으로 날짜를 설정하며, 팀으로서 실질적인 진전을 이루세요. 프로젝트에 주기 기능을 활성화하여 사용하세요.",
        primary_button: {
          text: "기능 관리",
        },
      },
      module: {
        title: "프로젝트에 모듈이 활성화되지 않았습니다.",
        description: "모듈은 프로젝트의 구성 요소입니다. 프로젝트 설정에서 모듈을 활성화하여 사용하세요.",
        primary_button: {
          text: "기능 관리",
        },
      },
      page: {
        title: "프로젝트에 페이지가 활성화되지 않았습니다.",
        description: "페이지는 프로젝트의 구성 요소입니다. 프로젝트 설정에서 페이지를 활성화하여 사용하세요.",
        primary_button: {
          text: "기능 관리",
        },
      },
      view: {
        title: "프로젝트에 뷰가 활성화되지 않았습니다.",
        description: "뷰는 프로젝트의 구성 요소입니다. 프로젝트 설정에서 뷰를 활성화하여 사용하세요.",
        primary_button: {
          text: "기능 관리",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "작업 항목 초안",
    empty_state: {
      title: "작성 중인 작업 항목과 곧 댓글이 여기에 표시됩니다.",
      description:
        "이 기능을 사용해 보려면 작업 항목을 추가하고 중간에 멈추거나 아래에서 첫 번째 초안을 생성하세요. 😉",
      primary_button: {
        text: "첫 번째 초안 생성",
      },
    },
    delete_modal: {
      title: "초안 삭제",
      description: "이 초안을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    },
    toasts: {
      created: {
        success: "초안 생성됨",
        error: "작업 항목을 생성할 수 없습니다. 다시 시도해주세요.",
      },
      deleted: {
        success: "초안 삭제됨",
      },
    },
  },
  stickies: {
    title: "나의 스티키",
    placeholder: "여기에 입력하려면 클릭하세요",
    all: "모든 스티키",
    "no-data": "아이디어를 적어두거나, 유레카를 기록하거나, 영감을 기록하세요. 스티키를 추가하여 시작하세요.",
    add: "스티키 추가",
    search_placeholder: "제목으로 검색",
    delete: "스티키 삭제",
    delete_confirmation: "이 스티키를 삭제하시겠습니까?",
    empty_state: {
      simple: "아이디어를 적어두거나, 유레카를 기록하거나, 영감을 기록하세요. 스티키를 추가하여 시작하세요.",
      general: {
        title: "스티키는 즉석에서 작성하는 빠른 메모와 할 일입니다.",
        description: "스티키를 생성하여 생각과 아이디어를 쉽게 캡처하고 언제 어디서나 접근할 수 있습니다.",
        primary_button: {
          text: "스티키 추가",
        },
      },
      search: {
        title: "일치하는 스티키가 없습니다.",
        description: "다른 용어를 시도하거나 검색이 올바른지 확신하는 경우 알려주세요.",
        primary_button: {
          text: "스티키 추가",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "스티키 이름은 100자를 초과할 수 없습니다.",
        already_exists: "설명이 없는 스티키가 이미 존재합니다",
      },
      created: {
        title: "스티키 생성됨",
        message: "스티키가 성공적으로 생성되었습니다",
      },
      not_created: {
        title: "스티키 생성되지 않음",
        message: "스티키를 생성할 수 없습니다",
      },
      updated: {
        title: "스티키 업데이트됨",
        message: "스티키가 성공적으로 업데이트되었습니다",
      },
      not_updated: {
        title: "스티키 업데이트되지 않음",
        message: "스티키를 업데이트할 수 없습니다",
      },
      removed: {
        title: "스티키 제거됨",
        message: "스티키가 성공적으로 제거되었습니다",
      },
      not_removed: {
        title: "스티키 제거되지 않음",
        message: "스티키를 제거할 수 없습니다",
      },
    },
  },
  role_details: {
    guest: {
      title: "게스트",
      description: "조직의 외부 멤버는 게스트로 초대될 수 있습니다.",
    },
    member: {
      title: "멤버",
      description: "프로젝트, 주기 및 모듈 내에서 엔티티를 읽고, 쓰고, 편집하고, 삭제할 수 있는 권한",
    },
    admin: {
      title: "관리자",
      description: "작업 공간 내에서 모든 권한이 true로 설정됨.",
    },
  },
  user_roles: {
    product_or_project_manager: "제품 / 프로젝트 관리자",
    development_or_engineering: "개발 / 엔지니어링",
    founder_or_executive: "창립자 / 임원",
    freelancer_or_consultant: "프리랜서 / 컨설턴트",
    marketing_or_growth: "마케팅 / 성장",
    sales_or_business_development: "영업 / 비즈니스 개발",
    support_or_operations: "지원 / 운영",
    student_or_professor: "학생 / 교수",
    human_resources: "인사 / 자원",
    other: "기타",
  },
  importer: {
    github: {
      title: "Github",
      description: "GitHub 저장소에서 작업 항목을 가져오고 동기화합니다.",
    },
    jira: {
      title: "Jira",
      description: "Jira 프로젝트 및 에픽에서 작업 항목과 에픽을 가져옵니다.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "작업 항목을 CSV 파일로 내보냅니다.",
      short_description: "CSV로 내보내기",
    },
    excel: {
      title: "Excel",
      description: "작업 항목을 Excel 파일로 내보냅니다.",
      short_description: "Excel로 내보내기",
    },
    xlsx: {
      title: "Excel",
      description: "작업 항목을 Excel 파일로 내보냅니다.",
      short_description: "Excel로 내보내기",
    },
    json: {
      title: "JSON",
      description: "작업 항목을 JSON 파일로 내보냅니다.",
      short_description: "JSON으로 내보내기",
    },
  },
  default_global_view: {
    all_issues: "모든 작업 항목",
    assigned: "할당됨",
    created: "생성됨",
    subscribed: "구독됨",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "시스템 기본값",
      },
      light: {
        label: "라이트",
      },
      dark: {
        label: "다크",
      },
      light_contrast: {
        label: "라이트 고대비",
      },
      dark_contrast: {
        label: "다크 고대비",
      },
      custom: {
        label: "사용자 정의 테마",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "백로그",
      planned: "계획됨",
      in_progress: "진행 중",
      paused: "일시 중지됨",
      completed: "완료됨",
      cancelled: "취소됨",
    },
    layout: {
      list: "목록 레이아웃",
      board: "갤러리 레이아웃",
      timeline: "타임라인 레이아웃",
    },
    order_by: {
      name: "이름",
      progress: "진행",
      issues: "작업 항목 수",
      due_date: "마감일",
      created_at: "생성일",
      manual: "수동",
    },
  },
  cycle: {
    label: "{count, plural, one {주기} other {주기}}",
    no_cycle: "주기 없음",
  },
  module: {
    label: "{count, plural, one {모듈} other {모듈}}",
    no_module: "모듈 없음",
  },
  description_versions: {
    last_edited_by: "마지막 편집자",
    previously_edited_by: "이전 편집자",
    edited_by: "편집자",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane이 시작되지 않았습니다. 이는 하나 이상의 Plane 서비스가 시작에 실패했기 때문일 수 있습니다.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "확실히 하려면 setup.sh와 Docker 로그에서 View Logs를 선택하세요.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "개요",
        empty_state: {
          title: "제목이 없습니다",
          description: "이 페이지에 제목을 추가하여 여기에서 확인해보세요.",
        },
      },
      info: {
        label: "정보",
        document_info: {
          words: "단어",
          characters: "문자",
          paragraphs: "단락",
          read_time: "읽기 시간",
        },
        actors_info: {
          edited_by: "편집자",
          created_by: "작성자",
        },
        version_history: {
          label: "버전 기록",
          current_version: "현재 버전",
        },
      },
      assets: {
        label: "자산",
        download_button: "다운로드",
        empty_state: {
          title: "이미지가 없습니다",
          description: "이미지를 추가하여 여기에서 확인하세요.",
        },
      },
    },
    open_button: "네비게이션 패널 열기",
    close_button: "네비게이션 패널 닫기",
    outline_floating_button: "개요 열기",
  },
} as const;

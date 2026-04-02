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
      "현재 이 문제를 해결하고 있습니다. 즉시 도움이 필요하시면,",
    reach_out_to_us: "저희에게 연락해 주세요",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our: "그렇지 않으면 가끔 페이지를 새로고침하거나 저희",
    status_page: "상태 페이지를 방문해 주세요",
  },
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
    pi_chat: "인공지능 챗",
    initiatives: "이니셔티브스",
    teamspaces: "팀스페이스스",
    epics: "에픽스",
    upgrade_plan: "업그레이드 플랜",
    plane_pro: "플레인 프로",
    business: "비즈니스",
    customers: "커스터머스",
    recurring_work_items: "반복 작업 항목",
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
      username: {
        label: "사용자 이름",
        placeholder: "사용자 이름을 입력하세요",
      },
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
    ldap: {
      header: {
        label: "{ldapProviderName}로 계속",
        sub_header: "{ldapProviderName} 자격 증명을 입력하세요",
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
  activity_empty_state: {
    no_activity: "아직 활동이 없습니다",
    no_transitions: "아직 전환이 없습니다",
  },
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
  select_or_customize_your_interface_color_scheme: "인터페이스 색상 구성표를 선택하거나 사용자 지정하세요.",
  select_the_cursor_motion_style_that_feels_right_for_you: "자신에게 맞는 커서 모션 스타일을 선택하세요.",
  theme: "테마",
  smooth_cursor: "부드러운 커서",
  system_preference: "시스템 기본 설정",
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
  project_id_tooltip_content: "작업 항목을 고유하게 식별하는 데 도움이 됩니다. 최대 50자.",
  description_placeholder: "설명",
  only_alphanumeric_non_latin_characters_allowed: "영숫자 및 비라틴 문자만 허용됩니다.",
  project_id_is_required: "프로젝트 ID가 필요합니다",
  project_id_allowed_char: "영숫자 및 비라틴 문자만 허용됩니다.",
  project_id_min_char: "프로젝트 ID는 최소 1자 이상이어야 합니다",
  project_id_max_char: "프로젝트 ID는 최대 {max}자 이하여야 합니다",
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
  pages: {
    link_pages: "페이지 연결",
    show_wiki_pages: "위키 페이지 표시",
    link_pages_to: "페이지 연결",
    linked_pages: "연결된 페이지",
    no_description: "이 페이지는 비어 있습니다. 여기에 무언가를 작성하고 이 플레이스홀더로 표시하세요.",
    toasts: {
      link: {
        success: {
          title: "페이지가 업데이트되었습니다",
          message: "페이지가 성공적으로 업데이트되었습니다.",
        },
        error: {
          title: "페이지가 업데이트되지 않았습니다",
          message: "페이지를 업데이트할 수 없습니다.",
        },
      },
      remove: {
        success: {
          title: "페이지가 삭제되었습니다",
          message: "페이지가 성공적으로 삭제되었습니다.",
        },
        error: {
          title: "페이지가 삭제되지 않았습니다",
          message: "페이지를 삭제할 수 없습니다.",
        },
      },
    },
  },
  intake: "접수",
  renew: "갱신",
  preview: "미리보기",
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
  forum: "Forum",
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
  transition: "전환",
  history: "히스토리",
  priority: "우선순위",
  none: "없음",
  urgent: "긴급",
  high: "높음",
  medium: "중간",
  low: "낮음",
  members: "멤버",
  assignee: "담당자",
  assignees: "담당자",
  subscriber: "{count, plural, one{구독자 #명} other{구독자 #명}}",
  you: "나",
  labels: "레이블",
  create_new_label: "새 레이블 생성",
  label_name: "레이블 이름",
  failed_to_create_label: "레이블 생성에 실패했습니다. 다시 시도해 주세요.",
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
  upgrade_request: "워크스페이스 관리자에게 업그레이드를 요청하세요.",
  copied_to_clipboard: "클립보드에 복사됨",
  copied_to_clipboard_description: "URL이 클립보드에 성공적으로 복사되었습니다",
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
    business_trial_banner: {
      title: "14일 Business 플랜 체험판이 활성화되었습니다!",
      description: "모든 Business 기능을 살펴보세요. 준비가 되면 구독을 선택하세요. 자동으로 청구되지 않습니다.",
      trial_ends_today: "체험판이 오늘 종료됩니다",
      trial_ends_in_days: "체험판 종료까지 {days}일 남음",
      start_subscription: "구독 시작",
      explore_business_features: "Business 기능 살펴보기",
    },
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
    updated_at: "업데이트일",
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
    epics: "에픽스",
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
    additional_updates: "추가 업데이트",
    clear_all: "모두 지우기",
    copied: "복사됨!",
    link_copied: "링크 복사됨!",
    link_copied_to_clipboard: "링크가 클립보드에 복사되었습니다",
    copied_to_clipboard: "작업 항목 링크가 클립보드에 복사되었습니다",
    branch_name_copied_to_clipboard: "브랜치 이름이 클립보드에 복사되었습니다",
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
      copy_branch_name: "브랜치 이름 복사",
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
    worklogs: "워크로그",
    project_updates: "프로젝트 업데이트",
    overview: "오버뷰",
    workflows: "워크플로우",
    templates: "템플릿",
    members_and_teamspaces: "멤버와 팀스페이스",
    open_in_full_screen: "전체 화면으로 {page} 열기",
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
    archive: {
      description: `완료되었거나 취소된 에픽만
아카이브할 수 있습니다`,
      label: "에픽 아카이브",
      confirm_message: "에픽을 아카이브하시겠습니까? 아카이브한 에픽은 나중에 복원할 수 있습니다.",
      success: {
        label: "아카이브 성공",
        message: "아카이브는 프로젝트 아카이브에서 확인할 수 있습니다.",
      },
      failed: {
        message: "에픽을 아카이브할 수 없습니다. 다시 시도해 주세요.",
      },
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
      start_before: "시작 이전",
      start_after: "시작 이후",
      finish_before: "완료 이전",
      finish_after: "완료 이후",
      implements: "구현",
      implemented_by: "구현 참조",
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
    vote: {
      click_to_upvote: "클릭하여 추천",
      click_to_downvote: "클릭하여 비추천",
      click_to_view_upvotes: "클릭하여 추천 목록 보기",
      click_to_view_downvotes: "클릭하여 비추천 목록 보기",
    },
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
      body: `안녕하세요 인스턴스 관리자님,

[목적]을 위해 [/workspace-name] URL로 새 작업 공간을 생성해 주세요.

감사합니다,
{firstName} {lastName}
{email}`,
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
      cycle_progress: {
        title: "아직 데이터가 없습니다",
        description: "사이클 진행 분석이 여기에 표시됩니다. 작업 항목을 사이클에 추가하여 진행 상황을 추적하세요.",
      },
      module_progress: {
        title: "아직 데이터가 없습니다",
        description: "모듈 진행 분석이 여기에 표시됩니다. 작업 항목을 모듈에 추가하여 진행 상황을 추적하세요.",
      },
      intake_trends: {
        title: "아직 데이터가 없습니다",
        description: "인테이크 트렌드 분석이 여기에 표시됩니다. 작업 항목을 인테이크에 추가하여 트렌드를 추적하세요.",
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
    projects_by_status: "상태별 프로젝트",
    active_users: "활성 사용자",
    intake_trends: "수용 추세",
    workitem_resolved_vs_pending: "해결된 vs 대기 중인 작업 항목",
    upgrade_to_plan: "{tab} 잠금 해제를 위해 {plan}(으)로 업그레이드하세요",
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
      days_count: "{days, plural, one{# 일} other{# 일}}",
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
    notifications: {
      select_default_view: "기본 보기 선택",
      compact: "컴팩트",
      full: "전체 화면",
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
        heading: "API 토큰",
        description: "보안 API 토큰을 생성하여 데이터를 외부 시스템 및 애플리케이션과 통합합니다.",
        title: "API 토큰",
        add_token: "액세스 토큰 추가",
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
      integrations: {
        title: "인테그레이션",
        page_title: "Plane 데이터를 사용 가능한 앱이나 본인 소유 앱에서 활용하세요.",
        page_description: "이 워크스페이스 또는 사용자가 사용하는 모든 통합을 확인하세요.",
      },
      imports: {
        title: "임포트",
      },
      worklogs: {
        title: "워크로그",
      },
      group_syncing: {
        title: "그룹 동기화",
        heading: "그룹 동기화",
        description:
          "ID 공급자 그룹을 프로젝트 및 역할에 연결합니다. IdP에서 그룹 멤버십이 변경되면 사용자 액세스가 자동으로 업데이트되어 온보딩 및 오프보딩이 간소화됩니다.",
        enable: {
          title: "그룹 동기화 활성화",
          description: "ID 공급자 그룹을 기반으로 사용자를 프로젝트에 자동으로 추가합니다.",
        },
        config: {
          title: "그룹 동기화 구성",
          description: "ID 공급자 그룹이 프로젝트 및 역할에 매핑되는 방식을 설정합니다.",
          sync_on_login: {
            title: "로그인 시 동기화",
            description: "사용자가 로그인할 때 그룹 멤버십 및 프로젝트 액세스를 업데이트합니다.",
          },
          sync_offline: {
            title: "오프라인 동기화",
            description: "사용자 로그인을 기다리지 않고 6시간마다 자동으로 동기화를 실행합니다.",
          },
          auto_remove: {
            title: "자동 제거",
            description: "그룹과 더 이상 일치하지 않는 사용자를 프로젝트에서 자동으로 제거합니다.",
          },
          group_attribute_key: {
            title: "그룹 속성 키",
            description: "사용자 그룹을 식별하고 동기화하는 데 사용되는 ID 공급자 속성.",
            placeholder: "그룹",
          },
        },
        group_mapping: {
          title: "그룹 매핑",
          description: "ID 공급자 그룹을 프로젝트 및 역할에 연결합니다.",
          button_text: "새 그룹 동기화 추가",
        },
        toast: {
          updating: "그룹 동기화 기능 업데이트 중",
          success: "그룹 동기화 기능이 성공적으로 업데이트되었습니다.",
          error: "그룹 동기화 기능 업데이트에 실패했습니다!",
        },
        delete_modal: {
          title: "그룹 동기화 삭제",
          content:
            "이 ID 그룹의 새 사용자는 더 이상 프로젝트에 추가되지 않습니다. 이미 추가된 사용자는 현재 역할을 유지합니다.",
        },
        modal: {
          idp_group_name: {
            text: "사용자 그룹",
            required: "사용자 그룹은 필수입니다",
            placeholder: "IdP 그룹 이름 입력",
          },
          project: {
            text: "프로젝트",
            required: "프로젝트는 필수입니다",
            placeholder: "프로젝트 선택",
          },
          default_role: {
            text: "프로젝트 역할",
            required: "프로젝트 역할은 필수입니다",
            placeholder: "프로젝트 역할 선택",
          },
        },
      },
      identity: {
        title: "신원",
        heading: "신원",
        description: "도메인을 구성하고 Single sign-on을 활성화하세요",
      },
      project_states: {
        title: "프로젝트 스테이트",
      },
      projects: {
        title: "프로젝트",
        description: "프로젝트 상태 관리, 프로젝트 레이블 활성화 및 기타 구성을 관리합니다.",
        tabs: {
          states: "프로젝트 스테이트",
          labels: "프로젝트 레이블",
        },
      },
      teamspaces: {
        title: "팀스페이스",
      },
      initiatives: {
        title: "이니셔티브",
      },
      customers: {
        title: "커스터머",
      },
      releases: {
        title: "릴리스",
        update_release: "릴리스 업데이트",
        create_release: "릴리스 만들기",
        errors: {
          release_not_found: "찾으시는 릴리스가 존재하지 않습니다.",
          unknown: "문제가 발생했습니다. 다시 시도해 주세요.",
        },
      },

      cancel_trial: {
        title: "먼저 트라이얼을 취소하세요.",
        description: "유료 플랜 중 하나에 대한 활성 트라이얼이 있습니다. 계속하려면 먼저 이를 취소하세요.",
        dismiss: "무시",
        cancel: "트라이얼 취소",
        cancel_success_title: "트라이얼이 취소되었습니다.",
        cancel_success_message: "이제 워크스페이스를 삭제할 수 있습니다.",
        cancel_error_title: "작동하지 않았습니다.",
        cancel_error_message: "다시 시도해 주세요.",
      },
      applications: {
        title: "애플리케이션",
        applicationId_copied: "애플리케이션 ID가 클립보드에 복사되었습니다",
        clientId_copied: "클라이언트 ID가 클립보드에 복사되었습니다",
        clientSecret_copied: "클라이언트 시크릿이 클립보드에 복사되었습니다",
        third_party_apps: "서드파티 앱",
        your_apps: "내 앱",
        connect: "연결",
        connected: "연결됨",
        install: "설치",
        installed: "설치됨",
        configure: "설정",
        app_available: "이 앱을 Plane 워크스페이스에서 사용할 수 있게 되었습니다",
        app_available_description: "사용을 시작하려면 Plane 워크스페이스에 연결하세요",
        client_id_and_secret: "클라이언트 ID와 시크릿",
        client_id_and_secret_description:
          "이 시크릿 키를 복사하여 저장하세요. 닫기를 누른 후에는 이 키를 볼 수 없습니다.",
        client_id_and_secret_download: "여기에서 키가 포함된 CSV를 다운로드할 수 있습니다.",
        application_id: "애플리케이션 ID",
        client_id: "클라이언트 ID",
        client_secret: "클라이언트 시크릿",
        export_as_csv: "CSV로 내보내기",
        slug_already_exists: "슬러그가 이미 존재합니다",
        failed_to_create_application: "애플리케이션 생성 실패",
        upload_logo: "로고 업로드",
        app_name_title: "이 앱의 이름을 지정하세요",
        app_name_error: "앱 이름은 필수입니다",
        app_short_description_title: "이 앱에 대한 간단한 설명을 작성하세요",
        app_short_description_error: "앱 간단 설명은 필수입니다",
        app_description_title: {
          label: "긴 설명",
          placeholder: "마켓플레이스를 위한 긴 설명을 작성하세요. 명령을 보려면 '/' 키를 누르세요.",
        },
        authorization_grant_type: {
          title: "연결 유형",
          description: "앱을 워크스페이스에 한 번 설치할지, 각 사용자가 자신의 계정을 연결할 수 있도록 할지 선택하세요",
        },
        app_description_error: "앱 설명은 필수입니다",
        app_slug_title: "앱 슬러그",
        app_slug_error: "앱 슬러그는 필수입니다",
        app_maker_title: "앱 제작자",
        app_maker_error: "앱 제작자는 필수입니다",
        webhook_url_title: "웹훅 URL",
        webhook_url_error: "웹훅 URL은 필수입니다",
        invalid_webhook_url_error: "잘못된 웹훅 URL",
        redirect_uris_title: "리다이렉트 URI",
        redirect_uris_error: "리다이렉트 URI는 필수입니다",
        invalid_redirect_uris_error: "잘못된 리다이렉트 URI",
        redirect_uris_description:
          "앱이 사용자를 리다이렉트할 URI를 공백으로 구분하여 입력하세요(예: https://example.com https://example.com/)",
        authorized_javascript_origins_title: "승인된 자바스크립트 출처",
        authorized_javascript_origins_error: "승인된 자바스크립트 출처는 필수입니다",
        invalid_authorized_javascript_origins_error: "잘못된 승인된 자바스크립트 출처",
        authorized_javascript_origins_description:
          "앱이 요청을 할 수 있는 출처를 공백으로 구분하여 입력하세요(예: app.com example.com)",
        create_app: "앱 생성",
        update_app: "앱 업데이트",
        regenerate_client_secret_description:
          "클라이언트 시크릿을 재생성합니다. 재생성 후 키를 복사하거나 CSV 파일로 다운로드할 수 있습니다.",
        regenerate_client_secret: "클라이언트 시크릿 재생성",
        regenerate_client_secret_confirm_title: "클라이언트 시크릿을 재생성하시겠습니까?",
        regenerate_client_secret_confirm_description:
          "이 시크릿을 사용하는 앱이 작동을 멈춥니다. 앱에서 시크릿을 업데이트해야 합니다.",
        regenerate_client_secret_confirm_cancel: "취소",
        regenerate_client_secret_confirm_regenerate: "재생성",
        read_only_access_to_workspace: "워크스페이스에 대한 읽기 전용 접근",
        write_access_to_workspace: "워크스페이스에 대한 쓰기 접근",
        read_only_access_to_user_profile: "사용자 프로필에 대한 읽기 전용 접근",
        write_access_to_user_profile: "사용자 프로필에 대한 쓰기 접근",
        connect_app_to_workspace: "{app}을(를) {workspace} 워크스페이스에 연결",
        user_permissions: "사용자 권한",
        user_permissions_description: "사용자 권한은 사용자 프로필에 대한 접근을 허용하는 데 사용됩니다.",
        workspace_permissions: "워크스페이스 권한",
        workspace_permissions_description: "워크스페이스 권한은 워크스페이스에 대한 접근을 허용하는 데 사용됩니다.",
        with_the_permissions: "권한과 함께",
        app_consent_title: "{app}이(가) 귀하의 Plane 워크스페이스와 프로필에 대한 접근을 요청하고 있습니다.",
        choose_workspace_to_connect_app_with: "앱을 연결할 워크스페이스를 선택하세요",
        app_consent_workspace_permissions_title: "{app}이(가) 원하는 것",
        app_consent_user_permissions_title:
          "{app}은(는) 다음 리소스에 대한 사용자 권한도 요청할 수 있습니다. 이러한 권한은 사용자에 의해서만 요청되고 승인됩니다.",
        app_consent_accept_title: "수락함으로써",
        app_consent_accept_1:
          "앱이 Plane 내부 또는 외부에서 사용할 수 있는 곳에서 귀하의 Plane 데이터에 접근할 수 있도록 허용합니다",
        app_consent_accept_2: "{app}의 개인정보 보호정책 및 이용 약관에 동의합니다",
        accepting: "수락 중...",
        accept: "수락",
        categories: "카테고리",
        select_app_categories: "앱 카테고리 선택",
        categories_title: "카테고리",
        categories_error: "카테고리는 필수입니다",
        invalid_categories_error: "유효하지 않은 카테고리",
        categories_description: "앱을 가장 잘 설명하는 카테고리를 선택하세요",
        supported_plans: "지원되는 플랜",
        supported_plans_description:
          "이 애플리케이션을 설치할 수 있는 워크스페이스 플랜을 선택하세요. 비워두면 모든 플랜이 허용됩니다.",
        select_plans: "플랜 선택",
        privacy_policy_url_title: "개인정보 보호 정책 URL",
        privacy_policy_url_error: "개인정보 보호 정책 URL은 필수입니다",
        invalid_privacy_policy_url_error: "유효하지 않은 개인정보 보호 정책 URL",
        terms_of_service_url_title: "이용 약관 URL",
        terms_of_service_url_error: "이용 약관 URL은 필수입니다",
        invalid_terms_of_service_url_error: "유효하지 않은 이용 약관 URL",
        support_url_title: "지원 URL",
        support_url_error: "지원 URL은 필수입니다",
        invalid_support_url_error: "유효하지 않은 지원 URL",
        video_url_title: "비디오 URL",
        video_url_error: "비디오 URL은 필수입니다",
        invalid_video_url_error: "유효하지 않은 비디오 URL",
        setup_url_title: "설정 URL",
        setup_url_error: "설정 URL은 필수입니다",
        invalid_setup_url_error: "유효하지 않은 설정 URL",
        configuration_url_title: "설정 URL",
        configuration_url_error: "설정 URL은 필수입니다",
        invalid_configuration_url_error: "유효하지 않은 설정 URL",
        contact_email_title: "연락처 이메일",
        contact_email_error: "연락처 이메일은 필수입니다",
        invalid_contact_email_error: "유효하지 않은 연락처 이메일",
        upload_attachments: "첨부 파일 업로드",
        uploading_images: "업로드 중 {count} 이미지{count, plural, one {s} other {s}}",
        drop_images_here: "이미지를 여기에 놓으세요",
        click_to_upload_images: "이미지를 클릭하여 업로드",
        invalid_file_or_exceeds_size_limit: "유효하지 않은 파일 또는 크기 제한 초과 ({size} MB)",
        uploading: "업로드 중...",
        upload_and_save: "업로드 및 저장",
        app_credentials_regenrated: {
          title: "앱 자격 증명이 성공적으로 재생성되었습니다",
          description: "클라이언트 시크릿이 사용되는 모든 곳에서 교체하세요. 이전 시크릿은 더 이상 유효하지 않습니다.",
        },
        app_created: {
          title: "앱이 성공적으로 생성되었습니다",
          description: "자격 증명을 사용하여 Plane 작업 공간에 앱을 설치하세요",
        },
        installed_apps: "설치된 앱",
        all_apps: "모든 앱",
        internal_apps: "내부 앱",
        website: {
          title: "웹사이트",
          description: "앱 웹사이트로 연결되는 링크입니다.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "앱 메이커",
          description: "앱을 만드는 개인 또는 조직입니다.",
        },
        setup_url: {
          label: "설정 URL",
          description: "사용자가 앱을 설치하면 이 URL로 리디렉션됩니다.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "웹훅 URL",
          description: "앱이 설치된 작업 공간에서 발생하는 웹훅 이벤트와 업데이트를 여기에 전송합니다.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "리디렉션 URI(공백으로 구분)",
          description: "사용자가 Plane에서 인증을 완료하면 이 경로로 리디렉션됩니다.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "이 앱은 워크스페이스 관리자가 설치한 후에만 설치할 수 있습니다. 계속 진행하려면 워크스페이스 관리자에게 문의하세요.",
        enable_app_mentions: "앱 멘션 활성화",
        enable_app_mentions_tooltip:
          "이 기능을 활성화하면 사용자가 워크 아이템을 이 애플리케이션에 언급하거나 할당할 수 있습니다.",
        scopes: "범위",
        select_scopes: "범위 선택",
        read_access_to: "읽기 전용 액세스",
        write_access_to: "쓰기 액세스",
        global_permission_expiration:
          "전역 범위가 곧 만료됩니다. 대신 세분화된 범위를 사용하세요. 예: 전역 읽기 대신 project:read를 사용하세요.",
        selected_scopes: "{count}개 선택됨",
        scopes_and_permissions: "범위 및 권한",
        read: "읽기",
        write: "쓰기",
        scope_description: {
          projects: "프로젝트 및 프로젝트 관련 엔티티에 대한 액세스",
          wiki: "위키 및 위키 관련 엔티티에 대한 액세스",
          customers: "고객 및 고객 관련 엔티티에 대한 액세스",
          initiatives: "이니셔티브 및 이니셔티브 관련 엔티티에 대한 액세스",
          workspaces: "워크스페이스 및 워크스페이스 관련 엔티티에 대한 액세스",
          stickies: "스티키 및 스티키 관련 엔티티에 대한 액세스",
          teamspaces: "팀스페이스 및 팀스페이스 관련 엔티티에 대한 액세스",
          profile: "사용자 프로필 정보에 대한 액세스",
          agents: "에이전트 및 모든 에이전트 관련 엔티티에 대한 액세스",
          assets: "에셋 및 모든 에셋 관련 엔티티에 대한 액세스",
        },
        build_your_own_app: "나만의 앱 만들기",
        edit_app_details: "앱 세부정보 편집",
        internal: "내부",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description: "작업이 더 똑똑하고 빨리 진행되도록 네이티브로 연결된 AI를 사용하세요.",
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
      connections: "커넥션",
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
      project_lead_description: "프로젝트의 프로젝트 리더를 선택하세요.",
      default_assignee_description: "프로젝트의 기본 담당자를 선택하세요.",
      project_subscribers: "프로젝트 구독자",
      project_subscribers_description: "이 프로젝트의 알림을 받을 멤버를 선택하세요.",
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
        reorder: {
          success: {
            title: "견적 순서 변경됨",
            message: "프로젝트의 견적 순서가 변경되었습니다.",
          },
          error: {
            title: "견적 순서 변경 실패",
            message: "견적 순서를 변경할 수 없습니다. 다시 시도해 주세요.",
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
        fill: "이 견적 필드를 작성해 주세요",
        repeat: "견적 값은 중복될 수 없습니다",
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
      edit: {
        title: "견적 시스템 편집",
        add_or_update: {
          title: "견적 추가, 업데이트 또는 제거",
          description: "포인트 또는 카테고리를 추가, 업데이트 또는 제거하여 현재 시스템을 관리합니다.",
        },
        switch: {
          title: "견적 유형 변경",
          description: "포인트 시스템을 카테고리 시스템으로 변환하거나 그 반대로 변환합니다.",
        },
      },
      switch: "견적 시스템 전환",
      current: "현재 견적 시스템",
      select: "견적 시스템 선택",
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
      "auto-remind": {
        title: "자동 알림",
        description: "Plane은 이메일과 앱 알림을 통해 팀이 마감일에 따라 추진하도록 자동으로 알림을 보냅니다.",
        duration: "알림 전",
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
      integrations: {
        title: "구성된 인테그레이션 없음",
        description: "GitHub 및 기타 인테그레이션을 구성하여 프로젝트 작업 항목을 동기화하세요.",
      },
    },
    initiatives: {
      heading: "이니셔티브",
      sub_heading: "플레인에서 모든 작업에 대한 최고 수준의 조직화를 활성화하세요.",
      title: "이니셔티브 활성화",
      description: "진행 상황을 모니터링할 더 큰 목표 설정",
      toast: {
        updating: "이니셔티브 기능 업데이팅",
        enable_success: "이니셔티브 기능이 성공적으로 활성화되었습니다.",
        disable_success: "이니셔티브 기능이 성공적으로 비활성화되었습니다.",
        error: "이니셔티브 기능 업데이트에 실패했습니다!",
      },
    },
    customers: {
      heading: "커스터머",
      settings_heading: "고객에게 중요한 것을 기준으로 작업을 관리하세요.",
      settings_sub_heading:
        "고객 요청을 작업 항목으로 가져오고, 요청에 따라 우선순위를 지정하고, 작업 항목의 상태를 고객 기록에 통합합니다. 곧 CRM이나 지원 도구와 통합하여 고객 속성별로 더 나은 작업 관리를 제공할 예정입니다.",
    },
    epics: {
      properties: {
        title: "프로퍼티",
        description: "에픽에 커스텀 프로퍼티를 추가하세요.",
      },
      disabled: "비활성화됨",
    },
    cycles: {
      auto_schedule: {
        heading: "사이클 자동 일정",
        description: "수동 설정 없이 사이클을 유지합니다.",
        tooltip: "선택한 일정에 따라 새로운 사이클을 자동으로 생성합니다.",
        edit_button: "편집",
        form: {
          cycle_title: {
            label: "사이클 제목",
            placeholder: "제목",
            tooltip: "제목은 후속 사이클에 번호가 추가됩니다. 예: 디자인 - 1/2/3",
            validation: {
              required: "사이클 제목은 필수입니다",
              max_length: "제목은 255자를 초과할 수 없습니다",
            },
          },
          cycle_duration: {
            label: "사이클 기간",
            unit: "주",
            validation: {
              required: "사이클 기간은 필수입니다",
              min: "사이클 기간은 최소 1주 이상이어야 합니다",
              max: "사이클 기간은 30주를 초과할 수 없습니다",
              positive: "사이클 기간은 양수여야 합니다",
            },
          },
          cooldown_period: {
            label: "쿨다운 기간",
            unit: "일",
            tooltip: "다음 사이클이 시작되기 전 사이클 간 휴지 기간입니다.",
            validation: {
              required: "쿨다운 기간은 필수입니다",
              negative: "쿨다운 기간은 음수일 수 없습니다",
            },
          },
          start_date: {
            label: "사이클 시작일",
            validation: {
              required: "시작일은 필수입니다",
              past: "시작일은 과거일 수 없습니다",
            },
          },
          number_of_cycles: {
            label: "미래 사이클 수",
            validation: {
              required: "사이클 수는 필수입니다",
              min: "최소 1개의 사이클이 필요합니다",
              max: "3개 이상의 사이클을 예약할 수 없습니다",
            },
          },
          auto_rollover: {
            label: "작업 항목 자동 이월",
            tooltip: "사이클이 완료되는 날, 완료되지 않은 모든 작업 항목을 다음 사이클로 이동합니다.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "사이클 자동 일정 활성화 중",
            loading_disable: "사이클 자동 일정 비활성화 중",
            success: {
              title: "성공!",
              message: "사이클 자동 일정이 성공적으로 전환되었습니다.",
            },
            error: {
              title: "오류!",
              message: "사이클 자동 일정 전환에 실패했습니다.",
            },
          },
          save: {
            loading: "사이클 자동 일정 구성 저장 중",
            success: {
              title: "성공!",
              message_create: "사이클 자동 일정 구성이 성공적으로 저장되었습니다.",
              message_update: "사이클 자동 일정 구성이 성공적으로 업데이트되었습니다.",
            },
            error: {
              title: "오류!",
              message_create: "사이클 자동 일정 구성 저장에 실패했습니다.",
              message_update: "사이클 자동 일정 구성 업데이트에 실패했습니다.",
            },
          },
        },
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
        intake_responsibility: "인테이크 책임",
        intake_sources: "인테이크 소스",
        title: "접수",
        short_title: "접수",
        description: "워크플로를 방해하지 않고 비회원이 버그, 피드백 및 제안을 공유할 수 있도록 합니다.",
        toggle_title: "접수 활성화",
        toggle_description: "프로젝트 멤버가 앱 내에서 접수 요청을 생성할 수 있도록 허용합니다.",
        toggle_tooltip_on: "프로젝트 관리자에게 활성화를 요청하세요.",
        toggle_tooltip_off: "프로젝트 관리자에게 비활성화를 요청하세요.",
        notify_assignee: {
          title: "담당자에게 알림",
          description: "새로운 인테이크 요청의 경우 기본 담당자가 알림을 통해 알림을 받습니다",
        },
        in_app: {
          title: "앱 내",
          description: "기존 작업 항목을 방해하지 않고 워크스페이스의 멤버와 게스트로부터 새로운 작업 항목을 받습니다.",
        },
        email: {
          title: "이메일",
          description: "Plane 이메일 주소로 이메일을 보내는 누구로부터든 새로운 작업 항목을 수집합니다.",
          fieldName: "이메일 ID",
        },
        form: {
          title: "양식",
          description:
            "전용 보안 양식을 통해 워크스페이스 외부 사용자가 잠재적인 새로운 작업 항목을 만들 수 있도록 합니다.",
          fieldName: "기본 양식 URL",
          create_forms: "작업 항목 유형을 사용하여 양식 만들기",
          manage_forms: "양식 관리",
          manage_forms_tooltip: "워크스페이스 관리자에게 관리를 요청하세요.",
          create_form: "양식 만들기",
          edit_form: "양식 세부 정보 편집",
          form_title: "양식 제목",
          form_title_required: "양식 제목은 필수입니다",
          work_item_type: "작업 항목 유형",
          remove_property: "속성 제거",
          select_properties: "속성 선택",
          search_placeholder: "속성 검색",
          toasts: {
            success_create: "인테이크 양식이 성공적으로 생성되었습니다",
            success_update: "인테이크 양식이 성공적으로 업데이트되었습니다",
            error_create: "인테이크 양식 생성에 실패했습니다",
            error_update: "인테이크 양식 업데이트에 실패했습니다",
          },
        },
        toasts: {
          set: {
            loading: "담당자 설정 중...",
            success: {
              title: "성공!",
              message: "담당자가 성공적으로 설정되었습니다.",
            },
            error: {
              title: "오류!",
              message: "담당자 설정 중 문제가 발생했습니다. 다시 시도해 주세요.",
            },
          },
        },
      },
      time_tracking: {
        title: "시간 추적",
        short_title: "시간 추적",
        description: "작업 항목 및 프로젝트에 소요된 시간을 기록합니다.",
        toggle_title: "시간 추적 활성화",
        toggle_description: "프로젝트 멤버가 작업 시간을 기록할 수 있습니다.",
      },
      milestones: {
        title: "마일스톤",
        short_title: "마일스톤",
        description: "마일스톤은 작업 항목을 공유 완료 날짜에 맞춰 정렬하는 레이어를 제공합니다.",
        toggle_title: "마일스톤 활성화",
        toggle_description: "마일스톤 마감일별로 작업 항목을 구성합니다.",
      },
      toasts: {
        loading: "프로젝트 기능 업데이트 중...",
        success: "프로젝트 기능이 성공적으로 업데이트되었습니다.",
        error: "프로젝트 기능 업데이트 중 문제가 발생했습니다. 다시 시도해 주세요.",
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
    transfer: {
      no_cycles_available: "작업 항목을 전송할 수 있는 다른 사이클이 없습니다.",
    },
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
      trailing: "뒤처짐",
      leading: "앞섬",
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
          highlight_changes: "변경 사항 강조 표시",
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
  workspace_dashboards: "대시보드",
  pi_chat: "인공지능 챗",
  in_app: "인앱",
  forms: "폼스",
  choose_workspace_for_integration: "이 앱에 연결할 작업 공간을 선택하세요",
  integrations_description: "Plane의 앱은 관리자인 작업 공간에 연결해야 합니다.",
  create_a_new_workspace: "새 작업 공간 만들기",
  learn_more_about_workspaces: "작업 공간에 대해 자세히 알아보기",
  no_workspaces_to_connect: "연결할 작업 공간이 없습니다",
  no_workspaces_to_connect_description: "연결할 작업 공간을 만들어야 합니다",
  updates: {
    add_update: "업데이트 추가",
    add_update_placeholder: "여기에 업데이트를 입력하세요",
    empty: {
      title: "아직 업데이트가 없습니다",
      description: "여기에서 업데이트를 확인할 수 있습니다.",
    },
    delete: {
      title: "업데이트 삭제",
      confirmation: "이 업데이트를 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.",
      success: {
        title: "업데이트가 삭제되었습니다",
        message: "업데이트가 성공적으로 삭제되었습니다.",
      },
      error: {
        title: "업데이트 삭제 실패",
        message: "업데이트를 삭제할 수 없습니다.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "반응이 생성되었습니다",
          message: "반응이 성공적으로 생성되었습니다.",
        },
        error: {
          title: "반응 생성 실패",
          message: "반응을 생성할 수 없습니다.",
        },
      },
      remove: {
        success: {
          title: "반응이 삭제되었습니다",
          message: "반응이 성공적으로 삭제되었습니다.",
        },
        error: {
          title: "반응 삭제 실패",
          message: "반응을 삭제할 수 없습니다.",
        },
      },
    },
    progress: {
      title: "진행 상태",
      since_last_update: "마지막 업데이트부터",
      comments: "{count, plural, one{# 댓글} other{# 댓글}}",
    },
    create: {
      success: {
        title: "업데이트가 생성되었습니다",
        message: "업데이트가 성공적으로 생성되었습니다.",
      },
      error: {
        title: "업데이트 생성 실패",
        message: "업데이트를 생성할 수 없습니다.",
      },
    },
    update: {
      success: {
        title: "업데이트가 업데이트되었습니다",
        message: "업데이트가 성공적으로 업데이트되었습니다.",
      },
      error: {
        title: "업데이트 업데이트 실패",
        message: "업데이트를 업데이트할 수 없습니다.",
      },
    },
  },
  teamspaces: {
    label: "팀스페이스",
    empty_state: {
      general: {
        title: "팀스페이스는 플레인에서 더 나은 조직화와 추적을 가능하게 합니다.",
        description:
          "모든 실제 팀을 위한 전용 공간을 만들고, 플레인의 다른 모든 작업 공간과 분리하여 팀이 일하는 방식에 맞게 사용자 지정하세요.",
        primary_button: {
          text: "새 팀스페이스 만들기",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "아직 연결된 팀스페이스가 없습니다.",
          description: "팀스페이스와 프로젝트 소유자가 프로젝트에 대한 접근을 관리할 수 있습니다.",
        },
      },
      primary_button: {
        text: "팀스페이스 연결",
      },
      secondary_button: {
        text: "자세히 알아보기",
      },
      table: {
        columns: {
          teamspaceName: "팀스페이스 이름",
          members: "구성원",
          accountType: "계정 유형",
        },
        actions: {
          remove: {
            button: {
              text: "팀스페이스 제거",
            },
            confirm: {
              title: "{projectName}에서 {teamspaceName} 제거",
              description:
                "연결된 프로젝트에서 이 팀스페이스를 제거하면 여기의 구성원은 연결된 프로젝트에 대한 접근 권한을 잃게 됩니다.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "일치하는 팀스페이스를 찾을 수 없습니다",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {이 프로젝트에 팀스페이스를 연결했습니다.} other {이 프로젝트에 #개의 팀스페이스를 연결했습니다.}}",
            description:
              "{additionalCount, plural, =0 {팀스페이스 {firstTeamspaceName}가 이제 이 프로젝트에 연결되었습니다.} other {팀스페이스 {firstTeamspaceName}와 {additionalCount}개가 이제 이 프로젝트에 연결되었습니다.}}",
          },
          error: {
            title: "처리되지 않았습니다.",
            description: "다시 시도하거나 페이지를 새로고침한 후 다시 시도해 주세요.",
          },
        },
        remove_teamspace: {
          success: {
            title: "이 프로젝트에서 해당 팀스페이스를 제거했습니다.",
            description: "팀스페이스 {teamspaceName}가 {projectName}에서 제거되었습니다.",
          },
          error: {
            title: "처리되지 않았습니다.",
            description: "다시 시도하거나 페이지를 새로고침한 후 다시 시도해 주세요.",
          },
        },
      },
      link_teamspace: {
        placeholder: "팀스페이스 검색",
        info: {
          title: "팀스페이스를 추가하면 모든 팀스페이스 구성원이 이 프로젝트에 접근할 수 있습니다.",
          link: "자세히 알아보기",
        },
        empty_state: {
          no_teamspaces: {
            title: "연결할 팀스페이스가 없습니다.",
            description:
              "연결할 수 있는 팀스페이스에 속해 있지 않거나 이미 사용 가능한 모든 팀스페이스를 연결했습니다.",
          },
          no_results: {
            title: "일치하는 팀스페이스가 없습니다.",
            description: "다른 검색어를 시도하거나 연결할 팀스페이스가 있는지 확인하세요.",
          },
        },
        primary_button: {
          text: "선택한 팀스페이스 연결",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "팀별 작업 항목을 만드세요.",
        description:
          "연결된 프로젝트에서 이 팀의 구성원에게 할당된 작업 항목이 여기에 자동으로 표시됩니다. 여기서 일부 작업 항목이 표시될 것으로 예상되는 경우, 연결된 프로젝트에 이 팀의 구성원에게 할당된 작업 항목이 있는지 확인하거나 작업 항목을 만드세요.",
        primary_button: {
          text: "연결된 프로젝트에 작업 항목 추가",
        },
      },
      work_items_empty_filter: {
        title: "적용된 필터에 대한 팀별 작업 항목이 없습니다",
        description: "필터 중 일부를 변경하거나 모두 지워 이 공간과 관련된 작업 항목을 확인하세요.",
        secondary_button: {
          text: "모든 필터 지우기",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "연결된 프로젝트에 활성 사이클이 없습니다.",
        description:
          "연결된 프로젝트의 활성 사이클이 여기에 자동으로 표시됩니다. 활성 사이클이 표시될 것으로 예상되는 경우, 연결된 프로젝트에서 현재 실행 중인지 확인하세요.",
      },
      completed: {
        title: "연결된 프로젝트에 완료된 사이클이 없습니다.",
        description:
          "연결된 프로젝트의 완료된 사이클이 여기에 자동으로 표시됩니다. 완료된 사이클이 표시될 것으로 예상되는 경우, 연결된 프로젝트에서도 완료되었는지 확인하세요.",
      },
      upcoming: {
        title: "연결된 프로젝트에 예정된 사이클이 없습니다.",
        description:
          "연결된 프로젝트의 예정된 사이클이 여기에 자동으로 표시됩니다. 예정된 사이클이 표시될 것으로 예상되는 경우, 연결된 프로젝트에도 있는지 확인하세요.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "워크스페이스의 다른 뷰를 방해하지 않고 작업에 대한 팀의 뷰",
        description: "팀을 위해 저장된 뷰와 프로젝트의 뷰와 별도로 팀의 작업을 확인하세요.",
        primary_button: {
          text: "뷰 만들기",
        },
      },
      filter: {
        title: "일치하는 뷰 없음",
        description: `검색 기준과 일치하는 뷰가 없습니다.
 대신 새 뷰를 만드세요.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "팀 페이지에 팀의 지식을 저장하세요.",
        description:
          "프로젝트의 페이지와 달리, 여기에서 팀별 지식을 별도의 페이지 세트에 저장할 수 있습니다. 페이지의 모든 기능을 활용하고, 모범 사례 문서 및 팀 위키를 쉽게 만드세요.",
        primary_button: {
          text: "첫 번째 팀 페이지 만들기",
        },
      },
      filter: {
        title: "일치하는 페이지 없음",
        description: "모든 페이지를 보려면 필터를 제거하세요",
      },
      search: {
        title: "일치하는 페이지 없음",
        description: "모든 페이지를 보려면 검색 기준을 제거하세요",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "연결된 프로젝트에 게시된 작업 항목이 없습니다.",
        description:
          "해당 프로젝트 중 하나 이상에서 일부 작업 항목을 생성하여 날짜, 상태 및 우선순위별 진행 상황을 확인하세요.",
      },
      relation: {
        blocking: {
          title: "팀원을 차단하는 작업 항목이 없습니다.",
          description: "잘했습니다! 팀을 위한 길을 열었습니다. 당신은 좋은 팀 플레이어입니다.",
        },
        blocked: {
          title: "팀원의 작업 항목이 당신을 차단하지 않습니다.",
          description: "좋은 소식! 할당된 모든 작업 항목에서 진행할 수 있습니다.",
        },
      },
      stats: {
        general: {
          title: "연결된 프로젝트에 게시된 작업 항목이 없습니다.",
          description:
            "해당 프로젝트 중 하나 이상에서 일부 작업 항목을 생성하여 프로젝트 및 팀 구성원별 작업 분배를 확인하세요.",
        },
        filter: {
          title: "적용된 필터에 대한 팀 통계가 없습니다.",
          description:
            "해당 프로젝트 중 하나 이상에서 일부 작업 항목을 생성하여 프로젝트 및 팀 구성원별 작업 분배를 확인하세요.",
        },
      },
    },
  },
  initiatives: {
    overview: "개요",
    label: "이니셔티브",
    placeholder: "{count, plural, one{# 이니셔티브} other{# 이니셔티브}}",
    add_initiative: "이니셔티브 추가",
    create_initiative: "이니셔티브 생성",
    update_initiative: "이니셔티브 업데이트",
    initiative_name: "이니셔티브 이름",
    all_initiatives: "모든 이니셔티브",
    delete_initiative: "이니셔티브 삭제",
    fill_all_required_fields: "모든 필수 필드를 입력해 주세요.",
    toast: {
      create_success: "이니셔티브 {name} 성공적으로 생성되었습니다.",
      create_error: "이니셔티브 생성에 실패했습니다. 다시 시도해 주세요!",
      update_success: "이니셔티브 {name} 성공적으로 업데이트되었습니다.",
      update_error: "이니셔티브 업데이트에 실패했습니다. 다시 시도해 주세요!",
      delete: {
        success: "이니셔티브가 성공적으로 삭제되었습니다.",
        error: "이니셔티브 삭제에 실패했습니다",
      },
      link_copied: "이니셔티브 링크가 클립보드에 복사되었습니다.",
      project_update_success: "이니셔티브 프로젝트가 성공적으로 업데이트되었습니다.",
      project_update_error: "이니셔티브 프로젝트 업데이트에 실패했습니다. 다시 시도해 주세요!",
      epic_update_success:
        "에픽{count, plural, one {이 이니셔티브에 성공적으로 추가되었습니다.} other {들이 이니셔티브에 성공적으로 추가되었습니다.}}",
      epic_update_error: "이니셔티브에 에픽 추가에 실패했습니다. 나중에 다시 시도해 주세요.",
      state_update_success: "이니셔티브 상태가 성공적으로 업데이트되었습니다.",
      state_update_error: "이니셔티브 상태를 업데이트하지 못했습니다. 다시 시도해 주세요!",
      label_update_error: "이니셔티브 레이블 업데이트에 실패했습니다. 다시 시도해주세요!",
    },
    empty_state: {
      general: {
        title: "이니셔티브로 최고 수준에서 작업을 구성하세요",
        description:
          "여러 프로젝트와 팀에 걸친 작업을 구성해야 할 때 이니셔티브가 유용합니다. 프로젝트와 에픽을 이니셔티브에 연결하고, 자동으로 롤업된 업데이트를 보고, 세부 사항을 보기 전에 전체 그림을 볼 수 있습니다.",
        primary_button: {
          text: "이니셔티브 만들기",
        },
      },
      search: {
        title: "일치하는 이니셔티브 없음",
        description: `일치하는 기준의 이니셔티브가 감지되지 않았습니다.
 대신 새 이니셔티브를 만드세요.`,
      },
      not_found: {
        title: "이니셔티브가 존재하지 않습니다",
        description: "찾고 있는 이니셔티브가 존재하지 않거나, 보관되었거나, 삭제되었습니다.",
        primary_button: {
          text: "다른 이니셔티브 보기",
        },
      },
      epics: {
        title: "이니셔티브가 존재하지 않습니다",
        subHeading: "모든 이니셔티브를 보려면 모든 적용된 필터를 지우세요.",
        action: "필터 지우기",
      },
    },
    scope: {
      view_scope: "범위 보기",
      breakdown: "범위 분해",
      add_scope: "범위 추가",
      label: "범위",
      empty_state: {
        title: "아직 이니셔티브에 범위가 추가되지 않았습니다",
        description: "이 이니셔티브에 프로젝트와 에픽을 연결하고 그 작업을 이 공간에서 추적하세요.",
        primary_button: {
          text: "범위 추가",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "레이블",
        description: "레이블로 이니셔티브를 구조화하고 정리하세요.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "레이블 삭제",
        content:
          "{labelName}을(를) 삭제하시겠습니까? 이렇게 하면 모든 이니셔티브와 해당 레이블이 필터링된 모든 뷰에서 레이블이 제거됩니다.",
      },
      toast: {
        delete_error: "이니셔티브 레이블을 삭제할 수 없습니다. 다시 시도하세요.",
        label_already_exists: "레이블이 이미 존재합니다",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "메모, 문서 또는 전체 지식 기반을 작성하세요. 플레인의 AI 어시스턴트인 갈릴레오가 시작하는 데 도움을 줍니다",
        description:
          "페이지는 플레인에서 생각을 정리하는 공간입니다. 회의 노트를 작성하고, 쉽게 포맷하고, 작업 항목을 포함시키고, 컴포넌트 라이브러리를 사용하여 레이아웃하고, 모든 것을 프로젝트 컨텍스트에 유지하세요. 어떤 문서든 빠르게 작업하려면 단축키나 버튼 클릭으로 플레인의 AI인 갈릴레오를 호출하세요.",
        primary_button: {
          text: "첫 번째 페이지 만들기",
        },
      },
      private: {
        title: "아직 개인 페이지가 없습니다",
        description: "여기에 개인 생각을 보관하세요. 공유할 준비가 되면, 팀은 클릭 한 번으로 가능합니다.",
        primary_button: {
          text: "첫 번째 페이지 만들기",
        },
      },
      public: {
        title: "아직 워크스페이스 페이지가 없습니다",
        description: "워크스페이스의 모든 사람과 공유된 페이지를 여기서 확인하세요.",
        primary_button: {
          text: "첫 번째 페이지 만들기",
        },
      },
      archived: {
        title: "아직 보관된 페이지가 없습니다",
        description: "현재 관심 없는 페이지를 보관하세요. 필요할 때 여기서 액세스하세요.",
      },
    },
  },
  epics: {
    label: "에픽스",
    no_epics_selected: "선택된 에픽 없음",
    add_selected_epics: "선택한 에픽 추가",
    epic_link_copied_to_clipboard: "에픽 링크가 클립보드에 복사되었습니다.",
    project_link_copied_to_clipboard: "프로젝트 링크가 클립보드에 복사되었습니다",
    empty_state: {
      general: {
        title: "에픽을 만들고 다른 사람 또는 자신에게 할당하세요",
        description:
          "여러 사이클에 걸쳐 있고 모듈 간에 존재할 수 있는 더 큰 작업 단위에 대해 에픽을 만드세요. 프로젝트의 작업 항목과 하위 작업 항목을 에픽에 연결하고 오버뷰에서 작업 항목으로 이동하세요.",
        primary_button: {
          text: "에픽 생성",
        },
      },
      section: {
        title: "아직 에픽이 없습니다",
        description: "진행 상황을 관리하고 추적하기 위해 에픽 추가를 시작하세요.",
        primary_button: {
          text: "에픽 추가",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "일치하는 에픽을 찾을 수 없습니다",
      },
      no_epics: {
        title: "에픽을 찾을 수 없습니다",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "활성 사이클 없음",
        description:
          "범위 내에 오늘 날짜를 포함하는 기간이 있는 프로젝트의 사이클입니다. 여기에서 모든 활성 사이클의 진행 상황과 세부 정보를 찾을 수 있습니다.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `사이클의 진행 상황을 보려면 작업 항목을
 추가하세요`,
      },
      priority: {
        title: `사이클에서 처리된 높은 우선순위 작업
 항목을 한눈에 확인하세요.`,
      },
      assignee: {
        title: `작업 항목에 담당자를 추가하여 담당자별
 작업 분석을 확인하세요.`,
      },
      label: {
        title: `작업 항목에 레이블을 추가하여 레이블별
 작업 분석을 확인하세요.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "CSV에서 구성원 가져오기",
      description: "다음 열이 포함된 CSV 업로드: Email, Display Name, First Name, Last Name, Role (5, 15 또는 20)",
      dropzone: {
        active: "CSV 파일을 여기에 놓으세요",
        inactive: "드래그 앤 드롭 또는 클릭하여 업로드",
        file_type: ".csv 파일만 지원됩니다",
      },
      buttons: {
        cancel: "취소",
        import: "가져오기",
        try_again: "다시 시도",
        close: "닫기",
        done: "완료",
      },
      progress: {
        uploading: "업로드 중...",
        importing: "가져오는 중...",
      },
      summary: {
        title: {
          failed: "가져오기 실패",
          complete: "가져오기 완료",
        },
        message: {
          seat_limit: "시트 제한으로 인해 구성원을 가져올 수 없습니다.",
          success: "{count}명의 구성원을 워크스페이스에 추가했습니다.",
          no_imports: "CSV 파일에서 구성원을 가져오지 못했습니다.",
        },
        stats: {
          successful: "성공",
          failed: "실패",
        },
        download_errors: "오류 다운로드",
      },
      toast: {
        invalid_file: {
          title: "잘못된 파일",
          message: "CSV 파일만 지원됩니다.",
        },
        import_failed: {
          title: "가져오기 실패",
          message: "문제가 발생했습니다.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "CSV에서 구성원 가져오기",
      description:
        "다음 열이 포함된 CSV 업로드: 이메일 및 역할(5=게스트, 15=멤버, 20=관리자). 사용자는 이미 워크스페이스 멤버여야 합니다.",
      download_sample: "샘플 CSV 다운로드",
      dropzone: {
        active: "CSV 파일을 여기에 놓으세요",
        inactive: "드래그 앤 드롭 또는 클릭하여 업로드",
        file_type: ".csv 파일만 지원됩니다",
      },
      buttons: {
        cancel: "취소",
        import: "가져오기",
        try_again: "다시 시도",
        close: "닫기",
        done: "완료",
      },
      progress: {
        uploading: "업로드 중...",
        importing: "가져오는 중...",
      },
      summary: {
        title: {
          complete: "가져오기 완료",
        },
        message: {
          success: "프로젝트에 {count}명의 구성원을 가져왔습니다.",
          no_imports: "CSV 파일에서 새 구성원을 가져오지 못했습니다.",
        },
        stats: {
          added: "추가됨",
          reactivated: "다시 활성화됨",
          already_members: "이미 멤버",
          skipped: "건너뜀",
        },
        download_errors: "건너뛴 세부 정보 다운로드",
      },
      toast: {
        invalid_file: {
          title: "잘못된 파일",
          message: "CSV 파일만 지원됩니다.",
        },
        import_failed: {
          title: "가져오기 실패",
          message: "문제가 발생했습니다.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "작업 항목을 아카이브할 수 없습니다",
        message: "완료됨 또는 취소됨 상태 그룹에 속한 작업 항목만 아카이브할 수 있습니다.",
      },
      invalid_issue_start_date: {
        title: "작업 항목을 업데이트할 수 없습니다",
        message: "선택한 시작 날짜가 일부 작업 항목의 마감일을 초과합니다. 시작 날짜가 마감일 이전인지 확인하세요.",
      },
      invalid_issue_target_date: {
        title: "작업 항목을 업데이트할 수 없습니다",
        message: "선택한 마감일이 일부 작업 항목의 시작 날짜보다 앞섭니다. 마감일이 시작 날짜 이후인지 확인하세요.",
      },
      invalid_state_transition: {
        title: "작업 항목을 업데이트할 수 없습니다",
        message: "일부 작업 항목에 대해 상태 변경이 허용되지 않습니다. 상태 변경이 허용되는지 확인하세요.",
      },
    },
  },
  work_item_types: {
    label: "워크 아이템 타입",
    label_lowercase: "워크 아이템 타입",
    settings: {
      title: "워크 아이템 타입",
      properties: {
        title: "커스텀 프로퍼티",
        tooltip:
          "각 워크 아이템 타입에는 제목, 설명, 담당자, 상태, 우선순위, 시작 날짜, 마감일, 모듈, 사이클 등과 같은 기본 프로퍼티 세트가 함께 제공됩니다. 팀의 요구에 맞게 자신만의 프로퍼티를 사용자 정의하고 추가할 수도 있습니다.",
        add_button: "새 프로퍼티 추가",
        dropdown: {
          label: "프로퍼티 타입",
          placeholder: "타입 선택",
        },
        property_type: {
          text: {
            label: "텍스트",
          },
          number: {
            label: "넘버",
          },
          dropdown: {
            label: "드롭다운",
          },
          boolean: {
            label: "불리언",
          },
          date: {
            label: "데이트",
          },
          member_picker: {
            label: "멤버 피커",
          },
          release_picker: {
            label: "릴리스 선택기",
          },
          formula: {
            label: "수식",
          },
        },
        attributes: {
          label: "어트리뷰트",
          text: {
            single_line: {
              label: "싱글 라인",
            },
            multi_line: {
              label: "패러그래프",
            },
            readonly: {
              label: "읽기 전용",
              header: "읽기 전용 데이터",
            },
            invalid_text_format: {
              label: "유효하지 않은 텍스트 포맷",
            },
          },
          number: {
            default: {
              placeholder: "넘버 추가",
            },
          },
          relation: {
            single_select: {
              label: "싱글 셀렉트",
            },
            multi_select: {
              label: "멀티 셀렉트",
            },
            no_default_value: {
              label: "기본값 없음",
            },
          },
          boolean: {
            label: "참 | 거짓",
            no_default: "기본값 없음",
          },
          option: {
            create_update: {
              label: "옵션",
              form: {
                placeholder: "옵션 추가",
                errors: {
                  name: {
                    required: "옵션 이름은 필수입니다.",
                    integrity: "동일한 이름의 옵션이 이미 존재합니다.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "옵션 선택",
                multi: {
                  default: "옵션 선택",
                  variable: "{count}개 옵션 선택됨",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "성공!",
              message: "프로퍼티 {name}이(가) 성공적으로 생성되었습니다.",
            },
            error: {
              title: "에러!",
              message: "프로퍼티 생성에 실패했습니다. 다시 시도해 주세요!",
            },
          },
          update: {
            success: {
              title: "성공!",
              message: "프로퍼티 {name}이(가) 성공적으로 업데이트되었습니다.",
            },
            error: {
              title: "에러!",
              message: "프로퍼티 업데이트에 실패했습니다. 다시 시도해 주세요!",
            },
          },
          delete: {
            success: {
              title: "성공!",
              message: "프로퍼티 {name}이(가) 성공적으로 삭제되었습니다.",
            },
            error: {
              title: "에러!",
              message: "프로퍼티 삭제에 실패했습니다. 다시 시도해 주세요!",
            },
          },
          enable_disable: {
            loading: "프로퍼티 {name} {action} 중",
            success: {
              title: "성공!",
              message: "프로퍼티 {name}이(가) 성공적으로 {action}되었습니다.",
            },
            error: {
              title: "에러!",
              message: "프로퍼티 {action}에 실패했습니다. 다시 시도해 주세요!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "타이틀",
            },
            description: {
              placeholder: "디스크립션",
            },
          },
          errors: {
            name: {
              required: "프로퍼티 이름을 지정해야 합니다.",
              max_length: "프로퍼티 이름은 255자를 초과할 수 없습니다.",
            },
            property_type: {
              required: "프로퍼티 타입을 선택해야 합니다.",
            },
            options: {
              required: "최소한 하나의 옵션을 추가해야 합니다.",
            },
            formula: {
              required: "수식 표현식이 필요합니다.",
              invalid: "잘못된 수식: {error}",
              circular_reference: "순환 참조가 감지되었습니다. 수식은 직접 또는 간접적으로 자신을 참조할 수 없습니다.",
              invalid_reference: "수식이 존재하지 않는 속성을 참조합니다.",
            },
          },
        },
        formula: {
          field_label: "수식 필드",
          tooltip: "'{'필드 이름'}' 구문을 사용하여 수식을 입력하세요. +, -, *, /, & 연산자를 지원합니다.",
          placeholder: "수식 작성",
          test_button: "테스트",
          validating: "검증 중",
          validation_success: "수식이 유효합니다! {resultType}을(를) 반환합니다",
          validation_success_with_refs: "수식이 유효합니다! {resultType}을(를) 반환합니다 ({count}개 필드 참조)",
          error: {
            empty: "수식을 입력해 주세요",
            missing_context: "워크스페이스, 프로젝트 또는 작업 항목 유형 컨텍스트가 없습니다",
            validation_failed: "검증 실패",
          },
          picker: {
            no_match: "일치하는 속성 없음",
            no_available: "사용 가능한 속성 없음",
          },
        },
        enable_disable: {
          label: "액티브",
          tooltip: {
            disabled: "클릭하여 비활성화",
            enabled: "클릭하여 활성화",
          },
        },
        delete_confirmation: {
          title: "이 프로퍼티 삭제",
          description: "프로퍼티 삭제는 기존 데이터 손실로 이어질 수 있습니다.",
          secondary_description: "대신 프로퍼티를 비활성화하시겠습니까?",
          primary_button: "{action}, 삭제하기",
          secondary_button: "네, 비활성화하기",
        },
        mandate_confirmation: {
          label: "필수 프로퍼티",
          content:
            "이 프로퍼티에 대한 기본 옵션이 있는 것 같습니다. 프로퍼티를 필수로 설정하면 기본값이 제거되고 사용자는 자신이 선택한 값을 추가해야 합니다.",
          tooltip: {
            disabled: "이 프로퍼티 타입은 필수로 설정할 수 없습니다",
            enabled: "선택 해제하여 필드를 선택 사항으로 표시",
            checked: "선택하여 필드를 필수로 표시",
          },
        },
        empty_state: {
          title: "커스텀 프로퍼티 추가",
          description: "이 워크 아이템 타입에 대해 추가하는 새 프로퍼티가 여기에 표시됩니다.",
        },
      },
      item_delete_confirmation: {
        title: "이 유형 삭제",
        description: "유형을 삭제하면 기존 데이터가 손실될 수 있습니다.",
        primary_button: "예, 삭제합니다",
        toast: {
          success: {
            title: "성공!",
            message: "작업 항목 유형이 성공적으로 삭제되었습니다.",
          },
          error: {
            title: "오류!",
            message: "작업 항목 유형 삭제에 실패했습니다. 다시 시도해 주세요!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "기본 작업 항목 유형은 삭제할 수 없습니다",
          cannot_delete_work_item_type_with_associated_work_items:
            "연결된 작업 항목이 있는 작업 항목 유형은 삭제할 수 없습니다",
        },
        can_disable_warning: "대신 유형을 비활성화하시겠습니까?",
      },
      cant_delete_default_message:
        "이 작업 항목 유형은 삭제할 수 없습니다. 이 프로젝트의 기본 작업 항목 유형으로 설정되어 있기 때문입니다.",
      set_as_default: "기본값으로 설정",
      cant_set_default_inactive_message: "기본값으로 설정하기 전에 이 유형을 활성화하세요",
      set_default_confirmation: {
        title: "기본 작업 항목 유형으로 설정",
        description:
          "{name}을(를) 기본값으로 설정하면 이 워크스페이스의 모든 프로젝트에 가져옵니다. 모든 새 작업 항목은 기본적으로 이 유형을 사용합니다.",
        confirm_button: "기본값으로 설정",
      },
    },
    create: {
      title: "워크 아이템 타입 생성",
      button: "워크 아이템 타입 추가",
      toast: {
        success: {
          title: "성공!",
          message: "워크 아이템 타입이 성공적으로 생성되었습니다.",
        },
        error: {
          title: "에러!",
          message: {
            conflict: "{name} 유형이 이미 존재합니다. 다른 이름을 선택하세요.",
          },
        },
      },
    },
    update: {
      title: "워크 아이템 타입 업데이트",
      button: "워크 아이템 타입 업데이트",
      toast: {
        success: {
          title: "성공!",
          message: "워크 아이템 타입 {name}이(가) 성공적으로 업데이트되었습니다.",
        },
        error: {
          title: "에러!",
          message: {
            conflict: "{name} 유형이 이미 존재합니다. 다른 이름을 선택하세요.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "이 워크 아이템 타입에 고유한 이름 지정",
        },
        description: {
          placeholder: "이 워크 아이템 타입의 용도와 사용 시기를 설명하세요.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "워크 아이템 타입 {name} {action} 중",
        success: {
          title: "성공!",
          message: "워크 아이템 타입 {name}이(가) 성공적으로 {action}되었습니다.",
        },
        error: {
          title: "에러!",
          message: "워크 아이템 타입 {action}에 실패했습니다. 다시 시도해 주세요!",
        },
      },
      tooltip: "클릭하여 {action}",
    },
    change_confirmation: {
      title: "워크 아이템 타입을 변경하시겠습니까?",
      description:
        "워크 아이템 타입을 변경하면 현재 타입에 특정한 사용자 정의 속성 값이 손실될 수 있습니다. 이 작업은 취소할 수 없습니다.",
      button: {
        loading: "변경 중",
        default: "타입 변경",
      },
    },
    empty_state: {
      enable: {
        title: "워크 아이템 타입 활성화",
        description:
          "워크 아이템 타입으로 작업 항목을 작업에 맞게 조정하세요. 아이콘, 배경 및 프로퍼티로 사용자 정의하고 이 프로젝트에 대해 구성하세요.",
        primary_button: {
          text: "활성화",
        },
        confirmation: {
          title: "활성화되면 워크 아이템 타입은 비활성화할 수 없습니다.",
          description:
            "플레인의 워크 아이템이 이 프로젝트의 기본 워크 아이템 타입이 되고 이 프로젝트에 아이콘과 배경과 함께 표시됩니다.",
          button: {
            default: "활성화",
            loading: "설정 중",
          },
        },
      },
      get_pro: {
        title: "워크 아이템 타입을 활성화하려면 프로로 업그레이드하세요.",
        description:
          "워크 아이템 타입으로 작업 항목을 작업에 맞게 조정하세요. 아이콘, 배경 및 프로퍼티로 사용자 정의하고 이 프로젝트에 대해 구성하세요.",
        primary_button: {
          text: "프로 구매",
        },
      },
      upgrade: {
        title: "워크 아이템 타입을 활성화하려면 업그레이드하세요.",
        description:
          "워크 아이템 타입으로 작업 항목을 작업에 맞게 조정하세요. 아이콘, 배경 및 프로퍼티로 사용자 정의하고 이 프로젝트에 대해 구성하세요.",
        primary_button: {
          text: "업그레이드",
        },
      },
    },
  },
  importers: {
    imports: "임포트",
    logo: "로고",
    import_message: "플레인 프로젝트로 {serviceName} 데이터를 임포트하세요.",
    deactivate: "비활성화",
    deactivating: "비활성화 중",
    migrating: "마이그레이팅 중",
    migrations: "마이그레이션",
    refreshing: "리프레싱 중",
    import: "임포트",
    serial_number: "시리얼 넘버",
    project: "프로젝트",
    workspace: "워크스페이스",
    status: "스테이터스",
    summary: "요약",
    total_batches: "전체 배치",
    imported_batches: "임포트된 배치",
    re_run: "재실행",
    cancel: "취소",
    start_time: "시작 시간",
    no_jobs_found: "작업을 찾을 수 없습니다",
    no_project_imports: "아직 {serviceName} 프로젝트를 임포트하지 않았습니다.",
    cancel_import_job: "임포트 작업 취소",
    cancel_import_job_confirmation:
      "이 임포트 작업을 취소하시겠습니까? 이 프로젝트에 대한 임포트 프로세스가 중지됩니다.",
    re_run_import_job: "임포트 작업 재실행",
    re_run_import_job_confirmation:
      "이 임포트 작업을 재실행하시겠습니까? 이 프로젝트에 대한 임포트 프로세스가 다시 시작됩니다.",
    upload_csv_file: "사용자 데이터를 임포트하려면 CSV 파일을 업로드하세요.",
    connect_importer: "{serviceName} 연결",
    migration_assistant: "마이그레이션 어시스턴트",
    migration_assistant_description:
      "강력한 어시스턴트로 {serviceName} 프로젝트를 플레인으로 원활하게 마이그레이션하세요.",
    token_helper: "다음에서 얻을 수 있습니다",
    personal_access_token: "퍼스널 액세스 토큰",
    source_token_expired: "토큰 만료됨",
    source_token_expired_description: "제공된 토큰이 만료되었습니다. 비활성화하고 새 자격 증명으로 다시 연결하세요.",
    user_email: "사용자 이메일",
    select_state: "스테이트 선택",
    select_service_project: "{serviceName} 프로젝트 선택",
    loading_service_projects: "{serviceName} 프로젝트 로딩 중",
    select_service_workspace: "{serviceName} 워크스페이스 선택",
    loading_service_workspaces: "{serviceName} 워크스페이스 로딩 중",
    select_priority: "프라이오리티 선택",
    select_service_team: "{serviceName} 팀 선택",
    add_seat_msg_free_trial:
      "등록되지 않은 사용자 {additionalUserCount}명을 임포트하려고 하는데 현재 플랜에서 사용 가능한 시트는 {currentWorkspaceSubscriptionAvailableSeats}개뿐입니다. 임포트를 계속하려면 지금 업그레이드하세요.",
    add_seat_msg_paid:
      "등록되지 않은 사용자 {additionalUserCount}명을 임포트하려고 하는데 현재 플랜에서 사용 가능한 시트는 {currentWorkspaceSubscriptionAvailableSeats}개뿐입니다. 임포트를 계속하려면 최소 {extraSeatRequired}개의 추가 시트를 구매하세요.",
    skip_user_import_title: "사용자 데이터 임포트 건너뛰기",
    skip_user_import_description:
      "사용자 임포트를 건너뛰면 {serviceName}의 작업 항목, 댓글 및 기타 데이터가 플레인에서 마이그레이션을 수행하는 사용자에 의해 생성됩니다. 나중에 수동으로 사용자를 추가할 수 있습니다.",
    invalid_pat: "유효하지 않은 퍼스널 액세스 토큰",
  },
  integrations: {
    integrations: "인테그레이션",
    loading: "로딩 중",
    unauthorized: "이 페이지를 볼 권한이 없습니다.",
    configure: "구성",
    not_enabled: "{name}은(는) 이 워크스페이스에 대해 활성화되지 않았습니다.",
    not_configured: "구성되지 않음",
    disconnect_personal_account: "개인 {providerName} 계정 연결 해제",
    not_configured_message_admin: "{name} 인테그레이션이 구성되지 않았습니다. 인스턴스 관리자에게 문의하여 구성하세요.",
    not_configured_message_support: "{name} 인테그레이션이 구성되지 않았습니다. 지원팀에 문의하여 구성하세요.",
    external_api_unreachable: "외부 API에 접근할 수 없습니다. 나중에 다시 시도하세요.",
    error_fetching_supported_integrations: "지원되는 인테그레이션을 가져올 수 없습니다. 나중에 다시 시도하세요.",
    back_to_integrations: "인테그레이션으로 돌아가기",
    select_state: "스테이트 선택",
    set_state: "스테이트 설정",
    choose_project: "프로젝트 선택...",
    skip_backward_state_movement: "PR 업데이트로 인해 이슈가 이전 상태로 이동하는 것을 방지",
  },
  github_integration: {
    name: "GitHub",
    description: "GitHub 작업 항목을 플레인과 연결하고 동기화하세요.",
    connect_org: "조직 연결",
    connect_org_description: "깃허브 조직을 플레인과 연결하세요.",
    processing: "처리 중",
    org_added_desc: "GitHub org 추가됨",
    connection_fetch_error: "서버에서 연결 세부 정보를 가져오는 중 오류 발생",
    personal_account_connected: "개인 계정 연결됨",
    personal_account_connected_description: "깃허브 계정이 이제 플레인에 연결되었습니다.",
    connect_personal_account: "개인 계정 연결",
    connect_personal_account_description: "깃허브 개인 계정을 플레인과 연결하세요.",
    repo_mapping: "레포지토리 매핑",
    repo_mapping_description: "깃허브 레포지토리를 플레인 프로젝트에 매핑하세요.",
    project_issue_sync: "프로젝트 이슈 동기화",
    project_issue_sync_description: "깃허브에서 플레인 프로젝트로 이슈 동기화하세요.",
    project_issue_sync_empty_state: "매핑된 프로젝트 이슈 동기화가 여기에 나타납니다",
    configure_project_issue_sync_state: "이슈 동기화 상태 구성",
    select_issue_sync_direction: "이슈 동기화 방향 선택",
    allow_bidirectional_sync: "양방향 - GitHub와 플레인 양방향으로 이슈와 코멘트 동기화",
    allow_unidirectional_sync: "단방향 - GitHub에서 플레인으로 이슈와 코멘트 동기화",
    allow_unidirectional_sync_warning:
      "GitHub Issue의 데이터가 연결된 Plane 작업 항목의 데이터를 대체합니다 (GitHub → Plane만)",
    remove_project_issue_sync: "프로젝트 이슈 동기화 제거",
    remove_project_issue_sync_confirmation: "프로젝트 이슈 동기화를 제거하시겠습니까?",
    add_pr_state_mapping: "플레인 프로젝트에 대한 풀 리퀘스트 상태 매핑 추가",
    edit_pr_state_mapping: "플레인 프로젝트에 대한 풀 리퀘스트 상태 매핑 편집",
    pr_state_mapping: "풀 리퀘스트 상태 매핑",
    pr_state_mapping_description: "깃허브 풀 리퀘스트 상태를 플레인 프로젝트에 매핑하세요.",
    pr_state_mapping_empty_state: "매핑된 PR 상태가 여기에 나타납니다",
    remove_pr_state_mapping: "풀 리퀘스트 상태 매핑 제거",
    remove_pr_state_mapping_confirmation: "풀 리퀘스트 상태 매핑을 제거하시겠습니까?",
    issue_sync_message: "작업 항목이 {project}에 동기화되었습니다.",
    link: "깃허브 레포지토리를 플레인 프로젝트에 연결",
    pull_request_automation: "풀 리퀘스트 자동화",
    pull_request_automation_description: "깃허브에서 플레인 프로젝트로 풀 리퀘스트 상태 매핑 구성",
    DRAFT_MR_OPENED: "드래프트 MR 열림 시, 스테이트를 다음으로 설정",
    MR_OPENED: "MR 열림 시, 스테이트를 다음으로 설정",
    MR_READY_FOR_MERGE: "MR 병합 준비 완료 시, 스테이트를 다음으로 설정",
    MR_REVIEW_REQUESTED: "MR 리뷰 요청 시, 스테이트를 다음으로 설정",
    MR_MERGED: "MR 병합 시, 스테이트를 다음으로 설정",
    MR_CLOSED: "MR 닫힘 시, 스테이트를 다음으로 설정",
    ISSUE_OPEN: "이슈 열림",
    ISSUE_CLOSED: "이슈 닫힘",
    save: "저장",
    start_sync: "동기화 시작",
    choose_repository: "레포지토리 선택...",
  },
  gitlab_integration: {
    name: "깃랩",
    description: "깃랩 머지 리퀘스트를 플레인과 연결하고 동기화하세요.",
    connection_fetch_error: "서버에서 연결 세부 정보를 가져오는 중 오류 발생",
    connect_org: "조직 연결",
    connect_org_description: "깃랩 조직을 플레인과 연결하세요.",
    project_connections: "깃랩 프로젝트 연결",
    project_connections_description: "깃랩에서 플레인 프로젝트로 머지 리퀘스트 동기화.",
    plane_project_connection: "플레인 프로젝트 연결",
    plane_project_connection_description: "깃랩에서 플레인 프로젝트로 풀 리퀘스트 스테이트 매핑 구성",
    remove_connection: "연결 제거",
    remove_connection_confirmation: "이 연결을 제거하시겠습니까?",
    link: "깃랩 레포지토리를 플레인 프로젝트에 연결",
    pull_request_automation: "풀 리퀘스트 자동화",
    pull_request_automation_description: "깃랩에서 플레인으로 풀 리퀘스트 스테이트 매핑 구성",
    DRAFT_MR_OPENED: "드래프트 MR 열림 시, 스테이트를 다음으로 설정",
    MR_OPENED: "MR 열림 시, 스테이트를 다음으로 설정",
    MR_REVIEW_REQUESTED: "MR 리뷰 요청 시, 스테이트를 다음으로 설정",
    MR_READY_FOR_MERGE: "MR 병합 준비 완료 시, 스테이트를 다음으로 설정",
    MR_MERGED: "MR 병합 시, 스테이트를 다음으로 설정",
    MR_CLOSED: "MR 닫힘 시, 스테이트를 다음으로 설정",
    integration_enabled_text: "깃랩 인테그레이션이 활성화되면 작업 항목 워크플로우를 자동화할 수 있습니다",
    choose_entity: "엔티티 선택",
    choose_project: "프로젝트 선택",
    link_plane_project: "플레인 프로젝트 연결",
    project_issue_sync: "프로젝트 이슈 동기화",
    project_issue_sync_description: "Gitlab에서 Plane 프로젝트로 이슈를 동기화하세요",
    project_issue_sync_empty_state: "매핑된 프로젝트 이슈 동기화가 여기에 표시됩니다",
    configure_project_issue_sync_state: "이슈 동기화 상태 구성",
    select_issue_sync_direction: "이슈 동기화 방향 선택",
    allow_bidirectional_sync: "양방향 - Gitlab과 Plane 간에 이슈와 댓글을 양방향으로 동기화",
    allow_unidirectional_sync: "단방향 - Gitlab에서 Plane으로만 이슈와 댓글을 동기화",
    allow_unidirectional_sync_warning:
      "Gitlab Issue의 데이터가 연결된 Plane 작업 항목의 데이터를 대체합니다 (Gitlab → Plane만)",
    remove_project_issue_sync: "이 프로젝트 이슈 동기화 제거",
    remove_project_issue_sync_confirmation: "이 프로젝트 이슈 동기화를 제거하시겠습니까?",
    ISSUE_OPEN: "이슈 열림",
    ISSUE_CLOSED: "이슈 닫힘",
    save: "저장",
    start_sync: "동기화 시작",
    choose_repository: "레포지토리 선택...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Gitlab Enterprise 인스턴스를 Plane과 연결하고 동기화합니다.",
    app_form_title: "Gitlab Enterprise 구성",
    app_form_description: "Gitlab Enterprise를 Plane에 연결하도록 구성합니다.",
    base_url_title: "Base URL",
    base_url_description: "Gitlab Enterprise 인스턴스의 base URL입니다.",
    base_url_placeholder: '예: "https://glab.plane.town"',
    base_url_error: "Base URL은 필수입니다",
    invalid_base_url_error: "유효하지 않은 base URL",
    client_id_title: "앱 ID",
    client_id_description: "Gitlab Enterprise 인스턴스에서 생성한 앱의 ID입니다.",
    client_id_placeholder: '예: "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "앱 ID는 필수입니다",
    client_secret_title: "클라이언트 시크릿",
    client_secret_description: "Gitlab Enterprise 인스턴스에서 생성한 앱의 클라이언트 시크릿입니다.",
    client_secret_placeholder: '예: "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "클라이언트 시크릿은 필수입니다",
    webhook_secret_title: "Webhook 시크릿",
    webhook_secret_description:
      "Gitlab Enterprise 인스턴스에서 webhook을 검증하는 데 사용될 랜덤 webhook 시크릿입니다.",
    webhook_secret_placeholder: '예: "webhook1234567890"',
    webhook_secret_error: "Webhook 시크릿은 필수입니다",
    connect_app: "앱 연결",
  },
  slack_integration: {
    name: "슬랙",
    description: "슬랙 워크스페이스를 플레인과 연결하세요.",
    connect_personal_account: "개인 슬랙 계정을 플레인과 연결하세요.",
    personal_account_connected: "귀하의 개인 {providerName} 계정이 이제 플레인에 연결되었습니다.",
    link_personal_account: "개인 {providerName} 계정을 플레인에 연결하세요.",
    connected_slack_workspaces: "연결된 슬랙 워크스페이스",
    connected_on: "{date}에 연결됨",
    disconnect_workspace: "{name} 워크스페이스 연결 해제",
    alerts: {
      dm_alerts: {
        title: "중요한 업데이트, 리마인더, 알림을 슬랙 다이렉트 메시지로 받아보세요.",
      },
    },
    project_updates: {
      title: "프로젝트 업데이트",
      description: "프로젝트의 업데이트 알림을 구성하세요",
      add_new_project_update: "새 프로젝트 업데이트 알림 추가",
      project_updates_empty_state: "슬랙 채널과 연결된 프로젝트가 여기에 표시됩니다.",
      project_updates_form: {
        title: "프로젝트 업데이트 구성",
        description: "작업 항목이 생성될 때 슬랙에서 프로젝트 업데이트 알림 받기",
        failed_to_load_channels: "슬랙에서 채널을 로드하지 못했습니다",
        project_dropdown: {
          placeholder: "프로젝트 선택",
          label: "플레인 프로젝트",
          no_projects: "사용 가능한 프로젝트가 없습니다",
        },
        channel_dropdown: {
          label: "슬랙 채널",
          placeholder: "채널 선택",
          no_channels: "사용 가능한 채널이 없습니다",
        },
        all_projects_connected: "모든 프로젝트가 이미 슬랙 채널에 연결되어 있습니다.",
        all_channels_connected: "모든 슬랙 채널이 이미 프로젝트에 연결되어 있습니다.",
        project_connection_success: "프로젝트 연결이 성공적으로 생성되었습니다",
        project_connection_updated: "프로젝트 연결이 성공적으로 업데이트되었습니다",
        project_connection_deleted: "프로젝트 연결이 성공적으로 삭제되었습니다",
        failed_delete_project_connection: "프로젝트 연결 삭제에 실패했습니다",
        failed_create_project_connection: "프로젝트 연결 생성에 실패했습니다",
        failed_upserting_project_connection: "프로젝트 연결 업데이트에 실패했습니다",
        failed_loading_project_connections:
          "프로젝트 연결을 로드할 수 없습니다. 네트워크 문제나 통합 문제 때문일 수 있습니다.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Sentry 작업 공간을 Plane에 연결하세요.",
    connected_sentry_workspaces: "연결된 Sentry 작업 공간",
    connected_on: "{date}에 연결됨",
    disconnect_workspace: "{name} 작업 공간 연결 해제",
    state_mapping: {
      title: "상태 매핑",
      description:
        "Sentry 인시던트 상태를 프로젝트 상태에 매핑하세요. Sentry 인시던트가 해결되거나 미해결일 때 사용할 상태를 구성하세요.",
      add_new_state_mapping: "새 상태 매핑 추가",
      empty_state:
        "상태 매핑이 구성되지 않았습니다. Sentry 인시던트 상태를 프로젝트 상태와 동기화하기 위한 첫 번째 매핑을 만드세요.",
      failed_loading_state_mappings:
        "상태 매핑을 로드할 수 없었습니다. 네트워크 문제 또는 통합 문제로 인한 것일 수 있습니다.",
      loading_project_states: "프로젝트 상태 로딩 중...",
      error_loading_states: "상태 로딩 오류",
      no_states_available: "사용 가능한 상태가 없습니다",
      no_permission_states: "이 프로젝트의 상태에 액세스할 권한이 없습니다",
      states_not_found: "프로젝트 상태를 찾을 수 없습니다",
      server_error_states: "상태 로딩 중 서버 오류",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "API 접근을 위해 외부 IdP 토큰을 검증합니다.",
    header_description: "IdP(Azure AD, Okta 등)에서 발급된 OIDC/JWT 토큰을 Plane API 접근용으로 검증합니다.",
    connected: "연결됨",
    connect: "연결",
    uninstall: "제거",
    uninstalling: "제거 중...",
    install_success: "OAuth Bridge가 성공적으로 설치되었습니다.",
    install_error: "OAuth Bridge 설치에 실패했습니다.",
    uninstall_success: "OAuth Bridge가 제거되었습니다.",
    uninstall_error: "OAuth Bridge 제거에 실패했습니다.",
    token_providers: "토큰 공급자",
    token_providers_description: "JWT가 API 자격 증명으로 허용되는 외부 IdP를 구성합니다.",
    add_provider: "공급자 추가",
    edit_provider: "공급자 편집",
    enabled: "활성화됨",
    disabled: "비활성화됨",
    test: "테스트",
    no_providers_title: "구성된 공급자가 없습니다.",
    no_providers_description: "외부 토큰 인증을 활성화하려면 IdP를 추가하세요.",
    provider_updated: "공급자가 업데이트되었습니다.",
    provider_added: "공급자가 추가되었습니다.",
    provider_save_error: "공급자 저장에 실패했습니다.",
    provider_deleted: "공급자가 삭제되었습니다.",
    provider_delete_error: "공급자 삭제에 실패했습니다.",
    provider_update_error: "공급자 업데이트에 실패했습니다.",
    jwks_reachable: "JWKS 접근 가능",
    jwks_unreachable: "JWKS 접근 불가",
    jwks_test_error: "구성된 URL에서 JWKS를 가져올 수 없습니다.",
    provider_form: {
      name_label: "이름",
      name_placeholder: "예: Azure AD Production",
      name_description: "이 ID 공급자의 표시 이름",
      name_required: "이름은 필수입니다.",
      issuer_label: "발급자",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "JWT에서 예상되는 iss 클레임 값",
      issuer_required: "발급자는 필수입니다.",
      jwks_url_label: "JWKS URL",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "공급자의 JSON Web Key Set을 제공하는 HTTPS 엔드포인트",
      jwks_url_required: "JWKS URL은 필수입니다.",
      jwks_url_https: "JWKS URL은 HTTPS를 사용해야 합니다.",
      audience_label: "대상",
      audience_placeholder: "api://my-app-id",
      audience_description: "JWT에서 예상되는 aud 클레임(쉼표로 구분).",
      user_claim_label: "사용자 클레임",
      user_claim_placeholder: "email",
      user_claim_description: "사용자의 이메일 주소가 포함된 JWT 클레임",
      user_claim_required: "사용자 클레임은 필수입니다.",
      allowed_algorithms_label: "허용된 서명 알고리즘",
      allowed_algorithms_description: "JWT 서명 검증에 사용되는 비대칭 알고리즘",
      allowed_algorithms_required: "최소 하나의 알고리즘이 필요합니다.",
      select_algorithms: "알고리즘 선택",
      jwks_cache_ttl_label: "JWKS 캐시 TTL(초)",
      jwks_cache_ttl_description: "공급자의 JWKS 키를 캐시하는 기간(최소 60초, 기본 24시간)",
      jwks_cache_ttl_min: "캐시 TTL은 최소 60초 이상이어야 합니다.",
      rate_limit_label: "속도 제한",
      rate_limit_placeholder: "120/minute",
      rate_limit_description: "요청 제한(예: 120/minute). 기본 속도 제한을 사용하려면 비워두세요.",
      enable_provider: "이 공급자 활성화",
      saving: "저장 중...",
      update: "업데이트",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "깃허브 엔터프라이즈 조직을 플레인과 연결하고 동기화하세요.",
    app_form_title: "깃허브 엔터프라이즈 설정",
    app_form_description: "깃허브 엔터프라이즈를 플레인과 연결하세요.",
    app_id_title: "앱 ID",
    app_id_description: "깃허브 엔터프라이즈 조직에서 생성한 앱의 ID입니다.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID는 필수입니다",
    app_name_title: "App Slug",
    app_name_description: "깃허브 엔터프라이즈 조직에서 생성한 앱의 Slug입니다.",
    app_name_error: "App slug는 필수입니다",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "Base URL",
    base_url_description: "깃허브 엔터프라이즈 조직의 Base URL입니다.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "Base URL는 필수입니다",
    invalid_base_url_error: "Base URL이 유효하지 않습니다",
    client_id_title: "Client ID",
    client_id_description: "깃허브 엔터프라이즈 조직에서 생성한 앱의 Client ID입니다.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "Client ID는 필수입니다",
    client_secret_title: "Client Secret",
    client_secret_description: "깃허브 엔터프라이즈 조직에서 생성한 앱의 Client Secret입니다.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Client Secret는 필수입니다",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "깃허브 엔터프라이즈 조직에서 생성한 앱의 Webhook Secret입니다.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Webhook Secret는 필수입니다",
    private_key_title: "Private Key (Base64 encoded)",
    private_key_description: "깃허브 엔터프라이즈 조직에서 생성한 앱의 Private Key입니다.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Private Key는 필수입니다",
    connect_app: "앱 연결",
  },
  file_upload: {
    upload_text: "파일을 업로드하려면 여기를 클릭하세요",
    drag_drop_text: "드래그 앤 드롭",
    processing: "처리 중",
    invalid: "유효하지 않은 파일 타입",
    missing_fields: "필드 누락",
    success: "{fileName} 업로드 완료!",
  },
  silo_errors: {
    invalid_query_params: "제공된 쿼리 파라미터가 유효하지 않거나 필수 필드가 누락되었습니다",
    invalid_installation_account: "제공된 인스톨레이션 계정이 유효하지 않습니다",
    generic_error: "요청을 처리하는 동안 예상치 못한 오류가 발생했습니다",
    connection_not_found: "요청한 연결을 찾을 수 없습니다",
    multiple_connections_found: "하나만 예상했을 때 여러 연결이 발견되었습니다",
    installation_not_found: "요청한 인스톨레이션을 찾을 수 없습니다",
    user_not_found: "요청한 사용자를 찾을 수 없습니다",
    error_fetching_token: "인증 토큰 가져오기에 실패했습니다",
    invalid_app_credentials: "제공된 앱 자격 증명이 유효하지 않습니다",
    invalid_app_installation_id: "앱 설치에 실패했습니다",
  },
  import_status: {
    queued: "대기 중",
    created: "생성됨",
    initiated: "시작됨",
    pulling: "풀링 중",
    timed_out: "시간 초과",
    pulled: "풀링 완료",
    transforming: "변환 중",
    transformed: "변환 완료",
    pushing: "푸싱 중",
    finished: "완료됨",
    error: "오류",
    cancelled: "취소됨",
  },
  jira_importer: {
    jira_importer_description: "지라 데이터를 플레인 프로젝트로 임포트하세요.",
    create_project_automatically: "프로젝트 자동 생성",
    create_project_automatically_description: "지라 프로젝트 세부 정보를 기반으로 새 프로젝트를 생성합니다.",
    import_to_existing_project: "기존 프로젝트로 가져오기",
    import_to_existing_project_description: "아래 드롭다운 메뉴에서 기존 프로젝트를 선택하세요.",
    state_mapping_automatic_creation: "모든 지라 상태가 플레인에서 자동으로 생성됩니다.",
    personal_access_token: "퍼스널 액세스 토큰",
    user_email: "사용자 이메일",
    atlassian_security_settings: "아틀라시안 보안 설정",
    email_description: "이것은 퍼스널 액세스 토큰에 연결된 이메일입니다",
    jira_domain: "지라 도메인",
    jira_domain_description: "이것은 지라 인스턴스의 도메인입니다",
    steps: {
      title_configure_plane: "플레인 구성",
      description_configure_plane:
        "지라 데이터를 마이그레이션할 플레인 프로젝트를 먼저 생성하세요. 프로젝트가 생성되면 여기에서 선택하세요.",
      title_configure_jira: "지라 구성",
      description_configure_jira: "데이터를 마이그레이션하려는 지라 워크스페이스를 선택하세요.",
      title_import_users: "사용자 임포트",
      description_import_users:
        "지라에서 플레인으로 마이그레이션하려는 사용자를 추가하세요. 또는 이 단계를 건너뛰고 나중에 수동으로 사용자를 추가할 수 있습니다.",
      title_map_states: "스테이트 매핑",
      description_map_states:
        "저희는 최선을 다해 지라 상태를 플레인 스테이트에 자동으로 매칭했습니다. 진행하기 전에 남은 스테이트를 매핑하세요. 스테이트를 생성하고 수동으로 매핑할 수도 있습니다.",
      title_map_priorities: "프라이오리티 매핑",
      description_map_priorities:
        "저희는 최선을 다해 프라이오리티를 자동으로 매칭했습니다. 진행하기 전에 남은 프라이오리티를 매핑하세요.",
      title_summary: "요약",
      description_summary: "지라에서 플레인으로 마이그레이션될 데이터의 요약입니다.",
      custom_jql_filter: "사용자 지정 JQL 필터",
      jql_filter_description: "JQL을 사용하여 가져올 특정 이슈를 필터링합니다.",
      project_code: "프로젝트",
      enter_filters_placeholder: "필터 입력 (예: status = 'In Progress')",
      validating_query: "쿼리 확인 중...",
      validation_successful_work_items_selected: "확인 성공, {count} 개의 작업 항목 선택됨.",
      run_syntax_check: "구문 검사를 실행하여 쿼리 확인",
      refresh: "새로 고침",
      check_syntax: "구문 확인",
      no_work_items_selected: "쿼리에 의해 선택된 작업 항목이 없습니다.",
      validation_error_default: "쿼리를 확인하는 동안 문제가 발생했습니다.",
    },
  },
  asana_importer: {
    asana_importer_description: "아사나 데이터를 플레인 프로젝트로 임포트하세요.",
    select_asana_priority_field: "아사나 프라이오리티 필드 선택",
    steps: {
      title_configure_plane: "플레인 구성",
      description_configure_plane:
        "아사나 데이터를 마이그레이션할 플레인 프로젝트를 먼저 생성하세요. 프로젝트가 생성되면 여기에서 선택하세요.",
      title_configure_asana: "아사나 구성",
      description_configure_asana: "데이터를 마이그레이션하려는 아사나 워크스페이스와 프로젝트를 선택하세요.",
      title_map_states: "스테이트 매핑",
      description_map_states: "플레인 프로젝트 상태에 매핑하려는 아사나 스테이트를 선택하세요.",
      title_map_priorities: "프라이오리티 매핑",
      description_map_priorities: "플레인 프로젝트 프라이오리티에 매핑하려는 아사나 프라이오리티를 선택하세요.",
      title_summary: "요약",
      description_summary: "아사나에서 플레인으로 마이그레이션될 데이터의 요약입니다.",
    },
  },
  linear_importer: {
    linear_importer_description: "리니어 데이터를 플레인 프로젝트로 임포트하세요.",
    steps: {
      title_configure_plane: "플레인 구성",
      description_configure_plane:
        "리니어 데이터를 마이그레이션할 플레인 프로젝트를 먼저 생성하세요. 프로젝트가 생성되면 여기에서 선택하세요.",
      title_configure_linear: "리니어 구성",
      description_configure_linear: "데이터를 마이그레이션하려는 리니어 팀을 선택하세요.",
      title_map_states: "스테이트 매핑",
      description_map_states:
        "저희는 최선을 다해 리니어 상태를 플레인 스테이트에 자동으로 매칭했습니다. 진행하기 전에 남은 스테이트를 매핑하세요. 스테이트를 생성하고 수동으로 매핑할 수도 있습니다.",
      title_map_priorities: "프라이오리티 매핑",
      description_map_priorities: "플레인 프로젝트 프라이오리티에 매핑하려는 리니어 프라이오리티를 선택하세요.",
      title_summary: "요약",
      description_summary: "리니어에서 플레인으로 마이그레이션될 데이터의 요약입니다.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "지라 서버 데이터를 플레인 프로젝트로 임포트하세요.",
    steps: {
      title_configure_plane: "플레인 구성",
      description_configure_plane:
        "지라 데이터를 마이그레이션할 플레인 프로젝트를 먼저 생성하세요. 프로젝트가 생성되면 여기에서 선택하세요.",
      title_configure_jira: "지라 구성",
      description_configure_jira: "데이터를 마이그레이션하려는 지라 워크스페이스를 선택하세요.",
      title_map_states: "스테이트 매핑",
      description_map_states: "플레인 프로젝트 상태에 매핑하려는 지라 스테이트를 선택하세요.",
      title_map_priorities: "프라이오리티 매핑",
      description_map_priorities: "플레인 프로젝트 프라이오리티에 매핑하려는 지라 프라이오리티를 선택하세요.",
      title_summary: "요약",
      description_summary: "지라에서 플레인으로 마이그레이션될 데이터의 요약입니다.",
    },
    import_epics: {
      title: "에픽을 작업 항목으로 가져오기",
      description: "이 옵션을 활성화하면 에픽이 에픽 작업 항목 유형을 가진 작업 항목으로 가져와집니다.",
    },
  },
  notion_importer: {
    notion_importer_description: "Notion 데이터를 Plane 프로젝트로 가져옵니다.",
    steps: {
      title_upload_zip: "Notion 내보낸 ZIP 업로드",
      description_upload_zip: "Notion 데이터가 포함된 ZIP 파일을 업로드해 주세요.",
    },
    upload: {
      drop_file_here: "Notion zip 파일을 여기에 드롭하세요",
      upload_title: "Notion 내보내기 업로드",
      upload_from_url: "URL에서 가져오기",
      upload_from_url_description: "계속하려면 ZIP 내보내기의 공개 URL을 붙여넣으세요.",
      drag_drop_description: "Notion 내보내기 zip 파일을 드래그 앤 드롭하거나 클릭해서 찾아보기",
      file_type_restriction: "Notion에서 내보낸 .zip 파일만 지원됩니다",
      select_file: "파일 선택",
      uploading: "업로드 중...",
      preparing_upload: "업로드 준비 중...",
      confirming_upload: "업로드 확인 중...",
      confirming: "확인 중...",
      upload_complete: "업로드 완료",
      upload_failed: "업로드 실패",
      start_import: "가져오기 시작",
      retry_upload: "업로드 재시도",
      upload: "업로드",
      ready: "준비완료",
      error: "오류",
      upload_complete_message: "업로드 완료!",
      upload_complete_description: '"가져오기 시작"을 클릭하여 Notion 데이터 처리를 시작하세요.',
      upload_progress_message: "이 창을 닫지 마세요.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Confluence 데이터를 Plane 위키로 가져옵니다.",
    steps: {
      title_upload_zip: "Confluence 내보낸 ZIP 업로드",
      description_upload_zip: "Confluence 데이터가 포함된 ZIP 파일을 업로드해 주세요.",
    },
    upload: {
      drop_file_here: "Confluence zip 파일을 여기에 드롭하세요",
      upload_title: "Confluence 내보내기 업로드",
      upload_from_url: "URL에서 가져오기",
      upload_from_url_description: "계속하려면 ZIP 내보내기의 공개 URL을 붙여넣으세요.",
      drag_drop_description: "Confluence 내보내기 zip 파일을 드래그 앤 드롭하거나 클릭해서 찾아보기",
      file_type_restriction: "Confluence에서 내보낸 .zip 파일만 지원됩니다",
      select_file: "파일 선택",
      uploading: "업로드 중...",
      preparing_upload: "업로드 준비 중...",
      confirming_upload: "업로드 확인 중...",
      confirming: "확인 중...",
      upload_complete: "업로드 완료",
      upload_failed: "업로드 실패",
      start_import: "가져오기 시작",
      retry_upload: "업로드 재시도",
      upload: "업로드",
      ready: "준비완료",
      error: "오류",
      upload_complete_message: "업로드 완료!",
      upload_complete_description: '"가져오기 시작"을 클릭하여 Confluence 데이터 처리를 시작하세요.',
      upload_progress_message: "이 창을 닫지 마세요.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "CSV 데이터를 플레인 프로젝트로 임포트하세요.",
    steps: {
      title_configure_plane: "플레인 구성",
      description_configure_plane:
        "CSV 데이터를 마이그레이션할 플레인 프로젝트를 먼저 생성하세요. 프로젝트가 생성되면 여기에서 선택하세요.",
      title_configure_csv: "CSV 구성",
      description_configure_csv: "CSV 파일을 업로드하고 플레인 필드에 매핑할 필드를 구성하세요.",
    },
  },
  csv_importer: {
    csv_importer_description: "CSV 파일에서 Plane 프로젝트로 작업 항목을 가져옵니다.",
    steps: {
      title_select_project: "프로젝트 선택",
      description_select_project: "작업 항목을 가져올 Plane 프로젝트를 선택하십시오.",
      title_upload_csv: "CSV 업로드",
      description_upload_csv:
        "작업 항목이 포함된 CSV 파일을 업로드하십시오. 파일에는 이름, 설명, 우선 순위, 날짜 및 상태 그룹에 대한 열이 포함되어야 합니다.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "클릭업 데이터를 플레인 프로젝트로 임포트하세요.",
    select_service_space: "{serviceName} 스페이스 선택",
    select_service_folder: "{serviceName} 폴더 선택",
    selected: "선택됨",
    users: "사용자",
    steps: {
      title_configure_plane: "플레인 구성",
      description_configure_plane:
        "클릭업 데이터를 마이그레이션할 플레인 프로젝트를 먼저 생성하세요. 프로젝트가 생성되면 여기에서 선택하세요.",
      title_configure_clickup: "클릭업 구성",
      description_configure_clickup: "데이터를 마이그레이션하려는 클릭업 팀, 스페이스 및 폴더를 선택하세요.",
      title_map_states: "스테이트 매핑",
      description_map_states:
        "저희는 최선을 다해 클릭업 상태를 플레인 스테이트에 자동으로 매칭했습니다. 진행하기 전에 남은 스테이트를 매핑하세요. 스테이트를 생성하고 수동으로 매핑할 수도 있습니다.",
      title_map_priorities: "프라이오리티 매핑",
      description_map_priorities: "플레인 프로젝트 프라이오리티에 매핑하려는 클릭업 프라이오리티를 선택하세요.",
      title_summary: "요약",
      description_summary: "클릭업에서 플레인으로 마이그레이션될 데이터의 요약입니다.",
      pull_additional_data_title: "코멘트와 첨부파일 임포트",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "바",
          long_label: "바 차트",
          chart_models: {
            basic: "베이직",
            stacked: "스택드",
            grouped: "그룹드",
          },
          orientation: {
            label: "오리엔테이션",
            horizontal: "호리젠탈",
            vertical: "버티컬",
            placeholder: "오리엔테이션 추가",
          },
          bar_color: "바 컬러",
        },
        line_chart: {
          short_label: "라인",
          long_label: "라인 차트",
          chart_models: {
            basic: "베이직",
            multi_line: "멀티 라인",
          },
          line_color: "라인 컬러",
          line_type: {
            label: "라인 타입",
            solid: "솔리드",
            dashed: "대시드",
            placeholder: "라인 타입 추가",
          },
        },
        area_chart: {
          short_label: "에어리어",
          long_label: "에어리어 차트",
          chart_models: {
            basic: "베이직",
            stacked: "스택드",
            comparison: "컴패리슨",
          },
          fill_color: "필 컬러",
        },
        donut_chart: {
          short_label: "도넛",
          long_label: "도넛 차트",
          chart_models: {
            basic: "베이직",
            progress: "프로그레스",
          },
          center_value: "센터 밸류",
          completed_color: "컴플리티드 컬러",
        },
        pie_chart: {
          short_label: "파이",
          long_label: "파이 차트",
          chart_models: {
            basic: "베이직",
          },
          group: {
            label: "그룹드 피시스",
            group_thin_pieces: "그룹 씬 피시스",
            minimum_threshold: {
              label: "미니멈 스레숄드",
              placeholder: "스레숄드 추가",
            },
            name_group: {
              label: "네임 그룹",
              placeholder: '"5% 미만"',
            },
          },
          show_values: "밸류 표시",
          value_type: {
            percentage: "퍼센티지",
            count: "카운트",
          },
        },
        text: {
          short_label: "텍스트",
          long_label: "텍스트",
          alignment: {
            label: "텍스트 얼라인먼트",
            left: "레프트",
            center: "센터",
            right: "라이트",
            placeholder: "텍스트 얼라인먼트 추가",
          },
          text_color: "텍스트 컬러",
        },
        table_chart: {
          short_label: "테이블",
          long_label: "테이블 차트",
          chart_models: {
            basic: {
              short_label: "기본",
              long_label: "테이블",
            },
          },
          columns: "열",
          rows: "행",
          rows_placeholder: "행 추가",
          configure_rows_hint: "이 테이블을 보려면 행에 대한 속성을 선택하세요.",
        },
      },
      color_palettes: {
        modern: "모던",
        horizon: "호라이즌",
        earthen: "어슨",
      },
      common: {
        add_widget: "위젯 추가",
        widget_title: {
          label: "이 위젯의 이름 지정",
          placeholder: '예: "어제의 할 일", "모두 완료"',
        },
        chart_type: "차트 타입",
        visualization_type: {
          label: "비주얼라이제이션 타입",
          placeholder: "비주얼라이제이션 타입 추가",
        },
        date_group: {
          label: "데이트 그룹",
          placeholder: "데이트 그룹 추가",
        },
        group_by: "그룹 바이",
        stack_by: "스택 바이",
        daily: "데일리",
        weekly: "위클리",
        monthly: "먼슬리",
        yearly: "이얼리",
        work_item_count: "워크 아이템 카운트",
        estimate_point: "에스티메이트 포인트",
        pending_work_item: "펜딩 워크 아이템",
        completed_work_item: "컴플리티드 워크 아이템",
        in_progress_work_item: "인 프로그레스 워크 아이템",
        blocked_work_item: "블럭드 워크 아이템",
        work_item_due_this_week: "이번 주 마감 워크 아이템",
        work_item_due_today: "오늘 마감 워크 아이템",
        color_scheme: {
          label: "컬러 스킴",
          placeholder: "컬러 스킴 추가",
        },
        smoothing: "스무딩",
        markers: "마커",
        legends: "레전드",
        tooltips: "툴팁",
        opacity: {
          label: "오패시티",
          placeholder: "오패시티 추가",
        },
        border: "보더",
        widget_configuration: "위젯 컨피규레이션",
        configure_widget: "위젯 컨피규어",
        guides: "가이드",
        style: "스타일",
        area_appearance: "에어리어 어피어런스",
        comparison_line_appearance: "컴패어-라인 어피어런스",
        add_property: "프로퍼티 추가",
        add_metric: "메트릭 추가",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
          stacked: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
            group_by: "스택 바이에 값이 없습니다.",
          },
          grouped: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
            group_by: "그룹 바이에 값이 없습니다.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
          multi_line: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
            group_by: "그룹 바이에 값이 없습니다.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
          stacked: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
            group_by: "스택 바이에 값이 없습니다.",
          },
          comparison: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
          progress: {
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "X축에 값이 없습니다.",
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "메트릭에 값이 없습니다.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "열에 값이 없습니다.",
            group_by: "행에 값이 없습니다.",
          },
        },
        ask_admin: "이 위젯을 구성하려면 관리자에게 문의하세요.",
      },
    },
    create_modal: {
      heading: {
        create: "새 대시보드 생성",
        update: "대시보드 업데이트",
      },
      title: {
        label: "대시보드 이름을 지정하세요.",
        placeholder: '"프로젝트 간 캐퍼시티", "팀별 워크로드", "모든 프로젝트의 스테이트"',
        required_error: "타이틀은 필수입니다",
      },
      project: {
        label: "프로젝트 선택",
        placeholder: "이 프로젝트들의 데이터가 이 대시보드를 지원합니다.",
        required_error: "프로젝트는 필수입니다",
      },
      filters_label: "위 데이터 소스에 대한 필터 설정",
      create_dashboard: "대시보드 생성",
      update_dashboard: "대시보드 업데이트",
    },
    delete_modal: {
      heading: "대시보드 삭제",
    },
    empty_state: {
      feature_flag: {
        title: "온디맨드, 영구 대시보드로 진행 상황을 표시하세요.",
        description:
          "필요한 대시보드를 구축하고 데이터가 표시되는 방식을 사용자 지정하여 진행 상황을 완벽하게 표현하세요.",
        coming_soon_to_mobile: "모바일 앱에 곧 출시 예정",
        card_1: {
          title: "모든 프로젝트용",
          description:
            "모든 프로젝트가 있는 워크스페이스의 전체 뷰를 얻거나 작업 데이터를 분할하여 진행 상황을 완벽하게 볼 수 있습니다.",
        },
        card_2: {
          title: "플레인의 모든 데이터용",
          description:
            "기본 제공되는 애널리틱스와 미리 만들어진 사이클 차트를 넘어 팀, 이니셔티브 또는 다른 어떤 것도 전에 없던 방식으로 볼 수 있습니다.",
        },
        card_3: {
          title: "모든 데이터 시각화 요구 사항을 위해",
          description:
            "세밀한 제어 기능이 있는 다양한 사용자 정의 가능한 차트 중에서 선택하여 작업 데이터를 원하는 대로 정확하게 보고 표시할 수 있습니다.",
        },
        card_4: {
          title: "온디맨드 및 영구적",
          description:
            "한 번 구축하고 데이터 자동 새로 고침, 범위 변경을 위한 컨텍스트 플래그 및 공유 가능한 퍼머링크로 영원히 유지하세요.",
        },
        card_5: {
          title: "익스포트 및 예약된 커뮤니케이션",
          description:
            "링크가 작동하지 않을 때를 위해 대시보드를 일회성 PDF로 내보내거나 스테이크홀더에게 자동으로 전송되도록 예약하세요.",
        },
        card_6: {
          title: "모든 디바이스에 맞게 자동 레이아웃",
          description:
            "원하는 레이아웃에 맞게 위젯 크기를 조정하고 모바일, 태블릿 및 기타 브라우저에서 정확히 동일하게 볼 수 있습니다.",
        },
      },
      dashboards_list: {
        title: "위젯에서 데이터를 시각화하고, 위젯으로 대시보드를 구축하고, 최신 정보를 온디맨드로 확인하세요.",
        description:
          "지정한 범위에서 데이터를 표시하는 커스텀 위젯으로 대시보드를 구축하세요. 프로젝트와 팀 전반의 모든 작업에 대한 대시보드를 얻고 온디맨드 추적을 위해 스테이크홀더와 퍼머링크를 공유하세요.",
      },
      dashboards_search: {
        title: "대시보드 이름과 일치하지 않습니다.",
        description: "쿼리가 올바른지 확인하거나 다른 쿼리를 시도하세요.",
      },
      widgets_list: {
        title: "원하는 방식으로 데이터를 시각화하세요.",
        description: `라인, 바, 파이 및 기타 포맷을 사용하여 지정한 소스에서
원하는 방식으로 데이터를 볼 수 있습니다.`,
      },
      widget_data: {
        title: "볼 수 있는 것이 없습니다",
        description: "새로 고침하거나 데이터를 추가하여 여기에서 확인하세요.",
      },
    },
    common: {
      editing: "편집 중",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "새 워크 아이템 허용",
      work_item_creation_disable_tooltip: "이 스테이트에서는 워크 아이템 생성이 비활성화되어 있습니다",
      default_state: "기본 스테이트는 모든 멤버가 새 워크 아이템을 생성할 수 있도록 합니다. 이는 변경할 수 없습니다",
      state_change_count: "{count, plural, one {1개의 허용된 스테이트 변경} other {{count}개의 허용된 스테이트 변경}}",
      movers_count: "{count, plural, one {1명의 리스트된 리뷰어} other {{count}명의 리스트된 리뷰어}}",
      state_changes: {
        label: {
          default: "허용된 스테이트 변경 추가",
          loading: "허용된 스테이트 변경 추가 중",
        },
        move_to: "스테이트 변경",
        movers: {
          label: "리뷰 담당자",
          tooltip: "리뷰어는 워크 아이템을 한 스테이트에서 다른 스테이트로 이동할 수 있는 권한이 있는 사람입니다.",
          add: "리뷰어 추가",
        },
      },
    },
    workflow_disabled: {
      title: "이 워크 아이템을 여기로 이동할 수 없습니다.",
    },
    workflow_enabled: {
      label: "스테이트 변경",
    },
    workflow_tree: {
      label: "다음에 있는 워크 아이템의 경우",
      state_change_label: "다음으로 이동할 수 있습니다",
    },
    empty_state: {
      upgrade: {
        title: "워크플로우로 변경 및 리뷰의 혼란을 제어하세요.",
        description: "플레인의 워크플로우로 작업이 이동하는 위치, 누가, 언제 이동하는지에 대한 규칙을 설정하세요.",
      },
    },
    quick_actions: {
      view_change_history: "변경 내역 보기",
      reset_workflow: "워크플로우 리셋",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "이 워크플로우를 리셋하시겠습니까?",
        description:
          "이 워크플로우를 리셋하면 모든 스테이트 변경 규칙이 삭제되며 이 프로젝트에서 실행하려면 다시 생성해야 합니다.",
      },
      delete_state_change: {
        title: "이 스테이트 변경 규칙을 삭제하시겠습니까?",
        description: "삭제하면 이 변경을 취소할 수 없으며 이 프로젝트에서 실행하려면 규칙을 다시 설정해야 합니다.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "워크플로우 {action} 중",
        success: {
          title: "성공",
          message: "워크플로우가 성공적으로 {action}되었습니다",
        },
        error: {
          title: "오류",
          message: "워크플로우를 {action}할 수 없습니다. 다시 시도하세요.",
        },
      },
      reset: {
        success: {
          title: "성공",
          message: "워크플로우가 성공적으로 리셋되었습니다",
        },
        error: {
          title: "워크플로우 리셋 오류",
          message: "워크플로우를 리셋할 수 없습니다. 다시 시도하세요.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "스테이트 변경 규칙 추가 오류",
          message: "스테이트 변경 규칙을 추가할 수 없습니다. 다시 시도하세요.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "스테이트 변경 규칙 수정 오류",
          message: "스테이트 변경 규칙을 수정할 수 없습니다. 다시 시도하세요.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "스테이트 변경 규칙 제거 오류",
          message: "스테이트 변경 규칙을 제거할 수 없습니다. 다시 시도하세요.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "스테이트 변경 규칙 리뷰어 수정 오류",
          message: "스테이트 변경 규칙 리뷰어를 수정할 수 없습니다. 다시 시도하세요.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {커스터머} other {커스터머}}",
    open: "커스터머 열기",
    dropdown: {
      placeholder: "커스터머 선택",
      required: "커스터머를 선택하세요",
      no_selection: "커스터머 없음",
    },
    upgrade: {
      title: "커스터머로 작업을 우선순위화하고 관리하세요.",
      description: "작업을 커스터머에 매핑하고 커스터머 속성에 따라 우선순위를 지정하세요.",
    },
    properties: {
      default: {
        title: "디폴트 프로퍼티",
        customer_name: {
          name: "커스터머 이름",
          placeholder: "개인 또는 비즈니스의 이름일 수 있습니다",
          validation: {
            required: "커스터머 이름이 필요합니다.",
            max_length: "커스터머 이름은 255자를 초과할 수 없습니다.",
          },
        },
        description: {
          name: "디스크립션",
          validation: {},
        },
        email: {
          name: "이메일",
          placeholder: "이메일 입력",
          validation: {
            required: "이메일이 필요합니다.",
            pattern: "유효하지 않은 이메일 주소입니다.",
          },
        },
        website_url: {
          name: "웹사이트",
          placeholder: "https://로 시작하는 모든 URL이 작동합니다.",
          placeholder_short: "웹사이트 추가",
          validation: {
            pattern: "유효하지 않은 웹사이트 URL입니다",
          },
        },
        employees: {
          name: "임플로이즈",
          placeholder: "커스터머가 비즈니스인 경우 직원 수입니다.",
          validation: {
            min_length: "임플로이즈는 0보다 작을 수 없습니다.",
            max_length: "임플로이즈는 2147483647을 초과할 수 없습니다.",
          },
        },
        size: {
          name: "사이즈",
          placeholder: "회사 사이즈 추가",
          validation: {
            min_length: "유효하지 않은 사이즈입니다",
          },
        },
        domain: {
          name: "인더스트리",
          placeholder: "리테일, 이커머스, 핀테크, 뱅킹",
          placeholder_short: "인더스트리 추가",
          validation: {},
        },
        stage: {
          name: "스테이지",
          placeholder: "스테이지 선택",
          validation: {},
        },
        contract_status: {
          name: "컨트랙트 스테이터스",
          placeholder: "컨트랙트 스테이터스 선택",
          validation: {},
        },
        revenue: {
          name: "레베뉴",
          placeholder: "이것은 고객이 연간 창출하는 수익입니다.",
          validation: {
            min_length: "레베뉴는 0보다 작을 수 없습니다.",
            max_length: "레베뉴는 2147483647을 초과할 수 없습니다.",
          },
        },
        invalid_value: "유효하지 않은 프로퍼티 값입니다.",
      },
      custom: {
        title: "커스텀 프로퍼티",
        info: "워크 아이템이나 커스터머 레코드를 더 잘 관리할 수 있도록 플레인에 커스터머의 고유한 속성을 추가하세요.",
      },
      empty_state: {
        title: "아직 커스텀 프로퍼티가 없습니다.",
        description:
          "워크 아이템, 플레인의 다른 곳 또는 CRM이나 다른 툴과 같은 플레인 외부에서 보고 싶은 커스텀 프로퍼티는 추가할 때 여기에 표시됩니다.",
      },
      add: {
        primary_button: "새로운 프로퍼티 추가",
      },
    },
    stage: {
      lead: "리드",
      sales_qualified_lead: "세일즈 퀄리파이드 리드",
      contract_negotiation: "컨트랙트 네고시에이션",
      closed_won: "클로즈드 원",
      closed_lost: "클로즈드 로스트",
    },
    contract_status: {
      active: "액티브",
      pre_contract: "프리-컨트랙트",
      signed: "사인드",
      inactive: "인액티브",
    },
    empty_state: {
      detail: {
        title: "해당 커스터머 레코드를 찾을 수 없습니다.",
        description: "이 레코드의 링크가 잘못되었거나 레코드가 삭제되었을 수 있습니다.",
        primary_button: "커스터머로 이동",
        secondary_button: "커스터머 추가",
      },
      search: {
        title: "해당 용어와 일치하는 커스터머 레코드가 없는 것 같습니다.",
        description: "다른 검색어로 시도하거나, 그 용어에 대한 결과가 표시되어야 한다고 확신한다면 문의하세요.",
      },
      list: {
        title: "커스터머에게 중요한 것에 따라 작업의 볼륨, 케이던스 및 플로우를 관리하세요.",
        description:
          "플레인 전용 기능인 커스터머를 사용하면 이제 처음부터 새 커스터머를 만들고 작업에 연결할 수 있습니다. 곧 다른 툴에서 중요한 커스텀 속성과 함께 가져올 수 있습니다.",
        primary_button: "첫 번째 커스터머 추가",
      },
    },
    settings: {
      unauthorized: "이 페이지에 접근할 권한이 없습니다.",
      description: "워크플로우에서 커스터머 관계를 추적하고 관리하세요.",
      enable: "커스터머 활성화",
      toasts: {
        enable: {
          loading: "커스터머 기능 활성화 중...",
          success: {
            title: "이 워크스페이스에서 커스터머를 켰습니다.",
            message: "다시 끌 수 없습니다.",
          },
          error: {
            title: "이번에는 커스터머를 켤 수 없습니다.",
            message: "다시 시도하거나 나중에 이 화면으로 돌아오세요. 그래도 작동하지 않으면",
            action: "지원팀에 문의",
          },
        },
        disable: {
          loading: "커스터머 기능 비활성화 중...",
          success: {
            title: "커스터머 비활성화됨",
            message: "커스터머 기능이 성공적으로 비활성화되었습니다!",
          },
          error: {
            title: "에러",
            message: "커스터머 기능을 비활성화하지 못했습니다!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "커스터머 목록을 가져올 수 없습니다.",
          message: "다시 시도하거나 이 페이지를 새로고침하세요.",
        },
      },
      copy_link: {
        title: "이 커스터머에 대한 직접 링크를 복사했습니다.",
        message: "어디에나 붙여넣으면 바로 여기로 연결됩니다.",
      },
      create: {
        success: {
          title: "{customer_name}을(를) 이제 사용할 수 있습니다",
          message: "이 커스터머를 워크 아이템에서 참조하고 요청을 추적할 수도 있습니다.",
          actions: {
            view: "보기",
            copy_link: "링크 복사",
            copied: "복사됨!",
          },
        },
        error: {
          title: "이번에는 그 레코드를 생성할 수 없습니다.",
          message: "다시 저장하거나 저장되지 않은 텍스트를 새 항목에 복사하세요. 가급적 다른 탭에서 하세요.",
        },
      },
      update: {
        success: {
          title: "성공!",
          message: "커스터머를 성공적으로 업데이트했습니다!",
        },
        error: {
          title: "에러!",
          message: "커스터머를 업데이트할 수 없습니다. 다시 시도하세요!",
        },
      },
      logo: {
        error: {
          title: "커스터머의 로고를 업로드할 수 없습니다.",
          message: "로고를 다시 저장하거나 처음부터 시작하세요.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "이 커스터머의 레코드에서 워크 아이템을 제거했습니다.",
            message: "워크 아이템에서도 이 커스터머를 자동으로 제거했습니다.",
          },
          error: {
            title: "에러!",
            message: "이 커스터머의 레코드에서 그 워크 아이템을 제거할 수 없습니다.",
          },
        },
        add: {
          error: {
            title: "이번에는 이 커스터머 레코드에 워크 아이템을 추가할 수 없습니다.",
            message: "그 워크 아이템을 다시 추가하거나 나중에 돌아오세요. 계속 작동하지 않으면 문의하세요.",
          },
          success: {
            title: "이 커스터머의 레코드에 워크 아이템을 추가했습니다.",
            message: "워크 아이템에도 이 커스터머를 자동으로 추가했습니다.",
          },
        },
      },
    },
    quick_actions: {
      edit: "편집",
      copy_link: "커스터머 링크 복사",
      delete: "삭제",
    },
    create: {
      label: "커스터머 레코드 생성",
      loading: "생성 중",
      cancel: "취소",
    },
    update: {
      label: "커스터머 업데이트",
      loading: "업데이팅 중",
    },
    delete: {
      title: "커스터머 레코드 {customer_name}을(를) 삭제하시겠습니까?",
      description: "이 레코드와 관련된 모든 데이터가 영구적으로 삭제됩니다. 나중에 이 레코드를 복원할 수 없습니다.",
    },
    requests: {
      empty_state: {
        list: {
          title: "아직 표시할 리퀘스트가 없습니다.",
          description: "커스터머의 리퀘스트를 생성하여 워크 아이템에 연결할 수 있습니다.",
          button: "새 리퀘스트 추가",
        },
        search: {
          title: "해당 용어와 일치하는 리퀘스트가 없는 것 같습니다.",
          description: "다른 검색어로 시도하거나, 그 용어에 대한 결과가 표시되어야 한다고 확신한다면 문의하세요.",
        },
      },
      label: "{count, plural, one {리퀘스트} other {리퀘스트}}",
      add: "리퀘스트 추가",
      create: "리퀘스트 생성",
      update: "리퀘스트 업데이트",
      form: {
        name: {
          placeholder: "이 리퀘스트의 이름을 지정하세요",
          validation: {
            required: "이름이 필요합니다.",
            max_length: "리퀘스트 이름은 255자를 초과할 수 없습니다.",
          },
        },
        description: {
          placeholder: "리퀘스트의 성격을 설명하거나 다른 툴에서 이 커스터머의 댓글을 붙여넣으세요.",
        },
        source: {
          add: "소스 추가",
          update: "소스 업데이트",
          url: {
            label: "URL",
            required: "URL이 필요합니다",
            invalid: "유효하지 않은 웹사이트 URL입니다",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "링크 복사됨",
          message: "커스터머 리퀘스트 링크가 클립보드에 복사되었습니다.",
        },
        attachment: {
          upload: {
            loading: "첨부 파일 업로드 중...",
            success: {
              title: "첨부 파일 업로드됨",
              message: "첨부 파일이 성공적으로 업로드되었습니다.",
            },
            error: {
              title: "첨부 파일이 업로드되지 않음",
              message: "첨부 파일을 업로드할 수 없습니다.",
            },
          },
          size: {
            error: {
              title: "에러!",
              message: "한 번에 하나의 파일만 업로드할 수 있습니다.",
            },
          },
          length: {
            message: "파일 크기는 {size}MB 이하여야 합니다",
          },
          remove: {
            success: {
              title: "첨부 파일 제거됨",
              message: "첨부 파일이 성공적으로 제거되었습니다",
            },
            error: {
              title: "첨부 파일이 제거되지 않음",
              message: "첨부 파일을 제거할 수 없습니다",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "성공!",
              message: "소스가 성공적으로 업데이트되었습니다!",
            },
            error: {
              title: "에러!",
              message: "소스를 업데이트할 수 없습니다.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "에러!",
              message: "리퀘스트에 워크 아이템을 추가할 수 없습니다. 다시 시도하세요.",
            },
            success: {
              title: "성공!",
              message: "리퀘스트에 워크 아이템을 추가했습니다.",
            },
          },
        },
        update: {
          success: {
            message: "리퀘스트가 성공적으로 업데이트되었습니다!",
            title: "성공!",
          },
          error: {
            title: "에러!",
            message: "리퀘스트를 업데이트할 수 없습니다. 다시 시도하세요!",
          },
        },
        create: {
          success: {
            message: "리퀘스트가 성공적으로 생성되었습니다!",
            title: "성공!",
          },
          error: {
            title: "에러!",
            message: "리퀘스트를 생성할 수 없습니다. 다시 시도하세요!",
          },
        },
      },
    },
    linked_work_items: {
      label: "링크된 워크 아이템",
      link: "워크 아이템 링크",
      empty_state: {
        list: {
          title: "아직 이 커스터머에 링크된 워크 아이템이 없는 것 같습니다.",
          description: "여기에 모든 프로젝트의 기존 워크 아이템을 링크하여 이 커스터머별로 추적할 수 있습니다.",
          button: "워크 아이템 링크",
        },
      },
      action: {
        remove_epic: "에픽 제거",
        remove: "워크 아이템 제거",
      },
    },
    sidebar: {
      properties: "프로퍼티",
    },
  },
  templates: {
    settings: {
      title: "템플릿",
      description:
        "템플릿을 사용하면 프로젝트, 워크 아이템 및 페이지를 만드는 데 소요되는 시간의 80%를 절약할 수 있습니다.",
      options: {
        project: {
          label: "프로젝트 템플릿",
        },
        work_item: {
          label: "워크 아이템 템플릿",
        },
        page: {
          label: "페이지 템플릿",
        },
      },
      create_template: {
        label: "템플릿 생성",
        no_permission: {
          project: "템플릿을 생성하려면 프로젝트 관리자에게 문의하세요",
          workspace: "템플릿을 생성하려면 워크스페이스 관리자에게 문의하세요",
        },
      },
      use_template: {
        button: {
          default: "템플릿 사용",
          loading: "사용 중",
        },
      },
      template_source: {
        workspace: {
          info: "워크스페이스에서 파생됨",
        },
        project: {
          info: "프로젝트에서 파생됨",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "프로젝트 템플릿의 이름을 지정하세요.",
              validation: {
                required: "템플릿 이름이 필요합니다",
                maxLength: "템플릿 이름은 255자 미만이어야 합니다",
              },
            },
            description: {
              placeholder: "이 템플릿을 언제 어떻게 사용할지 설명하세요.",
            },
          },
          name: {
            placeholder: "프로젝트의 이름을 지정하세요.",
            validation: {
              required: "프로젝트 타이틀이 필요합니다",
              maxLength: "프로젝트 타이틀은 255자 미만이어야 합니다",
            },
          },
          description: {
            placeholder: "이 프로젝트의 목적과 목표를 설명하세요.",
          },
          button: {
            create: "프로젝트 템플릿 생성",
            update: "프로젝트 템플릿 업데이트",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "워크 아이템 템플릿의 이름을 지정하세요.",
              validation: {
                required: "템플릿 이름이 필요합니다",
                maxLength: "템플릿 이름은 255자 미만이어야 합니다",
              },
            },
            description: {
              placeholder: "이 템플릿을 언제 어떻게 사용할지 설명하세요.",
            },
          },
          name: {
            placeholder: "이 워크 아이템에 타이틀을 지정하세요.",
            validation: {
              required: "워크 아이템 타이틀이 필요합니다",
              maxLength: "워크 아이템 타이틀은 255자 미만이어야 합니다",
            },
          },
          description: {
            placeholder: "이 작업을 완료했을 때 무엇을 달성할 것인지 명확하게 이 워크 아이템을 설명하세요.",
          },
          button: {
            create: "워크 아이템 템플릿 생성",
            update: "워크 아이템 템플릿 업데이트",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "페이지 템플릿의 이름을 지정하세요.",
              validation: {
                required: "템플릿 이름이 필요합니다",
                maxLength: "템플릿 이름은 255자 미만이어야 합니다",
              },
            },
            description: {
              placeholder: "이 템플릿을 언제 어떻게 사용할지 설명하세요.",
            },
          },
          name: {
            placeholder: "제목 없음",
            validation: {
              maxLength: "페이지 이름은 255자 미만이어야 합니다",
            },
          },
          button: {
            create: "페이지 템플릿 생성",
            update: "페이지 템플릿 업데이트",
          },
        },
        publish: {
          action: "{isPublished, select, true {게시 설정} other {마켓플레이스에 게시}}",
          unpublish_action: "마켓플레이스에서 제거",
          title: "템플릿을 발견 가능하고 인식 가능하게 만드세요.",
          name: {
            label: "템플릿 이름",
            placeholder: "템플릿 이름을 지정하세요",
            validation: {
              required: "템플릿 이름이 필요합니다",
              maxLength: "템플릿 이름은 255자 미만이어야 합니다",
            },
          },
          short_description: {
            label: "짧은 설명",
            placeholder: "이 템플릿은 동시에 여러 프로젝트를 관리하는 프로젝트 관리자에게 적합합니다.",
            validation: {
              required: "짧은 설명이 필요합니다",
            },
          },
          description: {
            label: "설명",
            placeholder: `음성-텍스트 변환 기능으로 생산성을 향상시키고 커뮤니케이션을 효율화하세요.
• 실시간 음성 변환: 말한 내용을 즉시 정확한 텍스트로 변환합니다.
• 작업 및 댓글 생성: 음성 명령으로 작업, 설명, 댓글을 추가할 수 있습니다.`,
            validation: {
              required: "설명이 필요합니다",
            },
          },
          category: {
            label: "카테고리",
            placeholder: "이 템플릿이 가장 적합한 위치를 선택하세요. 여러 개를 선택할 수 있습니다.",
            validation: {
              required: "최소 하나의 카테고리가 필요합니다",
            },
          },
          keywords: {
            label: "키워드",
            placeholder: "이 템플릿을 찾을 때 사용자가 검색할 것으로 생각하는 용어를 사용하세요.",
            helperText: "쉼표로 구분된 키워드를 입력하여 사람들이 이를 검색에서 찾을 수 있도록 도와주세요.",
            validation: {
              required: "최소 하나의 키워드가 필요합니다",
            },
          },
          company_name: {
            label: "회사 이름",
            placeholder: "Plane",
            validation: {
              required: "회사 이름이 필요합니다",
              maxLength: "회사 이름은 255자 미만이어야 합니다",
            },
          },
          contact_email: {
            label: "지원 이메일",
            placeholder: "help@plane.so",
            validation: {
              invalid: "유효하지 않은 이메일 주소",
              required: "지원 이메일이 필요합니다",
              maxLength: "지원 이메일은 255자 미만이어야 합니다",
            },
          },
          privacy_policy_url: {
            label: "개인정보 처리 방침 링크",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "유효하지 않은 URL",
              maxLength: "URL은 800자 미만이어야 합니다",
            },
          },
          terms_of_service_url: {
            label: "이용 약관 링크",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "유효하지 않은 URL",
              maxLength: "URL은 800자 미만이어야 합니다",
            },
          },
          cover_image: {
            label: "마켓플레이스에 표시될 커버 이미지 추가",
            upload_title: "커버 이미지 업로드",
            upload_placeholder: "클릭하여 업로드하거나 드래그 앤 드롭으로 커버 이미지 업로드",
            drop_here: "여기에 놓기",
            click_to_upload: "클릭하여 업로드",
            invalid_file_or_exceeds_size_limit:
              "유효하지 않은 파일이거나 크기 제한을 초과했습니다. 다시 시도해 주세요.",
            upload_and_save: "업로드 및 저장",
            uploading: "업로드 중",
            remove: "제거",
            removing: "제거 중",
            validation: {
              required: "커버 이미지가 필요합니다",
            },
          },
          attach_screenshots: {
            label: "이 템플릿의 뷰어에게 도움이 될 것으로 생각되는 문서와 사진을 포함하세요.",
            validation: {
              required: "최소 하나의 스크린샷이 필요합니다",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "템플릿",
        description:
          "플레인의 프로젝트, 워크 아이템 및 페이지 템플릿을 사용하면 처음부터 프로젝트를 만들거나 워크 아이템 속성을 수동으로 설정할 필요가 없습니다.",
        sub_description: "템플릿을 사용하면 관리 시간의 80%를 절약할 수 있습니다.",
      },
      no_templates: {
        button: "첫 번째 템플릿 생성",
      },
      no_labels: {
        description:
          " 아직 라벨이 없습니다. 프로젝트의 워크 아이템을 구성하고 필터링하는 데 도움이 되는 라벨을 만드세요.",
      },
      no_work_items: {
        description: "아직 워크 아이템이 없습니다. 하나를 추가하여 작업을 더 잘 구성하세요.",
      },
      no_sub_work_items: {
        description: "아직 서브 워크 아이템이 없습니다. 하나를 추가하여 작업을 더 잘 구성하세요.",
      },
      page: {
        no_templates: {
          title: "액세스할 수 있는 템플릿이 없습니다.",
          description: "템플릿을 생성해 주세요",
        },
        no_results: {
          title: "템플릿과 일치하지 않습니다.",
          description: "다른 용어로 검색해 보세요.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "템플릿 생성됨",
          message: "{templateType} 템플릿인 {templateName}이(가) 이제 워크스페이스에서 사용 가능합니다.",
        },
        error: {
          title: "이번에는 템플릿을 생성할 수 없습니다.",
          message: "세부 정보를 다시 저장하거나 가급적 다른 탭에서 새 템플릿으로 복사하세요.",
        },
      },
      update: {
        success: {
          title: "템플릿 변경됨",
          message: "{templateType} 템플릿인 {templateName}이(가) 변경되었습니다.",
        },
        error: {
          title: "이 템플릿에 대한 변경 사항을 저장할 수 없습니다.",
          message: "세부 정보를 다시 저장하거나 나중에 이 템플릿으로 돌아오세요. 여전히 문제가 있으면 문의하세요.",
        },
      },
      delete: {
        success: {
          title: "템플릿 삭제됨",
          message: "{templateType} 템플릿인 {templateName}이(가) 이제 워크스페이스에서 삭제되었습니다.",
        },
        error: {
          title: "이 템플릿을 삭제할 수 없습니다.",
          message: "다시 삭제하거나 나중에 돌아오세요. 그때도 삭제할 수 없으면 문의하세요.",
        },
      },
      unpublish: {
        success: {
          title: "템플릿 제거됨",
          message: "{templateType} 템플릿인 {templateName}이(가) 제거되었습니다.",
        },
        error: {
          title: "이 템플릿을 제거할 수 없습니다.",
          message: "다시 제거하거나 나중에 돌아오세요. 그때도 제거할 수 없으면 문의하세요.",
        },
      },
    },
    delete_confirmation: {
      title: "템플릿 삭제",
      description: {
        prefix: "템플릿-",
        suffix:
          "을(를) 삭제하시겠습니까? 템플릿과 관련된 모든 데이터가 영구적으로 제거됩니다. 이 작업은 취소할 수 없습니다.",
      },
    },
    unpublish_confirmation: {
      title: "템플릿 제거",
      description: {
        prefix: "템플릿-",
        suffix: "을(를) 제거하시겠습니까? 이 템플릿은 마켓플레이스에서 사용자가 더 이상 사용할 수 없습니다.",
      },
    },
    dropdown: {
      add: {
        work_item: "새 템플릿 추가",
        project: "새 템플릿 추가",
      },
      label: {
        project: "프로젝트 템플릿 선택",
        page: "템플릿에서 선택",
      },
      tooltip: {
        work_item: "작업 항목 템플릿 선택",
      },
      no_results: {
        work_item: "템플릿을 찾을 수 없습니다.",
        project: "템플릿을 찾을 수 없습니다.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "작업 항목 만들기",
      "sub-title": "팀에 어떤 작업을 원하는지 알려주세요.",
      name: "이름",
      email: "이메일",
      about: "이 작업 항목은 무엇에 관한 것인가요?",
      description: "무슨 일이 일어나야 하는지 설명하세요",
      description_placeholder: "팀이 상황과 요구 사항을 파악할 수 있도록 필요한 만큼 자세히 작성해 주세요.",
      loading: "만드는 중",
      create_work_item: "작업 항목 만들기",
      errors: {
        name: "이름은 필수입니다",
        name_max_length: "이름은 255자 미만이어야 합니다",
        email: "이메일은 필수입니다",
        email_invalid: "유효하지 않은 이메일 주소입니다",
        title: "제목은 필수입니다",
        title_max_length: "제목은 255자 미만이어야 합니다",
      },
    },
    success: {
      title: "작업 항목이 팀 대기열에 추가되었습니다.",
      description: "팀에서 이 작업 항목을 인테이크 대기열에서 승인하거나 삭제할 수 있습니다.",
      primary_button: {
        text: "다른 작업 항목 추가",
      },
      secondary_button: {
        text: "인테이크 자세히 알아보기",
      },
    },
    how_it_works: {
      title: "작동 방식",
      heading: "인테이크 양식입니다.",
      description:
        "인테이크는 프로젝트 관리자와 매니저가 외부의 작업 항목을 프로젝트로 가져올 수 있는 Plane 기능입니다.",
      steps: {
        step_1: "이 간단한 양식으로 Plane 프로젝트에 새 작업 항목을 만들 수 있습니다.",
        step_2: "이 양식을 제출하면 해당 프로젝트의 인테이크에 새 작업 항목이 생성됩니다.",
        step_3: "해당 프로젝트 또는 팀의 누군가가 검토합니다.",
        step_4: "승인되면 이 작업 항목은 프로젝트의 작업 대기열로 이동합니다. 그렇지 않으면 거부됩니다.",
        step_5:
          "해당 작업 항목의 상태를 확인하려면 프로젝트 매니저, 관리자 또는 이 페이지 링크를 보낸 분에게 연락하세요.",
      },
    },
    type_forms: {
      select_types: {
        title: "작업 항목 유형 선택",
        search_placeholder: "작업 항목 유형 검색",
      },
      actions: {
        select_properties: "속성 선택",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "반복 작업 항목",
      description: "반복 작업을 한 번 설정하고, 반복을 관리해 드립니다. 시간이 되면 여기에 모두 표시됩니다.",
      new_recurring_work_item: "새 반복 작업 항목",
      update_recurring_work_item: "반복 작업 항목 수정",
      form: {
        interval: {
          title: "일정",
          start_date: {
            validation: {
              required: "시작일은 필수입니다",
            },
          },
          interval_type: {
            validation: {
              required: "반복 유형은 필수입니다",
            },
          },
        },
        button: {
          create: "반복 작업 항목 생성",
          update: "반복 작업 항목 수정",
        },
      },
      create_button: {
        label: "반복 작업 항목 생성",
        no_permission: "반복 작업 항목을 생성하려면 프로젝트 관리자에게 문의하세요",
      },
    },
    empty_state: {
      upgrade: {
        title: "자동으로 처리되는 작업",
        description:
          "한 번만 설정하세요. 기한이 되면 자동으로 다시 생성됩니다. 반복 작업을 더 쉽게 하려면 비즈니스 요금제로 업그레이드하세요.",
      },
      no_templates: {
        button: "첫 반복 작업 항목 생성",
      },
    },
    toasts: {
      create: {
        success: {
          title: "반복 작업 항목이 생성되었습니다",
          message: "{name} 반복 작업 항목이 워크스페이스에서 사용할 수 있습니다.",
        },
        error: {
          title: "반복 작업 항목을 생성하지 못했습니다.",
          message: "다시 한 번 저장하거나, 새 반복 작업 항목에 복사해 보세요. 가능하다면 다른 탭에서 시도해 보세요.",
        },
      },
      update: {
        success: {
          title: "반복 작업 항목이 변경되었습니다",
          message: "{name} 반복 작업 항목이 변경되었습니다.",
        },
        error: {
          title: "반복 작업 항목 변경을 저장하지 못했습니다.",
          message: "다시 한 번 저장하거나, 나중에 이 반복 작업 항목으로 돌아와 주세요. 문제가 계속되면 문의해 주세요.",
        },
      },
      delete: {
        success: {
          title: "반복 작업 항목이 삭제되었습니다",
          message: "{name} 반복 작업 항목이 워크스페이스에서 삭제되었습니다.",
        },
        error: {
          title: "반복 작업 항목을 삭제하지 못했습니다.",
          message: "다시 삭제를 시도하거나 나중에 다시 시도해 보세요. 계속 삭제할 수 없다면 문의해 주세요.",
        },
      },
    },
    delete_confirmation: {
      title: "반복 작업 항목 삭제",
      description: {
        prefix: "반복 작업 항목-",
        suffix:
          "을(를) 삭제하시겠습니까? 반복 작업 항목과 관련된 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 취소할 수 없습니다.",
      },
    },
  },
  automations: {
    settings: {
      title: "커스텀 자동화",
      create_automation: "자동화 생성",
    },
    scope: {
      label: "범위",
      run_on: "실행 대상",
    },
    trigger: {
      label: "트리거",
      add_trigger: "트리거 추가",
      sidebar_header: "트리거 설정",
      input_label: "이 자동화의 트리거는 무엇입니까?",
      input_placeholder: "옵션 선택",
      section_plane_events: "Plane 이벤트",
      section_time_based: "시간 기반",
      fixed_schedule: "고정 일정",
      schedule: {
        frequency: "빈도",
        select_day: "요일 선택",
        day_of_month: "월의 날짜",
        monthly_every: "매",
        monthly_day_aria: "{day}일",
        time: "시간",
        hour: "시",
        minute: "분",
        hour_suffix: "시",
        minute_suffix: "분",
        am: "AM",
        pm: "PM",
        timezone: "시간대",
        timezone_placeholder: "시간대 선택",
        frequency_daily: "매일",
        frequency_weekly: "매주",
        frequency_monthly: "매월",
        on: "에",
        validation_weekly_day_required: "요일을 최소 하나 선택하세요.",
        validation_monthly_date_required: "월의 날짜를 선택하세요.",
        main_content_schedule_summary_daily: "매일 {time} ({timezone}).",
        main_content_schedule_summary_weekly: "매주 {days} {time} ({timezone}).",
        main_content_schedule_summary_monthly: "매월 {day}일 {time} ({timezone}).",
        schedule_mode: "일정 모드",
        schedule_mode_fixed: "고정",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Cron 식 입력",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "유효하지 않은 Cron 식입니다.",
        cron_preview: '이 Cron 식은 "{description}"을(를) 실행합니다.',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "뒤로",
        next: "액션 추가",
      },
    },
    condition: {
      label: "조건",
      add_condition: "조건 추가",
      adding_condition: "조건 추가 중",
    },
    action: {
      label: "액션",
      add_action: "액션 추가",
      sidebar_header: "액션",
      input_label: "자동화가 수행할 작업은 무엇입니까?",
      input_placeholder: "옵션 선택",
      handler_name: {
        add_comment: "댓글 추가",
        change_property: "속성 변경",
      },
      configuration: {
        label: "설정",
        change_property: {
          placeholders: {
            property_name: "속성 선택",
            change_type: "선택",
            property_value_select: "{count, plural, one{값 선택} other{값 선택}}",
            property_value_select_date: "날짜 선택",
          },
          validation: {
            property_name_required: "속성 이름이 필요합니다",
            change_type_required: "변경 유형이 필요합니다",
            property_value_required: "속성 값이 필요합니다",
          },
        },
      },
      comment_block: {
        title: "댓글 추가",
      },
      change_property_block: {
        title: "속성 변경",
      },
      validation: {
        delete_only_action: "유일한 액션을 삭제하기 전에 자동화를 비활성화하세요.",
      },
    },
    conjunctions: {
      and: "그리고",
      or: "또는",
      if: "만약",
      then: "그러면",
    },
    enable: {
      alert: "자동화가 완료되면 '활성화'를 누르세요. 활성화되면 자동화가 실행될 준비가 됩니다.",
      validation: {
        required: "자동화를 활성화하려면 트리거와 최소 하나의 액션이 있어야 합니다.",
      },
    },
    delete: {
      validation: {
        enabled: "자동화를 삭제하기 전에 비활성화해야 합니다.",
      },
    },
    table: {
      title: "자동화 제목",
      last_run_on: "마지막 실행일",
      created_on: "생성일",
      last_updated_on: "마지막 업데이트일",
      last_run_status: "마지막 실행 상태",
      average_duration: "평균 소요 시간",
      owner: "소유자",
      executions: "실행 횟수",
    },
    create_modal: {
      heading: {
        create: "자동화 생성",
        update: "자동화 업데이트",
      },
      title: {
        placeholder: "자동화 이름을 입력하세요.",
        required_error: "제목이 필요합니다",
      },
      description: {
        placeholder: "자동화를 설명하세요.",
      },
      submit_button: {
        create: "자동화 생성",
        update: "자동화 업데이트",
      },
    },
    delete_modal: {
      heading: "자동화 삭제",
    },
    activity: {
      filters: {
        show_fails: "실패 표시",
        all: "전체",
        only_activity: "활동만",
        only_run_history: "실행 기록만",
      },
      run_history: {
        initiator: "시작자",
      },
    },
    toasts: {
      create: {
        success: {
          title: "성공!",
          message: "자동화가 성공적으로 생성되었습니다.",
        },
        error: {
          title: "오류!",
          message: "자동화 생성에 실패했습니다.",
        },
      },
      update: {
        success: {
          title: "성공!",
          message: "자동화가 성공적으로 업데이트되었습니다.",
        },
        error: {
          title: "오류!",
          message: "자동화 업데이트에 실패했습니다.",
        },
      },
      enable: {
        success: {
          title: "성공!",
          message: "자동화가 성공적으로 활성화되었습니다.",
        },
        error: {
          title: "오류!",
          message: "자동화 활성화에 실패했습니다.",
        },
      },
      disable: {
        success: {
          title: "성공!",
          message: "자동화가 성공적으로 비활성화되었습니다.",
        },
        error: {
          title: "오류!",
          message: "자동화 비활성화에 실패했습니다.",
        },
      },
      delete: {
        success: {
          title: "자동화가 삭제되었습니다",
          message: "{name} 자동화가 프로젝트에서 삭제되었습니다.",
        },
        error: {
          title: "자동화를 삭제할 수 없습니다.",
          message: "다시 삭제를 시도하거나 나중에 다시 시도해 보세요. 계속 삭제할 수 없다면 문의해 주세요.",
        },
      },
      action: {
        create: {
          error: {
            title: "오류!",
            message: "액션 생성에 실패했습니다. 다시 시도해 주세요!",
          },
        },
        update: {
          error: {
            title: "오류!",
            message: "액션 업데이트에 실패했습니다. 다시 시도해 주세요!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "아직 표시할 자동화가 없습니다.",
        description:
          "자동화는 트리거, 조건, 액션을 설정하여 반복적인 작업을 제거하는 데 도움이 됩니다. 시간을 절약하고 작업을 원활하게 진행하기 위해 자동화를 생성하세요.",
      },
      upgrade: {
        title: "자동화",
        description: "자동화는 프로젝트의 작업을 자동화하는 방법입니다.",
        sub_description: "자동화를 사용하면 관리 시간의 80%를 절약할 수 있습니다.",
      },
    },
  },
  sso: {
    header: "신원",
    description: "단일 로그인을 포함한 보안 기능에 액세스하려면 도메인을 구성하세요.",
    domain_management: {
      header: "도메인 관리",
      verified_domains: {
        header: "확인된 도메인",
        description: "단일 로그인을 활성화하려면 이메일 도메인의 소유권을 확인하세요.",
        button_text: "도메인 추가",
        list: {
          domain_name: "도메인 이름",
          status: "상태",
          status_verified: "확인됨",
          status_failed: "실패",
          status_pending: "대기 중",
        },
        add_domain: {
          title: "도메인 추가",
          description: "SSO를 구성하고 확인하기 위해 도메인을 추가하세요.",
          form: {
            domain_label: "도메인",
            domain_placeholder: "plane.so",
            domain_required: "도메인이 필요합니다",
            domain_invalid: "유효한 도메인 이름을 입력하세요 (예: plane.so)",
          },
          primary_button_text: "도메인 추가",
          primary_button_loading_text: "추가 중",
          toast: {
            success_title: "성공!",
            success_message: "도메인이 성공적으로 추가되었습니다. DNS TXT 레코드를 추가하여 확인하세요.",
            error_message: "도메인 추가에 실패했습니다. 다시 시도해 주세요.",
          },
        },
        verify_domain: {
          title: "도메인 확인",
          description: "다음 단계에 따라 도메인을 확인하세요.",
          instructions: {
            label: "지침",
            step_1: "도메인 호스트의 DNS 설정으로 이동하세요.",
            step_2: {
              part_1: "",
              part_2: "TXT 레코드",
              part_3: "를 만들고 아래에 제공된 전체 레코드 값을 붙여넣으세요.",
            },
            step_3: "이 업데이트는 일반적으로 몇 분이 걸리지만 완료하는 데 최대 72시간이 걸릴 수 있습니다.",
            step_4: 'DNS 레코드가 업데이트되면 "도메인 확인"을 클릭하여 확인하세요.',
          },
          verification_code_label: "TXT 레코드 값",
          verification_code_description: "이 레코드를 DNS 설정에 추가하세요",
          domain_label: "도메인",
          primary_button_text: "도메인 확인",
          primary_button_loading_text: "확인 중",
          secondary_button_text: "나중에 하기",
          toast: {
            success_title: "성공!",
            success_message: "도메인이 성공적으로 확인되었습니다.",
            error_message: "도메인 확인에 실패했습니다. 다시 시도해 주세요.",
          },
        },
        delete_domain: {
          title: "도메인 삭제",
          description: {
            prefix: "정말로 삭제하시겠습니까",
            suffix: "? 이 작업은 취소할 수 없습니다.",
          },
          primary_button_text: "삭제",
          primary_button_loading_text: "삭제 중",
          secondary_button_text: "취소",
          toast: {
            success_title: "성공!",
            success_message: "도메인이 성공적으로 삭제되었습니다.",
            error_message: "도메인 삭제에 실패했습니다. 다시 시도해 주세요.",
          },
        },
      },
    },
    providers: {
      header: "단일 로그인",
      disabled_message: "SSO를 구성하려면 확인된 도메인을 추가하세요",
      configure: {
        create: "구성",
        update: "편집",
      },
      switch_alert_modal: {
        title: "SSO 방법을 {newProviderShortName}로 전환하시겠습니까?",
        content:
          "{newProviderLongName}({newProviderShortName})을(를) 활성화하려고 합니다. 이 작업은 {activeProviderLongName}({activeProviderShortName})을(를) 자동으로 비활성화합니다. {activeProviderShortName}을(를) 통해 로그인하려는 사용자는 새 방법으로 전환할 때까지 플랫폼에 액세스할 수 없습니다. 계속하시겠습니까?",
        primary_button_text: "전환",
        primary_button_text_loading: "전환 중",
        secondary_button_text: "취소",
      },
      form_section: {
        title: "{workspaceName}에 대한 IdP 제공 세부 정보",
      },
      form_action_buttons: {
        saving: "저장 중",
        save_changes: "변경 사항 저장",
        configure_only: "구성만",
        configure_and_enable: "구성 및 활성화",
        default: "저장",
      },
      setup_details_section: {
        title: "{workspaceName}이(가) IdP에 제공하는 세부 정보",
        button_text: "설정 세부 정보 가져오기",
      },
      saml: {
        header: "SAML 활성화",
        description: "SAML 신원 공급자를 구성하여 단일 로그인을 활성화하세요.",
        configure: {
          title: "SAML 활성화",
          description: "단일 로그인을 포함한 보안 기능에 액세스하려면 이메일 도메인의 소유권을 확인하세요.",
          toast: {
            success_title: "성공!",
            create_success_message: "SAML 공급자가 성공적으로 생성되었습니다.",
            update_success_message: "SAML 공급자가 성공적으로 업데이트되었습니다.",
            error_title: "오류!",
            error_message: "SAML 공급자 저장에 실패했습니다. 다시 시도해 주세요.",
          },
        },
        setup_modal: {
          web_details: {
            header: "웹 세부 정보",
            entity_id: {
              label: "엔티티 ID | 대상 | 메타데이터 정보",
              description: "이 Plane 앱을 IdP의 승인된 서비스로 식별하는 메타데이터의 이 부분을 생성합니다.",
            },
            callback_url: {
              label: "단일 로그인 URL",
              description: "이를 생성합니다. IdP의 로그인 리디렉션 URL 필드에 추가하세요.",
            },
            logout_url: {
              label: "단일 로그아웃 URL",
              description: "이를 생성합니다. IdP의 단일 로그아웃 리디렉션 URL 필드에 추가하세요.",
            },
          },
          mobile_details: {
            header: "모바일 세부 정보",
            entity_id: {
              label: "엔티티 ID | 대상 | 메타데이터 정보",
              description: "이 Plane 앱을 IdP의 승인된 서비스로 식별하는 메타데이터의 이 부분을 생성합니다.",
            },
            callback_url: {
              label: "단일 로그인 URL",
              description: "이를 생성합니다. IdP의 로그인 리디렉션 URL 필드에 추가하세요.",
            },
            logout_url: {
              label: "단일 로그아웃 URL",
              description: "이를 생성합니다. IdP의 로그아웃 리디렉션 URL 필드에 추가하세요.",
            },
          },
          mapping_table: {
            header: "매핑 세부 정보",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "OIDC 활성화",
        description: "OIDC 신원 공급자를 구성하여 단일 로그인을 활성화하세요.",
        configure: {
          title: "OIDC 활성화",
          description: "단일 로그인을 포함한 보안 기능에 액세스하려면 이메일 도메인의 소유권을 확인하세요.",
          toast: {
            success_title: "성공!",
            create_success_message: "OIDC 공급자가 성공적으로 생성되었습니다.",
            update_success_message: "OIDC 공급자가 성공적으로 업데이트되었습니다.",
            error_title: "오류!",
            error_message: "OIDC 공급자 저장에 실패했습니다. 다시 시도해 주세요.",
          },
        },
        setup_modal: {
          web_details: {
            header: "웹 세부 정보",
            origin_url: {
              label: "원본 URL",
              description: "이 Plane 앱에 대해 이를 생성합니다. IdP의 해당 필드에 신뢰할 수 있는 원본으로 추가하세요.",
            },
            callback_url: {
              label: "리디렉션 URL",
              description: "이를 생성합니다. IdP의 로그인 리디렉션 URL 필드에 추가하세요.",
            },
            logout_url: {
              label: "로그아웃 URL",
              description: "이를 생성합니다. IdP의 로그아웃 리디렉션 URL 필드에 추가하세요.",
            },
          },
          mobile_details: {
            header: "모바일 세부 정보",
            origin_url: {
              label: "원본 URL",
              description: "이 Plane 앱에 대해 이를 생성합니다. IdP의 해당 필드에 신뢰할 수 있는 원본으로 추가하세요.",
            },
            callback_url: {
              label: "리디렉션 URL",
              description: "이를 생성합니다. IdP의 로그인 리디렉션 URL 필드에 추가하세요.",
            },
            logout_url: {
              label: "로그아웃 URL",
              description: "이를 생성합니다. IdP의 로그아웃 리디렉션 URL 필드에 추가하세요.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "프로젝트 이름에는 특수 문자를 사용할 수 없습니다.",
  pql: {
    functions: {
      date: {
        now: {
          description: "현재 날짜 및 시간",
        },
        today: {
          description: "오늘 날짜",
        },
        start_of_day: {
          description: "오늘 시작",
        },
        end_of_day: {
          description: "오늘 종료",
        },
        start_of_week: {
          description: "이번 주 시작",
        },
        end_of_week: {
          description: "이번 주 종료",
        },
        start_of_month: {
          description: "이번 달 시작",
        },
        end_of_month: {
          description: "이번 달 종료",
        },
        start_of_year: {
          description: "올해 시작",
        },
        end_of_year: {
          description: "올해 종료",
        },
        days_ago: {
          description: "n일 전 날짜",
        },
        days_from_now: {
          description: "n일 후 날짜",
        },
        weeks_ago: {
          description: "n주 전 날짜",
        },
        weeks_from_now: {
          description: "n주 후 날짜",
        },
        months_ago: {
          description: "n달 전 날짜",
        },
        months_from_now: {
          description: "n달 후 날짜",
        },
      },
      user: {
        current_user: {
          description: "현재 로그인한 사용자",
        },
        members_of: {
          description: '"project:<id>" 또는 "teamspace:<id>"의 멤버',
        },
        workspace_members: {
          description: "모든 워크스페이스 멤버",
        },
      },
      cycle: {
        active_cycle: {
          description: "오늘 활성 사이클",
        },
        completed_cycles: {
          description: "종료일이 지난 사이클",
        },
        upcoming_cycles: {
          description: "시작일이 미래인 사이클",
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
          description: "마감일이 지났고 상태가 열려 있음",
        },
        has_no_assignee: {
          description: "작업 항목에 담당자가 없음",
        },
        has_no_label: {
          description: "작업 항목에 레이블이 없음",
        },
        is_top_level: {
          description: "하위 작업 항목이 아님 (상위 항목 없음)",
        },
        is_sub_work_item: {
          description: "하위 작업 항목 (상위 항목 있음)",
        },
        is_epic: {
          description: "에픽",
        },
        is_intake: {
          description: "접수 작업 항목",
        },
        is_draft: {
          description: "초안 작업 항목",
        },
        is_archived: {
          description: "보관됨",
        },
        has_children: {
          description: "하위 작업 항목이 하나 이상 있음",
        },
        has_start_and_due_dates: {
          description: "시작일과 마감일이 모두 있음",
        },
      },
      relation: {
        linked_to: {
          description: "주어진 작업 항목과 관련된 작업 항목",
        },
        blocked_by: {
          description: "주어진 작업 항목에 의해 차단된 작업 항목",
        },
        blocks: {
          description: "주어진 작업 항목을 차단하는 작업 항목",
        },
        child_of: {
          description: "주어진 작업 항목의 하위 작업 항목",
        },
        parent_of: {
          description: "주어진 작업 항목의 상위 작업 항목",
        },
        duplicate_of: {
          description: "주어진 작업 항목의 중복으로 표시된 작업 항목",
        },
      },
      history: {
        was_ever: {
          description: "필드가 이 값으로 설정된 적 있음",
        },
        was: {
          description: "필드가 이전에 이 값이었음 (변경됨)",
        },
        changed_from: {
          description: "필드가 이 값에서 변경됨",
        },
        changed_to: {
          description: "필드가 이 값으로 변경됨",
        },
        changed: {
          description: "필드가 변경됨",
        },
        updated_by: {
          description: "이 사용자가 업데이트한 작업 항목",
        },
        commented_by: {
          description: "이 사용자가 댓글을 단 작업 항목",
        },
        field_changed_by: {
          description: "이 사용자가 변경한 필드",
        },
        was_assigned_to: {
          description: "이 사용자에게 할당된 작업 항목",
        },
        changed_after: {
          description: "이 날짜 이후에 변경된 필드",
        },
        changed_before: {
          description: "이 날짜 이전에 변경된 필드",
        },
        field_changed_after: {
          description: "이 날짜 이후에 변경된 필드",
        },
        field_changed_before: {
          description: "이 날짜 이전에 변경된 필드",
        },
        changed_to_after: {
          description: "이 날짜 이후에 이 값으로 변경된 필드",
        },
        changed_to_before: {
          description: "이 날짜 이전에 이 값으로 변경된 필드",
        },
        field_changed_between: {
          description: "이 날짜들 사이에 변경된 필드",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "탐색",
      accept: "수락",
      close: "닫기",
      pick_date: "날짜 선택",
    },
    placeholder: '쿼리를 입력하고 "ENTER"를 눌러 필터링하세요...',
    error: "쿼리 제출 중 오류가 발생했습니다. 확인 후 다시 시도하세요.",
  },
  releases: {
    label: "{count, plural, one {릴리스} other {릴리스}}",
    no_release: "릴리스 없음",
    unreleased: "미출시",
    select_releases: "릴리스 선택",
    overview: "개요",
    scope: "범위",
    page_title: {
      scope: "릴리스 - {name} | 범위",
      scope_fallback: "릴리스 | 범위",
    },
    properties: "속성",
    target_date: "목표일",
    lead: "담당자",
    release_tag: "태그",
    labels: "라벨",
    description_placeholder: "설명 추가...",
    progress: "진행 상황",
    completed_work_items: "완료된 작업 항목",
    pending_work_items: "대기 중인 작업 항목",
    cancelled_work_items: "취소된 작업 항목",
    scope_page: {
      work_items: "작업 항목",
      add_work_items: "작업 항목 추가",
      remove_from_release: "릴리스에서 제거",
      empty_state: {
        title: "작업 항목 없음",
        description: "릴리스 범위를 정의하려면 작업 항목을 추가하세요.",
      },
      confirm_remove: {
        content: "이 작업 항목을 릴리스에서 제거하시겠습니까? 프로젝트에는 그대로 남습니다.",
        primary_button: {
          default: "제거",
          loading: "제거 중",
        },
      },
    },
    empty_state: {
      title: "아직 범위가 없습니다",
      description: "이 릴리스의 완료를 추적하려면 릴리스에 작업 항목을 추가하세요.",
      add_scope: "범위 추가",
      not_found: {
        title: "릴리스를 찾을 수 없음",
        description: "릴리스가 삭제되었을 수 있습니다.",
        primary_button: "릴리스로 돌아가기",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {작업 항목이 추가됨} other {작업 항목이 추가됨}}",
      work_items_error: "작업 항목을 추가하지 못했습니다",
    },
    count_releases: "{count, plural, one {# 릴리스} other {# 릴리스}}",
    actions: {
      delete: "삭제",
    },
    delete_modal: {
      title: "릴리스 삭제",
      content: '릴리스 "{releaseName}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    },
    settings: {
      heading: {
        title: "릴리스",
        description: "릴리스를 사용해 프로젝트 산출물을 정확하게 관리하세요.",
      },
      toggle: {
        title: "릴리스 사용",
        description: "워크스페이스 구성원은 각자의 프로젝트에서 범위를 볼 수 있습니다.",
      },
      toasts: {
        enable: {
          loading: "릴리스를 사용하는 중...",
          success: {
            title: "릴리스가 활성화됨",
            message: "이 워크스페이스에서 릴리스가 활성화되었습니다.",
          },
          error: {
            title: "오류",
            message: "릴리스를 활성화하지 못했습니다. 다시 시도해 주세요.",
          },
        },
        disable: {
          loading: "릴리스를 비활성화하는 중...",
          success: {
            title: "릴리스가 비활성화됨",
            message: "이 워크스페이스에서 릴리스가 비활성화되었습니다.",
          },
          error: {
            title: "오류",
            message: "릴리스를 비활성화하지 못했습니다. 다시 시도해 주세요.",
          },
        },
      },
      tabs: {
        tags: "릴리스 태그",
        labels: "라벨",
      },
      tags: {
        title: "릴리스 태그",
        description: "태그를 사용해 릴리스를 분류하고 필터링하세요.",
        add: "태그 추가",
        empty_state: "아직 태그가 없습니다. 첫 번째 태그를 만들어 주세요.",
        errors: {
          version_required: "버전은 필수입니다.",
          version_already_exists: "이 버전의 태그가 이미 존재합니다.",
          generic: "문제가 발생했습니다. 다시 시도해 주세요.",
        },
        delete_modal: {
          title: "태그 삭제",
          content: '태그 "{tagVersion}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        },
        actions: {
          edit: "태그 수정",
          delete: "태그 삭제",
        },
        toasts: {
          delete: {
            success: "태그가 삭제되었습니다.",
            error: "태그를 삭제하지 못했습니다. 다시 시도해 주세요.",
          },
        },
      },
      labels: {
        title: "라벨",
        description: "라벨을 사용해 이니셔티브를 구조화하고 정리하세요.",
        add: "라벨 추가",
        empty_state: "아직 라벨이 없습니다. 첫 번째 라벨을 만들어 주세요.",
        errors: {
          name_required: "이름은 필수입니다.",
          name_already_exists: "이 이름의 라벨이 이미 존재합니다.",
          generic: "문제가 발생했습니다. 다시 시도해 주세요.",
        },
        modal: {
          name_placeholder: "라벨 이름",
          pick_color: "라벨 색상 선택",
        },
        actions: {
          edit: "라벨 수정",
          delete: "라벨 삭제",
        },
        drag_to_reorder: "드래그하여 순서 변경",
        delete_modal: {
          title: "라벨 삭제",
          content: '라벨 "{labelName}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
        },
        toasts: {
          delete: {
            success: "라벨이 삭제되었습니다.",
            error: "라벨을 삭제하지 못했습니다. 다시 시도해 주세요.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "계층 구조",
      tab_label: "계층 구조",
      description:
        "작업을 정리하기 위한 계층 구조 레벨을 설정하세요. 각 레벨은 바로 위 항목과의 상위 관계와 바로 아래 항목과의 하위 관계를 정의합니다. ",
      sidebar_label: "계층 구조",
      enable_control: {
        title: "계층 구조 활성화",
        description: "다양한 작업 항목 유형 간에 상위-하위 관계를 생성합니다.",
        tooltip: "계층 구조는 한번 활성화되면 비활성화할 수 없습니다.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "새 계층 구조를 만들려면 먼저 작업 항목 유형을 정의하세요.",
        cta: "작업 항목 유형 설정",
      },
    },
    levels: {
      add_level_button: "계층 레벨 추가",
      empty_level_placeholder: "레벨 {level}에 작업 항목 유형 추가",
      empty_level_unauthorized: "이 레벨에서 작업 항목 유형을 찾을 수 없습니다.",
      zero_level_description: "기본적으로 모든 작업 항목 유형은 계층 구조에 할당될 때까지 레벨 0에 있습니다.",
    },
    add_level_modal: {
      title: "계층 레벨 추가",
      description: "작업 항목 유형에 새 계층 레벨을 추가합니다.",
      work_item_type: "작업 항목 유형",
      select_placeholder: "유형 선택",
      search_placeholder: "유형 검색",
      empty_state: {
        title: "모든 작업 항목 유형이 사용 중",
        description: "이 워크스페이스에 정의된 모든 작업 항목 유형은 이미 계층 구조의 일부입니다.",
      },
      invalid_level_toast: {
        title: "오류!",
        message: "{type_name}은(는) 계층 규칙을 위반하므로 레벨 {level}에 추가할 수 없습니다.",
      },
      error_toast: {
        title: "오류",
        message: "작업 항목 유형을 계층 구조에 추가하지 못했습니다.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "오류!",
        message: "선택한 작업 항목 유형은 계층 규칙을 위반하므로 새 작업 항목을 만드는 데 사용할 수 없습니다.",
      },
      invalid_work_item_type_update_toast: {
        title: "오류!",
        message: "작업 항목 유형은 계층 규칙을 위반하므로 업데이트할 수 없습니다.",
      },
    },
  },
} as const;

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
      "Chúng tôi đang xử lý vấn đề này. Nếu bạn cần hỗ trợ ngay lập tức,",
    reach_out_to_us: "hãy liên hệ với chúng tôi",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Nếu không, hãy thử làm mới trang thỉnh thoảng hoặc truy cập",
    status_page: "trang trạng thái của chúng tôi",
  },
  sidebar: {
    projects: "Dự án",
    pages: "Trang",
    new_work_item: "Mục công việc mới",
    home: "Trang chủ",
    your_work: "Công việc của tôi",
    inbox: "Hộp thư đến",
    workspace: "Không gian làm việc",
    views: "Chế độ xem",
    analytics: "Phân tích",
    work_items: "Mục công việc",
    cycles: "Chu kỳ",
    modules: "Mô-đun",
    intake: "Thu thập",
    drafts: "Bản nháp",
    favorites: "Yêu thích",
    pro: "Phiên bản Pro",
    upgrade: "Nâng cấp",
    pi_chat: "Plane AI",
    initiatives: "Sáng kiến",
    teamspaces: "Không gian nhóm",
    epics: "Epics",
    upgrade_plan: "Nâng cấp gói",
    plane_pro: "Plane Pro",
    business: "Doanh nghiệp",
    customers: "Khách hàng",
    recurring_work_items: "Công việc lặp lại",
  },
  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "name@company.com",
        errors: {
          required: "Email là bắt buộc",
          invalid: "Email không hợp lệ",
        },
      },
      password: {
        label: "Mật khẩu",
        set_password: "Đặt mật khẩu",
        placeholder: "Nhập mật khẩu",
        confirm_password: {
          label: "Xác nhận mật khẩu",
          placeholder: "Xác nhận mật khẩu",
        },
        current_password: {
          label: "Mật khẩu hiện tại",
        },
        new_password: {
          label: "Mật khẩu mới",
          placeholder: "Nhập mật khẩu mới",
        },
        change_password: {
          label: {
            default: "Thay đổi mật khẩu",
            submitting: "Đang thay đổi mật khẩu",
          },
        },
        errors: {
          match: "Mật khẩu không khớp",
          empty: "Vui lòng nhập mật khẩu",
          length: "Mật khẩu phải dài hơn 8 ký tự",
          strength: {
            weak: "Mật khẩu yếu",
            strong: "Mật khẩu mạnh",
          },
        },
        submit: "Đặt mật khẩu",
        toast: {
          change_password: {
            success: {
              title: "Thành công!",
              message: "Mật khẩu đã được thay đổi thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Đã xảy ra lỗi. Vui lòng thử lại.",
            },
          },
        },
      },
      unique_code: {
        label: "Mã duy nhất",
        placeholder: "123456",
        paste_code: "Dán mã xác minh đã gửi đến email của bạn",
        requesting_new_code: "Đang yêu cầu mã mới",
        sending_code: "Đang gửi mã",
      },
      already_have_an_account: "Đã có tài khoản?",
      login: "Đăng nhập",
      create_account: "Tạo tài khoản",
      new_to_plane: "Lần đầu sử dụng Plane?",
      back_to_sign_in: "Quay lại đăng nhập",
      resend_in: "Gửi lại sau {seconds} giây",
      sign_in_with_unique_code: "Đăng nhập bằng mã duy nhất",
      forgot_password: "Quên mật khẩu?",
      username: {
        label: "Tên người dùng",
        placeholder: "Nhập tên người dùng của bạn",
      },
    },
    sign_up: {
      header: {
        label: "Tạo tài khoản để bắt đầu quản lý công việc cùng nhóm của bạn.",
        step: {
          email: {
            header: "Đăng ký",
            sub_header: "",
          },
          password: {
            header: "Đăng ký",
            sub_header: "Đăng ký bằng cách kết hợp email-mật khẩu.",
          },
          unique_code: {
            header: "Đăng ký",
            sub_header: "Đăng ký bằng mã duy nhất được gửi đến email trên.",
          },
        },
      },
      errors: {
        password: {
          strength: "Vui lòng đặt mật khẩu mạnh để tiếp tục",
        },
      },
    },
    sign_in: {
      header: {
        label: "Đăng nhập để bắt đầu quản lý công việc cùng nhóm của bạn.",
        step: {
          email: {
            header: "Đăng nhập hoặc đăng ký",
            sub_header: "",
          },
          password: {
            header: "Đăng nhập hoặc đăng ký",
            sub_header: "Đăng nhập bằng cách kết hợp email-mật khẩu của bạn.",
          },
          unique_code: {
            header: "Đăng nhập hoặc đăng ký",
            sub_header: "Đăng nhập bằng mã duy nhất được gửi đến email trên.",
          },
        },
      },
    },
    forgot_password: {
      title: "Đặt lại mật khẩu",
      description:
        "Nhập địa chỉ email đã xác minh cho tài khoản người dùng của bạn và chúng tôi sẽ gửi cho bạn liên kết đặt lại mật khẩu.",
      email_sent: "Chúng tôi đã gửi liên kết đặt lại đến email của bạn",
      send_reset_link: "Gửi liên kết đặt lại",
      errors: {
        smtp_not_enabled:
          "Chúng tôi nhận thấy quản trị viên của bạn chưa bật SMTP, chúng tôi sẽ không thể gửi liên kết đặt lại mật khẩu",
      },
      toast: {
        success: {
          title: "Email đã được gửi",
          message:
            "Hãy kiểm tra hộp thư đến của bạn để lấy liên kết đặt lại mật khẩu. Nếu bạn không nhận được trong vòng vài phút, vui lòng kiểm tra thư mục spam.",
        },
        error: {
          title: "Lỗi!",
          message: "Đã xảy ra lỗi. Vui lòng thử lại.",
        },
      },
    },
    reset_password: {
      title: "Đặt mật khẩu mới",
      description: "Bảo vệ tài khoản của bạn bằng mật khẩu mạnh",
    },
    set_password: {
      title: "Bảo vệ tài khoản của bạn",
      description: "Đặt mật khẩu giúp bạn đăng nhập an toàn",
    },
    sign_out: {
      toast: {
        error: {
          title: "Lỗi!",
          message: "Không thể đăng xuất. Vui lòng thử lại.",
        },
      },
    },
    ldap: {
      header: {
        label: "Tiếp tục với {ldapProviderName}",
        sub_header: "Nhập thông tin đăng nhập {ldapProviderName} của bạn",
      },
    },
  },
  submit: "Gửi",
  cancel: "Hủy",
  loading: "Đang tải",
  error: "Lỗi",
  success: "Thành công",
  warning: "Cảnh báo",
  info: "Thông tin",
  close: "Đóng",
  yes: "Có",
  no: "Không",
  ok: "OK",
  name: "Tên",
  description: "Mô tả",
  search: "Tìm kiếm",
  add_member: "Thêm thành viên",
  adding_members: "Đang thêm thành viên",
  remove_member: "Xóa thành viên",
  add_members: "Thêm thành viên",
  adding_member: "Đang thêm thành viên",
  remove_members: "Xóa thành viên",
  add: "Thêm",
  adding: "Đang thêm",
  remove: "Xóa",
  add_new: "Thêm mới",
  remove_selected: "Xóa đã chọn",
  first_name: "Tên",
  last_name: "Họ",
  email: "Email",
  display_name: "Tên hiển thị",
  role: "Vai trò",
  timezone: "Múi giờ",
  avatar: "Ảnh đại diện",
  cover_image: "Ảnh bìa",
  password: "Mật khẩu",
  change_cover: "Thay đổi ảnh bìa",
  language: "Ngôn ngữ",
  saving: "Đang lưu",
  save_changes: "Lưu thay đổi",
  deactivate_account: "Vô hiệu hóa tài khoản",
  deactivate_account_description:
    "Khi tài khoản bị vô hiệu hóa, tất cả dữ liệu và tài nguyên trong tài khoản đó sẽ bị xóa vĩnh viễn và không thể khôi phục.",
  profile_settings: "Cài đặt hồ sơ",
  your_account: "Tài khoản của bạn",
  security: "Bảo mật",
  activity: "Hoạt động",
  activity_empty_state: {
    no_activity: "Chưa có hoạt động",
    no_transitions: "Chưa có chuyển đổi",
  },
  appearance: "Giao diện",
  notifications: "Thông báo",
  workspaces: "Không gian làm việc",
  create_workspace: "Tạo không gian làm việc",
  invitations: "Lời mời",
  summary: "Tóm tắt",
  assigned: "Đã phân công",
  created: "Đã tạo",
  subscribed: "Đã đăng ký",
  you_do_not_have_the_permission_to_access_this_page: "Bạn không có quyền truy cập trang này.",
  something_went_wrong_please_try_again: "Đã xảy ra lỗi. Vui lòng thử lại.",
  load_more: "Tải thêm",
  select_or_customize_your_interface_color_scheme: "Chọn hoặc tùy chỉnh giao diện màu của bạn.",
  select_the_cursor_motion_style_that_feels_right_for_you: "Chọn kiểu chuyển động con trỏ phù hợp với bạn.",
  theme: "Chủ đề",
  smooth_cursor: "Con trỏ mượt",
  system_preference: "Tùy chọn hệ thống",
  light: "Sáng",
  dark: "Tối",
  light_contrast: "Sáng tương phản cao",
  dark_contrast: "Tối tương phản cao",
  custom: "Tùy chỉnh",
  select_your_theme: "Chọn chủ đề của bạn",
  customize_your_theme: "Tùy chỉnh chủ đề của bạn",
  background_color: "Màu nền",
  text_color: "Màu chữ",
  primary_color: "Màu chính (chủ đề)",
  sidebar_background_color: "Màu nền thanh bên",
  sidebar_text_color: "Màu chữ thanh bên",
  set_theme: "Đặt chủ đề",
  enter_a_valid_hex_code_of_6_characters: "Nhập mã hex hợp lệ gồm 6 ký tự",
  background_color_is_required: "Màu nền là bắt buộc",
  text_color_is_required: "Màu chữ là bắt buộc",
  primary_color_is_required: "Màu chính là bắt buộc",
  sidebar_background_color_is_required: "Màu nền thanh bên là bắt buộc",
  sidebar_text_color_is_required: "Màu chữ thanh bên là bắt buộc",
  updating_theme: "Đang cập nhật chủ đề",
  theme_updated_successfully: "Chủ đề đã được cập nhật thành công",
  failed_to_update_the_theme: "Không thể cập nhật chủ đề",
  email_notifications: "Thông báo qua email",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Cập nhật những mục công việc bạn đã đăng ký. Bật tính năng này để nhận thông báo.",
  email_notification_setting_updated_successfully: "Cài đặt thông báo email đã được cập nhật thành công",
  failed_to_update_email_notification_setting: "Không thể cập nhật cài đặt thông báo email",
  notify_me_when: "Thông báo cho tôi khi",
  property_changes: "Thay đổi thuộc tính",
  property_changes_description:
    "Thông báo cho tôi khi thuộc tính của mục công việc (như người phụ trách, mức độ ưu tiên, ước tính, v.v.) thay đổi.",
  state_change: "Thay đổi trạng thái",
  state_change_description: "Thông báo cho tôi khi mục công việc được chuyển sang trạng thái khác",
  issue_completed: "Mục công việc hoàn thành",
  issue_completed_description: "Chỉ thông báo cho tôi khi mục công việc hoàn thành",
  comments: "Bình luận",
  comments_description: "Thông báo cho tôi khi ai đó bình luận về mục công việc",
  mentions: "Đề cập",
  mentions_description: "Chỉ thông báo cho tôi khi ai đó đề cập đến tôi trong bình luận hoặc mô tả",
  old_password: "Mật khẩu cũ",
  general_settings: "Cài đặt chung",
  sign_out: "Đăng xuất",
  signing_out: "Đang đăng xuất",
  active_cycles: "Chu kỳ hoạt động",
  active_cycles_description:
    "Theo dõi chu kỳ trên các dự án, theo dõi mục công việc ưu tiên cao và chú ý đến các chu kỳ cần quan tâm.",
  on_demand_snapshots_of_all_your_cycles: "Ảnh chụp nhanh theo yêu cầu của tất cả chu kỳ của bạn",
  upgrade: "Nâng cấp",
  "10000_feet_view": "Góc nhìn tổng quan về tất cả chu kỳ hoạt động.",
  "10000_feet_view_description":
    "Phóng to tầm nhìn để xem tất cả chu kỳ đang diễn ra trong tất cả dự án cùng một lúc, thay vì xem từng chu kỳ trong mỗi dự án.",
  get_snapshot_of_each_active_cycle: "Nhận ảnh chụp nhanh của mỗi chu kỳ hoạt động.",
  get_snapshot_of_each_active_cycle_description:
    "Theo dõi số liệu tổng hợp cho tất cả chu kỳ hoạt động, xem trạng thái tiến độ và hiểu phạm vi liên quan đến thời hạn.",
  compare_burndowns: "So sánh biểu đồ burndown.",
  compare_burndowns_description: "Giám sát hiệu suất của từng nhóm bằng cách xem báo cáo burndown cho mỗi chu kỳ.",
  quickly_see_make_or_break_issues: "Nhanh chóng xem các vấn đề quan trọng.",
  quickly_see_make_or_break_issues_description:
    "Xem trước các mục công việc ưu tiên cao liên quan đến thời hạn trong mỗi chu kỳ. Xem tất cả mục công việc trong mỗi chu kỳ chỉ bằng một cú nhấp chuột.",
  zoom_into_cycles_that_need_attention: "Phóng to vào chu kỳ cần chú ý.",
  zoom_into_cycles_that_need_attention_description:
    "Điều tra bất kỳ trạng thái chu kỳ nào không đáp ứng mong đợi chỉ bằng một cú nhấp chuột.",
  stay_ahead_of_blockers: "Đi trước các yếu tố chặn.",
  stay_ahead_of_blockers_description:
    "Phát hiện thách thức từ dự án này sang dự án khác và xem các phụ thuộc giữa các chu kỳ không dễ thấy từ các chế độ xem khác.",
  analytics: "Phân tích",
  workspace_invites: "Lời mời không gian làm việc",
  enter_god_mode: "Vào chế độ quản trị viên",
  workspace_logo: "Logo không gian làm việc",
  new_issue: "Mục công việc mới",
  your_work: "Công việc của tôi",
  drafts: "Bản nháp",
  projects: "Dự án",
  views: "Chế độ xem",
  archives: "Lưu trữ",
  settings: "Cài đặt",
  failed_to_move_favorite: "Không thể di chuyển mục yêu thích",
  favorites: "Yêu thích",
  no_favorites_yet: "Chưa có mục yêu thích",
  create_folder: "Tạo thư mục",
  new_folder: "Thư mục mới",
  favorite_updated_successfully: "Đã cập nhật mục yêu thích thành công",
  favorite_created_successfully: "Đã tạo mục yêu thích thành công",
  folder_already_exists: "Thư mục đã tồn tại",
  folder_name_cannot_be_empty: "Tên thư mục không thể trống",
  something_went_wrong: "Đã xảy ra lỗi",
  failed_to_reorder_favorite: "Không thể sắp xếp lại mục yêu thích",
  favorite_removed_successfully: "Đã xóa mục yêu thích thành công",
  failed_to_create_favorite: "Không thể tạo mục yêu thích",
  failed_to_rename_favorite: "Không thể đổi tên mục yêu thích",
  project_link_copied_to_clipboard: "Đã sao chép liên kết dự án vào bảng tạm",
  link_copied: "Đã sao chép liên kết",
  add_project: "Thêm dự án",
  create_project: "Tạo dự án",
  failed_to_remove_project_from_favorites: "Không thể xóa dự án khỏi mục yêu thích. Vui lòng thử lại.",
  project_created_successfully: "Dự án đã được tạo thành công",
  project_created_successfully_description:
    "Dự án đã được tạo thành công. Bây giờ bạn có thể bắt đầu thêm mục công việc.",
  project_name_already_taken: "Tên dự án đã được sử dụng.",
  project_identifier_already_taken: "ID dự án đã được sử dụng.",
  project_cover_image_alt: "Ảnh bìa dự án",
  name_is_required: "Tên là bắt buộc",
  title_should_be_less_than_255_characters: "Tiêu đề phải ít hơn 255 ký tự",
  project_name: "Tên dự án",
  project_id_must_be_at_least_1_character: "ID dự án phải có ít nhất 1 ký tự",
  project_id_must_be_at_most_5_characters: "ID dự án chỉ được tối đa 5 ký tự",
  project_id: "ID dự án",
  project_id_tooltip_content: "Giúp xác định duy nhất mục công việc trong dự án của bạn. Tối đa 50 ký tự.",
  description_placeholder: "Mô tả",
  only_alphanumeric_non_latin_characters_allowed: "Chỉ cho phép các ký tự chữ số và không phải Latin.",
  project_id_is_required: "ID dự án là bắt buộc",
  project_id_allowed_char: "Chỉ cho phép các ký tự chữ số và không phải Latin.",
  project_id_min_char: "ID dự án phải có ít nhất 1 ký tự",
  project_id_max_char: "ID dự án chỉ được tối đa {max} ký tự",
  project_description_placeholder: "Nhập mô tả dự án",
  select_network: "Chọn mạng",
  lead: "Người phụ trách",
  date_range: "Khoảng thời gian",
  private: "Riêng tư",
  public: "Công khai",
  accessible_only_by_invite: "Chỉ truy cập được bằng lời mời",
  anyone_in_the_workspace_except_guests_can_join:
    "Bất kỳ ai trong không gian làm việc ngoại trừ khách đều có thể tham gia",
  creating: "Đang tạo",
  creating_project: "Đang tạo dự án",
  adding_project_to_favorites: "Đang thêm dự án vào mục yêu thích",
  project_added_to_favorites: "Đã thêm dự án vào mục yêu thích",
  couldnt_add_the_project_to_favorites: "Không thể thêm dự án vào mục yêu thích. Vui lòng thử lại.",
  removing_project_from_favorites: "Đang xóa dự án khỏi mục yêu thích",
  project_removed_from_favorites: "Đã xóa dự án khỏi mục yêu thích",
  couldnt_remove_the_project_from_favorites: "Không thể xóa dự án khỏi mục yêu thích. Vui lòng thử lại.",
  add_to_favorites: "Thêm vào mục yêu thích",
  remove_from_favorites: "Xóa khỏi mục yêu thích",
  publish_project: "Xuất bản dự án",
  publish: "Xuất bản",
  copy_link: "Sao chép liên kết",
  leave_project: "Rời dự án",
  join_the_project_to_rearrange: "Tham gia dự án để sắp xếp lại",
  drag_to_rearrange: "Kéo để sắp xếp lại",
  congrats: "Chúc mừng!",
  open_project: "Mở dự án",
  issues: "Mục công việc",
  cycles: "Chu kỳ",
  modules: "Mô-đun",
  pages: {
    link_pages: "Kết nối trang",
    show_wiki_pages: "Hiển thị trang Wiki",
    link_pages_to: "Kết nối trang đến",
    linked_pages: "Trang đã kết nối",
    no_description: "Trang này trống. Viết điều gì đó và xem nó ở đây như thế này",
    toasts: {
      link: {
        success: {
          title: "Trang đã được cập nhật",
          message: "Trang đã được cập nhật thành công",
        },
        error: {
          title: "Trang không được cập nhật",
          message: "Trang không được cập nhật",
        },
      },
      remove: {
        success: {
          title: "Trang đã được xóa",
          message: "Trang đã được xóa thành công",
        },
        error: {
          title: "Trang không được xóa",
          message: "Trang không được xóa",
        },
      },
    },
  },
  intake: "Thu thập",
  renew: "Gia hạn",
  preview: "Xem trước",
  time_tracking: "Theo dõi thời gian",
  work_management: "Quản lý công việc",
  projects_and_issues: "Dự án và mục công việc",
  projects_and_issues_description:
    "Bật hoặc tắt các tính năng này trong dự án này. Có thể thay đổi theo thời gian phù hợp với nhu cầu.",
  cycles_description:
    "Thiết lập thời gian làm việc theo dự án và điều chỉnh thời gian nếu cần. Một chu kỳ có thể là 2 tuần, chu kỳ tiếp theo là 1 tuần.",
  modules_description: "Tổ chức công việc thành các dự án con với người lãnh đạo và người được phân công riêng.",
  views_description: "Lưu các tùy chọn sắp xếp, lọc và hiển thị tùy chỉnh hoặc chia sẻ chúng với nhóm của bạn.",
  pages_description: "Tạo và chỉnh sửa nội dung tự do: ghi chú, tài liệu, bất cứ thứ gì.",
  intake_description:
    "Cho phép người không phải thành viên chia sẻ lỗi, phản hồi và đề xuất mà không làm gián đoạn quy trình làm việc của bạn.",
  time_tracking_description: "Ghi lại thời gian dành cho các mục công việc và dự án.",
  work_management_description: "Quản lý công việc và dự án của bạn một cách dễ dàng.",
  documentation: "Tài liệu",
  message_support: "Liên hệ hỗ trợ",
  contact_sales: "Liên hệ bộ phận bán hàng",
  hyper_mode: "Chế độ siêu tốc",
  keyboard_shortcuts: "Phím tắt",
  whats_new: "Có gì mới",
  version: "Phiên bản",
  we_are_having_trouble_fetching_the_updates: "Chúng tôi đang gặp sự cố khi lấy bản cập nhật.",
  our_changelogs: "Nhật ký thay đổi của chúng tôi",
  for_the_latest_updates: "Để cập nhật mới nhất.",
  please_visit: "Vui lòng truy cập",
  docs: "Tài liệu",
  full_changelog: "Nhật ký thay đổi đầy đủ",
  support: "Hỗ trợ",
  forum: "Forum",
  powered_by_plane_pages: "Được hỗ trợ bởi Plane Pages",
  please_select_at_least_one_invitation: "Vui lòng chọn ít nhất một lời mời.",
  please_select_at_least_one_invitation_description:
    "Vui lòng chọn ít nhất một lời mời để tham gia không gian làm việc.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Chúng tôi thấy có người đã mời bạn tham gia không gian làm việc",
  join_a_workspace: "Tham gia không gian làm việc",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Chúng tôi thấy có người đã mời bạn tham gia không gian làm việc",
  join_a_workspace_description: "Tham gia không gian làm việc",
  accept_and_join: "Chấp nhận và tham gia",
  go_home: "Về trang chủ",
  no_pending_invites: "Không có lời mời đang chờ xử lý",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Bạn có thể xem ở đây nếu ai đó mời bạn vào không gian làm việc",
  back_to_home: "Quay lại trang chủ",
  workspace_name: "Tên không gian làm việc",
  deactivate_your_account: "Vô hiệu hóa tài khoản của bạn",
  deactivate_your_account_description:
    "Khi đã vô hiệu hóa, bạn sẽ không được phân công công việc và sẽ không được tính vào hóa đơn của không gian làm việc. Để kích hoạt lại tài khoản, bạn cần nhận được lời mời không gian làm việc gửi đến địa chỉ email này.",
  deactivating: "Đang vô hiệu hóa",
  confirm: "Xác nhận",
  confirming: "Đang xác nhận",
  draft_created: "Đã tạo bản nháp",
  issue_created_successfully: "Đã tạo mục công việc thành công",
  draft_creation_failed: "Tạo bản nháp thất bại",
  issue_creation_failed: "Tạo mục công việc thất bại",
  draft_issue: "Mục công việc nháp",
  issue_updated_successfully: "Đã cập nhật mục công việc thành công",
  issue_could_not_be_updated: "Không thể cập nhật mục công việc",
  create_a_draft: "Tạo bản nháp",
  save_to_drafts: "Lưu vào bản nháp",
  save: "Lưu",
  update: "Cập nhật",
  updating: "Đang cập nhật",
  create_new_issue: "Tạo mục công việc mới",
  editor_is_not_ready_to_discard_changes: "Trình soạn thảo chưa sẵn sàng để hủy bỏ thay đổi",
  failed_to_move_issue_to_project: "Không thể di chuyển mục công việc đến dự án",
  create_more: "Tạo thêm",
  add_to_project: "Thêm vào dự án",
  discard: "Hủy bỏ",
  duplicate_issue_found: "Đã tìm thấy mục công việc trùng lặp",
  duplicate_issues_found: "Đã tìm thấy các mục công việc trùng lặp",
  no_matching_results: "Không có kết quả phù hợp",
  title_is_required: "Tiêu đề là bắt buộc",
  title: "Tiêu đề",
  state: "Trạng thái",
  transition: "Chuyển đổi",
  history: "Lịch sử",
  priority: "Ưu tiên",
  none: "Không có",
  urgent: "Khẩn cấp",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  members: "Thành viên",
  assignee: "Người phụ trách",
  assignees: "Người phụ trách",
  subscriber: "{count, plural, one{# Người theo dõi} other{# Người theo dõi}}",
  you: "Bạn",
  labels: "Nhãn",
  create_new_label: "Tạo nhãn mới",
  label_name: "Tên nhãn",
  failed_to_create_label: "Không thể tạo nhãn. Vui lòng thử lại.",
  start_date: "Ngày bắt đầu",
  end_date: "Ngày kết thúc",
  due_date: "Ngày hết hạn",
  estimate: "Ước tính",
  change_parent_issue: "Thay đổi mục công việc cha",
  remove_parent_issue: "Xóa mục công việc cha",
  add_parent: "Thêm mục cha",
  loading_members: "Đang tải thành viên",
  view_link_copied_to_clipboard: "Đã sao chép liên kết xem vào bảng tạm",
  required: "Bắt buộc",
  optional: "Tùy chọn",
  Cancel: "Hủy",
  edit: "Chỉnh sửa",
  archive: "Lưu trữ",
  restore: "Khôi phục",
  open_in_new_tab: "Mở trong tab mới",
  delete: "Xóa",
  deleting: "Đang xóa",
  make_a_copy: "Tạo bản sao",
  move_to_project: "Di chuyển đến dự án",
  good: "Chào buổi sáng",
  morning: "Buổi sáng",
  afternoon: "Buổi chiều",
  evening: "Buổi tối",
  show_all: "Hiển thị tất cả",
  show_less: "Hiển thị ít hơn",
  no_data_yet: "Chưa có dữ liệu",
  syncing: "Đang đồng bộ",
  add_work_item: "Thêm mục công việc",
  advanced_description_placeholder: "Nhấn '/' để sử dụng lệnh",
  create_work_item: "Tạo mục công việc",
  attachments: "Tệp đính kèm",
  declining: "Đang từ chối",
  declined: "Đã từ chối",
  decline: "Từ chối",
  unassigned: "Chưa phân công",
  work_items: "Mục công việc",
  add_link: "Thêm liên kết",
  points: "Điểm",
  no_assignee: "Không có người phụ trách",
  no_assignees_yet: "Chưa có người phụ trách",
  no_labels_yet: "Chưa có nhãn",
  ideal: "Lý tưởng",
  current: "Hiện tại",
  no_matching_members: "Không có thành viên phù hợp",
  leaving: "Đang rời",
  removing: "Đang xóa",
  leave: "Rời",
  refresh: "Làm mới",
  refreshing: "Đang làm mới",
  refresh_status: "Làm mới trạng thái",
  prev: "Trước",
  next: "Tiếp",
  re_generating: "Đang tạo lại",
  re_generate: "Tạo lại",
  re_generate_key: "Tạo lại khóa",
  export: "Xuất",
  member: "{count, plural, other{# thành viên}}",
  new_password_must_be_different_from_old_password: "Mật khẩu mới phải khác mật khẩu cũ",
  edited: "đã chỉnh sửa",
  bot: "bot",
  project_view: {
    sort_by: {
      created_at: "Thời gian tạo",
      updated_at: "Thời gian cập nhật",
      name: "Tên",
    },
  },
  upgrade_request: "Yêu cầu Quản trị viên Không gian làm việc nâng cấp.",
  copied_to_clipboard: "Đã sao chép vào bảng tạm",
  copied_to_clipboard_description: "URL đã được sao chép thành công vào bảng tạm của bạn",
  toast: {
    success: "Thành công!",
    error: "Lỗi!",
  },
  links: {
    toasts: {
      created: {
        title: "Đã tạo liên kết",
        message: "Liên kết đã được tạo thành công",
      },
      not_created: {
        title: "Chưa tạo liên kết",
        message: "Không thể tạo liên kết",
      },
      updated: {
        title: "Đã cập nhật liên kết",
        message: "Liên kết đã được cập nhật thành công",
      },
      not_updated: {
        title: "Chưa cập nhật liên kết",
        message: "Không thể cập nhật liên kết",
      },
      removed: {
        title: "Đã xóa liên kết",
        message: "Liên kết đã được xóa thành công",
      },
      not_removed: {
        title: "Chưa xóa liên kết",
        message: "Không thể xóa liên kết",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Hướng dẫn nhanh",
      not_right_now: "Không phải bây giờ",
      create_project: {
        title: "Tạo dự án",
        description: "Trong Plane, hầu hết mọi thứ đều bắt đầu từ dự án.",
        cta: "Bắt đầu",
      },
      invite_team: {
        title: "Mời nhóm của bạn",
        description: "Xây dựng, phát hành và quản lý cùng với đồng nghiệp.",
        cta: "Mời họ tham gia",
      },
      configure_workspace: {
        title: "Thiết lập không gian làm việc của bạn",
        description: "Bật hoặc tắt tính năng, hoặc thiết lập thêm.",
        cta: "Cấu hình không gian làm việc này",
      },
      personalize_account: {
        title: "Cá nhân hóa Plane cho bạn",
        description: "Chọn ảnh đại diện, màu sắc và nhiều hơn nữa.",
        cta: "Cá nhân hóa ngay",
      },
      widgets: {
        title: "Không có tiện ích nào trông có vẻ yên tĩnh, hãy bật chúng lên",
        description: `Có vẻ như tất cả tiện ích của bạn đều đã bị tắt. Bật chúng ngay
để nâng cao trải nghiệm của bạn!`,
        primary_button: {
          text: "Quản lý tiện ích",
        },
      },
    },
    quick_links: {
      empty: "Lưu liên kết liên quan đến công việc mà bạn muốn truy cập thuận tiện.",
      add: "Thêm liên kết nhanh",
      title: "Liên kết nhanh",
      title_plural: "Liên kết nhanh",
    },
    recents: {
      title: "Gần đây",
      empty: {
        project: "Sau khi truy cập dự án, các dự án gần đây của bạn sẽ xuất hiện ở đây.",
        page: "Sau khi truy cập trang, các trang gần đây của bạn sẽ xuất hiện ở đây.",
        issue: "Sau khi truy cập mục công việc, các mục công việc gần đây của bạn sẽ xuất hiện ở đây.",
        default: "Bạn chưa có dự án gần đây nào.",
      },
      filters: {
        all: "Tất cả",
        projects: "Dự án",
        pages: "Trang",
        issues: "Mục công việc",
      },
    },
    new_at_plane: {
      title: "Tính năng mới của Plane",
    },
    quick_tutorial: {
      title: "Hướng dẫn nhanh",
    },
    widget: {
      reordered_successfully: "Đã sắp xếp lại tiện ích thành công.",
      reordering_failed: "Đã xảy ra lỗi khi sắp xếp lại tiện ích.",
    },
    manage_widgets: "Quản lý tiện ích",
    title: "Trang chủ",
    star_us_on_github: "Gắn sao cho chúng tôi trên GitHub",
    business_trial_banner: {
      title: "Bản dùng thử 14 ngày gói Business của bạn đã được kích hoạt!",
      description:
        "Khám phá tất cả các tính năng Business. Khi bạn sẵn sàng, hãy chọn đăng ký. Bạn sẽ không bị tính phí tự động.",
      trial_ends_today: "Bản dùng thử kết thúc hôm nay",
      trial_ends_in_days: "Bản dùng thử kết thúc sau {days} ngày",
      start_subscription: "Bắt đầu đăng ký",
      explore_business_features: "Khám phá tính năng Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL không hợp lệ",
        placeholder: "Nhập hoặc dán URL",
      },
      title: {
        text: "Tiêu đề hiển thị",
        placeholder: "Bạn muốn hiển thị liên kết này như thế nào",
      },
    },
  },
  common: {
    all: "Tất cả",
    no_items_in_this_group: "Không có mục nào trong nhóm này",
    drop_here_to_move: "Thả vào đây để di chuyển",
    states: "Trạng thái",
    state: "Trạng thái",
    state_groups: "Nhóm trạng thái",
    state_group: "Nhóm trạng thái",
    priorities: "Ưu tiên",
    priority: "Ưu tiên",
    team_project: "Dự án nhóm",
    project: "Dự án",
    cycle: "Chu kỳ",
    cycles: "Chu kỳ",
    module: "Mô-đun",
    modules: "Mô-đun",
    labels: "Nhãn",
    label: "Nhãn",
    assignees: "Người phụ trách",
    assignee: "Người phụ trách",
    created_by: "Người tạo",
    none: "Không có",
    link: "Liên kết",
    estimates: "Ước tính",
    estimate: "Ước tính",
    created_at: "Được tạo vào",
    updated_at: "Thời gian cập nhật",
    completed_at: "Hoàn thành vào",
    layout: "Bố cục",
    filters: "Bộ lọc",
    display: "Hiển thị",
    load_more: "Tải thêm",
    activity: "Hoạt động",
    analytics: "Phân tích",
    dates: "Ngày tháng",
    success: "Thành công!",
    something_went_wrong: "Đã xảy ra lỗi",
    error: {
      label: "Lỗi!",
      message: "Đã xảy ra lỗi. Vui lòng thử lại.",
    },
    group_by: "Nhóm theo",
    epic: "Sử thi",
    epics: "Epics",
    work_item: "Mục công việc",
    work_items: "Mục công việc",
    sub_work_item: "Mục công việc con",
    add: "Thêm",
    warning: "Cảnh báo",
    updating: "Đang cập nhật",
    adding: "Đang thêm",
    update: "Cập nhật",
    creating: "Đang tạo",
    create: "Tạo",
    cancel: "Hủy",
    description: "Mô tả",
    title: "Tiêu đề",
    attachment: "Tệp đính kèm",
    general: "Chung",
    features: "Tính năng",
    automation: "Tự động hóa",
    project_name: "Tên dự án",
    project_id: "ID dự án",
    project_timezone: "Múi giờ dự án",
    created_on: "Được tạo vào",
    update_project: "Cập nhật dự án",
    identifier_already_exists: "Định danh đã tồn tại",
    add_more: "Thêm nữa",
    defaults: "Mặc định",
    add_label: "Thêm nhãn",
    customize_time_range: "Tùy chỉnh khoảng thời gian",
    loading: "Đang tải",
    attachments: "Tệp đính kèm",
    property: "Thuộc tính",
    properties: "Thuộc tính",
    parent: "Mục cha",
    page: "Trang",
    remove: "Xóa",
    archiving: "Đang lưu trữ",
    archive: "Lưu trữ",
    access: {
      public: "Công khai",
      private: "Riêng tư",
    },
    done: "Hoàn thành",
    sub_work_items: "Mục công việc con",
    comment: "Bình luận",
    workspace_level: "Cấp không gian làm việc",
    order_by: {
      label: "Sắp xếp theo",
      manual: "Thủ công",
      last_created: "Mới tạo nhất",
      last_updated: "Mới cập nhật nhất",
      start_date: "Ngày bắt đầu",
      due_date: "Ngày hết hạn",
      asc: "Tăng dần",
      desc: "Giảm dần",
      updated_on: "Cập nhật vào",
    },
    sort: {
      asc: "Tăng dần",
      desc: "Giảm dần",
      created_on: "Thời gian tạo",
      updated_on: "Thời gian cập nhật",
    },
    comments: "Bình luận",
    updates: "Cập nhật",
    additional_updates: "Cập nhật bổ sung",
    clear_all: "Xóa tất cả",
    copied: "Đã sao chép!",
    link_copied: "Đã sao chép liên kết!",
    link_copied_to_clipboard: "Đã sao chép liên kết vào bảng tạm",
    copied_to_clipboard: "Đã sao chép liên kết mục công việc vào bảng tạm",
    branch_name_copied_to_clipboard: "Tên nhánh đã được sao chép vào bảng tạm",
    is_copied_to_clipboard: "Mục công việc đã được sao chép vào bảng tạm",
    no_links_added_yet: "Chưa có liên kết nào được thêm",
    add_link: "Thêm liên kết",
    links: "Liên kết",
    go_to_workspace: "Đi đến không gian làm việc",
    progress: "Tiến độ",
    optional: "Tùy chọn",
    join: "Tham gia",
    go_back: "Quay lại",
    continue: "Tiếp tục",
    resend: "Gửi lại",
    relations: "Mối quan hệ",
    errors: {
      default: {
        title: "Lỗi!",
        message: "Đã xảy ra lỗi. Vui lòng thử lại.",
      },
      required: "Trường này là bắt buộc",
      entity_required: "{entity} là bắt buộc",
      restricted_entity: "{entity} bị hạn chế",
    },
    update_link: "Cập nhật liên kết",
    attach: "Đính kèm",
    create_new: "Tạo mới",
    add_existing: "Thêm mục hiện có",
    type_or_paste_a_url: "Nhập hoặc dán URL",
    url_is_invalid: "URL không hợp lệ",
    display_title: "Tiêu đề hiển thị",
    link_title_placeholder: "Bạn muốn hiển thị liên kết này như thế nào",
    url: "URL",
    side_peek: "Xem lướt bên cạnh",
    modal: "Cửa sổ",
    full_screen: "Toàn màn hình",
    close_peek_view: "Đóng chế độ xem lướt",
    toggle_peek_view_layout: "Chuyển đổi bố cục xem lướt",
    options: "Tùy chọn",
    duration: "Thời lượng",
    today: "Hôm nay",
    week: "Tuần",
    month: "Tháng",
    quarter: "Quý",
    press_for_commands: "Nhấn '/' để sử dụng lệnh",
    click_to_add_description: "Nhấp để thêm mô tả",
    search: {
      label: "Tìm kiếm",
      placeholder: "Nhập nội dung tìm kiếm",
      no_matches_found: "Không tìm thấy kết quả phù hợp",
      no_matching_results: "Không có kết quả phù hợp",
    },
    actions: {
      edit: "Chỉnh sửa",
      make_a_copy: "Tạo bản sao",
      open_in_new_tab: "Mở trong tab mới",
      copy_link: "Sao chép liên kết",
      copy_branch_name: "Sao chép tên nhánh",
      archive: "Lưu trữ",
      delete: "Xóa",
      remove_relation: "Xóa mối quan hệ",
      subscribe: "Đăng ký",
      unsubscribe: "Hủy đăng ký",
      clear_sorting: "Xóa sắp xếp",
      show_weekends: "Hiển thị cuối tuần",
      enable: "Bật",
      disable: "Tắt",
    },
    name: "Tên",
    discard: "Hủy bỏ",
    confirm: "Xác nhận",
    confirming: "Đang xác nhận",
    read_the_docs: "Đọc tài liệu",
    default: "Mặc định",
    active: "Hoạt động",
    enabled: "Đã bật",
    disabled: "Đã tắt",
    mandate: "Ủy quyền",
    mandatory: "Bắt buộc",
    yes: "Có",
    no: "Không",
    please_wait: "Vui lòng đợi",
    enabling: "Đang bật",
    disabling: "Đang tắt",
    beta: "Phiên bản beta",
    or: "Hoặc",
    next: "Tiếp theo",
    back: "Quay lại",
    cancelling: "Đang hủy",
    configuring: "Đang cấu hình",
    clear: "Xóa",
    import: "Nhập",
    connect: "Kết nối",
    authorizing: "Đang xác thực",
    processing: "Đang xử lý",
    no_data_available: "Không có dữ liệu",
    from: "Từ {name}",
    authenticated: "Đã xác thực",
    select: "Chọn",
    upgrade: "Nâng cấp",
    add_seats: "Thêm vị trí",
    projects: "Dự án",
    workspace: "Không gian làm việc",
    workspaces: "Không gian làm việc",
    team: "Nhóm",
    teams: "Nhóm",
    entity: "Thực thể",
    entities: "Thực thể",
    task: "Nhiệm vụ",
    tasks: "Nhiệm vụ",
    section: "Phần",
    sections: "Phần",
    edit: "Chỉnh sửa",
    connecting: "Đang kết nối",
    connected: "Đã kết nối",
    disconnect: "Ngắt kết nối",
    disconnecting: "Đang ngắt kết nối",
    installing: "Đang cài đặt",
    install: "Cài đặt",
    reset: "Đặt lại",
    live: "Trực tiếp",
    change_history: "Lịch sử thay đổi",
    coming_soon: "Sắp ra mắt",
    member: "Thành viên",
    members: "Thành viên",
    you: "Bạn",
    upgrade_cta: {
      higher_subscription: "Nâng cấp lên gói cao hơn",
      talk_to_sales: "Liên hệ bộ phận bán hàng",
    },
    category: "Danh mục",
    categories: "Danh mục",
    saving: "Đang lưu",
    save_changes: "Lưu thay đổi",
    delete: "Xóa",
    deleting: "Đang xóa",
    pending: "Đang chờ xử lý",
    invite: "Mời",
    view: "Xem",
    deactivated_user: "Người dùng bị vô hiệu hóa",
    apply: "Áp dụng",
    applying: "Đang áp dụng",
    users: "Người dùng",
    admins: "Quản trị viên",
    guests: "Khách",
    on_track: "Đúng tiến độ",
    off_track: "Chệch hướng",
    at_risk: "Có nguy cơ",
    timeline: "Dòng thời gian",
    completion: "Hoàn thành",
    upcoming: "Sắp tới",
    completed: "Đã hoàn thành",
    in_progress: "Đang tiến hành",
    planned: "Đã lên kế hoạch",
    paused: "Tạm dừng",
    no_of: "Số lượng {entity}",
    resolved: "Đã giải quyết",
    worklogs: "Nhật ký công việc",
    project_updates: "Cập nhật dự án",
    overview: "Tổng quan",
    workflows: "Quy trình làm việc",
    templates: "Mẫu",
    members_and_teamspaces: "Thành viên và không gian nhóm",
    open_in_full_screen: "Mở {page} trong chế độ toàn màn hình",
  },
  chart: {
    x_axis: "Trục X",
    y_axis: "Trục Y",
    metric: "Chỉ số",
  },
  form: {
    title: {
      required: "Tiêu đề là bắt buộc",
      max_length: "Tiêu đề phải ít hơn {length} ký tự",
    },
  },
  entity: {
    grouping_title: "Nhóm {entity}",
    priority: "Ưu tiên {entity}",
    all: "Tất cả {entity}",
    drop_here_to_move: "Kéo thả vào đây để di chuyển {entity}",
    delete: {
      label: "Xóa {entity}",
      success: "Đã xóa {entity} thành công",
      failed: "Xóa {entity} thất bại",
    },
    update: {
      failed: "Cập nhật {entity} thất bại",
      success: "Đã cập nhật {entity} thành công",
    },
    link_copied_to_clipboard: "Đã sao chép liên kết {entity} vào bảng tạm",
    fetch: {
      failed: "Đã xảy ra lỗi khi tải {entity}",
    },
    add: {
      success: "Đã thêm {entity} thành công",
      failed: "Đã xảy ra lỗi khi thêm {entity}",
    },
    remove: {
      success: "Đã xóa {entity} thành công",
      failed: "Đã xảy ra lỗi khi xóa {entity}",
    },
  },
  epic: {
    all: "Tất cả sử thi",
    label: "{count, plural, one {sử thi} other {sử thi}}",
    new: "Sử thi mới",
    adding: "Đang thêm sử thi",
    create: {
      success: "Đã tạo sử thi thành công",
    },
    add: {
      press_enter: "Nhấn 'Enter' để thêm sử thi khác",
      label: "Thêm sử thi",
    },
    title: {
      label: "Tiêu đề sử thi",
      required: "Tiêu đề sử thi là bắt buộc",
    },
    archive: {
      description: `Chỉ những sử thi đã hoàn thành hoặc đã hủy
mới có thể được lưu trữ`,
      label: "Lưu trữ sử thi",
      confirm_message: "Bạn có chắc chắn muốn lưu trữ sử thi này? Tất cả sử thi đã lưu trữ có thể được khôi phục sau.",
      success: {
        label: "Lưu trữ thành công",
        message: "Kho lưu trữ của bạn có thể tìm thấy trong kho lưu trữ dự án.",
      },
      failed: {
        message: "Không thể lưu trữ sử thi. Vui lòng thử lại.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {mục công việc} other {mục công việc}}",
    all: "Tất cả mục công việc",
    edit: "Chỉnh sửa mục công việc",
    title: {
      label: "Tiêu đề mục công việc",
      required: "Tiêu đề mục công việc là bắt buộc",
    },
    add: {
      press_enter: "Nhấn 'Enter' để thêm mục công việc khác",
      label: "Thêm mục công việc",
      cycle: {
        failed: "Không thể thêm mục công việc vào chu kỳ. Vui lòng thử lại.",
        success: "{count, plural, one {Mục công việc} other {Mục công việc}} đã được thêm vào chu kỳ thành công.",
        loading: "Đang thêm {count, plural, one {mục công việc} other {mục công việc}} vào chu kỳ",
      },
      assignee: "Thêm người phụ trách",
      start_date: "Thêm ngày bắt đầu",
      due_date: "Thêm ngày hết hạn",
      parent: "Thêm mục công việc cha",
      sub_issue: "Thêm mục công việc con",
      relation: "Thêm mối quan hệ",
      link: "Thêm liên kết",
      existing: "Thêm mục công việc hiện có",
    },
    remove: {
      label: "Xóa mục công việc",
      cycle: {
        loading: "Đang xóa mục công việc khỏi chu kỳ",
        success: "Đã xóa mục công việc khỏi chu kỳ thành công.",
        failed: "Không thể xóa mục công việc khỏi chu kỳ. Vui lòng thử lại.",
      },
      module: {
        loading: "Đang xóa mục công việc khỏi mô-đun",
        success: "Đã xóa mục công việc khỏi mô-đun thành công.",
        failed: "Không thể xóa mục công việc khỏi mô-đun. Vui lòng thử lại.",
      },
      parent: {
        label: "Xóa mục công việc cha",
      },
    },
    new: "Mục công việc mới",
    adding: "Đang thêm mục công việc",
    create: {
      success: "Đã tạo mục công việc thành công",
    },
    priority: {
      urgent: "Khẩn cấp",
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp",
    },
    display: {
      properties: {
        label: "Hiển thị thuộc tính",
        id: "ID",
        issue_type: "Loại mục công việc",
        sub_issue_count: "Số lượng mục công việc con",
        attachment_count: "Số lượng tệp đính kèm",
        created_on: "Được tạo vào",
        sub_issue: "Mục công việc con",
        work_item_count: "Số lượng mục công việc",
      },
      extra: {
        show_sub_issues: "Hiển thị mục công việc con",
        show_empty_groups: "Hiển thị nhóm trống",
      },
    },
    layouts: {
      ordered_by_label: "Bố cục này được sắp xếp theo",
      list: "Danh sách",
      kanban: "Kanban",
      calendar: "Lịch",
      spreadsheet: "Bảng tính",
      gantt: "Dòng thời gian",
      title: {
        list: "Bố cục danh sách",
        kanban: "Bố cục kanban",
        calendar: "Bố cục lịch",
        spreadsheet: "Bố cục bảng tính",
        gantt: "Bố cục dòng thời gian",
      },
    },
    states: {
      active: "Hoạt động",
      backlog: "Tồn đọng",
    },
    comments: {
      placeholder: "Thêm bình luận",
      switch: {
        private: "Chuyển sang bình luận riêng tư",
        public: "Chuyển sang bình luận công khai",
      },
      create: {
        success: "Đã tạo bình luận thành công",
        error: "Không thể tạo bình luận. Vui lòng thử lại sau.",
      },
      update: {
        success: "Đã cập nhật bình luận thành công",
        error: "Không thể cập nhật bình luận. Vui lòng thử lại sau.",
      },
      remove: {
        success: "Đã xóa bình luận thành công",
        error: "Không thể xóa bình luận. Vui lòng thử lại sau.",
      },
      upload: {
        error: "Không thể tải lên tài nguyên. Vui lòng thử lại sau.",
      },
      copy_link: {
        success: "Liên kết bình luận đã được sao chép vào clipboard",
        error: "Lỗi khi sao chép liên kết bình luận. Vui lòng thử lại sau.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Mục công việc không tồn tại",
        description: "Mục công việc bạn đang tìm kiếm không tồn tại, đã được lưu trữ hoặc đã bị xóa.",
        primary_button: {
          text: "Xem các mục công việc khác",
        },
      },
    },
    sibling: {
      label: "Mục công việc cùng cấp",
    },
    archive: {
      description: `Chỉ những mục công việc đã hoàn thành hoặc đã hủy
có thể được lưu trữ`,
      label: "Lưu trữ mục công việc",
      confirm_message:
        "Bạn có chắc chắn muốn lưu trữ mục công việc này không? Tất cả mục công việc đã lưu trữ có thể được khôi phục sau.",
      success: {
        label: "Lưu trữ thành công",
        message: "Mục đã lưu trữ của bạn có thể được tìm thấy trong phần lưu trữ của dự án.",
      },
      failed: {
        message: "Không thể lưu trữ mục công việc. Vui lòng thử lại.",
      },
    },
    restore: {
      success: {
        title: "Khôi phục thành công",
        message: "Mục công việc của bạn có thể được tìm thấy trong mục công việc của dự án.",
      },
      failed: {
        message: "Không thể khôi phục mục công việc. Vui lòng thử lại.",
      },
    },
    relation: {
      relates_to: "Liên quan đến",
      duplicate: "Trùng lặp với",
      blocked_by: "Bị chặn bởi",
      blocking: "Đang chặn",
      start_before: "Bắt đầu Trước",
      start_after: "Bắt đầu Sau",
      finish_before: "Kết thúc Trước",
      finish_after: "Kết thúc Sau",
      implements: "Thực hiện",
      implemented_by: "Được thực hiện bởi",
    },
    copy_link: "Sao chép liên kết mục công việc",
    delete: {
      label: "Xóa mục công việc",
      error: "Đã xảy ra lỗi khi xóa mục công việc",
    },
    subscription: {
      actions: {
        subscribed: "Đã đăng ký mục công việc thành công",
        unsubscribed: "Đã hủy đăng ký mục công việc thành công",
      },
    },
    select: {
      error: "Vui lòng chọn ít nhất một mục công việc",
      empty: "Chưa chọn mục công việc",
      add_selected: "Thêm mục công việc đã chọn",
      select_all: "Chọn tất cả",
      deselect_all: "Bỏ chọn tất cả",
    },
    open_in_full_screen: "Mở mục công việc trong chế độ toàn màn hình",
    vote: {
      click_to_upvote: "Nhấp để bỏ phiếu thuận",
      click_to_downvote: "Nhấp để bỏ phiếu chống",
      click_to_view_upvotes: "Nhấp để xem phiếu thuận",
      click_to_view_downvotes: "Nhấp để xem phiếu chống",
    },
  },
  attachment: {
    error: "Không thể đính kèm tệp. Vui lòng tải lên lại.",
    only_one_file_allowed: "Chỉ có thể tải lên một tệp mỗi lần.",
    file_size_limit: "Kích thước tệp phải nhỏ hơn hoặc bằng {size}MB.",
    drag_and_drop: "Kéo và thả vào bất kỳ đâu để tải lên",
    delete: "Xóa tệp đính kèm",
  },
  label: {
    select: "Chọn nhãn",
    create: {
      success: "Đã tạo nhãn thành công",
      failed: "Tạo nhãn thất bại",
      already_exists: "Nhãn đã tồn tại",
      type: "Nhập để thêm nhãn mới",
    },
  },
  sub_work_item: {
    update: {
      success: "Đã cập nhật mục công việc con thành công",
      error: "Đã xảy ra lỗi khi cập nhật mục công việc con",
    },
    remove: {
      success: "Đã xóa mục công việc con thành công",
      error: "Đã xảy ra lỗi khi xóa mục công việc con",
    },
    empty_state: {
      sub_list_filters: {
        title: "Bạn không có mục công việc con nào phù hợp với các bộ lọc mà bạn đã áp dụng.",
        description: "Để xem tất cả các mục công việc con, hãy xóa tất cả các bộ lọc đã áp dụng.",
        action: "Xóa bộ lọc",
      },
      list_filters: {
        title: "Bạn không có mục công việc nào phù hợp với các bộ lọc mà bạn đã áp dụng.",
        description: "Để xem tất cả các mục công việc, hãy xóa tất cả các bộ lọc đã áp dụng.",
        action: "Xóa bộ lọc",
      },
    },
  },
  view: {
    label: "{count, plural, one {chế độ xem} other {chế độ xem}}",
    create: {
      label: "Tạo chế độ xem",
    },
    update: {
      label: "Cập nhật chế độ xem",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Đang chờ xử lý",
        description: "Đang chờ xử lý",
      },
      declined: {
        title: "Đã từ chối",
        description: "Đã từ chối",
      },
      snoozed: {
        title: "Đã tạm hoãn",
        description: "Còn lại {days, plural, one{# ngày} other{# ngày}}",
      },
      accepted: {
        title: "Đã chấp nhận",
        description: "Đã chấp nhận",
      },
      duplicate: {
        title: "Trùng lặp",
        description: "Trùng lặp",
      },
    },
    modals: {
      decline: {
        title: "Từ chối mục công việc",
        content: "Bạn có chắc chắn muốn từ chối mục công việc {value} không?",
      },
      delete: {
        title: "Xóa mục công việc",
        content: "Bạn có chắc chắn muốn xóa mục công việc {value} không?",
        success: "Đã xóa mục công việc thành công",
      },
    },
    errors: {
      snooze_permission: "Chỉ quản trị viên dự án mới có thể tạm hoãn/hủy tạm hoãn mục công việc",
      accept_permission: "Chỉ quản trị viên dự án mới có thể chấp nhận mục công việc",
      decline_permission: "Chỉ quản trị viên dự án mới có thể từ chối mục công việc",
    },
    actions: {
      accept: "Chấp nhận",
      decline: "Từ chối",
      snooze: "Tạm hoãn",
      unsnooze: "Hủy tạm hoãn",
      copy: "Sao chép liên kết mục công việc",
      delete: "Xóa",
      open: "Mở mục công việc",
      mark_as_duplicate: "Đánh dấu là trùng lặp",
      move: "Di chuyển {value} đến mục công việc dự án",
    },
    source: {
      "in-app": "Trong ứng dụng",
    },
    order_by: {
      created_at: "Thời gian tạo",
      updated_at: "Thời gian cập nhật",
      id: "ID",
    },
    label: "Thu thập",
    page_label: "{workspace} - Thu thập",
    modal: {
      title: "Tạo mục công việc thu thập",
    },
    tabs: {
      open: "Chưa xử lý",
      closed: "Đã xử lý",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Không có mục công việc chưa xử lý",
        description: "Tìm mục công việc chưa xử lý tại đây. Tạo mục công việc mới.",
      },
      sidebar_closed_tab: {
        title: "Không có mục công việc đã xử lý",
        description: "Tất cả mục công việc đã chấp nhận hoặc từ chối có thể được tìm thấy ở đây.",
      },
      sidebar_filter: {
        title: "Không có mục công việc phù hợp",
        description: "Không có mục công việc trong thu thập phù hợp với bộ lọc của bạn. Tạo mục công việc mới.",
      },
      detail: {
        title: "Chọn một mục công việc để xem chi tiết.",
      },
    },
  },
  workspace_creation: {
    heading: "Tạo không gian làm việc của bạn",
    subheading: "Để bắt đầu với Plane, bạn cần tạo hoặc tham gia một không gian làm việc.",
    form: {
      name: {
        label: "Đặt tên cho không gian làm việc của bạn",
        placeholder: "Một tên quen thuộc và dễ nhận diện luôn là tốt nhất.",
      },
      url: {
        label: "Thiết lập URL không gian làm việc của bạn",
        placeholder: "Nhập hoặc dán URL",
        edit_slug: "Bạn chỉ có thể chỉnh sửa phần định danh của URL",
      },
      organization_size: {
        label: "Có bao nhiêu người sẽ sử dụng không gian làm việc này?",
        placeholder: "Chọn một phạm vi",
      },
    },
    errors: {
      creation_disabled: {
        title: "Chỉ quản trị viên hệ thống của bạn mới có thể tạo không gian làm việc",
        description:
          "Nếu bạn biết địa chỉ email của quản trị viên hệ thống, hãy nhấp vào nút bên dưới để liên hệ với họ.",
        request_button: "Yêu cầu quản trị viên hệ thống",
      },
      validation: {
        name_alphanumeric: "Tên không gian làm việc chỉ có thể chứa (' '), ('-'), ('_') và các ký tự chữ số.",
        name_length: "Tên giới hạn trong 80 ký tự.",
        url_alphanumeric: "URL chỉ có thể chứa ('-') và các ký tự chữ số.",
        url_length: "URL giới hạn trong 48 ký tự.",
        url_already_taken: "URL không gian làm việc đã được sử dụng!",
      },
    },
    request_email: {
      subject: "Yêu cầu không gian làm việc mới",
      body: `Xin chào Quản trị viên hệ thống:

Vui lòng tạo một không gian làm việc mới có URL là [/workspace-name] cho [mục đích tạo không gian làm việc].

Cảm ơn,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Tạo không gian làm việc",
      loading: "Đang tạo không gian làm việc",
    },
    toast: {
      success: {
        title: "Thành công",
        message: "Đã tạo không gian làm việc thành công",
      },
      error: {
        title: "Lỗi",
        message: "Tạo không gian làm việc thất bại. Vui lòng thử lại.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Tổng quan về dự án, hoạt động và chỉ số",
        description:
          "Chào mừng đến với Plane, chúng tôi rất vui khi bạn ở đây. Tạo dự án đầu tiên của bạn và theo dõi mục công việc, trang này sẽ trở thành không gian giúp bạn tiến triển. Quản trị viên cũng sẽ thấy dự án giúp nhóm tiến triển.",
        primary_button: {
          text: "Xây dựng dự án đầu tiên của bạn",
          comic: {
            title: "Trong Plane, mọi thứ đều bắt đầu với dự án",
            description: "Dự án có thể là lộ trình sản phẩm, chiến dịch tiếp thị hoặc ra mắt xe mới.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Phân tích",
    page_label: "{workspace} - Phân tích",
    open_tasks: "Tổng nhiệm vụ đang mở",
    error: "Đã xảy ra lỗi khi truy xuất dữ liệu.",
    work_items_closed_in: "Mục công việc đã đóng trong",
    selected_projects: "Dự án đã chọn",
    total_members: "Tổng số thành viên",
    total_cycles: "Tổng số chu kỳ",
    total_modules: "Tổng số mô-đun",
    pending_work_items: {
      title: "Mục công việc đang chờ xử lý",
      empty_state: "Phân tích mục công việc đang chờ xử lý của đồng nghiệp sẽ hiển thị ở đây.",
    },
    work_items_closed_in_a_year: {
      title: "Mục công việc đã đóng trong một năm",
      empty_state: "Đóng mục công việc để xem phân tích dưới dạng biểu đồ.",
    },
    most_work_items_created: {
      title: "Tạo nhiều mục công việc nhất",
      empty_state: "Đồng nghiệp và số lượng mục công việc họ đã tạo sẽ hiển thị ở đây.",
    },
    most_work_items_closed: {
      title: "Đóng nhiều mục công việc nhất",
      empty_state: "Đồng nghiệp và số lượng mục công việc họ đã đóng sẽ hiển thị ở đây.",
    },
    tabs: {
      scope_and_demand: "Phạm vi và nhu cầu",
      custom: "Phân tích tùy chỉnh",
    },
    empty_state: {
      customized_insights: {
        description: "Các hạng mục công việc được giao cho bạn, phân loại theo trạng thái, sẽ hiển thị tại đây.",
        title: "Chưa có dữ liệu",
      },
      created_vs_resolved: {
        description: "Các hạng mục công việc được tạo và giải quyết theo thời gian sẽ hiển thị tại đây.",
        title: "Chưa có dữ liệu",
      },
      project_insights: {
        title: "Chưa có dữ liệu",
        description: "Các hạng mục công việc được giao cho bạn, phân loại theo trạng thái, sẽ hiển thị tại đây.",
      },
      general: {
        title:
          "Theo dõi tiến độ, khối lượng công việc và phân bổ. Phát hiện xu hướng, loại bỏ rào cản và tăng tốc công việc",
        description:
          "Xem phạm vi so với nhu cầu, ước tính và mở rộng phạm vi. Theo dõi hiệu suất của các thành viên trong nhóm và đội nhóm, đảm bảo dự án của bạn hoạt động đúng tiến độ.",
        primary_button: {
          text: "Bắt đầu dự án đầu tiên của bạn",
          comic: {
            title: "Phân tích hoạt động tốt nhất với Chu kỳ + Mô-đun",
            description:
              "Đầu tiên, giới hạn thời gian các vấn đề của bạn trong Chu kỳ và, nếu có thể, nhóm các vấn đề kéo dài hơn một chu kỳ vào Mô-đun. Kiểm tra cả hai trong điều hướng bên trái.",
          },
        },
      },
      cycle_progress: {
        title: "Chưa có dữ liệu",
        description:
          "Phân tích tiến độ chu kỳ sẽ hiển thị ở đây. Thêm các hạng mục công việc vào chu kỳ để bắt đầu theo dõi tiến độ.",
      },
      module_progress: {
        title: "Chưa có dữ liệu",
        description:
          "Phân tích tiến độ mô-đun sẽ hiển thị ở đây. Thêm các hạng mục công việc vào mô-đun để bắt đầu theo dõi tiến độ.",
      },
      intake_trends: {
        title: "Chưa có dữ liệu",
        description:
          "Phân tích xu hướng intake sẽ hiển thị ở đây. Thêm các hạng mục công việc vào intake để bắt đầu theo dõi xu hướng.",
      },
    },
    created_vs_resolved: "Đã tạo vs Đã giải quyết",
    customized_insights: "Thông tin chi tiết tùy chỉnh",
    backlog_work_items: "{entity} tồn đọng",
    active_projects: "Dự án đang hoạt động",
    trend_on_charts: "Xu hướng trên biểu đồ",
    all_projects: "Tất cả dự án",
    summary_of_projects: "Tóm tắt dự án",
    project_insights: "Thông tin chi tiết dự án",
    started_work_items: "{entity} đã bắt đầu",
    total_work_items: "Tổng số {entity}",
    total_projects: "Tổng số dự án",
    total_admins: "Tổng số quản trị viên",
    total_users: "Tổng số người dùng",
    total_intake: "Tổng thu",
    un_started_work_items: "{entity} chưa bắt đầu",
    total_guests: "Tổng số khách",
    completed_work_items: "{entity} đã hoàn thành",
    total: "Tổng số {entity}",
    projects_by_status: "Dự án theo trạng thái",
    active_users: "Người dùng hoạt động",
    intake_trends: "Xu hướng tiếp nhận",
    workitem_resolved_vs_pending: "Mục công việc đã giải quyết vs đang chờ",
    upgrade_to_plan: "Nâng cấp lên {plan} để mở khóa {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {dự án} other {dự án}}",
    create: {
      label: "Thêm dự án",
    },
    network: {
      private: {
        title: "Riêng tư",
        description: "Chỉ truy cập bằng lời mời",
      },
      public: {
        title: "Công khai",
        description: "Bất kỳ ai trong không gian làm việc ngoại trừ khách đều có thể tham gia",
      },
    },
    error: {
      permission: "Bạn không có quyền thực hiện thao tác này.",
      cycle_delete: "Xóa chu kỳ thất bại",
      module_delete: "Xóa mô-đun thất bại",
      issue_delete: "Xóa mục công việc thất bại",
    },
    state: {
      backlog: "Tồn đọng",
      unstarted: "Chưa bắt đầu",
      started: "Đang tiến hành",
      completed: "Đã hoàn thành",
      cancelled: "Đã hủy",
    },
    sort: {
      manual: "Thủ công",
      name: "Tên",
      created_at: "Ngày tạo",
      members_length: "Số lượng thành viên",
    },
    scope: {
      my_projects: "Dự án của tôi",
      archived_projects: "Đã lưu trữ",
    },
    common: {
      months_count: "{months, plural, one{# tháng} other{# tháng}}",
      days_count: "{days, plural, one{# ngày} other{# ngày}}",
    },
    empty_state: {
      general: {
        title: "Không có dự án hoạt động",
        description:
          "Coi mỗi dự án như là cấp cha của công việc định hướng mục tiêu. Dự án là nơi chứa mục công việc, chu kỳ và mô-đun, cùng với đồng nghiệp giúp bạn đạt được mục tiêu. Tạo dự án mới hoặc lọc dự án đã lưu trữ.",
        primary_button: {
          text: "Bắt đầu dự án đầu tiên của bạn",
          comic: {
            title: "Trong Plane, mọi thứ đều bắt đầu với dự án",
            description: "Dự án có thể là lộ trình sản phẩm, chiến dịch tiếp thị hoặc ra mắt xe mới.",
          },
        },
      },
      no_projects: {
        title: "Không có dự án",
        description:
          "Để tạo mục công việc hoặc quản lý công việc của bạn, bạn cần tạo dự án hoặc trở thành một phần của dự án.",
        primary_button: {
          text: "Bắt đầu dự án đầu tiên của bạn",
          comic: {
            title: "Trong Plane, mọi thứ đều bắt đầu với dự án",
            description: "Dự án có thể là lộ trình sản phẩm, chiến dịch tiếp thị hoặc ra mắt xe mới.",
          },
        },
      },
      filter: {
        title: "Không có dự án phù hợp",
        description: `Không phát hiện dự án nào phù hợp với điều kiện tìm kiếm.
Tạo dự án mới.`,
      },
      search: {
        description: `Không phát hiện dự án nào phù hợp với điều kiện tìm kiếm.
Tạo dự án mới`,
      },
    },
  },
  workspace_views: {
    add_view: "Thêm chế độ xem",
    empty_state: {
      "all-issues": {
        title: "Không có mục công việc trong dự án",
        description:
          "Dự án đầu tiên hoàn thành! Bây giờ, hãy chia nhỏ công việc của bạn thành các mục công việc có thể theo dõi. Hãy bắt đầu nào!",
        primary_button: {
          text: "Tạo mục công việc mới",
        },
      },
      assigned: {
        title: "Chưa có mục công việc",
        description: "Mục công việc được giao cho bạn có thể được theo dõi tại đây.",
        primary_button: {
          text: "Tạo mục công việc mới",
        },
      },
      created: {
        title: "Chưa có mục công việc",
        description: "Tất cả mục công việc bạn tạo sẽ xuất hiện ở đây, theo dõi chúng trực tiếp tại đây.",
        primary_button: {
          text: "Tạo mục công việc mới",
        },
      },
      subscribed: {
        title: "Chưa có mục công việc",
        description: "Đăng ký mục công việc bạn quan tâm, theo dõi tất cả chúng tại đây.",
      },
      "custom-view": {
        title: "Chưa có mục công việc",
        description: "Mục công việc phù hợp với bộ lọc, theo dõi tất cả chúng tại đây.",
      },
    },
    delete_view: {
      title: "Bạn có chắc chắn muốn xóa chế độ xem này không?",
      content:
        "Nếu bạn xác nhận, tất cả các tùy chọn sắp xếp, lọc và hiển thị + bố cục mà bạn đã chọn cho chế độ xem này sẽ bị xóa vĩnh viễn mà không có cách nào khôi phục.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Đổi email",
        description: "Nhập địa chỉ email mới để nhận liên kết xác minh.",
        toasts: {
          success_title: "Thành công!",
          success_message: "Email đã được cập nhật. Vui lòng đăng nhập lại.",
        },
        form: {
          email: {
            label: "Email mới",
            placeholder: "Nhập email của bạn",
            errors: {
              required: "Email là bắt buộc",
              invalid: "Email không hợp lệ",
              exists: "Email đã tồn tại. Vui lòng dùng email khác.",
              validation_failed: "Xác thực email thất bại. Thử lại.",
            },
          },
          code: {
            label: "Mã duy nhất",
            placeholder: "123456",
            helper_text: "Mã xác minh đã được gửi tới email mới của bạn.",
            errors: {
              required: "Mã duy nhất là bắt buộc",
              invalid: "Mã xác minh không hợp lệ. Thử lại.",
            },
          },
        },
        actions: {
          continue: "Tiếp tục",
          confirm: "Xác nhận",
          cancel: "Hủy",
        },
        states: {
          sending: "Đang gửi…",
        },
      },
    },
    notifications: {
      select_default_view: "Chọn chế độ xem mặc định",
      compact: "Gọn",
      full: "Toàn màn hình",
    },
  },
  workspace_settings: {
    label: "Cài đặt không gian làm việc",
    page_label: "{workspace} - Cài đặt chung",
    key_created: "Đã tạo khóa",
    copy_key:
      "Sao chép và lưu khóa này trong Plane Pages. Bạn sẽ không thể thấy khóa này sau khi đóng. Tệp CSV chứa khóa đã được tải xuống.",
    token_copied: "Đã sao chép token vào bảng tạm.",
    settings: {
      general: {
        title: "Chung",
        upload_logo: "Tải lên logo",
        edit_logo: "Chỉnh sửa logo",
        name: "Tên không gian làm việc",
        company_size: "Quy mô công ty",
        url: "URL không gian làm việc",
        workspace_timezone: "Múi giờ không gian làm việc",
        update_workspace: "Cập nhật không gian làm việc",
        delete_workspace: "Xóa không gian làm việc này",
        delete_workspace_description:
          "Khi xóa không gian làm việc, tất cả dữ liệu và tài nguyên trong không gian làm việc đó sẽ bị xóa vĩnh viễn và không thể khôi phục.",
        delete_btn: "Xóa không gian làm việc này",
        delete_modal: {
          title: "Bạn có chắc chắn muốn xóa không gian làm việc này không?",
          description: "Bạn hiện đang dùng thử gói trả phí của chúng tôi. Vui lòng hủy dùng thử trước khi tiếp tục.",
          dismiss: "Đóng",
          cancel: "Hủy dùng thử",
          success_title: "Đã xóa không gian làm việc.",
          success_message: "Sắp chuyển hướng đến trang hồ sơ của bạn.",
          error_title: "Thao tác thất bại.",
          error_message: "Vui lòng thử lại.",
        },
        errors: {
          name: {
            required: "Tên là bắt buộc",
            max_length: "Tên không gian làm việc không nên vượt quá 80 ký tự",
          },
          company_size: {
            required: "Quy mô công ty là bắt buộc",
            select_a_range: "Chọn quy mô tổ chức",
          },
        },
      },
      members: {
        title: "Thành viên",
        add_member: "Thêm thành viên",
        pending_invites: "Lời mời đang chờ xử lý",
        invitations_sent_successfully: "Đã gửi lời mời thành công",
        leave_confirmation:
          "Bạn có chắc chắn muốn rời khỏi không gian làm việc này không? Bạn sẽ không thể truy cập không gian làm việc này nữa. Hành động này không thể hoàn tác.",
        details: {
          full_name: "Tên đầy đủ",
          display_name: "Tên hiển thị",
          email_address: "Địa chỉ email",
          account_type: "Loại tài khoản",
          authentication: "Xác thực",
          joining_date: "Ngày tham gia",
        },
        modal: {
          title: "Mời người cộng tác",
          description: "Mời người cộng tác trong không gian làm việc của bạn.",
          button: "Gửi lời mời",
          button_loading: "Đang gửi lời mời",
          placeholder: "name@company.com",
          errors: {
            required: "Chúng tôi cần một địa chỉ email để mời họ.",
            invalid: "Email không hợp lệ",
          },
        },
      },
      billing_and_plans: {
        title: "Thanh toán và Kế hoạch",
        current_plan: "Kế hoạch hiện tại",
        free_plan: "Bạn đang sử dụng kế hoạch miễn phí",
        view_plans: "Xem kế hoạch",
      },
      exports: {
        title: "Xuất",
        exporting: "Đang xuất",
        previous_exports: "Xuất trước đây",
        export_separate_files: "Xuất dữ liệu thành các tệp riêng biệt",
        filters_info: "Áp dụng bộ lọc để xuất các mục công việc cụ thể dựa trên tiêu chí của bạn.",
        modal: {
          title: "Xuất đến",
          toasts: {
            success: {
              title: "Xuất thành công",
              message: "Bạn có thể tải xuống {entity} đã xuất từ phần xuất trước đây",
            },
            error: {
              title: "Xuất thất bại",
              message: "Xuất không thành công. Vui lòng thử lại.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhooks",
        add_webhook: "Thêm webhook",
        modal: {
          title: "Tạo webhook",
          details: "Chi tiết Webhook",
          payload: "URL tải",
          question: "Bạn muốn những sự kiện nào kích hoạt webhook này?",
          error: "URL là bắt buộc",
        },
        secret_key: {
          title: "Khóa bí mật",
          message: "Tạo token để đăng nhập tải webhook",
        },
        options: {
          all: "Gửi tất cả",
          individual: "Chọn từng sự kiện",
        },
        toasts: {
          created: {
            title: "Đã tạo Webhook",
            message: "Webhook đã được tạo thành công",
          },
          not_created: {
            title: "Chưa tạo Webhook",
            message: "Không thể tạo webhook",
          },
          updated: {
            title: "Đã cập nhật Webhook",
            message: "Webhook đã được cập nhật thành công",
          },
          not_updated: {
            title: "Chưa cập nhật Webhook",
            message: "Không thể cập nhật webhook",
          },
          removed: {
            title: "Đã xóa Webhook",
            message: "Webhook đã được xóa thành công",
          },
          not_removed: {
            title: "Chưa xóa Webhook",
            message: "Không thể xóa webhook",
          },
          secret_key_copied: {
            message: "Đã sao chép khóa bí mật vào bảng tạm.",
          },
          secret_key_not_copied: {
            message: "Đã xảy ra lỗi khi sao chép khóa bí mật.",
          },
        },
      },
      api_tokens: {
        heading: "Token API",
        description: "Tạo token API bảo mật để tích hợp dữ liệu của bạn với các hệ thống và ứng dụng bên ngoài.",
        title: "Token API",
        add_token: "Thêm token truy cập",
        create_token: "Tạo token",
        never_expires: "Không bao giờ hết hạn",
        generate_token: "Tạo token",
        generating: "Đang tạo",
        delete: {
          title: "Xóa token API",
          description:
            "Bất kỳ ứng dụng nào sử dụng token này sẽ không thể truy cập dữ liệu Plane nữa. Hành động này không thể hoàn tác.",
          success: {
            title: "Thành công!",
            message: "Đã xóa token API thành công",
          },
          error: {
            title: "Lỗi!",
            message: "Không thể xóa token API",
          },
        },
      },
      integrations: {
        title: "Tích hợp",
        page_title: "Làm việc với dữ liệu Plane của bạn trong các ứng dụng có sẵn hoặc ứng dụng riêng của bạn.",
        page_description: "Xem tất cả các tích hợp được workspace này hoặc bạn đang sử dụng.",
      },
      imports: {
        title: "Nhập dữ liệu",
      },
      worklogs: {
        title: "Nhật ký công việc",
      },
      group_syncing: {
        title: "Đồng bộ nhóm",
        heading: "Đồng bộ nhóm",
        description:
          "Liên kết các nhóm nhà cung cấp danh tính với dự án và vai trò. Quyền truy cập người dùng được cập nhật tự động khi thành viên nhóm thay đổi trong IdP của bạn, đơn giản hóa quy trình onboarding và offboarding.",
        enable: {
          title: "Bật đồng bộ nhóm",
          description: "Tự động thêm người dùng vào dự án dựa trên các nhóm nhà cung cấp danh tính.",
        },
        config: {
          title: "Cấu hình đồng bộ nhóm",
          description: "Thiết lập cách các nhóm nhà cung cấp danh tính được ánh xạ tới dự án và vai trò.",
          sync_on_login: {
            title: "Đồng bộ khi đăng nhập",
            description: "Cập nhật thành viên nhóm và quyền truy cập dự án khi người dùng đăng nhập.",
          },
          sync_offline: {
            title: "Đồng bộ ngoại tuyến",
            description: "Chạy đồng bộ mỗi sáu giờ tự động, không cần chờ người dùng đăng nhập.",
          },
          auto_remove: {
            title: "Tự động xóa",
            description: "Tự động xóa người dùng khỏi dự án khi họ không còn khớp với nhóm.",
          },
          group_attribute_key: {
            title: "Khóa thuộc tính nhóm",
            description: "Thuộc tính nhà cung cấp danh tính dùng để xác định và đồng bộ nhóm người dùng.",
            placeholder: "Nhóm",
          },
        },
        group_mapping: {
          title: "Ánh xạ nhóm",
          description: "Liên kết các nhóm nhà cung cấp danh tính với dự án và vai trò.",
          button_text: "Thêm đồng bộ nhóm mới",
        },
        toast: {
          updating: "Đang cập nhật tính năng đồng bộ nhóm",
          success: "Tính năng đồng bộ nhóm đã được cập nhật thành công.",
          error: "Cập nhật tính năng đồng bộ nhóm thất bại!",
        },
        delete_modal: {
          title: "Xóa đồng bộ nhóm",
          content:
            "Người dùng mới từ nhóm danh tính này sẽ không còn được thêm vào dự án. Người dùng đã thêm sẽ giữ vai trò hiện tại của họ.",
        },
        modal: {
          idp_group_name: {
            text: "Nhóm người dùng",
            required: "Nhóm người dùng là bắt buộc",
            placeholder: "Nhập tên nhóm IdP",
          },
          project: {
            text: "Dự án",
            required: "Dự án là bắt buộc",
            placeholder: "Chọn dự án",
          },
          default_role: {
            text: "Vai trò dự án",
            required: "Vai trò dự án là bắt buộc",
            placeholder: "Chọn vai trò dự án",
          },
        },
      },
      identity: {
        title: "Danh tính",
        heading: "Danh tính",
        description: "Cấu hình miền của bạn và bật Đăng nhập một lần",
      },
      project_states: {
        title: "Trạng thái dự án",
      },
      projects: {
        title: "Dự án",
        description: "Quản lý trạng thái dự án, bật nhãn dự án và các cấu hình khác.",
        tabs: {
          states: "Trạng thái dự án",
          labels: "Nhãn dự án",
        },
      },
      teamspaces: {
        title: "Không gian nhóm",
      },
      initiatives: {
        title: "Sáng kiến",
      },
      customers: {
        title: "Khách hàng",
      },
      releases: {
        title: "Bản phát hành",
        update_release: "Cập nhật bản phát hành",
        create_release: "Tạo bản phát hành",
        errors: {
          release_not_found: "Bản phát hành bạn đang tìm không tồn tại.",
          unknown: "Đã xảy ra lỗi. Vui lòng thử lại.",
        },
      },

      cancel_trial: {
        title: "Hủy bỏ dùng thử trước.",
        description:
          "Bạn đang có gói dùng thử cho một trong các gói trả phí của chúng tôi. Vui lòng hủy nó trước để tiếp tục.",
        dismiss: "Bỏ qua",
        cancel: "Hủy dùng thử",
        cancel_success_title: "Đã hủy dùng thử.",
        cancel_success_message: "Bây giờ bạn có thể xóa workspace.",
        cancel_error_title: "Điều đó không hoạt động.",
        cancel_error_message: "Vui lòng thử lại.",
      },
      applications: {
        title: "Ứng dụng",
        applicationId_copied: "ID ứng dụng đã được sao chép vào clipboard",
        clientId_copied: "ID khách hàng đã được sao chép vào clipboard",
        clientSecret_copied: "Secret khách hàng đã được sao chép vào clipboard",
        third_party_apps: "Ứng dụng thứ ba",
        your_apps: "Ứng dụng của bạn",
        connect: "Kết nối",
        connected: "Đã kết nối",
        install: "Cài đặt",
        installed: "Đã cài đặt",
        configure: "Cấu hình",
        app_available: "Bạn đã làm cho ứng dụng này có sẵn để sử dụng với một workspace Plane",
        app_available_description: "Kết nối một workspace Plane để bắt đầu sử dụng nó",
        client_id_and_secret: "ID khách hàng và Secret",
        client_id_and_secret_description:
          "Sao chép và lưu khóa bí mật này trong Pages. Bạn không thể nhìn thấy khóa này lại sau khi bạn đóng.",
        client_id_and_secret_download: "Bạn có thể tải xuống một CSV với khóa từ đây.",
        application_id: "ID ứng dụng",
        client_id: "ID khách hàng",
        client_secret: "Secret khách hàng",
        export_as_csv: "Xuất ra CSV",
        slug_already_exists: "Slug đã tồn tại",
        failed_to_create_application: "Không thể tạo ứng dụng",
        upload_logo: "Tải lên Logo",
        app_name_title: "Bạn sẽ gọi ứng dụng này là gì",
        app_name_error: "Tên ứng dụng là bắt buộc",
        app_short_description_title: "Đưa ra một mô tả ngắn cho ứng dụng này",
        app_short_description_error: "Mô tả ngắn ứng dụng là bắt buộc",
        app_description_title: {
          label: "Mô tả dài",
          placeholder: "Viết mô tả dài cho marketplace. Nhấn '/' để xem lệnh.",
        },
        authorization_grant_type: {
          title: "Loại kết nối",
          description:
            "Chọn liệu ứng dụng của bạn nên được cài đặt một lần cho không gian làm việc hay để mỗi người dùng kết nối tài khoản riêng của họ",
        },
        app_description_error: "Mô tả ứng dụng là bắt buộc",
        app_slug_title: "Slug ứng dụng",
        app_slug_error: "Slug ứng dụng là bắt buộc",
        app_maker_title: "Người tạo ứng dụng",
        app_maker_error: "Người tạo ứng dụng là bắt buộc",
        webhook_url_title: "URL Webhook",
        webhook_url_error: "URL Webhook là bắt buộc",
        invalid_webhook_url_error: "URL Webhook không hợp lệ",
        redirect_uris_title: "Redirect URIs",
        redirect_uris_error: "Redirect URIs là bắt buộc",
        invalid_redirect_uris_error: "Redirect URIs không hợp lệ",
        redirect_uris_description:
          "Nhập các URI cách nhau bởi dấu cách mà ứng dụng sẽ chuyển hướng sau khi người dùng e.g https://example.com https://example.com/",
        authorized_javascript_origins_title: "Authorized Javascript Origins",
        authorized_javascript_origins_error: "Authorized Javascript Origins là bắt buộc",
        invalid_authorized_javascript_origins_error: "Authorized Javascript Origins không hợp lệ",
        authorized_javascript_origins_description:
          "Nhập các nguồn cách nhau bởi dấu cách mà ứng dụng sẽ được phép thực hiện yêu cầu e.g app.com example.com",
        create_app: "Tạo ứng dụng",
        update_app: "Cập nhật ứng dụng",
        regenerate_client_secret_description:
          "Tạo lại khóa bí mật. Nếu bạn tạo lại khóa, bạn có thể sao chép khóa hoặc tải xuống nó thành một tệp CSV ngay sau đó.",
        regenerate_client_secret: "Tạo lại khóa bí mật",
        regenerate_client_secret_confirm_title: "Bạn có chắc chắn muốn tạo lại khóa bí mật?",
        regenerate_client_secret_confirm_description:
          "Ứng dụng sử dụng khóa này sẽ ngừng hoạt động. Bạn sẽ cần cập nhật khóa trong ứng dụng.",
        regenerate_client_secret_confirm_cancel: "Hủy bỏ",
        regenerate_client_secret_confirm_regenerate: "Regenerate",
        read_only_access_to_workspace: "Truy cập chỉ đọc vào workspace của bạn",
        write_access_to_workspace: "Truy cập viết vào workspace của bạn",
        read_only_access_to_user_profile: "Truy cập chỉ đọc vào hồ sơ người dùng của bạn",
        write_access_to_user_profile: "Truy cập viết vào hồ sơ người dùng của bạn",
        connect_app_to_workspace: "Kết nối {app} vào workspace của bạn {workspace}",
        user_permissions: "Quyền người dùng",
        user_permissions_description: "Quyền người dùng được sử dụng để cấp quyền truy cập vào hồ sơ người dùng.",
        workspace_permissions: "Quyền workspace",
        workspace_permissions_description: "Quyền workspace được sử dụng để cấp quyền truy cập vào workspace.",
        with_the_permissions: "với quyền",
        app_consent_title: "{app} đang yêu cầu truy cập vào workspace Plane của bạn và hồ sơ.",
        choose_workspace_to_connect_app_with: "Chọn một workspace để kết nối ứng dụng",
        app_consent_workspace_permissions_title: "{app} muốn",
        app_consent_user_permissions_title:
          "{app} cũng có thể yêu cầu quyền của người dùng cho các tài nguyên sau. Các quyền này sẽ được yêu cầu và được cấp phép chỉ bởi một người dùng.",
        app_consent_accept_title: "Bằng cách chấp nhận, bạn",
        app_consent_accept_1:
          "Cấp quyền truy cập vào dữ liệu Plane của bạn ở bất kỳ đâu bạn có thể sử dụng ứng dụng bên trong hoặc ngoài Plane",
        app_consent_accept_2: "Đồng ý với Chính sách bảo mật và Điều khoản sử dụng của {app}",
        accepting: "Đang chấp nhận...",
        accept: "Chấp nhận",
        categories: "Danh mục",
        select_app_categories: "Chọn danh mục ứng dụng",
        categories_title: "Danh mục",
        categories_error: "Danh mục là bắt buộc",
        invalid_categories_error: "Danh mục không hợp lệ",
        categories_description: "Chọn các danh mục phù hợp nhất với ứng dụng",
        supported_plans: "Gói được Hỗ trợ",
        supported_plans_description:
          "Chọn các gói không gian làm việc có thể cài đặt ứng dụng này. Để trống để cho phép tất cả các gói.",
        select_plans: "Chọn Gói",
        privacy_policy_url_title: "URL Chính sách bảo mật",
        privacy_policy_url_error: "URL Chính sách bảo mật là bắt buộc",
        invalid_privacy_policy_url_error: "URL Chính sách bảo mật không hợp lệ",
        terms_of_service_url_title: "URL Điều khoản sử dụng",
        terms_of_service_url_error: "URL Điều khoản sử dụng là bắt buộc",
        invalid_terms_of_service_url_error: "URL Điều khoản sử dụng không hợp lệ",
        support_url_title: "URL Hỗ trợ",
        support_url_error: "URL Hỗ trợ là bắt buộc",
        invalid_support_url_error: "URL Hỗ trợ không hợp lệ",
        video_url_title: "URL Video",
        video_url_error: "URL Video là bắt buộc",
        invalid_video_url_error: "URL Video không hợp lệ",
        setup_url_title: "URL Cài đặt",
        setup_url_error: "URL Cài đặt là bắt buộc",
        invalid_setup_url_error: "URL Cài đặt không hợp lệ",
        configuration_url_title: "URL Cấu hình",
        configuration_url_error: "URL Cấu hình là bắt buộc",
        invalid_configuration_url_error: "URL Cấu hình không hợp lệ",
        contact_email_title: "Email Liên hệ",
        contact_email_error: "Email Liên hệ là bắt buộc",
        invalid_contact_email_error: "Email Liên hệ không hợp lệ",
        upload_attachments: "Tải lên tệp đính kèm",
        uploading_images: "Tải lên {count, plural, one {hình ảnh} other {hình ảnh}}",
        drop_images_here: "Đặt hình ảnh vào đây",
        click_to_upload_images: "Nhấp để tải lên hình ảnh",
        invalid_file_or_exceeds_size_limit: "Tệp không hợp lệ hoặc vượt quá giới hạn kích thước ({size} MB)",
        uploading: "Đang tải lên...",
        upload_and_save: "Tải lên và lưu",
        app_credentials_regenrated: {
          title: "Thông tin xác thực ứng dụng đã được tạo lại thành công",
          description: "Thay thế client secret ở mọi nơi nó được sử dụng. Secret trước đó không còn hợp lệ.",
        },
        app_created: {
          title: "Ứng dụng đã được tạo thành công",
          description: "Sử dụng thông tin xác thực để cài đặt ứng dụng trong không gian làm việc Plane",
        },
        installed_apps: "Ứng dụng đã cài đặt",
        all_apps: "Tất cả ứng dụng",
        internal_apps: "Ứng dụng nội bộ",
        website: {
          title: "Trang web",
          description: "Liên kết đến trang web của ứng dụng của bạn.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Trình tạo ứng dụng",
          description: "Người hoặc tổ chức tạo ra ứng dụng.",
        },
        setup_url: {
          label: "URL thiết lập",
          description: "Người dùng sẽ được chuyển hướng đến URL này khi họ cài đặt ứng dụng.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL webhook",
          description:
            "Đây là nơi chúng tôi sẽ gửi các sự kiện và cập nhật webhook từ các workspace nơi ứng dụng của bạn được cài đặt.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI chuyển hướng (cách nhau bằng dấu cách)",
          description: "Người dùng sẽ được chuyển hướng đến đường dẫn này sau khi xác thực với Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Ứng dụng này chỉ có thể được cài đặt sau khi quản trị viên workspace cài đặt nó. Liên hệ với quản trị viên workspace của bạn để tiếp tục.",
        enable_app_mentions: "Bật đề cập ứng dụng",
        enable_app_mentions_tooltip:
          "Khi bật tính năng này, người dùng có thể đề cập hoặc gán Work Items cho ứng dụng này.",
        scopes: "Phạm vi",
        select_scopes: "Chọn phạm vi",
        read_access_to: "Quyền truy cập chỉ đọc tới",
        write_access_to: "Quyền truy cập ghi tới",
        global_permission_expiration:
          "Phạm vi toàn cục sắp hết hạn. Thay vào đó hãy dùng phạm vi chi tiết. Ví dụ: dùng project:read thay vì đọc toàn cục.",
        selected_scopes: "Đã chọn {count}",
        scopes_and_permissions: "Phạm vi & Quyền",
        read: "Đọc",
        write: "Ghi",
        scope_description: {
          projects: "Truy cập dự án và mọi thực thể liên quan đến dự án",
          wiki: "Truy cập wiki và mọi thực thể liên quan đến wiki",
          customers: "Truy cập khách hàng và mọi thực thể liên quan",
          initiatives: "Truy cập sáng kiến và mọi thực thể liên quan",
          workspaces: "Truy cập không gian làm việc và mọi thực thể liên quan",
          stickies: "Truy cập ghi chú dán và mọi thực thể liên quan",
          teamspaces: "Truy cập không gian nhóm và mọi thực thể liên quan",
          profile: "Truy cập thông tin hồ sơ người dùng",
          agents: "Truy cập vào agents và tất cả các thực thể liên quan đến agent",
          assets: "Truy cập vào tài sản và tất cả các thực thể liên quan đến tài sản",
        },
        build_your_own_app: "Tạo ứng dụng của riêng bạn",
        edit_app_details: "Chỉnh sửa chi tiết ứng dụng",
        internal: "Nội bộ",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Xem công việc của bạn trở nên thông minh và nhanh hơn với AI được kết nối một cách tự nhiên với công việc và cơ sở kiến thức của bạn.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "Chưa tạo token API",
        description:
          "API Plane có thể được sử dụng để tích hợp dữ liệu Plane của bạn với bất kỳ hệ thống bên ngoài nào. Tạo token để bắt đầu.",
      },
      webhooks: {
        title: "Chưa thêm webhook",
        description: "Tạo webhook để nhận cập nhật theo thời gian thực và tự động hóa hành động.",
      },
      exports: {
        title: "Chưa có xuất dữ liệu",
        description: "Mỗi khi xuất, bạn sẽ có một bản sao ở đây để tham khảo.",
      },
      imports: {
        title: "Chưa có nhập dữ liệu",
        description: "Tìm tất cả các lần nhập trước đây và tải xuống chúng tại đây.",
      },
    },
  },
  profile: {
    label: "Hồ sơ",
    page_label: "Công việc của bạn",
    work: "Công việc",
    details: {
      joined_on: "Tham gia vào",
      time_zone: "Múi giờ",
    },
    stats: {
      workload: "Khối lượng công việc",
      overview: "Tổng quan",
      created: "Mục công việc đã tạo",
      assigned: "Mục công việc đã giao",
      subscribed: "Mục công việc đã đăng ký",
      state_distribution: {
        title: "Mục công việc theo trạng thái",
        empty: "Tạo mục công việc để xem phân loại theo trạng thái trong biểu đồ để phân tích tốt hơn.",
      },
      priority_distribution: {
        title: "Mục công việc theo mức độ ưu tiên",
        empty: "Tạo mục công việc để xem phân loại theo mức độ ưu tiên trong biểu đồ để phân tích tốt hơn.",
      },
      recent_activity: {
        title: "Hoạt động gần đây",
        empty: "Chúng tôi không tìm thấy dữ liệu. Vui lòng kiểm tra đầu vào của bạn",
        button: "Tải xuống hoạt động hôm nay",
        button_loading: "Đang tải xuống",
      },
    },
    actions: {
      profile: "Hồ sơ",
      security: "Bảo mật",
      activity: "Hoạt động",
      appearance: "Giao diện",
      notifications: "Thông báo",
      connections: "Kết nối",
    },
    tabs: {
      summary: "Tóm tắt",
      assigned: "Đã giao",
      created: "Đã tạo",
      subscribed: "Đã đăng ký",
      activity: "Hoạt động",
    },
    empty_state: {
      activity: {
        title: "Chưa có hoạt động",
        description:
          "Bắt đầu bằng cách tạo mục công việc mới! Thêm chi tiết và thuộc tính cho nó. Khám phá thêm trong Plane để xem hoạt động của bạn.",
      },
      assigned: {
        title: "Không có mục công việc nào được giao cho bạn",
        description: "Có thể theo dõi mục công việc được giao cho bạn từ đây.",
      },
      created: {
        title: "Chưa có mục công việc",
        description: "Tất cả mục công việc bạn tạo sẽ xuất hiện ở đây, theo dõi chúng trực tiếp tại đây.",
      },
      subscribed: {
        title: "Chưa có mục công việc",
        description: "Đăng ký mục công việc bạn quan tâm, theo dõi tất cả chúng tại đây.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Nhập ID dự án",
      please_select_a_timezone: "Vui lòng chọn múi giờ",
      archive_project: {
        title: "Lưu trữ dự án",
        description:
          "Lưu trữ dự án sẽ hủy liệt kê dự án của bạn khỏi thanh điều hướng bên, nhưng bạn vẫn có thể truy cập nó từ trang dự án. Bạn có thể khôi phục hoặc xóa dự án bất cứ lúc nào.",
        button: "Lưu trữ dự án",
      },
      delete_project: {
        title: "Xóa dự án",
        description:
          "Khi xóa dự án, tất cả dữ liệu và tài nguyên trong dự án đó sẽ bị xóa vĩnh viễn và không thể khôi phục.",
        button: "Xóa dự án của tôi",
      },
      toast: {
        success: "Dự án đã được cập nhật thành công",
        error: "Không thể cập nhật dự án. Vui lòng thử lại.",
      },
    },
    members: {
      label: "Thành viên",
      project_lead: "Người phụ trách dự án",
      default_assignee: "Người nhận mặc định",
      guest_super_permissions: {
        title: "Cấp quyền cho người dùng khách xem tất cả mục công việc:",
        sub_heading: "Điều này sẽ cho phép khách xem tất cả mục công việc của dự án.",
      },
      invite_members: {
        title: "Mời thành viên",
        sub_heading: "Mời thành viên tham gia dự án của bạn.",
        select_co_worker: "Chọn đồng nghiệp",
      },
      project_lead_description: "Chọn trưởng dự án cho dự án.",
      default_assignee_description: "Chọn người được giao mặc định cho dự án.",
      project_subscribers: "Người theo dõi dự án",
      project_subscribers_description: "Chọn các thành viên sẽ nhận thông báo cho dự án này.",
    },
    states: {
      describe_this_state_for_your_members: "Mô tả trạng thái này cho thành viên của bạn.",
      empty_state: {
        title: "Không có trạng thái trong nhóm {groupKey}",
        description: "Vui lòng tạo một trạng thái mới",
      },
    },
    labels: {
      label_title: "Tiêu đề nhãn",
      label_title_is_required: "Tiêu đề nhãn là bắt buộc",
      label_max_char: "Tên nhãn không nên vượt quá 255 ký tự",
      toast: {
        error: "Đã xảy ra lỗi khi cập nhật nhãn",
      },
    },
    estimates: {
      label: "Ước tính",
      title: "Bật ước tính cho dự án của tôi",
      description: "Chúng giúp bạn truyền đạt độ phức tạp và khối lượng công việc của nhóm.",
      no_estimate: "Không có ước tính",
      new: "Hệ thống ước tính mới",
      create: {
        custom: "Tùy chỉnh",
        start_from_scratch: "Bắt đầu từ đầu",
        choose_template: "Chọn mẫu",
        choose_estimate_system: "Chọn hệ thống ước tính",
        enter_estimate_point: "Nhập điểm ước tính",
        step: "Bước {step} của {total}",
        label: "Tạo ước tính",
      },
      toasts: {
        created: {
          success: {
            title: "Đã tạo điểm ước tính",
            message: "Điểm ước tính đã được tạo thành công",
          },
          error: {
            title: "Không thể tạo điểm ước tính",
            message: "Không thể tạo điểm ước tính mới, vui lòng thử lại",
          },
        },
        updated: {
          success: {
            title: "Đã cập nhật ước tính",
            message: "Điểm ước tính đã được cập nhật trong dự án của bạn",
          },
          error: {
            title: "Không thể cập nhật ước tính",
            message: "Không thể cập nhật ước tính, vui lòng thử lại",
          },
        },
        enabled: {
          success: {
            title: "Thành công!",
            message: "Đã bật ước tính",
          },
        },
        disabled: {
          success: {
            title: "Thành công!",
            message: "Đã tắt ước tính",
          },
          error: {
            title: "Lỗi!",
            message: "Không thể tắt ước tính. Vui lòng thử lại",
          },
        },
        reorder: {
          success: {
            title: "Đã sắp xếp lại ước tính",
            message: "Ước tính đã được sắp xếp lại trong dự án của bạn.",
          },
          error: {
            title: "Sắp xếp lại ước tính thất bại",
            message: "Chúng tôi không thể sắp xếp lại ước tính, vui lòng thử lại",
          },
        },
      },
      validation: {
        min_length: "Điểm ước tính phải lớn hơn 0",
        unable_to_process: "Không thể xử lý yêu cầu của bạn, vui lòng thử lại",
        numeric: "Điểm ước tính phải là số",
        character: "Điểm ước tính phải là ký tự",
        empty: "Giá trị ước tính không được để trống",
        already_exists: "Giá trị ước tính này đã tồn tại",
        unsaved_changes: "Bạn có thay đổi chưa lưu. Vui lòng lưu trước khi nhấn 'xong'",
        fill: "Vui lòng điền vào trường ước tính này",
        repeat: "Giá trị ước tính không thể lặp lại",
      },
      systems: {
        points: {
          label: "Điểm",
          fibonacci: "Fibonacci",
          linear: "Tuyến tính",
          squares: "Bình phương",
          custom: "Tùy chỉnh",
        },
        categories: {
          label: "Danh mục",
          t_shirt_sizes: "Kích cỡ áo",
          easy_to_hard: "Dễ đến khó",
          custom: "Tùy chỉnh",
        },
        time: {
          label: "Thời gian",
          hours: "Giờ",
        },
      },
      edit: {
        title: "Chỉnh sửa hệ thống ước tính",
        add_or_update: {
          title: "Thêm, cập nhật hoặc xóa ước tính",
          description: "Quản lý hệ thống hiện tại bằng cách thêm, cập nhật hoặc xóa điểm hoặc danh mục.",
        },
        switch: {
          title: "Thay đổi loại ước tính",
          description: "Chuyển đổi hệ thống điểm của bạn thành hệ thống danh mục và ngược lại.",
        },
      },
      switch: "Chuyển đổi hệ thống ước tính",
      current: "Hệ thống ước tính hiện tại",
      select: "Chọn hệ thống ước tính",
    },
    automations: {
      label: "Tự động hóa",
      "auto-archive": {
        title: "Tự động lưu trữ mục công việc đã đóng",
        description: "Plane sẽ tự động lưu trữ các mục công việc đã hoàn thành hoặc đã hủy.",
        duration: "Tự động lưu trữ đã đóng",
      },
      "auto-close": {
        title: "Tự động đóng mục công việc",
        description: "Plane sẽ tự động đóng các mục công việc chưa hoàn thành hoặc hủy.",
        duration: "Tự động đóng không hoạt động",
        auto_close_status: "Trạng thái tự động đóng",
      },
      "auto-remind": {
        title: "Nhắc nhở tự động",
        description:
          "Plane sẽ tự động gửi nhắc nhở qua email và thông báo trong ứng dụng để giữ cho nhóm của bạn trên đường đến các hạn chót.",
        duration: "Gửi nhắc nhở trước",
      },
    },
    empty_state: {
      labels: {
        title: "Chưa có nhãn",
        description: "Tạo nhãn để giúp tổ chức và lọc mục công việc trong dự án của bạn.",
      },
      estimates: {
        title: "Chưa có hệ thống ước tính",
        description: "Tạo một tập hợp ước tính để truyền đạt khối lượng công việc cho mỗi mục công việc.",
        primary_button: "Thêm hệ thống ước tính",
      },
      integrations: {
        title: "Không có tích hợp nào được cấu hình",
        description: "Cấu hình GitHub và các tích hợp khác để đồng bộ hóa các mục công việc dự án của bạn.",
      },
    },
    initiatives: {
      heading: "Sáng kiến",
      sub_heading: "Mở khóa cấp độ tổ chức cao nhất cho tất cả công việc của bạn trong Plane.",
      title: "Bật Sáng kiến",
      description: "Đặt mục tiêu lớn hơn để theo dõi tiến độ",
      toast: {
        updating: "Đang cập nhật tính năng sáng kiến",
        enable_success: "Tính năng sáng kiến đã được bật thành công.",
        disable_success: "Tính năng sáng kiến đã được tắt thành công.",
        error: "Không thể cập nhật tính năng sáng kiến!",
      },
    },
    customers: {
      heading: "Khách hàng",
      settings_heading: "Quản lý công việc theo những gì quan trọng đối với khách hàng của bạn.",
      settings_sub_heading:
        "Đưa yêu cầu của khách hàng vào mục công việc, gán ưu tiên theo yêu cầu, và tổng hợp trạng thái công việc vào hồ sơ khách hàng. Sắp tới, bạn sẽ tích hợp với CRM hoặc công cụ Hỗ trợ của mình để quản lý công việc tốt hơn theo thuộc tính khách hàng.",
    },
    epics: {
      properties: {
        title: "Thuộc tính",
        description: "Thêm thuộc tính tùy chỉnh vào epic của bạn.",
      },
      disabled: "Đã vô hiệu hóa",
    },
    cycles: {
      auto_schedule: {
        heading: "Tự động lên lịch chu kỳ",
        description: "Duy trì chu kỳ hoạt động mà không cần thiết lập thủ công.",
        tooltip: "Tự động tạo chu kỳ mới dựa trên lịch trình bạn chọn.",
        edit_button: "Chỉnh sửa",
        form: {
          cycle_title: {
            label: "Tiêu đề chu kỳ",
            placeholder: "Tiêu đề",
            tooltip: "Tiêu đề sẽ được thêm số cho các chu kỳ tiếp theo. Ví dụ: Thiết kế - 1/2/3",
            validation: {
              required: "Tiêu đề chu kỳ là bắt buộc",
              max_length: "Tiêu đề không được vượt quá 255 ký tự",
            },
          },
          cycle_duration: {
            label: "Thời lượng chu kỳ",
            unit: "Tuần",
            validation: {
              required: "Thời lượng chu kỳ là bắt buộc",
              min: "Thời lượng chu kỳ phải ít nhất 1 tuần",
              max: "Thời lượng chu kỳ không được vượt quá 30 tuần",
              positive: "Thời lượng chu kỳ phải là số dương",
            },
          },
          cooldown_period: {
            label: "Thời gian nghỉ",
            unit: "ngày",
            tooltip: "Khoảng nghỉ giữa các chu kỳ trước khi bắt đầu chu kỳ tiếp theo.",
            validation: {
              required: "Thời gian nghỉ là bắt buộc",
              negative: "Thời gian nghỉ không thể là số âm",
            },
          },
          start_date: {
            label: "Ngày bắt đầu chu kỳ",
            validation: {
              required: "Ngày bắt đầu là bắt buộc",
              past: "Ngày bắt đầu không thể ở quá khứ",
            },
          },
          number_of_cycles: {
            label: "Số chu kỳ tương lai",
            validation: {
              required: "Số chu kỳ là bắt buộc",
              min: "Cần ít nhất 1 chu kỳ",
              max: "Không thể lên lịch nhiều hơn 3 chu kỳ",
            },
          },
          auto_rollover: {
            label: "Tự động chuyển các mục công việc",
            tooltip:
              "Vào ngày hoàn thành chu kỳ, chuyển tất cả các mục công việc chưa hoàn thành sang chu kỳ tiếp theo.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Đang bật tự động lên lịch chu kỳ",
            loading_disable: "Đang tắt tự động lên lịch chu kỳ",
            success: {
              title: "Thành công!",
              message: "Đã chuyển đổi tự động lên lịch chu kỳ thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Không thể chuyển đổi tự động lên lịch chu kỳ.",
            },
          },
          save: {
            loading: "Đang lưu cấu hình tự động lên lịch chu kỳ",
            success: {
              title: "Thành công!",
              message_create: "Đã lưu cấu hình tự động lên lịch chu kỳ thành công.",
              message_update: "Đã cập nhật cấu hình tự động lên lịch chu kỳ thành công.",
            },
            error: {
              title: "Lỗi!",
              message_create: "Không thể lưu cấu hình tự động lên lịch chu kỳ.",
              message_update: "Không thể cập nhật cấu hình tự động lên lịch chu kỳ.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Chu kỳ",
        short_title: "Chu kỳ",
        description:
          "Lên lịch công việc trong các khoảng thời gian linh hoạt thích ứng với nhịp điệu và tốc độ độc đáo của dự án này.",
        toggle_title: "Bật chu kỳ",
        toggle_description: "Lập kế hoạch công việc trong khung thời gian tập trung.",
      },
      modules: {
        title: "Mô-đun",
        short_title: "Mô-đun",
        description: "Tổ chức công việc thành các dự án phụ với người dẫn đầu và người được phân công chuyên trách.",
        toggle_title: "Bật mô-đun",
        toggle_description: "Thành viên dự án sẽ có thể tạo và chỉnh sửa mô-đun.",
      },
      views: {
        title: "Chế độ xem",
        short_title: "Chế độ xem",
        description: "Lưu các tùy chọn sắp xếp, bộ lọc và hiển thị tùy chỉnh hoặc chia sẻ chúng với nhóm của bạn.",
        toggle_title: "Bật chế độ xem",
        toggle_description: "Thành viên dự án sẽ có thể tạo và chỉnh sửa chế độ xem.",
      },
      pages: {
        title: "Trang",
        short_title: "Trang",
        description: "Tạo và chỉnh sửa nội dung tự do: ghi chú, tài liệu, bất cứ thứ gì.",
        toggle_title: "Bật trang",
        toggle_description: "Thành viên dự án sẽ có thể tạo và chỉnh sửa trang.",
      },
      intake: {
        intake_responsibility: "Trách nhiệm tiếp nhận",
        intake_sources: "Nguồn tiếp nhận",
        title: "Tiếp nhận",
        short_title: "Tiếp nhận",
        description:
          "Cho phép những người không phải thành viên chia sẻ lỗi, phản hồi và đề xuất; mà không làm gián đoạn quy trình làm việc của bạn.",
        toggle_title: "Bật tiếp nhận",
        toggle_description: "Cho phép thành viên dự án tạo yêu cầu tiếp nhận trong ứng dụng.",
        toggle_tooltip_on: "Yêu cầu Quản trị viên Dự án bật tính năng này.",
        toggle_tooltip_off: "Yêu cầu Quản trị viên Dự án tắt tính năng này.",
        notify_assignee: {
          title: "Thông báo người được chỉ định",
          description: "Đối với yêu cầu tiếp nhận mới, người được chỉ định mặc định sẽ được cảnh báo qua thông báo",
        },
        in_app: {
          title: "Trong ứng dụng",
          description:
            "Nhận mục công việc mới từ Thành viên và Khách trong không gian làm việc mà không ảnh hưởng đến mục hiện có.",
        },
        email: {
          title: "Email",
          description: "Thu thập mục công việc mới từ bất kỳ ai gửi email đến địa chỉ email Plane.",
          fieldName: "ID email",
        },
        form: {
          title: "Biểu mẫu",
          description:
            "Cho phép người ngoài không gian làm việc tạo mục công việc mới tiềm năng cho bạn qua biểu mẫu chuyên dụng và an toàn.",
          fieldName: "URL biểu mẫu mặc định",
          create_forms: "Tạo biểu mẫu bằng loại mục công việc",
          manage_forms: "Quản lý biểu mẫu",
          manage_forms_tooltip: "Yêu cầu Quản trị viên Không gian làm việc quản lý.",
          create_form: "Tạo biểu mẫu",
          edit_form: "Chỉnh sửa chi tiết biểu mẫu",
          form_title: "Tiêu đề biểu mẫu",
          form_title_required: "Tiêu đề biểu mẫu là bắt buộc",
          work_item_type: "Loại mục công việc",
          remove_property: "Xóa thuộc tính",
          select_properties: "Chọn thuộc tính",
          search_placeholder: "Tìm thuộc tính",
          toasts: {
            success_create: "Đã tạo biểu mẫu tiếp nhận thành công",
            success_update: "Đã cập nhật biểu mẫu tiếp nhận thành công",
            error_create: "Không thể tạo biểu mẫu tiếp nhận",
            error_update: "Không thể cập nhật biểu mẫu tiếp nhận",
          },
        },
        toasts: {
          set: {
            loading: "Đang đặt người được chỉ định...",
            success: {
              title: "Thành công!",
              message: "Người được chỉ định đã được đặt thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Đã xảy ra lỗi khi đặt người được chỉ định. Vui lòng thử lại.",
            },
          },
        },
      },
      time_tracking: {
        title: "Theo dõi thời gian",
        short_title: "Theo dõi thời gian",
        description: "Ghi lại thời gian dành cho các mục công việc và dự án.",
        toggle_title: "Bật theo dõi thời gian",
        toggle_description: "Thành viên dự án sẽ có thể ghi lại thời gian làm việc.",
      },
      milestones: {
        title: "Cột mốc",
        short_title: "Cột mốc",
        description: "Cột mốc cung cấp một lớp để điều chỉnh các mục công việc theo các ngày hoàn thành chung.",
        toggle_title: "Bật cột mốc",
        toggle_description: "Tổ chức các mục công việc theo thời hạn cột mốc.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Thêm chu kỳ",
    more_details: "Thêm chi tiết",
    cycle: "Chu kỳ",
    update_cycle: "Cập nhật chu kỳ",
    create_cycle: "Tạo chu kỳ",
    no_matching_cycles: "Không có chu kỳ phù hợp",
    remove_filters_to_see_all_cycles: "Xóa bộ lọc để xem tất cả chu kỳ",
    remove_search_criteria_to_see_all_cycles: "Xóa tiêu chí tìm kiếm để xem tất cả chu kỳ",
    only_completed_cycles_can_be_archived: "Chỉ có thể lưu trữ chu kỳ đã hoàn thành",
    start_date: "Ngày bắt đầu",
    end_date: "Ngày kết thúc",
    in_your_timezone: "Trong múi giờ của bạn",
    transfer_work_items: "Chuyển {count} mục công việc",
    transfer: {
      no_cycles_available: "Không có chu kỳ nào khác để chuyển mục công việc.",
    },
    date_range: "Khoảng thời gian",
    add_date: "Thêm ngày",
    active_cycle: {
      label: "Chu kỳ hoạt động",
      progress: "Tiến độ",
      chart: "Biểu đồ burndown",
      priority_issue: "Mục công việc ưu tiên",
      assignees: "Người được giao",
      issue_burndown: "Burndown mục công việc",
      ideal: "Lý tưởng",
      current: "Hiện tại",
      labels: "Nhãn",
      trailing: "Chậm tiến độ",
      leading: "Vượt tiến độ",
    },
    upcoming_cycle: {
      label: "Chu kỳ sắp tới",
    },
    completed_cycle: {
      label: "Chu kỳ đã hoàn thành",
    },
    status: {
      days_left: "Số ngày còn lại",
      completed: "Đã hoàn thành",
      yet_to_start: "Chưa bắt đầu",
      in_progress: "Đang tiến hành",
      draft: "Bản nháp",
    },
    action: {
      restore: {
        title: "Khôi phục chu kỳ",
        success: {
          title: "Đã khôi phục chu kỳ",
          description: "Chu kỳ đã được khôi phục.",
        },
        failed: {
          title: "Khôi phục chu kỳ thất bại",
          description: "Không thể khôi phục chu kỳ. Vui lòng thử lại.",
        },
      },
      favorite: {
        loading: "Đang thêm chu kỳ vào mục yêu thích",
        success: {
          description: "Chu kỳ đã được thêm vào mục yêu thích.",
          title: "Thành công!",
        },
        failed: {
          description: "Không thể thêm chu kỳ vào mục yêu thích. Vui lòng thử lại.",
          title: "Lỗi!",
        },
      },
      unfavorite: {
        loading: "Đang xóa chu kỳ khỏi mục yêu thích",
        success: {
          description: "Chu kỳ đã được xóa khỏi mục yêu thích.",
          title: "Thành công!",
        },
        failed: {
          description: "Không thể xóa chu kỳ khỏi mục yêu thích. Vui lòng thử lại.",
          title: "Lỗi!",
        },
      },
      update: {
        loading: "Đang cập nhật chu kỳ",
        success: {
          description: "Chu kỳ đã được cập nhật thành công.",
          title: "Thành công!",
        },
        failed: {
          description: "Đã xảy ra lỗi khi cập nhật chu kỳ. Vui lòng thử lại.",
          title: "Lỗi!",
        },
        error: {
          already_exists:
            "Đã tồn tại chu kỳ trong khoảng thời gian đã cho, nếu bạn muốn tạo chu kỳ nháp, bạn có thể làm vậy bằng cách xóa cả hai ngày.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Nhóm và đặt khung thời gian cho công việc của bạn trong chu kỳ.",
        description:
          "Chia nhỏ công việc theo khung thời gian, đặt ngày từ thời hạn dự án và đạt được tiến độ cụ thể với tư cách là một nhóm.",
        primary_button: {
          text: "Thiết lập chu kỳ đầu tiên của bạn",
          comic: {
            title: "Chu kỳ là khung thời gian lặp lại.",
            description:
              "Sprint, iteration hoặc bất kỳ thuật ngữ nào khác bạn sử dụng để theo dõi công việc hàng tuần hoặc hai tuần một lần đều là một chu kỳ.",
          },
        },
      },
      no_issues: {
        title: "Chưa thêm mục công việc vào chu kỳ",
        description: "Thêm hoặc tạo mục công việc bạn muốn đặt khung thời gian và giao trong chu kỳ này",
        primary_button: {
          text: "Tạo mục công việc mới",
        },
        secondary_button: {
          text: "Thêm mục công việc hiện có",
        },
      },
      completed_no_issues: {
        title: "Không có mục công việc trong chu kỳ",
        description:
          "Không có mục công việc trong chu kỳ. Mục công việc đã được chuyển hoặc ẩn. Để xem mục công việc đã ẩn (nếu có), vui lòng cập nhật thuộc tính hiển thị của bạn tương ứng.",
      },
      active: {
        title: "Không có chu kỳ hoạt động",
        description:
          "Chu kỳ hoạt động bao gồm bất kỳ khoảng thời gian nào có ngày hôm nay trong phạm vi của nó. Tìm tiến độ và chi tiết về chu kỳ hoạt động ở đây.",
      },
      archived: {
        title: "Chưa có chu kỳ đã lưu trữ",
        description:
          "Để tổ chức dự án của bạn, hãy lưu trữ chu kỳ đã hoàn thành. Bạn có thể tìm thấy chúng ở đây sau khi lưu trữ.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Tạo mục công việc và giao nó cho ai đó, thậm chí là chính bạn",
        description:
          "Xem mục công việc như công việc, nhiệm vụ hoặc công việc cần hoàn thành. Mục công việc và các mục công việc con của chúng thường dựa trên thời gian, được giao cho thành viên nhóm để thực hiện. Nhóm của bạn thúc đẩy dự án đạt được mục tiêu bằng cách tạo, giao và hoàn thành mục công việc.",
        primary_button: {
          text: "Tạo mục công việc đầu tiên của bạn",
          comic: {
            title: "Mục công việc là khối xây dựng cơ bản trong Plane.",
            description:
              "Thiết kế lại giao diện Plane, định vị lại thương hiệu công ty hoặc ra mắt hệ thống phun nhiên liệu mới đều là ví dụ về mục công việc có thể chứa các mục công việc con.",
          },
        },
      },
      no_archived_issues: {
        title: "Chưa có mục công việc đã lưu trữ",
        description:
          "Thông qua phương thức thủ công hoặc tự động, bạn có thể lưu trữ mục công việc đã hoàn thành hoặc đã hủy. Bạn có thể tìm thấy chúng ở đây sau khi lưu trữ.",
        primary_button: {
          text: "Thiết lập tự động hóa",
        },
      },
      issues_empty_filter: {
        title: "Không tìm thấy mục công việc phù hợp với bộ lọc",
        secondary_button: {
          text: "Xóa tất cả bộ lọc",
        },
      },
    },
  },
  project_module: {
    add_module: "Thêm mô-đun",
    update_module: "Cập nhật mô-đun",
    create_module: "Tạo mô-đun",
    archive_module: "Lưu trữ mô-đun",
    restore_module: "Khôi phục mô-đun",
    delete_module: "Xóa mô-đun",
    empty_state: {
      general: {
        title: "Ánh xạ cột mốc dự án vào mô-đun, dễ dàng theo dõi công việc tổng hợp.",
        description:
          "Một nhóm mục công việc thuộc cấp cha trong cấu trúc logic tạo thành một mô-đun. Xem nó như một cách theo dõi công việc theo cột mốc dự án. Chúng có chu kỳ riêng và thời hạn cùng với các tính năng phân tích giúp bạn hiểu bạn đang ở đâu so với cột mốc.",
        primary_button: {
          text: "Xây dựng mô-đun đầu tiên của bạn",
          comic: {
            title: "Mô-đun giúp nhóm công việc theo cấu trúc phân cấp.",
            description: "Mô-đun giỏ hàng, mô-đun khung gầm và mô-đun kho đều là ví dụ tốt về nhóm như vậy.",
          },
        },
      },
      no_issues: {
        title: "Không có mục công việc trong mô-đun",
        description: "Tạo hoặc thêm mục công việc bạn muốn hoàn thành như một phần của mô-đun này",
        primary_button: {
          text: "Tạo mục công việc mới",
        },
        secondary_button: {
          text: "Thêm mục công việc hiện có",
        },
      },
      archived: {
        title: "Chưa có mô-đun đã lưu trữ",
        description:
          "Để tổ chức dự án của bạn, hãy lưu trữ mô-đun đã hoàn thành hoặc đã hủy. Bạn có thể tìm thấy chúng ở đây sau khi lưu trữ.",
      },
      sidebar: {
        in_active: "Mô-đun này chưa được kích hoạt.",
        invalid_date: "Ngày không hợp lệ. Vui lòng nhập ngày hợp lệ.",
      },
    },
    quick_actions: {
      archive_module: "Lưu trữ mô-đun",
      archive_module_description: `Chỉ mô-đun đã hoàn thành hoặc đã hủy
có thể được lưu trữ.`,
      delete_module: "Xóa mô-đun",
    },
    toast: {
      copy: {
        success: "Đã sao chép liên kết mô-đun vào bảng tạm",
      },
      delete: {
        success: "Đã xóa mô-đun thành công",
        error: "Xóa mô-đun thất bại",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Lưu chế độ xem đã lọc cho dự án của bạn. Tạo bao nhiêu tùy ý",
        description:
          "Chế độ xem là bộ bộ lọc đã lưu mà bạn thường xuyên sử dụng hoặc muốn truy cập dễ dàng. Tất cả đồng nghiệp trong dự án có thể thấy chế độ xem của mọi người và chọn cái phù hợp nhất với nhu cầu của họ.",
        primary_button: {
          text: "Tạo chế độ xem đầu tiên của bạn",
          comic: {
            title: "Chế độ xem hoạt động dựa trên thuộc tính mục công việc.",
            description:
              "Bạn có thể tạo chế độ xem ở đây sử dụng bất kỳ số lượng thuộc tính nào làm bộ lọc theo nhu cầu của bạn.",
          },
        },
      },
      filter: {
        title: "Không có chế độ xem phù hợp",
        description: `Không có chế độ xem phù hợp với tiêu chí tìm kiếm.
Tạo chế độ xem mới.`,
      },
    },
    delete_view: {
      title: "Bạn có chắc chắn muốn xóa chế độ xem này không?",
      content:
        "Nếu bạn xác nhận, tất cả các tùy chọn sắp xếp, lọc và hiển thị + bố cục mà bạn đã chọn cho chế độ xem này sẽ bị xóa vĩnh viễn mà không có cách nào khôi phục.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title: "Viết ghi chú, tài liệu hoặc cơ sở kiến thức đầy đủ. Để trợ lý AI Galileo của Plane giúp bạn bắt đầu",
        description:
          "Trang là không gian ghi lại suy nghĩ trong Plane. Ghi lại các ghi chú cuộc họp, định dạng dễ dàng, nhúng mục công việc, sử dụng thư viện thành phần để bố cục và lưu tất cả trong ngữ cảnh dự án. Để hoàn thành nhanh bất kỳ tài liệu nào, bạn có thể gọi AI Galileo của Plane thông qua phím tắt hoặc nhấp nút.",
        primary_button: {
          text: "Tạo trang đầu tiên của bạn",
        },
      },
      private: {
        title: "Chưa có trang riêng tư",
        description: "Lưu ý riêng tư của bạn ở đây. Khi sẵn sàng chia sẻ, nhóm của bạn chỉ cách một cú nhấp chuột.",
        primary_button: {
          text: "Tạo trang đầu tiên của bạn",
        },
      },
      public: {
        title: "Chưa có trang công khai",
        description: "Xem các trang được chia sẻ với mọi người trong dự án tại đây.",
        primary_button: {
          text: "Tạo trang đầu tiên của bạn",
        },
      },
      archived: {
        title: "Chưa có trang đã lưu trữ",
        description: "Lưu trữ các trang không còn trong tầm nhìn của bạn. Truy cập chúng ở đây khi cần.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Không tìm thấy kết quả",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Không tìm thấy mục công việc phù hợp",
      },
      no_issues: {
        title: "Không tìm thấy mục công việc",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Chưa có bình luận",
        description: "Bình luận có thể được sử dụng như không gian thảo luận và theo dõi cho mục công việc",
      },
    },
  },
  notification: {
    label: "Hộp thư đến",
    page_label: "{workspace} - Hộp thư đến",
    options: {
      mark_all_as_read: "Đánh dấu tất cả là đã đọc",
      mark_read: "Đánh dấu đã đọc",
      mark_unread: "Đánh dấu chưa đọc",
      refresh: "Làm mới",
      filters: "Bộ lọc hộp thư đến",
      show_unread: "Hiển thị chưa đọc",
      show_snoozed: "Hiển thị đã tạm hoãn",
      show_archived: "Hiển thị đã lưu trữ",
      mark_archive: "Lưu trữ",
      mark_unarchive: "Hủy lưu trữ",
      mark_snooze: "Tạm hoãn",
      mark_unsnooze: "Hủy tạm hoãn",
    },
    toasts: {
      read: "Thông báo đã được đánh dấu là đã đọc",
      unread: "Thông báo đã được đánh dấu là chưa đọc",
      archived: "Thông báo đã được đánh dấu là đã lưu trữ",
      unarchived: "Thông báo đã được đánh dấu là đã hủy lưu trữ",
      snoozed: "Thông báo đã được tạm hoãn",
      unsnoozed: "Thông báo đã được hủy tạm hoãn",
    },
    empty_state: {
      detail: {
        title: "Chọn để xem chi tiết.",
      },
      all: {
        title: "Không có mục công việc được giao",
        description: "Xem cập nhật về mục công việc được giao cho bạn tại đây",
      },
      mentions: {
        title: "Không có mục công việc được giao",
        description: "Xem cập nhật về mục công việc được giao cho bạn tại đây",
      },
    },
    tabs: {
      all: "Tất cả",
      mentions: "Đề cập",
    },
    filter: {
      assigned: "Được giao cho tôi",
      created: "Được tạo bởi tôi",
      subscribed: "Được đăng ký bởi tôi",
    },
    snooze: {
      "1_day": "1 ngày",
      "3_days": "3 ngày",
      "5_days": "5 ngày",
      "1_week": "1 tuần",
      "2_weeks": "2 tuần",
      custom: "Tùy chỉnh",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Thêm mục công việc vào chu kỳ để xem tiến độ của nó",
      },
      chart: {
        title: "Thêm mục công việc vào chu kỳ để xem biểu đồ burndown.",
      },
      priority_issue: {
        title: "Xem nhanh các mục công việc ưu tiên cao đang được xử lý trong chu kỳ.",
      },
      assignee: {
        title: "Thêm người phụ trách cho mục công việc để xem phân tích công việc theo người phụ trách.",
      },
      label: {
        title: "Thêm nhãn cho mục công việc để xem phân tích công việc theo nhãn.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Dự án chưa bật tính năng thu thập.",
        description:
          "Tính năng thu thập giúp bạn quản lý các yêu cầu đến của dự án và thêm chúng như mục công việc trong quy trình làm việc. Bật tính năng thu thập từ cài đặt dự án để quản lý yêu cầu.",
        primary_button: {
          text: "Quản lý tính năng",
        },
      },
      cycle: {
        title: "Dự án này chưa bật tính năng chu kỳ.",
        description:
          "Chia nhỏ công việc theo khung thời gian, đặt ngày từ thời hạn dự án, và đạt được tiến độ cụ thể với tư cách là một nhóm. Bật tính năng chu kỳ cho dự án của bạn để bắt đầu sử dụng.",
        primary_button: {
          text: "Quản lý tính năng",
        },
      },
      module: {
        title: "Dự án chưa bật tính năng mô-đun.",
        description: "Mô-đun là khối xây dựng cơ bản của dự án. Bật mô-đun từ cài đặt dự án để bắt đầu sử dụng chúng.",
        primary_button: {
          text: "Quản lý tính năng",
        },
      },
      page: {
        title: "Dự án chưa bật tính năng trang.",
        description: "Trang là khối xây dựng cơ bản của dự án. Bật trang từ cài đặt dự án để bắt đầu sử dụng chúng.",
        primary_button: {
          text: "Quản lý tính năng",
        },
      },
      view: {
        title: "Dự án chưa bật tính năng chế độ xem.",
        description:
          "Chế độ xem là khối xây dựng cơ bản của dự án. Bật chế độ xem từ cài đặt dự án để bắt đầu sử dụng chúng.",
        primary_button: {
          text: "Quản lý tính năng",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Nháp một mục công việc",
    empty_state: {
      title: "Mục công việc viết dở và bình luận sắp ra mắt sẽ hiển thị ở đây.",
      description:
        "Để thử tính năng này, hãy bắt đầu thêm mục công việc và rời đi giữa chừng, hoặc tạo bản nháp đầu tiên của bạn bên dưới. 😉",
      primary_button: {
        text: "Tạo bản nháp đầu tiên của bạn",
      },
    },
    delete_modal: {
      title: "Xóa bản nháp",
      description: "Bạn có chắc chắn muốn xóa bản nháp này không? Hành động này không thể hoàn tác.",
    },
    toasts: {
      created: {
        success: "Đã tạo bản nháp",
        error: "Không thể tạo mục công việc. Vui lòng thử lại.",
      },
      deleted: {
        success: "Đã xóa bản nháp",
      },
    },
  },
  stickies: {
    title: "Ghi chú của bạn",
    placeholder: "Nhấp vào đây để nhập",
    all: "Tất cả ghi chú",
    "no-data":
      "Ghi lại một ý tưởng, nắm bắt một cảm hứng, hoặc ghi lại một suy nghĩ chợt nảy ra. Thêm ghi chú để bắt đầu.",
    add: "Thêm ghi chú",
    search_placeholder: "Tìm kiếm theo tiêu đề",
    delete: "Xóa ghi chú",
    delete_confirmation: "Bạn có chắc chắn muốn xóa ghi chú này không?",
    empty_state: {
      simple:
        "Ghi lại một ý tưởng, nắm bắt một cảm hứng, hoặc ghi lại một suy nghĩ chợt nảy ra. Thêm ghi chú để bắt đầu.",
      general: {
        title: "Ghi chú là ghi chú nhanh và việc cần làm mà bạn ghi lại ngay lập tức.",
        description:
          "Dễ dàng nắm bắt ý tưởng và sáng tạo của bạn bằng cách tạo ghi chú có thể truy cập từ mọi nơi, mọi lúc.",
        primary_button: {
          text: "Thêm ghi chú",
        },
      },
      search: {
        title: "Điều này không khớp với bất kỳ ghi chú nào của bạn.",
        description: `Thử sử dụng các thuật ngữ khác, hoặc nếu bạn chắc chắn
tìm kiếm là chính xác, hãy cho chúng tôi biết.`,
        primary_button: {
          text: "Thêm ghi chú",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Tên ghi chú không thể vượt quá 100 ký tự.",
        already_exists: "Đã tồn tại một ghi chú không có mô tả",
      },
      created: {
        title: "Đã tạo ghi chú",
        message: "Ghi chú đã được tạo thành công",
      },
      not_created: {
        title: "Chưa tạo ghi chú",
        message: "Không thể tạo ghi chú",
      },
      updated: {
        title: "Đã cập nhật ghi chú",
        message: "Ghi chú đã được cập nhật thành công",
      },
      not_updated: {
        title: "Chưa cập nhật ghi chú",
        message: "Không thể cập nhật ghi chú",
      },
      removed: {
        title: "Đã xóa ghi chú",
        message: "Ghi chú đã được xóa thành công",
      },
      not_removed: {
        title: "Chưa xóa ghi chú",
        message: "Không thể xóa ghi chú",
      },
    },
  },
  role_details: {
    guest: {
      title: "Khách",
      description: "Thành viên bên ngoài của tổ chức có thể được mời với tư cách khách.",
    },
    member: {
      title: "Thành viên",
      description: "Có thể đọc, viết, chỉnh sửa và xóa thực thể trong dự án, chu kỳ và mô-đun",
    },
    admin: {
      title: "Quản trị viên",
      description: "Tất cả quyền trong không gian làm việc đều được đặt là cho phép.",
    },
  },
  user_roles: {
    product_or_project_manager: "Quản lý sản phẩm/dự án",
    development_or_engineering: "Phát triển/Kỹ thuật",
    founder_or_executive: "Nhà sáng lập/Giám đốc điều hành",
    freelancer_or_consultant: "Freelancer/Tư vấn viên",
    marketing_or_growth: "Marketing/Tăng trưởng",
    sales_or_business_development: "Bán hàng/Phát triển kinh doanh",
    support_or_operations: "Hỗ trợ/Vận hành",
    student_or_professor: "Sinh viên/Giáo sư",
    human_resources: "Nhân sự",
    other: "Khác",
  },
  importer: {
    github: {
      title: "GitHub",
      description: "Nhập và đồng bộ mục công việc từ kho lưu trữ GitHub.",
    },
    jira: {
      title: "Jira",
      description: "Nhập mục công việc và sử thi từ dự án và sử thi Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Xuất mục công việc thành tệp CSV.",
      short_description: "Xuất sang CSV",
    },
    excel: {
      title: "Excel",
      description: "Xuất mục công việc thành tệp Excel.",
      short_description: "Xuất sang Excel",
    },
    xlsx: {
      title: "Excel",
      description: "Xuất mục công việc thành tệp Excel.",
      short_description: "Xuất sang Excel",
    },
    json: {
      title: "JSON",
      description: "Xuất mục công việc thành tệp JSON.",
      short_description: "Xuất sang JSON",
    },
  },
  default_global_view: {
    all_issues: "Tất cả mục công việc",
    assigned: "Đã giao",
    created: "Đã tạo",
    subscribed: "Đã đăng ký",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Tùy chọn hệ thống",
      },
      light: {
        label: "Sáng",
      },
      dark: {
        label: "Tối",
      },
      light_contrast: {
        label: "Sáng tương phản cao",
      },
      dark_contrast: {
        label: "Tối tương phản cao",
      },
      custom: {
        label: "Chủ đề tùy chỉnh",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Tồn đọng",
      planned: "Đã lên kế hoạch",
      in_progress: "Đang tiến hành",
      paused: "Đã tạm dừng",
      completed: "Đã hoàn thành",
      cancelled: "Đã hủy",
    },
    layout: {
      list: "Bố cục danh sách",
      board: "Bố cục bảng",
      timeline: "Bố cục dòng thời gian",
    },
    order_by: {
      name: "Tên",
      progress: "Tiến độ",
      issues: "Số lượng mục công việc",
      due_date: "Ngày hết hạn",
      created_at: "Ngày tạo",
      manual: "Thủ công",
    },
  },
  cycle: {
    label: "{count, plural, one {chu kỳ} other {chu kỳ}}",
    no_cycle: "Không có chu kỳ",
  },
  module: {
    label: "{count, plural, one {mô-đun} other {mô-đun}}",
    no_module: "Không có mô-đun",
  },
  description_versions: {
    last_edited_by: "Chỉnh sửa lần cuối bởi",
    previously_edited_by: "Trước đây được chỉnh sửa bởi",
    edited_by: "Được chỉnh sửa bởi",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane không khởi động được. Điều này có thể do một hoặc nhiều dịch vụ Plane không khởi động được.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure: "Chọn View Logs từ setup.sh và log Docker để chắc chắn.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Phác thảo",
        empty_state: {
          title: "Thiếu tiêu đề",
          description: "Hãy thêm một số tiêu đề vào trang này để xem chúng ở đây.",
        },
      },
      info: {
        label: "Thông tin",
        document_info: {
          words: "Từ",
          characters: "Ký tự",
          paragraphs: "Đoạn văn",
          read_time: "Thời gian đọc",
        },
        actors_info: {
          edited_by: "Được chỉnh sửa bởi",
          created_by: "Được tạo bởi",
        },
        version_history: {
          label: "Lịch sử phiên bản",
          current_version: "Phiên bản hiện tại",
          highlight_changes: "Đánh dấu thay đổi",
        },
      },
      assets: {
        label: "Tài sản",
        download_button: "Tải xuống",
        empty_state: {
          title: "Thiếu hình ảnh",
          description: "Thêm hình ảnh để xem chúng ở đây.",
        },
      },
    },
    open_button: "Mở bảng điều hướng",
    close_button: "Đóng bảng điều hướng",
    outline_floating_button: "Mở phác thảo",
  },
  workspace_dashboards: "Bảng điều khiển",
  pi_chat: "Plane AI",
  in_app: "Trong ứng dụng",
  forms: "Biểu mẫu",
  choose_workspace_for_integration: "Chọn không gian làm việc để kết nối ứng dụng này",
  integrations_description: "Ứng dụng làm việc với Plane phải kết nối với không gian làm việc mà bạn là quản trị viên.",
  create_a_new_workspace: "Tạo không gian làm việc mới",
  learn_more_about_workspaces: "Tìm hiểu thêm về không gian làm việc",
  no_workspaces_to_connect: "Không có không gian làm việc để kết nối",
  no_workspaces_to_connect_description: "Bạn cần tạo không gian làm việc để kết nối ứng dụng này",
  updates: {
    add_update: "Thêm cập nhật",
    add_update_placeholder: "Thêm cập nhật của bạn ở đây",
    empty: {
      title: "Chưa có cập nhật",
      description: "Bạn có thể xem cập nhật ở đây.",
    },
    create: {
      success: {
        title: "Cập nhật đã được tạo",
        message: "Cập nhật đã được tạo thành công.",
      },
      error: {
        title: "Không thể tạo cập nhật",
        message: "Không thể tạo cập nhật. Vui lòng thử lại!",
      },
    },
    update: {
      success: {
        title: "Cập nhật đã được cập nhật",
        message: "Cập nhật đã được cập nhật thành công.",
      },
      error: {
        title: "Không thể cập nhật cập nhật",
        message: "Không thể cập nhật cập nhật. Vui lòng thử lại!",
      },
    },
    delete: {
      success: {
        title: "Cập nhật đã được xóa",
        message: "Cập nhật đã được xóa thành công.",
      },
      error: {
        title: "Không thể xóa cập nhật",
        message: "Không thể xóa cập nhật. Vui lòng thử lại!",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reaction đã được tạo",
          message: "Reaction đã được tạo thành công.",
        },
      },
      remove: {
        success: {
          title: "Reaction đã được xóa",
          message: "Reaction đã được xóa thành công.",
        },
      },
    },
    progress: {
      title: "Tiến độ",
      since_last_update: "Từ lần cập nhật cuối cùng",
      comments: "{count, plural, one{# bình luận} other{# bình luận}}",
    },
  },
  teamspaces: {
    label: "Không gian nhóm",
    empty_state: {
      general: {
        title: "Không gian nhóm mở khóa tổ chức và theo dõi tốt hơn trong Plane.",
        description:
          "Tạo một bề mặt dành riêng cho mỗi nhóm trong thực tế, tách biệt với tất cả các bề mặt làm việc khác trong Plane, và tùy chỉnh chúng để phù hợp với cách nhóm của bạn làm việc.",
        primary_button: {
          text: "Tạo không gian nhóm mới",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Bạn chưa liên kết bất kỳ không gian nhóm nào.",
          description: "Chủ sở hữu không gian nhóm và dự án có thể quản lý quyền truy cập vào các dự án.",
        },
      },
      primary_button: {
        text: "Liên kết không gian nhóm",
      },
      secondary_button: {
        text: "Tìm hiểu thêm",
      },
      table: {
        columns: {
          teamspaceName: "Tên không gian nhóm",
          members: "Thành viên",
          accountType: "Loại tài khoản",
        },
        actions: {
          remove: {
            button: {
              text: "Xóa không gian nhóm",
            },
            confirm: {
              title: "Xóa {teamspaceName} khỏi {projectName}",
              description:
                "Khi bạn xóa không gian nhóm này khỏi dự án liên kết, các thành viên ở đây sẽ mất quyền truy cập vào dự án liên kết.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Không tìm thấy không gian nhóm phù hợp",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Bạn đã liên kết một không gian nhóm với dự án này.} other {Bạn đã liên kết # không gian nhóm với dự án này.}}",
            description:
              "{additionalCount, plural, =0 {Không gian nhóm {firstTeamspaceName} hiện đã được liên kết với dự án này.} other {Không gian nhóm {firstTeamspaceName} và {additionalCount} không gian khác hiện đã được liên kết với dự án này.}}",
          },
          error: {
            title: "Điều đó không thành công.",
            description: "Hãy thử lại hoặc tải lại trang này trước khi thử lại.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Bạn đã xóa không gian nhóm đó khỏi dự án này.",
            description: "Không gian nhóm {teamspaceName} đã được xóa khỏi {projectName}.",
          },
          error: {
            title: "Điều đó không thành công.",
            description: "Hãy thử lại hoặc tải lại trang này trước khi thử lại.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Tìm kiếm không gian nhóm",
        info: {
          title: "Thêm không gian nhóm cấp cho tất cả thành viên không gian nhóm quyền truy cập vào dự án này.",
          link: "Tìm hiểu thêm",
        },
        empty_state: {
          no_teamspaces: {
            title: "Bạn không có không gian nhóm nào để liên kết.",
            description:
              "Hoặc bạn không ở trong không gian nhóm mà bạn có thể liên kết hoặc bạn đã liên kết tất cả các không gian nhóm có sẵn.",
          },
          no_results: {
            title: "Điều đó không khớp với bất kỳ không gian nhóm nào của bạn.",
            description: "Hãy thử một thuật ngữ khác hoặc đảm bảo bạn có không gian nhóm để liên kết.",
          },
        },
        primary_button: {
          text: "Liên kết không gian nhóm đã chọn",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Tạo mục công việc cụ thể cho nhóm.",
        description:
          "Các mục công việc được gán cho thành viên của nhóm này trong bất kỳ dự án liên kết nào sẽ tự động xuất hiện ở đây. Nếu bạn mong đợi thấy một số mục công việc ở đây, hãy đảm bảo dự án liên kết của bạn có mục công việc được gán cho thành viên của nhóm này hoặc tạo mục công việc.",
        primary_button: {
          text: "Thêm mục công việc vào dự án liên kết",
        },
      },
      work_items_empty_filter: {
        title: "Không có mục công việc cụ thể cho nhóm nào cho các bộ lọc đã áp dụng",
        description: "Thay đổi một số bộ lọc đó hoặc xóa tất cả để xem các mục công việc liên quan đến không gian này.",
        secondary_button: {
          text: "Xóa tất cả bộ lọc",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Không có dự án liên kết nào của bạn có chu kỳ đang hoạt động.",
        description:
          "Các chu kỳ đang hoạt động trong các dự án liên kết sẽ tự động xuất hiện ở đây. Nếu bạn mong đợi thấy một chu kỳ đang hoạt động, hãy đảm bảo nó đang chạy trong một dự án liên kết ngay bây giờ.",
      },
      completed: {
        title: "Không có dự án liên kết nào của bạn có chu kỳ đã hoàn thành.",
        description:
          "Các chu kỳ đã hoàn thành trong các dự án liên kết sẽ tự động xuất hiện ở đây. Nếu bạn mong đợi thấy một chu kỳ đã hoàn thành, hãy đảm bảo nó cũng đã hoàn thành trong một dự án liên kết.",
      },
      upcoming: {
        title: "Không có dự án liên kết nào của bạn có chu kỳ sắp tới.",
        description:
          "Các chu kỳ sắp tới trong các dự án liên kết sẽ tự động xuất hiện ở đây. Nếu bạn mong đợi thấy một chu kỳ sắp tới, hãy đảm bảo nó cũng có trong một dự án liên kết.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title:
          "Góc nhìn của nhóm bạn về công việc của bạn mà không làm gián đoạn bất kỳ góc nhìn nào khác trong workspace của bạn",
        description:
          "Xem công việc của nhóm bạn trong các góc nhìn được lưu chỉ dành cho nhóm của bạn và tách biệt với góc nhìn của dự án.",
        primary_button: {
          text: "Tạo một góc nhìn",
        },
      },
      filter: {
        title: "Không có góc nhìn phù hợp",
        description: `Không có góc nhìn nào phù hợp với tiêu chí tìm kiếm.
 Tạo góc nhìn mới thay thế.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Lưu trữ kiến thức của nhóm bạn trong Trang Nhóm.",
        description:
          "Không giống như các trang trong một dự án, bạn có thể lưu kiến thức cụ thể cho một nhóm trong một bộ trang riêng biệt ở đây. Nhận tất cả các tính năng của Trang, tạo tài liệu thực hành tốt nhất và wiki nhóm một cách dễ dàng.",
        primary_button: {
          text: "Tạo trang nhóm đầu tiên của bạn",
        },
      },
      filter: {
        title: "Không có trang phù hợp",
        description: "Loại bỏ bộ lọc để xem tất cả các trang",
      },
      search: {
        title: "Không có trang phù hợp",
        description: "Loại bỏ tiêu chí tìm kiếm để xem tất cả các trang",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Không có dự án liên kết nào của bạn có mục công việc đã xuất bản.",
        description:
          "Tạo một số mục công việc trong một hoặc nhiều dự án đó để xem tiến độ theo ngày, trạng thái và ưu tiên.",
      },
      relation: {
        blocking: {
          title: "Bạn không có bất kỳ mục công việc nào đang chặn một đồng đội.",
          description: "Làm tốt lắm! Bạn đã dọn đường cho nhóm của mình. Bạn là một người chơi đồng đội tốt.",
        },
        blocked: {
          title: "Bạn không có bất kỳ mục công việc nào của đồng đội đang chặn bạn.",
          description: "Tin tốt! Bạn có thể tiến triển trong tất cả các mục công việc được gán cho bạn.",
        },
      },
      stats: {
        general: {
          title: "Không có dự án liên kết nào của bạn có mục công việc đã xuất bản.",
          description:
            "Tạo một số mục công việc trong một hoặc nhiều dự án đó để xem phân phối công việc theo dự án và thành viên nhóm.",
        },
        filter: {
          title: "Không có thống kê nhóm nào cho các bộ lọc đã áp dụng.",
          description:
            "Tạo một số mục công việc trong một hoặc nhiều dự án đó để xem phân phối công việc theo dự án và thành viên nhóm.",
        },
      },
    },
  },
  initiatives: {
    overview: "Tổng quan",
    label: "Sáng kiến",
    placeholder: "{count, plural, one{# sáng kiến} other{# sáng kiến}}",
    add_initiative: "Thêm Sáng kiến",
    create_initiative: "Tạo Sáng kiến",
    update_initiative: "Cập nhật Sáng kiến",
    initiative_name: "Tên sáng kiến",
    all_initiatives: "Tất cả Sáng kiến",
    delete_initiative: "Xóa Sáng kiến",
    fill_all_required_fields: "Vui lòng điền vào tất cả các trường bắt buộc.",
    toast: {
      create_success: "Sáng kiến {name} đã được tạo thành công.",
      create_error: "Không thể tạo sáng kiến. Vui lòng thử lại!",
      update_success: "Sáng kiến {name} đã được cập nhật thành công.",
      update_error: "Không thể cập nhật sáng kiến. Vui lòng thử lại!",
      delete: {
        success: "Sáng kiến đã được xóa thành công.",
        error: "Không thể xóa Sáng kiến",
      },
      link_copied: "Liên kết sáng kiến đã được sao chép vào clipboard.",
      project_update_success: "Dự án sáng kiến đã được cập nhật thành công.",
      project_update_error: "Không thể cập nhật dự án sáng kiến. Vui lòng thử lại!",
      epic_update_success:
        "Epic{count, plural, one { đã được thêm vào Sáng kiến thành công.} other {s đã được thêm vào Sáng kiến thành công.}}",
      epic_update_error: "Thêm Epic vào Sáng kiến thất bại. Vui lòng thử lại sau.",
      state_update_success: "Trạng thái sáng kiến đã được cập nhật thành công.",
      state_update_error: "Cập nhật trạng thái sáng kiến không thành công. Vui lòng thử lại!",
      label_update_error: "Không thể cập nhật nhãn sáng kiến. Vui lòng thử lại!",
    },
    empty_state: {
      general: {
        title: "Tổ chức công việc ở cấp độ cao nhất với Sáng kiến",
        description:
          "Khi bạn cần tổ chức công việc trải rộng qua nhiều dự án và nhóm, Sáng kiến rất hữu ích. Kết nối dự án và epic với sáng kiến, xem cập nhật được tổng hợp tự động, và nhìn thấy toàn cảnh trước khi đi vào chi tiết.",
        primary_button: {
          text: "Tạo một sáng kiến",
        },
      },
      search: {
        title: "Không có sáng kiến phù hợp",
        description: `Không phát hiện sáng kiến nào với tiêu chí phù hợp.
 Tạo một sáng kiến mới thay thế.`,
      },
      not_found: {
        title: "Sáng kiến không tồn tại",
        description: "Sáng kiến bạn đang tìm kiếm không tồn tại, đã được lưu trữ hoặc đã bị xóa.",
        primary_button: {
          text: "Xem Sáng kiến khác",
        },
      },
      epics: {
        title: "Không có sáng kiến phù hợp",
        subHeading: "Tạo một sáng kiến mới thay thế.",
        action: "Tạo sáng kiến",
      },
    },
    scope: {
      view_scope: "Xem phạm vi",
      breakdown: "Phân tích phạm vi",
      add_scope: "Thêm phạm vi",
      label: "Phạm vi",
      empty_state: {
        title: "Chưa thêm phạm vi nào đến sáng kiến này",
        description: "Kết nối dự án và epic với sáng kiến này để bắt đầu.",
        primary_button: {
          text: "Thêm phạm vi",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Nhãn",
        description: "Cấu trúc và tổ chức các sáng kiến của bạn với nhãn.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Xóa nhãn",
        content:
          "Bạn có chắc chắn muốn xóa {labelName}? Việc này sẽ xóa nhãn khỏi tất cả các sáng kiến và bất kỳ chế độ xem nào đang lọc theo nhãn này.",
      },
      toast: {
        delete_error: "Không thể xóa nhãn sáng kiến. Vui lòng thử lại.",
        label_already_exists: "Nhãn đã tồn tại",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Viết ghi chú, tài liệu, hoặc cơ sở kiến thức đầy đủ. Nhờ Galileo, trợ lý AI của Plane, giúp bạn bắt đầu",
        description:
          "Trang là không gian lưu trữ ý tưởng trong Plane. Ghi lại ghi chú cuộc họp, định dạng chúng dễ dàng, nhúng mục công việc, bố trí chúng bằng thư viện các thành phần, và giữ tất cả trong ngữ cảnh dự án của bạn. Để làm ngắn gọn bất kỳ tài liệu nào, gọi Galileo, AI của Plane, bằng phím tắt hoặc nhấp vào nút.",
        primary_button: {
          text: "Tạo trang đầu tiên của bạn",
        },
      },
      private: {
        title: "Chưa có trang riêng tư",
        description: "Giữ suy nghĩ riêng tư của bạn ở đây. Khi bạn sẵn sàng chia sẻ, nhóm chỉ cách một cú nhấp chuột.",
        primary_button: {
          text: "Tạo trang đầu tiên của bạn",
        },
      },
      public: {
        title: "Chưa có trang không gian làm việc",
        description: "Xem các trang được chia sẻ với mọi người trong không gian làm việc của bạn ngay tại đây.",
        primary_button: {
          text: "Tạo trang đầu tiên của bạn",
        },
      },
      archived: {
        title: "Chưa có trang đã lưu trữ",
        description: "Lưu trữ các trang không nằm trong tầm nhìn của bạn. Truy cập chúng ở đây khi cần thiết.",
      },
    },
  },
  epics: {
    label: "Epics",
    no_epics_selected: "Không có epic nào được chọn",
    add_selected_epics: "Thêm các epic đã chọn",
    epic_link_copied_to_clipboard: "Liên kết Epic đã được sao chép vào clipboard.",
    project_link_copied_to_clipboard: "Liên kết dự án đã được sao chép vào clipboard",
    empty_state: {
      general: {
        title: "Tạo một epic và gán nó cho ai đó, thậm chí là chính bạn",
        description:
          "Đối với khối lượng công việc lớn hơn kéo dài qua nhiều chu kỳ và có thể tồn tại qua các module, hãy tạo một epic. Liên kết các mục công việc và mục công việc phụ trong một dự án với một epic và chuyển vào một mục công việc từ tổng quan.",
        primary_button: {
          text: "Tạo một Epic",
        },
      },
      section: {
        title: "Chưa có epic nào",
        description: "Bắt đầu thêm epic để quản lý và theo dõi tiến độ.",
        primary_button: {
          text: "Thêm epic",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Không tìm thấy epic phù hợp",
      },
      no_epics: {
        title: "Không tìm thấy epic nào",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Không có chu kỳ đang hoạt động",
        description:
          "Chu kỳ của các dự án của bạn bao gồm bất kỳ khoảng thời gian nào bao gồm ngày hôm nay trong phạm vi của nó. Tìm tiến độ và chi tiết của tất cả chu kỳ đang hoạt động của bạn tại đây.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Thêm mục công việc vào chu kỳ để xem tiến độ
 của nó`,
      },
      priority: {
        title: `Quan sát các mục công việc ưu tiên cao được giải quyết trong
 chu kỳ chỉ với một cái nhìn.`,
      },
      assignee: {
        title: `Thêm người được gán cho mục công việc để xem
 phân tích công việc theo người được gán.`,
      },
      label: {
        title: `Thêm nhãn vào mục công việc để xem
 phân tích công việc theo nhãn.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Nhập thành viên từ CSV",
      description: "Tải lên CSV với các cột: Email, Display Name, First Name, Last Name, Role (5, 15 hoặc 20)",
      dropzone: {
        active: "Thả tệp CSV vào đây",
        inactive: "Kéo & thả hoặc nhấp để tải lên",
        file_type: "Chỉ hỗ trợ tệp .csv",
      },
      buttons: {
        cancel: "Hủy",
        import: "Nhập",
        try_again: "Thử lại",
        close: "Đóng",
        done: "Hoàn tất",
      },
      progress: {
        uploading: "Đang tải lên...",
        importing: "Đang nhập...",
      },
      summary: {
        title: {
          failed: "Nhập thất bại",
          complete: "Nhập hoàn tất",
        },
        message: {
          seat_limit: "Không thể nhập thành viên do hạn chế số ghế.",
          success: "Đã thêm thành công {count} thành viên vào không gian làm việc.",
          no_imports: "Không có thành viên nào được nhập từ tệp CSV.",
        },
        stats: {
          successful: "Thành công",
          failed: "Thất bại",
        },
        download_errors: "Tải xuống lỗi",
      },
      toast: {
        invalid_file: {
          title: "Tệp không hợp lệ",
          message: "Chỉ hỗ trợ tệp CSV.",
        },
        import_failed: {
          title: "Nhập thất bại",
          message: "Đã xảy ra lỗi.",
        },
      },
    },
  },
  project: {
    members_import: {
      title: "Nhập thành viên từ CSV",
      description:
        "Tải lên CSV với các cột: Email và Vai trò (5=Khách, 15=Thành viên, 20=Quản trị viên). Người dùng phải đã là thành viên không gian làm việc.",
      download_sample: "Tải xuống CSV mẫu",
      dropzone: {
        active: "Thả tệp CSV vào đây",
        inactive: "Kéo & thả hoặc nhấp để tải lên",
        file_type: "Chỉ hỗ trợ tệp .csv",
      },
      buttons: {
        cancel: "Hủy",
        import: "Nhập",
        try_again: "Thử lại",
        close: "Đóng",
        done: "Hoàn tất",
      },
      progress: {
        uploading: "Đang tải lên...",
        importing: "Đang nhập...",
      },
      summary: {
        title: {
          complete: "Nhập hoàn tất",
        },
        message: {
          success: "Đã nhập thành công {count} thành viên vào dự án.",
          no_imports: "Không có thành viên mới nào được nhập từ tệp CSV.",
        },
        stats: {
          added: "Đã thêm",
          reactivated: "Đã kích hoạt lại",
          already_members: "Đã là thành viên",
          skipped: "Đã bỏ qua",
        },
        download_errors: "Tải xuống chi tiết đã bỏ qua",
      },
      toast: {
        invalid_file: {
          title: "Tệp không hợp lệ",
          message: "Chỉ hỗ trợ tệp CSV.",
        },
        import_failed: {
          title: "Nhập thất bại",
          message: "Đã xảy ra lỗi.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Không thể lưu trữ mục công việc",
        message: "Chỉ các mục công việc thuộc nhóm trạng thái Hoàn thành hoặc Đã hủy mới có thể được lưu trữ.",
      },
      invalid_issue_start_date: {
        title: "Không thể cập nhật mục công việc",
        message:
          "Ngày bắt đầu đã chọn vượt quá ngày đến hạn cho một số mục công việc. Đảm bảo ngày bắt đầu phải trước ngày đến hạn.",
      },
      invalid_issue_target_date: {
        title: "Không thể cập nhật mục công việc",
        message:
          "Ngày đến hạn đã chọn trước ngày bắt đầu cho một số mục công việc. Đảm bảo ngày đến hạn phải sau ngày bắt đầu.",
      },
      invalid_state_transition: {
        title: "Không thể cập nhật mục công việc",
        message:
          "Thay đổi trạng thái không được phép cho một số mục công việc. Đảm bảo thay đổi trạng thái được cho phép.",
      },
    },
  },
  work_item_types: {
    label: "Loại mục công việc",
    label_lowercase: "loại mục công việc",
    settings: {
      title: "Loại mục công việc",
      properties: {
        title: "Thuộc tính tùy chỉnh",
        tooltip:
          "Mỗi loại mục công việc đi kèm với một bộ thuộc tính mặc định như Tiêu đề, Mô tả, Người được giao, Trạng thái, Ưu tiên, Ngày bắt đầu, Ngày đến hạn, Module, Chu kỳ, v.v. Bạn cũng có thể tùy chỉnh và thêm thuộc tính riêng của mình để phù hợp với nhu cầu của nhóm bạn.",
        add_button: "Thêm thuộc tính mới",
        dropdown: {
          label: "Loại thuộc tính",
          placeholder: "Chọn loại",
        },
        property_type: {
          text: {
            label: "Văn bản",
          },
          number: {
            label: "Số",
          },
          dropdown: {
            label: "Dropdown",
          },
          boolean: {
            label: "Boolean",
          },
          date: {
            label: "Ngày",
          },
          member_picker: {
            label: "Chọn thành viên",
          },
          release_picker: {
            label: "Bộ chọn bản phát hành",
          },
          formula: {
            label: "Công thức",
          },
        },
        attributes: {
          label: "Thuộc tính",
          text: {
            single_line: {
              label: "Một dòng",
            },
            multi_line: {
              label: "Đoạn văn",
            },
            readonly: {
              label: "Chỉ đọc",
              header: "Dữ liệu chỉ đọc",
            },
            invalid_text_format: {
              label: "Định dạng văn bản không hợp lệ",
            },
          },
          number: {
            default: {
              placeholder: "Thêm số",
            },
          },
          relation: {
            single_select: {
              label: "Chọn một",
            },
            multi_select: {
              label: "Chọn nhiều",
            },
            no_default_value: {
              label: "Không có giá trị mặc định",
            },
          },
          boolean: {
            label: "Đúng | Sai",
            no_default: "Không có giá trị mặc định",
          },
          option: {
            create_update: {
              label: "Tùy chọn",
              form: {
                placeholder: "Thêm tùy chọn",
                errors: {
                  name: {
                    required: "Tên tùy chọn là bắt buộc.",
                    integrity: "Tùy chọn với cùng tên đã tồn tại.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Chọn tùy chọn",
                multi: {
                  default: "Chọn tùy chọn",
                  variable: "{count} tùy chọn đã chọn",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Thành công!",
              message: "Thuộc tính {name} đã được tạo thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Không thể tạo thuộc tính. Vui lòng thử lại!",
            },
          },
          update: {
            success: {
              title: "Thành công!",
              message: "Thuộc tính {name} đã được cập nhật thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Không thể cập nhật thuộc tính. Vui lòng thử lại!",
            },
          },
          delete: {
            success: {
              title: "Thành công!",
              message: "Thuộc tính {name} đã được xóa thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Không thể xóa thuộc tính. Vui lòng thử lại!",
            },
          },
          enable_disable: {
            loading: "{action} thuộc tính {name}",
            success: {
              title: "Thành công!",
              message: "Thuộc tính {name} đã được {action} thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Không thể {action} thuộc tính. Vui lòng thử lại!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Tiêu đề",
            },
            description: {
              placeholder: "Mô tả",
            },
          },
          errors: {
            name: {
              required: "Bạn phải đặt tên cho thuộc tính của mình.",
              max_length: "Tên thuộc tính không được vượt quá 255 ký tự.",
            },
            property_type: {
              required: "Bạn phải chọn một loại thuộc tính.",
            },
            options: {
              required: "Bạn phải thêm ít nhất một tùy chọn.",
            },
            formula: {
              required: "Biểu thức công thức là bắt buộc.",
              invalid: "Công thức không hợp lệ: {error}",
              circular_reference:
                "Phát hiện tham chiếu vòng. Công thức không thể tham chiếu chính nó trực tiếp hoặc gián tiếp.",
              invalid_reference: "Công thức tham chiếu đến thuộc tính không tồn tại.",
            },
          },
        },
        formula: {
          field_label: "Trường công thức",
          tooltip: "Nhập công thức sử dụng cú pháp '{'Tên trường'}'. Hỗ trợ các toán tử +, -, *, / và &.",
          placeholder: "Viết công thức",
          test_button: "Kiểm tra",
          validating: "Đang xác thực",
          validation_success: "Công thức hợp lệ! Trả về {resultType}",
          validation_success_with_refs: "Công thức hợp lệ! Trả về {resultType} ({count} trường được tham chiếu)",
          error: {
            empty: "Vui lòng nhập công thức",
            missing_context: "Thiếu ngữ cảnh không gian làm việc, dự án hoặc loại mục công việc",
            validation_failed: "Xác thực thất bại",
          },
          picker: {
            no_match: "Không có thuộc tính phù hợp",
            no_available: "Không có thuộc tính khả dụng",
          },
        },
        enable_disable: {
          label: "Đang hoạt động",
          tooltip: {
            disabled: "Nhấp để vô hiệu hóa",
            enabled: "Nhấp để kích hoạt",
          },
        },
        delete_confirmation: {
          title: "Xóa thuộc tính này",
          description: "Việc xóa thuộc tính có thể dẫn đến mất dữ liệu hiện có.",
          secondary_description: "Bạn có muốn vô hiệu hóa thuộc tính thay thế?",
          primary_button: "{action}, xóa nó",
          secondary_button: "Có, vô hiệu hóa nó",
        },
        mandate_confirmation: {
          label: "Thuộc tính bắt buộc",
          content:
            "Có vẻ như có một tùy chọn mặc định cho thuộc tính này. Việc làm cho thuộc tính trở thành bắt buộc sẽ xóa giá trị mặc định và người dùng sẽ phải thêm một giá trị theo lựa chọn của họ.",
          tooltip: {
            disabled: "Loại thuộc tính này không thể được làm thành bắt buộc",
            enabled: "Bỏ chọn để đánh dấu trường là tùy chọn",
            checked: "Chọn để đánh dấu trường là bắt buộc",
          },
        },
        empty_state: {
          title: "Thêm thuộc tính tùy chỉnh",
          description: "Các thuộc tính mới bạn thêm cho loại mục công việc này sẽ hiển thị ở đây.",
        },
      },
      item_delete_confirmation: {
        title: "Xóa loại này",
        description: "Việc xóa các loại có thể dẫn đến mất dữ liệu hiện có.",
        primary_button: "Vâng, xóa nó",
        toast: {
          success: {
            title: "Thành công!",
            message: "Đã xóa thành công loại mục công việc.",
          },
          error: {
            title: "Lỗi!",
            message: "Không thể xóa loại mục công việc. Vui lòng thử lại!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Không thể xóa loại mục công việc mặc định",
          cannot_delete_work_item_type_with_associated_work_items:
            "Không thể xóa loại mục công việc có mục công việc liên quan",
        },
        can_disable_warning: "Bạn có muốn tắt loại này thay thế không?",
      },
      cant_delete_default_message:
        "Không thể xóa loại hạng mục công việc này vì nó đang được liên kết với các hạng mục công việc hiện có.",
      set_as_default: "Đặt làm mặc định",
      cant_set_default_inactive_message: "Kích hoạt loại này trước khi đặt làm mặc định",
      set_default_confirmation: {
        title: "Đặt làm loại hạng mục công việc mặc định",
        description:
          "Đặt {name} làm mặc định sẽ nhập nó vào tất cả các dự án trong không gian làm việc này. Tất cả hạng mục công việc mới sẽ sử dụng loại này theo mặc định.",
        confirm_button: "Đặt làm mặc định",
      },
    },
    create: {
      title: "Tạo loại mục công việc",
      button: "Thêm loại mục công việc",
      toast: {
        success: {
          title: "Thành công!",
          message: "Loại mục công việc đã được tạo thành công.",
        },
        error: {
          title: "Lỗi!",
          message: {
            conflict: "Loại {name} đã tồn tại. Hãy chọn một tên khác.",
          },
        },
      },
    },
    update: {
      title: "Cập nhật loại mục công việc",
      button: "Cập nhật loại mục công việc",
      toast: {
        success: {
          title: "Thành công!",
          message: "Loại mục công việc {name} đã được cập nhật thành công.",
        },
        error: {
          title: "Lỗi!",
          message: {
            conflict: "Loại {name} đã tồn tại. Hãy chọn một tên khác.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Đặt cho loại mục công việc này một tên duy nhất",
        },
        description: {
          placeholder: "Mô tả loại mục công việc này dùng để làm gì và khi nào nên sử dụng nó.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} loại mục công việc {name}",
        success: {
          title: "Thành công!",
          message: "Loại mục công việc {name} đã được {action} thành công.",
        },
        error: {
          title: "Lỗi!",
          message: "Không thể {action} loại mục công việc. Vui lòng thử lại!",
        },
      },
      tooltip: "Nhấp để {action}",
    },
    change_confirmation: {
      title: "Thay đổi loại mục công việc?",
      description:
        "Thay đổi loại mục công việc có thể dẫn đến mất các giá trị thuộc tính tùy chỉnh cụ thể cho loại hiện tại. Hành động này không thể hoàn tác.",
      button: {
        loading: "Đang thay đổi",
        default: "Thay đổi loại",
      },
    },
    empty_state: {
      enable: {
        title: "Kích hoạt Loại mục công việc",
        description:
          "Định hình mục công việc theo công việc của bạn với Loại mục công việc. Tùy chỉnh với biểu tượng, nền và thuộc tính và cấu hình chúng cho dự án này.",
        primary_button: {
          text: "Kích hoạt",
        },
        confirmation: {
          title: "Khi đã kích hoạt, Loại mục công việc không thể bị vô hiệu hóa.",
          description:
            "Mục công việc của Plane sẽ trở thành loại mục công việc mặc định cho dự án này và sẽ hiển thị với biểu tượng và nền của nó trong dự án này.",
          button: {
            default: "Kích hoạt",
            loading: "Đang thiết lập",
          },
        },
      },
      get_pro: {
        title: "Nâng cấp lên Pro để kích hoạt Loại mục công việc.",
        description:
          "Định hình mục công việc theo công việc của bạn với Loại mục công việc. Tùy chỉnh với biểu tượng, nền và thuộc tính và cấu hình chúng cho dự án này.",
        primary_button: {
          text: "Nâng cấp lên Pro",
        },
      },
      upgrade: {
        title: "Nâng cấp để kích hoạt Loại mục công việc.",
        description:
          "Định hình mục công việc theo công việc của bạn với Loại mục công việc. Tùy chỉnh với biểu tượng, nền và thuộc tính và cấu hình chúng cho dự án này.",
        primary_button: {
          text: "Nâng cấp",
        },
      },
    },
  },
  importers: {
    imports: "Nhập",
    logo: "Logo",
    import_message: "Nhập dữ liệu {serviceName} của bạn vào các dự án plane.",
    deactivate: "Hủy kích hoạt",
    deactivating: "Đang hủy kích hoạt",
    migrating: "Đang di chuyển",
    migrations: "Di chuyển",
    refreshing: "Đang làm mới",
    import: "Nhập",
    serial_number: "STT.",
    project: "Dự án",
    workspace: "Workspace",
    status: "Trạng thái",
    summary: "Tóm tắt",
    total_batches: "Tổng số lô",
    imported_batches: "Số lô đã nhập",
    re_run: "Chạy lại",
    cancel: "Hủy",
    start_time: "Thời gian bắt đầu",
    no_jobs_found: "Không tìm thấy công việc nào",
    no_project_imports: "Bạn chưa nhập bất kỳ dự án {serviceName} nào.",
    cancel_import_job: "Hủy công việc nhập",
    cancel_import_job_confirmation:
      "Bạn có chắc muốn hủy công việc nhập này không? Điều này sẽ dừng quá trình nhập cho dự án này.",
    re_run_import_job: "Chạy lại công việc nhập",
    re_run_import_job_confirmation:
      "Bạn có chắc muốn chạy lại công việc nhập này không? Điều này sẽ khởi động lại quá trình nhập cho dự án này.",
    upload_csv_file: "Tải lên tệp CSV để nhập dữ liệu người dùng.",
    connect_importer: "Kết nối {serviceName}",
    migration_assistant: "Trợ lý di chuyển",
    migration_assistant_description:
      "Di chuyển dự án {serviceName} của bạn sang Plane một cách liền mạch với trợ lý mạnh mẽ của chúng tôi.",
    token_helper: "Bạn sẽ nhận được từ",
    personal_access_token: "Mã thông báo truy cập cá nhân",
    source_token_expired: "Mã thông báo hết hạn",
    source_token_expired_description:
      "Mã thông báo đã cung cấp đã hết hạn. Vui lòng hủy kích hoạt và kết nối lại với bộ thông tin đăng nhập mới.",
    user_email: "Email người dùng",
    select_state: "Chọn trạng thái",
    select_service_project: "Chọn dự án {serviceName}",
    loading_service_projects: "Đang tải dự án {serviceName}",
    select_service_workspace: "Chọn workspace {serviceName}",
    loading_service_workspaces: "Đang tải workspace {serviceName}",
    select_priority: "Chọn ưu tiên",
    select_service_team: "Chọn nhóm {serviceName}",
    add_seat_msg_free_trial:
      "Bạn đang cố nhập {additionalUserCount} người dùng chưa đăng ký và bạn chỉ có {currentWorkspaceSubscriptionAvailableSeats} chỗ có sẵn trong gói hiện tại. Để tiếp tục nhập, hãy nâng cấp ngay.",
    add_seat_msg_paid:
      "Bạn đang cố nhập {additionalUserCount} người dùng chưa đăng ký và bạn chỉ có {currentWorkspaceSubscriptionAvailableSeats} chỗ có sẵn trong gói hiện tại. Để tiếp tục nhập, hãy mua ít nhất {extraSeatRequired} chỗ bổ sung.",
    skip_user_import_title: "Bỏ qua việc nhập dữ liệu người dùng",
    skip_user_import_description:
      "Việc bỏ qua nhập người dùng sẽ dẫn đến mục công việc, bình luận và dữ liệu khác từ {serviceName} được tạo bởi người dùng thực hiện việc di chuyển trong Plane. Bạn vẫn có thể thêm người dùng thủ công sau.",
    invalid_pat: "Mã thông báo truy cập cá nhân không hợp lệ",
  },
  integrations: {
    integrations: "Tích hợp",
    loading: "Đang tải",
    unauthorized: "Bạn không được phép xem trang này.",
    configure: "Cấu hình",
    not_enabled: "{name} không được kích hoạt cho workspace này.",
    not_configured: "Chưa được cấu hình",
    disconnect_personal_account: "Ngắt kết nối tài khoản {providerName} cá nhân",
    not_configured_message_admin: "Tích hợp {name} chưa được cấu hình. Vui lòng liên hệ quản trị viên để cấu hình.",
    not_configured_message_support: "Tích hợp {name} chưa được cấu hình. Vui lòng liên hệ hỗ trợ để cấu hình.",
    external_api_unreachable: "Không thể truy cập API bên ngoài. Vui lòng thử lại sau.",
    error_fetching_supported_integrations: "Không thể lấy các tích hợp được hỗ trợ. Vui lòng thử lại sau.",
    back_to_integrations: "Quay lại tích hợp",
    select_state: "Chọn trạng thái",
    set_state: "Cập nhật trạng thái",
    choose_project: "Chọn dự án...",
    skip_backward_state_movement: "Ngăn các vấn đề chuyển về trạng thái trước đó do cập nhật PR",
  },
  github_integration: {
    name: "GitHub",
    description: "Kết nối và đồng bộ các mục công việc GitHub của bạn với Plane",
    connect_org: "Kết nối tổ chức",
    connect_org_description: "Kết nối tổ chức GitHub của bạn với Plane",
    processing: "Đang xử lý",
    org_added_desc: "GitHub org đã được thêm vào vào thời gian",
    connection_fetch_error: "Lỗi khi lấy chi tiết kết nối từ máy chủ",
    personal_account_connected: "Tài khoản cá nhân đã kết nối",
    personal_account_connected_description: "Tài khoản GitHub của bạn đã được kết nối với Plane",
    connect_personal_account: "Kết nối tài khoản cá nhân",
    connect_personal_account_description: "Kết nối tài khoản GitHub cá nhân của bạn với Plane.",
    repo_mapping: "Map kho lưu trữ",
    repo_mapping_description: "Map kho lưu trữ GitHub của bạn với dự án Plane.",
    project_issue_sync: "Đồng bộ vấn đề dự án",
    project_issue_sync_description: "Đồng bộ vấn đề từ GitHub đến dự án Plane của bạn",
    project_issue_sync_empty_state: "Các đồng bộ vấn đề dự án đã được ánh xạ sẽ xuất hiện ở đây",
    configure_project_issue_sync_state: "Cấu hình trạng thái đồng bộ vấn đề",
    select_issue_sync_direction: "Chọn hướng đồng bộ vấn đề",
    allow_bidirectional_sync: "Bidirectional - Đồng bộ vấn đề và bình luận trong cả hai hướng giữa GitHub và Plane",
    allow_unidirectional_sync: "Unidirectional - Đồng bộ vấn đề từ vấn đề và bình luận GitHub đến Plane chỉ",
    allow_unidirectional_sync_warning:
      "Dữ liệu từ GitHub Issue sẽ thay thế dữ liệu trong Mục Công việc Plane Được Liên kết (chỉ GitHub → Plane)",
    remove_project_issue_sync: "Xóa đồng bộ vấn đề dự án này",
    remove_project_issue_sync_confirmation: "Bạn có chắc muốn xóa đồng bộ vấn đề dự án này?",
    add_pr_state_mapping: "Thêm map trạng thái pull request cho dự án Plane",
    edit_pr_state_mapping: "Sửa map trạng thái pull request cho dự án Plane",
    pr_state_mapping: "Map trạng thái pull request",
    pr_state_mapping_description: "Map trạng thái pull request từ GitHub đến dự án Plane của bạn",
    pr_state_mapping_empty_state: "Các trạng thái PR đã được ánh xạ sẽ xuất hiện ở đây",
    remove_pr_state_mapping: "Xóa map trạng thái pull request này",
    remove_pr_state_mapping_confirmation: "Bạn có chắc muốn xóa map trạng thái pull request này?",
    issue_sync_message: "Mục công viện được đồng bộ với {project}",
    link: "Liên kết kho lưu trữ GitHub với dự án Plane",
    pull_request_automation: "Tự động hóa pull request",
    pull_request_automation_description: "Cấu hình map trạng thái pull request từ GitHub đến dự án Plane của bạn",
    DRAFT_MR_OPENED: "Draft Mở",
    MR_OPENED: "Mở",
    MR_READY_FOR_MERGE: "Sẵn sàng để hợp nhất",
    MR_REVIEW_REQUESTED: "Yêu cầu xem xét",
    MR_MERGED: "Hợp nhất",
    MR_CLOSED: "Đóng",
    ISSUE_OPEN: "Issue Mở",
    ISSUE_CLOSED: "Issue Đóng",
    save: "Lưu",
    start_sync: "Bắt đầu đồng bộ",
    choose_repository: "Chọn kho lưu trữ...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Kết nối và đồng bộ Merge Requests của Gitlab với Plane.",
    connection_fetch_error: "Lỗi khi lấy chi tiết kết nối từ máy chủ",
    connect_org: "Kết nối tổ chức",
    connect_org_description: "Kết nối tổ chức Gitlab của bạn với Plane.",
    project_connections: "Kết nối dự án Gitlab",
    project_connections_description: "Đồng bộ yêu cầu hợp nhất từ Gitlab sang dự án Plane.",
    plane_project_connection: "Kết nối dự án Plane",
    plane_project_connection_description: "Cấu hình ánh xạ trạng thái pull request từ Gitlab sang dự án Plane",
    remove_connection: "Xóa kết nối",
    remove_connection_confirmation: "Bạn có chắc muốn xóa kết nối này không?",
    link: "Liên kết kho lưu trữ Gitlab với dự án Plane",
    pull_request_automation: "Tự động hóa Pull Request",
    pull_request_automation_description: "Cấu hình ánh xạ trạng thái pull request từ Gitlab sang Plane",
    DRAFT_MR_OPENED: "Khi dự thảo MR mở, đặt trạng thái thành",
    MR_OPENED: "Khi MR mở, đặt trạng thái thành",
    MR_REVIEW_REQUESTED: "Khi yêu cầu xem xét MR, đặt trạng thái thành",
    MR_READY_FOR_MERGE: "Khi MR sẵn sàng để hợp nhất, đặt trạng thái thành",
    MR_MERGED: "Khi MR được hợp nhất, đặt trạng thái thành",
    MR_CLOSED: "Khi MR đóng, đặt trạng thái thành",
    integration_enabled_text:
      "Với tích hợp Gitlab được Kích hoạt, bạn có thể tự động hóa quy trình làm việc của mục công việc",
    choose_entity: "Chọn thực thể",
    choose_project: "Chọn dự án",
    link_plane_project: "Liên kết dự án Plane",
    project_issue_sync: "Đồng bộ vấn đề dự án",
    project_issue_sync_description: "Đồng bộ vấn đề từ Gitlab sang dự án Plane của bạn",
    project_issue_sync_empty_state: "Đồng bộ vấn đề dự án đã ánh xạ sẽ xuất hiện ở đây",
    configure_project_issue_sync_state: "Cấu hình trạng thái đồng bộ vấn đề",
    select_issue_sync_direction: "Chọn hướng đồng bộ vấn đề",
    allow_bidirectional_sync: "Hai chiều - Đồng bộ vấn đề và bình luận cả hai chiều giữa Gitlab và Plane",
    allow_unidirectional_sync: "Một chiều - Chỉ đồng bộ vấn đề và bình luận từ Gitlab sang Plane",
    allow_unidirectional_sync_warning:
      "Dữ liệu từ Gitlab Issue sẽ thay thế dữ liệu trong Mục công việc Plane được liên kết (chỉ Gitlab → Plane)",
    remove_project_issue_sync: "Xóa đồng bộ vấn đề dự án này",
    remove_project_issue_sync_confirmation: "Bạn có chắc muốn xóa đồng bộ vấn đề dự án này không?",
    ISSUE_OPEN: "Vấn đề mở",
    ISSUE_CLOSED: "Vấn đề đóng",
    save: "Lưu",
    start_sync: "Bắt đầu đồng bộ",
    choose_repository: "Chọn kho lưu trữ...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Kết nối và đồng bộ instance Gitlab Enterprise của bạn với Plane.",
    app_form_title: "Cấu hình Gitlab Enterprise",
    app_form_description: "Cấu hình Gitlab Enterprise để kết nối với Plane.",
    base_url_title: "URL Cơ bản",
    base_url_description: "URL cơ bản của instance Gitlab Enterprise của bạn.",
    base_url_placeholder: 'ví dụ: "https://glab.plane.town"',
    base_url_error: "URL cơ bản là bắt buộc",
    invalid_base_url_error: "URL cơ bản không hợp lệ",
    client_id_title: "ID Ứng dụng",
    client_id_description: "ID của ứng dụng bạn đã tạo trong instance Gitlab Enterprise của bạn.",
    client_id_placeholder: 'ví dụ: "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID Ứng dụng là bắt buộc",
    client_secret_title: "Client Secret",
    client_secret_description: "Client secret của ứng dụng bạn đã tạo trong instance Gitlab Enterprise của bạn.",
    client_secret_placeholder: 'ví dụ: "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret là bắt buộc",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Webhook secret ngẫu nhiên sẽ được sử dụng để xác minh webhook từ instance Gitlab Enterprise.",
    webhook_secret_placeholder: 'ví dụ: "webhook1234567890"',
    webhook_secret_error: "Webhook secret là bắt buộc",
    connect_app: "Kết nối Ứng dụng",
  },
  slack_integration: {
    name: "Slack",
    description: "Kết nối workspace Slack của bạn với Plane.",
    connect_personal_account: "Kết nối tài khoản Slack cá nhân của bạn với Plane.",
    personal_account_connected: "Tài khoản {providerName} cá nhân của bạn hiện đã được kết nối với Plane.",
    link_personal_account: "Liên kết tài khoản {providerName} cá nhân của bạn với Plane.",
    connected_slack_workspaces: "Các workspace Slack đã kết nối",
    connected_on: "Đã kết nối vào {date}",
    disconnect_workspace: "Ngắt kết nối workspace {name}",
    alerts: {
      dm_alerts: {
        title:
          "Nhận thông báo trong tin nhắn trực tiếp Slack cho các cập nhật quan trọng, lời nhắc và cảnh báo chỉ dành cho bạn.",
      },
    },
    project_updates: {
      title: "Cập Nhật Dự Án",
      description: "Cấu hình thông báo cập nhật dự án cho các dự án của bạn",
      add_new_project_update: "Thêm thông báo cập nhật dự án mới",
      project_updates_empty_state: "Các dự án kết nối với Kênh Slack sẽ xuất hiện ở đây.",
      project_updates_form: {
        title: "Cấu Hình Cập Nhật Dự Án",
        description: "Nhận thông báo cập nhật dự án trong Slack khi các mục công việc được tạo",
        failed_to_load_channels: "Không thể tải kênh từ Slack",
        project_dropdown: {
          placeholder: "Chọn dự án",
          label: "Dự Án Plane",
          no_projects: "Không có dự án nào khả dụng",
        },
        channel_dropdown: {
          label: "Kênh Slack",
          placeholder: "Chọn kênh",
          no_channels: "Không có kênh nào khả dụng",
        },
        all_projects_connected: "Tất cả các dự án đã được kết nối với kênh Slack.",
        all_channels_connected: "Tất cả các kênh Slack đã được kết nối với dự án.",
        project_connection_success: "Kết nối dự án được tạo thành công",
        project_connection_updated: "Kết nối dự án được cập nhật thành công",
        project_connection_deleted: "Kết nối dự án được xóa thành công",
        failed_delete_project_connection: "Không thể xóa kết nối dự án",
        failed_create_project_connection: "Không thể tạo kết nối dự án",
        failed_upserting_project_connection: "Không thể cập nhật kết nối dự án",
        failed_loading_project_connections:
          "Chúng tôi không thể tải kết nối dự án của bạn. Điều này có thể do sự cố mạng hoặc sự cố với tích hợp.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Kết nối không gian làm việc Sentry của bạn với Plane.",
    connected_sentry_workspaces: "Không gian làm việc Sentry đã kết nối",
    connected_on: "Đã kết nối vào {date}",
    disconnect_workspace: "Ngắt kết nối không gian làm việc {name}",
    state_mapping: {
      title: "Ánh xạ trạng thái",
      description:
        "Ánh xạ trạng thái sự cố Sentry với trạng thái dự án của bạn. Cấu hình trạng thái nào sử dụng khi sự cố Sentry được giải quyết hoặc chưa giải quyết.",
      add_new_state_mapping: "Thêm ánh xạ trạng thái mới",
      empty_state:
        "Chưa cấu hình ánh xạ trạng thái. Tạo ánh xạ đầu tiên để đồng bộ trạng thái sự cố Sentry với trạng thái dự án của bạn.",
      failed_loading_state_mappings:
        "Chúng tôi không thể tải ánh xạ trạng thái của bạn. Điều này có thể do vấn đề mạng hoặc vấn đề với tích hợp.",
      loading_project_states: "Đang tải trạng thái dự án...",
      error_loading_states: "Lỗi khi tải trạng thái",
      no_states_available: "Không có trạng thái khả dụng",
      no_permission_states: "Bạn không có quyền truy cập trạng thái cho dự án này",
      states_not_found: "Không tìm thấy trạng thái dự án",
      server_error_states: "Lỗi máy chủ khi tải trạng thái",
    },
  },
  oauth_bridge_integration: {
    name: "OAuth Bridge",
    description: "Xác thực token IdP bên ngoài để truy cập API.",
    header_description:
      "Xác thực token OIDC/JWT được cấp bên ngoài từ IdP của bạn (Azure AD, Okta, v.v.) để truy cập API Plane.",
    connected: "Đã kết nối",
    connect: "Kết nối",
    uninstall: "Gỡ cài đặt",
    uninstalling: "Đang gỡ cài đặt...",
    install_success: "OAuth Bridge đã được cài đặt thành công.",
    install_error: "Không thể cài đặt OAuth Bridge.",
    uninstall_success: "OAuth Bridge đã được gỡ cài đặt.",
    uninstall_error: "Không thể gỡ cài đặt OAuth Bridge.",
    token_providers: "Nhà cung cấp token",
    token_providers_description: "Cấu hình các IdP bên ngoài có JWT được chấp nhận làm thông tin xác thực API.",
    add_provider: "Thêm nhà cung cấp",
    edit_provider: "Sửa nhà cung cấp",
    enabled: "Đã bật",
    disabled: "Đã tắt",
    test: "Kiểm tra",
    no_providers_title: "Chưa có nhà cung cấp nào được cấu hình.",
    no_providers_description: "Thêm IdP để bật xác thực token bên ngoài.",
    provider_updated: "Nhà cung cấp đã được cập nhật.",
    provider_added: "Nhà cung cấp đã được thêm.",
    provider_save_error: "Không thể lưu nhà cung cấp.",
    provider_deleted: "Nhà cung cấp đã được xóa.",
    provider_delete_error: "Không thể xóa nhà cung cấp.",
    provider_update_error: "Không thể cập nhật nhà cung cấp.",
    jwks_reachable: "JWKS có thể truy cập",
    jwks_unreachable: "JWKS không thể truy cập",
    jwks_test_error: "Không thể lấy JWKS từ URL đã cấu hình.",
    provider_form: {
      name_label: "Tên",
      name_placeholder: "vd. Azure AD Production",
      name_description: "Nhãn dễ đọc cho nhà cung cấp danh tính này",
      name_required: "Tên là bắt buộc.",
      issuer_label: "Nhà phát hành",
      issuer_placeholder: "https://login.microsoftonline.com/tenant-id/v2.0",
      issuer_description: "Giá trị claim iss mong đợi trong JWT",
      issuer_required: "Nhà phát hành là bắt buộc.",
      jwks_url_label: "URL JWKS",
      jwks_url_placeholder: "https://login.microsoftonline.com/tenant-id/discovery/v2.0/keys",
      jwks_url_description: "Endpoint HTTPS cung cấp JSON Web Key Set của nhà cung cấp",
      jwks_url_required: "URL JWKS là bắt buộc.",
      jwks_url_https: "URL JWKS phải sử dụng HTTPS.",
      audience_label: "Đối tượng",
      audience_placeholder: "api://my-app-id",
      audience_description: "Claim aud mong đợi trong JWT, phân tách bằng dấu phẩy.",
      user_claim_label: "Claim người dùng",
      user_claim_placeholder: "email",
      user_claim_description: "Claim JWT chứa địa chỉ email của người dùng",
      user_claim_required: "Claim người dùng là bắt buộc.",
      allowed_algorithms_label: "Thuật toán ký được phép",
      allowed_algorithms_description: "Thuật toán bất đối xứng được chấp nhận để xác minh chữ ký JWT",
      allowed_algorithms_required: "Cần ít nhất một thuật toán.",
      select_algorithms: "Chọn thuật toán",
      jwks_cache_ttl_label: "TTL bộ nhớ đệm JWKS (giây)",
      jwks_cache_ttl_description:
        "Thời gian lưu trữ khóa JWKS của nhà cung cấp trong bộ nhớ đệm (tối thiểu 60 giây, mặc định 24 giờ)",
      jwks_cache_ttl_min: "TTL bộ nhớ đệm phải ít nhất 60 giây.",
      rate_limit_label: "Giới hạn tốc độ",
      rate_limit_placeholder: "120/minute",
      rate_limit_description:
        "Giới hạn yêu cầu dạng số lượng/khoảng thời gian (vd. 120/minute). Để trống để sử dụng giới hạn mặc định.",
      enable_provider: "Bật nhà cung cấp này",
      saving: "Đang lưu...",
      update: "Cập nhật",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Kết nối và đồng bộ tổ chức GitHub Enterprise của bạn với Plane.",
    app_form_title: "Cấu hình GitHub Enterprise",
    app_form_description: "Cấu hình GitHub Enterprise để kết nối với Plane.",
    app_id_title: "ID Ứng dụng",
    app_id_description: "ID ứng dụng bạn đã tạo trong tổ chức GitHub Enterprise của bạn.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID là bắt buộc",
    app_name_title: "Slug Ứng dụng",
    app_name_description: "Slug ứng dụng bạn đã tạo trong tổ chức GitHub Enterprise của bạn.",
    app_name_error: "Slug ứng dụng là bắt buộc",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "URL Cơ Bản",
    base_url_description: "URL cơ bản của tổ chức GitHub Enterprise của bạn.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "URL cơ bản là bắt buộc",
    invalid_base_url_error: "URL cơ bản không hợp lệ",
    client_id_title: "ID Khách Hàng",
    client_id_description: "ID khách hàng của ứng dụng bạn đã tạo trong tổ chức GitHub Enterprise của bạn.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID khách hàng là bắt buộc",
    client_secret_title: "Secret Khách Hàng",
    client_secret_description: "Secret khách hàng của ứng dụng bạn đã tạo trong tổ chức GitHub Enterprise của bạn.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Secret khách hàng là bắt buộc",
    webhook_secret_title: "Secret Webhook",
    webhook_secret_description: "Secret webhook của ứng dụng bạn đã tạo trong tổ chức GitHub Enterprise của bạn.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Secret webhook là bắt buộc",
    private_key_title: "Private Key (Base64 encoded)",
    private_key_description: "Private key của ứng dụng bạn đã tạo trong tổ chức GitHub Enterprise của bạn.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Private key là bắt buộc",
    connect_app: "Kết nối Ứng dụng",
  },
  file_upload: {
    upload_text: "Nhấp vào đây để tải lên tệp",
    drag_drop_text: "Kéo và thả",
    processing: "Đang xử lý",
    invalid: "Loại tệp không hợp lệ",
    missing_fields: "Thiếu trường",
    success: "{fileName} đã được tải lên!",
  },
  silo_errors: {
    invalid_query_params: "Tham số truy vấn được cung cấp không hợp lệ hoặc thiếu trường bắt buộc",
    invalid_installation_account: "Tài khoản cài đặt được cung cấp không hợp lệ",
    generic_error: "Đã xảy ra lỗi không mong muốn khi xử lý yêu cầu của bạn",
    connection_not_found: "Không thể tìm thấy kết nối được yêu cầu",
    multiple_connections_found: "Nhiều kết nối đã được tìm thấy khi chỉ mong đợi một kết nối",
    installation_not_found: "Không thể tìm thấy cài đặt được yêu cầu",
    user_not_found: "Không thể tìm thấy người dùng được yêu cầu",
    error_fetching_token: "Không thể lấy mã thông báo xác thực",
    invalid_app_credentials: "Các thông tin xác thực ứng dụng đã cung cấp không hợp lệ",
    invalid_app_installation_id: "Không thể cài đặt ứng dụng",
  },
  import_status: {
    queued: "Đang chờ",
    created: "Đã tạo",
    initiated: "Đã bắt đầu",
    pulling: "Đang kéo",
    timed_out: "Quá thời gian",
    pulled: "Đã kéo",
    transforming: "Đang chuyển đổi",
    transformed: "Đã chuyển đổi",
    pushing: "Đang đẩy",
    finished: "Hoàn thành",
    error: "Lỗi",
    cancelled: "Đã hủy",
  },
  jira_importer: {
    jira_importer_description: "Nhập dữ liệu Jira của bạn vào các dự án Plane.",
    personal_access_token: "Mã thông báo truy cập cá nhân",
    user_email: "Email người dùng",
    create_project_automatically: "Tạo dự án tự động",
    create_project_automatically_description: "Chúng tôi sẽ tạo một dự án mới cho bạn dựa trên chi tiết dự án Jira.",
    import_to_existing_project: "Nhập vào dự án hiện có",
    import_to_existing_project_description: "Chọn một dự án hiện có từ menu thả xuống bên dưới.",
    state_mapping_automatic_creation: "Tất cả các trạng thái Jira sẽ được tự động tạo trong Plane.",
    atlassian_security_settings: "Cài đặt bảo mật Atlassian",
    email_description: "Đây là email được liên kết với mã thông báo truy cập cá nhân của bạn",
    jira_domain: "Tên miền Jira",
    jira_domain_description: "Đây là tên miền của phiên bản Jira của bạn",
    steps: {
      title_configure_plane: "Cấu hình Plane",
      description_configure_plane:
        "Vui lòng tạo trước dự án trong Plane mà bạn dự định di chuyển dữ liệu Jira của mình. Sau khi dự án được tạo, hãy chọn nó tại đây.",
      title_configure_jira: "Cấu hình Jira",
      description_configure_jira: "Vui lòng chọn workspace Jira mà bạn muốn di chuyển dữ liệu từ đó.",
      title_import_users: "Nhập người dùng",
      description_import_users:
        "Vui lòng thêm người dùng bạn muốn di chuyển từ Jira sang Plane. Ngoài ra, bạn có thể bỏ qua bước này và thêm người dùng thủ công sau.",
      title_map_states: "Ánh xạ trạng thái",
      description_map_states:
        "Chúng tôi đã tự động khớp trạng thái Jira với trạng thái Plane theo khả năng tốt nhất của mình. Vui lòng ánh xạ bất kỳ trạng thái còn lại nào trước khi tiếp tục, bạn cũng có thể tạo trạng thái và ánh xạ chúng thủ công.",
      title_map_priorities: "Ánh xạ ưu tiên",
      description_map_priorities:
        "Chúng tôi đã tự động khớp các ưu tiên theo khả năng tốt nhất của mình. Vui lòng ánh xạ bất kỳ ưu tiên còn lại nào trước khi tiếp tục.",
      title_summary: "Tóm tắt",
      description_summary: "Đây là tóm tắt dữ liệu sẽ được di chuyển từ Jira sang Plane.",
      custom_jql_filter: "Bộ lọc JQL tùy chỉnh",
      jql_filter_description: "Sử dụng JQL để lọc các vấn đề cụ thể để nhập.",
      project_code: "DỰ ÁN",
      enter_filters_placeholder: "Nhập bộ lọc (ví dụ: status = 'In Progress')",
      validating_query: "Đang xác thực truy vấn...",
      validation_successful_work_items_selected: "Xác thực thành công, {count} Mục công việc đã chọn.",
      run_syntax_check: "Chạy kiểm tra cú pháp để xác minh truy vấn của bạn",
      refresh: "Làm mới",
      check_syntax: "Kiểm tra cú pháp",
      no_work_items_selected: "Không có mục công việc nào được chọn bởi truy vấn.",
      validation_error_default: "Có lỗi xảy ra khi xác thực truy vấn.",
    },
  },
  asana_importer: {
    asana_importer_description: "Nhập dữ liệu Asana của bạn vào các dự án Plane.",
    select_asana_priority_field: "Chọn trường ưu tiên Asana",
    steps: {
      title_configure_plane: "Cấu hình Plane",
      description_configure_plane:
        "Vui lòng tạo trước dự án trong Plane mà bạn dự định di chuyển dữ liệu Asana của mình. Sau khi dự án được tạo, hãy chọn nó tại đây.",
      title_configure_asana: "Cấu hình Asana",
      description_configure_asana: "Vui lòng chọn workspace và dự án Asana mà bạn muốn di chuyển dữ liệu từ đó.",
      title_map_states: "Ánh xạ trạng thái",
      description_map_states: "Vui lòng chọn trạng thái Asana mà bạn muốn ánh xạ đến trạng thái dự án Plane.",
      title_map_priorities: "Ánh xạ ưu tiên",
      description_map_priorities: "Vui lòng chọn ưu tiên Asana mà bạn muốn ánh xạ đến ưu tiên dự án Plane.",
      title_summary: "Tóm tắt",
      description_summary: "Đây là tóm tắt dữ liệu sẽ được di chuyển từ Asana sang Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Nhập dữ liệu Linear của bạn vào các dự án Plane.",
    steps: {
      title_configure_plane: "Cấu hình Plane",
      description_configure_plane:
        "Vui lòng tạo trước dự án trong Plane mà bạn dự định di chuyển dữ liệu Linear của mình. Sau khi dự án được tạo, hãy chọn nó tại đây.",
      title_configure_linear: "Cấu hình Linear",
      description_configure_linear: "Vui lòng chọn nhóm Linear mà bạn muốn di chuyển dữ liệu từ đó.",
      title_map_states: "Ánh xạ trạng thái",
      description_map_states:
        "Chúng tôi đã tự động khớp trạng thái Linear với trạng thái Plane theo khả năng tốt nhất của mình. Vui lòng ánh xạ bất kỳ trạng thái còn lại nào trước khi tiếp tục, bạn cũng có thể tạo trạng thái và ánh xạ chúng thủ công.",
      title_map_priorities: "Ánh xạ ưu tiên",
      description_map_priorities: "Vui lòng chọn ưu tiên Linear mà bạn muốn ánh xạ đến ưu tiên dự án Plane.",
      title_summary: "Tóm tắt",
      description_summary: "Đây là tóm tắt dữ liệu sẽ được di chuyển từ Linear sang Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Nhập dữ liệu Jira Server/Data Center của bạn vào các dự án Plane.",
    steps: {
      title_configure_plane: "Cấu hình Plane",
      description_configure_plane:
        "Vui lòng tạo trước dự án trong Plane mà bạn dự định di chuyển dữ liệu Jira của mình. Sau khi dự án được tạo, hãy chọn nó tại đây.",
      title_configure_jira: "Cấu hình Jira",
      description_configure_jira: "Vui lòng chọn workspace Jira mà bạn muốn di chuyển dữ liệu từ đó.",
      title_map_states: "Ánh xạ trạng thái",
      description_map_states: "Vui lòng chọn trạng thái Jira mà bạn muốn ánh xạ đến trạng thái dự án Plane.",
      title_map_priorities: "Ánh xạ ưu tiên",
      description_map_priorities: "Vui lòng chọn ưu tiên Jira mà bạn muốn ánh xạ đến ưu tiên dự án Plane.",
      title_summary: "Tóm tắt",
      description_summary: "Đây là tóm tắt dữ liệu sẽ được di chuyển từ Jira sang Plane.",
    },
    import_epics: {
      title: "Nhập Epic dưới dạng Công việc",
      description: "Khi bật tính năng này, các epic của bạn sẽ được nhập dưới dạng công việc với loại công việc epic.",
    },
  },
  notion_importer: {
    notion_importer_description: "Nhập dữ liệu Notion của bạn vào các dự án Plane.",
    steps: {
      title_upload_zip: "Tải lên ZIP xuất từ Notion",
      description_upload_zip: "Vui lòng tải lên tệp ZIP chứa dữ liệu Notion của bạn.",
    },
    upload: {
      drop_file_here: "Thả tệp zip Notion của bạn vào đây",
      upload_title: "Tải lên xuất dữ liệu Notion",
      upload_from_url: "Nhập từ URL",
      upload_from_url_description: "Dán URL công khai của bản xuất ZIP của bạn để tiếp tục.",
      drag_drop_description: "Kéo và thả tệp zip xuất Notion của bạn, hoặc nhấp để duyệt",
      file_type_restriction: "Chỉ hỗ trợ các tệp .zip được xuất từ Notion",
      select_file: "Chọn tệp",
      uploading: "Đang tải lên...",
      preparing_upload: "Đang chuẩn bị tải lên...",
      confirming_upload: "Đang xác nhận tải lên...",
      confirming: "Đang xác nhận...",
      upload_complete: "Tải lên hoàn tất",
      upload_failed: "Tải lên thất bại",
      start_import: "Bắt đầu nhập",
      retry_upload: "Thử lại tải lên",
      upload: "Tải lên",
      ready: "Sẵn sàng",
      error: "Lỗi",
      upload_complete_message: "Tải lên hoàn tất!",
      upload_complete_description: 'Nhấp "Bắt đầu nhập" để bắt đầu xử lý dữ liệu Notion của bạn.',
      upload_progress_message: "Vui lòng không đóng cửa sổ này.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Nhập dữ liệu Confluence của bạn vào wiki Plane.",
    steps: {
      title_upload_zip: "Tải lên ZIP xuất từ Confluence",
      description_upload_zip: "Vui lòng tải lên tệp ZIP chứa dữ liệu Confluence của bạn.",
    },
    upload: {
      drop_file_here: "Thả tệp zip Confluence của bạn vào đây",
      upload_title: "Tải lên xuất dữ liệu Confluence",
      upload_from_url: "Nhập từ URL",
      upload_from_url_description: "Dán URL công khai của bản xuất ZIP của bạn để tiếp tục.",
      drag_drop_description: "Kéo và thả tệp zip xuất Confluence của bạn, hoặc nhấp để duyệt",
      file_type_restriction: "Chỉ hỗ trợ các tệp .zip được xuất từ Confluence",
      select_file: "Chọn tệp",
      uploading: "Đang tải lên...",
      preparing_upload: "Đang chuẩn bị tải lên...",
      confirming_upload: "Đang xác nhận tải lên...",
      confirming: "Đang xác nhận...",
      upload_complete: "Tải lên hoàn tất",
      upload_failed: "Tải lên thất bại",
      start_import: "Bắt đầu nhập",
      retry_upload: "Thử lại tải lên",
      upload: "Tải lên",
      ready: "Sẵn sàng",
      error: "Lỗi",
      upload_complete_message: "Tải lên hoàn tất!",
      upload_complete_description: 'Nhấp "Bắt đầu nhập" để bắt đầu xử lý dữ liệu Confluence của bạn.',
      upload_progress_message: "Vui lòng không đóng cửa sổ này.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Nhập dữ liệu CSV của bạn vào các dự án Plane.",
    steps: {
      title_configure_plane: "Cấu hình Plane",
      description_configure_plane:
        "Vui lòng tạo trước dự án trong Plane mà bạn dự định di chuyển dữ liệu CSV của mình. Sau khi dự án được tạo, hãy chọn nó tại đây.",
      title_configure_csv: "Cấu hình CSV",
      description_configure_csv:
        "Vui lòng tải lên tệp CSV của bạn và cấu hình các trường được ánh xạ đến trường Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Nhập các mục công việc từ tệp CSV vào các dự án Plane.",
    steps: {
      title_select_project: "Chọn dự án",
      description_select_project: "Vui lòng chọn dự án Plane nơi bạn muốn nhập các mục công việc của mình.",
      title_upload_csv: "Tải lên CSV",
      description_upload_csv:
        "Tải lên tệp CSV chứa các mục công việc của bạn. Tệp phải bao gồm các cột cho tên, mô tả, ưu tiên, ngày tháng và nhóm trạng thái.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Nhập dữ liệu ClickUp của bạn vào các dự án Plane.",
    select_service_space: "Chọn {serviceName} Space",
    select_service_folder: "Chọn {serviceName} Folder",
    selected: "Đã chọn",
    users: "Người dùng",
    steps: {
      title_configure_plane: "Cấu hình Plane",
      description_configure_plane:
        "Vui lòng tạo trước dự án trong Plane mà bạn dự định di chuyển dữ liệu ClickUp của mình. Sau khi dự án được tạo, hãy chọn nó tại đây.",
      title_configure_clickup: "Cấu hình ClickUp",
      description_configure_clickup:
        "Vui lòng chọn nhóm ClickUp, không gian và thư mục từ đó bạn muốn di chuyển dữ liệu của mình.",
      title_map_states: "Ánh xạ trạng thái",
      description_map_states:
        "Chúng tôi đã tự động khớp trạng thái ClickUp với trạng thái Plane theo khả năng tốt nhất của mình. Vui lòng ánh xạ bất kỳ trạng thái còn lại nào trước khi tiếp tục, bạn cũng có thể tạo trạng thái và ánh xạ chúng thủ công.",
      title_map_priorities: "Ánh xạ ưu tiên",
      description_map_priorities: "Vui lòng chọn ưu tiên ClickUp mà bạn muốn ánh xạ đến ưu tiên dự án Plane.",
      title_summary: "Tóm tắt",
      description_summary: "Đây là tóm tắt dữ liệu sẽ được di chuyển từ ClickUp sang Plane.",
      pull_additional_data_title: "Nhập bình luận và đính kèm",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Cột",
          long_label: "Biểu đồ cột",
          chart_models: {
            basic: "Cơ bản",
            stacked: "Xếp chồng",
            grouped: "Nhóm",
          },
          orientation: {
            label: "Hướng",
            horizontal: "Ngang",
            vertical: "Dọc",
            placeholder: "Thêm hướng",
          },
          bar_color: "Màu cột",
        },
        line_chart: {
          short_label: "Đường",
          long_label: "Biểu đồ đường",
          chart_models: {
            basic: "Cơ bản",
            multi_line: "Đa đường",
          },
          line_color: "Màu đường",
          line_type: {
            label: "Kiểu đường",
            solid: "Liền",
            dashed: "Đứt khúc",
            placeholder: "Thêm kiểu đường",
          },
        },
        area_chart: {
          short_label: "Vùng",
          long_label: "Biểu đồ vùng",
          chart_models: {
            basic: "Cơ bản",
            stacked: "Xếp chồng",
            comparison: "So sánh",
          },
          fill_color: "Màu tô",
        },
        donut_chart: {
          short_label: "Bánh rỗng",
          long_label: "Biểu đồ bánh rỗng",
          chart_models: {
            basic: "Cơ bản",
            progress: "Tiến độ",
          },
          center_value: "Giá trị trung tâm",
          completed_color: "Màu hoàn thành",
        },
        pie_chart: {
          short_label: "Bánh tròn",
          long_label: "Biểu đồ bánh tròn",
          chart_models: {
            basic: "Cơ bản",
          },
          group: {
            label: "Phần được nhóm",
            group_thin_pieces: "Nhóm phần mỏng",
            minimum_threshold: {
              label: "Ngưỡng tối thiểu",
              placeholder: "Thêm ngưỡng",
            },
            name_group: {
              label: "Tên nhóm",
              placeholder: '"Ít hơn 5%"',
            },
          },
          show_values: "Hiển thị giá trị",
          value_type: {
            percentage: "Phần trăm",
            count: "Số lượng",
          },
        },
        text: {
          short_label: "Văn bản",
          long_label: "Văn bản",
          alignment: {
            label: "Căn chỉnh văn bản",
            left: "Trái",
            center: "Giữa",
            right: "Phải",
            placeholder: "Thêm căn chỉnh văn bản",
          },
          text_color: "Màu văn bản",
        },
        table_chart: {
          short_label: "Bảng",
          long_label: "Biểu đồ bảng",
          chart_models: {
            basic: {
              short_label: "Cơ bản",
              long_label: "Bảng",
            },
          },
          columns: "Cột",
          rows: "Hàng",
          rows_placeholder: "Thêm hàng",
          configure_rows_hint: "Chọn một thuộc tính cho hàng để xem bảng này.",
        },
      },
      color_palettes: {
        modern: "Hiện đại",
        horizon: "Chân trời",
        earthen: "Đất",
      },
      common: {
        add_widget: "Thêm widget",
        widget_title: {
          label: "Đặt tên widget này",
          placeholder: 'vd., "Việc cần làm hôm qua", "Tất cả hoàn thành"',
        },
        chart_type: "Loại biểu đồ",
        visualization_type: {
          label: "Kiểu trực quan hóa",
          placeholder: "Thêm kiểu trực quan hóa",
        },
        date_group: {
          label: "Nhóm ngày",
          placeholder: "Thêm nhóm ngày",
        },
        grouping: "Phân nhóm",
        group_by: "Nhóm theo",
        stacking: "Xếp chồng",
        stack_by: "Xếp chồng theo",
        daily: "Hàng ngày",
        weekly: "Hàng tuần",
        monthly: "Hàng tháng",
        yearly: "Hàng năm",
        work_item_count: "Số lượng mục công việc",
        estimate_point: "Điểm ước tính",
        pending_work_item: "Mục công việc đang chờ",
        completed_work_item: "Mục công việc đã hoàn thành",
        in_progress_work_item: "Mục công việc đang thực hiện",
        blocked_work_item: "Mục công việc bị chặn",
        work_item_due_this_week: "Mục công việc đến hạn tuần này",
        work_item_due_today: "Mục công việc đến hạn hôm nay",
        color_scheme: {
          label: "Bảng màu",
          placeholder: "Thêm bảng màu",
        },
        smoothing: "Làm mịn",
        markers: "Điểm đánh dấu",
        legends: "Chú thích",
        tooltips: "Chú giải",
        opacity: {
          label: "Độ trong suốt",
          placeholder: "Thêm độ trong suốt",
        },
        border: "Viền",
        widget_configuration: "Cấu hình widget",
        configure_widget: "Cấu hình widget",
        guides: "Hướng dẫn",
        style: "Kiểu",
        area_appearance: "Giao diện vùng",
        comparison_line_appearance: "Giao diện đường so sánh",
        add_property: "Thêm thuộc tính",
        add_metric: "Thêm chỉ số",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
          stacked: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
            group_by: "Xếp chồng theo đang thiếu giá trị.",
          },
          grouped: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
            group_by: "Nhóm theo đang thiếu giá trị.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
          multi_line: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
            group_by: "Nhóm theo đang thiếu giá trị.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
          stacked: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
            group_by: "Xếp chồng theo đang thiếu giá trị.",
          },
          comparison: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
          progress: {
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Trục x đang thiếu giá trị.",
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Chỉ số đang thiếu giá trị.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Cột đang thiếu giá trị.",
            group_by: "Hàng đang thiếu giá trị.",
          },
        },
        ask_admin: "Yêu cầu quản trị viên của bạn cấu hình widget này.",
      },
    },
    create_modal: {
      heading: {
        create: "Tạo dashboard mới",
        update: "Cập nhật dashboard",
      },
      title: {
        label: "Đặt tên dashboard của bạn.",
        placeholder: '"Năng lực giữa các dự án", "Khối lượng công việc theo nhóm", "Trạng thái trên tất cả các dự án"',
        required_error: "Yêu cầu tiêu đề",
      },
      project: {
        label: "Chọn dự án",
        placeholder: "Dữ liệu từ các dự án này sẽ cung cấp cho dashboard này.",
        required_error: "Yêu cầu dự án",
      },
      filters_label: "Thiết lập bộ lọc cho các nguồn dữ liệu ở trên",
      create_dashboard: "Tạo dashboard",
      update_dashboard: "Cập nhật dashboard",
    },
    delete_modal: {
      heading: "Xóa dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Trình bày tiến độ của bạn trong các dashboard theo yêu cầu, vĩnh viễn.",
        description:
          "Xây dựng bất kỳ dashboard nào bạn cần và tùy chỉnh cách dữ liệu của bạn hiển thị để có bản trình bày hoàn hảo về tiến độ của bạn.",
        coming_soon_to_mobile: "Sắp có trên ứng dụng di động",
        card_1: {
          title: "Cho tất cả dự án của bạn",
          description:
            "Có cái nhìn tổng quan về workspace của bạn với tất cả các dự án hoặc chia dữ liệu công việc của bạn để có cái nhìn hoàn hảo về tiến độ của bạn.",
        },
        card_2: {
          title: "Cho bất kỳ dữ liệu nào trong Plane",
          description:
            "Vượt xa Analytics có sẵn và biểu đồ Chu kỳ đã làm sẵn để xem các nhóm, sáng kiến hoặc bất cứ thứ gì khác như bạn chưa từng thấy trước đây.",
        },
        card_3: {
          title: "Cho tất cả nhu cầu trực quan hóa dữ liệu của bạn",
          description:
            "Chọn từ nhiều biểu đồ có thể tùy chỉnh với các điều khiển chi tiết để xem và hiển thị dữ liệu công việc của bạn chính xác như cách bạn muốn.",
        },
        card_4: {
          title: "Theo yêu cầu và vĩnh viễn",
          description:
            "Xây dựng một lần, giữ mãi mãi với tự động làm mới dữ liệu của bạn, cờ theo ngữ cảnh cho thay đổi phạm vi, và permalinks có thể chia sẻ.",
        },
        card_5: {
          title: "Xuất và lịch trình liên lạc",
          description:
            "Cho những lúc liên kết không hoạt động, lấy dashboard của bạn ra dưới dạng PDF một lần hoặc lên lịch để tự động gửi cho các bên liên quan.",
        },
        card_6: {
          title: "Tự động bố trí cho tất cả thiết bị",
          description:
            "Điều chỉnh kích thước widget của bạn cho bố cục bạn muốn và xem nó giống hệt nhau trên di động, máy tính bảng và các trình duyệt khác.",
        },
      },
      dashboards_list: {
        title:
          "Trực quan hóa dữ liệu trong widget, xây dựng dashboard của bạn với widget, và xem mới nhất theo yêu cầu.",
        description:
          "Xây dựng dashboard của bạn với Widget tùy chỉnh hiển thị dữ liệu của bạn trong phạm vi bạn chỉ định. Nhận dashboard cho tất cả công việc của bạn trên các dự án và nhóm và chia sẻ permalinks với các bên liên quan để theo dõi theo yêu cầu.",
      },
      dashboards_search: {
        title: "Điều đó không khớp với tên dashboard.",
        description: "Đảm bảo truy vấn của bạn là đúng hoặc thử một truy vấn khác.",
      },
      widgets_list: {
        title: "Trực quan hóa dữ liệu của bạn theo cách bạn muốn.",
        description: `Sử dụng đường, cột, bánh tròn và các định dạng khác để xem dữ liệu của bạn
theo cách bạn muốn từ các nguồn bạn chỉ định.`,
      },
      widget_data: {
        title: "Không có gì để xem ở đây",
        description: "Làm mới hoặc thêm dữ liệu để xem nó ở đây.",
      },
    },
    common: {
      editing: "Đang chỉnh sửa",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Cho phép mục công việc mới",
      work_item_creation_disable_tooltip: "Tạo mục công việc bị vô hiệu hóa cho trạng thái này",
      default_state:
        "Trạng thái mặc định cho phép tất cả thành viên tạo mục công việc mới. Điều này không thể thay đổi",
      state_change_count:
        "{count, plural, one {1 thay đổi trạng thái được cho phép} other {{count} thay đổi trạng thái được cho phép}}",
      movers_count: "{count, plural, one {1 người xem xét được liệt kê} other {{count} người xem xét được liệt kê}}",
      state_changes: {
        label: {
          default: "Thêm thay đổi trạng thái được cho phép",
          loading: "Đang thêm thay đổi trạng thái được cho phép",
        },
        move_to: "Thay đổi trạng thái thành",
        movers: {
          label: "Khi được xem xét bởi",
          tooltip:
            "Người xem xét là những người được phép di chuyển mục công việc từ một trạng thái sang trạng thái khác.",
          add: "Thêm người xem xét",
        },
      },
    },
    workflow_disabled: {
      title: "Bạn không thể di chuyển mục công việc này đến đây.",
    },
    workflow_enabled: {
      label: "Thay đổi trạng thái",
    },
    workflow_tree: {
      label: "Đối với mục công việc trong",
      state_change_label: "có thể di chuyển nó đến",
    },
    empty_state: {
      upgrade: {
        title: "Kiểm soát sự hỗn loạn của thay đổi và xem xét với Quy trình làm việc.",
        description:
          "Đặt quy tắc cho nơi công việc của bạn di chuyển, bởi ai và khi nào với Quy trình làm việc trong Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Xem lịch sử thay đổi",
      reset_workflow: "Đặt lại quy trình làm việc",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Bạn có chắc muốn đặt lại quy trình làm việc này không?",
        description:
          "Nếu bạn đặt lại quy trình làm việc này, tất cả các quy tắc thay đổi trạng thái của bạn sẽ bị xóa và bạn sẽ phải tạo lại chúng để chạy chúng trong dự án này.",
      },
      delete_state_change: {
        title: "Bạn có chắc muốn xóa quy tắc thay đổi trạng thái này không?",
        description:
          "Sau khi xóa, bạn không thể hoàn tác thay đổi này và bạn sẽ phải đặt lại quy tắc nếu bạn muốn nó chạy cho dự án này.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} quy trình làm việc",
        success: {
          title: "Thành công",
          message: "Quy trình làm việc {action} thành công",
        },
        error: {
          title: "Lỗi",
          message: "Quy trình làm việc không thể {action}. Vui lòng thử lại.",
        },
      },
      reset: {
        success: {
          title: "Thành công",
          message: "Quy trình làm việc đặt lại thành công",
        },
        error: {
          title: "Lỗi đặt lại quy trình làm việc",
          message: "Quy trình làm việc không thể đặt lại. Vui lòng thử lại.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Lỗi thêm quy tắc thay đổi trạng thái",
          message: "Quy tắc thay đổi trạng thái không thể thêm. Vui lòng thử lại.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Lỗi sửa đổi quy tắc thay đổi trạng thái",
          message: "Quy tắc thay đổi trạng thái không thể sửa đổi. Vui lòng thử lại.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Lỗi xóa quy tắc thay đổi trạng thái",
          message: "Quy tắc thay đổi trạng thái không thể xóa. Vui lòng thử lại.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Lỗi sửa đổi người xem xét quy tắc thay đổi trạng thái",
          message: "Người xem xét quy tắc thay đổi trạng thái không thể sửa đổi. Vui lòng thử lại.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Khách hàng} other {Khách hàng}}",
    upgrade: {
      title: "Ưu tiên và quản lý công việc với Khách hàng.",
      description: "Ánh xạ công việc của bạn với khách hàng và ưu tiên theo thuộc tính khách hàng.",
    },
    properties: {
      default: {
        title: "Thuộc tính mặc định",
        customer_name: {
          name: "Tên khách hàng",
          placeholder: "Đây có thể là tên của người hoặc doanh nghiệp",
          validation: {
            required: "Tên khách hàng là bắt buộc.",
            max_length: "Tên khách hàng không thể nhiều hơn 255 ký tự.",
          },
        },
        description: {
          name: "Mô tả",
          validation: {},
        },
        email: {
          name: "Email",
          placeholder: "Nhập email",
          validation: {
            required: "Email là bắt buộc.",
            pattern: "Địa chỉ email không hợp lệ.",
          },
        },
        website_url: {
          name: "Website",
          placeholder: "Bất kỳ URL nào với https:// sẽ hoạt động.",
          placeholder_short: "Thêm website",
          validation: {
            pattern: "URL website không hợp lệ",
          },
        },
        employees: {
          name: "Nhân viên",
          placeholder: "Số lượng nhân viên nếu khách hàng của bạn là doanh nghiệp.",
          validation: {
            min_length: "Số nhân viên không thể ít hơn 0.",
          },
        },
        size: {
          name: "Quy mô",
          placeholder: "Thêm quy mô công ty",
          validation: {
            min_length: "Quy mô không hợp lệ",
          },
        },
        domain: {
          name: "Ngành",
          placeholder: "Bán lẻ, Thương mại điện tử, Fintech, Ngân hàng",
          placeholder_short: "Thêm ngành",
          validation: {},
        },
        stage: {
          name: "Giai đoạn",
          placeholder: "Chọn giai đoạn",
          validation: {},
        },
        contract_status: {
          name: "Trạng thái hợp đồng",
          placeholder: "Chọn trạng thái hợp đồng",
          validation: {},
        },
        revenue: {
          name: "Doanh thu",
          placeholder: "Đây là doanh thu khách hàng của bạn tạo ra hàng năm.",
          validation: {
            min_length: "Doanh thu không thể ít hơn 0.",
          },
        },
      },
      custom: {
        title: "Thuộc tính tùy chỉnh",
        info: "Thêm thuộc tính độc đáo của khách hàng vào Plane để bạn có thể quản lý mục công việc hoặc hồ sơ khách hàng tốt hơn.",
      },
      empty_state: {
        title: "Bạn chưa có thuộc tính tùy chỉnh nào.",
        description:
          "Thuộc tính tùy chỉnh mà bạn muốn thấy trong mục công việc, ở nơi khác trong Plane, hoặc bên ngoài Plane trong CRM hoặc công cụ khác, sẽ xuất hiện ở đây khi bạn thêm chúng.",
      },
      add: {
        primary_button: "Thêm thuộc tính mới",
      },
    },
    stage: {
      lead: "Tiềm năng",
      sales_qualified_lead: "Tiềm năng đủ điều kiện bán hàng",
      contract_negotiation: "Đàm phán hợp đồng",
      closed_won: "Đã đóng thành công",
      closed_lost: "Đã đóng thất bại",
    },
    contract_status: {
      active: "Đang hoạt động",
      pre_contract: "Tiền hợp đồng",
      signed: "Đã ký",
      inactive: "Không hoạt động",
    },
    empty_state: {
      detail: {
        title: "Chúng tôi không thể tìm thấy hồ sơ khách hàng đó.",
        description: "Liên kết đến hồ sơ này có thể sai hoặc hồ sơ này có thể đã bị xóa.",
        primary_button: "Đi đến khách hàng",
        secondary_button: "Thêm khách hàng",
      },
      search: {
        title: "Có vẻ như bạn không có hồ sơ khách hàng phù hợp với thuật ngữ đó.",
        description:
          "Thử với thuật ngữ tìm kiếm khác hoặc liên hệ với chúng tôi nếu bạn chắc chắn nên thấy kết quả cho thuật ngữ đó.",
      },
      list: {
        title:
          "Quản lý khối lượng, nhịp độ và luồng công việc của bạn theo những gì quan trọng đối với khách hàng của bạn.",
        description:
          "Với Khách hàng, một tính năng chỉ có trong Plane, bây giờ bạn có thể tạo khách hàng mới từ đầu và kết nối họ với công việc của bạn. Sắp tới, bạn sẽ đưa họ từ các công cụ khác cùng với các thuộc tính tùy chỉnh quan trọng đối với bạn.",
        primary_button: "Thêm khách hàng đầu tiên của bạn",
      },
    },
    settings: {
      unauthorized: "Bạn không được phép truy cập trang này.",
      description: "Theo dõi và quản lý mối quan hệ khách hàng trong quy trình làm việc của bạn.",
      enable: "Kích hoạt Khách hàng",
      toasts: {
        enable: {
          loading: "Đang kích hoạt tính năng khách hàng...",
          success: {
            title: "Bạn đã bật Khách hàng cho workspace này.",
            message: "Bạn không thể tắt nó lại.",
          },
          error: {
            title: "Chúng tôi không thể bật Khách hàng lúc này.",
            message: "Thử lại hoặc quay lại màn hình này sau. Nếu vẫn không hoạt động.",
            action: "Nói chuyện với hỗ trợ",
          },
        },
        disable: {
          loading: "Đang vô hiệu hóa tính năng khách hàng...",
          success: {
            title: "Đã vô hiệu hóa Khách hàng",
            message: "Tính năng Khách hàng đã vô hiệu hóa thành công!",
          },
          error: {
            title: "Lỗi",
            message: "Không thể vô hiệu hóa tính năng khách hàng!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Chúng tôi không thể lấy danh sách khách hàng của bạn.",
          message: "Thử lại hoặc làm mới trang này.",
        },
      },
      copy_link: {
        title: "Bạn đã sao chép liên kết trực tiếp đến khách hàng này.",
        message: "Dán vào bất kỳ đâu và nó sẽ dẫn trở lại đây.",
      },
      create: {
        success: {
          title: "{customer_name} hiện đã có sẵn",
          message: "Bạn có thể tham khảo khách hàng này trong mục công việc và theo dõi yêu cầu từ họ.",
          actions: {
            view: "Xem",
            copy_link: "Sao chép liên kết",
            copied: "Đã sao chép!",
          },
        },
        error: {
          title: "Chúng tôi không thể tạo hồ sơ lúc này.",
          message: "Thử lưu lại hoặc sao chép văn bản chưa lưu của bạn vào một mục mới, tốt nhất là trong tab khác.",
        },
      },
      update: {
        success: {
          title: "Thành công!",
          message: "Đã cập nhật khách hàng thành công!",
        },
        error: {
          title: "Lỗi!",
          message: "Không thể cập nhật khách hàng. Thử lại!",
        },
      },
      logo: {
        error: {
          title: "Chúng tôi không thể tải lên logo của khách hàng.",
          message: "Thử lưu logo lại hoặc bắt đầu từ đầu.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Bạn đã xóa một mục công việc khỏi hồ sơ của khách hàng này.",
            message: "Chúng tôi cũng đã tự động xóa khách hàng này khỏi mục công việc.",
          },
          error: {
            title: "Chúng tôi không thể xóa mục công việc đó khỏi hồ sơ của khách hàng này lúc này.",
            message: "Chúng tôi cũng đã tự động xóa khách hàng này khỏi mục công việc.",
          },
        },
        add: {
          error: {
            title: "Chúng tôi không thể thêm mục công việc đó vào hồ sơ của khách hàng này lúc này.",
            message:
              "Thử thêm mục công việc đó lại hoặc quay lại sau. Nếu vẫn không hoạt động, hãy liên hệ với chúng tôi.",
          },
          success: {
            title: "Bạn đã thêm một mục công việc vào hồ sơ của khách hàng này.",
            message: "Chúng tôi cũng đã tự động thêm khách hàng này vào mục công việc.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Chỉnh sửa",
      copy_link: "Sao chép liên kết đến khách hàng",
      delete: "Xóa",
    },
    create: {
      label: "Tạo hồ sơ khách hàng",
      loading: "Đang tạo",
      cancel: "Hủy",
    },
    update: {
      label: "Cập nhật khách hàng",
      loading: "Đang cập nhật",
    },
    delete: {
      title: "Bạn có chắc chắn muốn xóa hồ sơ khách hàng {customer_name}?",
      description: "Tất cả dữ liệu liên quan đến hồ sơ này sẽ bị xóa vĩnh viễn. Bạn không thể khôi phục hồ sơ này sau.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Chưa có yêu cầu nào để hiển thị.",
          description: "Tạo yêu cầu từ khách hàng của bạn để bạn có thể liên kết chúng với mục công việc.",
          button: "Thêm yêu cầu mới",
        },
        search: {
          title: "Có vẻ như bạn không có yêu cầu phù hợp với thuật ngữ đó.",
          description:
            "Thử với thuật ngữ tìm kiếm khác hoặc liên hệ với chúng tôi nếu bạn chắc chắn nên thấy kết quả cho thuật ngữ đó.",
        },
      },
      label: "{count, plural, one {Yêu cầu} other {Yêu cầu}}",
      add: "Thêm yêu cầu",
      create: "Tạo yêu cầu",
      update: "Cập nhật yêu cầu",
      form: {
        name: {
          placeholder: "Đặt tên cho yêu cầu này",
          validation: {
            required: "Tên là bắt buộc.",
            max_length: "Tên yêu cầu không nên vượt quá 255 ký tự.",
          },
        },
        description: {
          placeholder: "Mô tả bản chất của yêu cầu hoặc dán bình luận của khách hàng này từ công cụ khác.",
        },
        source: {
          add: "Thêm nguồn",
          update: "Cập nhật nguồn",
          url: {
            label: "URL",
            required: "URL là bắt buộc",
            invalid: "URL website không hợp lệ",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Đã sao chép liên kết",
          message: "Liên kết yêu cầu khách hàng đã được sao chép vào clipboard.",
        },
        attachment: {
          upload: {
            loading: "Đang tải lên tệp đính kèm...",
            success: {
              title: "Đã tải lên tệp đính kèm",
              message: "Tệp đính kèm đã được tải lên thành công.",
            },
            error: {
              title: "Tệp đính kèm không được tải lên",
              message: "Không thể tải lên tệp đính kèm.",
            },
          },
          size: {
            error: {
              title: "Lỗi!",
              message: "Chỉ có thể tải lên một tệp mỗi lần.",
            },
          },
          length: {
            message: "Tệp phải có kích thước {size}MB hoặc nhỏ hơn",
          },
          remove: {
            success: {
              title: "Đã xóa tệp đính kèm",
              message: "Tệp đính kèm đã được xóa thành công",
            },
            error: {
              title: "Tệp đính kèm không được xóa",
              message: "Không thể xóa tệp đính kèm",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Thành công!",
              message: "Đã cập nhật nguồn thành công!",
            },
            error: {
              title: "Lỗi!",
              message: "Không thể cập nhật nguồn.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Lỗi!",
              message: "Không thể thêm mục công việc vào yêu cầu. Thử lại.",
            },
            success: {
              title: "Thành công!",
              message: "Đã thêm mục công việc vào yêu cầu.",
            },
          },
        },
        update: {
          success: {
            message: "Đã cập nhật yêu cầu thành công!",
            title: "Thành công!",
          },
          error: {
            title: "Lỗi!",
            message: "Không thể cập nhật yêu cầu. Thử lại!",
          },
        },
        create: {
          success: {
            message: "Đã tạo yêu cầu thành công!",
            title: "Thành công!",
          },
          error: {
            title: "Lỗi!",
            message: "Không thể tạo yêu cầu. Thử lại!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Mục công việc đã liên kết",
      link: "Liên kết mục công việc",
      empty_state: {
        list: {
          title: "Có vẻ như bạn chưa liên kết mục công việc nào với khách hàng này.",
          description:
            "Liên kết mục công việc hiện có từ bất kỳ dự án nào ở đây để bạn có thể theo dõi chúng theo khách hàng này.",
          button: "Liên kết mục công việc",
        },
      },
      action: {
        remove_epic: "Xóa epic",
        remove: "Xóa mục công việc",
      },
    },
    sidebar: {
      properties: "Thuộc tính",
    },
  },
  templates: {
    settings: {
      title: "Mẫu",
      description:
        "Lưu 80% thời gian đã tiêu tốn trong việc tạo dự án, mục công việc và trang khi bạn sử dụng các mẫu.",
      options: {
        project: {
          label: "Mẫu dự án",
        },
        work_item: {
          label: "Mẫu mục công việc",
        },
        page: {
          label: "Mẫu trang",
        },
      },
      create_template: {
        label: "Tạo mẫu",
        no_permission: {
          project: "Liên hệ quản trị dự án của bạn để tạo mẫu",
          workspace: "Liên hệ quản trị workspace của bạn để tạo mẫu",
        },
      },
      use_template: {
        button: {
          default: "Sử dụng mẫu",
          loading: "Đang áp dụng",
        },
      },
      template_source: {
        workspace: {
          info: "Được thừa kế từ workspace",
        },
        project: {
          info: "Được thừa kế từ dự án",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Đặt tên cho mẫu dự án của bạn.",
              validation: {
                required: "Tên mẫu là bắt buộc",
                maxLength: "Tên mẫu không nên vượt quá 255 ký tự",
              },
            },
            description: {
              placeholder: "Mô tả khi và cách sử dụng mẫu này.",
            },
          },
          name: {
            placeholder: "Đặt tên cho dự án của bạn.",
            validation: {
              required: "Tên dự án là bắt buộc",
              maxLength: "Tên dự án không nên vượt quá 255 ký tự",
            },
          },
          description: {
            placeholder: "Mô tả mục tiêu và mục tiêu của dự án này.",
          },
          button: {
            create: "Tạo mẫu dự án",
            update: "Cập nhật mẫu dự án",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Đặt tên cho mẫu mục công việc của bạn.",
              validation: {
                required: "Tên mẫu là bắt buộc",
                maxLength: "Tên mẫu không nên vượt quá 255 ký tự",
              },
            },
            description: {
              placeholder: "Mô tả khi và cách sử dụng mẫu này.",
            },
          },
          name: {
            placeholder: "Đặt tên cho mục công việc của bạn.",
            validation: {
              required: "Tên mục công việc là bắt buộc",
              maxLength: "Tên mục công việc không nên vượt quá 255 ký tự",
            },
          },
          description: {
            placeholder: "Mô tả mục công việc này để rõ ràng những gì bạn sẽ hoàn thành khi hoàn tất điều này.",
          },
          button: {
            create: "Tạo mẫu mục công việc",
            update: "Cập nhật mẫu mục công việc",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Đặt tên cho mẫu trang của bạn.",
              validation: {
                required: "Tên mẫu là bắt buộc",
                maxLength: "Tên mẫu không nên vượt quá 255 ký tự",
              },
            },
            description: {
              placeholder: "Mô tả khi và cách sử dụng mẫu này.",
            },
          },
          name: {
            placeholder: "Trang không có tên",
            validation: {
              maxLength: "Tên trang không nên vượt quá 255 ký tự",
            },
          },
          button: {
            create: "Tạo mẫu trang",
            update: "Cập nhật mẫu trang",
          },
        },
        publish: {
          action: "{isPublished, select, true {Cài đặt xuất bản} other {Xuất bản lên Marketplace}}",
          unpublish_action: "Gỡ khỏi Marketplace",
          title: "Làm cho mẫu của bạn dễ khám phá và nhận biết.",
          name: {
            label: "Tên mẫu",
            placeholder: "Đặt tên cho mẫu của bạn",
            validation: {
              required: "Tên mẫu là bắt buộc",
              maxLength: "Tên mẫu không nên vượt quá 255 ký tự",
            },
          },
          short_description: {
            label: "Mô tả ngắn",
            placeholder: "Mẫu này rất phù hợp cho các Quản lý Dự án đang quản lý nhiều dự án cùng lúc.",
            validation: {
              required: "Mô tả ngắn là bắt buộc",
            },
          },
          description: {
            label: "Mô tả",
            placeholder: `Nâng cao năng suất và tối ưu hóa giao tiếp với tính năng Chuyển đổi Giọng nói thành Văn bản.
• Chuyển đổi thời gian thực: Chuyển đổi lời nói thành văn bản chính xác ngay lập tức.
• Tạo nhiệm vụ và bình luận: Thêm nhiệm vụ, mô tả và bình luận thông qua lệnh thoại.`,
            validation: {
              required: "Mô tả là bắt buộc",
            },
          },
          category: {
            label: "Danh mục",
            placeholder: "Chọn nơi bạn nghĩ phù hợp nhất. Bạn có thể chọn nhiều hơn một.",
            validation: {
              required: "Cần ít nhất một danh mục",
            },
          },
          keywords: {
            label: "Từ khóa",
            placeholder: "Sử dụng các thuật ngữ mà bạn nghĩ người dùng sẽ tìm kiếm khi tìm mẫu này.",
            helperText:
              "Nhập các từ khóa được phân tách bằng dấu phẩy, có khả năng giúp người dùng tìm kiếm từ khóa này.",
            validation: {
              required: "Cần ít nhất một từ khóa",
            },
          },
          company_name: {
            label: "Tên công ty",
            placeholder: "Plane",
            validation: {
              required: "Tên công ty là bắt buộc",
              maxLength: "Tên công ty không nên vượt quá 255 ký tự",
            },
          },
          contact_email: {
            label: "Email hỗ trợ",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Địa chỉ email không hợp lệ",
              required: "Email hỗ trợ là bắt buộc",
              maxLength: "Email hỗ trợ không nên vượt quá 255 ký tự",
            },
          },
          privacy_policy_url: {
            label: "Liên kết đến chính sách bảo mật của bạn",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "URL không hợp lệ",
              maxLength: "URL không nên vượt quá 800 ký tự",
            },
          },
          terms_of_service_url: {
            label: "Liên kết đến điều khoản sử dụng của bạn",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "URL không hợp lệ",
              maxLength: "URL không nên vượt quá 800 ký tự",
            },
          },
          cover_image: {
            label: "Thêm ảnh bìa sẽ được hiển thị trong marketplace",
            upload_title: "Tải lên ảnh bìa",
            upload_placeholder: "Nhấp để tải lên hoặc kéo và thả để tải lên ảnh bìa",
            drop_here: "Thả vào đây",
            click_to_upload: "Nhấp để tải lên",
            invalid_file_or_exceeds_size_limit: "Tệp không hợp lệ hoặc vượt quá giới hạn kích thước. Vui lòng thử lại.",
            upload_and_save: "Tải lên và lưu",
            uploading: "Đang tải lên",
            remove: "Xóa",
            removing: "Đang xóa",
            validation: {
              required: "Ảnh bìa là bắt buộc",
            },
          },
          attach_screenshots: {
            label: "Bao gồm tài liệu và hình ảnh mà bạn nghĩ sẽ giúp người xem hiểu rõ hơn về mẫu này.",
            validation: {
              required: "Cần ít nhất một ảnh chụp màn hình",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Mẫu",
        description:
          "Với mẫu dự án, mẫu mục công việc và mẫu trang trong Plane, bạn không phải tạo dự án từ đầu hoặc thiết lập thuộc tính mục công việc theo cách thủ công.",
        sub_description: "Nhận lại 80% thời gian quản lý của bạn khi bạn sử dụng Mẫu.",
      },
      no_templates: {
        button: "Tạo mẫu của bạn",
      },
      no_labels: {
        description: "Chưa có nhãn nào. Tạo nhãn để giúp tổ chức và lọc mục công việc trong dự án của bạn.",
      },
      no_work_items: {
        description: "Chưa có mục công việc nào. Thêm một để cấu trúc công việc của bạn tốt hơn.",
      },
      no_sub_work_items: {
        description: "Chưa có mục công việc con. Thêm một để cấu trúc công việc của bạn tốt hơn.",
      },
      page: {
        no_templates: {
          title: "Không có mẫu nào mà bạn có quyền truy cập.",
          description: "Vui lòng tạo một mẫu",
        },
        no_results: {
          title: "Điều đó không khớp với mẫu nào.",
          description: "Thử tìm kiếm bằng các thuật ngữ khác.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Mẫu đã được tạo",
          message: "{templateName}, mẫu {templateType}, hiện có sẵn cho workspace của bạn.",
        },
        error: {
          title: "Chúng tôi không thể tạo mẫu đó lần này.",
          message: "Thử lưu lại chi tiết của bạn hoặc sao chép chúng sang mẫu mới, nhất quán trong một tab khác.",
        },
      },
      update: {
        success: {
          title: "Mẫu đã được thay đổi",
          message: "{templateName}, mẫu {templateType}, đã được thay đổi.",
        },
        error: {
          title: "Chúng tôi không thể lưu thay đổi cho mẫu này.",
          message: "Thử lưu lại chi tiết của bạn hoặc quay lại mẫu này sau. Nếu vẫn còn vấn đề, liên hệ với chúng tôi.",
        },
      },
      delete: {
        success: {
          title: "Mẫu đã được xóa",
          message: "{templateName}, mẫu {templateType}, đã được xóa khỏi workspace của bạn.",
        },
        error: {
          title: "Chúng tôi không thể xóa mẫu đó lần này.",
          message: "Thử xóa nó lại hoặc quay lại nó sau. Nếu vẫn còn vấn đề, liên hệ với chúng tôi.",
        },
      },
      unpublish: {
        success: {
          title: "Mẫu đã được gỡ xuất bản",
          message: "{templateName}, mẫu {templateType}, đã được gỡ xuất bản.",
        },
        error: {
          title: "Chúng tôi không thể gỡ xuất bản mẫu đó lần này.",
          message: "Thử gỡ xuất bản nó lại hoặc quay lại nó sau. Nếu vẫn còn vấn đề, liên hệ với chúng tôi.",
        },
      },
    },
    delete_confirmation: {
      title: "Xóa mẫu",
      description: {
        prefix: "Bạn có chắc chắn muốn xóa mẫu-",
        suffix: "? Tất cả dữ liệu liên quan đến mẫu sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.",
      },
    },
    unpublish_confirmation: {
      title: "Gỡ xuất bản mẫu",
      description: {
        prefix: "Bạn có chắc chắn muốn gỡ xuất bản mẫu-",
        suffix: "? Mẫu này sẽ không còn khả dụng cho người dùng trên marketplace.",
      },
    },
    dropdown: {
      add: {
        work_item: "Thêm mẫu mới",
        project: "Thêm mẫu mới",
      },
      label: {
        project: "Chọn mẫu dự án",
        page: "Chọn từ mẫu",
      },
      tooltip: {
        work_item: "Chọn mẫu mục công việc",
      },
      no_results: {
        work_item: "Không tìm thấy mẫu.",
        project: "Không tìm thấy mẫu.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Tạo mục công việc",
      "sub-title": "Cho nhóm biết bạn muốn họ làm việc về điều gì.",
      name: "Tên",
      email: "Email",
      about: "Mục công việc này là về gì?",
      description: "Mô tả điều nên xảy ra",
      description_placeholder: "Thêm càng nhiều chi tiết càng tốt để giúp nhóm nắm tình huống và nhu cầu của bạn.",
      loading: "Đang tạo",
      create_work_item: "Tạo mục công việc",
      errors: {
        name: "Tên là bắt buộc",
        name_max_length: "Tên phải ít hơn 255 ký tự",
        email: "Email là bắt buộc",
        email_invalid: "Địa chỉ email không hợp lệ",
        title: "Tiêu đề là bắt buộc",
        title_max_length: "Tiêu đề phải ít hơn 255 ký tự",
      },
    },
    success: {
      title: "Mục công việc của bạn đã vào hàng đợi của nhóm.",
      description: "Nhóm giờ có thể phê duyệt hoặc loại bỏ mục công việc này khỏi hàng đợi tiếp nhận.",
      primary_button: {
        text: "Thêm mục công việc khác",
      },
      secondary_button: {
        text: "Tìm hiểu thêm về Tiếp nhận",
      },
    },
    how_it_works: {
      title: "Cách hoạt động?",
      heading: "Đây là biểu mẫu Tiếp nhận.",
      description:
        "Tiếp nhận là tính năng Plane cho phép quản trị viên và quản lý dự án nhận mục công việc từ bên ngoài vào dự án.",
      steps: {
        step_1: "Biểu mẫu ngắn này cho phép bạn tạo mục công việc mới trong dự án Plane.",
        step_2: "Khi bạn gửi biểu mẫu này, một mục công việc mới sẽ được tạo trong Tiếp nhận của dự án đó.",
        step_3: "Ai đó từ dự án hoặc nhóm sẽ xem xét.",
        step_4: "Nếu họ phê duyệt, mục công việc sẽ chuyển vào hàng đợi công việc của dự án. Nếu không sẽ bị từ chối.",
        step_5:
          "Để kiểm tra trạng thái mục công việc đó, hãy liên hệ quản lý dự án, quản trị viên hoặc người gửi cho bạn liên kết trang này.",
      },
    },
    type_forms: {
      select_types: {
        title: "Chọn loại mục công việc",
        search_placeholder: "Tìm loại mục công việc",
      },
      actions: {
        select_properties: "Chọn thuộc tính",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Công việc lặp lại",
      description:
        "Thiết lập công việc lặp lại một lần, và chúng tôi sẽ chăm sóc các lặp lại. Bạn sẽ thấy tất cả ở đây khi đến lúc.",
      new_recurring_work_item: "Tạo mục công việc lặp lại mới",
      update_recurring_work_item: "Cập nhật mục công việc lặp lại",
      form: {
        interval: {
          title: "Lịch trình",
          start_date: {
            validation: {
              required: "Ngày bắt đầu là bắt buộc",
            },
          },
          interval_type: {
            validation: {
              required: "Loại khoảng thời gian là bắt buộc",
            },
          },
        },
        button: {
          create: "Tạo mục công việc lặp lại",
          update: "Cập nhật mục công việc lặp lại",
        },
      },
      create_button: {
        label: "Tạo mục công việc lặp lại",
        no_permission: "Liên hệ quản trị viên dự án của bạn để tạo mục công việc lặp lại",
      },
    },
    empty_state: {
      upgrade: {
        title: "Công việc của bạn, tự động hóa",
        description:
          "Thiết lập một lần. Chúng tôi sẽ tự động lặp lại khi đến hạn. Nâng cấp lên Doanh nghiệp để công việc lặp lại trở nên dễ dàng.",
      },
      no_templates: {
        button: "Tạo mục công việc lặp lại đầu tiên của bạn",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Đã tạo mục công việc lặp lại",
          message: "{name}, mục công việc lặp lại, hiện đã có trong không gian làm việc của bạn.",
        },
        error: {
          title: "Không thể tạo mục công việc lặp lại lần này.",
          message:
            "Hãy thử lưu lại thông tin của bạn hoặc sao chép sang một mục công việc lặp lại mới, tốt nhất ở tab khác.",
        },
      },
      update: {
        success: {
          title: "Đã thay đổi mục công việc lặp lại",
          message: "{name}, mục công việc lặp lại, đã được thay đổi.",
        },
        error: {
          title: "Không thể lưu thay đổi cho mục công việc lặp lại này.",
          message:
            "Hãy thử lưu lại thông tin hoặc quay lại mục công việc lặp lại này sau. Nếu vẫn gặp sự cố, hãy liên hệ với chúng tôi.",
        },
      },
      delete: {
        success: {
          title: "Đã xóa mục công việc lặp lại",
          message: "{name}, mục công việc lặp lại, đã bị xóa khỏi không gian làm việc của bạn.",
        },
        error: {
          title: "Không thể xóa mục công việc lặp lại này.",
          message: "Hãy thử xóa lại hoặc quay lại sau. Nếu vẫn không thể xóa, hãy liên hệ với chúng tôi.",
        },
      },
    },
    delete_confirmation: {
      title: "Xóa mục công việc lặp lại",
      description: {
        prefix: "Bạn có chắc chắn muốn xóa mục công việc lặp lại-",
        suffix:
          "? Tất cả dữ liệu liên quan đến mục công việc lặp lại này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.",
      },
    },
  },
  automations: {
    settings: {
      title: "Tự động hóa tùy chỉnh",
      create_automation: "Tạo tự động hóa",
    },
    scope: {
      label: "Phạm vi",
      run_on: "Chạy trên",
    },
    trigger: {
      label: "Kích hoạt",
      add_trigger: "Thêm kích hoạt",
      sidebar_header: "Cấu hình kích hoạt",
      input_label: "Kích hoạt nào cho tự động hóa này?",
      input_placeholder: "Chọn một tùy chọn",
      section_plane_events: "Sự kiện Plane",
      section_time_based: "Dựa trên thời gian",
      fixed_schedule: "Lịch trình cố định",
      schedule: {
        frequency: "Tần suất",
        select_day: "Chọn ngày",
        day_of_month: "Ngày trong tháng",
        monthly_every: "Mỗi",
        monthly_day_aria: "Ngày {day}",
        time: "Thời gian",
        hour: "Giờ",
        minute: "Phút",
        hour_suffix: "giờ",
        minute_suffix: "phút",
        am: "AM",
        pm: "PM",
        timezone: "Múi giờ",
        timezone_placeholder: "Chọn múi giờ",
        frequency_daily: "Hàng ngày",
        frequency_weekly: "Hàng tuần",
        frequency_monthly: "Hàng tháng",
        on: "Vào",
        validation_weekly_day_required: "Chọn ít nhất một ngày trong tuần.",
        validation_monthly_date_required: "Chọn một ngày trong tháng.",
        main_content_schedule_summary_daily: "Mỗi ngày lúc {time} ({timezone}).",
        main_content_schedule_summary_weekly: "Mỗi tuần vào {days} lúc {time} ({timezone}).",
        main_content_schedule_summary_monthly: "Mỗi tháng vào ngày {day} lúc {time} ({timezone}).",
        schedule_mode: "Chế độ lịch",
        schedule_mode_fixed: "Cố định",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Nhập biểu thức Cron",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Biểu thức Cron không hợp lệ.",
        cron_preview: 'Biểu thức Cron này chạy "{description}".',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Quay lại",
        next: "Thêm hành động",
      },
    },
    condition: {
      label: "Điều kiện",
      add_condition: "Thêm điều kiện",
      adding_condition: "Đang thêm điều kiện",
    },
    action: {
      label: "Hành động",
      add_action: "Thêm hành động",
      sidebar_header: "Hành động",
      input_label: "Tự động hóa làm gì?",
      input_placeholder: "Chọn một tùy chọn",
      handler_name: {
        add_comment: "Thêm bình luận",
        change_property: "Thay đổi thuộc tính",
      },
      configuration: {
        label: "Cấu hình",
        change_property: {
          placeholders: {
            property_name: "Chọn thuộc tính",
            change_type: "Chọn",
            property_value_select: "{count, plural, one{Chọn giá trị} other{Chọn giá trị}}",
            property_value_select_date: "Chọn ngày",
          },
          validation: {
            property_name_required: "Tên thuộc tính là bắt buộc",
            change_type_required: "Loại thay đổi là bắt buộc",
            property_value_required: "Giá trị thuộc tính là bắt buộc",
          },
        },
      },
      comment_block: {
        title: "Thêm bình luận",
      },
      change_property_block: {
        title: "Thay đổi thuộc tính",
      },
      validation: {
        delete_only_action: "Vô hiệu hóa tự động hóa trước khi xóa hành động duy nhất của nó.",
      },
    },
    conjunctions: {
      and: "Và",
      or: "Hoặc",
      if: "Nếu",
      then: "Thì",
    },
    enable: {
      alert: "Nhấn 'Kích hoạt' khi tự động hóa của bạn hoàn tất. Sau khi được kích hoạt, tự động hóa sẽ sẵn sàng chạy.",
      validation: {
        required: "Tự động hóa phải có kích hoạt và ít nhất một hành động để được kích hoạt.",
      },
    },
    delete: {
      validation: {
        enabled: "Tự động hóa phải được vô hiệu hóa trước khi xóa.",
      },
    },
    table: {
      title: "Tiêu đề tự động hóa",
      last_run_on: "Chạy lần cuối vào",
      created_on: "Được tạo vào",
      last_updated_on: "Cập nhật lần cuối vào",
      last_run_status: "Trạng thái chạy lần cuối",
      average_duration: "Thời gian trung bình",
      owner: "Chủ sở hữu",
      executions: "Lần thực thi",
    },
    create_modal: {
      heading: {
        create: "Tạo tự động hóa",
        update: "Cập nhật tự động hóa",
      },
      title: {
        placeholder: "Đặt tên cho tự động hóa của bạn.",
        required_error: "Tiêu đề là bắt buộc",
      },
      description: {
        placeholder: "Mô tả tự động hóa của bạn.",
      },
      submit_button: {
        create: "Tạo tự động hóa",
        update: "Cập nhật tự động hóa",
      },
    },
    delete_modal: {
      heading: "Xóa tự động hóa",
    },
    activity: {
      filters: {
        show_fails: "Hiển thị lỗi",
        all: "Tất cả",
        only_activity: "Chỉ hoạt động",
        only_run_history: "Chỉ lịch sử chạy",
      },
      run_history: {
        initiator: "Người khởi tạo",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Thành công!",
          message: "Tự động hóa đã được tạo thành công.",
        },
        error: {
          title: "Lỗi!",
          message: "Tạo tự động hóa thất bại.",
        },
      },
      update: {
        success: {
          title: "Thành công!",
          message: "Tự động hóa đã được cập nhật thành công.",
        },
        error: {
          title: "Lỗi!",
          message: "Cập nhật tự động hóa thất bại.",
        },
      },
      enable: {
        success: {
          title: "Thành công!",
          message: "Tự động hóa đã được kích hoạt thành công.",
        },
        error: {
          title: "Lỗi!",
          message: "Kích hoạt tự động hóa thất bại.",
        },
      },
      disable: {
        success: {
          title: "Thành công!",
          message: "Tự động hóa đã được vô hiệu hóa thành công.",
        },
        error: {
          title: "Lỗi!",
          message: "Vô hiệu hóa tự động hóa thất bại.",
        },
      },
      delete: {
        success: {
          title: "Đã xóa tự động hóa",
          message: "{name}, tự động hóa, hiện đã bị xóa khỏi dự án của bạn.",
        },
        error: {
          title: "Chúng tôi không thể xóa tự động hóa đó lần này.",
          message: "Hãy thử xóa lại hoặc quay lại sau. Nếu vẫn không thể xóa, hãy liên hệ với chúng tôi.",
        },
      },
      action: {
        create: {
          error: {
            title: "Lỗi!",
            message: "Không thể tạo hành động. Vui lòng thử lại!",
          },
        },
        update: {
          error: {
            title: "Lỗi!",
            message: "Không thể cập nhật hành động. Vui lòng thử lại!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Chưa có tự động hóa nào để hiển thị.",
        description:
          "Tự động hóa giúp bạn loại bỏ các tác vụ lặp lại bằng cách thiết lập kích hoạt, điều kiện và hành động. Tạo một cái để tiết kiệm thời gian và giữ cho công việc diễn ra một cách dễ dàng.",
      },
      upgrade: {
        title: "Tự động hóa",
        description: "Tự động hóa là cách để tự động hóa các tác vụ trong dự án của bạn.",
        sub_description: "Lấy lại 80% thời gian quản trị của bạn khi sử dụng Tự động hóa.",
      },
    },
  },
  sso: {
    header: "Danh tính",
    description: "Cấu hình miền của bạn để truy cập các tính năng bảo mật bao gồm đăng nhập một lần.",
    domain_management: {
      header: "Quản lý miền",
      verified_domains: {
        header: "Miền đã xác minh",
        description: "Xác minh quyền sở hữu miền email để bật đăng nhập một lần.",
        button_text: "Thêm miền",
        list: {
          domain_name: "Tên miền",
          status: "Trạng thái",
          status_verified: "Đã xác minh",
          status_failed: "Thất bại",
          status_pending: "Đang chờ",
        },
        add_domain: {
          title: "Thêm miền",
          description: "Thêm miền của bạn để cấu hình SSO và xác minh nó.",
          form: {
            domain_label: "Miền",
            domain_placeholder: "plane.so",
            domain_required: "Miền là bắt buộc",
            domain_invalid: "Nhập tên miền hợp lệ (ví dụ: plane.so)",
          },
          primary_button_text: "Thêm miền",
          primary_button_loading_text: "Đang thêm",
          toast: {
            success_title: "Thành công!",
            success_message: "Miền đã được thêm thành công. Vui lòng xác minh bằng cách thêm bản ghi DNS TXT.",
            error_message: "Không thể thêm miền. Vui lòng thử lại.",
          },
        },
        verify_domain: {
          title: "Xác minh miền của bạn",
          description: "Làm theo các bước sau để xác minh miền của bạn.",
          instructions: {
            label: "Hướng dẫn",
            step_1: "Đi tới cài đặt DNS cho máy chủ miền của bạn.",
            step_2: {
              part_1: "Tạo một",
              part_2: "bản ghi TXT",
              part_3: "và dán giá trị bản ghi đầy đủ được cung cấp bên dưới.",
            },
            step_3: "Bản cập nhật này thường mất vài phút nhưng có thể mất tới 72 giờ để hoàn thành.",
            step_4: 'Nhấp vào "Xác minh miền" để xác nhận sau khi bản ghi DNS của bạn được cập nhật.',
          },
          verification_code_label: "Giá trị bản ghi TXT",
          verification_code_description: "Thêm bản ghi này vào cài đặt DNS của bạn",
          domain_label: "Miền",
          primary_button_text: "Xác minh miền",
          primary_button_loading_text: "Đang xác minh",
          secondary_button_text: "Tôi sẽ làm sau",
          toast: {
            success_title: "Thành công!",
            success_message: "Miền đã được xác minh thành công.",
            error_message: "Không thể xác minh miền. Vui lòng thử lại.",
          },
        },
        delete_domain: {
          title: "Xóa miền",
          description: {
            prefix: "Bạn có chắc chắn muốn xóa",
            suffix: "? Hành động này không thể hoàn tác.",
          },
          primary_button_text: "Xóa",
          primary_button_loading_text: "Đang xóa",
          secondary_button_text: "Hủy",
          toast: {
            success_title: "Thành công!",
            success_message: "Miền đã được xóa thành công.",
            error_message: "Không thể xóa miền. Vui lòng thử lại.",
          },
        },
      },
    },
    providers: {
      header: "Đăng nhập một lần",
      disabled_message: "Thêm miền đã xác minh để cấu hình SSO",
      configure: {
        create: "Cấu hình",
        update: "Chỉnh sửa",
      },
      switch_alert_modal: {
        title: "Chuyển phương thức SSO sang {newProviderShortName}?",
        content:
          "Bạn sắp bật {newProviderLongName} ({newProviderShortName}). Hành động này sẽ tự động tắt {activeProviderLongName} ({activeProviderShortName}). Người dùng cố gắng đăng nhập qua {activeProviderShortName} sẽ không thể truy cập nền tảng cho đến khi họ chuyển sang phương thức mới. Bạn có chắc chắn muốn tiếp tục?",
        primary_button_text: "Chuyển",
        primary_button_text_loading: "Đang chuyển",
        secondary_button_text: "Hủy",
      },
      form_section: {
        title: "Chi tiết do IdP cung cấp cho {workspaceName}",
      },
      form_action_buttons: {
        saving: "Đang lưu",
        save_changes: "Lưu thay đổi",
        configure_only: "Chỉ cấu hình",
        configure_and_enable: "Cấu hình và bật",
        default: "Lưu",
      },
      setup_details_section: {
        title: "{workspaceName} chi tiết được cung cấp cho IdP của bạn",
        button_text: "Lấy chi tiết thiết lập",
      },
      saml: {
        header: "Bật SAML",
        description: "Cấu hình nhà cung cấp danh tính SAML của bạn để bật đăng nhập một lần.",
        configure: {
          title: "Bật SAML",
          description: "Xác minh quyền sở hữu miền email để truy cập các tính năng bảo mật bao gồm đăng nhập một lần.",
          toast: {
            success_title: "Thành công!",
            create_success_message: "Nhà cung cấp SAML đã được tạo thành công.",
            update_success_message: "Nhà cung cấp SAML đã được cập nhật thành công.",
            error_title: "Lỗi!",
            error_message: "Không thể lưu nhà cung cấp SAML. Vui lòng thử lại.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Chi tiết web",
            entity_id: {
              label: "ID thực thể | Đối tượng | Thông tin siêu dữ liệu",
              description:
                "Chúng tôi sẽ tạo phần siêu dữ liệu này xác định ứng dụng Plane này như một dịch vụ được ủy quyền trên IdP của bạn.",
            },
            callback_url: {
              label: "URL đăng nhập một lần",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng nhập của IdP của bạn.",
            },
            logout_url: {
              label: "URL đăng xuất một lần",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng xuất đơn của IdP của bạn.",
            },
          },
          mobile_details: {
            header: "Chi tiết di động",
            entity_id: {
              label: "ID thực thể | Đối tượng | Thông tin siêu dữ liệu",
              description:
                "Chúng tôi sẽ tạo phần siêu dữ liệu này xác định ứng dụng Plane này như một dịch vụ được ủy quyền trên IdP của bạn.",
            },
            callback_url: {
              label: "URL đăng nhập một lần",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng nhập của IdP của bạn.",
            },
            logout_url: {
              label: "URL đăng xuất một lần",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng xuất của IdP của bạn.",
            },
          },
          mapping_table: {
            header: "Chi tiết ánh xạ",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Bật OIDC",
        description: "Cấu hình nhà cung cấp danh tính OIDC của bạn để bật đăng nhập một lần.",
        configure: {
          title: "Bật OIDC",
          description: "Xác minh quyền sở hữu miền email để truy cập các tính năng bảo mật bao gồm đăng nhập một lần.",
          toast: {
            success_title: "Thành công!",
            create_success_message: "Nhà cung cấp OIDC đã được tạo thành công.",
            update_success_message: "Nhà cung cấp OIDC đã được cập nhật thành công.",
            error_title: "Lỗi!",
            error_message: "Không thể lưu nhà cung cấp OIDC. Vui lòng thử lại.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Chi tiết web",
            origin_url: {
              label: "URL nguồn gốc",
              description:
                "Chúng tôi sẽ tạo điều này cho ứng dụng Plane này. Thêm điều này như một nguồn gốc đáng tin cậy vào trường tương ứng của IdP của bạn.",
            },
            callback_url: {
              label: "URL chuyển hướng",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng nhập của IdP của bạn.",
            },
            logout_url: {
              label: "URL đăng xuất",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng xuất của IdP của bạn.",
            },
          },
          mobile_details: {
            header: "Chi tiết di động",
            origin_url: {
              label: "URL nguồn gốc",
              description:
                "Chúng tôi sẽ tạo điều này cho ứng dụng Plane này. Thêm điều này như một nguồn gốc đáng tin cậy vào trường tương ứng của IdP của bạn.",
            },
            callback_url: {
              label: "URL chuyển hướng",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng nhập của IdP của bạn.",
            },
            logout_url: {
              label: "URL đăng xuất",
              description:
                "Chúng tôi sẽ tạo điều này cho bạn. Thêm điều này vào trường URL chuyển hướng đăng xuất của IdP của bạn.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Tên dự án không được chứa ký tự đặc biệt.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Ngày và giờ hiện tại",
        },
        today: {
          description: "Ngày hôm nay",
        },
        start_of_day: {
          description: "Bắt đầu hôm nay",
        },
        end_of_day: {
          description: "Kết thúc hôm nay",
        },
        start_of_week: {
          description: "Bắt đầu tuần này",
        },
        end_of_week: {
          description: "Kết thúc tuần này",
        },
        start_of_month: {
          description: "Bắt đầu tháng này",
        },
        end_of_month: {
          description: "Kết thúc tháng này",
        },
        start_of_year: {
          description: "Bắt đầu năm nay",
        },
        end_of_year: {
          description: "Kết thúc năm nay",
        },
        days_ago: {
          description: "Ngày n ngày trước",
        },
        days_from_now: {
          description: "Ngày n ngày sau",
        },
        weeks_ago: {
          description: "Ngày n tuần trước",
        },
        weeks_from_now: {
          description: "Ngày n tuần sau",
        },
        months_ago: {
          description: "Ngày n tháng trước",
        },
        months_from_now: {
          description: "Ngày n tháng sau",
        },
      },
      user: {
        current_user: {
          description: "Người dùng đang đăng nhập",
        },
        members_of: {
          description: 'Thành viên của "project:<id>" hoặc "teamspace:<id>"',
        },
        workspace_members: {
          description: "Tất cả thành viên không gian làm việc",
        },
      },
      cycle: {
        active_cycle: {
          description: "Chu kỳ đang hoạt động hôm nay",
        },
        completed_cycles: {
          description: "Các chu kỳ có ngày kết thúc đã qua",
        },
        upcoming_cycles: {
          description: "Các chu kỳ có ngày bắt đầu trong tương lai",
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
          description: "Ngày đến hạn đã qua VÀ trạng thái đang mở",
        },
        has_no_assignee: {
          description: "Mục công việc không có người được giao",
        },
        has_no_label: {
          description: "Mục công việc không có nhãn",
        },
        is_top_level: {
          description: "Không phải mục công việc con (không có mục cha)",
        },
        is_sub_work_item: {
          description: "Là mục công việc con (có mục cha)",
        },
        is_epic: {
          description: "Epic",
        },
        is_intake: {
          description: "Là mục công việc tiếp nhận",
        },
        is_draft: {
          description: "Là bản nháp mục công việc",
        },
        is_archived: {
          description: "Đã lưu trữ",
        },
        has_children: {
          description: "Có ít nhất một mục công việc con",
        },
        has_start_and_due_dates: {
          description: "Có cả ngày bắt đầu và ngày đến hạn",
        },
      },
      relation: {
        linked_to: {
          description: "Các mục công việc liên quan đến mục đã cho",
        },
        blocked_by: {
          description: "Các mục công việc bị chặn bởi mục đã cho",
        },
        blocks: {
          description: "Các mục công việc chặn mục đã cho",
        },
        child_of: {
          description: "Các mục công việc con của mục đã cho",
        },
        parent_of: {
          description: "Mục công việc cha của mục đã cho",
        },
        duplicate_of: {
          description: "Các mục công việc được đánh dấu là bản sao của mục đã cho",
        },
      },
      history: {
        was_ever: {
          description: "Trường đã từng được đặt thành giá trị này",
        },
        was: {
          description: "Trường trước đây có giá trị này (đã thay đổi)",
        },
        changed_from: {
          description: "Trường đã được thay đổi từ giá trị này",
        },
        changed_to: {
          description: "Trường đã được thay đổi sang giá trị này",
        },
        changed: {
          description: "Trường đã được thay đổi",
        },
        updated_by: {
          description: "Mục công việc được cập nhật bởi người dùng này",
        },
        commented_by: {
          description: "Mục công việc được bình luận bởi người dùng này",
        },
        field_changed_by: {
          description: "Trường được thay đổi bởi người dùng này",
        },
        was_assigned_to: {
          description: "Mục công việc đã được giao cho người dùng này",
        },
        changed_after: {
          description: "Trường được thay đổi sau ngày này",
        },
        changed_before: {
          description: "Trường được thay đổi trước ngày này",
        },
        field_changed_after: {
          description: "Trường được thay đổi sau ngày này",
        },
        field_changed_before: {
          description: "Trường được thay đổi trước ngày này",
        },
        changed_to_after: {
          description: "Trường được thay đổi sang giá trị này sau ngày này",
        },
        changed_to_before: {
          description: "Trường được thay đổi sang giá trị này trước ngày này",
        },
        field_changed_between: {
          description: "Trường được thay đổi giữa các ngày này",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "điều hướng",
      accept: "chấp nhận",
      close: "đóng",
      pick_date: "Chọn ngày",
    },
    placeholder: 'Nhập truy vấn và nhấn "ENTER" để lọc...',
    error: "Lỗi khi gửi truy vấn. Vui lòng kiểm tra và thử lại.",
  },
  releases: {
    label: "{count, plural, one {Bản phát hành} other {Bản phát hành}}",
    no_release: "Không có bản phát hành",
    unreleased: "Chưa phát hành",
    select_releases: "Chọn bản phát hành",
    overview: "Tổng quan",
    scope: "Phạm vi",
    page_title: {
      scope: "Bản phát hành - {name} | Phạm vi",
      scope_fallback: "Bản phát hành | Phạm vi",
    },
    properties: "Thuộc tính",
    target_date: "Ngày mục tiêu",
    lead: "Phụ trách",
    release_tag: "Thẻ",
    labels: "Nhãn",
    description_placeholder: "Thêm mô tả...",
    progress: "Tiến độ",
    completed_work_items: "Mục công việc đã hoàn thành",
    pending_work_items: "Mục công việc đang chờ",
    cancelled_work_items: "Mục công việc đã hủy",
    scope_page: {
      work_items: "Mục công việc",
      add_work_items: "Thêm mục công việc",
      remove_from_release: "Gỡ khỏi bản phát hành",
      empty_state: {
        title: "Chưa có mục công việc",
        description: "Thêm mục công việc để xác định phạm vi bản phát hành.",
      },
      confirm_remove: {
        content: "Bạn có chắc muốn gỡ mục công việc này khỏi bản phát hành? Nó vẫn còn trong dự án.",
        primary_button: {
          default: "Gỡ",
          loading: "Đang gỡ",
        },
      },
    },
    empty_state: {
      title: "Chưa có phạm vi",
      description: "Thêm mục công việc vào bản phát hành để theo dõi việc hoàn thành của chúng cho bản phát hành này.",
      add_scope: "Thêm phạm vi",
      not_found: {
        title: "Không tìm thấy bản phát hành",
        description: "Bản phát hành có thể đã bị xóa.",
        primary_button: "Quay lại danh sách bản phát hành",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {Đã thêm mục công việc} other {Đã thêm mục công việc}}",
      work_items_error: "Không thể thêm mục công việc",
    },
    count_releases: "{count, plural, one {# bản phát hành} other {# bản phát hành}}",
    actions: {
      delete: "Xóa",
    },
    delete_modal: {
      title: "Xóa bản phát hành",
      content: 'Bạn có chắc chắn muốn xóa bản phát hành "{releaseName}" không? Hành động này không thể hoàn tác.',
    },
    settings: {
      heading: {
        title: "Bản phát hành",
        description: "Quản lý các hạng mục bàn giao của dự án một cách chính xác bằng bản phát hành.",
      },
      toggle: {
        title: "Bật bản phát hành",
        description: "Thành viên không gian làm việc sẽ có quyền xem phạm vi trong các dự án tương ứng của họ.",
      },
      toasts: {
        enable: {
          loading: "Đang bật bản phát hành...",
          success: {
            title: "Đã bật bản phát hành",
            message: "Bản phát hành đã được bật cho không gian làm việc này.",
          },
          error: {
            title: "Lỗi",
            message: "Không thể bật bản phát hành. Vui lòng thử lại.",
          },
        },
        disable: {
          loading: "Đang tắt bản phát hành...",
          success: {
            title: "Đã tắt bản phát hành",
            message: "Bản phát hành đã được tắt cho không gian làm việc này.",
          },
          error: {
            title: "Lỗi",
            message: "Không thể tắt bản phát hành. Vui lòng thử lại.",
          },
        },
      },
      tabs: {
        tags: "Thẻ bản phát hành",
        labels: "Nhãn",
      },
      tags: {
        title: "Thẻ bản phát hành",
        description: "Phân loại và lọc các bản phát hành của bạn bằng thẻ.",
        add: "Thêm thẻ",
        empty_state: "Chưa có thẻ nào. Hãy tạo thẻ đầu tiên của bạn.",
        errors: {
          version_required: "Phiên bản là bắt buộc.",
          version_already_exists: "Đã tồn tại một thẻ với phiên bản này.",
          generic: "Đã xảy ra lỗi. Vui lòng thử lại.",
        },
        delete_modal: {
          title: "Xóa thẻ",
          content: 'Bạn có chắc chắn muốn xóa thẻ "{tagVersion}" không? Hành động này không thể hoàn tác.',
        },
        actions: {
          edit: "Chỉnh sửa thẻ",
          delete: "Xóa thẻ",
        },
        toasts: {
          delete: {
            success: "Đã xóa thẻ thành công.",
            error: "Không thể xóa thẻ. Vui lòng thử lại.",
          },
        },
      },
      labels: {
        title: "Nhãn",
        description: "Cấu trúc và sắp xếp các sáng kiến của bạn bằng nhãn.",
        add: "Thêm nhãn",
        empty_state: "Chưa có nhãn nào. Hãy tạo nhãn đầu tiên của bạn.",
        errors: {
          name_required: "Tên là bắt buộc.",
          name_already_exists: "Đã tồn tại một nhãn với tên này.",
          generic: "Đã xảy ra lỗi. Vui lòng thử lại.",
        },
        modal: {
          name_placeholder: "Tên nhãn",
          pick_color: "Chọn màu nhãn",
        },
        actions: {
          edit: "Chỉnh sửa nhãn",
          delete: "Xóa nhãn",
        },
        drag_to_reorder: "Kéo để sắp xếp lại",
        delete_modal: {
          title: "Xóa nhãn",
          content: 'Bạn có chắc chắn muốn xóa nhãn "{labelName}" không? Hành động này không thể hoàn tác.',
        },
        toasts: {
          delete: {
            success: "Đã xóa nhãn thành công.",
            error: "Không thể xóa nhãn. Vui lòng thử lại.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Phân cấp",
      tab_label: "Phân cấp",
      description:
        "Thiết lập các cấp độ phân cấp để tổ chức công việc của bạn. Mỗi cấp độ xác định mối quan hệ cha với mục ngay phía trên và mối quan hệ con với mục ngay phía dưới. ",
      sidebar_label: "Phân cấp",
      enable_control: {
        title: "Bật phân cấp",
        description: "Tạo mối quan hệ cha-con giữa các loại mục công việc khác nhau.",
        tooltip: "Bạn không thể tắt phân cấp sau khi đã bật.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Trước tiên hãy xác định các Loại Mục Công Việc để tạo phân cấp mới.",
        cta: "Cài đặt loại mục công việc",
      },
    },
    levels: {
      add_level_button: "Thêm cấp độ phân cấp",
      empty_level_placeholder: "Thêm loại mục công việc vào cấp độ {level}",
      empty_level_unauthorized: "Không tìm thấy loại mục công việc nào ở cấp độ này.",
      zero_level_description:
        "Theo mặc định, tất cả các loại mục công việc ở cấp độ 0 cho đến khi được gán vào phân cấp.",
    },
    add_level_modal: {
      title: "Thêm cấp độ phân cấp",
      description: "Thêm cấp độ phân cấp mới vào loại mục công việc.",
      work_item_type: "Loại mục công việc",
      select_placeholder: "Chọn loại",
      search_placeholder: "Tìm kiếm loại",
      empty_state: {
        title: "Tất cả loại mục công việc đang được sử dụng",
        description:
          "Mỗi loại mục công việc được định nghĩa trong không gian làm việc này đã là một phần của phân cấp của bạn.",
      },
      invalid_level_toast: {
        title: "Lỗi!",
        message: "{type_name} không thể thêm vào cấp độ {level} vì vi phạm quy tắc phân cấp.",
      },
      error_toast: {
        title: "Lỗi",
        message: "Không thể thêm loại mục công việc vào phân cấp.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Lỗi!",
        message: "Loại mục công việc được chọn không thể dùng để tạo mục công việc mới vì vi phạm quy tắc phân cấp.",
      },
      invalid_work_item_type_update_toast: {
        title: "Lỗi!",
        message: "Loại mục công việc không thể cập nhật vì vi phạm quy tắc phân cấp.",
      },
    },
  },
} as const;

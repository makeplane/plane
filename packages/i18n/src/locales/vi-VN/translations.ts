export default {
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
  select_or_customize_your_interface_color_scheme: "Chọn hoặc tùy chỉnh sơ đồ màu giao diện của bạn.",
  theme: "Chủ đề",
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
  workspace: "Không gian làm việc",
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
  project_id_tooltip_content: "Giúp xác định duy nhất mục công việc trong dự án của bạn. Tối đa 10 ký tự.",
  description_placeholder: "Mô tả",
  only_alphanumeric_non_latin_characters_allowed: "Chỉ cho phép các ký tự chữ số và không phải Latin.",
  project_id_is_required: "ID dự án là bắt buộc",
  project_id_allowed_char: "Chỉ cho phép các ký tự chữ số và không phải Latin.",
  project_id_min_char: "ID dự án phải có ít nhất 1 ký tự",
  project_id_max_char: "ID dự án chỉ được tối đa 10 ký tự",
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
  pages: "Trang",
  intake: "Thu thập",
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
  discord: "Discord",
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
  priority: "Ưu tiên",
  none: "Không có",
  urgent: "Khẩn cấp",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  members: "Thành viên",
  assignee: "Người phụ trách",
  assignees: "Người phụ trách",
  you: "Bạn",
  labels: "Nhãn",
  create_new_label: "Tạo nhãn mới",
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
        description:
          "Có vẻ như tất cả tiện ích của bạn đều đã bị tắt. Bật chúng ngay\nđể nâng cao trải nghiệm của bạn!",
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
    epics: "Sử thi",
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
    clear_all: "Xóa tất cả",
    copied: "Đã sao chép!",
    link_copied: "Đã sao chép liên kết!",
    link_copied_to_clipboard: "Đã sao chép liên kết vào bảng tạm",
    copied_to_clipboard: "Đã sao chép liên kết mục công việc vào bảng tạm",
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
      description: "Chỉ những mục công việc đã hoàn thành hoặc đã hủy\ncó thể được lưu trữ",
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
      body: "Xin chào Quản trị viên hệ thống:\n\nVui lòng tạo một không gian làm việc mới có URL là [/workspace-name] cho [mục đích tạo không gian làm việc].\n\nCảm ơn,\n{firstName} {lastName}\n{email}",
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
        description: "Không phát hiện dự án nào phù hợp với điều kiện tìm kiếm.\nTạo dự án mới.",
      },
      search: {
        description: "Không phát hiện dự án nào phù hợp với điều kiện tìm kiếm.\nTạo dự án mới",
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
        title: "Token API",
        add_token: "Thêm token API",
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
      },
      validation: {
        min_length: "Điểm ước tính phải lớn hơn 0",
        unable_to_process: "Không thể xử lý yêu cầu của bạn, vui lòng thử lại",
        numeric: "Điểm ước tính phải là số",
        character: "Điểm ước tính phải là ký tự",
        empty: "Giá trị ước tính không được để trống",
        already_exists: "Giá trị ước tính này đã tồn tại",
        unsaved_changes: "Bạn có thay đổi chưa lưu. Vui lòng lưu trước khi nhấn 'xong'",
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
        title: "Tiếp nhận",
        short_title: "Tiếp nhận",
        description:
          "Cho phép những người không phải thành viên chia sẻ lỗi, phản hồi và đề xuất; mà không làm gián đoạn quy trình làm việc của bạn.",
        toggle_title: "Bật tiếp nhận",
        toggle_description: "Cho phép thành viên dự án tạo yêu cầu tiếp nhận trong ứng dụng.",
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
      archive_module_description: "Chỉ mô-đun đã hoàn thành hoặc đã hủy\ncó thể được lưu trữ.",
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
        description: "Không có chế độ xem phù hợp với tiêu chí tìm kiếm.\nTạo chế độ xem mới.",
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
        description:
          "Thử sử dụng các thuật ngữ khác, hoặc nếu bạn chắc chắn\ntìm kiếm là chính xác, hãy cho chúng tôi biết.",
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
} as const;

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export default {
  sidebar: {
    projects: "Dự án",
    pages: "Trang",
    new_work_item: "Mục công việc mới",
    home: "Trang chủ",
    your_work: "Công việc của bạn",
    inbox: "Hộp thư đến",
    workspace: "Không gian làm việc",
    views: "Chế độ xem",
    analytics: "Phân tích",
    dashboards: "Bảng điều khiển",
    work_items: "Mục công việc",
    cycles: "Chu kỳ",
    modules: "Mô-đun",
    intake: "Tiếp nhận",
    drafts: "Bản nháp",
    favorites: "Yêu thích",
    pro: "Pro",
    upgrade: "Nâng cấp",
  },

  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "name@company.com",
        errors: {
          required: "Vui lòng nhập email",
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
            default: "Đổi mật khẩu",
            submitting: "Đang đổi mật khẩu",
          },
        },
        errors: {
          match: "Mật khẩu không khớp",
          empty: "Vui lòng nhập mật khẩu",
          length: "Mật khẩu phải có hơn 8 ký tự",
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
              message: "Đã đổi mật khẩu thành công.",
            },
            error: {
              title: "Lỗi!",
              message: "Đã xảy ra lỗi. Vui lòng thử lại.",
            },
          },
        },
      },
      unique_code: {
        label: "Mã xác thực",
        placeholder: "123456",
        paste_code: "Dán mã đã gửi đến email của bạn",
        requesting_new_code: "Đang yêu cầu mã mới",
        sending_code: "Đang gửi mã",
      },
      already_have_an_account: "Đã có tài khoản?",
      login: "Đăng nhập",
      create_account: "Tạo tài khoản",
      new_to_plane: "Mới sử dụng Plane?",
      back_to_sign_in: "Quay lại đăng nhập",
      resend_in: "Gửi lại sau {seconds} giây",
      sign_in_with_unique_code: "Đăng nhập bằng mã xác thực",
      forgot_password: "Quên mật khẩu?",
    },
    sign_up: {
      header: {
        label: "Tạo tài khoản để bắt đầu quản lý công việc cùng nhóm.",
        step: {
          email: {
            header: "Đăng ký",
            sub_header: "",
          },
          password: {
            header: "Đăng ký",
            sub_header: "Đăng ký bằng email và mật khẩu.",
          },
          unique_code: {
            header: "Đăng ký",
            sub_header: "Đăng ký bằng mã xác thực được gửi đến email ở trên.",
          },
        },
      },
      errors: {
        password: {
          strength: "Hãy đặt mật khẩu mạnh để tiếp tục",
        },
      },
    },
    sign_in: {
      header: {
        label: "Đăng nhập để bắt đầu quản lý công việc cùng nhóm.",
        step: {
          email: {
            header: "Đăng nhập hoặc đăng ký",
            sub_header: "",
          },
          password: {
            header: "Đăng nhập hoặc đăng ký",
            sub_header: "Đăng nhập bằng email và mật khẩu.",
          },
          unique_code: {
            header: "Đăng nhập hoặc đăng ký",
            sub_header: "Đăng nhập bằng mã xác thực được gửi đến email ở trên.",
          },
        },
      },
    },
    forgot_password: {
      title: "Đặt lại mật khẩu",
      description: "Nhập địa chỉ email đã xác thực và chúng tôi sẽ gửi liên kết đặt lại mật khẩu cho bạn.",
      email_sent: "Đã gửi liên kết đặt lại đến email của bạn",
      send_reset_link: "Gửi liên kết đặt lại",
      errors: {
        smtp_not_enabled: "Quản trị viên chưa bật SMTP, không thể gửi liên kết đặt lại mật khẩu",
      },
      toast: {
        success: {
          title: "Đã gửi email",
          message:
            "Kiểm tra hộp thư đến để tìm liên kết đặt lại mật khẩu. Nếu không nhận được trong vài phút, hãy kiểm tra thư mục spam.",
        },
        error: {
          title: "Lỗi!",
          message: "Đã xảy ra lỗi. Vui lòng thử lại.",
        },
      },
    },
    reset_password: {
      title: "Đặt mật khẩu mới",
      description: "Bảo vệ tài khoản bằng mật khẩu mạnh",
    },
    set_password: {
      title: "Bảo mật tài khoản",
      description: "Đặt mật khẩu giúp bạn đăng nhập an toàn",
    },
    sign_out: {
      toast: {
        error: {
          title: "Lỗi!",
          message: "Đăng xuất thất bại. Vui lòng thử lại.",
        },
      },
    },
  },
} as const;

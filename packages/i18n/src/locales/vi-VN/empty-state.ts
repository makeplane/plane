/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export default {
  common_empty_state: {
    progress: {
      title: "Chưa có số liệu tiến độ để hiển thị.",
      description: "Bắt đầu đặt giá trị thuộc tính trong các mục công việc để xem số liệu tiến độ ở đây.",
    },
    updates: {
      title: "Chưa có cập nhật.",
      description: "Khi thành viên dự án thêm cập nhật, nó sẽ xuất hiện ở đây",
    },
    search: {
      title: "Không có kết quả phù hợp.",
      description: "Không tìm thấy kết quả. Hãy thử điều chỉnh các từ khóa tìm kiếm.",
    },
    not_found: {
      title: "Rất tiếc! Có vẻ như có gì đó không ổn",
      description: "Chúng tôi không thể tải tài khoản Gizmo của bạn hiện tại. Đây có thể là lỗi mạng.",
      cta_primary: "Thử tải lại",
    },
    server_error: {
      title: "Lỗi máy chủ",
      description:
        "Chúng tôi không thể kết nối và lấy dữ liệu từ máy chủ của chúng tôi. Đừng lo lắng, chúng tôi đang khắc phục.",
      cta_primary: "Thử tải lại",
    },
  },
  project_empty_state: {
    no_access: {
      title: "Có vẻ như bạn không có quyền truy cập vào Dự án này",
      restricted_description: "Liên hệ với quản trị viên để yêu cầu quyền truy cập và bạn có thể tiếp tục tại đây.",
      join_description: "Nhấn nút bên dưới để tham gia.",
      cta_primary: "Tham gia dự án",
      cta_loading: "Đang tham gia dự án",
    },
    invalid_project: {
      title: "Không tìm thấy dự án",
      description: "Dự án bạn đang tìm kiếm không tồn tại.",
    },
    work_items: {
      title: "Bắt đầu với mục công việc đầu tiên của bạn.",
      description:
        "Các mục công việc là những khối xây dựng của dự án của bạn — chỉ định người sở hữu, đặt mức độ ưu tiên và theo dõi tiến độ dễ dàng.",
      cta_primary: "Tạo mục công việc đầu tiên của bạn",
    },
    cycles: {
      title: "Nhóm và giới hạn thời gian công việc của bạn trong Chu kỳ.",
      description:
        "Chia nhỏ công việc thành các phần có giới hạn thời gian, làm ngược từ thời hạn dự án để đặt ngày và tạo tiến triển cụ thể như một đội.",
      cta_primary: "Đặt chu kỳ đầu tiên của bạn",
    },
    cycle_work_items: {
      title: "Không có mục công việc để hiển thị trong chu kỳ này",
      description:
        "Tạo các mục công việc để bắt đầu giám sát tiến độ của đội bạn trong chu kỳ này và đạt được mục tiêu đúng hạn.",
      cta_primary: "Tạo mục công việc",
      cta_secondary: "Thêm mục công việc hiện có",
    },
    modules: {
      title: "Ánh xạ mục tiêu dự án của bạn vào Mô-đun và theo dõi dễ dàng.",
      description:
        "Các mô-đun được tạo thành từ các mục công việc kết nối với nhau. Chúng hỗ trợ theo dõi tiến độ qua các giai đoạn dự án, mỗi giai đoạn có thời hạn và phân tích cụ thể để chỉ ra bạn gần đạt được các giai đoạn đó như thế nào.",
      cta_primary: "Đặt mô-đun đầu tiên của bạn",
    },
    module_work_items: {
      title: "Không có mục công việc để hiển thị trong Mô-đun này",
      description: "Tạo các mục công việc để bắt đầu giám sát mô-đun này.",
      cta_primary: "Tạo mục công việc",
      cta_secondary: "Thêm mục công việc hiện có",
    },
    views: {
      title: "Lưu chế độ xem tùy chỉnh cho dự án của bạn",
      description:
        "Chế độ xem là các bộ lọc đã lưu giúp bạn truy cập nhanh chóng thông tin bạn sử dụng nhiều nhất. Cộng tác dễ dàng khi các đồng đội chia sẻ và điều chỉnh chế độ xem theo nhu cầu cụ thể của họ.",
      cta_primary: "Tạo chế độ xem",
    },
    no_work_items_in_project: {
      title: "Chưa có mục công việc trong dự án",
      description:
        "Thêm các mục công việc vào dự án của bạn và chia nhỏ công việc thành các phần có thể theo dõi với chế độ xem.",
      cta_primary: "Thêm mục công việc",
    },
    work_item_filter: {
      title: "Không tìm thấy mục công việc",
      description: "Bộ lọc hiện tại của bạn không trả về kết quả nào. Hãy thử thay đổi bộ lọc.",
      cta_primary: "Thêm mục công việc",
    },
    pages: {
      title: "Ghi chép mọi thứ — từ ghi chú đến PRD",
      description:
        "Các trang cho phép bạn ghi lại và tổ chức thông tin ở một nơi. Viết ghi chú cuộc họp, tài liệu dự án và PRD, nhúng các mục công việc và cấu trúc chúng với các thành phần sẵn sàng sử dụng.",
      cta_primary: "Tạo Trang đầu tiên của bạn",
    },
    archive_pages: {
      title: "Chưa có trang được lưu trữ",
      description: "Lưu trữ các trang không nằm trong tầm quan sát của bạn. Truy cập chúng ở đây khi cần.",
    },
    intake_sidebar: {
      title: "Ghi lại yêu cầu Tiếp nhận",
      description: "Gửi các yêu cầu mới để được xem xét, ưu tiên và theo dõi trong quy trình làm việc của dự án.",
      cta_primary: "Tạo yêu cầu Tiếp nhận",
    },
    intake_main: {
      title: "Chọn một mục công việc Tiếp nhận để xem chi tiết của nó",
    },
  },
  workspace_empty_state: {
    archive_work_items: {
      title: "Chưa có mục công việc được lưu trữ",
      description:
        "Thủ công hoặc thông qua tự động hóa, bạn có thể lưu trữ các mục công việc đã hoàn thành hoặc bị hủy. Tìm chúng ở đây sau khi lưu trữ.",
      cta_primary: "Thiết lập tự động hóa",
    },
    archive_cycles: {
      title: "Chưa có chu kỳ được lưu trữ",
      description: "Để sắp xếp dự án của bạn, hãy lưu trữ các chu kỳ đã hoàn thành. Tìm chúng ở đây sau khi lưu trữ.",
    },
    archive_modules: {
      title: "Chưa có Mô-đun được lưu trữ",
      description:
        "Để sắp xếp dự án của bạn, hãy lưu trữ các mô-đun đã hoàn thành hoặc bị hủy. Tìm chúng ở đây sau khi lưu trữ.",
    },
    home_widget_quick_links: {
      title: "Giữ các tài liệu tham khảo, tài nguyên hoặc tài liệu quan trọng tiện lợi cho công việc của bạn",
    },
    inbox_sidebar_all: {
      title: "Cập nhật cho các mục công việc bạn đăng ký sẽ xuất hiện ở đây",
    },
    inbox_sidebar_mentions: {
      title: "Đề cập cho các mục công việc của bạn sẽ xuất hiện ở đây",
    },
    your_work_by_priority: {
      title: "Chưa có mục công việc được giao",
    },
    your_work_by_state: {
      title: "Chưa có mục công việc được giao",
    },
    views: {
      title: "Chưa có Chế độ xem",
      description:
        "Thêm các mục công việc vào dự án của bạn và sử dụng chế độ xem để lọc, sắp xếp và giám sát tiến độ dễ dàng.",
      cta_primary: "Thêm mục công việc",
    },
    drafts: {
      title: "Các mục công việc viết dở",
      description:
        "Để thử điều này, hãy bắt đầu thêm một mục công việc và để nó ở giữa chừng hoặc tạo bản nháp đầu tiên của bạn bên dưới. 😉",
      cta_primary: "Tạo mục công việc nháp",
    },
    projects_archived: {
      title: "Không có dự án được lưu trữ",
      description: "Có vẻ như tất cả các dự án của bạn vẫn đang hoạt động—làm tốt lắm!",
    },
    analytics_projects: {
      title: "Tạo dự án để trực quan hóa số liệu dự án ở đây.",
    },
    analytics_work_items: {
      title:
        "Tạo dự án với các mục công việc và người được giao để bắt đầu theo dõi hiệu suất, tiến độ và tác động của đội ở đây.",
    },
    analytics_no_cycle: {
      title:
        "Tạo chu kỳ để tổ chức công việc thành các giai đoạn có giới hạn thời gian và theo dõi tiến độ qua các sprint.",
    },
    analytics_no_module: {
      title: "Tạo mô-đun để tổ chức công việc của bạn và theo dõi tiến độ qua các giai đoạn khác nhau.",
    },
    analytics_no_intake: {
      title: "Thiết lập tiếp nhận để quản lý các yêu cầu đến và theo dõi cách chúng được chấp nhận và từ chối",
    },
  },
  settings_empty_state: {
    estimates: {
      title: "Chưa có ước tính",
      description:
        "Xác định cách đội của bạn đo lường nỗ lực và theo dõi nó một cách nhất quán trên tất cả các mục công việc.",
      cta_primary: "Thêm hệ thống ước tính",
    },
    labels: {
      title: "Chưa có nhãn",
      description: "Tạo nhãn cá nhân hóa để phân loại và quản lý các mục công việc của bạn một cách hiệu quả.",
      cta_primary: "Tạo nhãn đầu tiên của bạn",
    },
    exports: {
      title: "Chưa có xuất khẩu",
      description:
        "Bạn chưa có bản ghi xuất khẩu nào ngay bây giờ. Sau khi bạn xuất dữ liệu, tất cả các bản ghi sẽ xuất hiện ở đây.",
    },
    tokens: {
      title: "Chưa có token Cá nhân",
      description:
        "Tạo token API an toàn để kết nối không gian làm việc của bạn với các hệ thống và ứng dụng bên ngoài.",
      cta_primary: "Thêm token API",
    },
    webhooks: {
      title: "Chưa thêm Webhook",
      description: "Tự động hóa thông báo đến các dịch vụ bên ngoài khi sự kiện dự án xảy ra.",
      cta_primary: "Thêm webhook",
    },
  },
} as const;

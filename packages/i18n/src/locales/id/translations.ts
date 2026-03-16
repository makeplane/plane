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
      "Kami sedang mengerjakan ini. Jika Anda memerlukan bantuan segera,",
    reach_out_to_us: "hubungi kami",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Jika tidak, coba segarkan halaman sesekali atau kunjungi",
    status_page: "halaman status kami",
  },
  sidebar: {
    projects: "Projek",
    pages: "Halaman",
    new_work_item: "Item kerja baru",
    home: "Beranda",
    your_work: "Pekerjaan anda",
    inbox: "Inbox",
    workspace: "Workspace",
    views: "Views",
    analytics: "Analitik",
    work_items: "Item kerja",
    cycles: "Siklus",
    modules: "Modul",
    intake: "Intake",
    drafts: "Draft",
    favorites: "Favorit",
    pro: "Pro",
    upgrade: "Upgrade",
    pi_chat: "Plane AI",
    initiatives: "Inisiatif",
    teamspaces: "Teamspaces",
    epics: "Epics",
    upgrade_plan: "Tingkatkan paket",
    plane_pro: "Plane Pro",
    business: "Bisnis",
    customers: "Pelanggan",
    recurring_work_items: "Tugas Berulang",
  },
  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "nama@perusahaan.com",
        errors: {
          required: "Email wajib diisi",
          invalid: "Email tidak valid",
        },
      },
      password: {
        label: "Password",
        set_password: "Atur password",
        placeholder: "Masukkan password",
        confirm_password: {
          label: "Konfirmasi password",
          placeholder: "Konfirmasi password",
        },
        current_password: {
          label: "Password saat ini",
        },
        new_password: {
          label: "Password baru",
          placeholder: "Masukkan password baru",
        },
        change_password: {
          label: {
            default: "Ubah password",
            submitting: "Mengubah password",
          },
        },
        errors: {
          match: "Password tidak cocok",
          empty: "Silakan masukkan password anda",
          length: "Panjang password harus lebih dari 8 karakter",
          strength: {
            weak: "Password lemah",
            strong: "Password kuat",
          },
        },
        submit: "Atur password",
        toast: {
          change_password: {
            success: {
              title: "Berhasil!",
              message: "Password berhasil diubah.",
            },
            error: {
              title: "Error!",
              message: "Terjadi kesalahan. Silakan coba lagi.",
            },
          },
        },
      },
      unique_code: {
        label: "Kode unik",
        placeholder: "123456",
        paste_code: "Tempelkan kode yang dikirim ke email anda",
        requesting_new_code: "Meminta kode baru",
        sending_code: "Mengirim kode",
      },
      already_have_an_account: "Sudah punya akun?",
      login: "Masuk",
      create_account: "Buat akun",
      new_to_plane: "Baru di Plane?",
      back_to_sign_in: "Kembali ke halaman masuk",
      resend_in: "Kirim ulang dalam {seconds} detik",
      sign_in_with_unique_code: "Masuk dengan kode unik",
      forgot_password: "Lupa password?",
      username: {
        label: "Nama pengguna",
        placeholder: "Masukkan nama pengguna Anda",
      },
    },
    sign_up: {
      header: {
        label: "Buat akun untuk mulai mengelola pekerjaan dengan tim anda.",
        step: {
          email: {
            header: "Daftar",
            sub_header: "",
          },
          password: {
            header: "Daftar",
            sub_header: "Daftar menggunakan kombinasi email-password.",
          },
          unique_code: {
            header: "Daftar",
            sub_header: "Daftar menggunakan kode unik yang dikirim ke alamat email di atas.",
          },
        },
      },
      errors: {
        password: {
          strength: "Coba atur password yang lebih kuat untuk melanjutkan",
        },
      },
    },
    sign_in: {
      header: {
        label: "Masuk untuk mulai mengelola pekerjaan dengan tim anda.",
        step: {
          email: {
            header: "Masuk atau daftar",
            sub_header: "",
          },
          password: {
            header: "Masuk atau daftar",
            sub_header: "Gunakan kombinasi email-password anda untuk masuk.",
          },
          unique_code: {
            header: "Masuk atau daftar",
            sub_header: "Masuk menggunakan kode unik yang dikirim ke alamat email di atas.",
          },
        },
      },
    },
    forgot_password: {
      title: "Reset password anda",
      description:
        "Masukkan alamat email akun anda yang telah diverifikasi dan kami akan mengirimkan link reset password.",
      email_sent: "Kami telah mengirim link reset ke alamat email anda",
      send_reset_link: "Kirim link reset",
      errors: {
        smtp_not_enabled:
          "Kami melihat bahwa admin anda belum mengaktifkan SMTP, kami tidak dapat mengirimkan link reset password",
      },
      toast: {
        success: {
          title: "Email terkirim",
          message:
            "Periksa inbox anda untuk link reset password. Jika tidak muncul dalam beberapa menit, periksa folder spam.",
        },
        error: {
          title: "Error!",
          message: "Terjadi kesalahan. Silakan coba lagi.",
        },
      },
    },
    reset_password: {
      title: "Atur password baru",
      description: "Amankan akun anda dengan password yang kuat",
    },
    set_password: {
      title: "Amankan akun anda",
      description: "Mengatur password membantu anda masuk dengan aman",
    },
    sign_out: {
      toast: {
        error: {
          title: "Error!",
          message: "Gagal keluar. Silakan coba lagi.",
        },
      },
    },
    ldap: {
      header: {
        label: "Lanjutkan dengan {ldapProviderName}",
        sub_header: "Masukkan kredensial {ldapProviderName} Anda",
      },
    },
  },
  submit: "Kirim",
  cancel: "Batal",
  loading: "Memuat",
  error: "Kesalahan",
  success: "Sukses",
  warning: "Peringatan",
  info: "Info",
  close: "Tutup",
  yes: "Ya",
  no: "Tidak",
  ok: "OK",
  name: "Nama",
  description: "Deskripsi",
  search: "Cari",
  add_member: "Tambah anggota",
  adding_members: "Menambah anggota",
  remove_member: "Hapus anggota",
  add_members: "Tambah anggota",
  adding_member: "Menambah anggota",
  remove_members: "Hapus anggota",
  add: "Tambah",
  adding: "Menambah",
  remove: "Hapus",
  add_new: "Tambah baru",
  remove_selected: "Hapus yang dipilih",
  first_name: "Nama depan",
  last_name: "Nama belakang",
  email: "Email",
  display_name: "Nama tampilan",
  role: "Peran",
  timezone: "Zona waktu",
  avatar: "Avatar",
  cover_image: "Gambar sampul",
  password: "Kata sandi",
  change_cover: "Ganti sampul",
  language: "Bahasa",
  saving: "Menyimpan",
  save_changes: "Simpan perubahan",
  deactivate_account: "Nonaktifkan akun",
  deactivate_account_description:
    "Saat menonaktifkan akun, semua data dan sumber daya dalam akun tersebut akan dihapus secara permanen dan tidak dapat dipulihkan.",
  profile_settings: "Pengaturan profil",
  your_account: "Akun Anda",
  security: "Keamanan",
  activity: "Aktivitas",
  appearance: "Tampilan",
  notifications: "Notifikasi",
  workspaces: "Ruang kerja",
  create_workspace: "Buat ruang kerja",
  invitations: "Undangan",
  summary: "Ringkasan",
  assigned: "Ditetapkan",
  created: "Dibuat",
  subscribed: "Berlangganan",
  you_do_not_have_the_permission_to_access_this_page: "Anda tidak memiliki izin untuk mengakses halaman ini.",
  something_went_wrong_please_try_again: "Terjadi kesalahan. Silakan coba lagi.",
  load_more: "Muat lebih banyak",
  select_or_customize_your_interface_color_scheme: "Pilih atau sesuaikan skema warna antarmuka Anda.",
  select_the_cursor_motion_style_that_feels_right_for_you: "Pilih gaya gerakan kursor yang terasa tepat untuk Anda.",
  theme: "Tema",
  smooth_cursor: "Kursor Halus",
  system_preference: "Preferensi Sistem",
  light: "Terang",
  dark: "Gelap",
  light_contrast: "Kontras tinggi terang",
  dark_contrast: "Kontras tinggi gelap",
  custom: "Tema kustom",
  select_your_theme: "Pilih tema Anda",
  customize_your_theme: "Sesuaikan tema Anda",
  background_color: "Warna latar belakang",
  text_color: "Warna teks",
  primary_color: "Warna utama (Tema)",
  sidebar_background_color: "Warna latar belakang sidebar",
  sidebar_text_color: "Warna teks sidebar",
  set_theme: "Atur tema",
  enter_a_valid_hex_code_of_6_characters: "Masukkan kode hex yang valid dari 6 karakter",
  background_color_is_required: "Warna latar belakang diperlukan",
  text_color_is_required: "Warna teks diperlukan",
  primary_color_is_required: "Warna utama diperlukan",
  sidebar_background_color_is_required: "Warna latar belakang sidebar diperlukan",
  sidebar_text_color_is_required: "Warna teks sidebar diperlukan",
  updating_theme: "Memperbarui tema",
  theme_updated_successfully: "Tema berhasil diperbarui",
  failed_to_update_the_theme: "Gagal memperbarui tema",
  email_notifications: "Notifikasi email",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Tetap terupdate tentang item kerja yang Anda langgani. Aktifkan ini untuk mendapatkan notifikasi.",
  email_notification_setting_updated_successfully: "Pengaturan notifikasi email berhasil diperbarui",
  failed_to_update_email_notification_setting: "Gagal memperbarui pengaturan notifikasi email",
  notify_me_when: "Beri tahu saya ketika",
  property_changes: "Perubahan properti",
  property_changes_description:
    "Beri tahu saya ketika properti item kerja seperti penugasannya, prioritas, estimasi, atau hal lainnya berubah.",
  state_change: "Perubahan status",
  state_change_description: "Beri tahu saya ketika item kerja berpindah ke status yang berbeda",
  issue_completed: "Item kerja selesai",
  issue_completed_description: "Beri tahu saya hanya ketika item kerja selesai",
  comments: "Komentar",
  comments_description: "Beri tahu saya ketika seseorang meninggalkan komentar pada item kerja",
  mentions: "Sebutkan",
  mentions_description: "Beri tahu saya hanya ketika seseorang menyebut saya dalam komentar atau deskripsi",
  old_password: "Kata sandi lama",
  general_settings: "Pengaturan umum",
  sign_out: "Keluar",
  signing_out: "Keluar",
  active_cycles: "Siklus aktif",
  active_cycles_description:
    "Pantau siklus di seluruh proyek, lacak item kerja prioritas tinggi, dan fokus pada siklus yang membutuhkan perhatian.",
  on_demand_snapshots_of_all_your_cycles: "Snapshot sesuai permintaan dari semua siklus Anda",
  upgrade: "Tingkatkan",
  "10000_feet_view": "Tampilan 10.000 kaki dari semua siklus aktif.",
  "10000_feet_view_description":
    "Perbesar untuk melihat siklus yang berjalan di seluruh proyek Anda sekaligus, bukan berpindah dari Siklus ke Siklus di setiap proyek.",
  get_snapshot_of_each_active_cycle: "Dapatkan snapshot dari setiap siklus aktif.",
  get_snapshot_of_each_active_cycle_description:
    "Lacak metrik tingkat tinggi untuk semua siklus aktif, lihat kemajuan mereka, dan dapatkan gambaran tentang ruang lingkup terhadap tenggat waktu.",
  compare_burndowns: "Bandingkan burndown.",
  compare_burndowns_description:
    "Pantau bagaimana kinerja setiap tim Anda dengan melihat laporan burndown masing-masing siklus.",
  quickly_see_make_or_break_issues: "Lihat dengan cepat item kerja yang krusial.",
  quickly_see_make_or_break_issues_description:
    "Prabaca item kerja prioritas tinggi untuk setiap siklus terhadap tanggal jatuh tempo. Lihat semuanya per siklus hanya dengan satu klik.",
  zoom_into_cycles_that_need_attention: "Perbesar siklus yang membutuhkan perhatian.",
  zoom_into_cycles_that_need_attention_description:
    "Selidiki status siklus mana pun yang tidak sesuai dengan harapan dengan satu klik.",
  stay_ahead_of_blockers: "Tetap di depan penghambat.",
  stay_ahead_of_blockers_description:
    "Identifikasi tantangan dari satu proyek ke proyek lainnya dan lihat ketergantungan antar siklus yang tidak terlihat dari tampilan lain mana pun.",
  analytics: "Analitik",
  workspace_invites: "Undangan ruang kerja",
  enter_god_mode: "Masuk ke mode dewa",
  workspace_logo: "Logo ruang kerja",
  new_issue: "Item kerja baru",
  your_work: "Pekerjaan Anda",
  drafts: "Draf",
  projects: "Proyek",
  views: "Tampilan",
  archives: "Arsip",
  settings: "Pengaturan",
  failed_to_move_favorite: "Gagal memindahkan favorit",
  favorites: "Favorit",
  no_favorites_yet: "Belum ada favorit",
  create_folder: "Buat folder",
  new_folder: "Folder baru",
  favorite_updated_successfully: "Favorit berhasil diperbarui",
  favorite_created_successfully: "Favorit berhasil dibuat",
  folder_already_exists: "Folder sudah ada",
  folder_name_cannot_be_empty: "Nama folder tidak boleh kosong",
  something_went_wrong: "Terjadi kesalahan",
  failed_to_reorder_favorite: "Gagal mengatur ulang favorit",
  favorite_removed_successfully: "Favorit berhasil dihapus",
  failed_to_create_favorite: "Gagal membuat favorit",
  failed_to_rename_favorite: "Gagal mengganti nama favorit",
  project_link_copied_to_clipboard: "Tautan proyek disalin ke clipboard",
  link_copied: "Tautan disalin",
  add_project: "Tambah proyek",
  create_project: "Buat proyek",
  failed_to_remove_project_from_favorites: "Tidak dapat menghapus proyek dari favorit. Silakan coba lagi.",
  project_created_successfully: "Proyek berhasil dibuat",
  project_created_successfully_description:
    "Proyek berhasil dibuat. Anda sekarang dapat mulai menambahkan item kerja ke dalamnya.",
  project_name_already_taken: "Nama proyek sudah digunakan",
  project_identifier_already_taken: "ID proyek sudah digunakan",
  project_cover_image_alt: "Gambar sampul proyek",
  name_is_required: "Nama diperlukan",
  title_should_be_less_than_255_characters: "Judul harus kurang dari 255 karakter",
  project_name: "Nama proyek",
  project_id_must_be_at_least_1_character: "ID proyek harus minimal 1 karakter",
  project_id_must_be_at_most_5_characters: "ID proyek maksimal 5 karakter",
  project_id: "ID proyek",
  project_id_tooltip_content:
    "Membantu Anda mengidentifikasi item kerja dalam proyek secara unik. Maksimal 10 karakter.",
  description_placeholder: "Deskripsi",
  only_alphanumeric_non_latin_characters_allowed: "Hanya karakter alfanumerik & Non-latin yang diizinkan.",
  project_id_is_required: "ID proyek diperlukan",
  project_id_allowed_char: "Hanya karakter alfanumerik & Non-latin yang diizinkan.",
  project_id_min_char: "ID proyek harus minimal 1 karakter",
  project_id_max_char: "ID proyek maksimal 10 karakter",
  project_description_placeholder: "Masukkan deskripsi proyek",
  select_network: "Pilih jaringan",
  lead: "Pemimpin",
  date_range: "Rentang tanggal",
  private: "Pribadi",
  public: "Umum",
  accessible_only_by_invite: "Diakses hanya dengan undangan",
  anyone_in_the_workspace_except_guests_can_join: "Siapa saja di ruang kerja kecuali Tamu dapat bergabung",
  creating: "Membuat",
  creating_project: "Membuat proyek",
  adding_project_to_favorites: "Menambahkan proyek ke favorit",
  project_added_to_favorites: "Proyek ditambahkan ke favorit",
  couldnt_add_the_project_to_favorites: "Tidak dapat menambahkan proyek ke favorit. Silakan coba lagi.",
  removing_project_from_favorites: "Menghapus proyek dari favorit",
  project_removed_from_favorites: "Proyek dihapus dari favorit",
  couldnt_remove_the_project_from_favorites: "Tidak dapat menghapus proyek dari favorit. Silakan coba lagi.",
  add_to_favorites: "Tambah ke favorit",
  remove_from_favorites: "Hapus dari favorit",
  publish_project: "Publikasikan proyek",
  publish: "Publikasikan",
  copy_link: "Salin tautan",
  leave_project: "Tinggalkan proyek",
  join_the_project_to_rearrange: "Bergabunglah dengan proyek untuk menyusun ulang",
  drag_to_rearrange: "Seret untuk menyusun ulang",
  congrats: "Selamat!",
  open_project: "Buka proyek",
  issues: "Item kerja",
  cycles: "Siklus",
  modules: "Modul",
  pages: {
    link_pages: "Menghubungkan halaman",
    show_wiki_pages: "Tampilkan halaman wiki",
    link_pages_to: "Menghubungkan halaman ke",
    linked_pages: "Halaman yang terhubung",
    no_description: "Halaman ini kosong. Tulis sesuatu di sini dan lihatnya di sini sebagai placeholder",
    toasts: {
      link: {
        success: {
          title: "Halaman diperbarui",
          message: "Halaman berhasil diperbarui",
        },
        error: {
          title: "Halaman tidak diperbarui",
          message: "Halaman tidak dapat diperbarui",
        },
      },
      remove: {
        success: {
          title: "Halaman dihapus",
          message: "Halaman berhasil dihapus",
        },
        error: {
          title: "Halaman tidak dihapus",
          message: "Halaman tidak dapat dihapus",
        },
      },
    },
  },
  intake: "Penerimaan",
  renew: "Perpanjang",
  preview: "Pratinjau",
  time_tracking: "Pelacakan waktu",
  work_management: "Manajemen kerja",
  projects_and_issues: "Proyek dan item kerja",
  projects_and_issues_description: "Aktifkan atau nonaktifkan ini untuk proyek ini.",
  cycles_description:
    "Tetapkan batas waktu kerja per proyek dan sesuaikan periode waktunya sesuai kebutuhan. Satu siklus bisa 2 minggu, berikutnya 1 minggu.",
  modules_description: "Atur pekerjaan ke dalam sub-proyek dengan pemimpin dan penanggung jawab khusus.",
  views_description: "Simpan pengurutan, filter, dan opsi tampilan khusus atau bagikan dengan tim Anda.",
  pages_description: "Buat dan edit konten bebas bentuk: catatan, dokumen, apa saja.",
  intake_description: "Izinkan non-anggota membagikan bug, masukan, dan saran tanpa mengganggu alur kerja Anda.",
  time_tracking_description: "Catat waktu yang dihabiskan untuk item kerja dan proyek.",
  work_management_description: "Kelola pekerjaan dan proyek Anda dengan mudah.",
  documentation: "Dokumentasi",
  message_support: "Pesan dukungan",
  contact_sales: "Hubungi penjualan",
  hyper_mode: "Mode Hyper",
  keyboard_shortcuts: "Pintasan keyboard",
  whats_new: "Apa yang baru?",
  version: "Versi",
  we_are_having_trouble_fetching_the_updates: "Kami mengalami kesulitan mengambil pembaruan.",
  our_changelogs: "changelog kami",
  for_the_latest_updates: "untuk pembaruan terbaru.",
  please_visit: "Silakan kunjungi",
  docs: "Dokumen",
  full_changelog: "Changelog lengkap",
  support: "Dukungan",
  discord: "Discord",
  powered_by_plane_pages: "Ditenagai oleh Plane Pages",
  please_select_at_least_one_invitation: "Silakan pilih setidaknya satu undangan.",
  please_select_at_least_one_invitation_description:
    "Silakan pilih setidaknya satu undangan untuk bergabung dengan ruang kerja.",
  we_see_that_someone_has_invited_you_to_join_a_workspace:
    "Kami melihat bahwa seseorang telah mengundang Anda untuk bergabung dengan ruang kerja",
  join_a_workspace: "Bergabunglah dengan ruang kerja",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Kami melihat bahwa seseorang telah mengundang Anda untuk bergabung dengan ruang kerja",
  join_a_workspace_description: "Bergabunglah dengan ruang kerja",
  accept_and_join: "Terima & Bergabung",
  go_home: "Kembali ke Beranda",
  no_pending_invites: "Tidak ada undangan yang tertunda",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Anda dapat melihat di sini jika seseorang mengundang Anda untuk bergabung dengan ruang kerja",
  back_to_home: "Kembali ke beranda",
  workspace_name: "nama-ruang-kerja",
  deactivate_your_account: "Nonaktifkan akun Anda",
  deactivate_your_account_description:
    "Setelah dinonaktifkan, Anda tidak akan dapat ditugaskan item kerja dan ditagih untuk ruang kerja Anda. Untuk mengaktifkan kembali akun Anda, Anda akan memerlukan undangan ke ruang kerja di alamat email ini.",
  deactivating: "Menonaktifkan",
  confirm: "Konfirmasi",
  confirming: "Mengonfirmasi",
  draft_created: "Draf dibuat",
  issue_created_successfully: "Item kerja berhasil dibuat",
  draft_creation_failed: "Pembuatan draf gagal",
  issue_creation_failed: "Pembuatan item kerja gagal",
  draft_issue: "Draf item kerja",
  issue_updated_successfully: "Item kerja berhasil diperbarui",
  issue_could_not_be_updated: "Item kerja tidak dapat diperbarui",
  create_a_draft: "Buat draf",
  save_to_drafts: "Simpan ke Draf",
  save: "Simpan",
  update: "Perbarui",
  updating: "Memperbarui",
  create_new_issue: "Buat item kerja baru",
  editor_is_not_ready_to_discard_changes: "Editor belum siap untuk membuang perubahan",
  failed_to_move_issue_to_project: "Gagal memindahkan item kerja ke proyek",
  create_more: "Buat lebih banyak",
  add_to_project: "Tambahkan ke proyek",
  discard: "Buang",
  duplicate_issue_found: "Item kerja duplikat ditemukan",
  duplicate_issues_found: "Item kerja duplikat ditemukan",
  no_matching_results: "Tidak ada hasil yang cocok",
  title_is_required: "Judul diperlukan",
  title: "Judul",
  state: "Negara",
  priority: "Prioritas",
  none: "Tidak ada",
  urgent: "Penting",
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
  members: "Anggota",
  assignee: "Penugas",
  assignees: "Penugas",
  you: "Anda",
  labels: "Label",
  create_new_label: "Buat label baru",
  label_name: "Nama label",
  failed_to_create_label: "Gagal membuat label. Silakan coba lagi.",
  start_date: "Tanggal mulai",
  end_date: "Tanggal akhir",
  due_date: "Tanggal jatuh tempo",
  estimate: "Perkiraan",
  change_parent_issue: "Ubah item kerja induk",
  remove_parent_issue: "Hapus item kerja induk",
  add_parent: "Tambahkan induk",
  loading_members: "Memuat anggota",
  view_link_copied_to_clipboard: "Tautan tampilan disalin ke clipboard.",
  required: "Diperlukan",
  optional: "Opsional",
  Cancel: "Batal",
  edit: "Sunting",
  archive: "Arsip",
  restore: "Pulihkan",
  open_in_new_tab: "Buka di tab baru",
  delete: "Hapus",
  deleting: "Menghapus",
  make_a_copy: "Buat salinan",
  move_to_project: "Pindahkan ke proyek",
  good: "Bagus",
  morning: "pagi",
  afternoon: "siang",
  evening: "malam",
  show_all: "Tampilkan semua",
  show_less: "Tampilkan lebih sedikit",
  no_data_yet: "Belum ada data",
  syncing: "Menyinkronkan",
  add_work_item: "Tambahkan item kerja",
  advanced_description_placeholder: "Tekan '/' untuk perintah",
  create_work_item: "Buat item kerja",
  attachments: "Lampiran",
  declining: "Menolak",
  declined: "Ditolak",
  decline: "Tolak",
  unassigned: "Belum ditugaskan",
  work_items: "Item kerja",
  add_link: "Tambahkan tautan",
  points: "Poin",
  no_assignee: "Tidak ada penugas",
  no_assignees_yet: "Belum ada penugas",
  no_labels_yet: "Belum ada label",
  ideal: "Ideal",
  current: "Saat ini",
  no_matching_members: "Tidak ada anggota yang cocok",
  leaving: "Meninggalkan",
  removing: "Menghapus",
  leave: "Tinggalkan",
  refresh: "Segarkan",
  refreshing: "Menyegarkan",
  refresh_status: "Status segar",
  prev: "Sebelumnya",
  next: "Selanjutnya",
  re_generating: "Menghasilkan kembali",
  re_generate: "Hasilkan kembali",
  re_generate_key: "Hasilkan kembali kunci",
  export: "Ekspor",
  member: "{count, plural, one{# anggota} other{# anggota}}",
  new_password_must_be_different_from_old_password: "Kata sandi baru harus berbeda dari kata sandi lama",
  project_view: {
    sort_by: {
      created_at: "Dibuat pada",
      updated_at: "Diperbarui pada",
      name: "Nama",
    },
  },
  upgrade_request: "Minta Admin Ruang Kerja untuk meningkatkan.",
  copied_to_clipboard: "Disalin ke clipboard",
  copied_to_clipboard_description: "URL berhasil disalin ke clipboard Anda",
  toast: {
    success: "Sukses!",
    error: "Kesalahan!",
  },
  links: {
    toasts: {
      created: {
        title: "Tautan dibuat",
        message: "Tautan telah berhasil dibuat",
      },
      not_created: {
        title: "Tautan tidak dibuat",
        message: "Tautan tidak dapat dibuat",
      },
      updated: {
        title: "Tautan diperbarui",
        message: "Tautan telah berhasil diperbarui",
      },
      not_updated: {
        title: "Tautan tidak diperbarui",
        message: "Tautan tidak dapat diperbarui",
      },
      removed: {
        title: "Tautan dihapus",
        message: "Tautan telah berhasil dihapus",
      },
      not_removed: {
        title: "Tautan tidak dihapus",
        message: "Tautan tidak dapat dihapus",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Panduan pemula Anda",
      not_right_now: "Tidak sekarang",
      create_project: {
        title: "Buat proyek",
        description: "Sebagian besar hal dimulai dengan proyek di Plane.",
        cta: "Mulai sekarang",
      },
      invite_team: {
        title: "Undang tim Anda",
        description: "Bangun, kirim, dan kelola dengan rekan kerja.",
        cta: "Ajak mereka",
      },
      configure_workspace: {
        title: "Atur ruang kerja Anda.",
        description: "Hidupkan atau matikan fitur atau lebih dari itu.",
        cta: "Konfigurasi ruang kerja ini",
      },
      personalize_account: {
        title: "Jadikan Plane milik Anda.",
        description: "Pilih gambar Anda, warna, dan lainnya.",
        cta: "Personalisasi sekarang",
      },
      widgets: {
        title: "Sepi Tanpa Widget, Nyalakan Mereka",
        description: "Sepertinya semua widget Anda dimatikan. Aktifkan sekarang untuk meningkatkan pengalaman Anda!",
        primary_button: {
          text: "Kelola widget",
        },
      },
    },
    quick_links: {
      empty: "Simpan tautan ke hal-hal kerja yang ingin Anda miliki.",
      add: "Tambahkan Tautan Cepat",
      title: "Tautan Cepat",
      title_plural: "Tautan Cepat",
    },
    recents: {
      title: "Terbaru",
      empty: {
        project: "Proyek terbaru Anda akan muncul di sini setelah Anda mengunjunginya.",
        page: "Halaman terbaru Anda akan muncul di sini setelah Anda mengunjunginya.",
        issue: "Item kerja terbaru Anda akan muncul di sini setelah Anda mengunjunginya.",
        default: "Anda belum memiliki yang terbaru.",
      },
      filters: {
        all: "Semua",
        projects: "Proyek",
        pages: "Halaman",
        issues: "Item kerja",
      },
    },
    new_at_plane: {
      title: "Baru di Plane",
    },
    quick_tutorial: {
      title: "Tutorial cepat",
    },
    widget: {
      reordered_successfully: "Widget berhasil diurutkan ulang.",
      reordering_failed: "Kesalahan terjadi saat mengurutkan ulang widget.",
    },
    manage_widgets: "Kelola widget",
    title: "Beranda",
    star_us_on_github: "Bintang kami di GitHub",
    business_trial_banner: {
      title: "Uji coba 14 hari paket Business Anda telah aktif!",
      description:
        "Jelajahi semua fitur Business. Saat Anda siap, pilih untuk berlangganan. Anda tidak akan ditagih secara otomatis.",
      trial_ends_today: "Uji coba berakhir hari ini",
      trial_ends_in_days: "Uji coba berakhir dalam {days} hari",
      start_subscription: "Mulai berlangganan",
      explore_business_features: "Jelajahi fitur Business",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL tidak valid",
        placeholder: "Ketik atau tempel URL",
      },
      title: {
        text: "Judul tampilan",
        placeholder: "Apa yang ingin Anda lihat sebagai tautan ini",
      },
    },
  },
  common: {
    all: "Semua",
    no_items_in_this_group: "Tidak ada item dalam grup ini",
    drop_here_to_move: "Letakkan di sini untuk memindahkan",
    states: "Negara-negara",
    state: "Negara",
    state_groups: "Kelompok negara",
    state_group: "Kelompok negara",
    priorities: "Prioritas",
    priority: "Prioritas",
    team_project: "Proyek tim",
    project: "Proyek",
    cycle: "Siklus",
    cycles: "Siklus",
    module: "Modul",
    modules: "Modul",
    labels: "Label",
    label: "Label",
    assignees: "Penugas",
    assignee: "Penugas",
    created_by: "Dibuat oleh",
    none: "Tidak ada",
    link: "Tautan",
    estimates: "Perkiraan",
    estimate: "Perkiraan",
    created_at: "Dibuat pada",
    completed_at: "Selesai pada",
    layout: "Tata letak",
    filters: "Filter",
    display: "Tampilan",
    load_more: "Muat lebih banyak",
    activity: "Aktivitas",
    analytics: "Analitik",
    dates: "Tanggal",
    success: "Sukses!",
    something_went_wrong: "Ada yang salah",
    error: {
      label: "Kesalahan!",
      message: "Terjadi kesalahan. Silakan coba lagi.",
    },
    group_by: "Kelompok berdasarkan",
    epic: "Epik",
    epics: "Epik",
    work_item: "Item kerja",
    work_items: "Item kerja",
    sub_work_item: "Sub-item kerja",
    add: "Tambah",
    warning: "Peringatan",
    updating: "Memperbarui",
    adding: "Menambahkan",
    update: "Perbarui",
    creating: "Membuat",
    create: "Buat",
    cancel: "Batalkan",
    description: "Deskripsi",
    title: "Judul",
    attachment: "Lampiran",
    general: "Umum",
    features: "Fitur",
    automation: "Otomatisasi",
    project_name: "Nama proyek",
    project_id: "ID proyek",
    project_timezone: "Zona waktu proyek",
    created_on: "Dibuat pada",
    update_project: "Perbarui proyek",
    identifier_already_exists: "Pengidentifikasi sudah ada",
    add_more: "Tambah lebih banyak",
    defaults: "Pola dasar",
    add_label: "Tambah label",
    customize_time_range: "Sesuaikan rentang waktu",
    loading: "Memuat",
    attachments: "Lampiran",
    property: "Properti",
    properties: "Properti",
    parent: "Induk",
    page: "Halaman",
    remove: "Hapus",
    archiving: "Mengarsipkan",
    archive: "Arsip",
    access: {
      public: "Publik",
      private: "Pribadi",
    },
    done: "Selesai",
    sub_work_items: "Sub-item kerja",
    comment: "Komentar",
    workspace_level: "Tingkat ruang kerja",
    order_by: {
      label: "Urutkan berdasarkan",
      manual: "Manual",
      last_created: "Terakhir dibuat",
      last_updated: "Terakhir diperbarui",
      start_date: "Tanggal mulai",
      due_date: "Tanggal jatuh tempo",
      asc: "Menaik",
      desc: "Menurun",
      updated_on: "Diperbarui pada",
    },
    sort: {
      asc: "Menaik",
      desc: "Menurun",
      created_on: "Dibuat pada",
      updated_on: "Diperbarui pada",
    },
    comments: "Komentar",
    updates: "Pembaruan",
    additional_updates: "Pembaruan tambahan",
    clear_all: "Hapus semua",
    copied: "Disalin!",
    link_copied: "Tautan disalin!",
    link_copied_to_clipboard: "Tautan disalin ke clipboard",
    copied_to_clipboard: "Tautan item kerja disalin ke clipboard",
    branch_name_copied_to_clipboard: "Nama cabang disalin ke clipboard",
    is_copied_to_clipboard: "Item kerja disalin ke clipboard",
    no_links_added_yet: "Belum ada tautan yang ditambahkan",
    add_link: "Tambah tautan",
    links: "Tautan",
    go_to_workspace: "Pergi ke ruang kerja",
    progress: "Kemajuan",
    optional: "Opsional",
    join: "Bergabung",
    go_back: "Kembali",
    continue: "Lanjutkan",
    resend: "Kirim ulang",
    relations: "Hubungan",
    errors: {
      default: {
        title: "Kesalahan!",
        message: "Sesuatu telah salah. Silakan coba lagi.",
      },
      required: "Bidang ini diperlukan",
      entity_required: "{entity} diperlukan",
      restricted_entity: "{entity} dibatasi",
    },
    update_link: "Perbarui tautan",
    attach: "Lampirkan",
    create_new: "Buat baru",
    add_existing: "Tambah yang ada",
    type_or_paste_a_url: "Ketik atau tempel URL",
    url_is_invalid: "URL tidak valid",
    display_title: "Judul tampilan",
    link_title_placeholder: "Apa yang ingin Anda lihat pada tautan ini",
    url: "URL",
    side_peek: "Tampilan samping",
    modal: "Modal",
    full_screen: "Layar penuh",
    close_peek_view: "Tutup tampilan peek",
    toggle_peek_view_layout: "Alihkan tata letak tampilan peek",
    options: "Opsi",
    duration: "Durasi",
    today: "Hari ini",
    week: "Minggu",
    month: "Bulan",
    quarter: "Kuartal",
    press_for_commands: "Tekan '/' untuk perintah",
    click_to_add_description: "Klik untuk menambahkan deskripsi",
    search: {
      label: "Pencarian",
      placeholder: "Ketik untuk mencari",
      no_matches_found: "Tidak ada kecocokan ditemukan",
      no_matching_results: "Tidak ada hasil yang cocok",
    },
    actions: {
      edit: "Edit",
      make_a_copy: "Buat salinan",
      open_in_new_tab: "Buka di tab baru",
      copy_link: "Salin tautan",
      copy_branch_name: "Salin nama branch",
      archive: "Arsip",
      restore: "Pulihkan",
      delete: "Hapus",
      remove_relation: "Hapus hubungan",
      subscribe: "Berlangganan",
      unsubscribe: "Berhenti berlangganan",
      clear_sorting: "Hapus pengurutan",
      show_weekends: "Tampilkan akhir pekan",
      enable: "Aktifkan",
      disable: "Nonaktifkan",
    },
    name: "Nama",
    discard: "Buang",
    confirm: "Konfirmasi",
    confirming: "Mengonfirmasi",
    read_the_docs: "Baca dokumen",
    default: "Bawaan",
    active: "Aktif",
    enabled: "Diaktifkan",
    disabled: "Dinonaktifkan",
    mandate: "Mandat",
    mandatory: "Wajib",
    yes: "Ya",
    no: "Tidak",
    please_wait: "Silakan tunggu",
    enabling: "Mengaktifkan",
    disabling: "Menonaktifkan",
    beta: "Beta",
    or: "atau",
    next: "Selanjutnya",
    back: "Kembali",
    cancelling: "Membatalkan",
    configuring: "Mengkonfigurasi",
    clear: "Bersihkan",
    import: "Impor",
    connect: "Sambungkan",
    authorizing: "Mengautentikasi",
    processing: "Memproses",
    no_data_available: "Tidak ada data tersedia",
    from: "dari {name}",
    authenticated: "Terautentikasi",
    select: "Pilih",
    upgrade: "Tingkatkan",
    add_seats: "Tambahkan Kursi",
    projects: "Proyek",
    workspace: "Ruang kerja",
    workspaces: "Ruang kerja",
    team: "Tim",
    teams: "Tim",
    entity: "Entitas",
    entities: "Entitas",
    task: "Tugas",
    tasks: "Tugas",
    section: "Bagian",
    sections: "Bagian",
    edit: "Edit",
    connecting: "Menghubungkan",
    connected: "Terhubung",
    disconnect: "Putuskan",
    disconnecting: "Memutuskan",
    installing: "Menginstal",
    install: "Instal",
    reset: "Atur ulang",
    live: "Langsung",
    change_history: "Riwayat Perubahan",
    coming_soon: "Segera hadir",
    member: "Anggota",
    members: "Anggota",
    you: "Anda",
    upgrade_cta: {
      higher_subscription: "Tingkatkan ke langganan yang lebih tinggi",
      talk_to_sales: "Bicaralah dengan Penjualan",
    },
    category: "Kategori",
    categories: "Kategori",
    saving: "Menyimpan",
    save_changes: "Simpan perubahan",
    delete: "Hapus",
    deleting: "Menghapus",
    pending: "Tertunda",
    invite: "Undang",
    view: "Lihat",
    deactivated_user: "Pengguna dinonaktifkan",
    apply: "Terapkan",
    applying: "Terapkan",
    users: "Pengguna",
    admins: "Admin",
    guests: "Tamu",
    on_track: "Sesuai Jalur",
    off_track: "Menyimpang",
    at_risk: "Dalam risiko",
    timeline: "Linimasa",
    completion: "Penyelesaian",
    upcoming: "Mendatang",
    completed: "Selesai",
    in_progress: "Sedang berlangsung",
    planned: "Direncanakan",
    paused: "Dijedaikan",
    no_of: "Jumlah {entity}",
    resolved: "Terselesaikan",
    worklogs: "Log Kerja",
    project_updates: "Pembaruan Proyek",
    overview: "Ikhtisar",
    workflows: "Alur Kerja",
    templates: "Templat",
    members_and_teamspaces: "Anggota & Teamspaces",
    open_in_full_screen: "Buka {page} dalam layar penuh",
  },
  chart: {
    x_axis: "Sumbu-X",
    y_axis: "Sumbu-Y",
    metric: "Metrik",
  },
  form: {
    title: {
      required: "Judul wajib diisi",
      max_length: "Judul harus kurang dari {length} karakter",
    },
  },
  entity: {
    grouping_title: "Pengelompokan {entity}",
    priority: "Prioritas {entity}",
    all: "Semua {entity}",
    drop_here_to_move: "Letakkan di sini untuk memindahkan {entity}",
    delete: {
      label: "Hapus {entity}",
      success: "{entity} berhasil dihapus",
      failed: "Gagal menghapus {entity}",
    },
    update: {
      failed: "Gagal memperbarui {entity}",
      success: "{entity} berhasil diperbarui",
    },
    link_copied_to_clipboard: "Tautan {entity} disalin ke papan klip",
    fetch: {
      failed: "Terjadi kesalahan saat mengambil {entity}",
    },
    add: {
      success: "{entity} berhasil ditambahkan",
      failed: "Terjadi kesalahan saat menambahkan {entity}",
    },
    remove: {
      success: "{entity} berhasil dihapus",
      failed: "Terjadi kesalahan saat menghapus {entity}",
    },
  },
  epic: {
    all: "Semua Epik",
    label: "{count, plural, one {Epik} other {Epik}}",
    new: "Epik Baru",
    adding: "Menambahkan epik",
    create: {
      success: "Epik berhasil dibuat",
    },
    add: {
      press_enter: "Tekan 'Enter' untuk menambahkan epik lain",
      label: "Tambahkan Epik",
    },
    title: {
      label: "Judul Epik",
      required: "Judul epik wajib diisi.",
    },
    archive: {
      description: `Hanya epik yang selesai atau dibatalkan
yang dapat diarsipkan`,
      label: "Arsipkan Epik",
      confirm_message: "Apakah Anda yakin ingin mengarsipkan epik? Semua epik yang diarsipkan dapat dipulihkan nanti.",
      success: {
        label: "Arsip berhasil",
        message: "Arsip Anda dapat ditemukan di arsip proyek.",
      },
      failed: {
        message: "Epik tidak dapat diarsipkan. Silakan coba lagi.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {Item Kerja} other {Item Kerja}}",
    all: "Semua Item Kerja",
    edit: "Edit item kerja",
    title: {
      label: "Judul item kerja",
      required: "Judul item kerja diperlukan.",
    },
    add: {
      press_enter: "Tekan 'Enter' untuk menambahkan item kerja lainnya",
      label: "Tambah item kerja",
      cycle: {
        failed: "Item kerja tidak dapat ditambahkan ke siklus. Silakan coba lagi.",
        success: "{count, plural, one {Item Kerja} other {Item Kerja}} berhasil ditambahkan ke siklus.",
        loading: "Menambahkan {count, plural, one {item kerja} other {item kerja}} ke siklus",
      },
      assignee: "Tambah penugasan",
      start_date: "Tambah tanggal mulai",
      due_date: "Tambah tanggal jatuh tempo",
      parent: "Tambah item kerja induk",
      sub_issue: "Tambah sub-item kerja",
      relation: "Tambah hubungan",
      link: "Tambah tautan",
      existing: "Tambah item kerja yang ada",
    },
    remove: {
      label: "Hapus item kerja",
      cycle: {
        loading: "Menghapus item kerja dari siklus",
        success: "Item kerja berhasil dihapus dari siklus.",
        failed: "Item kerja tidak dapat dihapus dari siklus. Silakan coba lagi.",
      },
      module: {
        loading: "Menghapus item kerja dari modul",
        success: "Item kerja berhasil dihapus dari modul.",
        failed: "Item kerja tidak dapat dihapus dari modul. Silakan coba lagi.",
      },
      parent: {
        label: "Hapus item kerja induk",
      },
    },
    new: "Item Kerja Baru",
    adding: "Menambahkan item kerja",
    create: {
      success: "Item kerja berhasil dibuat",
    },
    priority: {
      urgent: "Mendesak",
      high: "Tinggi",
      medium: "Sedang",
      low: "Rendah",
    },
    display: {
      properties: {
        label: "Tampilkan Properti",
        id: "ID",
        issue_type: "Tipe item kerja",
        sub_issue_count: "Jumlah sub-item kerja",
        attachment_count: "Jumlah lampiran",
        created_on: "Dibuat pada",
        sub_issue: "Sub-item kerja",
        work_item_count: "Jumlah item kerja",
      },
      extra: {
        show_sub_issues: "Tampilkan sub-item kerja",
        show_empty_groups: "Tampilkan grup kosong",
      },
    },
    layouts: {
      ordered_by_label: "Tata letak ini diurutkan berdasarkan",
      list: "Daftar",
      kanban: "Papan",
      calendar: "Kalender",
      spreadsheet: "Tabel",
      gantt: "Garis Waktu",
      title: {
        list: "Tata Letak Daftar",
        kanban: "Tata Letak Papan",
        calendar: "Tata Letak Kalender",
        spreadsheet: "Tata Letak Tabel",
        gantt: "Tata Letak Garis Waktu",
      },
    },
    states: {
      active: "Aktif",
      backlog: "Backlog",
    },
    comments: {
      placeholder: "Tambah komentar",
      switch: {
        private: "Beralih ke komentar pribadi",
        public: "Beralih ke komentar publik",
      },
      create: {
        success: "Komentar berhasil dibuat",
        error: "Gagal membuat komentar. Silakan coba lagi nanti.",
      },
      update: {
        success: "Komentar berhasil diperbarui",
        error: "Gagal memperbarui komentar. Silakan coba lagi nanti.",
      },
      remove: {
        success: "Komentar berhasil dihapus",
        error: "Gagal menghapus komentar. Silakan coba lagi nanti.",
      },
      upload: {
        error: "Gagal mengunggah aset. Silakan coba lagi nanti.",
      },
      copy_link: {
        success: "Tautan komentar berhasil disalin ke clipboard",
        error: "Gagal menyalin tautan komentar. Silakan coba lagi nanti.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "Item kerja tidak ada",
        description: "Item kerja yang Anda cari tidak ada, telah diarsipkan, atau telah dihapus.",
        primary_button: {
          text: "Lihat item kerja lainnya",
        },
      },
    },
    sibling: {
      label: "Item kerja sejawat",
    },
    archive: {
      description: `Hanya item kerja yang selesai atau dibatalkan
 yang dapat diarsipkan`,
      label: "Arsip Item kerja",
      confirm_message:
        "Apakah Anda yakin ingin mengarsipkan item kerja ini? Semua item kerja yang diarsipkan dapat dipulihkan nanti.",
      success: {
        label: "Sukses mengarsipkan",
        message: "Arsip Anda dapat ditemukan di arsip proyek.",
      },
      failed: {
        message: "Item kerja tidak dapat diarsipkan. Silakan coba lagi.",
      },
    },
    restore: {
      success: {
        title: "Sukses memulihkan",
        message: "Item kerja Anda dapat ditemukan di item kerja proyek.",
      },
      failed: {
        message: "Item kerja tidak dapat dipulihkan. Silakan coba lagi.",
      },
    },
    relation: {
      relates_to: "Berhubungan dengan",
      duplicate: "Duplikat dari",
      blocked_by: "Diblokir oleh",
      blocking: "Memblokir",
      start_before: "Mulai Sebelum",
      start_after: "Mulai Setelah",
      finish_before: "Selesai Sebelum",
      finish_after: "Selesai Setelah",
      implements: "Menerapkan",
      implemented_by: "Diterapkan oleh",
    },
    copy_link: "Salin tautan item kerja",
    delete: {
      label: "Hapus item kerja",
      error: "Kesalahan saat menghapus item kerja",
    },
    subscription: {
      actions: {
        subscribed: "Item kerja telah berhasil disubscribe",
        unsubscribed: "Item kerja telah berhasil dibatalkan subscribe",
      },
    },
    select: {
      error: "Silakan pilih setidaknya satu item kerja",
      empty: "Tidak ada item kerja yang dipilih",
      add_selected: "Tambah item kerja yang dipilih",
      select_all: "Pilih semua item kerja",
      deselect_all: "Batalkan pilihan semua item kerja",
    },
    open_in_full_screen: "Buka item kerja dalam layar penuh",
  },
  attachment: {
    error: "File tidak dapat dilampirkan. Coba unggah lagi.",
    only_one_file_allowed: "Hanya satu file yang dapat diunggah pada satu waktu.",
    file_size_limit: "File harus berukuran {size}MB atau lebih kecil.",
    drag_and_drop: "Seret dan jatuhkan di mana saja untuk mengunggah",
    delete: "Hapus lampiran",
  },
  label: {
    select: "Pilih label",
    create: {
      success: "Label berhasil dibuat",
      failed: "Gagal membuat label",
      already_exists: "Label sudah ada",
      type: "Ketik untuk menambah label baru",
    },
  },
  sub_work_item: {
    update: {
      success: "Sub-item kerja berhasil diperbarui",
      error: "Kesalahan saat memperbarui sub-item kerja",
    },
    remove: {
      success: "Sub-item kerja berhasil dihapus",
      error: "Kesalahan saat menghapus sub-item kerja",
    },
    empty_state: {
      sub_list_filters: {
        title: "Anda tidak memiliki sub-item kerja yang cocok dengan filter yang Anda terapkan.",
        description: "Untuk melihat semua sub-item kerja, hapus semua filter yang diterapkan.",
        action: "Hapus filter",
      },
      list_filters: {
        title: "Anda tidak memiliki item kerja yang cocok dengan filter yang Anda terapkan.",
        description: "Untuk melihat semua item kerja, hapus semua filter yang diterapkan.",
        action: "Hapus filter",
      },
    },
  },
  view: {
    label: "{count, plural, one {Tampilan} other {Tampilan}}",
    create: {
      label: "Buat Tampilan",
    },
    update: {
      label: "Perbarui Tampilan",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Menunggu",
        description: "Menunggu",
      },
      declined: {
        title: "Ditolak",
        description: "Ditolak",
      },
      snoozed: {
        title: "Ditunda",
        description: "{days, plural, one{# hari} other{# hari}} tersisa",
      },
      accepted: {
        title: "Diterima",
        description: "Diterima",
      },
      duplicate: {
        title: "Duplikat",
        description: "Duplikat",
      },
    },
    modals: {
      decline: {
        title: "Tolak item kerja",
        content: "Apakah Anda yakin ingin menolak item kerja {value}?",
      },
      delete: {
        title: "Hapus item kerja",
        content: "Apakah Anda yakin ingin menghapus item kerja {value}?",
        success: "Item kerja berhasil dihapus",
      },
    },
    errors: {
      snooze_permission: "Hanya admin proyek yang bisa menunda/menghapus penundaan item kerja",
      accept_permission: "Hanya admin proyek yang bisa menerima item kerja",
      decline_permission: "Hanya admin proyek yang bisa menolak item kerja",
    },
    actions: {
      accept: "Terima",
      decline: "Tolak",
      snooze: "Tunda",
      unsnooze: "Hapus penundaan",
      copy: "Salin tautan item kerja",
      delete: "Hapus",
      open: "Buka item kerja",
      mark_as_duplicate: "Tandai sebagai duplikat",
      move: "Pindahkan {value} ke item kerja proyek",
    },
    source: {
      "in-app": "dalam aplikasi",
    },
    order_by: {
      created_at: "Dibuat pada",
      updated_at: "Diperbarui pada",
      id: "ID",
    },
    label: "Pendapat",
    page_label: "{workspace} - Pendapat",
    modal: {
      title: "Buat item kerja pendapat",
    },
    tabs: {
      open: "Terbuka",
      closed: "Tutup",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Tidak ada item kerja terbuka",
        description: "Temukan item kerja terbuka di sini. Buat item kerja baru.",
      },
      sidebar_closed_tab: {
        title: "Tidak ada item kerja tertutup",
        description: "Semua item kerja yang diterima atau ditolak dapat ditemukan di sini.",
      },
      sidebar_filter: {
        title: "Tidak ada item kerja yang cocok",
        description:
          "Tidak ada item kerja yang cocok dengan filter yang diterapkan dalam pendapat. Buat item kerja baru.",
      },
      detail: {
        title: "Pilih item kerja untuk melihat detailnya.",
      },
    },
  },
  workspace_creation: {
    heading: "Buat ruang kerja Anda",
    subheading: "Untuk mulai menggunakan Plane, Anda perlu membuat atau bergabung dengan ruang kerja.",
    form: {
      name: {
        label: "Nama ruang kerja Anda",
        placeholder: "Sesuatu yang familiar dan dapat dikenali selalu lebih baik.",
      },
      url: {
        label: "Atur URL ruang kerja Anda",
        placeholder: "Ketik atau tempel URL",
        edit_slug: "Anda hanya dapat mengedit slug URL",
      },
      organization_size: {
        label: "Berapa banyak orang yang akan menggunakan ruang kerja ini?",
        placeholder: "Pilih rentang",
      },
    },
    errors: {
      creation_disabled: {
        title: "Hanya admin instansi Anda yang dapat membuat ruang kerja",
        description:
          "Jika Anda tahu alamat email admin instansi Anda, klik tombol di bawah ini untuk menghubungi mereka.",
        request_button: "Minta admin instansi",
      },
      validation: {
        name_alphanumeric: "Nama ruang kerja hanya boleh berisi (' '), ('-'), ('_') dan karakter alfanumerik.",
        name_length: "Batasi nama Anda hingga 80 karakter.",
        url_alphanumeric: "URL hanya boleh berisi ('-') dan karakter alfanumerik.",
        url_length: "Batasi URL Anda hingga 48 karakter.",
        url_already_taken: "URL ruang kerja sudah diambil!",
      },
    },
    request_email: {
      subject: "Meminta ruang kerja baru",
      body: `Hai admin instansi,

Tolong buat ruang kerja baru dengan URL [/workspace-name] untuk [tujuan pembuatan ruang kerja].

Terima kasih,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Buat ruang kerja",
      loading: "Membuat ruang kerja",
    },
    toast: {
      success: {
        title: "Sukses",
        message: "Ruang kerja berhasil dibuat",
      },
      error: {
        title: "Kesalahan",
        message: "Ruang kerja tidak dapat dibuat. Silakan coba lagi.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Ikhtisar proyek, aktivitas, dan metrik Anda",
        description:
          "Selamat datang di Plane, kami sangat senang memiliki Anda di sini. Buat proyek pertama Anda dan lacak item kerja Anda, dan halaman ini akan berubah menjadi ruang yang membantu Anda berkembang. Admin juga akan melihat item yang membantu tim mereka berkembang.",
        primary_button: {
          text: "Bangun proyek pertama Anda",
          comic: {
            title: "Segalanya dimulai dengan proyek di Plane",
            description: "Sebuah proyek bisa menjadi roadmap produk, kampanye pemasaran, atau meluncurkan mobil baru.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analitik",
    page_label: "{workspace} - Analitik",
    open_tasks: "Jumlah tugas terbuka",
    error: "Terjadi kesalahan dalam mengambil data.",
    work_items_closed_in: "Item kerja yang ditutup dalam",
    selected_projects: "Proyek yang dipilih",
    total_members: "Jumlah anggota total",
    total_cycles: "Jumlah siklus total",
    total_modules: "Jumlah modul total",
    pending_work_items: {
      title: "Item kerja yang menunggu",
      empty_state: "Analisis item kerja yang menunggu oleh rekan kerja muncul di sini.",
    },
    work_items_closed_in_a_year: {
      title: "Item kerja yang ditutup dalam setahun",
      empty_state: "Tutup item kerja untuk melihat analisis dari item kerja tersebut dalam bentuk grafik.",
    },
    most_work_items_created: {
      title: "Paling banyak item kerja yang dibuat",
      empty_state: "Rekan kerja dan jumlah item kerja yang mereka buat muncul di sini.",
    },
    most_work_items_closed: {
      title: "Paling banyak item kerja yang ditutup",
      empty_state: "Rekan kerja dan jumlah item kerja yang mereka tutup muncul di sini.",
    },
    tabs: {
      scope_and_demand: "Lingkup dan Permintaan",
      custom: "Analitik Kustom",
    },
    empty_state: {
      customized_insights: {
        description: "Item pekerjaan yang ditugaskan kepada Anda, dipecah berdasarkan status, akan muncul di sini.",
        title: "Belum ada data",
      },
      created_vs_resolved: {
        description: "Item pekerjaan yang dibuat dan diselesaikan dari waktu ke waktu akan muncul di sini.",
        title: "Belum ada data",
      },
      project_insights: {
        title: "Belum ada data",
        description: "Item pekerjaan yang ditugaskan kepada Anda, dipecah berdasarkan status, akan muncul di sini.",
      },
      general: {
        title: "Lacak kemajuan, beban kerja, dan alokasi. Temukan tren, hapus hambatan, dan percepat pekerjaan",
        description:
          "Lihat lingkup versus permintaan, perkiraan, dan perluasan lingkup. Dapatkan kinerja berdasarkan anggota tim dan tim, dan pastikan proyek Anda berjalan tepat waktu.",
        primary_button: {
          text: "Mulai proyek pertama Anda",
          comic: {
            title: "Analitik bekerja paling baik dengan Siklus + Modul",
            description:
              "Pertama, batasi waktu masalah Anda ke dalam Siklus dan, jika Anda bisa, kelompokkan masalah yang lebih dari satu siklus ke dalam Modul. Lihat keduanya di navigasi kiri.",
          },
        },
      },
      cycle_progress: {
        title: "Belum ada data",
        description:
          "Analitik kemajuan siklus akan muncul di sini. Tambahkan item kerja ke siklus untuk mulai melacak kemajuan.",
      },
      module_progress: {
        title: "Belum ada data",
        description:
          "Analitik kemajuan modul akan muncul di sini. Tambahkan item kerja ke modul untuk mulai melacak kemajuan.",
      },
      intake_trends: {
        title: "Belum ada data",
        description:
          "Analitik tren intake akan muncul di sini. Tambahkan item kerja ke intake untuk mulai melacak tren.",
      },
    },
    created_vs_resolved: "Dibuat vs Diselesaikan",
    customized_insights: "Wawasan yang Disesuaikan",
    backlog_work_items: "{entity} backlog",
    active_projects: "Proyek Aktif",
    trend_on_charts: "Tren pada grafik",
    all_projects: "Semua Proyek",
    summary_of_projects: "Ringkasan Proyek",
    project_insights: "Wawasan Proyek",
    started_work_items: "{entity} yang telah dimulai",
    total_work_items: "Total {entity}",
    total_projects: "Total Proyek",
    total_admins: "Total Admin",
    total_users: "Total Pengguna",
    total_intake: "Total Pemasukan",
    un_started_work_items: "{entity} yang belum dimulai",
    total_guests: "Total Tamu",
    completed_work_items: "{entity} yang telah selesai",
    total: "Total {entity}",
    projects_by_status: "Proyek berdasarkan status",
    active_users: "Pengguna aktif",
    intake_trends: "Tren Penerimaan",
    workitem_resolved_vs_pending: "Item kerja yang diselesaikan vs tertunda",
    upgrade_to_plan: "Tingkatkan ke {plan} untuk membuka {tab}",
  },
  workspace_projects: {
    label: "{count, plural, one {Proyek} other {Proyek}}",
    create: {
      label: "Tambah Proyek",
    },
    network: {
      label: "Jaringan",
      private: {
        title: "Pribadi",
        description: "Dapat diakses hanya dengan undangan",
      },
      public: {
        title: "Umum",
        description: "Siapa pun di ruang kerja kecuali Tamu dapat bergabung",
      },
    },
    error: {
      permission: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
      cycle_delete: "Gagal menghapus siklus",
      module_delete: "Gagal menghapus modul",
      issue_delete: "Gagal menghapus item kerja",
    },
    state: {
      backlog: "Backlog",
      unstarted: "Belum dimulai",
      started: "Dimulai",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    },
    sort: {
      manual: "Manual",
      name: "Nama",
      created_at: "Tanggal dibuat",
      members_length: "Jumlah anggota",
    },
    scope: {
      my_projects: "Proyek saya",
      archived_projects: "Diarsipkan",
    },
    common: {
      months_count: "{months, plural, one{# bulan} other{# bulan}}",
    },
    empty_state: {
      general: {
        title: "Tidak ada proyek aktif",
        description:
          "Anggap setiap proyek sebagai induk untuk pekerjaan yang terarah pada tujuan. Proyek adalah tempat di mana Pekerjaan, Siklus, dan Modul tinggal dan, bersama rekan-rekan Anda, membantu Anda mencapai tujuan tersebut. Buat proyek baru atau filter untuk proyek yang diarsipkan.",
        primary_button: {
          text: "Mulai proyek pertama Anda",
          comic: {
            title: "Segalanya dimulai dengan proyek di Plane",
            description: "Sebuah proyek bisa menjadi roadmap produk, kampanye pemasaran, atau meluncurkan mobil baru.",
          },
        },
      },
      no_projects: {
        title: "Tidak ada proyek",
        description:
          "Untuk membuat item kerja atau mengelola pekerjaan Anda, Anda perlu membuat proyek atau menjadi bagian dari salah satunya.",
        primary_button: {
          text: "Mulai proyek pertama Anda",
          comic: {
            title: "Segalanya dimulai dengan proyek di Plane",
            description: "Sebuah proyek bisa menjadi roadmap produk, kampanye pemasaran, atau meluncurkan mobil baru.",
          },
        },
      },
      filter: {
        title: "Tidak ada proyek yang cocok",
        description: `Tidak ada proyek yang terdeteksi dengan kriteria yang cocok.
 Buat proyek baru sebagai gantinya.`,
      },
      search: {
        description: `Tidak ada proyek yang terdeteksi dengan kriteria yang cocok.
Buat proyek baru sebagai gantinya`,
      },
    },
  },
  workspace_views: {
    add_view: "Tambah tampilan",
    empty_state: {
      "all-issues": {
        title: "Tidak ada item kerja dalam proyek",
        description:
          "Proyek pertama sudah selesai! Sekarang, bagi pekerjaan Anda menjadi bagian yang dapat dilacak dengan item kerja. Mari kita mulai!",
        primary_button: {
          text: "Buat item kerja baru",
        },
      },
      assigned: {
        title: "Belum ada item kerja",
        description: "Item kerja yang ditugaskan kepada Anda dapat dilacak dari sini.",
        primary_button: {
          text: "Buat item kerja baru",
        },
      },
      created: {
        title: "Belum ada item kerja",
        description: "Semua item kerja yang dibuat oleh Anda akan muncul di sini, lacak mereka langsung di sini.",
        primary_button: {
          text: "Buat item kerja baru",
        },
      },
      subscribed: {
        title: "Belum ada item kerja",
        description: "Langgan item kerja yang Anda minati, lacak semuanya di sini.",
      },
      "custom-view": {
        title: "Belum ada item kerja",
        description: "Item kerja yang menerapkan filter ini, lacak semuanya di sini.",
      },
    },
    delete_view: {
      title: "Apakah Anda yakin ingin menghapus tampilan ini?",
      content:
        "Jika Anda mengonfirmasi, semua opsi pengurutan, filter, dan tampilan + tata letak yang telah Anda pilih untuk tampilan ini akan dihapus secara permanen tanpa cara untuk memulihkannya.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "Ubah email",
        description: "Masukkan alamat email baru untuk menerima tautan verifikasi.",
        toasts: {
          success_title: "Berhasil!",
          success_message: "Email berhasil diperbarui. Silakan masuk kembali.",
        },
        form: {
          email: {
            label: "Email baru",
            placeholder: "Masukkan email Anda",
            errors: {
              required: "Email wajib diisi",
              invalid: "Email tidak valid",
              exists: "Email sudah ada. Gunakan yang lain.",
              validation_failed: "Validasi email gagal. Coba lagi.",
            },
          },
          code: {
            label: "Kode unik",
            placeholder: "123456",
            helper_text: "Kode verifikasi dikirim ke email baru Anda.",
            errors: {
              required: "Kode unik wajib diisi",
              invalid: "Kode verifikasi tidak valid. Coba lagi.",
            },
          },
        },
        actions: {
          continue: "Lanjutkan",
          confirm: "Konfirmasi",
          cancel: "Batal",
        },
        states: {
          sending: "Mengirim…",
        },
      },
    },
    notifications: {
      select_default_view: "Pilih tampilan default",
      compact: "Ringkas",
      full: "Layar penuh",
    },
  },
  workspace_settings: {
    label: "Pengaturan ruang kerja",
    page_label: "{workspace} - Pengaturan Umum",
    key_created: "Kunci dibuat",
    copy_key:
      "Salin dan simpan kunci rahasia ini di Halaman Plane. Anda tidak dapat melihat kunci ini setelah Anda menekan Tutup. File CSV yang berisi kunci telah diunduh.",
    token_copied: "Token disalin ke clipboard.",
    settings: {
      general: {
        title: "Umum",
        upload_logo: "Unggah logo",
        edit_logo: "Edit logo",
        name: "Nama ruang kerja",
        company_size: "Ukuran perusahaan",
        url: "URL ruang kerja",
        workspace_timezone: "Zona waktu ruang kerja",
        update_workspace: "Perbarui ruang kerja",
        delete_workspace: "Hapus ruang kerja ini",
        delete_workspace_description:
          "Ketika menghapus ruang kerja, semua data dan sumber daya di dalam ruang kerja tersebut akan dihapus secara permanen dan tidak dapat dipulihkan.",
        delete_btn: "Hapus ruang kerja ini",
        delete_modal: {
          title: "Apakah Anda yakin ingin menghapus ruang kerja ini?",
          description:
            "Anda memiliki percobaan aktif untuk salah satu rencana berbayar kami. Silakan batalkan terlebih dahulu untuk melanjutkan.",
          dismiss: "Tutup",
          cancel: "Batalkan percobaan",
          success_title: "Ruang kerja dihapus.",
          success_message: "Anda akan segera diarahkan ke halaman profil Anda.",
          error_title: "Itu tidak berhasil.",
          error_message: "Silakan coba lagi.",
        },
        errors: {
          name: {
            required: "Nama diperlukan",
            max_length: "Nama ruang kerja tidak boleh lebih dari 80 karakter",
          },
          company_size: {
            required: "Ukuran perusahaan diperlukan",
            select_a_range: "Pilih ukuran organisasi",
          },
        },
      },
      members: {
        title: "Anggota",
        add_member: "Tambah anggota",
        pending_invites: "Undangan yang tertunda",
        invitations_sent_successfully: "Undangan berhasil dikirim",
        leave_confirmation:
          "Apakah Anda yakin ingin meninggalkan ruang kerja? Anda tidak akan lagi memiliki akses ke ruang kerja ini. Tindakan ini tidak dapat dibatalkan.",
        details: {
          full_name: "Nama lengkap",
          display_name: "Nama tampilan",
          email_address: "Alamat email",
          account_type: "Tipe akun",
          authentication: "Autentikasi",
          joining_date: "Tanggal bergabung",
        },
        modal: {
          title: "Undang orang untuk berkolaborasi",
          description: "Undang orang untuk berkolaborasi di ruang kerja Anda.",
          button: "Kirim undangan",
          button_loading: "Mengirim undangan",
          placeholder: "name@company.com",
          errors: {
            required: "Kami perlu alamat email untuk mengundang mereka.",
            invalid: "Email tidak valid",
          },
        },
      },
      billing_and_plans: {
        title: "Penagihan & Rencana",
        current_plan: "Rencana saat ini",
        free_plan: "Anda saat ini menggunakan rencana gratis",
        view_plans: "Lihat rencana",
      },
      exports: {
        title: "Ekspor",
        exporting: "Mengeskpor",
        previous_exports: "Ekspor sebelumnya",
        export_separate_files: "Ekspor data ke file terpisah",
        filters_info: "Terapkan filter untuk mengekspor item kerja tertentu berdasarkan kriteria Anda.",
        modal: {
          title: "Ekspor ke",
          toasts: {
            success: {
              title: "Ekspor berhasil",
              message: "Anda akan dapat mengunduh {entity} yang diekspor dari ekspor sebelumnya.",
            },
            error: {
              title: "Ekspor gagal",
              message: "Ekspor tidak berhasil. Silakan coba lagi.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhook",
        add_webhook: "Tambah webhook",
        modal: {
          title: "Buat webhook",
          details: "Detail webhook",
          payload: "Payload URL",
          question: "Peristiwa apa yang ingin Anda picu untuk webhook ini?",
          error: "URL diperlukan",
        },
        secret_key: {
          title: "Kunci rahasia",
          message: "Hasilkan token untuk masuk ke payload webhook",
        },
        options: {
          all: "Kirim saya semuanya",
          individual: "Pilih peristiwa individu",
        },
        toasts: {
          created: {
            title: "Webhook dibuat",
            message: "Webhook telah berhasil dibuat",
          },
          not_created: {
            title: "Webhook tidak dibuat",
            message: "Webhook tidak dapat dibuat",
          },
          updated: {
            title: "Webhook diperbarui",
            message: "Webhook telah berhasil diperbarui",
          },
          not_updated: {
            title: "Webhook tidak diperbarui",
            message: "Webhook tidak dapat diperbarui",
          },
          removed: {
            title: "Webhook dihapus",
            message: "Webhook telah berhasil dihapus",
          },
          not_removed: {
            title: "Webhook tidak dihapus",
            message: "Webhook tidak dapat dihapus",
          },
          secret_key_copied: {
            message: "Kunci rahasia disalin ke clipboard.",
          },
          secret_key_not_copied: {
            message: "Terjadi kesalahan saat menyalin kunci rahasia.",
          },
        },
      },
      api_tokens: {
        heading: "Token API",
        description: "Buat token API yang aman untuk mengintegrasikan data Anda dengan sistem dan aplikasi eksternal.",
        title: "Token API",
        add_token: "Tambah token akses",
        create_token: "Buat token",
        never_expires: "Tidak pernah kedaluwarsa",
        generate_token: "Hasilkan token",
        generating: "Menghasilkan",
        delete: {
          title: "Hapus token API",
          description:
            "Setiap aplikasi yang menggunakan token ini tidak akan memiliki akses ke data Plane. Tindakan ini tidak dapat dibatalkan.",
          success: {
            title: "Sukses!",
            message: "Token API telah berhasil dihapus",
          },
          error: {
            title: "Kesalahan!",
            message: "Token API tidak dapat dihapus",
          },
        },
      },
      integrations: {
        title: "Integrasi",
        page_title: "Gunakan data Plane Anda di aplikasi yang tersedia atau aplikasi Anda sendiri.",
        page_description: "Lihat semua integrasi yang digunakan oleh workspace ini atau oleh Anda.",
      },
      imports: {
        title: "Impor",
      },
      worklogs: {
        title: "Log kerja",
      },
      group_syncing: {
        title: "Sinkronisasi grup",
        heading: "Sinkronisasi grup",
        description:
          "Tautkan grup penyedia identitas ke proyek dan peran. Akses pengguna diperbarui secara otomatis saat keanggotaan grup berubah di IdP Anda, menyederhanakan onboarding dan offboarding.",
        enable: {
          title: "Aktifkan sinkronisasi grup",
          description: "Secara otomatis menambahkan pengguna ke proyek berdasarkan grup penyedia identitas.",
        },
        config: {
          title: "Konfigurasi sinkronisasi grup",
          description: "Atur cara grup penyedia identitas dipetakan ke proyek dan peran.",
          sync_on_login: {
            title: "Sinkronisasi saat login",
            description: "Perbarui keanggotaan grup dan akses proyek saat pengguna masuk.",
          },
          sync_offline: {
            title: "Sinkronisasi offline",
            description: "Menjalankan sinkronisasi setiap enam jam secara otomatis, tanpa menunggu pengguna login.",
          },
          auto_remove: {
            title: "Hapus otomatis",
            description: "Secara otomatis menghapus pengguna dari proyek ketika mereka tidak lagi cocok dengan grup.",
          },
          group_attribute_key: {
            title: "Kunci atribut grup",
            description:
              "Atribut penyedia identitas yang digunakan untuk mengidentifikasi dan menyinkronkan grup pengguna.",
            placeholder: "Grup",
          },
        },
        group_mapping: {
          title: "Pemetaan grup",
          description: "Tautkan grup penyedia identitas ke proyek dan peran.",
          button_text: "Tambah sinkronisasi grup baru",
        },
        toast: {
          updating: "Memperbarui fitur sinkronisasi grup",
          success: "Fitur sinkronisasi grup berhasil diperbarui.",
          error: "Gagal memperbarui fitur sinkronisasi grup!",
        },
        delete_modal: {
          title: "Hapus sinkronisasi grup",
          content:
            "Pengguna baru dari grup identitas ini tidak akan lagi ditambahkan ke proyek. Pengguna yang sudah ditambahkan akan mempertahankan peran mereka saat ini.",
        },
        modal: {
          idp_group_name: {
            text: "Grup pengguna",
            required: "Grup pengguna wajib diisi",
            placeholder: "Masukkan nama grup IdP",
          },
          project: {
            text: "Proyek",
            required: "Proyek wajib diisi",
            placeholder: "Pilih proyek",
          },
          default_role: {
            text: "Peran proyek",
            required: "Peran proyek wajib diisi",
            placeholder: "Pilih peran proyek",
          },
        },
      },
      identity: {
        title: "Identitas",
        heading: "Identitas",
        description: "Konfigurasi domain Anda dan aktifkan Single sign-on",
      },
      project_states: {
        title: "Status proyek",
      },
      projects: {
        title: "Proyek",
        description: "Kelola status proyek, aktifkan label proyek, dan konfigurasi lainnya.",
        tabs: {
          states: "Status proyek",
          labels: "Label proyek",
        },
      },
      teamspaces: {
        title: "Ruang tim",
      },
      initiatives: {
        title: "Inisiatif",
      },
      customers: {
        title: "Pelanggan",
      },
      cancel_trial: {
        title: "Batalkan uji coba Anda terlebih dahulu.",
        description:
          "Anda memiliki uji coba aktif untuk salah satu paket berbayar kami. Silakan batalkan terlebih dahulu untuk melanjutkan.",
        dismiss: "Tutup",
        cancel: "Batalkan uji coba",
        cancel_success_title: "Uji coba dibatalkan.",
        cancel_success_message: "Anda sekarang dapat menghapus workspace.",
        cancel_error_title: "Itu tidak berhasil.",
        cancel_error_message: "Silakan coba lagi.",
      },
      applications: {
        title: "Aplikasi",
        applicationId_copied: "ID aplikasi disalin ke clipboard",
        clientId_copied: "ID klien disalin ke clipboard",
        clientSecret_copied: "Kunci rahasia klien disalin ke clipboard",
        third_party_apps: "Aplikasi pihak ketiga",
        your_apps: "Aplikasi Anda",
        connect: "Koneksi",
        connected: "Terhubung",
        install: "Pasang",
        installed: "Terpasang",
        configure: "Konfigurasi",
        app_available: "Anda telah membuat aplikasi ini tersedia untuk digunakan dengan workspace Plane",
        app_available_description: "Hubungkan workspace Plane untuk mulai menggunakannya",
        client_id_and_secret: "ID klien dan Rahasia",
        client_id_and_secret_description:
          "Salin dan simpan kunci rahasia ini di Pages. Anda tidak dapat melihat kunci ini lagi setelah Anda menutupnya.",
        client_id_and_secret_download: "Anda dapat mengunduh CSV dengan kunci dari sini.",
        application_id: "ID Aplikasi",
        client_id: "ID Klien",
        client_secret: "Rahasia Klien",
        export_as_csv: "Ekspor sebagai CSV",
        slug_already_exists: "Slug sudah ada",
        failed_to_create_application: "Gagal membuat aplikasi",
        upload_logo: "Unggah Logo",
        app_name_title: "Apa nama Anda untuk aplikasi ini",
        app_name_error: "Nama aplikasi diperlukan",
        app_short_description_title: "Berikan aplikasi ini deskripsi singkat",
        app_short_description_error: "Deskripsi aplikasi singkat diperlukan",
        app_description_title: {
          label: "Deskripsi panjang",
          placeholder: "Tulis deskripsi panjang untuk marketplace. Tekan '/' untuk perintah.",
        },
        authorization_grant_type: {
          title: "Jenis Koneksi",
          description:
            "Pilih apakah aplikasi Anda harus diinstal sekali untuk workspace atau biarkan setiap pengguna menghubungkan akun mereka sendiri",
        },
        app_description_error: "Deskripsi aplikasi diperlukan",
        app_slug_title: "Slug aplikasi",
        app_slug_error: "Slug aplikasi diperlukan",
        app_maker_title: "Pembuat aplikasi",
        app_maker_error: "Pembuat aplikasi diperlukan",
        webhook_url_title: "URL Webhook",
        webhook_url_error: "URL Webhook diperlukan",
        invalid_webhook_url_error: "URL Webhook tidak valid",
        redirect_uris_title: "Redirect URIs",
        redirect_uris_error: "Redirect URIs diperlukan",
        invalid_redirect_uris_error: "Redirect URIs tidak valid",
        redirect_uris_description:
          "Masukkan URI yang dipisahkan oleh spasi di mana aplikasi akan diarahkan setelah pengguna e.g https://example.com https://example.com/",
        authorized_javascript_origins_title: "Authorized Javascript Origins",
        authorized_javascript_origins_error: "Authorized Javascript Origins diperlukan",
        invalid_authorized_javascript_origins_error: "Authorized Javascript Origins tidak valid",
        authorized_javascript_origins_description:
          "Masukkan URI yang dipisahkan oleh spasi di mana aplikasi akan diizinkan untuk membuat permintaan e.g app.com example.com",
        create_app: "Buat aplikasi",
        update_app: "Perbarui aplikasi",
        regenerate_client_secret_description:
          "Regenerate kunci rahasia klien. Jika Anda menghasilkan kunci rahasia, Anda dapat menyalin kunci atau mengunduhnya ke file CSV setelah itu.",
        regenerate_client_secret: "Regenerate kunci rahasia klien",
        regenerate_client_secret_confirm_title: "Apakah Anda yakin ingin menghasilkan kembali kunci rahasia klien?",
        regenerate_client_secret_confirm_description:
          "Aplikasi yang menggunakan kunci rahasia ini akan berhenti bekerja. Anda perlu memperbarui kunci rahasia di aplikasi.",
        regenerate_client_secret_confirm_cancel: "Batalkan",
        regenerate_client_secret_confirm_regenerate: "Regenerate",
        read_only_access_to_workspace: "Akses baca-saja ke workspace Anda",
        write_access_to_workspace: "Akses tulis ke workspace Anda",
        read_only_access_to_user_profile: "Akses baca-saja ke profil pengguna Anda",
        write_access_to_user_profile: "Akses tulis ke profil pengguna Anda",
        connect_app_to_workspace: "Koneksikan {app} ke workspace Anda {workspace}",
        user_permissions: "Izin pengguna",
        user_permissions_description: "Izin pengguna digunakan untuk memberikan akses ke profil pengguna.",
        workspace_permissions: "Izin workspace",
        workspace_permissions_description: "Izin workspace digunakan untuk memberikan akses ke workspace.",
        with_the_permissions: "dengan izin",
        app_consent_title: "{app} meminta akses ke workspace Anda dan profil Plane.",
        choose_workspace_to_connect_app_with: "Pilih workspace untuk menghubungkan aplikasi",
        app_consent_workspace_permissions_title: "{app} ingin",
        app_consent_user_permissions_title:
          "{app} juga dapat meminta izin pengguna untuk sumber daya berikut. Izin ini akan diminta dan diotorisasi hanya oleh pengguna.",
        app_consent_accept_title: "Dengan menerima, Anda",
        app_consent_accept_1:
          "Berikan akses ke data Plane Anda di mana pun Anda dapat menggunakan aplikasi di dalam atau di luar Plane",
        app_consent_accept_2: "Setuju dengan {app}'s Privacy Policy dan Terms Of Use",
        accepting: "Menerima...",
        accept: "Menerima",
        categories: "Kategori",
        select_app_categories: "Pilih kategori aplikasi",
        categories_title: "Kategori",
        categories_error: "Kategori diperlukan",
        invalid_categories_error: "Kategori tidak valid",
        categories_description: "Pilih kategori yang paling sesuai dengan aplikasi",
        supported_plans: "Paket yang Didukung",
        supported_plans_description:
          "Pilih paket workspace yang dapat menginstal aplikasi ini. Kosongkan untuk mengizinkan semua paket.",
        select_plans: "Pilih Paket",
        privacy_policy_url_title: "URL Privacy Policy",
        privacy_policy_url_error: "URL Privacy Policy diperlukan",
        invalid_privacy_policy_url_error: "URL Privacy Policy tidak valid",
        terms_of_service_url_title: "URL Terms of Service",
        terms_of_service_url_error: "URL Terms of Service diperlukan",
        invalid_terms_of_service_url_error: "URL Terms of Service tidak valid",
        support_url_title: "URL Support",
        support_url_error: "URL Support diperlukan",
        invalid_support_url_error: "URL Support tidak valid",
        video_url_title: "URL Video",
        video_url_error: "URL Video diperlukan",
        invalid_video_url_error: "URL Video tidak valid",
        setup_url_title: "URL Setup",
        setup_url_error: "URL Setup diperlukan",
        invalid_setup_url_error: "URL Setup tidak valid",
        configuration_url_title: "URL Konfigurasi",
        configuration_url_error: "URL Konfigurasi diperlukan",
        invalid_configuration_url_error: "URL Konfigurasi tidak valid",
        contact_email_title: "Email Kontak",
        contact_email_error: "Email Kontak diperlukan",
        invalid_contact_email_error: "Email Kontak tidak valid",
        upload_attachments: "Unggah Lampiran",
        uploading_images: "Mengunggah {count} Gambar{count, plural, one {s} other {s}}",
        drop_images_here: "Letakkan gambar di sini",
        click_to_upload_images: "Klik untuk mengunggah gambar",
        invalid_file_or_exceeds_size_limit: "File tidak valid atau melebihi batas ukuran ({size} MB)",
        uploading: "Mengunggah...",
        upload_and_save: "Unggah dan Simpan",
        app_credentials_regenrated: {
          title: "Kredensial aplikasi berhasil digenerasi ulang",
          description: "Ganti client secret di semua tempat yang digunakan. Secret sebelumnya sudah tidak berlaku.",
        },
        app_created: {
          title: "Aplikasi berhasil dibuat",
          description: "Gunakan kredensial untuk menginstal aplikasi di ruang kerja Plane",
        },
        installed_apps: "Aplikasi terpasang",
        all_apps: "Semua aplikasi",
        internal_apps: "Aplikasi internal",
        website: {
          title: "Situs web",
          description: "Tautan ke situs web aplikasi Anda.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Pembuat Aplikasi",
          description: "Orang atau organisasi yang membuat aplikasi.",
        },
        setup_url: {
          label: "URL pengaturan",
          description: "Pengguna akan diarahkan ke URL ini saat mereka menginstal aplikasi.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "URL webhook",
          description:
            "Di sinilah kami akan mengirimkan event dan pembaruan webhook dari workspace tempat aplikasi Anda terpasang.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "URI pengalihan (dipisahkan spasi)",
          description: "Pengguna akan diarahkan ke jalur ini setelah mereka masuk dengan Plane.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Aplikasi ini hanya dapat diinstal setelah admin workspace menginstalnya. Hubungi admin workspace Anda untuk melanjutkan.",
        enable_app_mentions: "Aktifkan penyebutan aplikasi",
        enable_app_mentions_tooltip:
          "Saat ini diaktifkan, pengguna dapat menyebut atau menetapkan Work Items ke aplikasi ini.",
        scopes: "Lingkup",
        select_scopes: "Pilih Lingkup",
        read_access_to: "Akses baca-saja ke",
        write_access_to: "Akses tulis ke",
        global_permission_expiration:
          "Lingkup global akan segera berakhir. Gunakan lingkup granular sebagai gantinya. Misalnya, gunakan project:read alih-alih baca global.",
        selected_scopes: "{count} dipilih",
        scopes_and_permissions: "Lingkup & Izin",
        read: "Baca",
        write: "Tulis",
        scope_description: {
          projects: "Akses ke proyek dan semua entitas terkait proyek",
          wiki: "Akses ke wiki dan semua entitas terkait wiki",
          customers: "Akses ke pelanggan dan semua entitas terkait pelanggan",
          initiatives: "Akses ke inisiatif dan semua entitas terkait inisiatif",
          workspaces: "Akses ke workspace dan semua entitas terkait workspace",
          stickies: "Akses ke stickies dan semua entitas terkait sticky",
          teamspaces: "Akses ke teamspace dan semua entitas terkait teamspace",
          profile: "Akses ke informasi profil pengguna",
          agents: "Akses ke agen dan semua entitas terkait agen",
          assets: "Akses ke aset dan semua entitas terkait aset",
        },
        build_your_own_app: "Bangun aplikasi Anda sendiri",
        edit_app_details: "Edit detail aplikasi",
        internal: "Internal",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "Lihat pekerjaan Anda menjadi lebih cerdas dan lebih cepat dengan AI yang terhubung secara native ke pekerjaan dan basis pengetahuan Anda.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "Belum ada token API yang dibuat",
        description:
          "API Plane dapat digunakan untuk mengintegrasikan data Anda di Plane dengan sistem eksternal mana pun. Buat token untuk memulai.",
      },
      webhooks: {
        title: "Belum ada webhook yang ditambahkan",
        description: "Buat webhook untuk menerima pembaruan waktu nyata dan mengotomatiskan tindakan.",
      },
      exports: {
        title: "Belum ada ekspor",
        description: "Setiap kali Anda mengekspor, Anda juga akan memiliki salinan di sini untuk referensi.",
      },
      imports: {
        title: "Belum ada impor",
        description: "Temukan semua impor Anda sebelumnya di sini dan unduh.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Pekerjaan Anda",
    work: "Pekerjaan",
    details: {
      joined_on: "Bergabung pada",
      time_zone: "Zona waktu",
    },
    stats: {
      workload: "Beban kerja",
      overview: "Ikhtisar",
      created: "Item kerja yang dibuat",
      assigned: "Item kerja yang ditugaskan",
      subscribed: "Item kerja yang disubscribe",
      state_distribution: {
        title: "Item kerja berdasarkan status",
        empty: "Buat item kerja untuk melihatnya berdasarkan status dalam grafik untuk analisis yang lebih baik.",
      },
      priority_distribution: {
        title: "Item kerja berdasarkan Prioritas",
        empty: "Buat item kerja untuk melihatnya berdasarkan prioritas dalam grafik untuk analisis yang lebih baik.",
      },
      recent_activity: {
        title: "Aktivitas terkini",
        empty: "Kami tidak dapat menemukan data. Silakan lihat input Anda",
        button: "Unduh aktivitas hari ini",
        button_loading: "Mengunduh",
      },
    },
    actions: {
      profile: "Profil",
      security: "Keamanan",
      activity: "Aktivitas",
      appearance: "Tampilan",
      notifications: "Notifikasi",
      connections: "Koneksi",
    },
    tabs: {
      summary: "Ringkasan",
      assigned: "Ditugaskan",
      created: "Dibuat",
      subscribed: "Disubscribe",
      activity: "Aktivitas",
    },
    empty_state: {
      activity: {
        title: "Belum ada aktivitas",
        description:
          "Mulai dengan membuat item kerja baru! Tambahkan detail dan properti. Jelajahi lebih lanjut di Plane untuk melihat aktivitas Anda.",
      },
      assigned: {
        title: "Tidak ada item kerja yang ditugaskan kepada Anda",
        description: "Item kerja yang ditugaskan kepada Anda dapat dilacak dari sini.",
      },
      created: {
        title: "Belum ada item kerja",
        description: "Semua item kerja yang dibuat oleh Anda hadir di sini, dan lacak langsung di sini.",
      },
      subscribed: {
        title: "Belum ada item kerja",
        description: "Langganan item kerja yang Anda minati, lacak semuanya di sini.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Masukkan ID proyek",
      please_select_a_timezone: "Silakan pilih zona waktu",
      archive_project: {
        title: "Arsipkan proyek",
        description:
          "Mengarsipkan proyek akan menghapus proyek Anda dari navigasi samping meskipun Anda masih dapat mengaksesnya dari halaman proyek Anda. Anda dapat memulihkan proyek tersebut atau menghapusnya kapan saja.",
        button: "Arsipkan proyek",
      },
      delete_project: {
        title: "Hapus proyek",
        description:
          "Ketika menghapus proyek, semua data dan sumber daya di dalam proyek tersebut akan dihapus secara permanen dan tidak dapat dipulihkan.",
        button: "Hapus proyek saya",
      },
      toast: {
        success: "Proyek berhasil diperbarui",
        error: "Proyek tidak dapat diperbarui. Silakan coba lagi.",
      },
    },
    members: {
      label: "Anggota",
      project_lead: "Pemimpin proyek",
      default_assignee: "Penugas default",
      guest_super_permissions: {
        title: "Beri akses tampilan untuk semua item kerja untuk pengguna tamu:",
        sub_heading: "Ini akan memungkinkan tamu untuk memiliki akses tampilan ke semua item kerja proyek.",
      },
      invite_members: {
        title: "Undang anggota",
        sub_heading: "Undang anggota untuk bekerja di proyek Anda.",
        select_co_worker: "Pilih rekan kerja",
      },
      project_lead_description: "Pilih pimpinan proyek untuk proyek ini.",
      default_assignee_description: "Pilih penerima tugas default untuk proyek ini.",
      project_subscribers: "Pelanggan proyek",
      project_subscribers_description: "Pilih anggota yang akan menerima notifikasi untuk proyek ini.",
    },
    states: {
      describe_this_state_for_your_members: "Jelaskan status ini untuk anggota Anda.",
      empty_state: {
        title: "Tidak ada status yang tersedia untuk grup {groupKey}",
        description: "Silakan buat status baru",
      },
    },
    labels: {
      label_title: "Judul label",
      label_title_is_required: "Judul label diperlukan",
      label_max_char: "Nama label tidak boleh lebih dari 255 karakter",
      toast: {
        error: "Kesalahan saat memperbarui label",
      },
    },
    estimates: {
      label: "Perkiraan",
      title: "Aktifkan perkiraan untuk proyek saya",
      description: "Ini membantu Anda dalam mengkomunikasikan kompleksitas dan beban kerja tim.",
      no_estimate: "Tidak ada perkiraan",
      new: "Sistem perkiraan baru",
      create: {
        custom: "Kustom",
        start_from_scratch: "Mulai dari awal",
        choose_template: "Pilih template",
        choose_estimate_system: "Pilih sistem perkiraan",
        enter_estimate_point: "Masukkan perkiraan",
        step: "Langkah {step} dari {total}",
        label: "Buat perkiraan",
      },
      toasts: {
        created: {
          success: {
            title: "Perkiraan dibuat",
            message: "Perkiraan telah berhasil dibuat",
          },
          error: {
            title: "Pembuatan perkiraan gagal",
            message: "Kami tidak dapat membuat perkiraan baru, silakan coba lagi.",
          },
        },
        updated: {
          success: {
            title: "Perkiraan dimodifikasi",
            message: "Perkiraan telah diperbarui dalam proyek Anda.",
          },
          error: {
            title: "Modifikasi perkiraan gagal",
            message: "Kami tidak dapat memodifikasi perkiraan, silakan coba lagi",
          },
        },
        enabled: {
          success: {
            title: "Berhasil!",
            message: "Perkiraan telah diaktifkan.",
          },
        },
        disabled: {
          success: {
            title: "Berhasil!",
            message: "Perkiraan telah dinonaktifkan.",
          },
          error: {
            title: "Kesalahan!",
            message: "Perkiraan tidak dapat dinonaktifkan. Silakan coba lagi",
          },
        },
        reorder: {
          success: {
            title: "Estimasi diurutkan ulang",
            message: "Estimasi telah diurutkan ulang dalam proyek Anda.",
          },
          error: {
            title: "Pengurutan ulang estimasi gagal",
            message: "Kami tidak dapat mengurutkan ulang estimasi, silakan coba lagi",
          },
        },
      },
      validation: {
        min_length: "Perkiraan harus lebih besar dari 0.",
        unable_to_process: "Kami tidak dapat memproses permintaan Anda, silakan coba lagi.",
        numeric: "Perkiraan harus berupa nilai numerik.",
        character: "Perkiraan harus berupa nilai karakter.",
        empty: "Nilai perkiraan tidak boleh kosong.",
        already_exists: "Nilai perkiraan sudah ada.",
        unsaved_changes: "Anda memiliki beberapa perubahan yang belum disimpan, Harap simpan sebelum mengklik selesai",
        remove_empty:
          "Perkiraan tidak boleh kosong. Masukkan nilai di setiap bidang atau hapus yang tidak memiliki nilai.",
        fill: "Harap isi bidang estimasi ini",
        repeat: "Nilai estimasi tidak boleh diulang",
      },
      systems: {
        points: {
          label: "Poin",
          fibonacci: "Fibonacci",
          linear: "Linear",
          squares: "Kuadrat",
          custom: "Kustom",
        },
        categories: {
          label: "Kategori",
          t_shirt_sizes: "Ukuran Baju",
          easy_to_hard: "Mudah ke sulit",
          custom: "Kustom",
        },
        time: {
          label: "Waktu",
          hours: "Jam",
        },
      },
      edit: {
        title: "Edit sistem estimasi",
        add_or_update: {
          title: "Tambah, perbarui atau hapus estimasi",
          description: "Kelola sistem saat ini dengan menambah, memperbarui atau menghapus poin atau kategori.",
        },
        switch: {
          title: "Ubah tipe estimasi",
          description: "Konversi sistem poin Anda ke sistem kategori dan sebaliknya.",
        },
      },
      switch: "Alihkan sistem estimasi",
      current: "Sistem estimasi saat ini",
      select: "Pilih sistem estimasi",
    },
    automations: {
      label: "Otomatisasi",
      "auto-archive": {
        title: "Arsip otomatis item kerja yang ditutup",
        description: "Plane akan mengarsipkan secara otomatis item kerja yang telah selesai atau dibatalkan.",
        duration: "Arsip otomatis item kerja yang ditutup selama",
      },
      "auto-close": {
        title: "Tutup otomatis item kerja",
        description: "Plane akan menutup secara otomatis item kerja yang belum selesai atau dibatalkan.",
        duration: "Tutup otomatis item kerja yang tidak aktif selama",
        auto_close_status: "Status penutupan otomatis",
      },
    },
    empty_state: {
      labels: {
        title: "Belum ada label",
        description: "Buat label untuk membantu mengatur dan memfilter item kerja dalam proyek Anda.",
      },
      estimates: {
        title: "Belum ada sistem perkiraan",
        description: "Buat serangkaian perkiraan untuk mengkomunikasikan jumlah pekerjaan per item kerja.",
        primary_button: "Tambah sistem perkiraan",
      },
      integrations: {
        title: "Tidak ada integrasi yang dikonfigurasi",
        description: "Konfigurasikan GitHub dan integrasi lainnya untuk menyinkronkan item kerja proyek Anda.",
      },
    },
    initiatives: {
      heading: "Inisiatif",
      sub_heading: "Buka level organisasi tertinggi untuk semua pekerjaan Anda di Plane.",
      title: "Aktifkan Inisiatif",
      description: "Tetapkan tujuan yang lebih besar untuk memantau kemajuan",
      toast: {
        updating: "Memperbarui fitur inisiatif",
        enable_success: "Fitur inisiatif berhasil diaktifkan.",
        disable_success: "Fitur inisiatif berhasil dinonaktifkan.",
        error: "Gagal memperbarui fitur inisiatif!",
      },
    },
    customers: {
      heading: "Pelanggan",
      settings_heading: "Kelola pekerjaan berdasarkan apa yang penting bagi pelanggan Anda.",
      settings_sub_heading:
        "Bawa permintaan pelanggan ke item kerja, tetapkan prioritas berdasarkan permintaan, dan gabungkan status item kerja ke dalam catatan pelanggan. Segera, Anda akan berintegrasi dengan CRM atau alat Dukungan Anda untuk manajemen pekerjaan yang lebih baik berdasarkan atribut pelanggan.",
    },
    epics: {
      properties: {
        title: "Properti",
        description: "Tambahkan properti kustom ke epic Anda.",
      },
      disabled: "Dinonaktifkan",
    },
    cycles: {
      auto_schedule: {
        heading: "Penjadwalan otomatis siklus",
        description: "Jaga agar siklus tetap berjalan tanpa pengaturan manual.",
        tooltip: "Buat siklus baru secara otomatis berdasarkan jadwal yang Anda pilih.",
        edit_button: "Edit",
        form: {
          cycle_title: {
            label: "Judul siklus",
            placeholder: "Judul",
            tooltip: "Judul akan ditambahkan dengan nomor untuk siklus berikutnya. Misalnya: Desain - 1/2/3",
            validation: {
              required: "Judul siklus wajib diisi",
              max_length: "Judul tidak boleh melebihi 255 karakter",
            },
          },
          cycle_duration: {
            label: "Durasi siklus",
            unit: "Minggu",
            validation: {
              required: "Durasi siklus wajib diisi",
              min: "Durasi siklus harus minimal 1 minggu",
              max: "Durasi siklus tidak boleh melebihi 30 minggu",
              positive: "Durasi siklus harus positif",
            },
          },
          cooldown_period: {
            label: "Periode pendinginan",
            unit: "hari",
            tooltip: "Jeda antara siklus sebelum siklus berikutnya dimulai.",
            validation: {
              required: "Periode pendinginan wajib diisi",
              negative: "Periode pendinginan tidak boleh negatif",
            },
          },
          start_date: {
            label: "Hari mulai siklus",
            validation: {
              required: "Tanggal mulai wajib diisi",
              past: "Tanggal mulai tidak boleh di masa lalu",
            },
          },
          number_of_cycles: {
            label: "Jumlah siklus mendatang",
            validation: {
              required: "Jumlah siklus wajib diisi",
              min: "Setidaknya 1 siklus diperlukan",
              max: "Tidak dapat menjadwalkan lebih dari 3 siklus",
            },
          },
          auto_rollover: {
            label: "Pemindahan otomatis item pekerjaan",
            tooltip:
              "Pada hari siklus selesai, pindahkan semua item pekerjaan yang belum selesai ke siklus berikutnya.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Mengaktifkan penjadwalan otomatis siklus",
            loading_disable: "Menonaktifkan penjadwalan otomatis siklus",
            success: {
              title: "Berhasil!",
              message: "Penjadwalan otomatis siklus berhasil diaktifkan.",
            },
            error: {
              title: "Kesalahan!",
              message: "Gagal mengaktifkan penjadwalan otomatis siklus.",
            },
          },
          save: {
            loading: "Menyimpan konfigurasi penjadwalan otomatis siklus",
            success: {
              title: "Berhasil!",
              message_create: "Konfigurasi penjadwalan otomatis siklus berhasil disimpan.",
              message_update: "Konfigurasi penjadwalan otomatis siklus berhasil diperbarui.",
            },
            error: {
              title: "Kesalahan!",
              message_create: "Gagal menyimpan konfigurasi penjadwalan otomatis siklus.",
              message_update: "Gagal memperbarui konfigurasi penjadwalan otomatis siklus.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Siklus",
        short_title: "Siklus",
        description:
          "Jadwalkan pekerjaan dalam periode fleksibel yang menyesuaikan dengan ritme dan tempo unik proyek ini.",
        toggle_title: "Aktifkan siklus",
        toggle_description: "Rencanakan pekerjaan dalam jangka waktu yang terfokus.",
      },
      modules: {
        title: "Modul",
        short_title: "Modul",
        description: "Atur pekerjaan menjadi sub-proyek dengan pemimpin dan penerima tugas khusus.",
        toggle_title: "Aktifkan modul",
        toggle_description: "Anggota proyek akan dapat membuat dan mengedit modul.",
      },
      views: {
        title: "Tampilan",
        short_title: "Tampilan",
        description: "Simpan pengurutan, filter, dan opsi tampilan kustom atau bagikan dengan tim Anda.",
        toggle_title: "Aktifkan tampilan",
        toggle_description: "Anggota proyek akan dapat membuat dan mengedit tampilan.",
      },
      pages: {
        title: "Halaman",
        short_title: "Halaman",
        description: "Buat dan edit konten bebas: catatan, dokumen, apa saja.",
        toggle_title: "Aktifkan halaman",
        toggle_description: "Anggota proyek akan dapat membuat dan mengedit halaman.",
      },
      intake: {
        intake_responsibility: "Tanggung jawab penerimaan",
        intake_sources: "Sumber penerimaan",
        title: "Penerimaan",
        short_title: "Penerimaan",
        description: "Biarkan non-anggota berbagi bug, umpan balik, dan saran; tanpa mengganggu alur kerja Anda.",
        toggle_title: "Aktifkan penerimaan",
        toggle_description: "Izinkan anggota proyek membuat permintaan penerimaan dalam aplikasi.",
        toggle_tooltip_on: "Minta Admin Proyek untuk mengaktifkan ini.",
        toggle_tooltip_off: "Minta Admin Proyek untuk menonaktifkan ini.",
        notify_assignee: {
          title: "Beritahu yang ditugaskan",
          description:
            "Untuk permintaan penerimaan baru, yang ditugaskan secara default akan diberi peringatan melalui notifikasi",
        },
        in_app: {
          title: "Dalam aplikasi",
          description:
            "Dapatkan item kerja baru dari Anggota dan Tamu di ruang kerja Anda tanpa mengganggu item kerja yang ada.",
        },
        email: {
          title: "Email",
          description: "Kumpulkan item kerja baru dari siapa saja yang mengirim email ke alamat email Plane.",
          fieldName: "ID Email",
        },
        form: {
          title: "Formulir",
          description:
            "Izinkan orang di luar ruang kerja Anda membuat item kerja baru potensial melalui formulir khusus dan aman.",
          fieldName: "URL formulir default",
          create_forms: "Buat Formulir menggunakan jenis item kerja",
          manage_forms: "Kelola formulir",
          manage_forms_tooltip: "Minta Admin Ruang Kerja untuk mengelola ini.",
          create_form: "Buat formulir",
          edit_form: "Edit detail formulir",
          form_title: "Judul formulir",
          form_title_required: "Judul formulir wajib diisi",
          work_item_type: "Jenis item kerja",
          remove_property: "Hapus properti",
          select_properties: "Pilih properti",
          search_placeholder: "Cari properti",
          toasts: {
            success_create: "Formulir penerimaan berhasil dibuat",
            success_update: "Formulir penerimaan berhasil diperbarui",
            error_create: "Gagal membuat formulir penerimaan",
            error_update: "Gagal memperbarui formulir penerimaan",
          },
        },
        toasts: {
          set: {
            loading: "Mengatur yang ditugaskan...",
            success: {
              title: "Berhasil!",
              message: "Yang ditugaskan berhasil diatur.",
            },
            error: {
              title: "Kesalahan!",
              message: "Terjadi kesalahan saat mengatur yang ditugaskan. Silakan coba lagi.",
            },
          },
        },
      },
      time_tracking: {
        title: "Pelacakan waktu",
        short_title: "Pelacakan waktu",
        description: "Catat waktu yang dihabiskan untuk item kerja dan proyek.",
        toggle_title: "Aktifkan pelacakan waktu",
        toggle_description: "Anggota proyek akan dapat mencatat waktu yang dikerjakan.",
      },
      milestones: {
        title: "Tonggak",
        short_title: "Tonggak",
        description: "Tonggak menyediakan lapisan untuk menyelaraskan item kerja menuju tanggal penyelesaian bersama.",
        toggle_title: "Aktifkan tonggak",
        toggle_description: "Organisir item kerja berdasarkan tenggat tonggak.",
      },
      toasts: {
        loading: "Memperbarui fitur proyek...",
        success: "Fitur proyek berhasil diperbarui.",
        error: "Terjadi kesalahan saat memperbarui fitur proyek. Silakan coba lagi.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Tambah siklus",
    more_details: "Detail lebih lanjut",
    cycle: "Siklus",
    update_cycle: "Perbarui siklus",
    create_cycle: "Buat siklus",
    no_matching_cycles: "Tidak ada siklus yang cocok",
    remove_filters_to_see_all_cycles: "Hapus filter untuk melihat semua siklus",
    remove_search_criteria_to_see_all_cycles: "Hapus kriteria pencarian untuk melihat semua siklus",
    only_completed_cycles_can_be_archived: "Hanya siklus yang diselesaikan yang dapat diarsipkan",
    active_cycle: {
      label: "Siklus aktif",
      progress: "Kemajuan",
      chart: "Grafik burndown",
      priority_issue: "Item kerja prioritas",
      assignees: "Penugasan",
      issue_burndown: "Burndown item kerja",
      ideal: "Ideal",
      current: "Sekarang",
      labels: "Label",
    },
    upcoming_cycle: {
      label: "Siklus mendatang",
    },
    completed_cycle: {
      label: "Siklus selesai",
    },
    status: {
      days_left: "Hari tersisa",
      completed: "Selesai",
      yet_to_start: "Belum dimulai",
      in_progress: "Sedang berlangsung",
      draft: "Draf",
    },
    action: {
      restore: {
        title: "Pulihkan siklus",
        success: {
          title: "Siklus dipulihkan",
          description: "Siklus telah dipulihkan.",
        },
        failed: {
          title: "Pemulihan siklus gagal",
          description: "Siklus tidak dapat dipulihkan. Silakan coba lagi.",
        },
      },
      favorite: {
        loading: "Menambahkan siklus ke favorit",
        success: {
          description: "Siklus ditambahkan ke favorit.",
          title: "Sukses!",
        },
        failed: {
          description: "Gagal menambahkan siklus ke favorit. Silakan coba lagi.",
          title: "Kesalahan!",
        },
      },
      unfavorite: {
        loading: "Menghapus siklus dari favorit",
        success: {
          description: "Siklus dihapus dari favorit.",
          title: "Sukses!",
        },
        failed: {
          description: "Gagal menghapus siklus dari favorit. Silakan coba lagi.",
          title: "Kesalahan!",
        },
      },
      update: {
        loading: "Memperbarui siklus",
        success: {
          description: "Siklus berhasil diperbarui.",
          title: "Sukses!",
        },
        failed: {
          description: "Kesalahan saat memperbarui siklus. Silakan coba lagi.",
          title: "Kesalahan!",
        },
        error: {
          already_exists:
            "Anda sudah memiliki siklus pada tanggal yang diberikan, jika Anda ingin membuat siklus draf, Anda dapat melakukannya dengan menghapus kedua tanggal tersebut.",
        },
      },
    },
    empty_state: {
      general: {
        title: "Kelompokkan dan bagi pekerjaan Anda dalam Siklus.",
        description:
          "Pecah pekerjaan menjadi bagian yang dibatasi waktu, kerjakan mundur dari tenggat waktu proyek Anda untuk menetapkan tanggal, dan buat kemajuan nyata sebagai tim.",
        primary_button: {
          text: "Tetapkan siklus pertama Anda",
          comic: {
            title: "Siklus adalah batas waktu berulang.",
            description:
              "Sprint, iterasi, dan istilah lain apa pun yang Anda gunakan untuk pelacakan pekerjaan mingguan atau dua mingguan adalah siklus.",
          },
        },
      },
      no_issues: {
        title: "Tidak ada item kerja yang ditambahkan ke siklus",
        description: "Tambahkan atau buat item kerja yang ingin Anda batasi waktu dan kirim dalam siklus ini",
        primary_button: {
          text: "Buat item kerja baru",
        },
        secondary_button: {
          text: "Tambah item kerja yang ada",
        },
      },
      completed_no_issues: {
        title: "Tidak ada item kerja dalam siklus",
        description:
          "Tidak ada item kerja dalam siklus. Item kerja baik ditransfer atau disembunyikan. Untuk melihat item kerja yang disembunyikan jika ada, perbarui properti tampilan Anda sesuai.",
      },
      active: {
        title: "Tidak ada siklus aktif",
        description:
          "Siklus aktif mencakup periode apa pun yang mencakup tanggal hari ini dalam rentangnya. Temukan kemajuan dan detail siklus aktif di sini.",
      },
      archived: {
        title: "Belum ada siklus yang diarsipkan",
        description:
          "Untuk membersihkan proyek Anda, arsipkan siklus yang telah diselesaikan. Temukan di sini setelah diarsipkan.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Buat item kerja dan tugaskan kepada seseorang, bahkan kepada diri Anda sendiri",
        description:
          "Anggap item kerja sebagai pekerjaan, tugas, atau JTBD. Yang kami suka. Item kerja dan sub-item kerjanya biasanya merupakan tindakan berbasis waktu yang ditugaskan kepada anggota tim Anda. Tim Anda membuat, menetapkan, dan menyelesaikan item kerja untuk memindahkan proyek Anda menuju tujuannya.",
        primary_button: {
          text: "Buat item kerja pertama Anda",
          comic: {
            title: "Item kerja adalah blok bangunan di Plane.",
            description:
              "Mendesain ulang UI Plane, Mengganti merek perusahaan, atau Meluncurkan sistem injeksi bahan bakar baru adalah contoh item kerja yang kemungkinan besar memiliki sub-item kerja.",
          },
        },
      },
      no_archived_issues: {
        title: "Belum ada item kerja yang diarsipkan",
        description:
          "Secara manual atau melalui otomatisasi, Anda dapat mengarsipkan item kerja yang telah selesai atau dibatalkan. Temukan di sini setelah diarsipkan.",
        primary_button: {
          text: "Tetapkan otomatisasi",
        },
      },
      issues_empty_filter: {
        title: "Tidak ada item kerja ditemukan yang cocok dengan filter yang diterapkan",
        secondary_button: {
          text: "Bersihkan semua filter",
        },
      },
    },
  },
  project_module: {
    add_module: "Tambah Modul",
    update_module: "Perbarui Modul",
    create_module: "Buat Modul",
    archive_module: "Arsipkan Modul",
    restore_module: "Pulihkan Modul",
    delete_module: "Hapus modul",
    empty_state: {
      general: {
        title: "Peta tonggak proyek Anda ke Modul dan lacak pekerjaan terakumulasi dengan mudah.",
        description:
          "Sekelompok item kerja yang tergolong dalam induk yang logis dan hierarkis membentuk satu modul. Anggap saja mereka sebagai cara untuk melacak pekerjaan berdasarkan tonggak proyek. Mereka memiliki periode dan tenggat waktu sendiri serta analitik untuk membantu Anda melihat seberapa dekat atau jauh Anda dari tonggak tersebut.",
        primary_button: {
          text: "Buat modul pertama Anda",
          comic: {
            title: "Modul membantu mengelompokkan pekerjaan menurut hierarki.",
            description: "Modul kereta, modul sasis, dan modul gudang adalah contoh bagus dari pengelompokan ini.",
          },
        },
      },
      no_issues: {
        title: "Tidak ada item kerja dalam modul",
        description: "Buat atau tambahkan item kerja yang ingin Anda capai sebagai bagian dari modul ini",
        primary_button: {
          text: "Buat item kerja baru",
        },
        secondary_button: {
          text: "Tambahkan item kerja yang ada",
        },
      },
      archived: {
        title: "Belum ada Modul yang diarsipkan",
        description:
          "Untuk membersihkan proyek Anda, arsipkan modul yang telah selesai atau dibatalkan. Temukan di sini setelah diarsipkan.",
      },
      sidebar: {
        in_active: "Modul ini belum aktif.",
        invalid_date: "Tanggal tidak valid. Silakan masukkan tanggal yang valid.",
      },
    },
    quick_actions: {
      archive_module: "Arsipkan modul",
      archive_module_description: `Hanya modul yang telah diselesaikan atau dibatalkan
 yang dapat diarsipkan.`,
      delete_module: "Hapus modul",
    },
    toast: {
      copy: {
        success: "Tautan modul disalin ke clipboard",
      },
      delete: {
        success: "Modul berhasil dihapus",
        error: "Gagal menghapus modul",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Simpan tampilan yang difilter untuk proyek Anda. Buat sebanyak yang Anda perlukan",
        description:
          "Tampilan adalah sekumpulan filter yang disimpan yang Anda gunakan secara sering atau ingin akses mudah. Semua rekan Anda dalam proyek dapat melihat tampilan semua orang dan memilih yang paling sesuai dengan kebutuhan mereka.",
        primary_button: {
          text: "Buat tampilan pertama Anda",
          comic: {
            title: "Tampilan bekerja berdasarkan properti item kerja.",
            description:
              "Anda dapat membuat tampilan dari sini dengan sebanyak mungkin properti sebagai filter yang Anda anggap sesuai.",
          },
        },
      },
      filter: {
        title: "Tidak ada tampilan yang cocok",
        description: `Tidak ada tampilan yang cocok dengan kriteria pencarian.
 Buat tampilan baru sebagai gantinya.`,
      },
    },
    delete_view: {
      title: "Apakah Anda yakin ingin menghapus tampilan ini?",
      content:
        "Jika Anda mengonfirmasi, semua opsi pengurutan, filter, dan tampilan + tata letak yang telah Anda pilih untuk tampilan ini akan dihapus secara permanen tanpa cara untuk memulihkannya.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "Tulis catatan, dokumen, atau seluruh basis pengetahuan. Dapatkan Galileo, asisten AI Plane, untuk membantu Anda memulai",
        description:
          "Halaman adalah ruang pemikiran di Plane. Catat notul rapat, format dengan mudah, sertakan item kerja, tata letak menggunakan perpustakaan komponen, dan simpan semua di dalam konteks proyek Anda. Untuk menyelesaikan dokumen dengan cepat, panggil Galileo, AI Plane, dengan pintasan atau dengan mengklik tombol.",
        primary_button: {
          text: "Buat halaman pertama Anda",
        },
      },
      private: {
        title: "Belum ada halaman pribadi",
        description:
          "Simpan pemikiran pribadi Anda di sini. Ketika Anda sudah siap untuk berbagi, tim hanya seklik jarak.",
        primary_button: {
          text: "Buat halaman pertama Anda",
        },
      },
      public: {
        title: "Belum ada halaman publik",
        description: "Lihat halaman yang dibagikan dengan semua orang di proyek Anda tepat di sini.",
        primary_button: {
          text: "Buat halaman pertama Anda",
        },
      },
      archived: {
        title: "Belum ada halaman yang diarsipkan",
        description: "Arsipkan halaman yang tidak ada dalam radar Anda. Akses di sini saat diperlukan.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Tidak ada hasil ditemukan",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Tidak ada item kerja yang cocok ditemukan",
      },
      no_issues: {
        title: "Tidak ada item kerja ditemukan",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Belum ada komentar",
        description: "Komentar dapat digunakan sebagai ruang diskusi dan tindak lanjut untuk item kerja",
      },
    },
  },
  notification: {
    label: "Kotak Masuk",
    page_label: "{workspace} - Kotak Masuk",
    options: {
      mark_all_as_read: "Tandai semua sebagai dibaca",
      mark_read: "Tandai sebagai dibaca",
      mark_unread: "Tandai sebagai tidak dibaca",
      refresh: "Segarkan",
      filters: "Filter Kotak Masuk",
      show_unread: "Tampilkan yang belum dibaca",
      show_snoozed: "Tampilkan yang ditunda",
      show_archived: "Tampilkan yang diarsipkan",
      mark_archive: "Arsipkan",
      mark_unarchive: "Hapus arsip",
      mark_snooze: "Tunda",
      mark_unsnooze: "Hapus tunda",
    },
    toasts: {
      read: "Notifikasi ditandai sebagai dibaca",
      unread: "Notifikasi ditandai sebagai tidak dibaca",
      archived: "Notifikasi ditandai sebagai diarsipkan",
      unarchived: "Notifikasi ditandai sebagai dihapus arsip",
      snoozed: "Notifikasi ditunda",
      unsnoozed: "Notifikasi dihapus tunda",
    },
    empty_state: {
      detail: {
        title: "Pilih untuk melihat detail.",
      },
      all: {
        title: "Tidak ada item kerja yang ditugaskan",
        description: "Pembaruan untuk item kerja yang ditugaskan kepada Anda dapat dilihat di sini",
      },
      mentions: {
        title: "Tidak ada item kerja yang ditugaskan",
        description: "Pembaruan untuk item kerja yang ditugaskan kepada Anda dapat dilihat di sini",
      },
    },
    tabs: {
      all: "Semua",
      mentions: "Sebut",
    },
    filter: {
      assigned: "Ditugaskan untuk saya",
      created: "Dibuat oleh saya",
      subscribed: "Disubscribe oleh saya",
    },
    snooze: {
      "1_day": "1 hari",
      "3_days": "3 hari",
      "5_days": "5 hari",
      "1_week": "1 minggu",
      "2_weeks": "2 minggu",
      custom: "Kustom",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "Tambahkan item kerja ke siklus untuk melihat kemajuannya",
      },
      chart: {
        title: "Tambahkan item kerja ke siklus untuk melihat grafik burndown.",
      },
      priority_issue: {
        title: "Amati item kerja prioritas yang ditangani dalam siklus pada pandangan pertama.",
      },
      assignee: {
        title: "Tambahkan penugasan ke item kerja untuk melihat pembagian kerja berdasarkan penugasan.",
      },
      label: {
        title: "Tambahkan label ke item kerja untuk melihat pembagian kerja berdasarkan label.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Intake tidak diaktifkan untuk proyek ini.",
        description:
          "Intake membantu Anda mengelola permintaan yang masuk ke proyek Anda dan menambahkannya sebagai item kerja dalam alur kerja Anda. Aktifkan intake dari pengaturan proyek untuk mengelola permintaan.",
        primary_button: {
          text: "Kelola fitur",
        },
      },
      cycle: {
        title: "Siklus tidak diaktifkan untuk proyek ini.",
        description:
          "Pecah pekerjaan menjadi bagian yang dibatasi waktu, kerjakan mundur dari tenggat waktu proyek Anda untuk menetapkan tanggal, dan buat kemajuan nyata sebagai tim. Aktifkan fitur siklus untuk proyek Anda agar dapat mulai menggunakannya.",
        primary_button: {
          text: "Kelola fitur",
        },
      },
      module: {
        title: "Modul tidak diaktifkan untuk proyek ini.",
        description:
          "Modul adalah blok bangunan dari proyek Anda. Aktifkan modul dari pengaturan proyek untuk mulai menggunakannya.",
        primary_button: {
          text: "Kelola fitur",
        },
      },
      page: {
        title: "Halaman tidak diaktifkan untuk proyek ini.",
        description:
          "Halaman adalah blok bangunan dari proyek Anda. Aktifkan halaman dari pengaturan proyek untuk mulai menggunakannya.",
        primary_button: {
          text: "Kelola fitur",
        },
      },
      view: {
        title: "Tampilan tidak diaktifkan untuk proyek ini.",
        description:
          "Tampilan adalah blok bangunan dari proyek Anda. Aktifkan tampilan dari pengaturan proyek untuk mulai menggunakannya.",
        primary_button: {
          text: "Kelola fitur",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Draf item kerja",
    empty_state: {
      title: "Item kerja setengah jadi, dan segera, komentar akan muncul di sini.",
      description:
        "Untuk mencoba ini, mulai dengan menambahkan item kerja dan tinggalkan di tengah jalan atau buat draf pertama Anda di bawah ini. 😉",
      primary_button: {
        text: "Buat draf pertama Anda",
      },
    },
    delete_modal: {
      title: "Hapus draf",
      description: "Apakah Anda yakin ingin menghapus draf ini? Tindakan ini tidak dapat dibatalkan.",
    },
    toasts: {
      created: {
        success: "Draf berhasil dibuat",
        error: "Item kerja tidak dapat dibuat. Silakan coba lagi.",
      },
      deleted: {
        success: "Draf berhasil dihapus",
      },
    },
  },
  stickies: {
    title: "Catatan tempel Anda",
    placeholder: "klik untuk mengetik di sini",
    all: "Semua catatan tempel",
    "no-data":
      "Tuliskan sebuah ide, tangkap momen aha, atau catat pemikiran brilian. Tambahkan catatan tempel untuk memulai.",
    add: "Tambah catatan tempel",
    search_placeholder: "Cari berdasarkan judul",
    delete: "Hapus catatan tempel",
    delete_confirmation: "Apakah Anda yakin ingin menghapus catatan tempel ini?",
    empty_state: {
      simple:
        "Tuliskan sebuah ide, tangkap momen aha, atau catat pemikiran brilian. Tambahkan catatan tempel untuk memulai.",
      general: {
        title: "Catatan tempel adalah catatan cepat dan tugas yang Anda buat secara langsung.",
        description:
          "Tangkap pemikiran dan ide Anda dengan mudah dengan membuat catatan tempel yang dapat Anda akses kapan saja dan dari mana saja.",
        primary_button: {
          text: "Tambah catatan tempel",
        },
      },
      search: {
        title: "Itu tidak cocok dengan salah satu catatan tempel Anda.",
        description: `Coba istilah yang berbeda atau beri tahu kami
jika Anda yakin pencarian Anda benar. `,
        primary_button: {
          text: "Tambah catatan tempel",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Nama catatan tempel tidak boleh lebih dari 100 karakter.",
        already_exists: "Sudah ada catatan tempel dengan tidak ada deskripsi",
      },
      created: {
        title: "Catatan tempel berhasil dibuat",
        message: "Catatan tempel telah berhasil dibuat",
      },
      not_created: {
        title: "Catatan tempel tidak dibuat",
        message: "Catatan tempel tidak dapat dibuat",
      },
      updated: {
        title: "Catatan tempel diperbarui",
        message: "Catatan tempel telah berhasil diperbarui",
      },
      not_updated: {
        title: "Catatan tempel tidak diperbarui",
        message: "Catatan tempel tidak dapat diperbarui",
      },
      removed: {
        title: "Catatan tempel dihapus",
        message: "Catatan tempel telah berhasil dihapus",
      },
      not_removed: {
        title: "Catatan tempel tidak dihapus",
        message: "Catatan tempel tidak dapat dihapus",
      },
    },
  },
  role_details: {
    guest: {
      title: "Tamu",
      description: "Anggota eksternal organisasi dapat diundang sebagai tamu.",
    },
    member: {
      title: "Anggota",
      description:
        "Kemampuan untuk membaca, menulis, mengedit, dan menghapus entitas di dalam proyek, siklus, dan modul",
    },
    admin: {
      title: "Admin",
      description: "Semua izin diatur ke true dalam ruang kerja.",
    },
  },
  user_roles: {
    product_or_project_manager: "Manajer Produk / Proyek",
    development_or_engineering: "Pengembangan / Rekayasa",
    founder_or_executive: "Pendiri / Eksekutif",
    freelancer_or_consultant: "Freelancer / Konsultan",
    marketing_or_growth: "Pemasaran / Pertumbuhan",
    sales_or_business_development: "Penjualan / Pengembangan Bisnis",
    support_or_operations: "Dukungan / Operasi",
    student_or_professor: "Mahasiswa / Profesor",
    human_resources: "Sumber Daya Manusia",
    other: "Lainnya",
  },
  importer: {
    github: {
      title: "Github",
      description: "Impor item kerja dari repositori GitHub dan sinkronkan.",
    },
    jira: {
      title: "Jira",
      description: "Impor item kerja dan epik dari proyek dan epik Jira.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "Ekspor item kerja ke file CSV.",
      short_description: "Ekspor sebagai csv",
    },
    excel: {
      title: "Excel",
      description: "Ekspor item kerja ke file Excel.",
      short_description: "Ekspor sebagai excel",
    },
    xlsx: {
      title: "Excel",
      description: "Ekspor item kerja ke file Excel.",
      short_description: "Ekspor sebagai excel",
    },
    json: {
      title: "JSON",
      description: "Ekspor item kerja ke file JSON.",
      short_description: "Ekspor sebagai json",
    },
  },
  default_global_view: {
    all_issues: "Semua item kerja",
    assigned: "Ditugaskan",
    created: "Dibuat",
    subscribed: "Disubscribe",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Preferensi sistem",
      },
      light: {
        label: "Cerah",
      },
      dark: {
        label: "Gelap",
      },
      light_contrast: {
        label: "Cerah kontras tinggi",
      },
      dark_contrast: {
        label: "Gelap kontras tinggi",
      },
      custom: {
        label: "Tema kustom",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Backlog",
      planned: "Direncanakan",
      in_progress: "Dalam Proses",
      paused: "Dijeda",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    },
    layout: {
      list: "Tata letak daftar",
      board: "Tata letak galeri",
      timeline: "Tata letak garis waktu",
    },
    order_by: {
      name: "Nama",
      progress: "Kemajuan",
      issues: "Jumlah item kerja",
      due_date: "Tanggal jatuh tempo",
      created_at: "Tanggal dibuat",
      manual: "Manual",
    },
  },
  cycle: {
    label: "{count, plural, one {Siklus} other {Siklus}}",
    no_cycle: "Tidak ada siklus",
  },
  module: {
    label: "{count, plural, one {Modul} other {Modul}}",
    no_module: "Tidak ada modul",
  },
  description_versions: {
    last_edited_by: "Terakhir disunting oleh",
    previously_edited_by: "Sebelumnya disunting oleh",
    edited_by: "Disunting oleh",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane tidak berhasil dimulai. Ini bisa karena satu atau lebih layanan Plane gagal untuk dimulai.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Pilih View Logs dari setup.sh dan log Docker untuk memastikan.",
  },
  no_of: "Jumlah {entity}",
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Garis Besar",
        empty_state: {
          title: "Judul hilang",
          description: "Mari tambahkan beberapa judul di halaman ini untuk melihatnya di sini.",
        },
      },
      info: {
        label: "Info",
        document_info: {
          words: "Kata",
          characters: "Karakter",
          paragraphs: "Paragraf",
          read_time: "Waktu baca",
        },
        actors_info: {
          edited_by: "Disunting oleh",
          created_by: "Dibuat oleh",
        },
        version_history: {
          label: "Riwayat versi",
          current_version: "Versi saat ini",
          highlight_changes: "Sorot perubahan",
        },
      },
      assets: {
        label: "Aset",
        download_button: "Unduh",
        empty_state: {
          title: "Gambar hilang",
          description: "Tambahkan gambar untuk melihatnya di sini.",
        },
      },
    },
    open_button: "Buka panel navigasi",
    close_button: "Tutup panel navigasi",
    outline_floating_button: "Buka garis besar",
  },
  workspace_dashboards: "Dasbor",
  pi_chat: "Obrolan AI",
  in_app: "Dalam Aplikasi",
  forms: "Formulir",
  choose_workspace_for_integration: "Pilih ruang kerja untuk menghubungkan aplikasi ini",
  integrations_description:
    "Aplikasi yang bekerja dengan Plane harus menghubungkan ke ruang kerja di mana Anda adalah admin.",
  create_a_new_workspace: "Buat ruang kerja baru",
  learn_more_about_workspaces: "Pelajari lebih lanjut tentang ruang kerja",
  no_workspaces_to_connect: "Tidak ada ruang kerja untuk menghubungkan",
  no_workspaces_to_connect_description:
    "Anda perlu membuat ruang kerja untuk dapat menghubungkan integrasi dan template",
  updates: {
    add_update: "Tambahkan update",
    add_update_placeholder: "Tambahkan update Anda di sini",
    empty: {
      title: "Belum ada update",
      description: "Anda dapat melihat update di sini.",
    },
    delete: {
      title: "Hapus update",
      confirmation: "Apakah Anda yakin ingin menghapus update ini? Aksi ini tidak dapat dibatalkan.",
      success: {
        title: "Update berhasil dihapus",
        message: "Update berhasil dihapus.",
      },
      error: {
        title: "Update tidak berhasil dihapus",
        message: "Update tidak berhasil dihapus.",
      },
    },
    update: {
      success: {
        title: "Update berhasil diperbarui",
        message: "Update berhasil diperbarui.",
      },
      error: {
        title: "Update tidak berhasil diperbarui",
        message: "Update tidak berhasil diperbarui.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reaksi berhasil dibuat",
          message: "Reaksi berhasil dibuat.",
        },
        error: {
          title: "Reaksi tidak berhasil dibuat",
          message: "Reaksi tidak berhasil dibuat.",
        },
      },
      remove: {
        success: {
          title: "Reaksi berhasil dihapus",
          message: "Reaksi berhasil dihapus.",
        },
        error: {
          title: "Reaksi tidak berhasil dihapus",
          message: "Reaksi tidak berhasil dihapus.",
        },
      },
    },
    progress: {
      title: "Progres",
      since_last_update: "Sejak update terakhir",
      comments: "{count, plural, one{# komentar} other{# komentar}}",
    },
    create: {
      success: {
        title: "Update berhasil dibuat",
        message: "Update berhasil dibuat.",
      },
      error: {
        title: "Update tidak berhasil dibuat",
        message: "Update tidak berhasil dibuat.",
      },
    },
  },
  teamspaces: {
    label: "Ruang Tim",
    empty_state: {
      general: {
        title: "Ruang Tim membuka organisasi dan pelacakan yang lebih baik di Plane.",
        description:
          "Buat permukaan khusus untuk setiap tim dunia nyata, terpisah dari semua permukaan kerja lain di Plane, dan sesuaikan dengan cara kerja tim Anda.",
        primary_button: {
          text: "Buat ruang tim baru",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Anda belum menautkan ruang tim apa pun.",
          description: "Pemilik ruang tim dan proyek dapat mengelola akses ke proyek.",
        },
      },
      primary_button: {
        text: "Tautkan ruang tim",
      },
      secondary_button: {
        text: "Pelajari lebih lanjut",
      },
      table: {
        columns: {
          teamspaceName: "Nama ruang tim",
          members: "Anggota",
          accountType: "Tipe akun",
        },
        actions: {
          remove: {
            button: {
              text: "Hapus ruang tim",
            },
            confirm: {
              title: "Hapus {teamspaceName} dari {projectName}",
              description:
                "Saat Anda menghapus ruang tim ini dari proyek tertaut, anggota di sini akan kehilangan akses ke proyek tertaut.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Tidak ada ruang tim yang cocok ditemukan",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Anda menautkan ruang tim ke proyek ini.} other {Anda menautkan # ruang tim ke proyek ini.}}",
            description:
              "{additionalCount, plural, =0 {Ruang tim {firstTeamspaceName} sekarang tertaut ke proyek ini.} other {Ruang tim {firstTeamspaceName} dan {additionalCount} lainnya sekarang tertaut ke proyek ini.}}",
          },
          error: {
            title: "Itu tidak berhasil.",
            description: "Coba lagi atau muat ulang halaman ini sebelum mencoba lagi.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Anda menghapus ruang tim itu dari proyek ini.",
            description: "Ruang tim {teamspaceName} telah dihapus dari {projectName}.",
          },
          error: {
            title: "Itu tidak berhasil.",
            description: "Coba lagi atau muat ulang halaman ini sebelum mencoba lagi.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Cari ruang tim",
        info: {
          title: "Menambahkan ruang tim memberikan akses ke proyek ini untuk semua anggota ruang tim.",
          link: "Pelajari lebih lanjut",
        },
        empty_state: {
          no_teamspaces: {
            title: "Anda tidak memiliki ruang tim untuk ditautkan.",
            description:
              "Anda tidak berada dalam ruang tim yang dapat Anda tautkan atau Anda telah menautkan semua ruang tim yang tersedia.",
          },
          no_results: {
            title: "Itu tidak cocok dengan ruang tim Anda.",
            description: "Coba istilah lain atau pastikan Anda memiliki ruang tim untuk ditautkan.",
          },
        },
        primary_button: {
          text: "Tautkan ruang tim yang dipilih",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Buat item kerja khusus tim.",
        description:
          "Item kerja yang ditetapkan kepada anggota tim ini di proyek tertaut mana pun akan otomatis muncul di sini. Jika Anda berharap melihat beberapa item kerja di sini, pastikan proyek tertaut Anda memiliki item kerja yang ditetapkan ke anggota tim ini atau buat item kerja.",
        primary_button: {
          text: "Tambahkan item kerja ke proyek tertaut",
        },
      },
      work_items_empty_filter: {
        title: "Tidak ada item kerja khusus tim untuk filter yang diterapkan",
        description:
          "Ubah beberapa filter tersebut atau hapus semuanya untuk melihat item kerja yang relevan dengan ruang ini.",
        secondary_button: {
          text: "Hapus semua filter",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Tidak ada proyek tertaut Anda yang memiliki siklus aktif.",
        description:
          "Siklus aktif dalam proyek tertaut akan otomatis muncul di sini. Jika Anda berharap melihat siklus aktif, pastikan itu sedang berjalan di proyek tertaut saat ini.",
      },
      completed: {
        title: "Tidak ada proyek tertaut Anda yang memiliki siklus selesai.",
        description:
          "Siklus selesai dalam proyek tertaut akan otomatis muncul di sini. Jika Anda berharap melihat siklus selesai, pastikan itu juga selesai di proyek tertaut.",
      },
      upcoming: {
        title: "Tidak ada proyek tertaut Anda yang memiliki siklus mendatang.",
        description:
          "Siklus mendatang dalam proyek tertaut akan otomatis muncul di sini. Jika Anda berharap melihat siklus mendatang, pastikan itu ada di proyek tertaut juga.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Tampilan tim Anda tentang pekerjaan Anda tanpa mengganggu tampilan lain di workspace Anda",
        description:
          "Lihat pekerjaan tim Anda dalam tampilan yang disimpan hanya untuk tim Anda dan terpisah dari tampilan proyek.",
        primary_button: {
          text: "Buat tampilan",
        },
      },
      filter: {
        title: "Tidak ada tampilan yang cocok",
        description: `Tidak ada tampilan yang cocok dengan kriteria pencarian.
 Buat tampilan baru sebagai gantinya.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Simpan pengetahuan tim Anda di Halaman Tim.",
        description:
          "Tidak seperti halaman dalam proyek, Anda dapat menyimpan pengetahuan khusus untuk tim dalam kumpulan halaman terpisah di sini. Dapatkan semua fitur Halaman, buat dokumen praktik terbaik, dan wiki tim dengan mudah.",
        primary_button: {
          text: "Buat halaman tim pertama Anda",
        },
      },
      filter: {
        title: "Tidak ada halaman yang cocok",
        description: "Hapus filter untuk melihat semua halaman",
      },
      search: {
        title: "Tidak ada halaman yang cocok",
        description: "Hapus kriteria pencarian untuk melihat semua halaman",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Tidak ada proyek tertaut Anda yang memiliki item kerja yang dipublikasikan.",
        description:
          "Buat beberapa item kerja di satu atau lebih proyek tersebut untuk melihat kemajuan berdasarkan tanggal, status, dan prioritas.",
      },
      relation: {
        blocking: {
          title: "Anda tidak memiliki item kerja yang memblokir rekan tim.",
          description: "Kerja bagus! Anda telah membersihkan jalur untuk tim Anda. Anda adalah pemain tim yang baik.",
        },
        blocked: {
          title: "Anda tidak memiliki item kerja rekan tim yang memblokir Anda.",
          description: "Kabar baik! Anda dapat membuat kemajuan pada semua item kerja yang ditugaskan kepada Anda.",
        },
      },
      stats: {
        general: {
          title: "Tidak ada proyek tertaut Anda yang memiliki item kerja yang dipublikasikan.",
          description:
            "Buat beberapa item kerja di satu atau lebih proyek tersebut untuk melihat distribusi pekerjaan berdasarkan proyek dan anggota tim.",
        },
        filter: {
          title: "Tidak ada statistik tim untuk filter yang diterapkan.",
          description:
            "Buat beberapa item kerja di satu atau lebih proyek tersebut untuk melihat distribusi pekerjaan berdasarkan proyek dan anggota tim.",
        },
      },
    },
  },
  initiatives: {
    overview: "Ikhtisar",
    label: "Inisiatif",
    placeholder: "{count, plural, one{# inisiatif} other{# inisiatif}}",
    add_initiative: "Tambah Inisiatif",
    create_initiative: "Buat Inisiatif",
    update_initiative: "Perbarui Inisiatif",
    initiative_name: "Nama inisiatif",
    all_initiatives: "Semua Inisiatif",
    delete_initiative: "Hapus Inisiatif",
    fill_all_required_fields: "Harap isi semua bidang yang diperlukan.",
    toast: {
      create_success: "Inisiatif {name} berhasil dibuat.",
      create_error: "Gagal membuat inisiatif. Silakan coba lagi!",
      update_success: "Inisiatif {name} berhasil diperbarui.",
      update_error: "Gagal memperbarui inisiatif. Silakan coba lagi!",
      delete: {
        success: "Inisiatif berhasil dihapus.",
        error: "Gagal menghapus Inisiatif",
      },
      link_copied: "Tautan inisiatif disalin ke clipboard.",
      project_update_success: "Proyek inisiatif berhasil diperbarui.",
      project_update_error: "Gagal memperbarui proyek inisiatif. Silakan coba lagi!",
      epic_update_success:
        "Epik{count, plural, one { berhasil ditambahkan ke Inisiatif.} other { berhasil ditambahkan ke Inisiatif.}}",
      epic_update_error: "Penambahan Epik ke Inisiatif gagal. Silakan coba lagi nanti.",
      state_update_success: "Status inisiatif berhasil diperbarui.",
      state_update_error: "Gagal memperbarui status inisiatif. Silakan coba lagi!",
      label_update_error: "Gagal memperbarui label inisiatif. Silakan coba lagi!",
    },
    empty_state: {
      general: {
        title: "Atur pekerjaan di level tertinggi dengan Inisiatif",
        description:
          "Ketika Anda perlu mengatur pekerjaan yang mencakup beberapa proyek dan tim, Inisiatif sangat berguna. Hubungkan proyek dan epik ke inisiatif, lihat pembaruan yang otomatis digabungkan, dan lihat hutan sebelum Anda sampai ke pohon.",
        primary_button: {
          text: "Buat inisiatif",
        },
      },
      search: {
        title: "Tidak ada inisiatif yang cocok",
        description: `Tidak ada inisiatif yang terdeteksi dengan kriteria yang cocok.
 Buat inisiatif baru sebagai gantinya.`,
      },
      not_found: {
        title: "Inisiatif tidak ada",
        description: "Inisiatif yang Anda cari tidak ada, telah diarsipkan, atau telah dihapus.",
        primary_button: {
          text: "Lihat Inisiatif lain",
        },
      },
      epics: {
        title: "Anda tidak memiliki epik yang cocok dengan filter yang Anda terapkan.",
        subHeading: "Untuk melihat semua epik, hapus semua filter yang diterapkan.",
        action: "Hapus filter",
      },
    },
    scope: {
      view_scope: "Lihat ruang lingkup",
      breakdown: "Pecahkan ruang lingkup",
      add_scope: "Tambah ruang lingkup",
      label: "Ruang lingkup",
      empty_state: {
        title: "Belum ada ruang lingkup yang ditambahkan ke inisiatif ini",
        description: "Hubungkan proyek dan epik ke inisiatif ini untuk memulai.",
        primary_button: {
          text: "Tambah ruang lingkup",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Label",
        description: "Strukturkan dan atur inisiatif Anda dengan label.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Hapus label",
        content:
          "Apakah Anda yakin ingin menghapus {labelName}? Ini akan menghapus label dari semua inisiatif dan dari semua tampilan yang sedang memfilter label tersebut.",
      },
      toast: {
        delete_error: "Label inisiatif tidak dapat dihapus. Silakan coba lagi.",
        label_already_exists: "Label sudah ada",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Tulis catatan, dokumen, atau basis pengetahuan lengkap. Dapatkan Galileo, asisten AI Plane, untuk membantu Anda memulai",
        description:
          "Halaman adalah ruang pemikiran di Plane. Catat catatan rapat, format dengan mudah, sematkan item kerja, tata menggunakan perpustakaan komponen, dan simpan semuanya dalam konteks proyek Anda. Untuk mempersingkat pekerjaan dokumen apa pun, panggil Galileo, AI Plane, dengan pintasan atau klik tombol.",
        primary_button: {
          text: "Buat halaman pertama Anda",
        },
      },
      private: {
        title: "Belum ada halaman pribadi",
        description: "Simpan pikiran pribadi Anda di sini. Ketika Anda siap berbagi, tim hanya berjarak satu klik.",
        primary_button: {
          text: "Buat halaman pertama Anda",
        },
      },
      public: {
        title: "Belum ada halaman ruang kerja",
        description: "Lihat halaman yang dibagikan dengan semua orang di ruang kerja Anda di sini.",
        primary_button: {
          text: "Buat halaman pertama Anda",
        },
      },
      archived: {
        title: "Belum ada halaman yang diarsipkan",
        description: "Arsipkan halaman yang tidak di radar Anda. Akses di sini saat diperlukan.",
      },
    },
  },
  epics: {
    label: "Epik",
    no_epics_selected: "Tidak ada epik yang dipilih",
    add_selected_epics: "Tambahkan epik yang dipilih",
    epic_link_copied_to_clipboard: "Tautan epik disalin ke clipboard.",
    project_link_copied_to_clipboard: "Tautan proyek disalin ke clipboard",
    empty_state: {
      general: {
        title: "Buat epik dan tetapkan ke seseorang, bahkan diri Anda sendiri",
        description:
          "Untuk tubuh pekerjaan yang lebih besar yang mencakup beberapa siklus dan dapat hidup di berbagai modul, buat epik. Hubungkan item kerja dan sub-item kerja dalam proyek ke epik dan lompat ke item kerja dari ikhtisar.",
        primary_button: {
          text: "Buat Epik",
        },
      },
      section: {
        title: "Belum ada epik",
        description: "Mulai menambahkan epik untuk mengelola dan melacak kemajuan.",
        primary_button: {
          text: "Tambah epik",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Tidak ditemukan epik yang cocok",
      },
      no_epics: {
        title: "Tidak ditemukan epik",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Tidak ada siklus aktif",
        description:
          "Siklus proyek Anda yang mencakup periode apa pun yang mencakup tanggal hari ini dalam rentangnya. Temukan kemajuan dan detail semua siklus aktif Anda di sini.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: `Tambahkan item kerja ke siklus untuk melihat
 kemajuannya`,
      },
      priority: {
        title: `Amati item kerja prioritas tinggi yang ditangani dalam
 siklus secara sekilas.`,
      },
      assignee: {
        title: `Tambahkan penanggung jawab ke item kerja untuk melihat
 pembagian pekerjaan berdasarkan penanggung jawab.`,
      },
      label: {
        title: `Tambahkan label ke item kerja untuk melihat
 pembagian pekerjaan berdasarkan label.`,
      },
    },
  },
  workspace: {
    members_import: {
      title: "Impor anggota dari CSV",
      description: "Unggah CSV dengan kolom: Email, Display Name, First Name, Last Name, Role (5, 15, atau 20)",
      dropzone: {
        active: "Letakkan file CSV di sini",
        inactive: "Seret & lepas atau klik untuk mengunggah",
        file_type: "Hanya file .csv yang didukung",
      },
      buttons: {
        cancel: "Batal",
        import: "Impor",
        try_again: "Coba Lagi",
        close: "Tutup",
        done: "Selesai",
      },
      progress: {
        uploading: "Mengunggah...",
        importing: "Mengimpor...",
      },
      summary: {
        title: {
          failed: "Impor Gagal",
          complete: "Impor Selesai",
        },
        message: {
          seat_limit: "Tidak dapat mengimpor anggota karena pembatasan tempat duduk.",
          success: "Berhasil menambahkan {count} anggota ke workspace.",
          no_imports: "Tidak ada anggota yang diimpor dari file CSV.",
        },
        stats: {
          successful: "Berhasil",
          failed: "Gagal",
        },
        download_errors: "Unduh kesalahan",
      },
      toast: {
        invalid_file: {
          title: "File tidak valid",
          message: "Hanya file CSV yang didukung.",
        },
        import_failed: {
          title: "Impor gagal",
          message: "Terjadi kesalahan.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "Tidak dapat mengarsipkan item kerja",
        message: "Hanya item kerja yang termasuk dalam kelompok status Selesai atau Dibatalkan yang dapat diarsipkan.",
      },
      invalid_issue_start_date: {
        title: "Tidak dapat memperbarui item kerja",
        message:
          "Tanggal mulai yang dipilih melebihi tanggal jatuh tempo untuk beberapa item kerja. Pastikan tanggal mulai sebelum tanggal jatuh tempo.",
      },
      invalid_issue_target_date: {
        title: "Tidak dapat memperbarui item kerja",
        message:
          "Tanggal jatuh tempo yang dipilih mendahului tanggal mulai untuk beberapa item kerja. Pastikan tanggal jatuh tempo setelah tanggal mulai.",
      },
      invalid_state_transition: {
        title: "Tidak dapat memperbarui item kerja",
        message: "Perubahan status tidak diizinkan untuk beberapa item kerja. Pastikan perubahan status diizinkan.",
      },
    },
  },
  work_item_types: {
    label: "Tipe Item Kerja",
    label_lowercase: "tipe item kerja",
    settings: {
      title: "Tipe Item Kerja",
      properties: {
        title: "Properti kustom",
        tooltip:
          "Setiap tipe item kerja dilengkapi dengan serangkaian properti default seperti Judul, Deskripsi, Penerima tugas, Status, Prioritas, Tanggal mulai, Tanggal jatuh tempo, Modul, Siklus, dll. Anda juga dapat menyesuaikan dan menambahkan properti Anda sendiri untuk menyesuaikannya dengan kebutuhan tim Anda.",
        add_button: "Tambah properti baru",
        dropdown: {
          label: "Tipe properti",
          placeholder: "Pilih tipe",
        },
        property_type: {
          text: {
            label: "Teks",
          },
          number: {
            label: "Angka",
          },
          dropdown: {
            label: "Dropdown",
          },
          boolean: {
            label: "Boolean",
          },
          date: {
            label: "Tanggal",
          },
          member_picker: {
            label: "Pemilih anggota",
          },
          formula: {
            label: "Rumus",
          },
        },
        attributes: {
          label: "Atribut",
          text: {
            single_line: {
              label: "Baris tunggal",
            },
            multi_line: {
              label: "Paragraf",
            },
            readonly: {
              label: "Hanya baca",
              header: "Data hanya baca",
            },
            invalid_text_format: {
              label: "Format teks tidak valid",
            },
          },
          number: {
            default: {
              placeholder: "Tambah angka",
            },
          },
          relation: {
            single_select: {
              label: "Pilihan tunggal",
            },
            multi_select: {
              label: "Pilihan ganda",
            },
            no_default_value: {
              label: "Tidak ada nilai default",
            },
          },
          boolean: {
            label: "Benar | Salah",
            no_default: "Tidak ada nilai default",
          },
          option: {
            create_update: {
              label: "Opsi",
              form: {
                placeholder: "Tambah opsi",
                errors: {
                  name: {
                    required: "Nama opsi diperlukan.",
                    integrity: "Opsi dengan nama yang sama sudah ada.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Pilih opsi",
                multi: {
                  default: "Pilih opsi",
                  variable: "{count} opsi dipilih",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Berhasil!",
              message: "Properti {name} berhasil dibuat.",
            },
            error: {
              title: "Kesalahan!",
              message: "Gagal membuat properti. Silakan coba lagi!",
            },
          },
          update: {
            success: {
              title: "Berhasil!",
              message: "Properti {name} berhasil diperbarui.",
            },
            error: {
              title: "Kesalahan!",
              message: "Gagal memperbarui properti. Silakan coba lagi!",
            },
          },
          delete: {
            success: {
              title: "Berhasil!",
              message: "Properti {name} berhasil dihapus.",
            },
            error: {
              title: "Kesalahan!",
              message: "Gagal menghapus properti. Silakan coba lagi!",
            },
          },
          enable_disable: {
            loading: "{action} properti {name}",
            success: {
              title: "Berhasil!",
              message: "Properti {name} berhasil {action}.",
            },
            error: {
              title: "Kesalahan!",
              message: "Gagal {action} properti. Silakan coba lagi!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Judul",
            },
            description: {
              placeholder: "Deskripsi",
            },
          },
          errors: {
            name: {
              required: "Anda harus memberi nama properti Anda.",
              max_length: "Nama properti tidak boleh melebihi 255 karakter.",
            },
            property_type: {
              required: "Anda harus memilih tipe properti.",
            },
            options: {
              required: "Anda harus menambahkan setidaknya satu opsi.",
            },
            formula: {
              required: "Ekspresi rumus diperlukan.",
              invalid: "Rumus tidak valid: {error}",
              circular_reference:
                "Referensi melingkar terdeteksi. Rumus tidak dapat mereferensikan dirinya sendiri secara langsung maupun tidak langsung.",
              invalid_reference: "Rumus mereferensikan properti yang tidak ada.",
            },
          },
        },
        formula: {
          field_label: "Kolom rumus",
          tooltip: "Masukkan rumus menggunakan sintaks '{'Nama Kolom'}'. Mendukung operator +, -, *, / dan &.",
          placeholder: "Tulis rumus",
          test_button: "Tes",
          validating: "Memvalidasi",
          validation_success: "Rumus valid! Mengembalikan {resultType}",
          validation_success_with_refs: "Rumus valid! Mengembalikan {resultType} ({count} kolom direferensikan)",
          error: {
            empty: "Silakan masukkan rumus",
            missing_context: "Konteks ruang kerja, proyek, atau tipe item kerja tidak ditemukan",
            validation_failed: "Validasi gagal",
          },
          picker: {
            no_match: "Tidak ada properti yang cocok",
            no_available: "Tidak ada properti yang tersedia",
          },
        },
        enable_disable: {
          label: "Aktif",
          tooltip: {
            disabled: "Klik untuk menonaktifkan",
            enabled: "Klik untuk mengaktifkan",
          },
        },
        delete_confirmation: {
          title: "Hapus properti ini",
          description: "Penghapusan properti dapat menyebabkan hilangnya data yang ada.",
          secondary_description: "Apakah Anda ingin menonaktifkan properti sebagai gantinya?",
          primary_button: "{action}, hapus itu",
          secondary_button: "Ya, nonaktifkan itu",
        },
        mandate_confirmation: {
          label: "Properti wajib",
          content:
            "Sepertinya ada opsi default untuk properti ini. Membuat properti menjadi wajib akan menghapus nilai default dan pengguna harus menambahkan nilai pilihan mereka.",
          tooltip: {
            disabled: "Tipe properti ini tidak dapat dijadikan wajib",
            enabled: "Hapus centang untuk menandai kolom sebagai opsional",
            checked: "Centang untuk menandai kolom sebagai wajib",
          },
        },
        empty_state: {
          title: "Tambahkan properti kustom",
          description: "Properti baru yang Anda tambahkan untuk tipe item kerja ini akan ditampilkan di sini.",
        },
      },
      item_delete_confirmation: {
        title: "Hapus jenis ini",
        description: "Penghapusan tipe dapat menyebabkan hilangnya data yang ada.",
        primary_button: "Ya, hapus",
        toast: {
          success: {
            title: "Berhasil!",
            message: "Jenis item kerja berhasil dihapus.",
          },
          error: {
            title: "Kesalahan!",
            message: "Gagal menghapus jenis item kerja. Silakan coba lagi!",
          },
        },
        can_disable_warning: "Apakah Anda ingin menonaktifkan jenisnya saja?",
      },
      cant_delete_default_message:
        "Jenis item kerja ini tidak dapat dihapus karena diatur sebagai default untuk proyek ini.",
    },
    create: {
      title: "Buat tipe item kerja",
      button: "Tambah tipe item kerja",
      toast: {
        success: {
          title: "Berhasil!",
          message: "Tipe item kerja berhasil dibuat.",
        },
        error: {
          title: "Kesalahan!",
          message: {
            conflict: "Tipe {name} sudah ada. Pilih nama lain.",
          },
        },
      },
    },
    update: {
      title: "Perbarui tipe item kerja",
      button: "Perbarui tipe item kerja",
      toast: {
        success: {
          title: "Berhasil!",
          message: "Tipe item kerja {name} berhasil diperbarui.",
        },
        error: {
          title: "Kesalahan!",
          message: {
            conflict: "Tipe {name} sudah ada. Pilih nama lain.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Berikan nama unik untuk tipe item kerja ini",
        },
        description: {
          placeholder: "Jelaskan untuk apa tipe item kerja ini dimaksudkan dan kapan akan digunakan.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{action} tipe item kerja {name}",
        success: {
          title: "Berhasil!",
          message: "Tipe item kerja {name} berhasil {action}.",
        },
        error: {
          title: "Kesalahan!",
          message: "Gagal {action} tipe item kerja. Silakan coba lagi!",
        },
      },
      tooltip: "Klik untuk {action}",
    },
    change_confirmation: {
      title: "Ubah tipe item kerja?",
      description:
        "Mengubah tipe item kerja dapat mengakibatkan hilangnya nilai properti kustom yang spesifik untuk tipe saat ini. Tindakan ini tidak dapat dibatalkan.",
      button: {
        loading: "Mengubah",
        default: "Ubah tipe",
      },
    },
    empty_state: {
      enable: {
        title: "Aktifkan Tipe Item Kerja",
        description:
          "Bentuk item kerja sesuai dengan pekerjaan Anda dengan Tipe item kerja. Sesuaikan dengan ikon, latar belakang, dan properti dan konfigurasikan untuk proyek ini.",
        primary_button: {
          text: "Aktifkan",
        },
        confirmation: {
          title: "Setelah diaktifkan, Tipe Item Kerja tidak dapat dinonaktifkan.",
          description:
            "Item Kerja Plane akan menjadi tipe item kerja default untuk proyek ini dan akan muncul dengan ikon dan latar belakangnya di proyek ini.",
          button: {
            default: "Aktifkan",
            loading: "Menyiapkan",
          },
        },
      },
      get_pro: {
        title: "Dapatkan Pro untuk mengaktifkan Tipe item kerja.",
        description:
          "Bentuk item kerja sesuai dengan pekerjaan Anda dengan Tipe item kerja. Sesuaikan dengan ikon, latar belakang, dan properti dan konfigurasikan untuk proyek ini.",
        primary_button: {
          text: "Dapatkan Pro",
        },
      },
      upgrade: {
        title: "Tingkatkan untuk mengaktifkan Tipe item kerja.",
        description:
          "Bentuk item kerja sesuai dengan pekerjaan Anda dengan Tipe item kerja. Sesuaikan dengan ikon, latar belakang, dan properti dan konfigurasikan untuk proyek ini.",
        primary_button: {
          text: "Tingkatkan",
        },
      },
    },
  },
  importers: {
    imports: "Impor",
    logo: "Logo",
    import_message: "Impor data {serviceName} Anda ke dalam projek plane.",
    deactivate: "Nonaktifkan",
    deactivating: "Menonaktifkan",
    migrating: "Bermigrasi",
    migrations: "Migrasi",
    refreshing: "Menyegarkan",
    import: "Impor",
    serial_number: "Sr No.",
    project: "Projek",
    workspace: "Workspace",
    status: "Status",
    summary: "Ringkasan",
    total_batches: "Total Batch",
    imported_batches: "Batch Terimport",
    re_run: "Jalankan Ulang",
    cancel: "Batal",
    start_time: "Waktu Mulai",
    no_jobs_found: "Tidak ada pekerjaan ditemukan",
    no_project_imports: "Anda belum mengimpor projek {serviceName} apa pun.",
    cancel_import_job: "Batalkan pekerjaan impor",
    cancel_import_job_confirmation:
      "Apakah Anda yakin ingin membatalkan pekerjaan impor ini? Ini akan menghentikan proses impor untuk projek ini.",
    re_run_import_job: "Jalankan ulang pekerjaan impor",
    re_run_import_job_confirmation:
      "Apakah Anda yakin ingin menjalankan ulang pekerjaan impor ini? Ini akan memulai ulang proses impor untuk projek ini.",
    upload_csv_file: "Unggah file CSV untuk mengimpor data pengguna.",
    connect_importer: "Hubungkan {serviceName}",
    migration_assistant: "Asisten Migrasi",
    migration_assistant_description:
      "Migrasi projek {serviceName} Anda ke Plane dengan mudah menggunakan asisten kami yang canggih.",
    token_helper: "Anda akan mendapatkan ini dari",
    personal_access_token: "Token Akses Personal",
    source_token_expired: "Token Kedaluwarsa",
    source_token_expired_description:
      "Token yang diberikan telah kedaluwarsa. Silakan nonaktifkan dan hubungkan kembali dengan kredensial baru.",
    user_email: "Email Pengguna",
    select_state: "Pilih Status",
    select_service_project: "Pilih Projek {serviceName}",
    loading_service_projects: "Memuat projek {serviceName}",
    select_service_workspace: "Pilih Workspace {serviceName}",
    loading_service_workspaces: "Memuat Workspace {serviceName}",
    select_priority: "Pilih Prioritas",
    select_service_team: "Pilih Tim {serviceName}",
    add_seat_msg_free_trial:
      "Anda mencoba mengimpor {additionalUserCount} pengguna tidak terdaftar dan Anda hanya memiliki {currentWorkspaceSubscriptionAvailableSeats} kursi tersedia dalam paket saat ini. Untuk melanjutkan pengimporan, tingkatkan sekarang.",
    add_seat_msg_paid:
      "Anda mencoba mengimpor {additionalUserCount} pengguna tidak terdaftar dan Anda hanya memiliki {currentWorkspaceSubscriptionAvailableSeats} kursi tersedia dalam paket saat ini. Untuk melanjutkan pengimporan, beli setidaknya {extraSeatRequired} kursi tambahan.",
    skip_user_import_title: "Lewati pengimporan data Pengguna",
    skip_user_import_description:
      "Melewati impor pengguna akan mengakibatkan item kerja, komentar, dan data lain dari {serviceName} dibuat oleh pengguna yang melakukan migrasi di Plane. Anda masih dapat menambahkan pengguna secara manual nanti.",
    invalid_pat: "Token Akses Personal Tidak Valid",
  },
  integrations: {
    integrations: "Integrasi",
    loading: "Memuat",
    unauthorized: "Anda tidak berwenang untuk melihat halaman ini.",
    configure: "Konfigurasi",
    not_enabled: "{name} tidak diaktifkan untuk workspace ini.",
    not_configured: "Tidak dikonfigurasi",
    disconnect_personal_account: "Putuskan akun personal {providerName}",
    not_configured_message_admin:
      "Integrasi {name} tidak dikonfigurasi. Silakan hubungi admin instansi Anda untuk mengonfigurasinya.",
    not_configured_message_support:
      "Integrasi {name} tidak dikonfigurasi. Silakan hubungi dukungan untuk mengonfigurasinya.",
    external_api_unreachable: "Tidak dapat mengakses API eksternal. Silakan coba lagi nanti.",
    error_fetching_supported_integrations: "Tidak dapat mengambil integrasi yang didukung. Silakan coba lagi nanti.",
    back_to_integrations: "Kembali ke integrasi",
    select_state: "Pilih Status",
    set_state: "Set Status",
    choose_project: "Pilih Projek...",
  },
  github_integration: {
    name: "GitHub",
    description: "Hubungkan dan sinkronkan item kerja GitHub Anda dengan Plane",
    connect_org: "Hubungkan Organisasi",
    connect_org_description: "Hubungkan organisasi GitHub Anda dengan Plane",
    processing: "Memproses",
    org_added_desc: "GitHub org ditambahkan oleh dan waktu",
    connection_fetch_error: "Kesalahan mengambil detail koneksi dari server",
    personal_account_connected: "Akun personal terhubung",
    personal_account_connected_description: "Akun GitHub Anda sekarang terhubung ke Plane",
    connect_personal_account: "Hubungkan Akun Personal",
    connect_personal_account_description: "Hubungkan akun GitHub personal Anda dengan Plane.",
    repo_mapping: "Pemetaan Repositori",
    repo_mapping_description: "Pemetaan repositori GitHub Anda dengan proyek Plane",
    project_issue_sync: "Sinkronisasi Masalah Proyek",
    project_issue_sync_description: "Sinkronisasi masalah dari GitHub ke proyek Plane",
    project_issue_sync_empty_state: "Sinkronisasi masalah proyek yang dipetakan akan muncul di sini",
    configure_project_issue_sync_state: "Konfigurasikan State Sinkronisasi Masalah",
    select_issue_sync_direction: "Pilih arah sinkronisasi masalah",
    allow_bidirectional_sync:
      "Bidirectional - Sinkronisasi masalah dan komentar dalam dua arah antara GitHub dan Plane",
    allow_unidirectional_sync: "Unidirectional - Sinkronisasi masalah dan komentar dari GitHub ke Plane saja",
    allow_unidirectional_sync_warning:
      "Data dari GitHub Issue akan menggantikan data di Item Kerja Plane yang Tertaut (GitHub → Plane saja)",
    remove_project_issue_sync: "Hapus Sinkronisasi Masalah Proyek",
    remove_project_issue_sync_confirmation: "Apakah Anda yakin ingin menghapus sinkronisasi masalah proyek ini?",
    add_pr_state_mapping: "Tambahkan Pemetaan Status Permintaan Tarik untuk Proyek Plane",
    edit_pr_state_mapping: "Edit Pemetaan Status Permintaan Tarik untuk Proyek Plane",
    pr_state_mapping: "Pull Request State Mapping",
    pr_state_mapping_description: "Pemetaan status permintaan tarik dari GitHub ke proyek Plane",
    pr_state_mapping_empty_state: "Status PR yang dipetakan akan muncul di sini",
    remove_pr_state_mapping: "Hapus pemetaan status permintaan tarik ini",
    remove_pr_state_mapping_confirmation: "Apakah Anda yakin ingin menghapus pemetaan status permintaan tarik ini?",
    issue_sync_message: "Item kerja disinkronkan ke {project}proyek Plane",
    link: "Link repositori GitHub ke proyek Plane",
    pull_request_automation: "Otomatisasi Permintaan Tarik",
    pull_request_automation_description: "Konfigurasi pemetaan status permintaan tarik dari GitHub ke proyek Plane",
    DRAFT_MR_OPENED: "Draft Dibuka",
    MR_OPENED: "Dibuka",
    MR_READY_FOR_MERGE: "Siap untuk Digabung",
    MR_REVIEW_REQUESTED: "Review Diminta",
    MR_MERGED: "Digabung",
    MR_CLOSED: "Ditutup",
    ISSUE_OPEN: "Issue Dibuka",
    ISSUE_CLOSED: "Issue Ditutup",
    save: "Simpan",
    start_sync: "Mulai Sinkronisasi",
    choose_repository: "Pilih Repositori...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Hubungkan dan sinkronkan Permintaan Gabungan Gitlab Anda dengan Plane.",
    connection_fetch_error: "Kesalahan mengambil detail koneksi dari server",
    connect_org: "Hubungkan Organisasi",
    connect_org_description: "Hubungkan organisasi Gitlab Anda dengan Plane.",
    project_connections: "Koneksi Projek Gitlab",
    project_connections_description: "Sinkronkan permintaan gabungan dari Gitlab ke projek Plane.",
    plane_project_connection: "Koneksi Projek Plane",
    plane_project_connection_description: "Konfigurasi pemetaan status permintaan tarik dari Gitlab ke projek Plane",
    remove_connection: "Hapus Koneksi",
    remove_connection_confirmation: "Apakah Anda yakin ingin menghapus koneksi ini?",
    link: "Hubungkan repositori Gitlab ke projek Plane",
    pull_request_automation: "Otomatisasi Pull Request",
    pull_request_automation_description: "Konfigurasi pemetaan status permintaan tarik dari Gitlab ke Plane",
    DRAFT_MR_OPENED: "Saat draft MR dibuka, atur status ke",
    MR_OPENED: "Saat MR dibuka, atur status ke",
    MR_REVIEW_REQUESTED: "Saat permintaan ulasan MR, atur status ke",
    MR_READY_FOR_MERGE: "Saat MR siap untuk digabung, atur status ke",
    MR_MERGED: "Saat MR digabung, atur status ke",
    MR_CLOSED: "Saat MR ditutup, atur status ke",
    integration_enabled_text: "Dengan integrasi Gitlab Diaktifkan, Anda dapat mengotomatisasi alur kerja item kerja",
    choose_entity: "Pilih Entitas",
    choose_project: "Pilih Projek",
    link_plane_project: "Hubungkan projek Plane",
    project_issue_sync: "Sinkronisasi Masalah Projek",
    project_issue_sync_description: "Sinkronkan masalah dari Gitlab ke projek Plane Anda",
    project_issue_sync_empty_state: "Sinkronisasi masalah projek yang dipetakan akan muncul di sini",
    configure_project_issue_sync_state: "Konfigurasi Status Sinkronisasi Masalah",
    select_issue_sync_direction: "Pilih arah sinkronisasi masalah",
    allow_bidirectional_sync: "Dua Arah - Sinkronkan masalah dan komentar dua arah antara Gitlab dan Plane",
    allow_unidirectional_sync: "Satu Arah - Sinkronkan masalah dan komentar hanya dari Gitlab ke Plane",
    allow_unidirectional_sync_warning:
      "Data dari Gitlab Issue akan menggantikan data di Item Kerja Plane yang Terhubung (hanya Gitlab → Plane)",
    remove_project_issue_sync: "Hapus Sinkronisasi Masalah Projek ini",
    remove_project_issue_sync_confirmation: "Apakah Anda yakin ingin menghapus sinkronisasi masalah projek ini?",
    ISSUE_OPEN: "Masalah Terbuka",
    ISSUE_CLOSED: "Masalah Tertutup",
    save: "Simpan",
    start_sync: "Mulai Sinkronisasi",
    choose_repository: "Pilih Repositori...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Hubungkan dan sinkronkan instance Gitlab Enterprise Anda dengan Plane.",
    app_form_title: "Konfigurasi Gitlab Enterprise",
    app_form_description: "Konfigurasi Gitlab Enterprise untuk terhubung dengan Plane.",
    base_url_title: "URL Dasar",
    base_url_description: "URL dasar instance Gitlab Enterprise Anda.",
    base_url_placeholder: 'contoh: "https://glab.plane.town"',
    base_url_error: "URL dasar diperlukan",
    invalid_base_url_error: "URL dasar tidak valid",
    client_id_title: "ID App",
    client_id_description: "ID app yang Anda buat di instance Gitlab Enterprise Anda.",
    client_id_placeholder: 'contoh: "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "ID App diperlukan",
    client_secret_title: "Client Secret",
    client_secret_description: "Client secret dari app yang Anda buat di instance Gitlab Enterprise Anda.",
    client_secret_placeholder: 'contoh: "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "Client secret diperlukan",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description:
      "Webhook secret acak yang akan digunakan untuk memverifikasi webhook dari instance Gitlab Enterprise.",
    webhook_secret_placeholder: 'contoh: "webhook1234567890"',
    webhook_secret_error: "Webhook secret diperlukan",
    connect_app: "Hubungkan App",
  },
  slack_integration: {
    name: "Slack",
    description: "Hubungkan workspace Slack Anda dengan Plane.",
    connect_personal_account: "Hubungkan akun Slack personal Anda dengan Plane.",
    personal_account_connected: "Akun {providerName} personal Anda sekarang terhubung ke Plane.",
    link_personal_account: "Hubungkan akun {providerName} personal Anda ke Plane.",
    connected_slack_workspaces: "Workspace Slack terhubung",
    connected_on: "Terhubung pada {date}",
    disconnect_workspace: "Putuskan workspace {name}",
    alerts: {
      dm_alerts: {
        title:
          "Dapatkan notifikasi di pesan langsung Slack untuk pembaruan penting, pengingat, dan peringatan khusus untuk Anda.",
      },
    },
    project_updates: {
      title: "Pembaruan Proyek",
      description: "Konfigurasikan notifikasi pembaruan proyek untuk proyek Anda",
      add_new_project_update: "Tambahkan notifikasi pembaruan proyek baru",
      project_updates_empty_state: "Proyek yang terhubung dengan Saluran Slack akan muncul di sini.",
      project_updates_form: {
        title: "Konfigurasikan Pembaruan Proyek",
        description: "Terima notifikasi pembaruan proyek di Slack saat item kerja dibuat",
        failed_to_load_channels: "Gagal memuat saluran dari Slack",
        project_dropdown: {
          placeholder: "Pilih proyek",
          label: "Proyek Plane",
          no_projects: "Tidak ada proyek tersedia",
        },
        channel_dropdown: {
          label: "Saluran Slack",
          placeholder: "Pilih saluran",
          no_channels: "Tidak ada saluran tersedia",
        },
        all_projects_connected: "Semua proyek sudah terhubung ke saluran Slack.",
        all_channels_connected: "Semua saluran Slack sudah terhubung ke proyek.",
        project_connection_success: "Koneksi proyek berhasil dibuat",
        project_connection_updated: "Koneksi proyek berhasil diperbarui",
        project_connection_deleted: "Koneksi proyek berhasil dihapus",
        failed_delete_project_connection: "Gagal menghapus koneksi proyek",
        failed_create_project_connection: "Gagal membuat koneksi proyek",
        failed_upserting_project_connection: "Gagal memperbarui koneksi proyek",
        failed_loading_project_connections:
          "Kami tidak dapat memuat koneksi proyek Anda. Ini mungkin karena masalah jaringan atau masalah dengan integrasi.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Hubungkan ruang kerja Sentry Anda dengan Plane.",
    connected_sentry_workspaces: "Ruang kerja Sentry yang terhubung",
    connected_on: "Terhubung pada {date}",
    disconnect_workspace: "Putuskan ruang kerja {name}",
    state_mapping: {
      title: "Pemetaan status",
      description:
        "Petakan status insiden Sentry ke status proyek Anda. Konfigurasikan status mana yang digunakan ketika insiden Sentry diselesaikan atau tidak diselesaikan.",
      add_new_state_mapping: "Tambahkan pemetaan status baru",
      empty_state:
        "Tidak ada pemetaan status yang dikonfigurasi. Buat pemetaan pertama Anda untuk menyinkronkan status insiden Sentry dengan status proyek Anda.",
      failed_loading_state_mappings:
        "Kami tidak dapat memuat pemetaan status Anda. Ini mungkin disebabkan oleh masalah jaringan atau masalah dengan integrasi.",
      loading_project_states: "Memuat status proyek...",
      error_loading_states: "Kesalahan memuat status",
      no_states_available: "Tidak ada status yang tersedia",
      no_permission_states: "Anda tidak memiliki izin untuk mengakses status untuk proyek ini",
      states_not_found: "Status proyek tidak ditemukan",
      server_error_states: "Kesalahan server saat memuat status",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "Hubungkan dan sinkronkan organisasi GitHub Enterprise Anda dengan Plane.",
    app_form_title: "Konfigurasi GitHub Enterprise",
    app_form_description: "Konfigurasikan GitHub Enterprise untuk terhubung dengan Plane.",
    app_id_title: "ID Aplikasi",
    app_id_description: "ID aplikasi yang Anda buat di organisasi GitHub Enterprise Anda.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID diperlukan",
    app_name_title: "Slug Aplikasi",
    app_name_description: "Slug aplikasi yang Anda buat di organisasi GitHub Enterprise Anda.",
    app_name_error: "App slug diperlukan",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "URL Dasar",
    base_url_description: "URL dasar organisasi GitHub Enterprise Anda.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "URL dasar diperlukan",
    invalid_base_url_error: "URL dasar tidak valid",
    client_id_title: "ID Klien",
    client_id_description: "ID klien aplikasi yang Anda buat di organisasi GitHub Enterprise Anda.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "ID klien diperlukan",
    client_secret_title: "Klien Rahasia",
    client_secret_description: "Rahasia klien aplikasi yang Anda buat di organisasi GitHub Enterprise Anda.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Klien rahasia diperlukan",
    webhook_secret_title: "Rahasia Webhook",
    webhook_secret_description: "Rahasia webhook aplikasi yang Anda buat di organisasi GitHub Enterprise Anda.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Rahasia webhook diperlukan",
    private_key_title: "Kunci Pribadi (Base64 encoded)",
    private_key_description: "Kunci pribadi aplikasi yang Anda buat di organisasi GitHub Enterprise Anda.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Kunci pribadi diperlukan",
    connect_app: "Hubungkan Aplikasi",
  },
  file_upload: {
    upload_text: "Klik di sini untuk mengunggah file",
    drag_drop_text: "Tarik dan Lepas",
    processing: "Memproses",
    invalid: "Tipe file tidak valid",
    missing_fields: "Bidang yang hilang",
    success: "{fileName} Diunggah!",
  },
  silo_errors: {
    invalid_query_params: "Parameter kueri yang diberikan tidak valid atau bidang yang diperlukan tidak ada",
    invalid_installation_account: "Akun instalasi yang diberikan tidak valid",
    generic_error: "Terjadi kesalahan tak terduga saat memproses permintaan Anda",
    connection_not_found: "Koneksi yang diminta tidak dapat ditemukan",
    multiple_connections_found: "Beberapa koneksi ditemukan saat hanya satu yang diharapkan",
    installation_not_found: "Instalasi yang diminta tidak dapat ditemukan",
    user_not_found: "Pengguna yang diminta tidak dapat ditemukan",
    error_fetching_token: "Gagal mengambil token autentikasi",
    invalid_app_credentials: "Informasi autentikasi aplikasi yang diberikan tidak valid",
    invalid_app_installation_id: "Gagal menginstal aplikasi",
  },
  import_status: {
    queued: "Dalam Antrian",
    created: "Dibuat",
    initiated: "Dimulai",
    pulling: "Menarik",
    timed_out: "Waktu habis",
    pulled: "Ditarik",
    transforming: "Mentransformasi",
    transformed: "Ditransformasi",
    pushing: "Mendorong",
    finished: "Selesai",
    error: "Kesalahan",
    cancelled: "Dibatalkan",
  },
  jira_importer: {
    jira_importer_description: "Impor data Jira Anda ke dalam projek Plane.",
    personal_access_token: "Token Akses Personal",
    user_email: "Email Pengguna",
    atlassian_security_settings: "Pengaturan Keamanan Atlassian",
    email_description: "Ini adalah email yang terkait dengan token akses personal Anda",
    jira_domain: "Domain Jira",
    jira_domain_description: "Ini adalah domain instansi Jira Anda",
    steps: {
      title_configure_plane: "Konfigurasi Plane",
      description_configure_plane:
        "Silakan buat terlebih dahulu projek di Plane tempat Anda bermaksud memigrasikan data Jira Anda. Setelah projek dibuat, pilih di sini.",
      title_configure_jira: "Konfigurasi Jira",
      description_configure_jira: "Silakan pilih workspace Jira dari mana Anda ingin memigrasikan data Anda.",
      title_import_users: "Impor Pengguna",
      description_import_users:
        "Silakan tambahkan pengguna yang ingin Anda migrasikan dari Jira ke Plane. Atau, Anda dapat melewati langkah ini dan menambahkan pengguna secara manual nanti.",
      title_map_states: "Petakan Status",
      description_map_states:
        "Kami telah secara otomatis mencocokkan status Jira ke status Plane semampu kami. Silakan petakan status yang tersisa sebelum melanjutkan, Anda juga dapat membuat status dan memetakannya secara manual.",
      title_map_priorities: "Petakan Prioritas",
      description_map_priorities:
        "Kami telah secara otomatis mencocokkan prioritas sebaik mungkin. Silakan petakan prioritas yang tersisa sebelum melanjutkan.",
      title_summary: "Ringkasan",
      description_summary: "Berikut adalah ringkasan data yang akan dimigrasikan dari Jira ke Plane.",
      custom_jql_filter: "Filter JQL Kustom",
      jql_filter_description: "Gunakan JQL untuk memfilter masalah tertentu untuk impor.",
      project_code: "PROYEK",
      enter_filters_placeholder: "Masukkan filter (mis. status = 'In Progress')",
      validating_query: "Memvalidasi kueri...",
      validation_successful_work_items_selected: "Validasi Berhasil, {count} Item Kerja Terpilih.",
      run_syntax_check: "Jalankan pemeriksaan sintaks untuk memverifikasi kueri Anda",
      refresh: "Segarkan",
      check_syntax: "Periksa Sintaks",
      no_work_items_selected: "Tidak ada item kerja yang dipilih oleh kueri.",
      validation_error_default: "Ada yang salah saat memvalidasi kueri.",
    },
  },
  asana_importer: {
    asana_importer_description: "Impor data Asana Anda ke dalam projek Plane.",
    select_asana_priority_field: "Pilih Bidang Prioritas Asana",
    steps: {
      title_configure_plane: "Konfigurasi Plane",
      description_configure_plane:
        "Silakan buat terlebih dahulu projek di Plane tempat Anda bermaksud memigrasikan data Asana Anda. Setelah projek dibuat, pilih di sini.",
      title_configure_asana: "Konfigurasi Asana",
      description_configure_asana:
        "Silakan pilih workspace dan projek Asana dari mana Anda ingin memigrasikan data Anda.",
      title_map_states: "Petakan Status",
      description_map_states: "Silakan pilih status Asana yang ingin Anda petakan ke status projek Plane.",
      title_map_priorities: "Petakan Prioritas",
      description_map_priorities: "Silakan pilih prioritas Asana yang ingin Anda petakan ke prioritas projek Plane.",
      title_summary: "Ringkasan",
      description_summary: "Berikut adalah ringkasan data yang akan dimigrasikan dari Asana ke Plane.",
    },
  },
  linear_importer: {
    linear_importer_description: "Impor data Linear Anda ke dalam projek Plane.",
    steps: {
      title_configure_plane: "Konfigurasi Plane",
      description_configure_plane:
        "Silakan buat terlebih dahulu projek di Plane tempat Anda bermaksud memigrasikan data Linear Anda. Setelah projek dibuat, pilih di sini.",
      title_configure_linear: "Konfigurasi Linear",
      description_configure_linear: "Silakan pilih tim Linear dari mana Anda ingin memigrasikan data Anda.",
      title_map_states: "Petakan Status",
      description_map_states:
        "Kami telah secara otomatis mencocokkan status Linear ke status Plane semampu kami. Silakan petakan status yang tersisa sebelum melanjutkan, Anda juga dapat membuat status dan memetakannya secara manual.",
      title_map_priorities: "Petakan Prioritas",
      description_map_priorities: "Silakan pilih prioritas Linear yang ingin Anda petakan ke prioritas projek Plane.",
      title_summary: "Ringkasan",
      description_summary: "Berikut adalah ringkasan data yang akan dimigrasikan dari Linear ke Plane.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Impor data Jira Server/Data Center Anda ke dalam projek Plane.",
    steps: {
      title_configure_plane: "Konfigurasi Plane",
      description_configure_plane:
        "Silakan buat terlebih dahulu projek di Plane tempat Anda bermaksud memigrasikan data Jira Anda. Setelah projek dibuat, pilih di sini.",
      title_configure_jira: "Konfigurasi Jira",
      description_configure_jira: "Silakan pilih workspace Jira dari mana Anda ingin memigrasikan data Anda.",
      title_map_states: "Petakan Status",
      description_map_states: "Silakan pilih status Jira yang ingin Anda petakan ke status projek Plane.",
      title_map_priorities: "Petakan Prioritas",
      description_map_priorities: "Silakan pilih prioritas Jira yang ingin Anda petakan ke prioritas projek Plane.",
      title_summary: "Ringkasan",
      description_summary: "Berikut adalah ringkasan data yang akan dimigrasikan dari Jira ke Plane.",
    },
  },
  notion_importer: {
    notion_importer_description: "Impor data Notion Anda ke proyek Plane.",
    steps: {
      title_upload_zip: "Unggah ZIP yang Diekspor dari Notion",
      description_upload_zip: "Silakan unggah file ZIP yang berisi data Notion Anda.",
    },
    upload: {
      drop_file_here: "Jatuhkan file zip Notion Anda di sini",
      upload_title: "Unggah Ekspor Notion",
      upload_from_url: "Impor dari URL",
      upload_from_url_description: "Tempel URL publik ekspor ZIP Anda untuk melanjutkan.",
      drag_drop_description: "Seret dan jatuhkan file zip ekspor Notion Anda, atau klik untuk menelusuri",
      file_type_restriction: "Hanya file .zip yang diekspor dari Notion yang didukung",
      select_file: "Pilih File",
      uploading: "Mengunggah...",
      preparing_upload: "Mempersiapkan unggah...",
      confirming_upload: "Mengonfirmasi unggah...",
      confirming: "Mengonfirmasi...",
      upload_complete: "Unggah selesai",
      upload_failed: "Unggah gagal",
      start_import: "Mulai Impor",
      retry_upload: "Coba Unggah Lagi",
      upload: "Unggah",
      ready: "Siap",
      error: "Error",
      upload_complete_message: "Unggah selesai!",
      upload_complete_description: 'Klik "Mulai Impor" untuk memulai memproses data Notion Anda.',
      upload_progress_message: "Harap jangan tutup jendela ini.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Impor data Confluence Anda ke wiki Plane.",
    steps: {
      title_upload_zip: "Unggah ZIP yang Diekspor dari Confluence",
      description_upload_zip: "Silakan unggah file ZIP yang berisi data Confluence Anda.",
    },
    upload: {
      drop_file_here: "Jatuhkan file zip Confluence Anda di sini",
      upload_title: "Unggah Ekspor Confluence",
      upload_from_url: "Impor dari URL",
      upload_from_url_description: "Tempel URL publik ekspor ZIP Anda untuk melanjutkan.",
      drag_drop_description: "Seret dan jatuhkan file zip ekspor Confluence Anda, atau klik untuk menelusuri",
      file_type_restriction: "Hanya file .zip yang diekspor dari Confluence yang didukung",
      select_file: "Pilih File",
      uploading: "Mengunggah...",
      preparing_upload: "Mempersiapkan unggah...",
      confirming_upload: "Mengonfirmasi unggah...",
      confirming: "Mengonfirmasi...",
      upload_complete: "Unggah selesai",
      upload_failed: "Unggah gagal",
      start_import: "Mulai Impor",
      retry_upload: "Coba Unggah Lagi",
      upload: "Unggah",
      ready: "Siap",
      error: "Error",
      upload_complete_message: "Unggah selesai!",
      upload_complete_description: 'Klik "Mulai Impor" untuk memulai memproses data Confluence Anda.',
      upload_progress_message: "Harap jangan tutup jendela ini.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "Impor data CSV Anda ke dalam projek Plane.",
    steps: {
      title_configure_plane: "Konfigurasi Plane",
      description_configure_plane:
        "Silakan buat terlebih dahulu projek di Plane tempat Anda bermaksud memigrasikan data CSV Anda. Setelah projek dibuat, pilih di sini.",
      title_configure_csv: "Konfigurasi CSV",
      description_configure_csv:
        "Silakan unggah file CSV Anda dan konfigurasikan bidang yang akan dipetakan ke bidang Plane.",
    },
  },
  csv_importer: {
    csv_importer_description: "Impor item kerja dari file CSV ke proyek Plane.",
    steps: {
      title_select_project: "Pilih Proyek",
      description_select_project: "Silakan pilih proyek Plane tempat Anda ingin mengimpor item kerja Anda.",
      title_upload_csv: "Unggah CSV",
      description_upload_csv:
        "Unggah file CSV Anda yang berisi item kerja. File tersebut harus menyertakan kolom untuk nama, deskripsi, prioritas, tanggal, dan grup status.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "Impor data ClickUp Anda ke dalam projek Plane.",
    select_service_space: "Pilih {serviceName} Space",
    select_service_folder: "Pilih {serviceName} Folder",
    selected: "Terpilih",
    users: "Pengguna",
    steps: {
      title_configure_plane: "Konfigurasi Plane",
      description_configure_plane:
        "Silakan buat terlebih dahulu projek di Plane tempat Anda bermaksud memigrasikan data ClickUp Anda. Setelah projek dibuat, pilih di sini.",
      title_configure_clickup: "Konfigurasi ClickUp",
      description_configure_clickup:
        "Silakan pilih tim, ruang, dan folder ClickUp dari mana Anda ingin memigrasikan data Anda.",
      title_map_states: "Petakan Status",
      description_map_states:
        "Kami telah secara otomatis mencocokkan status ClickUp ke status Plane semampu kami. Silakan petakan status yang tersisa sebelum melanjutkan, Anda juga dapat membuat status dan memetakannya secara manual.",
      title_map_priorities: "Petakan Prioritas",
      description_map_priorities: "Silakan pilih prioritas ClickUp yang ingin Anda petakan ke prioritas projek Plane.",
      title_summary: "Ringkasan",
      description_summary: "Berikut adalah ringkasan data yang akan dimigrasikan dari ClickUp ke Plane.",
      pull_additional_data_title: "Impor komentar dan lampiran",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Bar",
          long_label: "Grafik bar",
          chart_models: {
            basic: "Dasar",
            stacked: "Bertumpuk",
            grouped: "Dikelompokkan",
          },
          orientation: {
            label: "Orientasi",
            horizontal: "Horizontal",
            vertical: "Vertikal",
            placeholder: "Tambah orientasi",
          },
          bar_color: "Warna bar",
        },
        line_chart: {
          short_label: "Garis",
          long_label: "Grafik garis",
          chart_models: {
            basic: "Dasar",
            multi_line: "Multi-garis",
          },
          line_color: "Warna garis",
          line_type: {
            label: "Tipe garis",
            solid: "Solid",
            dashed: "Putus-putus",
            placeholder: "Tambah tipe garis",
          },
        },
        area_chart: {
          short_label: "Area",
          long_label: "Grafik area",
          chart_models: {
            basic: "Dasar",
            stacked: "Bertumpuk",
            comparison: "Perbandingan",
          },
          fill_color: "Warna isi",
        },
        donut_chart: {
          short_label: "Donat",
          long_label: "Grafik donat",
          chart_models: {
            basic: "Dasar",
            progress: "Progres",
          },
          center_value: "Nilai tengah",
          completed_color: "Warna selesai",
        },
        pie_chart: {
          short_label: "Pai",
          long_label: "Grafik pai",
          chart_models: {
            basic: "Dasar",
          },
          group: {
            label: "Potongan dikelompokkan",
            group_thin_pieces: "Kelompokkan potongan tipis",
            minimum_threshold: {
              label: "Ambang batas minimum",
              placeholder: "Tambah ambang batas",
            },
            name_group: {
              label: "Nama kelompok",
              placeholder: '"Kurang dari 5%"',
            },
          },
          show_values: "Tampilkan nilai",
          value_type: {
            percentage: "Persentase",
            count: "Jumlah",
          },
        },
        text: {
          short_label: "Teks",
          long_label: "Teks",
          alignment: {
            label: "Perataan teks",
            left: "Kiri",
            center: "Tengah",
            right: "Kanan",
            placeholder: "Tambah perataan teks",
          },
          text_color: "Warna teks",
        },
      },
      color_palettes: {
        modern: "Modern",
        horizon: "Horizon",
        earthen: "Alam",
      },
      common: {
        add_widget: "Tambah widget",
        widget_title: {
          label: "Beri nama widget ini",
          placeholder: 'contoh, "Tugas kemarin", "Semua Selesai"',
        },
        chart_type: "Tipe grafik",
        visualization_type: {
          label: "Tipe visualisasi",
          placeholder: "Tambah tipe visualisasi",
        },
        date_group: {
          label: "Kelompok tanggal",
          placeholder: "Tambah kelompok tanggal",
        },
        group_by: "Kelompokkan berdasarkan",
        stack_by: "Tumpuk berdasarkan",
        daily: "Harian",
        weekly: "Mingguan",
        monthly: "Bulanan",
        yearly: "Tahunan",
        work_item_count: "Jumlah item kerja",
        estimate_point: "Poin estimasi",
        pending_work_item: "Item kerja tertunda",
        completed_work_item: "Item kerja selesai",
        in_progress_work_item: "Item kerja dalam proses",
        blocked_work_item: "Item kerja terblokir",
        work_item_due_this_week: "Item kerja jatuh tempo minggu ini",
        work_item_due_today: "Item kerja jatuh tempo hari ini",
        color_scheme: {
          label: "Skema warna",
          placeholder: "Tambah skema warna",
        },
        smoothing: "Penghalusan",
        markers: "Penanda",
        legends: "Legenda",
        tooltips: "Tooltips",
        opacity: {
          label: "Opasitas",
          placeholder: "Tambah opasitas",
        },
        border: "Batas",
        widget_configuration: "Konfigurasi widget",
        configure_widget: "Konfigurasi widget",
        guides: "Panduan",
        style: "Gaya",
        area_appearance: "Tampilan area",
        comparison_line_appearance: "Tampilan garis pembanding",
        add_property: "Tambah properti",
        add_metric: "Tambah metrik",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
          stacked: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
            group_by: "Tumpuk berdasarkan tidak memiliki nilai.",
          },
          grouped: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
            group_by: "Kelompokkan berdasarkan tidak memiliki nilai.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
          multi_line: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
            group_by: "Kelompokkan berdasarkan tidak memiliki nilai.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
          stacked: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
            group_by: "Tumpuk berdasarkan tidak memiliki nilai.",
          },
          comparison: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
          progress: {
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "Sumbu x tidak memiliki nilai.",
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
        },
        text: {
          basic: {
            y_axis_metric: "Metrik tidak memiliki nilai.",
          },
        },
        ask_admin: "Tanyakan admin Anda untuk mengonfigurasi widget ini.",
      },
    },
    create_modal: {
      heading: {
        create: "Buat dashboard baru",
        update: "Perbarui dashboard",
      },
      title: {
        label: "Beri nama dashboard Anda.",
        placeholder: '"Kapasitas antar proyek", "Beban kerja berdasarkan tim", "Status di seluruh proyek"',
        required_error: "Judul diperlukan",
      },
      project: {
        label: "Pilih proyek",
        placeholder: "Data dari proyek ini akan menggerakkan dashboard ini.",
        required_error: "Proyek diperlukan",
      },
      create_dashboard: "Buat dashboard",
      update_dashboard: "Perbarui dashboard",
    },
    delete_modal: {
      heading: "Hapus dashboard",
    },
    empty_state: {
      feature_flag: {
        title: "Tampilkan kemajuan Anda dalam dashboard on-demand dan permanen.",
        description:
          "Buat dashboard apa pun yang Anda butuhkan dan sesuaikan bagaimana data Anda ditampilkan untuk presentasi sempurna dari kemajuan Anda.",
        coming_soon_to_mobile: "Segera hadir di aplikasi mobile",
        card_1: {
          title: "Untuk semua proyek Anda",
          description:
            "Dapatkan tampilan menyeluruh workspace Anda dengan semua proyek atau pilah data kerja Anda untuk tampilan sempurna dari kemajuan Anda.",
        },
        card_2: {
          title: "Untuk semua data di Plane",
          description:
            "Lampaui Analitik bawaan dan grafik Siklus yang sudah jadi untuk melihat tim, inisiatif, atau hal lain seperti yang belum pernah Anda lihat sebelumnya.",
        },
        card_3: {
          title: "Untuk semua kebutuhan visualisasi data Anda",
          description:
            "Pilih dari beberapa grafik yang dapat disesuaikan dengan kontrol detail untuk melihat dan menampilkan data kerja Anda persis seperti yang Anda inginkan.",
        },
        card_4: {
          title: "On-demand dan permanen",
          description:
            "Bangun sekali, simpan selamanya dengan penyegaran otomatis data Anda, penanda kontekstual untuk perubahan cakupan, dan tautan permanen yang dapat dibagikan.",
        },
        card_5: {
          title: "Ekspor dan komunikasi terjadwal",
          description:
            "Untuk saat-saat ketika tautan tidak berfungsi, keluarkan dashboard Anda ke PDF sekali pakai atau jadwalkan untuk dikirim ke pemangku kepentingan secara otomatis.",
        },
        card_6: {
          title: "Tata letak otomatis untuk semua perangkat",
          description:
            "Ubah ukuran widget Anda untuk tata letak yang Anda inginkan dan lihat sama persis di ponsel, tablet, dan browser lainnya.",
        },
      },
      dashboards_list: {
        title:
          "Visualisasikan data dalam widget, buat dashboard Anda dengan widget, dan lihat yang terbaru sesuai permintaan.",
        description:
          "Buat dashboard Anda dengan Widget Kustom yang menampilkan data dalam cakupan yang Anda tentukan. Dapatkan dashboard untuk semua pekerjaan Anda di seluruh proyek dan tim dan bagikan tautan permanen dengan pemangku kepentingan untuk pelacakan sesuai permintaan.",
      },
      dashboards_search: {
        title: "Itu tidak cocok dengan nama dashboard.",
        description: "Pastikan kueri Anda benar atau coba kueri lain.",
      },
      widgets_list: {
        title: "Visualisasikan data Anda sesuai keinginan.",
        description: `Gunakan garis, bar, pai, dan format lainnya untuk melihat data Anda
sesuai keinginan dari sumber yang Anda tentukan.`,
      },
      widget_data: {
        title: "Tidak ada yang bisa dilihat di sini",
        description: "Segarkan atau tambahkan data untuk melihatnya di sini.",
      },
    },
    common: {
      editing: "Mengedit",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Izinkan item kerja baru",
      work_item_creation_disable_tooltip: "Pembuatan item kerja dinonaktifkan untuk status ini",
      default_state: "Status default memungkinkan semua anggota membuat item kerja baru. Ini tidak dapat diubah",
      state_change_count:
        "{count, plural, one {1 perubahan status diizinkan} other {{count} perubahan status diizinkan}}",
      movers_count: "{count, plural, one {1 reviewer terdaftar} other {{count} reviewer terdaftar}}",
      state_changes: {
        label: {
          default: "Tambah perubahan status yang diizinkan",
          loading: "Menambahkan perubahan status yang diizinkan",
        },
        move_to: "Ubah status ke",
        movers: {
          label: "Ketika ditinjau oleh",
          tooltip: "Reviewer adalah orang yang diizinkan untuk memindahkan item kerja dari satu status ke status lain.",
          add: "Tambah reviewer",
        },
      },
    },
    workflow_disabled: {
      title: "Anda tidak dapat memindahkan item kerja ini ke sini.",
    },
    workflow_enabled: {
      label: "Perubahan status",
    },
    workflow_tree: {
      label: "Untuk item kerja di",
      state_change_label: "dapat memindahkannya ke",
    },
    empty_state: {
      upgrade: {
        title: "Kendalikan kekacauan perubahan dan tinjauan dengan Workflows.",
        description:
          "Tetapkan aturan untuk ke mana pekerjaan Anda bergerak, oleh siapa, dan kapan dengan Workflows di Plane.",
      },
    },
    quick_actions: {
      view_change_history: "Lihat riwayat perubahan",
      reset_workflow: "Atur ulang workflow",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Apakah Anda yakin ingin mengatur ulang workflow ini?",
        description:
          "Jika Anda mengatur ulang workflow ini, semua aturan perubahan status Anda akan dihapus dan Anda harus membuatnya lagi untuk menjalankannya di proyek ini.",
      },
      delete_state_change: {
        title: "Apakah Anda yakin ingin menghapus aturan perubahan status ini?",
        description:
          "Setelah dihapus, Anda tidak dapat membatalkan perubahan ini dan Anda harus mengatur aturan lagi jika Anda ingin menjalankannya untuk proyek ini.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "{action} workflow",
        success: {
          title: "Berhasil",
          message: "Workflow {action} berhasil",
        },
        error: {
          title: "Error",
          message: "Workflow tidak dapat {action}. Silakan coba lagi.",
        },
      },
      reset: {
        success: {
          title: "Berhasil",
          message: "Workflow berhasil diatur ulang",
        },
        error: {
          title: "Error mengatur ulang workflow",
          message: "Workflow tidak dapat diatur ulang. Silakan coba lagi.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Error menambahkan aturan perubahan status",
          message: "Aturan perubahan status tidak dapat ditambahkan. Silakan coba lagi.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Error memodifikasi aturan perubahan status",
          message: "Aturan perubahan status tidak dapat dimodifikasi. Silakan coba lagi.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Error menghapus aturan perubahan status",
          message: "Aturan perubahan status tidak dapat dihapus. Silakan coba lagi.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Error memodifikasi reviewer aturan perubahan status",
          message: "Reviewer aturan perubahan status tidak dapat dimodifikasi. Silakan coba lagi.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Pelanggan} other {Pelanggan}}",
    open: "Buka pelanggan",
    dropdown: {
      placeholder: "Pilih pelanggan",
      required: "Silakan pilih pelanggan",
      no_selection: "Tidak ada pelanggan",
    },
    upgrade: {
      title: "Prioritaskan dan kelola pekerjaan dengan Pelanggan.",
      description: "Petakan pekerjaan Anda ke pelanggan dan prioritaskan berdasarkan atribut pelanggan.",
    },
    properties: {
      default: {
        title: "Properti default",
        customer_name: {
          name: "Nama pelanggan",
          placeholder: "Ini bisa nama orang atau bisnis",
          validation: {
            required: "Nama pelanggan diperlukan.",
            max_length: "Nama pelanggan tidak boleh lebih dari 255 karakter.",
          },
        },
        description: {
          name: "Deskripsi",
          validation: {},
        },
        email: {
          name: "Email",
          placeholder: "Masukkan email",
          validation: {
            required: "Email diperlukan.",
            pattern: "Alamat email tidak valid.",
          },
        },
        website_url: {
          name: "Website",
          placeholder: "URL apa pun dengan https:// akan berfungsi.",
          placeholder_short: "Tambah website",
          validation: {
            pattern: "URL website tidak valid",
          },
        },
        employees: {
          name: "Karyawan",
          placeholder: "Jumlah karyawan jika pelanggan Anda adalah bisnis.",
          validation: {
            min_length: "Karyawan tidak boleh kurang dari 0.",
          },
        },
        size: {
          name: "Ukuran",
          placeholder: "Tambah ukuran perusahaan",
          validation: {
            min_length: "Ukuran tidak valid",
          },
        },
        domain: {
          name: "Industri",
          placeholder: "Retail, e-Commerce, Fintech, Perbankan",
          placeholder_short: "Tambah industri",
          validation: {},
        },
        stage: {
          name: "Tahap",
          placeholder: "Pilih tahap",
          validation: {},
        },
        contract_status: {
          name: "Status Kontrak",
          placeholder: "Pilih status kontrak",
          validation: {},
        },
        revenue: {
          name: "Pendapatan",
          placeholder: "Ini adalah pendapatan yang dihasilkan pelanggan Anda setiap tahun.",
          validation: {
            min_length: "Pendapatan tidak boleh kurang dari 0.",
          },
        },
      },
      custom: {
        title: "Properti kustom",
        info: "Tambahkan atribut unik pelanggan Anda ke Plane sehingga Anda dapat mengelola item kerja atau catatan pelanggan dengan lebih baik.",
      },
      empty_state: {
        title: "Anda belum memiliki properti kustom.",
        description:
          "Properti kustom yang ingin Anda lihat di item kerja, di tempat lain di Plane, atau di luar Plane di CRM atau alat lain, akan muncul di sini ketika Anda menambahkannya.",
      },
      add: {
        primary_button: "Tambah properti baru",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Lead yang berkualifikasi penjualan",
      contract_negotiation: "Negosiasi kontrak",
      closed_won: "Menang",
      closed_lost: "Kalah",
    },
    contract_status: {
      active: "Aktif",
      pre_contract: "Pra-kontrak",
      signed: "Ditandatangani",
      inactive: "Tidak aktif",
    },
    empty_state: {
      detail: {
        title: "Kami tidak dapat menemukan catatan pelanggan itu.",
        description: "Tautan ke catatan ini mungkin salah atau catatan ini mungkin telah dihapus.",
        primary_button: "Pergi ke pelanggan",
        secondary_button: "Tambah pelanggan",
      },
      search: {
        title: "Sepertinya Anda tidak memiliki catatan pelanggan yang cocok dengan istilah itu.",
        description:
          "Coba dengan istilah pencarian lain atau hubungi kami jika Anda yakin seharusnya melihat hasil untuk istilah itu.",
      },
      list: {
        title: "Kelola volume, ritme, dan aliran pekerjaan Anda berdasarkan apa yang penting bagi pelanggan Anda.",
        description:
          "Dengan Pelanggan, fitur khusus Plane, Anda sekarang dapat membuat pelanggan baru dari awal dan menghubungkannya dengan pekerjaan Anda. Segera, Anda akan membawa mereka dari alat lain bersama dengan atribut kustom mereka yang penting bagi Anda.",
        primary_button: "Tambahkan pelanggan pertama Anda",
      },
    },
    settings: {
      unauthorized: "Anda tidak diizinkan untuk mengakses halaman ini.",
      description: "Lacak dan kelola hubungan pelanggan dalam alur kerja Anda.",
      enable: "Aktifkan Pelanggan",
      toasts: {
        enable: {
          loading: "Mengaktifkan fitur pelanggan...",
          success: {
            title: "Anda telah mengaktifkan Pelanggan untuk workspace ini.",
            message: "Anda tidak dapat mematikannya lagi.",
          },
          error: {
            title: "Kami tidak dapat mengaktifkan Pelanggan kali ini.",
            message: "Coba lagi atau kembali ke layar ini nanti. Jika masih tidak berfungsi.",
            action: "Bicara dengan dukungan",
          },
        },
        disable: {
          loading: "Menonaktifkan fitur pelanggan...",
          success: {
            title: "Pelanggan dinonaktifkan",
            message: "Fitur pelanggan berhasil dinonaktifkan!",
          },
          error: {
            title: "Error",
            message: "Gagal menonaktifkan fitur pelanggan!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Kami tidak bisa mendapatkan daftar pelanggan Anda.",
          message: "Coba lagi atau segarkan halaman ini.",
        },
      },
      copy_link: {
        title: "Anda menyalin tautan langsung ke pelanggan ini.",
        message: "Tempel di mana saja dan itu akan langsung mengarah kembali ke sini.",
      },
      create: {
        success: {
          title: "{customer_name} sekarang tersedia",
          message: "Anda dapat mereferensikan pelanggan ini dalam item kerja dan juga melacak permintaan dari mereka.",
          actions: {
            view: "Lihat",
            copy_link: "Salin tautan",
            copied: "Disalin!",
          },
        },
        error: {
          title: "Kami tidak dapat membuat catatan itu kali ini.",
          message: "Coba simpan lagi atau salin teks yang belum disimpan ke entri baru, sebaiknya di tab lain.",
        },
      },
      update: {
        success: {
          title: "Sukses!",
          message: "Pelanggan berhasil diperbarui!",
        },
        error: {
          title: "Error!",
          message: "Tidak dapat memperbarui pelanggan. Coba lagi!",
        },
      },
      logo: {
        error: {
          title: "Kami tidak dapat mengunggah logo pelanggan.",
          message: "Coba simpan logo lagi atau mulai dari awal.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Anda telah menghapus item kerja dari catatan pelanggan ini.",
            message: "Kami juga telah secara otomatis menghapus pelanggan ini dari item kerja.",
          },
          error: {
            title: "Kami tidak dapat menghapus item kerja dari catatan pelanggan ini kali ini.",
            message: "Kami juga telah secara otomatis menghapus pelanggan ini dari item kerja.",
          },
        },
        add: {
          error: {
            title: "Kami tidak dapat menambahkan item kerja ke catatan pelanggan ini kali ini.",
            message: "Coba tambahkan item kerja itu lagi atau kembali nanti. Jika masih tidak berfungsi, hubungi kami.",
          },
          success: {
            title: "Anda telah menambahkan item kerja ke catatan pelanggan ini.",
            message: "Kami juga telah secara otomatis menambahkan pelanggan ini ke item kerja.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Edit",
      copy_link: "Salin tautan ke pelanggan",
      delete: "Hapus",
    },
    create: {
      label: "Buat catatan pelanggan",
      loading: "Membuat",
      cancel: "Batal",
    },
    update: {
      label: "Perbarui pelanggan",
      loading: "Memperbarui",
    },
    delete: {
      title: "Apakah Anda yakin ingin menghapus catatan pelanggan {customer_name}?",
      description:
        "Semua data terkait dengan catatan ini akan dihapus secara permanen. Anda tidak dapat memulihkan catatan ini nanti.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Belum ada permintaan untuk ditampilkan.",
          description: "Buat permintaan dari pelanggan Anda sehingga Anda dapat menautkannya ke item kerja.",
          button: "Tambah permintaan baru",
        },
        search: {
          title: "Sepertinya Anda tidak memiliki permintaan yang cocok dengan istilah itu.",
          description:
            "Coba dengan istilah pencarian lain atau hubungi kami jika Anda yakin seharusnya melihat hasil untuk istilah itu.",
        },
      },
      label: "{count, plural, one {Permintaan} other {Permintaan}}",
      add: "Tambah permintaan",
      create: "Buat permintaan",
      update: "Perbarui permintaan",
      form: {
        name: {
          placeholder: "Beri nama permintaan ini",
          validation: {
            required: "Nama diperlukan.",
            max_length: "Nama permintaan tidak boleh melebihi 255 karakter.",
          },
        },
        description: {
          placeholder: "Jelaskan sifat permintaan atau tempel komentar pelanggan ini dari alat lain.",
        },
        source: {
          add: "Tambah sumber",
          update: "Perbarui sumber",
          url: {
            label: "URL",
            required: "Url diperlukan",
            invalid: "URL website tidak valid",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Tautan disalin",
          message: "Tautan permintaan pelanggan disalin ke clipboard.",
        },
        attachment: {
          upload: {
            loading: "Mengunggah lampiran...",
            success: {
              title: "Lampiran diunggah",
              message: "Lampiran telah berhasil diunggah.",
            },
            error: {
              title: "Lampiran tidak diunggah",
              message: "Lampiran tidak dapat diunggah.",
            },
          },
          size: {
            error: {
              title: "Error!",
              message: "Hanya satu file yang dapat diunggah dalam satu waktu.",
            },
          },
          length: {
            message: "File harus berukuran {size}MB atau kurang",
          },
          remove: {
            success: {
              title: "Lampiran dihapus",
              message: "Lampiran telah berhasil dihapus",
            },
            error: {
              title: "Lampiran tidak dihapus",
              message: "Lampiran tidak dapat dihapus",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Sukses!",
              message: "Sumber berhasil diperbarui!",
            },
            error: {
              title: "Error!",
              message: "Tidak dapat memperbarui sumber.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Error!",
              message: "Tidak dapat menambahkan item kerja ke permintaan. Coba lagi.",
            },
            success: {
              title: "Sukses!",
              message: "Item kerja ditambahkan ke permintaan.",
            },
          },
        },
        update: {
          success: {
            message: "Permintaan berhasil diperbarui!",
            title: "Sukses!",
          },
          error: {
            title: "Error!",
            message: "Tidak dapat memperbarui permintaan. Coba lagi!",
          },
        },
        create: {
          success: {
            message: "Permintaan berhasil dibuat!",
            title: "Sukses!",
          },
          error: {
            title: "Error!",
            message: "Tidak dapat membuat permintaan. Coba lagi!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Item kerja tertaut",
      link: "Tautkan item kerja",
      empty_state: {
        list: {
          title: "Sepertinya Anda belum memiliki item kerja tertaut ke pelanggan ini.",
          description:
            "Tautkan item kerja yang ada dari proyek mana pun di sini sehingga Anda dapat melacaknya berdasarkan pelanggan ini.",
          button: "Tautkan item kerja",
        },
      },
      action: {
        remove_epic: "Hapus epic",
        remove: "Hapus item kerja",
      },
    },
    sidebar: {
      properties: "Properti",
    },
  },
  templates: {
    settings: {
      title: "Template",
      description:
        "Hemat 80% waktu yang dihabiskan untuk membuat proyek, item kerja, dan halaman ketika Anda menggunakan template.",
      options: {
        project: {
          label: "Template proyek",
        },
        work_item: {
          label: "Template item kerja",
        },
        page: {
          label: "Template halaman",
        },
      },
      create_template: {
        label: "Buat template",
        no_permission: {
          project: "Hubungi admin proyek Anda untuk membuat template",
          workspace: "Hubungi admin workspace Anda untuk membuat template",
        },
      },
      use_template: {
        button: {
          default: "Gunakan template",
          loading: "Menggunakan",
        },
      },
      template_source: {
        workspace: {
          info: "Berasal dari workspace",
        },
        project: {
          info: "Berasal dari proyek",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Beri nama template proyek Anda.",
              validation: {
                required: "Nama template diperlukan",
                maxLength: "Nama template harus kurang dari 255 karakter",
              },
            },
            description: {
              placeholder: "Jelaskan kapan dan bagaimana menggunakan template ini.",
            },
          },
          name: {
            placeholder: "Beri nama proyek Anda.",
            validation: {
              required: "Judul proyek diperlukan",
              maxLength: "Judul proyek harus kurang dari 255 karakter",
            },
          },
          description: {
            placeholder: "Jelaskan tujuan dan sasaran proyek ini.",
          },
          button: {
            create: "Buat template proyek",
            update: "Perbarui template proyek",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "Beri nama template item kerja Anda.",
              validation: {
                required: "Nama template diperlukan",
                maxLength: "Nama template harus kurang dari 255 karakter",
              },
            },
            description: {
              placeholder: "Jelaskan kapan dan bagaimana menggunakan template ini.",
            },
          },
          name: {
            placeholder: "Beri judul untuk item kerja ini.",
            validation: {
              required: "Judul item kerja diperlukan",
              maxLength: "Judul item kerja harus kurang dari 255 karakter",
            },
          },
          description: {
            placeholder:
              "Jelaskan item kerja ini sehingga jelas apa yang akan Anda capai ketika Anda menyelesaikannya.",
          },
          button: {
            create: "Buat template item kerja",
            update: "Perbarui template item kerja",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Beri nama template halaman Anda.",
              validation: {
                required: "Nama template diperlukan",
                maxLength: "Nama template harus kurang dari 255 karakter",
              },
            },
            description: {
              placeholder: "Jelaskan kapan dan bagaimana menggunakan template ini.",
            },
          },
          name: {
            placeholder: "Halaman tidak berjudul",
            validation: {
              maxLength: "Nama halaman harus kurang dari 255 karakter",
            },
          },
          button: {
            create: "Buat template halaman",
            update: "Perbarui template halaman",
          },
        },
        publish: {
          action: "{isPublished, select, true {Pengaturan publikasi} other {Publikasikan ke Marketplace}}",
          unpublish_action: "Hapus dari Marketplace",
          title: "Buat template Anda dapat dikenali dan ditemukan.",
          name: {
            label: "Nama template",
            placeholder: "Beri nama template Anda",
            validation: {
              required: "Nama template diperlukan",
              maxLength: "Nama template harus kurang dari 255 karakter",
            },
          },
          short_description: {
            label: "Deskripsi singkat",
            placeholder: "Template ini cocok untuk Manajer Proyek yang mengelola beberapa proyek sekaligus.",
            validation: {
              required: "Deskripsi singkat diperlukan",
            },
          },
          description: {
            label: "Deskripsi",
            placeholder: `Perbaiki produktivitas dan sederhanakan komunikasi dengan integrasi Speech-To-Text kami.
• Transkripsi real-time: Konversi kata yang diucapkan menjadi teks yang akurat secara instan.
• Membuat tugas dan komentar: Tambahkan tugas, deskripsi, dan komentar melalui perintah suara.`,
            validation: {
              required: "Deskripsi diperlukan",
            },
          },
          category: {
            label: "Kategori",
            placeholder: "Pilih di mana Anda pikir ini cocok paling baik. Anda dapat memilih lebih dari satu.",
            validation: {
              required: "Setidaknya satu kategori diperlukan",
            },
          },
          keywords: {
            label: "Kata kunci",
            placeholder: "Gunakan istilah yang Anda pikir pengguna akan cari ketika mencari template ini.",
            helperText:
              "Masukkan kata kunci yang dipisahkan dengan koma yang akan membantu orang menemukan ini dari pencarian.",
            validation: {
              required: "Setidaknya satu kata kunci diperlukan",
            },
          },
          company_name: {
            label: "Nama perusahaan",
            placeholder: "Plane",
            validation: {
              required: "Nama perusahaan diperlukan",
              maxLength: "Nama perusahaan harus kurang dari 255 karakter",
            },
          },
          contact_email: {
            label: "Email dukungan",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Alamat email tidak valid",
              required: "Email dukungan diperlukan",
              maxLength: "Email dukungan harus kurang dari 255 karakter",
            },
          },
          privacy_policy_url: {
            label: "Tautan ke kebijakan privasi Anda",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "URL tidak valid",
              maxLength: "URL harus kurang dari 800 karakter",
            },
          },
          terms_of_service_url: {
            label: "Tautan ke kebijakan penggunaan Anda",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "URL tidak valid",
              maxLength: "URL harus kurang dari 800 karakter",
            },
          },
          cover_image: {
            label: "Tambahkan gambar cover yang akan ditampilkan di marketplace",
            upload_title: "Unggah gambar cover",
            upload_placeholder: "Klik untuk mengunggah atau seret dan lepas untuk mengunggah gambar cover",
            drop_here: "Letakkan di sini",
            click_to_upload: "Klik untuk mengunggah",
            invalid_file_or_exceeds_size_limit: "File tidak valid atau melebihi batas ukuran. Silakan coba lagi.",
            upload_and_save: "Unggah dan simpan",
            uploading: "Mengunggah",
            remove: "Hapus",
            removing: "Menghapus",
            validation: {
              required: "Gambar cover diperlukan",
            },
          },
          attach_screenshots: {
            label: "Sertakan dokumen dan gambar yang Anda pikir akan membuat pengguna template.",
            validation: {
              required: "Setidaknya satu screenshot diperlukan",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Template",
        description:
          "Dengan template proyek, item kerja, dan halaman di Plane, Anda tidak perlu membuat proyek dari awal atau mengatur properti item kerja secara manual.",
        sub_description: "Dapatkan kembali 80% waktu administrasi Anda saat menggunakan Template.",
      },
      no_templates: {
        button: "Buat template pertama Anda",
      },
      no_labels: {
        description: " Belum ada label. Buat label untuk membantu mengatur dan memfilter item kerja dalam proyek Anda.",
      },
      no_work_items: {
        description: "Belum ada item kerja. Tambahkan satu untuk membantu mengatur pekerjaan Anda lebih baik.",
      },
      no_sub_work_items: {
        description: "Belum ada sub-item kerja. Tambahkan satu untuk membantu mengatur pekerjaan Anda lebih baik.",
      },
      page: {
        no_templates: {
          title: "Tidak ada template yang dapat Anda akses.",
          description: "Silakan buat template",
        },
        no_results: {
          title: "Itu tidak cocok dengan template.",
          description: "Coba cari dengan istilah lain.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Template dibuat",
          message: "{templateName}, template {templateType}, sekarang tersedia untuk workspace Anda.",
        },
        error: {
          title: "Kami tidak dapat membuat template itu kali ini.",
          message: "Coba simpan detail Anda lagi atau salin ke template baru, sebaiknya di tab lain.",
        },
      },
      update: {
        success: {
          title: "Template diubah",
          message: "{templateName}, template {templateType}, telah diubah.",
        },
        error: {
          title: "Kami tidak dapat menyimpan perubahan ke template ini.",
          message:
            "Coba simpan detail Anda lagi atau kembali ke template ini nanti. Jika masih ada masalah, hubungi kami.",
        },
      },
      delete: {
        success: {
          title: "Template dihapus",
          message: "{templateName}, template {templateType}, sekarang telah dihapus dari workspace Anda.",
        },
        error: {
          title: "Kami tidak dapat menghapus template itu.",
          message: "Coba hapus lagi atau kembali nanti. Jika Anda tidak dapat menghapusnya, hubungi kami.",
        },
      },
      unpublish: {
        success: {
          title: "Template dihapus dari publikasi",
          message: "{templateName}, template {templateType}, telah dihapus dari publikasi.",
        },
        error: {
          title: "Kami tidak dapat menghapus template itu dari publikasi.",
          message:
            "Coba hapus dari publikasi lagi atau kembali nanti. Jika Anda tidak dapat menghapusnya dari publikasi, hubungi kami.",
        },
      },
    },
    delete_confirmation: {
      title: "Hapus template",
      description: {
        prefix: "Apakah Anda yakin ingin menghapus template-",
        suffix: "? Semua data terkait template akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
      },
    },
    unpublish_confirmation: {
      title: "Hapus template dari publikasi",
      description: {
        prefix: "Apakah Anda yakin ingin menghapus template-",
        suffix: " dari publikasi? Template ini tidak akan lagi tersedia untuk pengguna di marketplace.",
      },
    },
    dropdown: {
      add: {
        work_item: "Tambah template baru",
        project: "Tambah template baru",
      },
      label: {
        project: "Pilih template proyek",
        page: "Pilih template",
      },
      tooltip: {
        work_item: "Pilih template item kerja",
      },
      no_results: {
        work_item: "Tidak ada template ditemukan.",
        project: "Tidak ada template ditemukan.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Buat item kerja",
      "sub-title": "Beritahu tim tentang apa yang ingin Anda kerjakan.",
      name: "Nama",
      email: "Email",
      about: "Tentang apa item kerja ini?",
      description: "Jelaskan apa yang seharusnya terjadi",
      description_placeholder:
        "Tambahkan detail sebanyak yang Anda suka untuk membantu tim mengidentifikasi situasi dan kebutuhan Anda.",
      loading: "Membuat",
      create_work_item: "Buat item kerja",
      errors: {
        name: "Nama wajib diisi",
        name_max_length: "Nama harus kurang dari 255 karakter",
        email: "Email wajib diisi",
        email_invalid: "Alamat email tidak valid",
        title: "Judul wajib diisi",
        title_max_length: "Judul harus kurang dari 255 karakter",
      },
    },
    success: {
      title: "Item kerja Anda sekarang ada di antrean tim.",
      description: "Tim sekarang dapat menyetujui atau membuang item kerja ini dari antrean penerimaan mereka.",
      primary_button: {
        text: "Tambah item kerja lain",
      },
      secondary_button: {
        text: "Pelajari lebih lanjut tentang Penerimaan",
      },
    },
    how_it_works: {
      title: "Bagaimana cara kerjanya?",
      heading: "Ini adalah formulir Penerimaan.",
      description:
        "Penerimaan adalah fitur Plane yang memungkinkan admin dan manajer proyek menerima item kerja dari luar ke proyek mereka.",
      steps: {
        step_1: "Formulir singkat ini memungkinkan Anda membuat item kerja baru di proyek Plane.",
        step_2: "Saat Anda mengirim formulir ini, item kerja baru dibuat di Penerimaan proyek tersebut.",
        step_3: "Seseorang dari proyek atau tim akan meninjau ini.",
        step_4:
          "Jika mereka menyetujui, item kerja ini akan dipindahkan ke antrean kerja proyek. Jika tidak, akan ditolak.",
        step_5:
          "Untuk memeriksa status item kerja tersebut, hubungi manajer proyek, admin, atau siapa pun yang mengirimi Anda tautan ke halaman ini.",
      },
    },
    type_forms: {
      select_types: {
        title: "Pilih jenis item kerja",
        search_placeholder: "Cari jenis item kerja",
      },
      actions: {
        select_properties: "Pilih properti",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Item kerja berulang",
      description:
        "Atur pekerjaan berulang sekali, dan kami akan mengurus ulangannya. Anda akan melihat semuanya di sini ketika waktunya tiba.",
      new_recurring_work_item: "Item kerja berulang baru",
      update_recurring_work_item: "Perbarui item kerja berulang",
      form: {
        interval: {
          title: "Jadwal",
          start_date: {
            validation: {
              required: "Tanggal mulai wajib diisi",
            },
          },
          interval_type: {
            validation: {
              required: "Jenis interval wajib diisi",
            },
          },
        },
        button: {
          create: "Buat item kerja berulang",
          update: "Perbarui item kerja berulang",
        },
      },
      create_button: {
        label: "Buat item kerja berulang",
        no_permission: "Hubungi admin proyek Anda untuk membuat item kerja berulang",
      },
    },
    empty_state: {
      upgrade: {
        title: "Pekerjaan Anda, otomatis",
        description:
          "Atur sekali saja. Kami akan mengingatkannya saat waktunya tiba. Tingkatkan ke Bisnis untuk membuat pekerjaan berulang terasa mudah.",
      },
      no_templates: {
        button: "Buat item kerja berulang pertama Anda",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Item kerja berulang berhasil dibuat",
          message: "{name}, item kerja berulang, sekarang tersedia di ruang kerja Anda.",
        },
        error: {
          title: "Kami tidak dapat membuat item kerja berulang kali ini.",
          message: "Coba simpan detail Anda lagi atau salin ke item kerja berulang baru, sebaiknya di tab lain.",
        },
      },
      update: {
        success: {
          title: "Item kerja berulang berhasil diubah",
          message: "{name}, item kerja berulang, telah diubah.",
        },
        error: {
          title: "Kami tidak dapat menyimpan perubahan pada item kerja berulang ini.",
          message:
            "Coba simpan detail Anda lagi atau kembali ke item kerja berulang ini nanti. Jika masih ada masalah, hubungi kami.",
        },
      },
      delete: {
        success: {
          title: "Item kerja berulang berhasil dihapus",
          message: "{name}, item kerja berulang, telah dihapus dari ruang kerja Anda.",
        },
        error: {
          title: "Kami tidak dapat menghapus item kerja berulang ini.",
          message: "Coba hapus lagi atau kembali nanti. Jika Anda masih tidak bisa menghapusnya, hubungi kami.",
        },
      },
    },
    delete_confirmation: {
      title: "Hapus item kerja berulang",
      description: {
        prefix: "Apakah Anda yakin ingin menghapus item kerja berulang-",
        suffix:
          "? Semua data terkait item kerja berulang akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
      },
    },
  },
  automations: {
    settings: {
      title: "Otomatisasi kustom",
      create_automation: "Buat otomatisasi",
    },
    scope: {
      label: "Cakupan",
      run_on: "Jalankan pada",
    },
    trigger: {
      label: "Pemicu",
      add_trigger: "Tambah pemicu",
      sidebar_header: "Konfigurasi pemicu",
      input_label: "Apa pemicu untuk otomatisasi ini?",
      input_placeholder: "Pilih opsi",
      button: {
        previous: "Kembali",
        next: "Tambah aksi",
      },
    },
    condition: {
      label: "Dengan syarat",
      add_condition: "Tambah kondisi",
      adding_condition: "Menambah kondisi",
    },
    action: {
      label: "Aksi",
      add_action: "Tambah aksi",
      sidebar_header: "Aksi",
      input_label: "Apa yang dilakukan otomatisasi ini?",
      input_placeholder: "Pilih opsi",
      handler_name: {
        add_comment: "Tambah komentar",
        change_property: "Ubah properti",
      },
      configuration: {
        label: "Konfigurasi",
        change_property: {
          placeholders: {
            property_name: "Pilih properti",
            change_type: "Pilih",
            property_value_select: "{count, plural, one{Pilih nilai} other{Pilih nilai}}",
            property_value_select_date: "Pilih tanggal",
          },
          validation: {
            property_name_required: "Nama properti diperlukan",
            change_type_required: "Jenis perubahan diperlukan",
            property_value_required: "Nilai properti diperlukan",
          },
        },
      },
      comment_block: {
        title: "Tambah komentar",
      },
      change_property_block: {
        title: "Ubah properti",
      },
      validation: {
        delete_only_action: "Nonaktifkan otomatisasi sebelum menghapus satu-satunya aksi.",
      },
    },
    conjunctions: {
      and: "Dan",
      or: "Atau",
      if: "Jika",
      then: "Maka",
    },
    enable: {
      alert: "Tekan 'Aktifkan' ketika otomatisasi Anda selesai. Setelah diaktifkan, otomatisasi akan siap dijalankan.",
      validation: {
        required: "Otomatisasi harus memiliki pemicu dan setidaknya satu aksi untuk dapat diaktifkan.",
      },
    },
    delete: {
      validation: {
        enabled: "Otomatisasi harus dinonaktifkan sebelum menghapusnya.",
      },
    },
    table: {
      title: "Judul otomatisasi",
      last_run_on: "Terakhir dijalankan pada",
      created_on: "Dibuat pada",
      last_updated_on: "Terakhir diperbarui pada",
      last_run_status: "Status terakhir dijalankan",
      average_duration: "Durasi rata-rata",
      owner: "Pemilik",
      executions: "Eksekusi",
    },
    create_modal: {
      heading: {
        create: "Buat otomatisasi",
        update: "Perbarui otomatisasi",
      },
      title: {
        placeholder: "Beri nama otomatisasi Anda.",
        required_error: "Judul diperlukan",
      },
      description: {
        placeholder: "Deskripsikan otomatisasi Anda.",
      },
      submit_button: {
        create: "Buat otomatisasi",
        update: "Perbarui otomatisasi",
      },
    },
    delete_modal: {
      heading: "Hapus otomatisasi",
    },
    activity: {
      filters: {
        show_fails: "Tampilkan kegagalan",
        all: "Semua",
        only_activity: "Hanya aktivitas",
        only_run_history: "Hanya riwayat eksekusi",
      },
      run_history: {
        initiator: "Pemrakarsa",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Berhasil!",
          message: "Otomatisasi berhasil dibuat.",
        },
        error: {
          title: "Error!",
          message: "Pembuatan otomatisasi gagal.",
        },
      },
      update: {
        success: {
          title: "Berhasil!",
          message: "Otomatisasi berhasil diperbarui.",
        },
        error: {
          title: "Error!",
          message: "Pembaruan otomatisasi gagal.",
        },
      },
      enable: {
        success: {
          title: "Berhasil!",
          message: "Otomatisasi berhasil diaktifkan.",
        },
        error: {
          title: "Error!",
          message: "Pengaktifan otomatisasi gagal.",
        },
      },
      disable: {
        success: {
          title: "Berhasil!",
          message: "Otomatisasi berhasil dinonaktifkan.",
        },
        error: {
          title: "Error!",
          message: "Penonaktifan otomatisasi gagal.",
        },
      },
      delete: {
        success: {
          title: "Otomatisasi dihapus",
          message: "{name}, otomatisasi, telah dihapus dari proyek Anda.",
        },
        error: {
          title: "Kami tidak dapat menghapus otomatisasi tersebut kali ini.",
          message: "Coba hapus lagi atau kembali nanti. Jika Anda masih tidak bisa menghapusnya, hubungi kami.",
        },
      },
      action: {
        create: {
          error: {
            title: "Error!",
            message: "Gagal membuat aksi. Silakan coba lagi!",
          },
        },
        update: {
          error: {
            title: "Error!",
            message: "Gagal memperbarui aksi. Silakan coba lagi!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Belum ada otomatisasi untuk ditampilkan.",
        description:
          "Otomatisasi membantu Anda menghilangkan tugas berulang dengan mengatur pemicu, kondisi, dan aksi. Buat satu untuk menghemat waktu dan menjaga pekerjaan berjalan dengan mudah.",
      },
      upgrade: {
        title: "Otomatisasi",
        description: "Otomatisasi adalah cara untuk mengotomatisasi tugas dalam proyek Anda.",
        sub_description: "Dapatkan kembali 80% waktu admin Anda ketika menggunakan Otomatisasi.",
      },
    },
  },
  sso: {
    header: "Identitas",
    description: "Konfigurasi domain Anda untuk mengakses fitur keamanan termasuk single sign-on.",
    domain_management: {
      header: "Manajemen domain",
      verified_domains: {
        header: "Domain terverifikasi",
        description: "Verifikasi kepemilikan domain email untuk mengaktifkan single sign-on.",
        button_text: "Tambah domain",
        list: {
          domain_name: "Nama domain",
          status: "Status",
          status_verified: "Terverifikasi",
          status_failed: "Gagal",
          status_pending: "Menunggu",
        },
        add_domain: {
          title: "Tambah domain",
          description: "Tambahkan domain Anda untuk mengonfigurasi SSO dan memverifikasinya.",
          form: {
            domain_label: "Domain",
            domain_placeholder: "plane.so",
            domain_required: "Domain wajib diisi",
            domain_invalid: "Masukkan nama domain yang valid (mis. plane.so)",
          },
          primary_button_text: "Tambah domain",
          primary_button_loading_text: "Menambahkan",
          toast: {
            success_title: "Berhasil!",
            success_message: "Domain berhasil ditambahkan. Silakan verifikasi dengan menambahkan catatan DNS TXT.",
            error_message: "Gagal menambahkan domain. Silakan coba lagi.",
          },
        },
        verify_domain: {
          title: "Verifikasi domain Anda",
          description: "Ikuti langkah-langkah ini untuk memverifikasi domain Anda.",
          instructions: {
            label: "Instruksi",
            step_1: "Buka pengaturan DNS untuk host domain Anda.",
            step_2: {
              part_1: "Buat sebuah",
              part_2: "catatan TXT",
              part_3: "dan tempelkan nilai catatan lengkap yang disediakan di bawah ini.",
            },
            step_3:
              "Pembaruan ini biasanya memakan waktu beberapa menit tetapi dapat memakan waktu hingga 72 jam untuk diselesaikan.",
            step_4: 'Klik "Verifikasi domain" untuk mengonfirmasi setelah catatan DNS Anda diperbarui.',
          },
          verification_code_label: "Nilai catatan TXT",
          verification_code_description: "Tambahkan catatan ini ke pengaturan DNS Anda",
          domain_label: "Domain",
          primary_button_text: "Verifikasi domain",
          primary_button_loading_text: "Memverifikasi",
          secondary_button_text: "Saya akan melakukannya nanti",
          toast: {
            success_title: "Berhasil!",
            success_message: "Domain berhasil diverifikasi.",
            error_message: "Gagal memverifikasi domain. Silakan coba lagi.",
          },
        },
        delete_domain: {
          title: "Hapus domain",
          description: {
            prefix: "Apakah Anda yakin ingin menghapus",
            suffix: "? Tindakan ini tidak dapat dibatalkan.",
          },
          primary_button_text: "Hapus",
          primary_button_loading_text: "Menghapus",
          secondary_button_text: "Batal",
          toast: {
            success_title: "Berhasil!",
            success_message: "Domain berhasil dihapus.",
            error_message: "Gagal menghapus domain. Silakan coba lagi.",
          },
        },
      },
    },
    providers: {
      header: "Single sign-on",
      disabled_message: "Tambahkan domain terverifikasi untuk mengonfigurasi SSO",
      configure: {
        create: "Konfigurasi",
        update: "Edit",
      },
      switch_alert_modal: {
        title: "Beralih metode SSO ke {newProviderShortName}?",
        content:
          "Anda akan mengaktifkan {newProviderLongName} ({newProviderShortName}). Tindakan ini akan secara otomatis menonaktifkan {activeProviderLongName} ({activeProviderShortName}). Pengguna yang mencoba masuk melalui {activeProviderShortName} tidak akan dapat mengakses platform sampai mereka beralih ke metode baru. Apakah Anda yakin ingin melanjutkan?",
        primary_button_text: "Beralih",
        primary_button_text_loading: "Beralih",
        secondary_button_text: "Batal",
      },
      form_section: {
        title: "Detail yang disediakan IdP untuk {workspaceName}",
      },
      form_action_buttons: {
        saving: "Menyimpan",
        save_changes: "Simpan perubahan",
        configure_only: "Hanya konfigurasi",
        configure_and_enable: "Konfigurasi dan aktifkan",
        default: "Simpan",
      },
      setup_details_section: {
        title: "{workspaceName} detail yang disediakan untuk IdP Anda",
        button_text: "Dapatkan detail pengaturan",
      },
      saml: {
        header: "Aktifkan SAML",
        description: "Konfigurasi penyedia identitas SAML Anda untuk mengaktifkan single sign-on.",
        configure: {
          title: "Aktifkan SAML",
          description: "Verifikasi kepemilikan domain email untuk mengakses fitur keamanan termasuk single sign-on.",
          toast: {
            success_title: "Berhasil!",
            create_success_message: "Penyedia SAML berhasil dibuat.",
            update_success_message: "Penyedia SAML berhasil diperbarui.",
            error_title: "Error!",
            error_message: "Gagal menyimpan penyedia SAML. Silakan coba lagi.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detail web",
            entity_id: {
              label: "Entity ID | Audience | Informasi metadata",
              description:
                "Kami akan menghasilkan bagian metadata ini yang mengidentifikasi aplikasi Plane ini sebagai layanan yang diotorisasi di IdP Anda.",
            },
            callback_url: {
              label: "URL masuk tunggal",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan masuk IdP Anda.",
            },
            logout_url: {
              label: "URL logout tunggal",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan logout tunggal IdP Anda.",
            },
          },
          mobile_details: {
            header: "Detail mobile",
            entity_id: {
              label: "Entity ID | Audience | Informasi metadata",
              description:
                "Kami akan menghasilkan bagian metadata ini yang mengidentifikasi aplikasi Plane ini sebagai layanan yang diotorisasi di IdP Anda.",
            },
            callback_url: {
              label: "URL masuk tunggal",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan masuk IdP Anda.",
            },
            logout_url: {
              label: "URL logout tunggal",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan logout IdP Anda.",
            },
          },
          mapping_table: {
            header: "Detail pemetaan",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "Aktifkan OIDC",
        description: "Konfigurasi penyedia identitas OIDC Anda untuk mengaktifkan single sign-on.",
        configure: {
          title: "Aktifkan OIDC",
          description: "Verifikasi kepemilikan domain email untuk mengakses fitur keamanan termasuk single sign-on.",
          toast: {
            success_title: "Berhasil!",
            create_success_message: "Penyedia OIDC berhasil dibuat.",
            update_success_message: "Penyedia OIDC berhasil diperbarui.",
            error_title: "Error!",
            error_message: "Gagal menyimpan penyedia OIDC. Silakan coba lagi.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Detail web",
            origin_url: {
              label: "Origin URL",
              description:
                "Kami akan menghasilkan ini untuk aplikasi Plane ini. Tambahkan ini sebagai origin tepercaya di bidang yang sesuai di IdP Anda.",
            },
            callback_url: {
              label: "URL pengalihan",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan masuk IdP Anda.",
            },
            logout_url: {
              label: "URL logout",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan logout IdP Anda.",
            },
          },
          mobile_details: {
            header: "Detail mobile",
            origin_url: {
              label: "Origin URL",
              description:
                "Kami akan menghasilkan ini untuk aplikasi Plane ini. Tambahkan ini sebagai origin tepercaya di bidang yang sesuai di IdP Anda.",
            },
            callback_url: {
              label: "URL pengalihan",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan masuk IdP Anda.",
            },
            logout_url: {
              label: "URL logout",
              description:
                "Kami akan menghasilkan ini untuk Anda. Tambahkan ini di bidang URL pengalihan logout IdP Anda.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Nama proyek tidak boleh mengandung karakter khusus.",
} as const;

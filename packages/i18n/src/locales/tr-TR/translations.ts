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
    we_are_working_on_this_if_you_need_immediate_assistance: "Bu konuda çalışıyoruz. Acil yardıma ihtiyacınız varsa,",
    reach_out_to_us: "bize ulaşın",
    otherwise_try_refreshing_the_page_occasionally_or_visit_our:
      "Aksi takdirde, sayfayı ara sıra yenilemeyi deneyin veya",
    status_page: "durum sayfamızı ziyaret edin",
  },
  sidebar: {
    projects: "Projeler",
    pages: "Sayfalar",
    new_work_item: "Yeni iş öğesi",
    home: "Ana Sayfa",
    your_work: "Çalışmalarınız",
    inbox: "Gelen Kutusu",
    workspace: "Çalışma Alanı",
    views: "Görünümler",
    analytics: "Analizler",
    work_items: "İş öğeleri",
    cycles: "Döngüler",
    modules: "Modüller",
    intake: "Talep",
    drafts: "Taslaklar",
    favorites: "Favoriler",
    pro: "Pro",
    upgrade: "Yükselt",
    pi_chat: "AI Çet",
    initiatives: "İnisiyetivs",
    teamspaces: "Timspeys",
    epics: "Epiks",
    upgrade_plan: "Apgreyd plen",
    plane_pro: "Pleyn Pro",
    business: "Biznis",
    customers: "Kastımırs",
    recurring_work_items: "Yinelenen iş öğeleri",
  },
  auth: {
    common: {
      email: {
        label: "E-posta",
        placeholder: "isim@şirket.com",
        errors: {
          required: "E-posta gerekli",
          invalid: "Geçersiz e-posta",
        },
      },
      password: {
        label: "Şifre",
        set_password: "Şifre belirle",
        placeholder: "Şifreyi girin",
        confirm_password: {
          label: "Şifreyi onayla",
          placeholder: "Şifreyi onayla",
        },
        current_password: {
          label: "Mevcut şifre",
          placeholder: "Mevcut şifreyi girin",
        },
        new_password: {
          label: "Yeni şifre",
          placeholder: "Yeni şifreyi girin",
        },
        change_password: {
          label: {
            default: "Şifreyi değiştir",
            submitting: "Şifre değiştiriliyor",
          },
        },
        errors: {
          match: "Şifreler eşleşmiyor",
          empty: "Lütfen şifrenizi girin",
          length: "Şifre uzunluğu 8 karakterden fazla olmalı",
          strength: {
            weak: "Şifre zayıf",
            strong: "Şifre güçlü",
          },
        },
        submit: "Şifreyi belirle",
        toast: {
          change_password: {
            success: {
              title: "Başarılı!",
              message: "Şifre başarıyla değiştirildi.",
            },
            error: {
              title: "Hata!",
              message: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
            },
          },
        },
      },
      unique_code: {
        label: "Benzersiz kod",
        placeholder: "alır-atar-uçar",
        paste_code: "E-postanıza gönderilen kodu yapıştırın",
        requesting_new_code: "Yeni kod isteniyor",
        sending_code: "Kod gönderiliyor",
      },
      already_have_an_account: "Zaten bir hesabınız var mı?",
      login: "Giriş yap",
      create_account: "Hesap oluştur",
      new_to_plane: "Plane'e yeni mi geldiniz?",
      back_to_sign_in: "Giriş yapmaya geri dön",
      resend_in: "{seconds} saniye içinde tekrar gönder",
      sign_in_with_unique_code: "Benzersiz kod ile giriş yap",
      forgot_password: "Şifrenizi mi unuttunuz?",
      username: {
        label: "Kullanıcı adı",
        placeholder: "Kullanıcı adınızı girin",
      },
    },
    sign_up: {
      header: {
        label: "Ekibinizle işleri yönetmeye başlamak için bir hesap oluşturun.",
        step: {
          email: {
            header: "Kaydol",
            sub_header: "",
          },
          password: {
            header: "Kaydol",
            sub_header: "E-posta-şifre kombinasyonu kullanarak kaydolun.",
          },
          unique_code: {
            header: "Kaydol",
            sub_header: "Yukarıdaki e-posta adresine gönderilen benzersiz bir kod kullanarak kaydolun.",
          },
        },
      },
      errors: {
        password: {
          strength: "Devam etmek için güçlü bir şifre belirlemeyi deneyin",
        },
      },
    },
    sign_in: {
      header: {
        label: "Ekibinizle işleri yönetmeye başlamak için giriş yapın.",
        step: {
          email: {
            header: "Giriş yap veya kaydol",
            sub_header: "",
          },
          password: {
            header: "Giriş yap veya kaydol",
            sub_header: "Giriş yapmak için e-posta-şifre kombinasyonunuzu kullanın.",
          },
          unique_code: {
            header: "Giriş yap veya kaydol",
            sub_header: "Yukarıdaki e-posta adresine gönderilen benzersiz bir kod kullanarak giriş yapın.",
          },
        },
      },
    },
    forgot_password: {
      title: "Şifrenizi sıfırlayın",
      description:
        "Kullanıcı hesabınızın doğrulanmış e-posta adresini girin, size bir şifre sıfırlama bağlantısı göndereceğiz.",
      email_sent: "Sıfırlama bağlantısını e-posta adresinize gönderdik",
      send_reset_link: "Sıfırlama bağlantısı gönder",
      errors: {
        smtp_not_enabled:
          "Yöneticinizin SMTP'yi etkinleştirmediğini görüyoruz, bu yüzden şifre sıfırlama bağlantısı gönderemeyeceğiz",
      },
      toast: {
        success: {
          title: "E-posta gönderildi",
          message:
            "Şifrenizi sıfırlamak için gelen kutunuzu kontrol edin. Birkaç dakika içinde gelmezse, spam klasörünüzü kontrol edin.",
        },
        error: {
          title: "Hata!",
          message: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
        },
      },
    },
    reset_password: {
      title: "Yeni şifre belirle",
      description: "Hesabınızı güçlü bir şifreyle güvence altına alın",
    },
    set_password: {
      title: "Hesabınızı güvence altına alın",
      description: "Şifre belirlemek güvenli bir şekilde giriş yapmanıza yardımcı olur",
    },
    sign_out: {
      toast: {
        error: {
          title: "Hata!",
          message: "Çıkış yapılamadı. Lütfen tekrar deneyin.",
        },
      },
    },
    ldap: {
      header: {
        label: "{ldapProviderName} ile devam et",
        sub_header: "{ldapProviderName} kimlik bilgilerinizi girin",
      },
    },
  },
  submit: "Gönder",
  cancel: "İptal",
  loading: "Yükleniyor",
  error: "Hata",
  success: "Başarılı",
  warning: "Uyarı",
  info: "Bilgi",
  close: "Kapat",
  yes: "Evet",
  no: "Hayır",
  ok: "Tamam",
  name: "Ad",
  description: "Açıklama",
  search: "Ara",
  add_member: "Üye ekle",
  adding_members: "Üyeler ekleniyor",
  remove_member: "Üyeyi kaldır",
  add_members: "Üyeler ekle",
  adding_member: "Üye ekleniyor",
  remove_members: "Üyeleri kaldır",
  add: "Ekle",
  adding: "Ekleniyor",
  remove: "Kaldır",
  add_new: "Yeni ekle",
  remove_selected: "Seçileni kaldır",
  first_name: "Ad",
  last_name: "Soyad",
  email: "E-posta",
  display_name: "Görünen ad",
  role: "Rol",
  timezone: "Saat dilimi",
  avatar: "Profil resmi",
  cover_image: "Kapak resmi",
  password: "Şifre",
  change_cover: "Kapağı değiştir",
  language: "Dil",
  saving: "Kaydediliyor",
  save_changes: "Değişiklikleri kaydet",
  deactivate_account: "Hesabı devre dışı bırak",
  deactivate_account_description:
    "Bir hesap devre dışı bırakıldığında, o hesaptaki tüm veri ve kaynaklar kalıcı olarak kaldırılır ve kurtarılamaz.",
  profile_settings: "Profil ayarları",
  your_account: "Hesabınız",
  security: "Güvenlik",
  activity: "Aktivite",
  activity_empty_state: {
    no_activity: "Henüz etkinlik yok",
    no_transitions: "Henüz geçiş yok",
  },
  appearance: "Görünüm",
  notifications: "Bildirimler",
  workspaces: "Çalışma Alanları",
  create_workspace: "Çalışma Alanı Oluştur",
  invitations: "Davetler",
  summary: "Özet",
  assigned: "Atanan",
  created: "Oluşturulan",
  subscribed: "Abone olunan",
  you_do_not_have_the_permission_to_access_this_page: "Bu sayfaya erişim izniniz yok.",
  something_went_wrong_please_try_again: "Bir hata oluştu. Lütfen tekrar deneyin.",
  load_more: "Daha fazla yükle",
  select_or_customize_your_interface_color_scheme: "Arayüz renk şemanızı seçin veya özelleştirin.",
  select_the_cursor_motion_style_that_feels_right_for_you: "Size uygun imleç hareket stilini seçin.",
  theme: "Tema",
  smooth_cursor: "Yumuşak İmleç",
  system_preference: "Sistem Tercihi",
  light: "Açık",
  dark: "Koyu",
  light_contrast: "Yüksek kontrastlı açık",
  dark_contrast: "Yüksek kontrastlı koyu",
  custom: "Özel tema",
  select_your_theme: "Temanızı seçin",
  customize_your_theme: "Temanızı özelleştirin",
  background_color: "Arkaplan rengi",
  text_color: "Metin rengi",
  primary_color: "Ana (Tema) rengi",
  sidebar_background_color: "Kenar çubuğu arkaplan rengi",
  sidebar_text_color: "Kenar çubuğu metin rengi",
  set_theme: "Temayı ayarla",
  enter_a_valid_hex_code_of_6_characters: "6 karakterlik geçerli bir hex kodu girin",
  background_color_is_required: "Arkaplan rengi gereklidir",
  text_color_is_required: "Metin rengi gereklidir",
  primary_color_is_required: "Ana renk gereklidir",
  sidebar_background_color_is_required: "Kenar çubuğu arkaplan rengi gereklidir",
  sidebar_text_color_is_required: "Kenar çubuğu metin rengi gereklidir",
  updating_theme: "Tema güncelleniyor",
  theme_updated_successfully: "Tema başarıyla güncellendi",
  failed_to_update_the_theme: "Tema güncellenemedi",
  email_notifications: "E-posta bildirimleri",
  stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified:
    "Abone olduğunuz iş öğelerinden haberdar olun. Bildirim almak için bunu etkinleştirin.",
  email_notification_setting_updated_successfully: "E-posta bildirim ayarı başarıyla güncellendi",
  failed_to_update_email_notification_setting: "E-posta bildirim ayarı güncellenemedi",
  notify_me_when: "Bana ne zaman bildirilsin",
  property_changes: "Özellik değişiklikleri",
  property_changes_description: "Bir iş öğesinin atananlar, öncelik, tahminler gibi özellikleri değiştiğinde bildir.",
  state_change: "Durum değişikliği",
  state_change_description: "İş öğesi farklı bir duruma geçtiğinde bildir.",
  issue_completed: "İş öğesi tamamlandı",
  issue_completed_description: "Yalnızca bir iş öğesi tamamlandığında bildir.",
  comments: "Yorumlar",
  comments_description: "Birisi iş öğesine yorum yaptığında bildir.",
  mentions: "Bahsetmeler",
  mentions_description: "Yalnızca birisi yorumlarda veya açıklamada beni etiketlediğinde bildir.",
  old_password: "Eski şifre",
  general_settings: "Genel ayarlar",
  sign_out: "Çıkış yap",
  signing_out: "Çıkış yapılıyor",
  active_cycles: "Aktif Döngüler",
  active_cycles_description:
    "Projeler arasında döngüleri izleyin, yüksek öncelikli iş öğelerini takip edin ve dikkat gerektiren döngülere odaklanın.",
  on_demand_snapshots_of_all_your_cycles: "Tüm döngülerinizin anlık görüntüleri",
  upgrade: "Yükselt",
  "10000_feet_view": "Tüm aktif döngülerin genel görünümü",
  "10000_feet_view_description":
    "Her projede tek tek dolaşmak yerine, tüm projelerinizdeki çalışan döngüleri bir arada görün.",
  get_snapshot_of_each_active_cycle: "Her aktif döngünün anlık görüntüsünü alın",
  get_snapshot_of_each_active_cycle_description:
    "Tüm aktif döngüler için üst düzey metrikleri takip edin, ilerleme durumlarını görün ve son teslim tarihlerine göre kapsamı anlayın.",
  compare_burndowns: "Burndown'ları karşılaştırın",
  compare_burndowns_description: "Her ekibin performansını her döngünün burndown raporuyla izleyin.",
  quickly_see_make_or_break_issues: "Kritik iş öğelerini hızlıca görün",
  quickly_see_make_or_break_issues_description:
    "Her döngü için yüksek öncelikli iş öğelerini son teslim tarihlerine göre önizleyin. Tümünü tek tıkla görün.",
  zoom_into_cycles_that_need_attention: "Dikkat gerektiren döngülere odaklanın",
  zoom_into_cycles_that_need_attention_description:
    "Beklentilere uymayan herhangi bir döngünün durumunu tek tıkla inceleyin.",
  stay_ahead_of_blockers: "Engellerin önüne geçin",
  stay_ahead_of_blockers_description:
    "Projeler arası zorlukları ve diğer görünümlerde belirgin olmayan döngü bağımlılıklarını tespit edin.",
  analytics: "Analitik",
  workspace_invites: "Çalışma Alanı Davetleri",
  enter_god_mode: "Yönetici Moduna Geç",
  workspace_logo: "Çalışma Alanı Logosu",
  new_issue: "Yeni İş Öğesi",
  your_work: "Sizin İşleriniz",
  drafts: "Taslaklar",
  projects: "Projeler",
  views: "Görünümler",
  archives: "Arşivler",
  settings: "Ayarlar",
  failed_to_move_favorite: "Favori taşınamadı",
  favorites: "Favoriler",
  no_favorites_yet: "Henüz favori yok",
  create_folder: "Klasör oluştur",
  new_folder: "Yeni Klasör",
  favorite_updated_successfully: "Favori başarıyla güncellendi",
  favorite_created_successfully: "Favori başarıyla oluşturuldu",
  folder_already_exists: "Klasör zaten var",
  folder_name_cannot_be_empty: "Klasör adı boş olamaz",
  something_went_wrong: "Bir şeyler yanlış gitti",
  failed_to_reorder_favorite: "Favori sıralaması değiştirilemedi",
  favorite_removed_successfully: "Favori başarıyla kaldırıldı",
  failed_to_create_favorite: "Favori oluşturulamadı",
  failed_to_rename_favorite: "Favori yeniden adlandırılamadı",
  project_link_copied_to_clipboard: "Proje bağlantısı panoya kopyalandı",
  link_copied: "Bağlantı kopyalandı",
  add_project: "Proje ekle",
  create_project: "Proje oluştur",
  failed_to_remove_project_from_favorites: "Proje favorilerden kaldırılamadı. Lütfen tekrar deneyin.",
  project_created_successfully: "Proje başarıyla oluşturuldu",
  project_created_successfully_description: "Proje başarıyla oluşturuldu. Artık iş öğeleri eklemeye başlayabilirsiniz.",
  project_name_already_taken: "Proje ismi zaten kullanılıyor.",
  project_identifier_already_taken: "Proje kimliği zaten kullanılıyor.",
  project_cover_image_alt: "Proje kapak resmi",
  name_is_required: "Ad gereklidir",
  title_should_be_less_than_255_characters: "Başlık 255 karakterden az olmalı",
  project_name: "Proje Adı",
  project_id_must_be_at_least_1_character: "Proje ID en az 1 karakter olmalı",
  project_id_must_be_at_most_5_characters: "Proje ID en fazla 5 karakter olmalı",
  project_id: "Proje ID",
  project_id_tooltip_content:
    "Projedeki iş öğelerini benzersiz şekilde tanımlamanıza yardımcı olur. Maks. 50 karakter.",
  description_placeholder: "Açıklama",
  only_alphanumeric_non_latin_characters_allowed: "Yalnızca alfasayısal ve Latin olmayan karakterlere izin verilir.",
  project_id_is_required: "Proje ID gereklidir",
  project_id_allowed_char: "Yalnızca alfasayısal ve Latin olmayan karakterlere izin verilir.",
  project_id_min_char: "Proje ID en az 1 karakter olmalı",
  project_id_max_char: "Proje ID en fazla {max} karakter olmalı",
  project_description_placeholder: "Proje açıklamasını girin",
  select_network: "Ağ seç",
  lead: "Lider",
  date_range: "Tarih aralığı",
  private: "Özel",
  public: "Herkese Açık",
  accessible_only_by_invite: "Yalnızca davetle erişilebilir",
  anyone_in_the_workspace_except_guests_can_join: "Çalışma alanındaki herkes (Misafirler hariç) katılabilir",
  creating: "Oluşturuluyor",
  creating_project: "Proje oluşturuluyor",
  adding_project_to_favorites: "Proje favorilere ekleniyor",
  project_added_to_favorites: "Proje favorilere eklendi",
  couldnt_add_the_project_to_favorites: "Proje favorilere eklenemedi. Lütfen tekrar deneyin.",
  removing_project_from_favorites: "Proje favorilerden kaldırılıyor",
  project_removed_from_favorites: "Proje favorilerden kaldırıldı",
  couldnt_remove_the_project_from_favorites: "Proje favorilerden kaldırılamadı. Lütfen tekrar deneyin.",
  add_to_favorites: "Favorilere ekle",
  remove_from_favorites: "Favorilerden kaldır",
  publish_project: "Projeyi yayımla",
  publish: "Yayınla",
  copy_link: "Bağlantıyı kopyala",
  leave_project: "Projeden ayrıl",
  join_the_project_to_rearrange: "Yeniden düzenlemek için projeye katılın",
  drag_to_rearrange: "Sürükleyerek yeniden düzenle",
  congrats: "Tebrikler!",
  open_project: "Projeyi aç",
  issues: "İş Öğeleri",
  cycles: "Döngüler",
  modules: "Modüller",
  pages: {
    link_pages: "Sayfaları bağla",
    show_wiki_pages: "Wiki sayfalarını görüntüle",
    link_pages_to: "Sayfaları bağla",
    linked_pages: "Bağlı sayfalar",
    no_description: "Bu sayfa boş. Buraya bir şey yazın ve bunu buradaki yer tutucu olarak görün.",
    toasts: {
      link: {
        success: {
          title: "Sayfalar güncellendi",
          message: "Sayfalar başarıyla güncellendi",
        },
        error: {
          title: "Sayfalar güncellenemedi",
          message: "Sayfalar güncellenemedi",
        },
      },
      remove: {
        success: {
          title: "Sayfa silindi",
          message: "Sayfa başarıyla silindi",
        },
        error: {
          title: "Sayfa silinemedi",
          message: "Sayfa silinemedi",
        },
      },
    },
  },
  intake: "Talep",
  renew: "Yenile",
  preview: "Önizleme",
  time_tracking: "Zaman Takibi",
  work_management: "İş Yönetimi",
  projects_and_issues: "Projeler ve İş Öğeleri",
  projects_and_issues_description: "Bu projede bu özellikleri açıp kapatın.",
  cycles_description:
    "Projeye göre işi zamanla sınırlandırın ve gerektiğinde zaman dilimini ayarlayın. Bir döngü 2 hafta, bir sonraki 1 hafta olabilir.",
  modules_description: "İşi, özel liderler ve atanmış kişilerle alt projelere ayırın.",
  views_description: "Özel sıralamaları, filtreleri ve görüntüleme seçeneklerini kaydedin veya ekibinizle paylaşın.",
  pages_description: "Serbest biçimli içerikler oluşturun ve düzenleyin; notlar, belgeler, her şey.",
  intake_description: "Üye olmayanların hata, geri bildirim ve öneri paylaşmasına izin verin; iş akışınızı bozmadan.",
  time_tracking_description: "İş öğeleri ve projelerde harcanan zamanı kaydedin.",
  work_management_description: "İşlerinizi ve projelerinizi kolayca yönetin.",
  documentation: "Dokümantasyon",
  message_support: "Destekle iletişim",
  contact_sales: "Satış Ekibiyle İletişim",
  hyper_mode: "Hiper Mod",
  keyboard_shortcuts: "Klavye Kısayolları",
  whats_new: "Yenilikler",
  version: "Sürüm",
  we_are_having_trouble_fetching_the_updates: "Güncellemeler alınırken sorun oluştu.",
  our_changelogs: "değişiklik kayıtlarımızı",
  for_the_latest_updates: "en son güncellemeler için",
  please_visit: "Lütfen ziyaret edin",
  docs: "Dokümanlar",
  full_changelog: "Tam Değişiklik Kaydı",
  support: "Destek",
  forum: "Forum",
  powered_by_plane_pages: "Plane Pages tarafından desteklenmektedir",
  please_select_at_least_one_invitation: "Lütfen en az bir davet seçin.",
  please_select_at_least_one_invitation_description: "Çalışma alanına katılmak için lütfen en az bir davet seçin.",
  we_see_that_someone_has_invited_you_to_join_a_workspace: "Birinin sizi bir çalışma alanına davet ettiğini görüyoruz",
  join_a_workspace: "Bir çalışma alanına katıl",
  we_see_that_someone_has_invited_you_to_join_a_workspace_description:
    "Birinin sizi bir çalışma alanına davet ettiğini görüyoruz",
  join_a_workspace_description: "Bir çalışma alanına katıl",
  accept_and_join: "Kabul Et ve Katıl",
  go_home: "Ana Sayfaya Dön",
  no_pending_invites: "Bekleyen davet yok",
  you_can_see_here_if_someone_invites_you_to_a_workspace:
    "Biri sizi bir çalışma alanına davet ederse burada görebilirsiniz",
  back_to_home: "Ana Sayfaya Dön",
  workspace_name: "çalışma-alanı-adı",
  deactivate_your_account: "Hesabınızı devre dışı bırakın",
  deactivate_your_account_description:
    "Devre dışı bırakıldığında, iş öğelerine atanamazsınız ve çalışma alanınız için faturalandırılmazsınız. Hesabınızı yeniden etkinleştirmek için bu e-posta adresine bir çalışma alanı daveti gerekecektir.",
  deactivating: "Devre dışı bırakılıyor",
  confirm: "Onayla",
  confirming: "Onaylanıyor",
  draft_created: "Taslak oluşturuldu",
  issue_created_successfully: "İş öğesi başarıyla oluşturuldu",
  draft_creation_failed: "Taslak oluşturulamadı",
  issue_creation_failed: "İş öğesi oluşturulamadı",
  draft_issue: "Taslak İş Öğesi",
  issue_updated_successfully: "İş öğesi başarıyla güncellendi",
  issue_could_not_be_updated: "İş öğesi güncellenemedi",
  create_a_draft: "Taslak oluştur",
  save_to_drafts: "Taslaklara Kaydet",
  save: "Kaydet",
  update: "Güncelle",
  updating: "Güncelleniyor",
  create_new_issue: "Yeni iş öğesi oluştur",
  editor_is_not_ready_to_discard_changes: "Düzenleyici değişiklikleri atmaya hazır değil",
  failed_to_move_issue_to_project: "İş öğesi projeye taşınamadı",
  create_more: "Daha fazla oluştur",
  add_to_project: "Projeye ekle",
  discard: "Vazgeç",
  duplicate_issue_found: "Yinelenen iş öğesi bulundu",
  duplicate_issues_found: "Yinelenen iş öğeleri bulundu",
  no_matching_results: "Eşleşen sonuç yok",
  title_is_required: "Başlık gereklidir",
  title: "Başlık",
  state: "Durum",
  transition: "Geçiş",
  history: "Geçmiş",
  priority: "Öncelik",
  none: "Yok",
  urgent: "Acil",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
  members: "Üyeler",
  assignee: "Atanan",
  assignees: "Atananlar",
  subscriber: "{count, plural, one{# Abone} other{# Abone}}",
  you: "Siz",
  labels: "Etiketler",
  create_new_label: "Yeni etiket oluştur",
  label_name: "Etiket adı",
  failed_to_create_label: "Etiket oluşturulamadı. Lütfen tekrar deneyin.",
  start_date: "Başlangıç tarihi",
  end_date: "Bitiş tarihi",
  due_date: "Son tarih",
  estimate: "Tahmin",
  change_parent_issue: "Üst iş öğesini değiştir",
  remove_parent_issue: "Üst iş öğesini kaldır",
  add_parent: "Üst ekle",
  loading_members: "Üyeler yükleniyor",
  view_link_copied_to_clipboard: "Görünüm bağlantısı panoya kopyalandı.",
  required: "Gerekli",
  optional: "İsteğe Bağlı",
  Cancel: "İptal",
  edit: "Düzenle",
  archive: "Arşivle",
  restore: "Geri Yükle",
  open_in_new_tab: "Yeni sekmede aç",
  delete: "Sil",
  deleting: "Siliniyor",
  make_a_copy: "Kopyasını oluştur",
  move_to_project: "Projeye taşı",
  good: "İyi",
  morning: "sabah",
  afternoon: "öğleden sonra",
  evening: "akşam",
  show_all: "Tümünü göster",
  show_less: "Daha az göster",
  no_data_yet: "Henüz veri yok",
  syncing: "Senkronize ediliyor",
  add_work_item: "İş öğesi ekle",
  advanced_description_placeholder: "Komutlar için '/' tuşuna basın",
  create_work_item: "İş öğesi oluştur",
  attachments: "Ekler",
  declining: "Reddediliyor",
  declined: "Reddedildi",
  decline: "Reddet",
  unassigned: "Atanmamış",
  work_items: "İş Öğeleri",
  add_link: "Bağlantı ekle",
  points: "Puanlar",
  no_assignee: "Atanan yok",
  no_assignees_yet: "Henüz atanan yok",
  no_labels_yet: "Henüz etiket yok",
  ideal: "İdeal",
  current: "Mevcut",
  no_matching_members: "Eşleşen üye yok",
  leaving: "Ayrılıyor",
  removing: "Kaldırılıyor",
  leave: "Ayrıl",
  refresh: "Yenile",
  refreshing: "Yenileniyor",
  refresh_status: "Durumu yenile",
  prev: "Önceki",
  next: "Sonraki",
  re_generating: "Yeniden oluşturuluyor",
  re_generate: "Yeniden oluştur",
  re_generate_key: "Anahtarı yeniden oluştur",
  export: "Dışa aktar",
  member: "{count, plural, one{# üye} other{# üye}}",
  new_password_must_be_different_from_old_password: "Yeni şifre eski şifreden farklı olmalı",
  edited: "düzenlendi",
  bot: "Bot",
  project_view: {
    sort_by: {
      created_at: "Oluşturulma tarihi",
      updated_at: "Güncelleme tarihi",
      name: "Ad",
    },
  },
  upgrade_request: "Yükseltme için Çalışma Alanı Yöneticinize başvurun.",
  copied_to_clipboard: "Panoya kopyalandı",
  copied_to_clipboard_description: "URL panonuza başarıyla kopyalandı",
  toast: {
    success: "Başarılı!",
    error: "Hata!",
  },
  links: {
    toasts: {
      created: {
        title: "Bağlantı oluşturuldu",
        message: "Bağlantı başarıyla oluşturuldu",
      },
      not_created: {
        title: "Bağlantı oluşturulamadı",
        message: "Bağlantı oluşturulamadı",
      },
      updated: {
        title: "Bağlantı güncellendi",
        message: "Bağlantı başarıyla güncellendi",
      },
      not_updated: {
        title: "Bağlantı güncellenemedi",
        message: "Bağlantı güncellenemedi",
      },
      removed: {
        title: "Bağlantı kaldırıldı",
        message: "Bağlantı başarıyla kaldırıldı",
      },
      not_removed: {
        title: "Bağlantı kaldırılamadı",
        message: "Bağlantı kaldırılamadı",
      },
    },
  },
  home: {
    empty: {
      quickstart_guide: "Hızlı başlangıç rehberiniz",
      not_right_now: "Şimdi değil",
      create_project: {
        title: "Proje oluştur",
        description: "Çoğu şey Plane'de bir projeyle başlar.",
        cta: "Başla",
      },
      invite_team: {
        title: "Ekibinizi davet edin",
        description: "Ekip arkadaşlarınızla birlikte inşa edin, gönderin ve yönetin.",
        cta: "Davet et",
      },
      configure_workspace: {
        title: "Çalışma alanınızı ayarlayın.",
        description: "Özellikleri açıp kapatın veya daha fazlasını yapın.",
        cta: "Yapılandır",
      },
      personalize_account: {
        title: "Plane'yi kendinize özelleştirin.",
        description: "Resminizi, renklerinizi ve daha fazlasını seçin.",
        cta: "Kişiselleştir",
      },
      widgets: {
        title: "Widget'lar Kapalıyken Sessiz, Onları Açın",
        description: "Görünüşe göre tüm widget'larınız kapalı. Deneyiminizi geliştirmek için şimdi etkinleştirin!",
        primary_button: {
          text: "Widget'ları yönet",
        },
      },
    },
    quick_links: {
      empty: "Kolay erişim için hızlı bağlantılar ekleyin.",
      add: "Hızlı bağlantı ekle",
      title: "Hızlı Bağlantı",
      title_plural: "Hızlı Bağlantılar",
    },
    recents: {
      title: "Sonlar",
      empty: {
        project: "Bir projeyi ziyaret ettikten sonra son projeleriniz burada görünecek.",
        page: "Bir sayfayı ziyaret ettikten sonra son sayfalarınız burada görünecek.",
        issue: "Bir iş öğesini ziyaret ettikten sonra son iş öğeleriniz burada görünecek.",
        default: "Henüz hiç sonunuz yok.",
      },
      filters: {
        all: "Tüm öğeler",
        projects: "Projeler",
        pages: "Sayfalar",
        issues: "İş öğeleri",
      },
    },
    new_at_plane: {
      title: "Plane'de Yenilikler",
    },
    quick_tutorial: {
      title: "Hızlı eğitim",
    },
    widget: {
      reordered_successfully: "Widget başarıyla yeniden sıralandı.",
      reordering_failed: "Widget yeniden sıralanırken hata oluştu.",
    },
    manage_widgets: "Widget'ları yönet",
    title: "Ana Sayfa",
    star_us_on_github: "Bizi GitHub'da yıldızlayın",
    business_trial_banner: {
      title: "14 günlük Business planı denemeniz aktif!",
      description:
        "Tüm Business özelliklerini keşfedin. Hazır olduğunuzda abone olmayı seçin. Otomatik olarak faturalandırılmayacaksınız.",
      trial_ends_today: "Deneme bugün sona eriyor",
      trial_ends_in_days: "Deneme {days} gün içinde sona eriyor",
      start_subscription: "Aboneliği başlat",
      explore_business_features: "Business özelliklerini keşfet",
    },
  },
  link: {
    modal: {
      url: {
        text: "URL",
        required: "URL geçersiz",
        placeholder: "URL yazın veya yapıştırın",
      },
      title: {
        text: "Görünen başlık",
        placeholder: "Bu bağlantıyı nasıl görmek istersiniz",
      },
    },
  },
  common: {
    all: "Tümü",
    no_items_in_this_group: "Bu grupta öğe yok",
    drop_here_to_move: "Taşımak için buraya bırakın",
    states: "Durumlar",
    state: "Durum",
    state_groups: "Durum grupları",
    state_group: "Durum grubu",
    priorities: "Öncelikler",
    priority: "Öncelik",
    team_project: "Takım projesi",
    project: "Proje",
    cycle: "Döngü",
    cycles: "Döngüler",
    module: "Modül",
    modules: "Modüller",
    labels: "Etiketler",
    label: "Etiket",
    assignees: "Atananlar",
    assignee: "Atanan",
    created_by: "Oluşturan",
    none: "Yok",
    link: "Bağlantı",
    estimates: "Tahminler",
    estimate: "Tahmin",
    created_at: "Oluşturulma tarihi",
    updated_at: "Güncelleme tarihi",
    completed_at: "Tamamlanma tarihi",
    layout: "Düzen",
    filters: "Filtreler",
    display: "Görüntüle",
    load_more: "Daha fazla yükle",
    activity: "Aktivite",
    analytics: "Analitik",
    dates: "Tarihler",
    success: "Başarılı!",
    something_went_wrong: "Bir şeyler yanlış gitti",
    error: {
      label: "Hata!",
      message: "Bir hata oluştu. Lütfen tekrar deneyin.",
    },
    group_by: "Gruplandır",
    epic: "Epik",
    epics: "Epikler",
    work_item: "İş öğesi",
    work_items: "İş Öğeleri",
    sub_work_item: "Alt iş öğesi",
    add: "Ekle",
    warning: "Uyarı",
    updating: "Güncelleniyor",
    adding: "Ekleniyor",
    update: "Güncelle",
    creating: "Oluşturuluyor",
    create: "Oluştur",
    cancel: "İptal",
    description: "Açıklama",
    title: "Başlık",
    attachment: "Ek",
    general: "Genel",
    features: "Özellikler",
    automation: "Otomasyon",
    project_name: "Proje Adı",
    project_id: "Proje ID",
    project_timezone: "Proje Saat Dilimi",
    created_on: "Oluşturulma tarihi",
    update_project: "Projeyi güncelle",
    identifier_already_exists: "Tanımlayıcı zaten var",
    add_more: "Daha fazla ekle",
    defaults: "Varsayılanlar",
    add_label: "Etiket ekle",
    customize_time_range: "Zaman aralığını özelleştir",
    loading: "Yükleniyor",
    attachments: "Ekler",
    property: "Özellik",
    properties: "Özellikler",
    parent: "Üst",
    page: "Sayfa",
    remove: "Kaldır",
    archiving: "Arşivleniyor",
    archive: "Arşivle",
    access: {
      public: "Herkese Açık",
      private: "Özel",
    },
    done: "Tamamlandı",
    sub_work_items: "Alt iş öğeleri",
    comment: "Yorum",
    workspace_level: "Çalışma Alanı Seviyesi",
    order_by: {
      label: "Sırala",
      manual: "Manuel",
      last_created: "Son oluşturulan",
      last_updated: "Son güncellenen",
      start_date: "Başlangıç tarihi",
      due_date: "Son tarih",
      asc: "Artan",
      desc: "Azalan",
      updated_on: "Güncellenme tarihi",
    },
    sort: {
      asc: "Artan",
      desc: "Azalan",
      created_on: "Oluşturulma tarihi",
      updated_on: "Güncellenme tarihi",
    },
    comments: "Yorumlar",
    updates: "Güncellemeler",
    additional_updates: "Ek güncellemeler",
    clear_all: "Tümünü temizle",
    copied: "Kopyalandı!",
    link_copied: "Bağlantı kopyalandı!",
    link_copied_to_clipboard: "Bağlantı panoya kopyalandı",
    copied_to_clipboard: "İş öğesi bağlantısı panoya kopyalandı",
    branch_name_copied_to_clipboard: "Dal adı panoya kopyalandı",
    is_copied_to_clipboard: "İş öğesi panoya kopyalandı",
    no_links_added_yet: "Henüz bağlantı eklenmedi",
    add_link: "Bağlantı ekle",
    links: "Bağlantılar",
    go_to_workspace: "Çalışma Alanına Git",
    progress: "İlerleme",
    optional: "İsteğe Bağlı",
    join: "Katıl",
    go_back: "Geri Dön",
    continue: "Devam Et",
    resend: "Yeniden Gönder",
    relations: "İlişkiler",
    errors: {
      default: {
        title: "Hata!",
        message: "Bir hata oluştu. Lütfen tekrar deneyin.",
      },
      required: "Bu alan gereklidir",
      entity_required: "{entity} gereklidir",
      restricted_entity: "{entity} kısıtlanmıştır",
    },
    update_link: "Bağlantıyı güncelle",
    attach: "Ekle",
    create_new: "Yeni oluştur",
    add_existing: "Varolanı ekle",
    type_or_paste_a_url: "URL yazın veya yapıştırın",
    url_is_invalid: "URL geçersiz",
    display_title: "Görünen başlık",
    link_title_placeholder: "Bu bağlantıyı nasıl görmek istersiniz",
    url: "URL",
    side_peek: "Yan Görünüm",
    modal: "Modal",
    full_screen: "Tam Ekran",
    close_peek_view: "Yan görünümü kapat",
    toggle_peek_view_layout: "Yan görünüm düzenini değiştir",
    options: "Seçenekler",
    duration: "Süre",
    today: "Bugün",
    week: "Hafta",
    month: "Ay",
    quarter: "Çeyrek",
    press_for_commands: "Komutlar için '/' tuşuna basın",
    click_to_add_description: "Açıklama eklemek için tıkla",
    search: {
      label: "Ara",
      placeholder: "Aramak için yazın",
      no_matches_found: "Eşleşme bulunamadı",
      no_matching_results: "Eşleşen sonuç yok",
    },
    actions: {
      edit: "Düzenle",
      make_a_copy: "Kopyasını oluştur",
      open_in_new_tab: "Yeni sekmede aç",
      copy_link: "Bağlantıyı kopyala",
      copy_branch_name: "Dal adını kopyala",
      archive: "Arşivle",
      restore: "Geri yükle",
      delete: "Sil",
      remove_relation: "İlişkiyi kaldır",
      subscribe: "Abone ol",
      unsubscribe: "Abonelikten çık",
      clear_sorting: "Sıralamayı temizle",
      show_weekends: "Hafta sonlarını göster",
      enable: "Etkinleştir",
      disable: "Devre dışı bırak",
      copy_markdown: "Markdown'ı kopyala",
    },
    name: "Ad",
    discard: "Vazgeç",
    confirm: "Onayla",
    confirming: "Onaylanıyor",
    read_the_docs: "Dokümanları oku",
    default: "Varsayılan",
    active: "Aktif",
    enabled: "Etkin",
    disabled: "Devre Dışı",
    mandate: "Yetki",
    mandatory: "Zorunlu",
    yes: "Evet",
    no: "Hayır",
    please_wait: "Lütfen bekleyin",
    enabling: "Etkinleştiriliyor",
    disabling: "Devre Dışı Bırakılıyor",
    beta: "Beta",
    or: "veya",
    next: "Sonraki",
    back: "Geri",
    cancelling: "İptal ediliyor",
    configuring: "Yapılandırılıyor",
    clear: "Temizle",
    import: "İçe aktar",
    connect: "Bağlan",
    authorizing: "Yetkilendiriliyor",
    processing: "İşleniyor",
    no_data_available: "Veri yok",
    from: "{name} kaynaklı",
    authenticated: "Kimliği doğrulandı",
    select: "Seç",
    upgrade: "Yükselt",
    add_seats: "Koltuk Ekle",
    projects: "Projeler",
    workspace: "Çalışma Alanı",
    workspaces: "Çalışma Alanları",
    team: "Takım",
    teams: "Takımlar",
    entity: "Varlık",
    entities: "Varlıklar",
    task: "Görev",
    tasks: "Görevler",
    section: "Bölüm",
    sections: "Bölümler",
    edit: "Düzenle",
    connecting: "Bağlanılıyor",
    connected: "Bağlı",
    disconnect: "Bağlantıyı kes",
    disconnecting: "Bağlantı kesiliyor",
    installing: "Yükleniyor",
    install: "Yükle",
    reset: "Sıfırla",
    live: "Canlı",
    change_history: "Değişiklik Geçmişi",
    coming_soon: "Çok Yakında",
    member: "Üye",
    members: "Üyeler",
    you: "Siz",
    upgrade_cta: {
      higher_subscription: "Daha yüksek aboneliğe yükselt",
      talk_to_sales: "Satış Ekibiyle Görüş",
    },
    category: "Kategori",
    categories: "Kategoriler",
    saving: "Kaydediliyor",
    save_changes: "Değişiklikleri Kaydet",
    delete: "Sil",
    deleting: "Siliniyor",
    pending: "Beklemede",
    invite: "Davet Et",
    view: "Görünüm",
    deactivated_user: "Devre dışı bırakılmış kullanıcı",
    apply: "Uygula",
    applying: "Uygulanıyor",
    users: "Kullanıcılar",
    admins: "Yöneticiler",
    guests: "Misafirler",
    on_track: "Yolunda",
    off_track: "Yolunda değil",
    at_risk: "Risk altında",
    timeline: "Zaman çizelgesi",
    completion: "Tamamlama",
    upcoming: "Yaklaşan",
    completed: "Tamamlandı",
    in_progress: "Devam ediyor",
    planned: "Planlandı",
    paused: "Durduruldu",
    no_of: "{entity} sayısı",
    resolved: "Çözüldü",
    worklogs: "Çalışma Logları",
    project_updates: "Proje Güncellemeleri",
    overview: "Genel Bakış",
    workflows: "İş Akışları",
    templates: "Şablonlar",
    members_and_teamspaces: "Üyeler ve Takım Alanları",
    open_in_full_screen: "{page} öğesini tam ekranda aç",
  },
  chart: {
    x_axis: "X ekseni",
    y_axis: "Y ekseni",
    metric: "Metrik",
  },
  form: {
    title: {
      required: "Başlık gereklidir",
      max_length: "Başlık {length} karakterden az olmalı",
    },
  },
  entity: {
    grouping_title: "{entity} Gruplandırma",
    priority: "{entity} Önceliği",
    all: "Tüm {entity}",
    drop_here_to_move: "{entity} taşımak için buraya bırakın",
    delete: {
      label: "{entity} Sil",
      success: "{entity} başarıyla silindi",
      failed: "{entity} silinemedi",
    },
    update: {
      failed: "{entity} güncellenemedi",
      success: "{entity} başarıyla güncellendi",
    },
    link_copied_to_clipboard: "{entity} bağlantısı panoya kopyalandı",
    fetch: {
      failed: "{entity} alınırken hata oluştu",
    },
    add: {
      success: "{entity} başarıyla eklendi",
      failed: "{entity} eklenirken hata oluştu",
    },
    remove: {
      success: "{entity} başarıyla kaldırıldı",
      failed: "{entity} kaldırılırken hata oluştu",
    },
  },
  epic: {
    all: "Tüm Epikler",
    label: "{count, plural, one {Epik} other {Epikler}}",
    new: "Yeni Epik",
    adding: "Epik ekleniyor",
    create: {
      success: "Epik başarıyla oluşturuldu",
    },
    add: {
      press_enter: "Başka bir epik eklemek için 'Enter'a basın",
      label: "Epik Ekle",
    },
    title: {
      label: "Epik Başlığı",
      required: "Epik başlığı gereklidir.",
    },
    archive: {
      description: `Yalnızca tamamlanmış veya iptal edilmiş
epikler arşivlenebilir`,
      label: "Epiki Arşivle",
      confirm_message:
        "Epiki arşivlemek istediğinizden emin misiniz? Arşivlenen tüm epikler daha sonra geri yüklenebilir.",
      success: {
        label: "Arşivleme başarılı",
        message: "Arşivleriniz proje arşivlerinde bulunabilir.",
      },
      failed: {
        message: "Epik arşivlenemedi. Lütfen tekrar deneyin.",
      },
    },
  },
  issue: {
    label: "{count, plural, one {İş öğesi} other {İş öğeleri}}",
    all: "Tüm İş Öğeleri",
    edit: "İş öğesini düzenle",
    title: {
      label: "İş öğesi başlığı",
      required: "İş öğesi başlığı gereklidir.",
    },
    add: {
      press_enter: "Başka bir iş öğesi eklemek için 'Enter'a basın",
      label: "İş öğesi ekle",
      cycle: {
        failed: "İş öğesi döngüye eklenemedi. Lütfen tekrar deneyin.",
        success: "{count, plural, one {İş öğesi} other {İş öğeleri}} döngüye başarıyla eklendi.",
        loading: "{count, plural, one {İş öğesi} other {İş öğeleri}} döngüye ekleniyor",
      },
      assignee: "Atanan ekle",
      start_date: "Başlangıç tarihi ekle",
      due_date: "Son tarih ekle",
      parent: "Üst iş öğesi ekle",
      sub_issue: "Alt iş öğesi ekle",
      relation: "İlişki ekle",
      link: "Bağlantı ekle",
      existing: "Varolan iş öğesi ekle",
    },
    remove: {
      label: "İş öğesini kaldır",
      cycle: {
        loading: "İş öğesi döngüden kaldırılıyor",
        success: "İş öğesi döngüden başarıyla kaldırıldı.",
        failed: "İş öğesi döngüden kaldırılamadı. Lütfen tekrar deneyin.",
      },
      module: {
        loading: "İş öğesi modülden kaldırılıyor",
        success: "İş öğesi modülden başarıyla kaldırıldı.",
        failed: "İş öğesi modülden kaldırılamadı. Lütfen tekrar deneyin.",
      },
      parent: {
        label: "Üst iş öğesini kaldır",
      },
    },
    new: "Yeni İş Öğesi",
    adding: "İş öğesi ekleniyor",
    create: {
      success: "İş öğesi başarıyla oluşturuldu",
    },
    priority: {
      urgent: "Acil",
      high: "Yüksek",
      medium: "Orta",
      low: "Düşük",
    },
    display: {
      properties: {
        label: "Görünen Özellikler",
        id: "ID",
        issue_type: "İş Öğesi Türü",
        sub_issue_count: "Alt iş öğesi sayısı",
        attachment_count: "Ek sayısı",
        created_on: "Oluşturulma tarihi",
        sub_issue: "Alt iş öğesi",
        work_item_count: "İş öğesi sayısı",
        customer_count: "Kastımir kaunt",
        customer_request_count: "Kastımir rikvest kaunt",
        customer: "Kastımir",
        requests: "Kastımir rikvest",
      },
      extra: {
        show_sub_issues: "Alt iş öğelerini göster",
        show_empty_groups: "Boş grupları göster",
      },
    },
    layouts: {
      ordered_by_label: "Bu düzen şu şekilde sıralanmıştır",
      list: "Liste",
      kanban: "Pano",
      calendar: "Takvim",
      spreadsheet: "Tablo",
      gantt: "Zaman Çizelgesi",
      title: {
        list: "Liste Düzeni",
        kanban: "Pano Düzeni",
        calendar: "Takvim Düzeni",
        spreadsheet: "Tablo Düzeni",
        gantt: "Zaman Çizelgesi Düzeni",
      },
    },
    states: {
      active: "Aktif",
      backlog: "Bekleme Listesi",
    },
    comments: {
      placeholder: "Yorum ekle",
      switch: {
        private: "Özel yoruma geç",
        public: "Genel yoruma geç",
      },
      create: {
        success: "Yorum başarıyla oluşturuldu",
        error: "Yorum oluşturulamadı. Lütfen daha sonra tekrar deneyin.",
      },
      update: {
        success: "Yorum başarıyla güncellendi",
        error: "Yorum güncellenemedi. Lütfen daha sonra tekrar deneyin.",
      },
      remove: {
        success: "Yorum başarıyla kaldırıldı",
        error: "Yorum kaldırılamadı. Lütfen daha sonra tekrar deneyin.",
      },
      upload: {
        error: "Dosya yüklenemedi. Lütfen daha sonra tekrar deneyin.",
      },
      copy_link: {
        success: "Yorum bağlantısı panoya kopyalandı",
        error: "Yorum bağlantısı kopyalanırken hata oluştu. Lütfen daha sonra tekrar deneyin.",
      },
    },
    empty_state: {
      issue_detail: {
        title: "İş öğesi mevcut değil",
        description: "Aradığınız iş öğesi mevcut değil, arşivlenmiş veya silinmiş.",
        primary_button: {
          text: "Diğer iş öğelerini görüntüle",
        },
      },
    },
    sibling: {
      label: "Kardeş iş öğeleri",
    },
    archive: {
      description: `Yalnızca tamamlanmış veya iptal edilmiş
iş öğeleri arşivlenebilir`,
      label: "İş Öğesini Arşivle",
      confirm_message:
        "Bu iş öğesini arşivlemek istediğinizden emin misiniz? Arşivlenen tüm iş öğelerinizi daha sonra geri yükleyebilirsiniz.",
      success: {
        label: "Arşivleme başarılı",
        message: "Arşivleriniz proje arşivlerinde bulunabilir.",
      },
      failed: {
        message: "İş öğesi arşivlenemedi. Lütfen tekrar deneyin.",
      },
    },
    restore: {
      success: {
        title: "Geri yükleme başarılı",
        message: "İş öğeniz proje iş öğelerinde bulunabilir.",
      },
      failed: {
        message: "İş öğesi geri yüklenemedi. Lütfen tekrar deneyin.",
      },
    },
    relation: {
      relates_to: "İlişkili",
      duplicate: "Kopyası",
      blocked_by: "Engellendi",
      blocking: "Engelliyor",
      start_before: "Starts Bifor",
      start_after: "Starts Aftır",
      finish_before: "Finishes Bifor",
      finish_after: "Finishes Aftır",
      implements: "Implemente",
      implemented_by: "Implemente edilen",
    },
    copy_link: "İş öğesi bağlantısını kopyala",
    delete: {
      label: "İş öğesini sil",
      error: "İş öğesi silinirken hata oluştu",
    },
    subscription: {
      actions: {
        subscribed: "İş öğesine abone olundu",
        unsubscribed: "İş öğesi aboneliği sonlandırıldı",
      },
    },
    select: {
      error: "Lütfen en az bir iş öğesi seçin",
      empty: "Hiç iş öğesi seçilmedi",
      add_selected: "Seçilen iş öğelerini ekle",
      select_all: "Tümünü seç",
      deselect_all: "Tümünü seçme",
    },
    open_in_full_screen: "İş öğesini tam ekranda aç",
    vote: {
      click_to_upvote: "Olumlu oy vermek için tıklayın",
      click_to_downvote: "Olumsuz oy vermek için tıklayın",
      click_to_view_upvotes: "Olumlu oyları görüntülemek için tıklayın",
      click_to_view_downvotes: "Olumsuz oyları görüntülemek için tıklayın",
    },
  },
  attachment: {
    error: "Dosya eklenemedi. Tekrar yüklemeyi deneyin.",
    only_one_file_allowed: "Aynı anda yalnızca bir dosya yüklenebilir.",
    file_size_limit: "Dosya boyutu {size}MB veya daha az olmalıdır.",
    drag_and_drop: "Yüklemek için herhangi bir yere sürükleyip bırakın",
    delete: "Eki sil",
  },
  label: {
    select: "Etiket seç",
    create: {
      success: "Etiket başarıyla oluşturuldu",
      failed: "Etiket oluşturulamadı",
      already_exists: "Etiket zaten mevcut",
      type: "Yeni etiket eklemek için yazın",
    },
  },
  sub_work_item: {
    update: {
      success: "Alt iş öğesi başarıyla güncellendi",
      error: "Alt iş öğesi güncellenirken hata oluştu",
    },
    remove: {
      success: "Alt iş öğesi başarıyla kaldırıldı",
      error: "Alt iş öğesi kaldırılırken hata oluştu",
    },
    empty_state: {
      sub_list_filters: {
        title: "Alt iş öğelerinizin filtreleriyle eşleşmiyor.",
        description: "Tüm alt iş öğelerini görmek için tüm uygulanan filtreleri temizleyin.",
        action: "Filtreleri temizle",
      },
      list_filters: {
        title: "İş öğelerinizin filtreleriyle eşleşmiyor.",
        description: "Tüm iş öğelerini görmek için tüm uygulanan filtreleri temizleyin.",
        action: "Filtreleri temizle",
      },
    },
  },
  view: {
    label: "{count, plural, one {Görünüm} other {Görünümler}}",
    create: {
      label: "Görünüm Oluştur",
    },
    update: {
      label: "Görünümü Güncelle",
    },
  },
  inbox_issue: {
    status: {
      pending: {
        title: "Beklemede",
        description: "Beklemede",
      },
      declined: {
        title: "Reddedildi",
        description: "Reddedildi",
      },
      snoozed: {
        title: "Erteleme",
        description: "{days, plural, one{# gün} other{# gün}} kaldı",
      },
      accepted: {
        title: "Kabul Edildi",
        description: "Kabul Edildi",
      },
      duplicate: {
        title: "Kopya",
        description: "Kopya",
      },
    },
    modals: {
      decline: {
        title: "İş öğesini reddet",
        content: "{value} iş öğesini reddetmek istediğinizden emin misiniz?",
      },
      delete: {
        title: "İş öğesini sil",
        content: "{value} iş öğesini silmek istediğinizden emin misiniz?",
        success: "İş öğesi başarıyla silindi",
      },
    },
    errors: {
      snooze_permission: "Yalnızca proje yöneticileri iş öğelerini erteleyebilir/ertelemeyi kaldırabilir",
      accept_permission: "Yalnızca proje yöneticileri iş öğelerini kabul edebilir",
      decline_permission: "Yalnızca proje yöneticileri iş öğelerini reddedebilir",
    },
    actions: {
      accept: "Kabul Et",
      decline: "Reddet",
      snooze: "Ertele",
      unsnooze: "Ertelemeyi Kaldır",
      copy: "İş öğesi bağlantısını kopyala",
      delete: "Sil",
      open: "İş öğesini aç",
      mark_as_duplicate: "Kopya olarak işaretle",
      move: "{value} proje iş öğelerine taşı",
    },
    source: {
      "in-app": "uygulama içi",
    },
    order_by: {
      created_at: "Oluşturulma tarihi",
      updated_at: "Güncelleme tarihi",
      id: "ID",
    },
    label: "Talep",
    page_label: "{workspace} - Talep",
    modal: {
      title: "Talep iş öğesi oluştur",
    },
    tabs: {
      open: "Açık",
      closed: "Kapalı",
    },
    empty_state: {
      sidebar_open_tab: {
        title: "Açık iş öğesi yok",
        description: "Açık iş öğelerini burada bulabilirsiniz. Yeni iş öğesi oluşturun.",
      },
      sidebar_closed_tab: {
        title: "Kapalı iş öğesi yok",
        description: "Kabul edilen veya reddedilen tüm iş öğeleri burada bulunabilir.",
      },
      sidebar_filter: {
        title: "Eşleşen iş öğesi yok",
        description: "Talep bölümünde uygulanan filtreyle eşleşen iş öğesi yok. Yeni bir iş öğesi oluşturun.",
      },
      detail: {
        title: "Detaylarını görüntülemek için bir iş öğesi seçin.",
      },
    },
  },
  workspace_creation: {
    heading: "Çalışma Alanınızı Oluşturun",
    subheading: "Plane'i kullanmaya başlamak için bir çalışma alanı oluşturmalı veya katılmalısınız.",
    form: {
      name: {
        label: "Çalışma Alanınıza Ad Verin",
        placeholder: "Tanıdık ve tanınabilir bir şey her zaman iyidir.",
      },
      url: {
        label: "Çalışma Alanı URL'nizi Belirleyin",
        placeholder: "URL yazın veya yapıştırın",
        edit_slug: "Yalnızca URL'nin kısa adını düzenleyebilirsiniz",
      },
      organization_size: {
        label: "Bu çalışma alanını kaç kişi kullanacak?",
        placeholder: "Bir aralık seçin",
      },
    },
    errors: {
      creation_disabled: {
        title: "Yalnızca örnek yöneticiniz çalışma alanları oluşturabilir",
        description:
          "Örnek yöneticinizin e-posta adresini biliyorsanız, iletişime geçmek için aşağıdaki düğmeye tıklayın.",
        request_button: "Örnek yönetici iste",
      },
      validation: {
        name_alphanumeric: "Çalışma alanı adları yalnızca (' '), ('-'), ('_') ve alfasayısal karakterler içerebilir.",
        name_length: "Adınızı 80 karakterle sınırlayın.",
        url_alphanumeric: "URL'ler yalnızca ('-') ve alfasayısal karakterler içerebilir.",
        url_length: "URL'nizi 48 karakterle sınırlayın.",
        url_already_taken: "Çalışma alanı URL'si zaten alınmış!",
      },
    },
    request_email: {
      subject: "Yeni çalışma alanı isteği",
      body: `Merhaba örnek yönetici(ler),

Lütfen [çalışma-alanı-adı] URL'si ile [çalışma alanı oluşturma amacı] için yeni bir çalışma alanı oluşturun.

Teşekkürler,
{firstName} {lastName}
{email}`,
    },
    button: {
      default: "Çalışma alanı oluştur",
      loading: "Çalışma alanı oluşturuluyor",
    },
    toast: {
      success: {
        title: "Başarılı",
        message: "Çalışma alanı başarıyla oluşturuldu",
      },
      error: {
        title: "Hata",
        message: "Çalışma alanı oluşturulamadı. Lütfen tekrar deneyin.",
      },
    },
  },
  workspace_dashboard: {
    empty_state: {
      general: {
        title: "Projelerinizin, aktivitenizin ve metriklerinizin genel görünümü",
        description:
          "Plane'e hoş geldiniz, sizi aramızda görmekten heyecan duyuyoruz. İlk projenizi oluşturun ve iş öğelerinizi takip edin, bu sayfa ilerlemenize yardımcı olacak bir alana dönüşecek. Yöneticiler ayrıca ekiplerinin ilerlemesine yardımcı olacak öğeler görecek.",
        primary_button: {
          text: "İlk projenizi oluşturun",
          comic: {
            title: "Plane'de her şey bir projeyle başlar",
            description:
              "Bir proje, bir ürünün yol haritası, bir pazarlama kampanyası veya yeni bir araba lansmanı olabilir.",
          },
        },
      },
    },
  },
  workspace_analytics: {
    label: "Analitik",
    page_label: "{workspace} - Analitik",
    open_tasks: "Toplam açık görev",
    error: "Veri alınırken bir hata oluştu.",
    work_items_closed_in: "Kapanan iş öğeleri",
    selected_projects: "Seçilen projeler",
    total_members: "Toplam üye",
    total_cycles: "Toplam döngü",
    total_modules: "Toplam modül",
    pending_work_items: {
      title: "Bekleyen iş öğeleri",
      empty_state: "Ekip arkadaşlarınız tarafından bekleyen iş öğelerinin analizi burada görünür.",
    },
    work_items_closed_in_a_year: {
      title: "Bir yılda kapanan iş öğeleri",
      empty_state: "Aynı grafikte analizini görmek için iş öğelerini kapatın.",
    },
    most_work_items_created: {
      title: "En çok iş öğesi oluşturan",
      empty_state: "Ekip arkadaşlarınız ve onların oluşturduğu iş öğesi sayıları burada görünür.",
    },
    most_work_items_closed: {
      title: "En çok iş öğesi kapatan",
      empty_state: "Ekip arkadaşlarınız ve onların kapattığı iş öğesi sayıları burada görünür.",
    },
    tabs: {
      scope_and_demand: "Kapsam ve Talep",
      custom: "Özel Analitik",
    },
    empty_state: {
      customized_insights: {
        description: "Size atanan iş öğeleri, duruma göre ayrılarak burada gösterilecektir.",
        title: "Henüz veri yok",
      },
      created_vs_resolved: {
        description: "Zaman içinde oluşturulan ve çözümlenen iş öğeleri burada gösterilecektir.",
        title: "Henüz veri yok",
      },
      project_insights: {
        title: "Henüz veri yok",
        description: "Size atanan iş öğeleri, duruma göre ayrılarak burada gösterilecektir.",
      },
      general: {
        title:
          "İlerlemeyi, iş yüklerini ve tahsisleri takip edin. Eğilimleri tespit edin, engelleri kaldırın ve işi hızlandırın",
        description:
          "Kapsam ile talep, tahminler ve kapsam genişlemesini görün. Takım üyeleri ve takımlar bazında performans alın ve projenizin zamanında çalıştığından emin olun.",
        primary_button: {
          text: "İlk projenizi başlatın",
          comic: {
            title: "Analitik en iyi Döngüler + Modüller ile çalışır",
            description:
              "İlk olarak, sorunlarınızı Döngülere sınırlandırın ve eğer mümkünse, bir döngüden fazla süren sorunları Modüllere gruplandırın. Sol navigasyonda ikisini de kontrol edin.",
          },
        },
      },
      cycle_progress: {
        title: "Henüz veri yok",
        description:
          "Döngü ilerleme analizleri burada görünecek. İlerlemesini izlemeye başlamak için döngülere iş öğeleri ekleyin.",
      },
      module_progress: {
        title: "Henüz veri yok",
        description:
          "Modül ilerleme analizleri burada görünecek. İlerlemesini izlemeye başlamak için modüllere iş öğeleri ekleyin.",
      },
      intake_trends: {
        title: "Henüz veri yok",
        description:
          "Intake eğilim analizleri burada görünecek. Eğilimleri izlemeye başlamak için intake'e iş öğeleri ekleyin.",
      },
    },
    created_vs_resolved: "Oluşturulan vs Çözülen",
    customized_insights: "Özelleştirilmiş İçgörüler",
    backlog_work_items: "Backlog {entity}",
    active_projects: "Aktif Projeler",
    trend_on_charts: "Grafiklerdeki eğilim",
    all_projects: "Tüm Projeler",
    summary_of_projects: "Projelerin Özeti",
    project_insights: "Proje İçgörüleri",
    started_work_items: "Başlatılan {entity}",
    total_work_items: "Toplam {entity}",
    total_projects: "Toplam Proje",
    total_admins: "Toplam Yönetici",
    total_users: "Toplam Kullanıcı",
    total_intake: "Toplam Gelir",
    un_started_work_items: "Başlanmamış {entity}",
    total_guests: "Toplam Misafir",
    completed_work_items: "Tamamlanmış {entity}",
    total: "Toplam {entity}",
    projects_by_status: "Durumuna göre projeler",
    active_users: "Aktif kullanıcılar",
    intake_trends: "Alım Eğilimleri",
    workitem_resolved_vs_pending: "Çözülen vs bekleyen iş öğeleri",
    upgrade_to_plan: "{tab} sekmesini açmak için {plan} planına geçin",
  },
  workspace_projects: {
    label: "{count, plural, one {Proje} other {Projeler}}",
    create: {
      label: "Proje Ekle",
    },
    network: {
      label: "Ağ",
      private: {
        title: "Özel",
        description: "Yalnızca davetle erişilebilir",
      },
      public: {
        title: "Herkese Açık",
        description: "Çalışma alanındaki herkes (Misafirler hariç) katılabilir",
      },
    },
    error: {
      permission: "Bu işlemi yapma izniniz yok.",
      cycle_delete: "Döngü silinemedi",
      module_delete: "Modül silinemedi",
      issue_delete: "İş öğesi silinemedi",
    },
    state: {
      backlog: "Bekleme Listesi",
      unstarted: "Başlatılmadı",
      started: "Başlatıldı",
      completed: "Tamamlandı",
      cancelled: "İptal Edildi",
    },
    sort: {
      manual: "Manuel",
      name: "Ad",
      created_at: "Oluşturulma tarihi",
      members_length: "Üye sayısı",
    },
    scope: {
      my_projects: "Projelerim",
      archived_projects: "Arşivlenmiş",
    },
    common: {
      months_count: "{months, plural, one{# ay} other{# ay}}",
    },
    empty_state: {
      general: {
        title: "Aktif proje yok",
        description:
          "Her projeyi hedef odaklı çalışmanın üst öğesi olarak düşünün. Projeler, İşler, Döngüler ve Modüllerin yaşadığı ve meslektaşlarınızla birlikte bu hedefe ulaşmanıza yardımcı olan yerlerdir. Yeni bir proje oluşturun veya arşivlenmiş projeler için filtreleyin.",
        primary_button: {
          text: "İlk projenizi başlatın",
          comic: {
            title: "Plane'de her şey bir projeyle başlar",
            description:
              "Bir proje, bir ürünün yol haritası, bir pazarlama kampanyası veya yeni bir araba lansmanı olabilir.",
          },
        },
      },
      no_projects: {
        title: "Proje yok",
        description:
          "İş öğesi oluşturmak veya işlerinizi yönetmek için bir proje oluşturmalı veya bir parçası olmalısınız.",
        primary_button: {
          text: "İlk projenizi başlatın",
          comic: {
            title: "Plane'de her şey bir projeyle başlar",
            description:
              "Bir proje, bir ürünün yol haritası, bir pazarlama kampanyası veya yeni bir araba lansmanı olabilir.",
          },
        },
      },
      filter: {
        title: "Eşleşen proje yok",
        description: `Eşleşen kriterlerle proje bulunamadı.
 Bunun yerine yeni bir proje oluşturun.`,
      },
      search: {
        description: `Eşleşen kriterlerle proje bulunamadı.
Bunun yerine yeni bir proje oluşturun`,
      },
    },
  },
  workspace_views: {
    add_view: "Görünüm ekle",
    empty_state: {
      "all-issues": {
        title: "Projede iş öğesi yok",
        description: "İlk projeniz tamamlandı! Şimdi, işlerinizi izlenebilir parçalara bölün. Hadi başlayalım!",
        primary_button: {
          text: "Yeni iş öğesi oluştur",
        },
      },
      assigned: {
        title: "Henüz iş öğesi yok",
        description: "Size atanan iş öğeleri buradan takip edilebilir.",
        primary_button: {
          text: "Yeni iş öğesi oluştur",
        },
      },
      created: {
        title: "Henüz iş öğesi yok",
        description: "Sizin oluşturduğunuz tüm iş öğeleri burada görünecek, doğrudan buradan takip edin.",
        primary_button: {
          text: "Yeni iş öğesi oluştur",
        },
      },
      subscribed: {
        title: "Henüz iş öğesi yok",
        description: "İlgilendiğiniz iş öğelerine abone olun, hepsini buradan takip edin.",
      },
      "custom-view": {
        title: "Henüz iş öğesi yok",
        description: "Filtrelere uyan iş öğeleri burada takip edilebilir.",
      },
    },
    delete_view: {
      title: "Bu görünümü silmek istediğinizden emin misiniz?",
      content:
        "Onaylarsanız, bu görünüm için seçtiğiniz tüm sıralama, filtreleme ve görüntüleme seçenekleri + düzen kalıcı olarak silinecek ve geri yükleme imkanı olmayacaktır.",
    },
  },
  account_settings: {
    profile: {
      change_email_modal: {
        title: "E-postayı değiştir",
        description: "Doğrulama bağlantısı almak için yeni bir e-posta adresi girin.",
        toasts: {
          success_title: "Başarılı!",
          success_message: "E-posta başarıyla güncellendi. Lütfen tekrar giriş yapın.",
        },
        form: {
          email: {
            label: "Yeni e-posta",
            placeholder: "E-postanızı girin",
            errors: {
              required: "E-posta zorunludur",
              invalid: "E-posta geçersiz",
              exists: "E-posta zaten mevcut. Başka bir tane kullanın.",
              validation_failed: "E-posta doğrulaması başarısız oldu. Lütfen tekrar deneyin.",
            },
          },
          code: {
            label: "Benzersiz kod",
            placeholder: "123456",
            helper_text: "Doğrulama kodu yeni e-postanıza gönderildi.",
            errors: {
              required: "Benzersiz kod zorunludur",
              invalid: "Geçersiz doğrulama kodu. Lütfen tekrar deneyin.",
            },
          },
        },
        actions: {
          continue: "Devam et",
          confirm: "Onayla",
          cancel: "İptal et",
        },
        states: {
          sending: "Gönderiliyor…",
        },
      },
    },
    notifications: {
      select_default_view: "Varsayılan görünümü seç",
      compact: "Kompakt",
      full: "Tam ekran",
    },
  },
  workspace_settings: {
    label: "Çalışma Alanı Ayarları",
    page_label: "{workspace} - Genel ayarlar",
    key_created: "Anahtar oluşturuldu",
    copy_key:
      "Bu gizli anahtarı Plane Pages'e kopyalayıp kaydedin. Kapat düğmesine bastıktan sonra bu anahtarı göremezsiniz. Anahtar içeren bir CSV dosyası indirildi.",
    token_copied: "Token panoya kopyalandı.",
    settings: {
      general: {
        title: "Genel",
        upload_logo: "Logo yükle",
        edit_logo: "Logoyu düzenle",
        name: "Çalışma Alanı Adı",
        company_size: "Şirket Büyüklüğü",
        url: "Çalışma Alanı URL'si",
        workspace_timezone: "Çalışma Alanı Saat Dilimi",
        update_workspace: "Çalışma Alanını Güncelle",
        delete_workspace: "Bu çalışma alanını sil",
        delete_workspace_description:
          "Bir çalışma alanı silindiğinde, içindeki tüm veri ve kaynaklar kalıcı olarak kaldırılır ve kurtarılamaz.",
        delete_btn: "Bu çalışma alanını sil",
        delete_modal: {
          title: "Bu çalışma alanını silmek istediğinizden emin misiniz?",
          description:
            "Ücretli planlarımızdan birine aktif bir deneme sürümünüz var. Devam etmek için önce iptal edin.",
          dismiss: "Kapat",
          cancel: "Denemeyi iptal et",
          success_title: "Çalışma alanı silindi.",
          success_message: "Kısa süre sonra profil sayfanıza yönlendirileceksiniz.",
          error_title: "Bu işe yaramadı.",
          error_message: "Lütfen tekrar deneyin.",
        },
        errors: {
          name: {
            required: "Ad gereklidir",
            max_length: "Çalışma alanı adı 80 karakteri geçmemeli",
          },
          company_size: {
            required: "Şirket büyüklüğü gereklidir",
            select_a_range: "Kuruluş büyüklüğünü seçin",
          },
        },
      },
      members: {
        title: "Üyeler",
        add_member: "Üye ekle",
        pending_invites: "Bekleyen davetler",
        invitations_sent_successfully: "Davetler başarıyla gönderildi",
        leave_confirmation:
          "Çalışma alanından ayrılmak istediğinizden emin misiniz? Artık bu çalışma alanına erişiminiz olmayacak. Bu işlem geri alınamaz.",
        details: {
          full_name: "Tam ad",
          display_name: "Görünen ad",
          email_address: "E-posta adresi",
          account_type: "Hesap türü",
          authentication: "Kimlik Doğrulama",
          joining_date: "Katılma tarihi",
        },
        modal: {
          title: "İşbirliği yapmaları için kişileri davet edin",
          description: "Kişileri çalışma alanınızda işbirliği yapmaları için davet edin.",
          button: "Davetleri gönder",
          button_loading: "Davetler gönderiliyor",
          placeholder: "isim@firma.com",
          errors: {
            required: "Davet etmek için bir e-posta adresine ihtiyacımız var.",
            invalid: "E-posta geçersiz",
          },
        },
      },
      billing_and_plans: {
        title: "Faturalandırma ve Planlar",
        current_plan: "Mevcut plan",
        free_plan: "Şu anda ücretsiz planı kullanıyorsunuz",
        view_plans: "Planları görüntüle",
      },
      exports: {
        title: "Dışa Aktarımlar",
        exporting: "Dışa aktarılıyor",
        previous_exports: "Önceki dışa aktarımlar",
        export_separate_files: "Verileri ayrı dosyalara aktar",
        filters_info: "Kriterlerinize göre belirli iş öğelerini dışa aktarmak için filtreler uygulayın.",
        modal: {
          title: "Şuraya aktar",
          toasts: {
            success: {
              title: "Dışa aktarma başarılı",
              message: "{entity} önceki dışa aktarmadan indirilebilir.",
            },
            error: {
              title: "Dışa aktarma başarısız",
              message: "Dışa aktarma başarısız oldu. Lütfen tekrar deneyin.",
            },
          },
        },
      },
      webhooks: {
        title: "Webhook'lar",
        add_webhook: "Webhook ekle",
        modal: {
          title: "Webhook oluştur",
          details: "Webhook detayları",
          payload: "Payload URL",
          question: "Bu webhook'u hangi olaylar tetiklesin?",
          error: "URL gereklidir",
        },
        secret_key: {
          title: "Gizli anahtar",
          message: "Webhook payload'ında oturum açmak için bir token oluşturun",
        },
        options: {
          all: "Her şeyi gönder",
          individual: "Tek tek olayları seç",
        },
        toasts: {
          created: {
            title: "Webhook oluşturuldu",
            message: "Webhook başarıyla oluşturuldu",
          },
          not_created: {
            title: "Webhook oluşturulamadı",
            message: "Webhook oluşturulamadı",
          },
          updated: {
            title: "Webhook güncellendi",
            message: "Webhook başarıyla güncellendi",
          },
          not_updated: {
            title: "Webhook güncellenemedi",
            message: "Webhook güncellenemedi",
          },
          removed: {
            title: "Webhook kaldırıldı",
            message: "Webhook başarıyla kaldırıldı",
          },
          not_removed: {
            title: "Webhook kaldırılamadı",
            message: "Webhook kaldırılamadı",
          },
          secret_key_copied: {
            message: "Gizli anahtar panoya kopyalandı.",
          },
          secret_key_not_copied: {
            message: "Gizli anahtar kopyalanırken hata oluştu.",
          },
        },
      },
      api_tokens: {
        heading: "API Token'ları",
        description:
          "Verilerinizi harici sistemler ve uygulamalarla entegre etmek için güvenli API token'ları oluşturun.",
        title: "API Token'ları",
        add_token: "Erişim token'ı ekle",
        create_token: "Token oluştur",
        never_expires: "Süresi dolmaz",
        generate_token: "Token oluştur",
        generating: "Oluşturuluyor",
        delete: {
          title: "API Token'ını sil",
          description: "Bu token'ı kullanan uygulamalar artık Plane verilerine erişemeyecek. Bu işlem geri alınamaz.",
          success: {
            title: "Başarılı!",
            message: "API token'ı başarıyla silindi",
          },
          error: {
            title: "Hata!",
            message: "API token'ı silinemedi",
          },
        },
      },
      integrations: {
        title: "Entegrasyonlar",
        page_title: "Plane verilerinizi mevcut uygulamalarda veya kendi uygulamalarınızda kullanın.",
        page_description: "Bu çalışma alanı veya sizin tarafınızdan kullanılan tüm entegrasyonları görüntüleyin.",
      },
      imports: {
        title: "İmportlar",
      },
      worklogs: {
        title: "Workloglar",
      },
      group_syncing: {
        title: "Grup senkronizasyonu",
        heading: "Grup senkronizasyonu",
        description:
          "Kimlik sağlayıcı gruplarını projelere ve rollere bağlayın. IdP'nizde grup üyeliği değiştiğinde kullanıcı erişimi otomatik olarak güncellenir; işe alıştırma ve işten çıkarma süreçlerini basitleştirir.",
        enable: {
          title: "Grup senkronizasyonunu etkinleştir",
          description: "Kimlik sağlayıcı gruplarına göre kullanıcıları projelere otomatik olarak ekleyin.",
        },
        config: {
          title: "Grup senkronizasyonunu yapılandır",
          description: "Kimlik sağlayıcı gruplarının projelere ve rollere nasıl eşlendiğini ayarlayın.",
          sync_on_login: {
            title: "Girişte senkronize et",
            description: "Kullanıcı giriş yaptığında grup üyeliğini ve proje erişimini güncelleyin.",
          },
          sync_offline: {
            title: "Çevrimdışı senkronizasyon",
            description:
              "Kullanıcıların giriş yapmasını beklemeden her altı saatte bir otomatik olarak senkronizasyon çalıştırır.",
          },
          auto_remove: {
            title: "Otomatik kaldırma",
            description: "Artık gruba uymayan kullanıcıları projelerden otomatik olarak kaldırın.",
          },
          group_attribute_key: {
            title: "Grup öznitelik anahtarı",
            description:
              "Kullanıcı gruplarını tanımlamak ve senkronize etmek için kullanılan kimlik sağlayıcı özniteliği.",
            placeholder: "Gruplar",
          },
        },
        group_mapping: {
          title: "Grup eşlemesi",
          description: "Kimlik sağlayıcı gruplarını projelere ve rollere bağlayın.",
          button_text: "Yeni grup senkronizasyonu ekle",
        },
        toast: {
          updating: "Grup senkronizasyonu özelliği güncelleniyor",
          success: "Grup senkronizasyonu özelliği başarıyla güncellendi.",
          error: "Grup senkronizasyonu özelliği güncellenemedi!",
        },
        delete_modal: {
          title: "Grup senkronizasyonunu sil",
          content:
            "Bu kimlik grubundan yeni kullanıcılar artık projeye eklenmeyecek. Zaten eklenen kullanıcılar mevcut rollerini koruyacaktır.",
        },
        modal: {
          idp_group_name: {
            text: "Kullanıcı grubu",
            required: "Kullanıcı grubu zorunludur",
            placeholder: "IdP grup adlarını girin",
          },
          project: {
            text: "Proje",
            required: "Proje zorunludur",
            placeholder: "Proje seçin",
          },
          default_role: {
            text: "Proje rolü",
            required: "Proje rolü zorunludur",
            placeholder: "Proje rolü seçin",
          },
        },
      },
      identity: {
        title: "Kimlik",
        heading: "Kimlik",
        description: "Alan adınızı yapılandırın ve Tek oturum açmayı etkinleştirin",
      },
      project_states: {
        title: "Proje durumları",
      },
      projects: {
        title: "Projeler",
        description:
          "Proje durumlarını yönetin, proje etiketlerini etkinleştirin ve diğer yapılandırmaları düzenleyin.",
        tabs: {
          states: "Proje durumları",
          labels: "Proje etiketleri",
        },
      },
      teamspaces: {
        title: "Timspeys",
      },
      initiatives: {
        title: "İnisiyatifler",
      },
      customers: {
        title: "Kastımerlar",
      },
      releases: {
        title: "Sürümler",
        update_release: "Sürümü güncelle",
        create_release: "Sürüm oluştur",
        errors: {
          release_not_found: "Aradığınız sürüm mevcut değil.",
          unknown: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
        },
      },

      cancel_trial: {
        title: "Önce deneme sürenizi iptal edin.",
        description:
          "Ücretli planlarımızdan birine ait aktif deneme süreniz var. Lütfen devam etmek için önce bunu iptal edin.",
        dismiss: "Kapat",
        cancel: "Denemeyi iptal et",
        cancel_success_title: "Deneme iptal edildi.",
        cancel_success_message: "Artık workspeysi silebilirsiniz.",
        cancel_error_title: "Bu işlem başarısız oldu.",
        cancel_error_message: "Lütfen tekrar deneyin.",
      },
      applications: {
        title: "Aplikasyonlar",
        applicationId_copied: "Aplikasyon ID panoya kopyalandı",
        clientId_copied: "Klayınt ID panoya kopyalandı",
        clientSecret_copied: "Klayınt Sikrıt panoya kopyalandı",
        third_party_apps: "Üçüncü parti aplikasyonlar",
        your_apps: "Aplikasyonlarınız",
        connect: "Bağlan",
        connected: "Bağlandı",
        install: "Yükle",
        installed: "Yüklendi",
        configure: "Yapılandır",
        app_available: "Bu aplikasyonu bir Pleyn workspeysi ile kullanılabilir hale getirdiniz",
        app_available_description: "Kullanmaya başlamak için bir Pleyn workspeysi bağlayın",
        client_id_and_secret: "Klayınt ID ve Sikrıt",
        client_id_and_secret_description:
          "Bu sikrıt anahtarı Peycislere kopyalayıp kaydedin. Kapat'a bastıktan sonra bu anahtarı tekrar göremezsiniz.",
        client_id_and_secret_download: "Anahtarı buradan CSV olarak indirebilirsiniz.",
        application_id: "Aplikasyon ID",
        client_id: "Klayınt ID",
        client_secret: "Klayınt Sikrıt",
        export_as_csv: "CSV olarak dışa aktar",
        slug_already_exists: "Slag zaten mevcut",
        failed_to_create_application: "Aplikasyon oluşturulamadı",
        upload_logo: "Logo yükle",
        app_name_title: "Bu aplikasyonu ne olarak adlandıracaksınız",
        app_name_error: "Aplikasyon adı gerekli",
        app_short_description_title: "Bu aplikasyona kısa bir açıklama verin",
        app_short_description_error: "Aplikasyon kısa açıklaması gerekli",
        app_description_title: {
          label: "Uzun açıklama",
          placeholder: "Pazar yeri için uzun bir açıklama yazın. Komutlar için '/' tuşuna basın.",
        },
        authorization_grant_type: {
          title: "Bağlantı türü",
          description:
            "Uygulamanızın çalışma alanı için bir kez mi kurulması gerektiğini yoksa her kullanıcının kendi hesabını bağlamasına mı izin verileceğini seçin",
        },
        app_description_error: "Aplikasyon açıklaması gerekli",
        app_slug_title: "Aplikasyon slag",
        app_slug_error: "Aplikasyon slag gerekli",
        app_maker_title: "Aplikasyon Meykır",
        app_maker_error: "Aplikasyon meykır gerekli",
        webhook_url_title: "Webhuk URL",
        webhook_url_error: "Webhuk URL gerekli",
        invalid_webhook_url_error: "Geçersiz webhuk URL",
        redirect_uris_title: "Ridayrekt URIları",
        redirect_uris_error: "Ridayrekt URIları gerekli",
        invalid_redirect_uris_error: "Geçersiz ridayrekt URIları",
        redirect_uris_description:
          "Aplikasyonun kullanıcıdan sonra yönlendirileceği boşlukla ayrılmış URIları girin örn. https://example.com https://example.com/",
        authorized_javascript_origins_title: "Yetkilendirilmiş Cavaskrip Orijinleri",
        authorized_javascript_origins_error: "Yetkilendirilmiş Cavaskrip Orijinleri gerekli",
        invalid_authorized_javascript_origins_error: "Geçersiz yetkilendirilmiş Cavaskrip Orijinleri",
        authorized_javascript_origins_description:
          "Aplikasyonun istek yapmasına izin verilecek boşlukla ayrılmış orijinleri girin örn. app.com example.com",
        create_app: "Aplikasyon oluştur",
        update_app: "Aplikasyonu güncelle",
        regenerate_client_secret_description:
          "Klayınt sikrıtı yeniden oluştur. Sikrıtı yeniden oluşturursanız, anahtarı kopyalayabilir veya hemen sonra bir CSV dosyasına indirebilirsiniz.",
        regenerate_client_secret: "Klayınt sikrıtı yeniden oluştur",
        regenerate_client_secret_confirm_title: "Klayınt sikrıtı yeniden oluşturmak istediğinizden emin misiniz?",
        regenerate_client_secret_confirm_description:
          "Bu sikrıtı kullanan aplikasyon çalışmayı durduracak. Sikrıtı aplikasyonda güncellemeniz gerekecek.",
        regenerate_client_secret_confirm_cancel: "İptal",
        regenerate_client_secret_confirm_regenerate: "Yeniden oluştur",
        read_only_access_to_workspace: "Workspeysinize salt okunur erişim",
        write_access_to_workspace: "Workspeysinize yazma erişimi",
        read_only_access_to_user_profile: "Kullanıcı profilinize salt okunur erişim",
        write_access_to_user_profile: "Kullanıcı profilinize yazma erişimi",
        connect_app_to_workspace: "{app} aplikasyonunu {workspace} workspeysinize bağlayın",
        user_permissions: "Kullanıcı permişınları",
        user_permissions_description: "Kullanıcı permişınları, kullanıcının profiline erişim vermek için kullanılır.",
        workspace_permissions: "Workspeysı permişınları",
        workspace_permissions_description: "Workspeysı permişınları, workspeyse erişim vermek için kullanılır.",
        with_the_permissions: "permişınlarla birlikte",
        app_consent_title: "{app} Pleyn workspeysinize ve profilinize erişim talep ediyor.",
        choose_workspace_to_connect_app_with: "Aplikasyonu bağlamak için bir workspeysı seçin",
        app_consent_workspace_permissions_title: "{app} şunları yapmak istiyor",
        app_consent_user_permissions_title:
          "{app} ayrıca bir kullanıcının aşağıdaki kaynaklara erişim permişınını talep edebilir. Bu permişınlar yalnızca bir kullanıcı tarafından talep edilecek ve yetkilendirilecektir.",
        app_consent_accept_title: "Kabul ederek",
        app_consent_accept_1:
          "Aplikasyona Pleyn içinde veya dışında kullanabileceğiniz her yerde Pleyn verilerinize erişim izni verirsiniz",
        app_consent_accept_2: "{app}'in Gizlilik Politikası ve Kullanım Koşullarını kabul edersiniz",
        accepting: "Kabul ediliyor...",
        accept: "Kabul et",
        categories: "Kategoriler",
        select_app_categories: "Aplikasyon kategorilerini seçin",
        categories_title: "Kategoriler",
        categories_error: "Kategoriler gerekli",
        invalid_categories_error: "Geçersiz kategoriler",
        categories_description: "En iyi açıklamayı veren kategorileri seçin",
        supported_plans: "Desteklenen Planlar",
        supported_plans_description:
          "Bu uygulamayı yükleyebilecek çalışma alanı planlarını seçin. Tüm planlara izin vermek için boş bırakın.",
        select_plans: "Planları Seç",
        privacy_policy_url_title: "Gizlilik Politikası URL",
        privacy_policy_url_error: "Gizlilik Politikası URL gerekli",
        invalid_privacy_policy_url_error: "Geçersiz gizlilik politikası URL",
        terms_of_service_url_title: "Hizmet Şartları URL",
        terms_of_service_url_error: "Hizmet Şartları URL gerekli",
        invalid_terms_of_service_url_error: "Geçersiz hizmet şartları URL",
        support_url_title: "Destek URL",
        support_url_error: "Destek URL gerekli",
        invalid_support_url_error: "Geçersiz destek URL",
        video_url_title: "Video URL",
        video_url_error: "Video URL gerekli",
        invalid_video_url_error: "Geçersiz video URL",
        setup_url_title: "Kurulum URL",
        setup_url_error: "Kurulum URL gerekli",
        invalid_setup_url_error: "Geçersiz kurulum URL",
        configuration_url_title: "Yapılandırma URL",
        configuration_url_error: "Yapılandırma URL gerekli",
        invalid_configuration_url_error: "Geçersiz yapılandırma URL",
        contact_email_title: "İletişim Email",
        contact_email_error: "İletişim Email gerekli",
        invalid_contact_email_error: "Geçersiz iletişim email",
        upload_attachments: "Ekleri yükle",
        uploading_images: "{count, plural, one {Yükleniyor {count} görsel} other {Yükleniyor {count} görsel}}",
        drop_images_here: "Görselleri buraya bırakın",
        click_to_upload_images: "Görselleri yüklemek için tıklayın",
        invalid_file_or_exceeds_size_limit: "Geçersiz dosya veya boyut sınırını aşıyor ({size} MB)",
        uploading: "Yükleniyor...",
        upload_and_save: "Yükle ve kaydet",
        app_credentials_regenrated: {
          title: "Uygulama kimlik bilgileri başarıyla yeniden oluşturuldu",
          description: "İstemci sırrını kullanıldığı her yerde değiştirin. Önceki sır artık geçerli değil.",
        },
        app_created: {
          title: "Uygulama başarıyla oluşturuldu",
          description: "Uygulamayı bir Plane çalışma alanına yüklemek için kimlik bilgilerini kullanın",
        },
        installed_apps: "Yüklü uygulamalar",
        all_apps: "Tüm uygulamalar",
        internal_apps: "Dahili uygulamalar",
        website: {
          title: "Web sitesi",
          description: "Uygulamanızın web sitesine bağlantı.",
          placeholder: "https://example.com",
        },
        app_maker: {
          title: "Uygulama Yapıcı",
          description: "Uygulamayı oluşturan kişi veya kuruluş.",
        },
        setup_url: {
          label: "Kurulum URL'si",
          description: "Kullanıcılar uygulamayı yüklediklerinde bu URL'ye yönlendirilecektir.",
          placeholder: "https://example.com/setup",
        },
        webhook_url: {
          label: "Webhook URL'si",
          description:
            "Uygulamanızın yüklü olduğu çalışma alanlarından webhook olaylarını ve güncellemelerini buraya göndereceğiz.",
          placeholder: "https://example.com/webhook",
        },
        redirect_uris: {
          label: "Yönlendirme URI'leri (boşluk ile ayrılmış)",
          description: "Kullanıcılar Plane ile kimlik doğrulaması yaptıktan sonra bu yola yönlendirilecektir.",
          placeholder: "https://example.com https://example.com/",
        },
        app_consent_no_access_description:
          "Bu uygulama yalnızca bir workspace yöneticisi tarafından kurulduktan sonra yüklenebilir. Devam etmek için workspace yöneticinizle iletişime geçin.",
        enable_app_mentions: "Uygulama bahsini etkinleştir",
        enable_app_mentions_tooltip:
          "Bu etkinleştirildiğinde, kullanıcılar Çalışma Öğelerini bu uygulamaya atayabilir veya bahsedebilir.",
        scopes: "Kapsamlar",
        select_scopes: "Kapsamları seçin",
        read_access_to: "Salt okunur erişim",
        write_access_to: "Yazma erişimi",
        global_permission_expiration:
          "Genel kapsamlar yakında sona erecek. Bunun yerine ayrıntılı kapsamlar kullanın. Örneğin, genel okuma yerine project:read kullanın.",
        selected_scopes: "{count} seçildi",
        scopes_and_permissions: "Kapsamlar ve izinler",
        read: "Okuma",
        write: "Yazma",
        scope_description: {
          projects: "Projelere ve projeyle ilgili tüm varlıklara erişim",
          wiki: "Wiki'ye ve wiki ile ilgili tüm varlıklara erişim",
          customers: "Müşterilere ve müşteriyle ilgili tüm varlıklara erişim",
          initiatives: "Girişimlere ve girişimle ilgili tüm varlıklara erişim",
          workspaces: "Çalışma alanlarına ve ilgili tüm varlıklara erişim",
          stickies: "Yapışkanlara ve ilgili tüm varlıklara erişim",
          teamspaces: "Takım alanlarına ve ilgili tüm varlıklara erişim",
          profile: "Kullanıcı profil bilgilerine erişim",
          agents: "Ajanlara ve tüm ajana bağlı varlıklara erişim",
          assets: "Varlıklara ve tüm varlıkla ilgili öğelere erişim",
        },
        build_your_own_app: "Kendi uygulamanızı oluşturun",
        edit_app_details: "Uygulama ayrıntılarını düzenle",
        internal: "Dahili",
      },
      "plane-intelligence": {
        title: "Plane AI",
        heading: "Plane AI",
        description:
          "İşinizi daha akıllı ve daha hızlı hale getirmek için doğal olarak işinize ve bilgi tabanınıza bağlı olan AI kullanın.",
      },
    },
    empty_state: {
      api_tokens: {
        title: "API token'ı oluşturulmadı",
        description: "Plane API'lerini harici sistemlere entegre etmek için bir token oluşturun.",
      },
      webhooks: {
        title: "Webhook eklenmedi",
        description:
          "Gerçek zamanlı güncellemeler almak ve otomatik eylemler gerçekleştirmek için webhook'lar oluşturun.",
      },
      exports: {
        title: "Henüz dışa aktarma yok",
        description: "Dışa aktardığınızda, referans için burada bir kopya bulunur.",
      },
      imports: {
        title: "Henüz içe aktarma yok",
        description: "Tüm önceki içe aktarmalarınızı burada bulabilir ve indirebilirsiniz.",
      },
    },
  },
  profile: {
    label: "Profil",
    page_label: "Sizin İşleriniz",
    work: "İş",
    details: {
      joined_on: "Katılma tarihi",
      time_zone: "Saat Dilimi",
    },
    stats: {
      workload: "İş Yükü",
      overview: "Genel Bakış",
      created: "Oluşturulan iş öğeleri",
      assigned: "Atanan iş öğeleri",
      subscribed: "Abone olunan iş öğeleri",
      state_distribution: {
        title: "Duruma göre iş öğeleri",
        empty: "Daha iyi analiz için durumlarına göre iş öğelerini görmek üzere iş öğesi oluşturun.",
      },
      priority_distribution: {
        title: "Önceliğe göre iş öğeleri",
        empty: "Daha iyi analiz için önceliklerine göre iş öğelerini görmek üzere iş öğesi oluşturun.",
      },
      recent_activity: {
        title: "Son aktiviteler",
        empty: "Veri bulunamadı. Lütfen girdilerinizi kontrol edin",
        button: "Bugünün aktivitesini indir",
        button_loading: "İndiriliyor",
      },
    },
    actions: {
      profile: "Profil",
      security: "Güvenlik",
      activity: "Aktivite",
      appearance: "Görünüm",
      notifications: "Bildirimler",
      connections: "Bağlantılar",
    },
    tabs: {
      summary: "Özet",
      assigned: "Atanan",
      created: "Oluşturulan",
      subscribed: "Abone olunan",
      activity: "Aktivite",
    },
    empty_state: {
      activity: {
        title: "Henüz aktivite yok",
        description:
          "Yeni bir iş öğesi oluşturarak başlayın! Detaylar ve özellikler ekleyin. Aktivitenizi görmek için Plane'de daha fazlasını keşfedin.",
      },
      assigned: {
        title: "Size atanan iş öğesi yok",
        description: "Size atanan iş öğeleri buradan takip edilebilir.",
      },
      created: {
        title: "Henüz iş öğesi yok",
        description: "Sizin oluşturduğunuz tüm iş öğeleri burada görünecek, doğrudan buradan takip edin.",
      },
      subscribed: {
        title: "Henüz iş öğesi yok",
        description: "İlgilendiğiniz iş öğelerine abone olun, hepsini buradan takip edin.",
      },
    },
  },
  project_settings: {
    general: {
      enter_project_id: "Proje ID girin",
      please_select_a_timezone: "Lütfen bir saat dilimi seçin",
      archive_project: {
        title: "Projeyi arşivle",
        description:
          "Bir projeyi arşivlemek, projenizi yan gezintiden kaldırır ancak yine de projeler sayfasından erişebilirsiniz. Projeyi istediğiniz zaman geri yükleyebilir veya silebilirsiniz.",
        button: "Projeyi arşivle",
      },
      delete_project: {
        title: "Projeyi sil",
        description: "Bir proje silindiğinde, içindeki tüm veri ve kaynaklar kalıcı olarak kaldırılır ve kurtarılamaz.",
        button: "Projemi sil",
      },
      toast: {
        success: "Proje başarıyla güncellendi",
        error: "Proje güncellenemedi. Lütfen tekrar deneyin.",
      },
    },
    members: {
      label: "Üyeler",
      project_lead: "Proje lideri",
      default_assignee: "Varsayılan atanan",
      guest_super_permissions: {
        title: "Misafir kullanıcılara tüm iş öğelerini görüntüleme izni ver:",
        sub_heading: "Bu, misafirlerin tüm proje iş öğelerini görüntülemesine izin verecektir.",
      },
      invite_members: {
        title: "Üyeleri davet et",
        sub_heading: "Projenizde çalışmaları için üyeleri davet edin.",
        select_co_worker: "İş arkadaşı seç",
      },
      project_lead_description: "Proje için proje liderini seçin.",
      default_assignee_description: "Proje için varsayılan atanacak kişiyi seçin.",
      project_subscribers: "Proje aboneleri",
      project_subscribers_description: "Bu proje için bildirim alacak üyeleri seçin.",
    },
    states: {
      describe_this_state_for_your_members: "Bu durumu üyeleriniz için açıklayın.",
      empty_state: {
        title: "{groupKey} grubu için durum yok",
        description: "Lütfen yeni bir durum oluşturun",
      },
    },
    labels: {
      label_title: "Etiket başlığı",
      label_title_is_required: "Etiket başlığı gereklidir",
      label_max_char: "Etiket adı 255 karakteri geçmemeli",
      toast: {
        error: "Etiket güncellenirken hata oluştu",
      },
    },
    estimates: {
      label: "Tahminler",
      title: "Projem için tahminleri etkinleştir",
      description: "Takımınızın karmaşıklık ve iş yükünü iletişim kurmanıza yardımcı olurlar.",
      no_estimate: "Tahmin yok",
      create: {
        custom: "Özel",
        start_from_scratch: "Sıfırdan başla",
        choose_template: "Şablon seç",
        choose_estimate_system: "Tahmin sistemi seç",
        enter_estimate_point: "Tahmin puanı girin",
      },
      toasts: {
        created: {
          success: {
            title: "Tahmin puanı oluşturuldu",
            message: "Tahmin puanı başarıyla oluşturuldu",
          },
          error: {
            title: "Tahmin puanı oluşturulamadı",
            message: "Yeni tahmin puanı oluşturulamadı, lütfen tekrar deneyin.",
          },
        },
        updated: {
          success: {
            title: "Tahmin değiştirildi",
            message: "Tahmin puanı projenizde güncellendi.",
          },
          error: {
            title: "Tahmin değiştirilemedi",
            message: "Tahmin değiştirilemedi, lütfen tekrar deneyin",
          },
        },
        enabled: {
          success: {
            title: "Başarılı!",
            message: "Tahminler etkinleştirildi.",
          },
        },
        disabled: {
          success: {
            title: "Başarılı!",
            message: "Tahminler devre dışı bırakıldı.",
          },
          error: {
            title: "Hata!",
            message: "Tahmin devre dışı bırakılamadı. Lütfen tekrar deneyin",
          },
        },
        reorder: {
          success: {
            title: "Estimasyonlar yeniden sıralandı",
            message: "Projenizdeki estimasyonlar yeniden sıralandı.",
          },
          error: {
            title: "Estimasyonları yeniden sıralama başarısız",
            message: "Estimasyonlar yeniden sıralanamadı, lütfen tekrar deneyin",
          },
        },
        switch: {
          success: {
            title: "Estimeyt sistemi oluşturuldu",
            message: "Başarıyla oluşturuldu ve aktif edildi",
          },
          error: {
            title: "Erır",
            message: "Bir şeyler yanlış gitti",
          },
        },
      },
      validation: {
        min_length: "Tahmin puanı 0'dan büyük olmalı.",
        unable_to_process: "İsteğiniz işlenemedi, lütfen tekrar deneyin.",
        numeric: "Tahmin puanı sayısal bir değer olmalı.",
        character: "Tahmin puanı karakter değeri olmalı.",
        empty: "Tahmin değeri boş olamaz.",
        already_exists: "Tahmin değeri zaten var.",
        unsaved_changes: "Kaydedilmemiş değişiklikleriniz var, bitirmeden önce lütfen kaydedin",
        fill: "Lütfen bu estimasyon alanını doldurun",
        repeat: "Estimasyon değeri tekrar edemez",
      },
      edit: {
        title: "Estimasyon sistemini düzenle",
        add_or_update: {
          title: "Estimasyonları ekle, güncelle veya sil",
          description: "Mevcut sistemi puanlar veya kategoriler ekleyerek, güncelleyerek veya silerek yönetin.",
        },
        switch: {
          title: "Estimasyon tipini değiştir",
          description: "Puan sisteminizi kategori sistemine veya tam tersine dönüştürün.",
        },
      },
      switch: "Estimasyon sistemini değiştir",
      current: "Mevcut estimasyon sistemi",
      select: "Estimasyon sistemi seç",
    },
    automations: {
      label: "Otomasyonlar",
      "auto-archive": {
        title: "Tamamlanan iş öğelerini otomatik arşivle",
        description: "Plane, tamamlanan veya iptal edilen iş öğelerini otomatik arşivleyecek.",
        duration: "Şu süre kapalı kalan iş öğelerini otomatik arşivle",
      },
      "auto-close": {
        title: "İş öğelerini otomatik kapat",
        description: "Plane, tamamlanmamış veya iptal edilmemiş iş öğelerini otomatik kapatacak.",
        duration: "Şu süre etkin olmayan iş öğelerini otomatik kapat",
        auto_close_status: "Otomatik kapatma durumu",
      },
    },
    empty_state: {
      labels: {
        title: "Henüz etiket yok",
        description: "Projenizdeki iş öğelerini düzenlemek ve filtrelemek için etiketler oluşturun.",
      },
      estimates: {
        title: "Henüz tahmin sistemi yok",
        description: "İş öğesi başına çalışma miktarını iletişim kurmak için bir tahmin seti oluşturun.",
        primary_button: "Tahmin sistemi ekle",
      },
      integrations: {
        title: "Konfigüre edilmiş entegrasyon yok",
        description: "Proje iş öğelerinizi senkronize etmek için GitHub ve diğer entegrasyonları konfigüre edin.",
      },
    },
    initiatives: {
      heading: "İnisiyatifler",
      sub_heading: "Plane'deki tüm işleriniz için en üst seviye organizasyonu aktive edin.",
      title: "İnisiyatifleri Aktive Et",
      description: "İlerlemeyi takip etmek için büyük hedefler belirleyin",
      toast: {
        updating: "İnisiyatif özelliği güncelleniyor",
        enable_success: "İnisiyatif özelliği başarıyla aktive edildi.",
        disable_success: "İnisiyatif özelliği başarıyla deaktive edildi.",
        error: "İnisiyatif özelliği güncellenemedi!",
      },
    },
    customers: {
      heading: "Kastımerlar",
      settings_heading: "Kastımerlarınız için önemli olan şeylere göre işleri yönetin.",
      settings_sub_heading:
        "Kastımer taleplerini iş öğelerine dönüştürün, taleplere göre önceliklendirin ve iş öğesi durumlarını kastımer kayıtlarıyla senkronize edin. Yakında CRM veya destek araçlarınızla entegre olarak kastımer özelliklerine göre daha iyi iş yönetimi yapabileceksiniz.",
    },
    epics: {
      properties: {
        title: "Propertiler",
        description: "Epiğinize özel propertiler ekleyin.",
      },
      disabled: "Deaktive",
    },
    cycles: {
      auto_schedule: {
        heading: "Otomatik döngü planlaması",
        description: "Döngüleri manuel kurulum olmadan devam ettirin.",
        tooltip: "Seçtiğiniz programa göre otomatik olarak yeni döngüler oluşturun.",
        edit_button: "Düzenle",
        form: {
          cycle_title: {
            label: "Döngü başlığı",
            placeholder: "Başlık",
            tooltip: "Başlık, sonraki döngüler için numaralarla tamamlanacaktır. Örneğin: Tasarım - 1/2/3",
            validation: {
              required: "Döngü başlığı zorunludur",
              max_length: "Başlık 255 karakteri aşmamalıdır",
            },
          },
          cycle_duration: {
            label: "Döngü süresi",
            unit: "Hafta",
            validation: {
              required: "Döngü süresi zorunludur",
              min: "Döngü süresi en az 1 hafta olmalıdır",
              max: "Döngü süresi 30 haftayı aşamaz",
              positive: "Döngü süresi pozitif olmalıdır",
            },
          },
          cooldown_period: {
            label: "Soğuma süresi",
            unit: "gün",
            tooltip: "Bir sonraki döngü başlamadan önce döngüler arası duraklatma.",
            validation: {
              required: "Soğuma süresi zorunludur",
              negative: "Soğuma süresi negatif olamaz",
            },
          },
          start_date: {
            label: "Döngü başlangıç günü",
            validation: {
              required: "Başlangıç tarihi zorunludur",
              past: "Başlangıç tarihi geçmişte olamaz",
            },
          },
          number_of_cycles: {
            label: "Gelecekteki döngü sayısı",
            validation: {
              required: "Döngü sayısı zorunludur",
              min: "En az 1 döngü gereklidir",
              max: "3'ten fazla döngü planlanamaz",
            },
          },
          auto_rollover: {
            label: "İş öğelerini otomatik devret",
            tooltip: "Bir döngünün tamamlandığı gün, tüm bitmemiş iş öğelerini bir sonraki döngüye taşıyın.",
          },
        },
        toast: {
          toggle: {
            loading_enable: "Otomatik döngü planlaması etkinleştiriliyor",
            loading_disable: "Otomatik döngü planlaması devre dışı bırakılıyor",
            success: {
              title: "Başarılı!",
              message: "Otomatik döngü planlaması başarıyla değiştirildi.",
            },
            error: {
              title: "Hata!",
              message: "Otomatik döngü planlaması değiştirilemedi.",
            },
          },
          save: {
            loading: "Otomatik döngü planlaması yapılandırması kaydediliyor",
            success: {
              title: "Başarılı!",
              message_create: "Otomatik döngü planlaması yapılandırması başarıyla kaydedildi.",
              message_update: "Otomatik döngü planlaması yapılandırması başarıyla güncellendi.",
            },
            error: {
              title: "Hata!",
              message_create: "Otomatik döngü planlaması yapılandırması kaydedilemedi.",
              message_update: "Otomatik döngü planlaması yapılandırması güncellenemedi.",
            },
          },
        },
      },
    },
    features: {
      cycles: {
        title: "Döngüler",
        short_title: "Döngüler",
        description: "Bu projenin benzersiz ritmine ve hızına uyum sağlayan esnek dönemlerde iş planlayın.",
        toggle_title: "Döngüleri etkinleştir",
        toggle_description: "Odaklanmış zaman dilimlerinde iş planlayın.",
      },
      modules: {
        title: "Modüller",
        short_title: "Modüller",
        description: "İşi özel liderler ve atananlarla alt projelere organize edin.",
        toggle_title: "Modülleri etkinleştir",
        toggle_description: "Proje üyeleri modüller oluşturabilir ve düzenleyebilir.",
      },
      views: {
        title: "Görünümler",
        short_title: "Görünümler",
        description: "Özel sıralamalar, filtreler ve görüntüleme seçeneklerini kaydedin veya ekibinizle paylaşın.",
        toggle_title: "Görünümleri etkinleştir",
        toggle_description: "Proje üyeleri görünümler oluşturabilir ve düzenleyebilir.",
      },
      pages: {
        title: "Sayfalar",
        short_title: "Sayfalar",
        description: "Serbest biçimli içerik oluşturun ve düzenleyin: notlar, belgeler, herhangi bir şey.",
        toggle_title: "Sayfaları etkinleştir",
        toggle_description: "Proje üyeleri sayfalar oluşturabilir ve düzenleyebilir.",
      },
      intake: {
        intake_responsibility: "Alım sorumluluğu",
        intake_sources: "Alım kaynakları",
        title: "Alım",
        short_title: "Alım",
        description:
          "Üye olmayanların hataları, geri bildirimleri ve önerileri paylaşmasına izin verin; iş akışınızı aksatmadan.",
        toggle_title: "Alımı etkinleştir",
        toggle_description: "Proje üyelerinin uygulama içinde alım talepleri oluşturmasına izin verin.",
        toggle_tooltip_on: "Proje Yöneticinizden bunu açmasını isteyin.",
        toggle_tooltip_off: "Proje Yöneticinizden bunu kapatmasını isteyin.",
        notify_assignee: {
          title: "Atanan kişileri bildir",
          description: "Yeni bir alım talebi için varsayılan atanan kişiler bildirimler aracılığıyla uyarılacaktır",
        },
        in_app: {
          title: "Uygulama içi",
          description:
            "Mevcut iş öğelerinizi bozmadan çalışma alanınızdaki Üyeler ve Konuklardan yeni iş öğeleri alın.",
        },
        email: {
          title: "E-posta",
          description: "Plane e-posta adresine e-posta gönderen herkesten yeni iş öğeleri toplayın.",
          fieldName: "E-posta ID",
        },
        form: {
          title: "Formlar",
          description:
            "Çalışma alanınızın dışındaki kişilerin özel ve güvenli bir form aracılığıyla sizin için potansiyel yeni iş öğeleri oluşturmasına izin verin.",
          fieldName: "Varsayılan form URL'si",
          create_forms: "İş öğesi türlerini kullanarak form oluşturun",
          manage_forms: "Formları yönet",
          manage_forms_tooltip: "Çalışma Alanı Yöneticinizden bunu yönetmesini isteyin.",
          create_form: "Form oluştur",
          edit_form: "Form ayrıntılarını düzenle",
          form_title: "Form başlığı",
          form_title_required: "Form başlığı zorunludur",
          work_item_type: "İş öğesi türü",
          remove_property: "Özelliği kaldır",
          select_properties: "Özellikleri seç",
          search_placeholder: "Özelliklerde ara",
          toasts: {
            success_create: "Alım formu başarıyla oluşturuldu",
            success_update: "Alım formu başarıyla güncellendi",
            error_create: "Alım formu oluşturulamadı",
            error_update: "Alım formu güncellenemedi",
          },
        },
        toasts: {
          set: {
            loading: "Atanan kişiler ayarlanıyor...",
            success: {
              title: "Başarılı!",
              message: "Atanan kişiler başarıyla ayarlandı.",
            },
            error: {
              title: "Hata!",
              message: "Atanan kişileri ayarlarken bir şeyler yanlış gitti. Lütfen tekrar deneyin.",
            },
          },
        },
      },
      time_tracking: {
        title: "Zaman takibi",
        short_title: "Zaman takibi",
        description: "İş öğelerine ve projelere harcanan zamanı kaydedin.",
        toggle_title: "Zaman takibini etkinleştir",
        toggle_description: "Proje üyeleri çalışılan zamanı kaydedebilecektir.",
      },
      milestones: {
        title: "Kilometre taşları",
        short_title: "Kilometre taşları",
        description:
          "Kilometre taşları, iş öğelerini ortak tamamlanma tarihlerine doğru hizalamak için bir katman sağlar.",
        toggle_title: "Kilometre taşlarını etkinleştir",
        toggle_description: "İş öğelerini kilometre taşı son tarihleri ile organize edin.",
      },
    },
  },
  project_cycles: {
    add_cycle: "Döngü ekle",
    more_details: "Daha fazla detay",
    cycle: "Döngü",
    update_cycle: "Döngüyü güncelle",
    create_cycle: "Döngü oluştur",
    no_matching_cycles: "Eşleşen döngü yok",
    remove_filters_to_see_all_cycles: "Tüm döngüleri görmek için filtreleri kaldırın",
    remove_search_criteria_to_see_all_cycles: "Tüm döngüleri görmek için arama kriterlerini kaldırın",
    only_completed_cycles_can_be_archived: "Yalnızca tamamlanmış döngüler arşivlenebilir",
    start_date: "Başlangıç tarihi",
    end_date: "Bitiş tarihi",
    in_your_timezone: "Saat diliminizde",
    transfer_work_items: "{count} iş öğesini aktar",
    transfer: {
      no_cycles_available: "İş öğelerini aktaracak başka döngü bulunamadı.",
    },
    date_range: "Tarih aralığı",
    add_date: "Tarih ekle",
    active_cycle: {
      label: "Aktif döngü",
      progress: "İlerleme",
      chart: "Burndown grafiği",
      priority_issue: "Öncelikli iş öğeleri",
      assignees: "Atananlar",
      issue_burndown: "İş öğesi burndown",
      ideal: "İdeal",
      current: "Mevcut",
      labels: "Etiketler",
      trailing: "Geride",
      leading: "İlerde",
    },
    upcoming_cycle: {
      label: "Yaklaşan döngü",
    },
    completed_cycle: {
      label: "Tamamlanan döngü",
    },
    status: {
      days_left: "Kalan gün",
      completed: "Tamamlandı",
      yet_to_start: "Başlamadı",
      in_progress: "Devam Ediyor",
      draft: "Taslak",
    },
    action: {
      restore: {
        title: "Döngüyü geri yükle",
        success: {
          title: "Döngü geri yüklendi",
          description: "Döngü başarıyla geri yüklendi.",
        },
        failed: {
          title: "Döngü geri yüklenemedi",
          description: "Döngü geri yüklenemedi. Lütfen tekrar deneyin.",
        },
      },
      favorite: {
        loading: "Döngü favorilere ekleniyor",
        success: {
          description: "Döngü favorilere eklendi.",
          title: "Başarılı!",
        },
        failed: {
          description: "Döngü favorilere eklenemedi. Lütfen tekrar deneyin.",
          title: "Hata!",
        },
      },
      unfavorite: {
        loading: "Döngü favorilerden kaldırılıyor",
        success: {
          description: "Döngü favorilerden kaldırıldı.",
          title: "Başarılı!",
        },
        failed: {
          description: "Döngü favorilerden kaldırılamadı. Lütfen tekrar deneyin.",
          title: "Hata!",
        },
      },
      update: {
        loading: "Döngü güncelleniyor",
        success: {
          description: "Döngü başarıyla güncellendi.",
          title: "Başarılı!",
        },
        failed: {
          description: "Döngü güncellenirken hata oluştu. Lütfen tekrar deneyin.",
          title: "Hata!",
        },
        error: {
          already_exists:
            "Belirtilen tarihlerde zaten bir döngünüz var, taslak bir döngü oluşturmak istiyorsanız, her iki tarihi de kaldırarak oluşturabilirsiniz.",
        },
      },
    },
    empty_state: {
      general: {
        title: "İşlerinizi Döngülerde gruplayın ve zamanlayın.",
        description:
          "İşleri zaman dilimlerine bölün, proje son teslim tarihinden geriye çalışarak tarihler belirleyin ve takım olarak somut ilerleme kaydedin.",
        primary_button: {
          text: "İlk döngünüzü ayarlayın",
          comic: {
            title: "Döngüler tekrarlayan zaman dilimleridir.",
            description:
              "Haftalık veya iki haftalık iş takibi için kullandığınız sprint, iterasyon veya başka bir terim bir döngüdür.",
          },
        },
      },
      no_issues: {
        title: "Döngüye iş öğesi eklenmedi",
        description: "Bu döngüde tamamlamak istediğiniz iş öğelerini ekleyin veya oluşturun",
        primary_button: {
          text: "Yeni iş öğesi oluştur",
        },
        secondary_button: {
          text: "Varolan iş öğesi ekle",
        },
      },
      completed_no_issues: {
        title: "Döngüde iş öğesi yok",
        description:
          "Döngüde iş öğesi yok. İş öğeleri ya aktarıldı ya da gizlendi. Gizli iş öğelerini görmek için görüntüleme özelliklerinizi güncelleyin.",
      },
      active: {
        title: "Aktif döngü yok",
        description:
          "Aktif bir döngü, bugünün tarihini içeren herhangi bir dönemi kapsar. Aktif döngünün ilerleme ve detaylarını burada bulabilirsiniz.",
      },
      archived: {
        title: "Henüz arşivlenmiş döngü yok",
        description:
          "Projenizi düzenli tutmak için tamamlanmış döngüleri arşivleyin. Arşivlendikten sonra burada bulabilirsiniz.",
      },
    },
  },
  project_issues: {
    empty_state: {
      no_issues: {
        title: "Bir iş öğesi oluşturun ve birine, hatta kendinize atayın",
        description:
          "İş öğelerini işler, görevler, çalışma veya JTBD olarak düşünün. Bir iş öğesi ve alt iş öğeleri genellikle takım üyelerinize atanan zaman temelli eylemlerdir. Takımınız, projenizi hedefine doğru ilerletmek için iş öğeleri oluşturur, atar ve tamamlar.",
        primary_button: {
          text: "İlk iş öğenizi oluşturun",
          comic: {
            title: "İş öğeleri Plane'de yapı taşlarıdır.",
            description:
              "Plane UI'yi yeniden tasarlamak, şirketi yeniden markalaştırmak veya yeni yakıt enjeksiyon sistemini başlatmak, muhtemelen alt iş öğeleri olan iş öğesi örnekleridir.",
          },
        },
      },
      no_archived_issues: {
        title: "Henüz arşivlenmiş iş öğesi yok",
        description:
          "Tamamlanan veya iptal edilen iş öğelerini manuel olarak veya otomasyonla arşivleyebilirsiniz. Arşivlendikten sonra burada bulabilirsiniz.",
        primary_button: {
          text: "Otomasyon ayarla",
        },
      },
      issues_empty_filter: {
        title: "Uygulanan filtrelerle eşleşen iş öğesi bulunamadı",
        secondary_button: {
          text: "Tüm filtreleri temizle",
        },
      },
    },
  },
  project_module: {
    add_module: "Modül Ekle",
    update_module: "Modülü Güncelle",
    create_module: "Modül Oluştur",
    archive_module: "Modülü Arşivle",
    restore_module: "Modülü Geri Yükle",
    delete_module: "Modülü sil",
    empty_state: {
      general: {
        title: "Proje kilometre taşlarınızı Modüllere eşleyin ve toplu işleri kolayca takip edin.",
        description:
          "Mantıksal bir üst öğeye ait iş öğeleri grubu bir modül oluşturur. Bunları bir kilometre taşını takip etmenin bir yolu olarak düşünün. Kendi dönemleri ve son teslim tarihleri ile birlikte, bir kilometre taşına ne kadar yakın veya uzak olduğunuzu görmenize yardımcı olacak analitiklere sahiptirler.",
        primary_button: {
          text: "İlk modülünüzü oluşturun",
          comic: {
            title: "Modüller işleri hiyerarşiye göre gruplamaya yardımcı olur.",
            description: "Bir araba modülü, bir şasi modülü ve bir depo modülü bu gruplandırmanın iyi örnekleridir.",
          },
        },
      },
      no_issues: {
        title: "Modülde iş öğesi yok",
        description: "Bu modülün bir parçası olarak gerçekleştirmek istediğiniz iş öğelerini oluşturun veya ekleyin",
        primary_button: {
          text: "Yeni iş öğeleri oluştur",
        },
        secondary_button: {
          text: "Varolan bir iş öğesi ekle",
        },
      },
      archived: {
        title: "Henüz arşivlenmiş Modül yok",
        description:
          "Projenizi düzenli tutmak için tamamlanmış veya iptal edilmiş modülleri arşivleyin. Arşivlendikten sonra burada bulabilirsiniz.",
      },
      sidebar: {
        in_active: "Bu modül henüz aktif değil.",
        invalid_date: "Geçersiz tarih. Lütfen geçerli bir tarih girin.",
      },
    },
    quick_actions: {
      archive_module: "Modülü arşivle",
      archive_module_description: `Yalnızca tamamlanmış veya iptal edilmiş
modüller arşivlenebilir.`,
      delete_module: "Modülü sil",
    },
    toast: {
      copy: {
        success: "Modül bağlantısı panoya kopyalandı",
      },
      delete: {
        success: "Modül başarıyla silindi",
        error: "Modül silinemedi",
      },
    },
  },
  project_views: {
    empty_state: {
      general: {
        title: "Projeniz için filtreli görünümleri kaydedin. İhtiyacınız olduğu kadar oluşturun",
        description:
          "Görünümler, sık kullandığınız veya kolay erişim istediğiniz kayıtlı filtrelerdir. Bir projedeki tüm meslektaşlarınız herkesin görünümlerini görebilir ve ihtiyaçlarına en uygun olanı seçebilir.",
        primary_button: {
          text: "İlk görünümünüzü oluşturun",
          comic: {
            title: "Görünümler İş Öğesi özellikleri üzerinde çalışır.",
            description: "Buradan istediğiniz kadar özellikle filtre içeren bir görünüm oluşturabilirsiniz.",
          },
        },
      },
      filter: {
        title: "Eşleşen görünüm yok",
        description: `Arama kriterleriyle eşleşen görünüm yok.
 Bunun yerine yeni bir görünüm oluşturun.`,
      },
    },
    delete_view: {
      title: "Bu görünümü silmek istediğinizden emin misiniz?",
      content:
        "Onaylarsanız, bu görünüm için seçtiğiniz tüm sıralama, filtreleme ve görüntüleme seçenekleri + düzen kalıcı olarak silinecek ve geri yükleme imkanı olmayacaktır.",
    },
  },
  project_page: {
    empty_state: {
      general: {
        title:
          "Bir not, belge veya tam bir bilgi bankası yazın. Plane'in AI asistanı Galileo'nun başlamanıza yardımcı olmasını sağlayın",
        description:
          "Sayfalar Plane'de düşüncelerinizi döktüğünüz alanlardır. Toplantı notları alın, kolayca biçimlendirin, iş öğelerini yerleştirin, bir bileşen kitaplığı kullanarak düzenleyin ve hepsini proje bağlamınızda tutun. Herhangi bir belgeyi hızlıca tamamlamak için bir kısayol veya düğme ile Plane'in AI'sı Galileo'yu çağırın.",
        primary_button: {
          text: "İlk sayfanızı oluşturun",
        },
      },
      private: {
        title: "Henüz özel sayfa yok",
        description: "Özel düşüncelerinizi burada saklayın. Paylaşmaya hazır olduğunuzda, ekip bir tık uzağınızda.",
        primary_button: {
          text: "İlk sayfanızı oluşturun",
        },
      },
      public: {
        title: "Henüz genel sayfa yok",
        description: "Projenizdeki herkesle paylaşılan sayfaları burada görün.",
        primary_button: {
          text: "İlk sayfanızı oluşturun",
        },
      },
      archived: {
        title: "Henüz arşivlenmiş sayfa yok",
        description: "Radarınızda olmayan sayfaları arşivleyin. İhtiyaç duyduğunuzda buradan erişin.",
      },
    },
  },
  command_k: {
    empty_state: {
      search: {
        title: "Sonuç bulunamadı",
      },
    },
  },
  issue_relation: {
    empty_state: {
      search: {
        title: "Eşleşen iş öğesi bulunamadı",
      },
      no_issues: {
        title: "İş öğesi bulunamadı",
      },
    },
  },
  issue_comment: {
    empty_state: {
      general: {
        title: "Henüz yorum yok",
        description: "Yorumlar, iş öğeleri için tartışma ve takip alanı olarak kullanılabilir",
      },
    },
  },
  notification: {
    label: "Bildirimler",
    page_label: "{workspace} - Bildirimler",
    options: {
      mark_all_as_read: "Tümünü okundu olarak işaretle",
      mark_read: "Okundu olarak işaretle",
      mark_unread: "Okunmamış olarak işaretle",
      refresh: "Yenile",
      filters: "Bildirim Filtreleri",
      show_unread: "Okunmamışları göster",
      show_snoozed: "Ertelenenleri göster",
      show_archived: "Arşivlenmişleri göster",
      mark_archive: "Arşivle",
      mark_unarchive: "Arşivden çıkar",
      mark_snooze: "Ertelenmiş",
      mark_unsnooze: "Ertelenmemiş",
    },
    toasts: {
      read: "Bildirim okundu olarak işaretlendi",
      unread: "Bildirim okunmamış olarak işaretlendi",
      archived: "Bildirim arşivlendi",
      unarchived: "Bildirim arşivden çıkarıldı",
      snoozed: "Bildirim ertelendi",
      unsnoozed: "Bildirim ertelenmedi",
    },
    empty_state: {
      detail: {
        title: "Detayları görüntülemek için seçin.",
      },
      all: {
        title: "Atanan iş öğesi yok",
        description: `Size atanan iş öğelerinin güncellemelerini
 burada görebilirsiniz`,
      },
      mentions: {
        title: "Atanan iş öğesi yok",
        description: `Size atanan iş öğelerinin güncellemelerini
 burada görebilirsiniz`,
      },
    },
    tabs: {
      all: "Tümü",
      mentions: "Bahsetmeler",
    },
    filter: {
      assigned: "Bana atanan",
      created: "Benim oluşturduğum",
      subscribed: "Abone olduğum",
    },
    snooze: {
      "1_day": "1 gün",
      "3_days": "3 gün",
      "5_days": "5 gün",
      "1_week": "1 hafta",
      "2_weeks": "2 hafta",
      custom: "Özel",
    },
  },
  active_cycle: {
    empty_state: {
      progress: {
        title: "İlerlemeyi görüntülemek için döngüye iş öğeleri ekleyin",
      },
      chart: {
        title: "Burndown grafiğini görüntülemek için döngüye iş öğeleri ekleyin.",
      },
      priority_issue: {
        title: "Döngüde ele alınan yüksek öncelikli iş öğelerini bir bakışta görün.",
      },
      assignee: {
        title: "Atananları iş öğelerine ekleyerek iş dağılımını görün.",
      },
      label: {
        title: "Etiketleri iş öğelerine ekleyerek iş dağılımını görün.",
      },
    },
  },
  disabled_project: {
    empty_state: {
      inbox: {
        title: "Talep bu proje için etkin değil.",
        description:
          "Talep, projenize gelen istekleri yönetmenize ve bunları iş akışınıza iş öğesi olarak eklemenize yardımcı olur. İstekleri yönetmek için proje ayarlarından talebi etkinleştirin.",
        primary_button: {
          text: "Özellikleri yönet",
        },
      },
      cycle: {
        title: "Döngüler bu proje için etkin değil.",
        description:
          "İşleri zaman dilimlerine bölün, proje son teslim tarihinden geriye çalışarak tarihler belirleyin ve takım olarak somut ilerleme kaydedin. Döngüleri kullanmaya başlamak için projenizde döngü özelliğini etkinleştirin.",
        primary_button: {
          text: "Özellikleri yönet",
        },
      },
      module: {
        title: "Modüller bu proje için etkin değil.",
        description:
          "Modüller projenizin yapı taşlarıdır. Kullanmaya başlamak için proje ayarlarından modülleri etkinleştirin.",
        primary_button: {
          text: "Özellikleri yönet",
        },
      },
      page: {
        title: "Sayfalar bu proje için etkin değil.",
        description:
          "Sayfalar projenizin yapı taşlarıdır. Kullanmaya başlamak için proje ayarlarından sayfaları etkinleştirin.",
        primary_button: {
          text: "Özellikleri yönet",
        },
      },
      view: {
        title: "Görünümler bu proje için etkin değil.",
        description:
          "Görünümler projenizin yapı taşlarıdır. Kullanmaya başlamak için proje ayarlarından görünümleri etkinleştirin.",
        primary_button: {
          text: "Özellikleri yönet",
        },
      },
    },
  },
  workspace_draft_issues: {
    draft_an_issue: "Taslak iş öğesi oluştur",
    empty_state: {
      title: "Yarı yazılmış iş öğeleri ve yakında yorumlar burada görünecek.",
      description:
        "Bunu denemek için bir iş öğesi eklemeye başlayın ve yarıda bırakın veya ilk taslağınızı aşağıda oluşturun. 😉",
      primary_button: {
        text: "İlk taslağınızı oluşturun",
      },
    },
    delete_modal: {
      title: "Taslağı sil",
      description: "Bu taslağı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
    },
    toasts: {
      created: {
        success: "Taslak oluşturuldu",
        error: "İş öğesi oluşturulamadı. Lütfen tekrar deneyin.",
      },
      deleted: {
        success: "Taslak silindi",
      },
    },
  },
  stickies: {
    title: "Yapışkan Notlarınız",
    placeholder: "buraya yazmak için tıkla",
    all: "Tüm yapışkan notlar",
    "no-data":
      "Bir fikir yazın, bir aydınlanma anını yakalayın veya bir beyin fırtınasını kaydedin. Başlamak için bir yapışkan not ekleyin.",
    add: "Yapışkan not ekle",
    search_placeholder: "Başlığa göre ara",
    delete: "Yapışkan notu sil",
    delete_confirmation: "Bu yapışkan notu silmek istediğinizden emin misiniz?",
    empty_state: {
      simple:
        "Bir fikir yazın, bir aydınlanma anını yakalayın veya bir beyin fırtınasını kaydedin. Başlamak için bir yapışkan not ekleyin.",
      general: {
        title: "Yapışkan notlar anlık notlar ve yapılacaklardır.",
        description:
          "Düşünce ve fikirlerinizi her zaman ve her yerden erişebileceğiniz yapışkan notlar oluşturarak zahmetsizce yakalayın.",
        primary_button: {
          text: "Yapışkan not ekle",
        },
      },
      search: {
        title: "Hiçbir yapışkan not eşleşmiyor.",
        description: "Farklı bir terim deneyin veya aramanızın doğru olduğundan eminseniz bize bildirin. ",
        primary_button: {
          text: "Yapışkan not ekle",
        },
      },
    },
    toasts: {
      errors: {
        wrong_name: "Yapışkan not adı 100 karakteri geçemez.",
        already_exists: "Açıklamasız bir yapışkan not zaten var",
      },
      created: {
        title: "Yapışkan not oluşturuldu",
        message: "Yapışkan not başarıyla oluşturuldu",
      },
      not_created: {
        title: "Yapışkan not oluşturulamadı",
        message: "Yapışkan not oluşturulamadı",
      },
      updated: {
        title: "Yapışkan not güncellendi",
        message: "Yapışkan not başarıyla güncellendi",
      },
      not_updated: {
        title: "Yapışkan not güncellenemedi",
        message: "Yapışkan not güncellenemedi",
      },
      removed: {
        title: "Yapışkan not kaldırıldı",
        message: "Yapışkan not başarıyla kaldırıldı",
      },
      not_removed: {
        title: "Yapışkan not kaldırılamadı",
        message: "Yapışkan not kaldırılamadı",
      },
    },
  },
  role_details: {
    guest: {
      title: "Misafir",
      description: "Kuruluşların dış üyeleri misafir olarak davet edilebilir.",
    },
    member: {
      title: "Üye",
      description: "Projeler, döngüler ve modüller içindeki varlıkları okuma, yazma, düzenleme ve silme yetkisi",
    },
    admin: {
      title: "Yönetici",
      description: "Çalışma alanı içinde tüm izinler aktif.",
    },
  },
  user_roles: {
    product_or_project_manager: "Ürün / Proje Yöneticisi",
    development_or_engineering: "Geliştirme / Mühendislik",
    founder_or_executive: "Kurucu / Yönetici",
    freelancer_or_consultant: "Serbest Çalışan / Danışman",
    marketing_or_growth: "Pazarlama / Büyüme",
    sales_or_business_development: "Satış / İş Geliştirme",
    support_or_operations: "Destek / Operasyonlar",
    student_or_professor: "Öğrenci / Profesör",
    human_resources: "İnsan Kaynakları",
    other: "Diğer",
  },
  importer: {
    github: {
      title: "Github",
      description: "GitHub depolarından iş öğelerini içe aktarın ve senkronize edin.",
    },
    jira: {
      title: "Jira",
      description: "Jira projelerinden ve epiklerinden iş öğelerini içe aktarın.",
    },
  },
  exporter: {
    csv: {
      title: "CSV",
      description: "İş öğelerini CSV dosyasına aktarın.",
      short_description: "CSV olarak aktar",
    },
    excel: {
      title: "Excel",
      description: "İş öğelerini Excel dosyasına aktarın.",
      short_description: "Excel olarak aktar",
    },
    xlsx: {
      title: "Excel",
      description: "İş öğelerini Excel dosyasına aktarın.",
      short_description: "Excel olarak aktar",
    },
    json: {
      title: "JSON",
      description: "İş öğelerini JSON dosyasına aktarın.",
      short_description: "JSON olarak aktar",
    },
  },
  default_global_view: {
    all_issues: "Tüm iş öğeleri",
    assigned: "Atanan",
    created: "Oluşturulan",
    subscribed: "Abone olunan",
  },
  themes: {
    theme_options: {
      system_preference: {
        label: "Sistem tercihi",
      },
      light: {
        label: "Açık",
      },
      dark: {
        label: "Koyu",
      },
      light_contrast: {
        label: "Yüksek kontrastlı açık",
      },
      dark_contrast: {
        label: "Yüksek kontrastlı koyu",
      },
      custom: {
        label: "Özel tema",
      },
    },
  },
  project_modules: {
    status: {
      backlog: "Bekleme Listesi",
      planned: "Planlandı",
      in_progress: "Devam Ediyor",
      paused: "Duraklatıldı",
      completed: "Tamamlandı",
      cancelled: "İptal Edildi",
    },
    layout: {
      list: "Liste düzeni",
      board: "Galeri düzeni",
      timeline: "Zaman çizelgesi düzeni",
    },
    order_by: {
      name: "Ad",
      progress: "İlerleme",
      issues: "İş öğesi sayısı",
      due_date: "Son tarih",
      created_at: "Oluşturulma tarihi",
      manual: "Manuel",
    },
  },
  cycle: {
    label: "{count, plural, one {Döngü} other {Döngüler}}",
    no_cycle: "Döngü yok",
  },
  module: {
    label: "{count, plural, one {Modül} other {Modüller}}",
    no_module: "Modül yok",
  },
  description_versions: {
    last_edited_by: "Son düzenleyen",
    previously_edited_by: "Önceki düzenleyen",
    edited_by: "Tarafından düzenlendi",
  },
  self_hosted_maintenance_message: {
    plane_didnt_start_up_this_could_be_because_one_or_more_plane_services_failed_to_start:
      "Plane başlatılamadı. Bu, bir veya daha fazla Plane servisinin başlatılamaması nedeniyle olabilir.",
    choose_view_logs_from_setup_sh_and_docker_logs_to_be_sure:
      "Emin olmak için setup.sh ve Docker loglarından View Logs&apos;u seçin.",
  },
  page_navigation_pane: {
    tabs: {
      outline: {
        label: "Ana Hat",
        empty_state: {
          title: "Eksik başlıklar",
          description: "Bu sayfaya bazı başlıklar ekleyelim ki burada görebilelim.",
        },
      },
      info: {
        label: "Bilgi",
        document_info: {
          words: "Kelimeler",
          characters: "Karakterler",
          paragraphs: "Paragraflar",
          read_time: "Okuma süresi",
        },
        actors_info: {
          edited_by: "Düzenleyen",
          created_by: "Oluşturan",
        },
        version_history: {
          label: "Sürüm geçmişi",
          current_version: "Mevcut sürüm",
          highlight_changes: "Değişiklikleri vurgula",
        },
      },
      assets: {
        label: "Varlıklar",
        download_button: "İndir",
        empty_state: {
          title: "Eksik görseller",
          description: "Burada görmek için görseller ekleyin.",
        },
      },
    },
    open_button: "Navigasyon panelini aç",
    close_button: "Navigasyon panelini kapat",
    outline_floating_button: "Ana hatları aç",
  },
  workspace_dashboards: "Dashbordlar",
  pi_chat: "Plane AI",
  in_app: "Uygulama İçi",
  forms: "Formlar",
  choose_workspace_for_integration: "Bu uygulamayı bağlamak için bir çalışma alanı seçin",
  integrations_description: "Plane ile çalışan uygulamalar, yönetici olduğunuz bir çalışma alanına bağlanmalıdır.",
  create_a_new_workspace: "Yeni bir çalışma alanı oluştur",
  learn_more_about_workspaces: "Çalışma alanları hakkında daha fazla bilgi edinin",
  no_workspaces_to_connect: "Bağlamak için çalışma alanı yok",
  no_workspaces_to_connect_description: "Bir çalışma alanı oluşturmak için lütfen bu sayfaya dönün",
  updates: {
    add_update: "Güncelleme Ekle",
    add_update_placeholder: "Buraya güncelleme ekleyin",
    empty: {
      title: "Henüz güncelleme yok",
      description: "Burada güncellemelere göz atabilirsiniz.",
    },
    create: {
      success: {
        title: "Güncelleme oluşturuldu",
        message: "Güncelleme başarıyla oluşturuldu.",
      },
      error: {
        title: "Güncelleme oluşturulamadı",
        message: "Güncelleme oluşturulamadı. Lütfen tekrar deneyin.",
      },
    },
    update: {
      success: {
        title: "Güncelleme güncellendi",
        message: "Güncelleme başarıyla güncellendi.",
      },
      error: {
        title: "Güncelleme güncellenemedi",
        message: "Güncelleme güncellenemedi. Lütfen tekrar deneyin.",
      },
    },
    delete: {
      success: {
        title: "Güncelleme silindi",
        message: "Güncelleme başarıyla silindi.",
      },
      error: {
        title: "Güncelleme silinemedi",
        message: "Güncelleme silinemedi. Lütfen tekrar deneyin.",
      },
    },
    reaction: {
      create: {
        success: {
          title: "Reaksiyon oluşturuldu",
          message: "Reaksiyon başarıyla oluşturuldu.",
        },
        error: {
          title: "Reaksiyon oluşturulamadı",
          message: "Reaksiyon oluşturulamadı. Lütfen tekrar deneyin.",
        },
      },
      remove: {
        success: {
          title: "Reaksiyon silindi",
          message: "Reaksiyon başarıyla silindi.",
        },
        error: {
          title: "Reaksiyon silinemedi",
          message: "Reaksiyon silinemedi. Lütfen tekrar deneyin.",
        },
      },
    },
    progress: {
      title: "İlerleme",
      since_last_update: "Son güncellemeden beri",
      comments: "{count, plural, one{# yorum} other{# yorum}}",
    },
  },
  teamspaces: {
    label: "Takım Alanları",
    empty_state: {
      general: {
        title: "Takım Alanları Plane'de daha iyi organizasyon ve takip sağlar.",
        description:
          "Her gerçek dünya ekibi için Plane'deki diğer tüm çalışma alanlarından ayrı, özel bir alan oluşturun ve ekibinizin çalışma şekline uyacak şekilde özelleştirin.",
        primary_button: {
          text: "Yeni bir takım alanı oluştur",
        },
      },
    },
  },
  teamspace_projects: {
    settings: {
      empty_state: {
        no_teamspaces: {
          title: "Henüz hiç takım alanı bağlamadınız.",
          description: "Takım alanı ve proje sahipleri projelere erişimi yönetebilir.",
        },
      },
      primary_button: {
        text: "Takım alanı bağla",
      },
      secondary_button: {
        text: "Daha fazla bilgi",
      },
      table: {
        columns: {
          teamspaceName: "Takım alanı adı",
          members: "Üyeler",
          accountType: "Hesap türü",
        },
        actions: {
          remove: {
            button: {
              text: "Takım alanını kaldır",
            },
            confirm: {
              title: "{teamspaceName} takım alanını {projectName} projesinden kaldır",
              description:
                "Bu takım alanını bağlı bir projeden kaldırdığınızda, buradaki üyeler bağlı projeye erişimlerini kaybedecekler.",
            },
          },
        },
        empty_state: {
          no_results: {
            title: "Eşleşen takım alanı bulunamadı",
          },
        },
      },
      toast: {
        add_teamspace: {
          success: {
            title:
              "{count, plural, one {Bu projeye bir takım alanı bağladınız.} other {Bu projeye # takım alanı bağladınız.}}",
            description:
              "{additionalCount, plural, =0 {{firstTeamspaceName} takım alanı artık bu projeye bağlı.} other {{firstTeamspaceName} takım alanı ve {additionalCount} tanesi daha artık bu projeye bağlı.}}",
          },
          error: {
            title: "İşlem başarısız oldu.",
            description: "Tekrar deneyin veya sayfayı yenileyip tekrar deneyin.",
          },
        },
        remove_teamspace: {
          success: {
            title: "Bu takım alanını projeden kaldırdınız.",
            description: "{teamspaceName} takım alanı {projectName} projesinden kaldırıldı.",
          },
          error: {
            title: "İşlem başarısız oldu.",
            description: "Tekrar deneyin veya sayfayı yenileyip tekrar deneyin.",
          },
        },
      },
      link_teamspace: {
        placeholder: "Takım alanlarında ara",
        info: {
          title: "Bir takım alanı eklemek, tüm takım alanı üyelerine bu projeye erişim sağlar.",
          link: "Daha fazla bilgi",
        },
        empty_state: {
          no_teamspaces: {
            title: "Bağlayabileceğiniz hiç takım alanınız yok.",
            description:
              "Ya bağlayabileceğiniz bir takım alanında değilsiniz ya da tüm mevcut takım alanlarını zaten bağladınız.",
          },
          no_results: {
            title: "Bu, takım alanlarınızdan hiçbiriyle eşleşmiyor.",
            description: "Başka bir terim deneyin veya bağlayabileceğiniz takım alanlarınız olduğundan emin olun.",
          },
        },
        primary_button: {
          text: "Seçili takım alan(lar)ını bağla",
        },
      },
    },
  },
  teamspace_work_items: {
    empty_state: {
      no_work_items: {
        title: "Takıma özel iş öğeleri oluşturun.",
        description:
          "Bağlı herhangi bir projede bu ekibin üyelerine atanan iş öğeleri otomatik olarak burada görünecektir. Burada bazı iş öğeleri görmeyi bekliyorsanız, bağlı projelerinizin bu ekibin üyelerine atanmış iş öğelerine sahip olduğundan emin olun veya iş öğeleri oluşturun.",
        primary_button: {
          text: "Bağlı bir projeye iş öğeleri ekle",
        },
      },
      work_items_empty_filter: {
        title: "Uygulanan filtreler için takıma özel iş öğesi yok",
        description:
          "Bu filtrelerin bazılarını değiştirin veya bu alana uygun iş öğelerini görmek için hepsini temizleyin.",
        secondary_button: {
          text: "Tüm filtreleri temizle",
        },
      },
    },
  },
  teamspace_cycles: {
    empty_state: {
      current: {
        title: "Bağlı projelerinizden hiçbirinin aktif bir döngüsü yok.",
        description:
          "Bağlı projelerdeki aktif döngüler otomatik olarak burada görünecektir. Aktif bir döngü görmeyi bekliyorsanız, şu anda bağlı bir projede çalıştığından emin olun.",
      },
      completed: {
        title: "Bağlı projelerinizden hiçbirinin tamamlanmış bir döngüsü yok.",
        description:
          "Bağlı projelerdeki tamamlanmış döngüler otomatik olarak burada görünecektir. Tamamlanmış bir döngü görmeyi bekliyorsanız, bağlı bir projede de tamamlandığından emin olun.",
      },
      upcoming: {
        title: "Bağlı projelerinizden hiçbirinin yaklaşan bir döngüsü yok.",
        description:
          "Bağlı projelerdeki yaklaşan döngüler otomatik olarak burada görünecektir. Yaklaşan bir döngü görmeyi bekliyorsanız, bağlı bir projede de olduğundan emin olun.",
      },
    },
  },
  teamspace_views: {
    empty_state: {
      team_view: {
        title: "Çalışma alanınızdaki diğer görünümleri bozmadan ekibinizin çalışmalarınızın görünümleri",
        description:
          "Ekibinizin çalışmalarını sadece ekibiniz için kaydedilen ve bir projenin görünümlerinden ayrı olan görünümlerde görün.",
        primary_button: {
          text: "Bir görünüm oluştur",
        },
      },
      filter: {
        title: "Eşleşen görünüm yok",
        description: `Arama kriterlerine uygun görünüm yok.
 Bunun yerine yeni bir görünüm oluşturun.`,
      },
    },
  },
  teamspace_pages: {
    empty_state: {
      team_page: {
        title: "Ekibinizin bilgilerini Takım Sayfalarında barındırın.",
        description:
          "Bir projedeki sayfaların aksine, bir ekibe özgü bilgileri burada ayrı bir sayfa setinde saklayabilirsiniz. Sayfaların tüm özelliklerini alın, en iyi uygulama dokümanları oluşturun ve ekip vikilerini kolayca oluşturun.",
        primary_button: {
          text: "İlk takım sayfanızı oluşturun",
        },
      },
      filter: {
        title: "Eşleşen sayfa yok",
        description: "Tüm sayfaları görmek için filtreleri kaldırın",
      },
      search: {
        title: "Eşleşen sayfa yok",
        description: "Tüm sayfaları görmek için arama kriterlerini kaldırın",
      },
    },
  },
  teamspace_analytics: {
    empty_state: {
      progress: {
        title: "Bağlı projelerinizden hiçbirinin yayınlanmış iş öğeleri yok.",
        description:
          "Tarihlere, durumlara ve önceliklere göre ilerlemeyi görmek için bu projelerden bir veya daha fazlasında bazı iş öğeleri oluşturun.",
      },
      relation: {
        blocking: {
          title: "Bir takım arkadaşını engelleyen herhangi bir iş öğeniz yok.",
          description: "Aferin! Ekibiniz için yolu açtınız. İyi bir takım oyuncususunuz.",
        },
        blocked: {
          title: "Sizi engelleyen herhangi bir takım arkadaşının iş öğesi yok.",
          description: "İyi haber! Atanmış tüm iş öğelerinizde ilerleme kaydedebilirsiniz.",
        },
      },
      stats: {
        general: {
          title: "Bağlı projelerinizden hiçbirinin yayınlanmış iş öğeleri yok.",
          description:
            "Projeye ve ekip üyelerine göre iş dağılımını görmek için bu projelerden bir veya daha fazlasında bazı iş öğeleri oluşturun.",
        },
        filter: {
          title: "Uygulanan filtreler için takım istatistikleri yok.",
          description:
            "Projeye ve ekip üyelerine göre iş dağılımını görmek için bu projelerden bir veya daha fazlasında bazı iş öğeleri oluşturun.",
        },
      },
    },
  },
  initiatives: {
    overview: "Genel Bakış",
    label: "İnisiyatifler",
    placeholder: "{count, plural, one{# inisiyatif} other{# inisiyatif}}",
    add_initiative: "İnisiyatif Ekle",
    create_initiative: "İnisiyatif Oluştur",
    update_initiative: "İnisiyatif Güncelle",
    initiative_name: "İnisiyatif adı",
    all_initiatives: "Tüm İnisiyatifler",
    delete_initiative: "İnisiyatif Sil",
    fill_all_required_fields: "Lütfen tüm zorunlu alanları doldurun.",
    toast: {
      create_success: "İnisiyatif {name} başarıyla oluşturuldu.",
      create_error: "İnisiyatif oluşturulamadı. Lütfen tekrar deneyin!",
      update_success: "İnisiyatif {name} başarıyla güncellendi.",
      update_error: "İnisiyatif güncellenemedi. Lütfen tekrar deneyin!",
      delete: {
        success: "İnisiyatif başarıyla silindi.",
        error: "İnisiyatif silinemedi",
      },
      link_copied: "İnisiyatif bağlantısı panoya kopyalandı.",
      project_update_success: "İnisiyatif projeleri başarıyla güncellendi.",
      project_update_error: "İnisiyatif projeleri güncellenemedi. Lütfen tekrar deneyin!",
      epic_update_success:
        "Epik{count, plural, one { İnisiyatife başarıyla eklendi.} other {ler İnisiyatife başarıyla eklendi.}}",
      epic_update_error: "Epikin İnisiyatife eklenmesi başarısız oldu. Lütfen daha sonra tekrar deneyin.",
      state_update_success: "Girişim durumu başarıyla güncellendi.",
      state_update_error: "Girişim durumu güncellenemedi. Lütfen tekrar deneyin!",
      label_update_error: "Girişim etiketlerini güncelleme başarısız oldu. Lütfen tekrar deneyin!",
    },
    empty_state: {
      general: {
        title: "İnisiyatiflerle en üst düzeyde işleri organize edin",
        description:
          "Birkaç proje ve ekibi kapsayan işleri organize etmeniz gerektiğinde, İnisiyatifler işe yarar. Projeleri ve epikleri inisiyatiflere bağlayın, otomatik olarak toplanmış güncellemeleri görün ve ağaçlara ulaşmadan önce ormanları görün.",
        primary_button: {
          text: "Bir inisiyatif oluştur",
        },
      },
      search: {
        title: "Eşleşen inisiyatif yok",
        description: `Eşleşen kriterlere sahip inisiyatif tespit edilmedi.
 Bunun yerine yeni bir inisiyatif oluşturun.`,
      },
      not_found: {
        title: "İnisiyatif mevcut değil",
        description: "Aradığınız İnisiyatif mevcut değil, arşivlenmiş veya silinmiş.",
        primary_button: {
          text: "Diğer İnisiyatifleri Görüntüle",
        },
      },
      epics: {
        title: "Eşleşen epik yok",
        subHeading: "Tüm epikleri görmek için tüm uygulanan filtreleri temizleyin.",
        action: "Filtreleri temizle",
      },
    },
    scope: {
      view_scope: "Kapsamı görüntüle",
      breakdown: "Kapsamı çözümle",
      add_scope: "Kapsam ekle",
      label: "Kapsam",
      empty_state: {
        title: "Henüz kapsam eklenmedi",
        description: "Projeleri ve epikleri inisiyatife bağlayın ve bu alanda çalışmayı takip edin.",
        primary_button: {
          text: "Kapsam ekle",
        },
      },
    },
    initiative_settings: {
      labels: {
        heading: "Etiketler",
        description: "Girişimlerinizi etiketlerle yapılandırın ve düzenleyin.",
      },
    },
    initiative_labels: {
      delete_modal: {
        title: "Etiketi sil",
        content:
          "{labelName} etiketini silmek istediğinizden emin misiniz? Bu, etiketi tüm girişimlerden ve etikete göre filtrelenen tüm görünümlerden kaldıracaktır.",
      },
      toast: {
        delete_error: "Girişim etiketi silinemedi. Lütfen tekrar deneyin.",
        label_already_exists: "Etiket zaten var",
      },
    },
  },
  workspace_pages: {
    empty_state: {
      general: {
        title:
          "Bir not, bir belge veya tam bir bilgi tabanı yazın. Başlamanıza yardımcı olması için Plane'in yapay zeka asistanı Galileo'yu alın",
        description:
          "Sayfalar, Plane'deki düşünce saksı alanıdır. Toplantı notları alın, bunları kolayca biçimlendirin, iş öğelerini gömin, bunları bir bileşen kitaplığı kullanarak düzenleyin ve hepsini projenizin bağlamında tutun. Herhangi bir belgeyi kısa sürede yapmak için, Plane'in yapay zekası Galileo'yu bir kısayolla veya bir düğmeye tıklayarak çağırın.",
        primary_button: {
          text: "İlk sayfanızı oluşturun",
        },
      },
      private: {
        title: "Henüz özel sayfa yok",
        description:
          "Özel düşüncelerinizi burada saklayın. Paylaşmaya hazır olduğunuzda, ekip sadece bir tık uzaklıkta.",
        primary_button: {
          text: "İlk sayfanızı oluşturun",
        },
      },
      public: {
        title: "Henüz çalışma alanı sayfası yok",
        description: "Çalışma alanınızdaki herkesle paylaşılan sayfaları burada görün.",
        primary_button: {
          text: "İlk sayfanızı oluşturun",
        },
      },
      archived: {
        title: "Henüz arşivlenmiş sayfa yok",
        description: "Radarınızda olmayan sayfaları arşivleyin. Gerektiğinde bunlara buradan erişin.",
      },
    },
  },
  epics: {
    label: "Epikler",
    no_epics_selected: "Seçili epik yok",
    add_selected_epics: "Seçili epikleri ekle",
    epic_link_copied_to_clipboard: "Epik bağlantısı panoya kopyalandı.",
    project_link_copied_to_clipboard: "Proje bağlantısı panoya kopyalandı",
    empty_state: {
      general: {
        title: "Bir epik oluşturun ve birisine, hatta kendinize atayın",
        description:
          "Birkaç döngüye yayılan ve modüller arasında yaşayabilen daha büyük iş kütleleri için bir epik oluşturun. Bir projedeki iş öğelerini ve alt iş öğelerini bir epiğe bağlayın ve genel bakıştan bir iş öğesine atlayın.",
        primary_button: {
          text: "Bir Epik Oluştur",
        },
      },
      section: {
        title: "Henüz epik yok",
        description: "İlerlemeyi yönetmek ve izlemek için epikler eklemeye başlayın.",
        primary_button: {
          text: "Epikler ekle",
        },
      },
    },
  },
  epic_relation: {
    empty_state: {
      search: {
        title: "Eşleşen epik bulunamadı",
      },
      no_epics: {
        title: "Epik bulunamadı",
      },
    },
  },
  workspace_cycles: {
    empty_state: {
      active: {
        title: "Aktif döngü yok",
        description:
          "Projelerinizin, bugünün tarihini aralığı içinde kapsayan herhangi bir dönemi içeren döngüleri. Tüm aktif döngünüzün ilerlemesini ve detaylarını burada bulun.",
      },
    },
  },
  active_cycle_analytics: {
    empty_state: {
      progress: {
        title: "Döngünün ilerlemesini görüntülemek için iş öğeleri ekleyin",
      },
      priority: {
        title: "Döngüde ele alınan yüksek öncelikli iş öğelerini bir bakışta gözlemleyin.",
      },
      assignee: {
        title: "Atayanlara göre iş dağılımını görmek için iş öğelerine atayan ekleyin.",
      },
      label: {
        title: "Etiketlere göre iş dağılımını görmek için iş öğelerine etiketler ekleyin.",
      },
    },
  },
  workspace: {
    members_import: {
      title: "CSV'den üye içe aktar",
      description:
        "Şu sütunları içeren bir CSV yükleyin: Email, Display Name, First Name, Last Name, Role (5, 15 veya 20)",
      dropzone: {
        active: "CSV dosyasını buraya bırakın",
        inactive: "Sürükle bırak veya yüklemek için tıklayın",
        file_type: "Yalnızca .csv dosyaları desteklenir",
      },
      buttons: {
        cancel: "İptal",
        import: "İçe Aktar",
        try_again: "Tekrar Dene",
        close: "Kapat",
        done: "Tamamlandı",
      },
      progress: {
        uploading: "Yükleniyor...",
        importing: "İçe aktarılıyor...",
      },
      summary: {
        title: {
          failed: "İçe Aktarma Başarısız",
          complete: "İçe Aktarma Tamamlandı",
        },
        message: {
          seat_limit: "Koltuk sınırlamaları nedeniyle üyeler içe aktarılamıyor.",
          success: "Çalışma alanına başarıyla {count} üye eklendi.",
          no_imports: "CSV dosyasından hiçbir üye içe aktarılmadı.",
        },
        stats: {
          successful: "Başarılı",
          failed: "Başarısız",
        },
        download_errors: "Hataları indir",
      },
      toast: {
        invalid_file: {
          title: "Geçersiz dosya",
          message: "Yalnızca CSV dosyaları desteklenir.",
        },
        import_failed: {
          title: "İçe aktarma başarısız",
          message: "Bir şeyler ters gitti.",
        },
      },
    },
  },
  bulk_operations: {
    error_details: {
      invalid_archive_state_group: {
        title: "İş öğeleri arşivlenemiyor",
        message: "Yalnızca Tamamlanmış veya İptal Edilmiş durum gruplarına ait iş öğeleri arşivlenebilir.",
      },
      invalid_issue_start_date: {
        title: "İş öğeleri güncellenemiyor",
        message:
          "Seçilen başlangıç tarihi bazı iş öğeleri için bitiş tarihinden sonra geliyor. Başlangıç tarihinin bitiş tarihinden önce olduğundan emin olun.",
      },
      invalid_issue_target_date: {
        title: "İş öğeleri güncellenemiyor",
        message:
          "Seçilen bitiş tarihi bazı iş öğeleri için başlangıç tarihinden önce geliyor. Bitiş tarihinin başlangıç tarihinden sonra olduğundan emin olun.",
      },
      invalid_state_transition: {
        title: "İş öğeleri güncellenemiyor",
        message:
          "Bazı iş öğeleri için durum değişikliğine izin verilmiyor. Durum değişikliğine izin verildiğinden emin olun.",
      },
    },
  },
  work_item_types: {
    label: "İş Öğesi Tipleri",
    label_lowercase: "iş öğesi tipleri",
    settings: {
      title: "İş Öğesi Tipleri",
      properties: {
        title: "Özel özellikler",
        tooltip:
          "Her iş öğesi tipi, Başlık, Açıklama, Atanan Kişi, Durum, Öncelik, Başlangıç tarihi, Bitiş tarihi, Modül, Döngü vb. gibi varsayılan bir özellik seti ile gelir. Ayrıca ekibinizin ihtiyaçlarına göre kendi özelliklerinizi özelleştirebilir ve ekleyebilirsiniz.",
        add_button: "Yeni özellik ekle",
        dropdown: {
          label: "Özellik tipi",
          placeholder: "Tip seçin",
        },
        property_type: {
          text: {
            label: "Metin",
          },
          number: {
            label: "Sayı",
          },
          dropdown: {
            label: "Açılır Liste",
          },
          boolean: {
            label: "Boolean",
          },
          date: {
            label: "Tarih",
          },
          member_picker: {
            label: "Üye seçici",
          },
          release_picker: {
            label: "Sürüm seçici",
          },
          formula: {
            label: "Formül",
          },
        },
        attributes: {
          label: "Özellikler",
          text: {
            single_line: {
              label: "Tek satır",
            },
            multi_line: {
              label: "Paragraf",
            },
            readonly: {
              label: "Salt okunur",
              header: "Salt okunur veri",
            },
            invalid_text_format: {
              label: "Geçersiz metin formatı",
            },
          },
          number: {
            default: {
              placeholder: "Sayı ekle",
            },
          },
          relation: {
            single_select: {
              label: "Tek seçim",
            },
            multi_select: {
              label: "Çoklu seçim",
            },
            no_default_value: {
              label: "Varsayılan değer yok",
            },
          },
          boolean: {
            label: "Doğru | Yanlış",
            no_default: "Varsayılan değer yok",
          },
          option: {
            create_update: {
              label: "Seçenekler",
              form: {
                placeholder: "Seçenek ekle",
                errors: {
                  name: {
                    required: "Seçenek adı gereklidir.",
                    integrity: "Aynı ada sahip seçenek zaten var.",
                  },
                },
              },
            },
            select: {
              placeholder: {
                single: "Seçenek seçin",
                multi: {
                  default: "Seçenekler seçin",
                  variable: "{count} seçenek seçildi",
                },
              },
            },
          },
        },
        toast: {
          create: {
            success: {
              title: "Başarılı!",
              message: "Özellik {name} başarıyla oluşturuldu.",
            },
            error: {
              title: "Hata!",
              message: "Özellik oluşturulamadı. Lütfen tekrar deneyin!",
            },
          },
          update: {
            success: {
              title: "Başarılı!",
              message: "Özellik {name} başarıyla güncellendi.",
            },
            error: {
              title: "Hata!",
              message: "Özellik güncellenemedi. Lütfen tekrar deneyin!",
            },
          },
          delete: {
            success: {
              title: "Başarılı!",
              message: "Özellik {name} başarıyla silindi.",
            },
            error: {
              title: "Hata!",
              message: "Özellik silinemedi. Lütfen tekrar deneyin!",
            },
          },
          enable_disable: {
            loading: "{name} özelliği {action}",
            success: {
              title: "Başarılı!",
              message: "Özellik {name} başarıyla {action}.",
            },
            error: {
              title: "Hata!",
              message: "Özellik {action} başarısız oldu. Lütfen tekrar deneyin!",
            },
          },
        },
        create_update: {
          form: {
            display_name: {
              placeholder: "Başlık",
            },
            description: {
              placeholder: "Açıklama",
            },
          },
          errors: {
            name: {
              required: "Özelliğinize bir isim vermelisiniz.",
              max_length: "Özellik adı 255 karakteri geçmemelidir.",
            },
            property_type: {
              required: "Bir özellik tipi seçmelisiniz.",
            },
            options: {
              required: "En az bir seçenek eklemelisiniz.",
            },
            formula: {
              required: "Formül ifadesi gereklidir.",
              invalid: "Geçersiz formül: {error}",
              circular_reference:
                "Döngüsel referans algılandı. Bir formül doğrudan veya dolaylı olarak kendisine referans veremez.",
              invalid_reference: "Formül var olmayan bir özelliğe referans veriyor.",
            },
          },
        },
        formula: {
          field_label: "Formül alanı",
          tooltip: "'{'Alan Adı'}' sözdizimini kullanarak bir formül girin. +, -, *, / ve & operatörlerini destekler.",
          placeholder: "Formülü yazın",
          test_button: "Test",
          validating: "Doğrulanıyor",
          validation_success: "Formül geçerli! {resultType} döndürür",
          validation_success_with_refs: "Formül geçerli! {resultType} döndürür ({count} alan referans verildi)",
          error: {
            empty: "Lütfen bir formül girin",
            missing_context: "Çalışma alanı, proje veya iş öğesi türü bağlamı eksik",
            validation_failed: "Doğrulama başarısız",
          },
          picker: {
            no_match: "Eşleşen özellik yok",
            no_available: "Kullanılabilir özellik yok",
          },
        },
        enable_disable: {
          label: "Aktif",
          tooltip: {
            disabled: "Devre dışı bırakmak için tıklayın",
            enabled: "Etkinleştirmek için tıklayın",
          },
        },
        delete_confirmation: {
          title: "Bu özelliği sil",
          description: "Özelliklerin silinmesi mevcut verilerin kaybına neden olabilir.",
          secondary_description: "Bunun yerine özelliği devre dışı bırakmak ister misiniz?",
          primary_button: "{action}, sil",
          secondary_button: "Evet, devre dışı bırak",
        },
        mandate_confirmation: {
          label: "Zorunlu özellik",
          content:
            "Bu özellik için varsayılan bir seçenek olduğu görünüyor. Özelliği zorunlu hale getirmek varsayılan değeri kaldıracak ve kullanıcıların kendi seçtikleri bir değer eklemeleri gerekecek.",
          tooltip: {
            disabled: "Bu özellik türü zorunlu hale getirilemez",
            enabled: "Alanı isteğe bağlı olarak işaretlemek için işareti kaldırın",
            checked: "Alanı zorunlu olarak işaretlemek için işaretleyin",
          },
        },
        empty_state: {
          title: "Özel özellikler ekle",
          description: "Bu iş öğesi tipi için eklediğiniz yeni özellikler burada gösterilecektir.",
        },
      },
      item_delete_confirmation: {
        title: "Bu türü sil",
        description: "Türlerin silinmesi mevcut verilerin kaybına yol açabilir.",
        primary_button: "Evet, sil",
        toast: {
          success: {
            title: "Başarılı!",
            message: "İş öğesi türü başarıyla silindi.",
          },
          error: {
            title: "Hata!",
            message: "İş öğesi türü silinemedi. Lütfen tekrar deneyin!",
          },
        },
        errors: {
          cannot_delete_default_work_item_type: "Varsayılan iş öğesi türü silinemez",
          cannot_delete_work_item_type_with_associated_work_items: "İlişkili iş öğeleri olan iş öğesi türü silinemez",
        },
        can_disable_warning: "Bunun yerine türü devre dışı bırakmak ister misiniz?",
      },
      cant_delete_default_message: "Bu iş öğesi türü mevcut iş öğeleriyle bağlantılı olduğundan silinemez.",
    },
    create: {
      title: "İş öğesi tipi oluştur",
      button: "İş öğesi tipi ekle",
      toast: {
        success: {
          title: "Başarılı!",
          message: "İş öğesi tipi başarıyla oluşturuldu.",
        },
        error: {
          title: "Hata!",
          message: {
            conflict: "{name} türü zaten mevcut. Farklı bir ad seçin.",
          },
        },
      },
    },
    update: {
      title: "İş öğesi tipini güncelle",
      button: "İş öğesi tipini güncelle",
      toast: {
        success: {
          title: "Başarılı!",
          message: "İş öğesi tipi {name} başarıyla güncellendi.",
        },
        error: {
          title: "Hata!",
          message: {
            conflict: "{name} türü zaten mevcut. Farklı bir ad seçin.",
          },
        },
      },
    },
    create_update: {
      form: {
        name: {
          placeholder: "Bu iş öğesi tipine benzersiz bir isim verin",
        },
        description: {
          placeholder: "Bu iş öğesi tipinin ne için olduğunu ve ne zaman kullanılacağını açıklayın.",
        },
      },
    },
    enable_disable: {
      toast: {
        loading: "{name} iş öğesi tipi {action}",
        success: {
          title: "Başarılı!",
          message: "İş öğesi tipi {name} başarıyla {action}.",
        },
        error: {
          title: "Hata!",
          message: "İş öğesi tipi {action} başarısız oldu. Lütfen tekrar deneyin!",
        },
      },
      tooltip: "{action} için tıklayın",
    },
    change_confirmation: {
      title: "İş öğesi tipini değiştir?",
      description:
        "İş öğesi tipini değiştirmek, mevcut tipe özgü özel özellik değerlerinin kaybına neden olabilir. Bu işlem geri alınamaz.",
      button: {
        loading: "Değiştiriliyor",
        default: "Tipi değiştir",
      },
    },
    empty_state: {
      enable: {
        title: "İş Öğesi Tiplerini Etkinleştir",
        description:
          "İş öğelerinizi İş öğesi tipleriyle şekillendirin. Simgeler, arka planlar ve özelliklerle özelleştirin ve bu proje için yapılandırın.",
        primary_button: {
          text: "Etkinleştir",
        },
        confirmation: {
          title: "Bir kez etkinleştirildikten sonra, İş Öğesi Tipleri devre dışı bırakılamaz.",
          description:
            "Plane'in İş Öğesi, bu proje için varsayılan iş öğesi tipi haline gelecek ve bu projede simgesi ve arka planıyla görünecektir.",
          button: {
            default: "Etkinleştir",
            loading: "Ayarlanıyor",
          },
        },
      },
      get_pro: {
        title: "İş öğesi tiplerini etkinleştirmek için Pro'ya geçin.",
        description:
          "İş öğelerinizi İş öğesi tipleriyle şekillendirin. Simgeler, arka planlar ve özelliklerle özelleştirin ve bu proje için yapılandırın.",
        primary_button: {
          text: "Pro'ya Geç",
        },
      },
      upgrade: {
        title: "İş öğesi tiplerini etkinleştirmek için yükseltin.",
        description:
          "İş öğelerinizi İş öğesi tipleriyle şekillendirin. Simgeler, arka planlar ve özelliklerle özelleştirin ve bu proje için yapılandırın.",
        primary_button: {
          text: "Yükselt",
        },
      },
    },
  },
  importers: {
    imports: "İmportlar",
    logo: "Logo",
    import_message: "{serviceName} verilerinizi plane projelerine import edin.",
    deactivate: "Deaktif Et",
    deactivating: "Deaktif Ediliyor",
    migrating: "Taşınıyor",
    migrations: "Taşımalar",
    refreshing: "Yenileniyor",
    import: "İmport Et",
    serial_number: "Sıra No.",
    project: "Proje",
    workspace: "Workspace",
    status: "Durum",
    summary: "Özet",
    total_batches: "Toplam Batch",
    imported_batches: "İmport Edilen Batchler",
    re_run: "Tekrar Çalıştır",
    cancel: "İptal",
    start_time: "Başlangıç Zamanı",
    no_jobs_found: "İş bulunamadı",
    no_project_imports: "Henüz hiç {serviceName} projesi import etmediniz.",
    cancel_import_job: "İmport işini iptal et",
    cancel_import_job_confirmation:
      "Bu import işini iptal etmek istediğinizden emin misiniz? Bu, bu proje için import işlemini durduracaktır.",
    re_run_import_job: "İmport işini yeniden çalıştır",
    re_run_import_job_confirmation:
      "Bu import işini yeniden çalıştırmak istediğinizden emin misiniz? Bu, bu proje için import işlemini yeniden başlatacaktır.",
    upload_csv_file: "Kullanıcı verilerini import etmek için bir CSV dosyası yükleyin.",
    connect_importer: "{serviceName} Bağla",
    migration_assistant: "Taşıma Asistanı",
    migration_assistant_description: "{serviceName} projelerinizi güçlü asistanımızla Plane'e sorunsuzca taşıyın.",
    token_helper: "Bunu şuradan alacaksınız",
    personal_access_token: "Kişisel Erişim Tokeni",
    source_token_expired: "Token Süresi Doldu",
    source_token_expired_description:
      "Sağlanan tokenin süresi doldu. Lütfen deaktif edip yeni bir kimlik seti ile yeniden bağlanın.",
    user_email: "Kullanıcı Emaili",
    select_state: "Durum Seçin",
    select_service_project: "{serviceName} Projesi Seçin",
    loading_service_projects: "{serviceName} projeleri yükleniyor",
    select_service_workspace: "{serviceName} Workspace Seçin",
    loading_service_workspaces: "{serviceName} Workspaceleri Yükleniyor",
    select_priority: "Öncelik Seçin",
    select_service_team: "{serviceName} Takımı Seçin",
    add_seat_msg_free_trial:
      "{additionalUserCount} kayıtlı olmayan kullanıcı import etmeye çalışıyorsunuz ve mevcut planda sadece {currentWorkspaceSubscriptionAvailableSeats} koltuk kullanılabilir. İmport etmeye devam etmek için şimdi yükseltin.",
    add_seat_msg_paid:
      "{additionalUserCount} kayıtlı olmayan kullanıcı import etmeye çalışıyorsunuz ve mevcut planda sadece {currentWorkspaceSubscriptionAvailableSeats} koltuk kullanılabilir. İmport etmeye devam etmek için en az {extraSeatRequired} ekstra koltuk satın alın.",
    skip_user_import_title: "Kullanıcı verisi importunu atla",
    skip_user_import_description:
      "Kullanıcı importunu atlamak, {serviceName}'den gelen iş öğelerinin, yorumların ve diğer verilerin Plane'de taşımayı gerçekleştiren kullanıcı tarafından oluşturulmasıyla sonuçlanacaktır. Yine de daha sonra manuel olarak kullanıcı ekleyebilirsiniz.",
    invalid_pat: "Geçersiz Kişisel Erişim Tokeni",
  },
  integrations: {
    integrations: "Entegrasyonlar",
    loading: "Yükleniyor",
    unauthorized: "Bu sayfayı görüntüleme yetkiniz yok.",
    configure: "Yapılandır",
    not_enabled: "{name} bu workspace için etkinleştirilmemiş.",
    not_configured: "Yapılandırılmamış",
    disconnect_personal_account: "Kişisel {providerName} hesabını bağlantıdan kes",
    not_configured_message_admin:
      "{name} entegrasyonu yapılandırılmamış. Lütfen yapılandırmak için instance admininizle iletişime geçin.",
    not_configured_message_support:
      "{name} entegrasyonu yapılandırılmamış. Lütfen yapılandırmak için destekle iletişime geçin.",
    external_api_unreachable: "Harici API'ye erişilemiyor. Lütfen daha sonra tekrar deneyin.",
    error_fetching_supported_integrations: "Desteklenen entegrasyonlar getirilemedi. Lütfen daha sonra tekrar deneyin.",
    back_to_integrations: "Entegrasyonlara geri dön",
    select_state: "Durum Seçin",
    set_state: "Durumu Ayarla",
    choose_project: "Proje Seçin...",
    skip_backward_state_movement: "PR güncellemeleri nedeniyle sorunların önceki bir duruma taşınmasını önle",
  },
  github_integration: {
    name: "GitHub",
    description: "GitHub iş öğelerinizi Plane ile bağlayın ve senkronize edin",
    connect_org: "Organizasyonu Bağla",
    connect_org_description: "GitHub organizasyonunuzu Plane ile bağlayın",
    processing: "İşleniyor",
    org_added_desc: "GitHub org eklendi ve zaman",
    connection_fetch_error: "Sunucudan bağlantı detayları getirilirken hata oluştu",
    personal_account_connected: "Kişisel hesabı bağlı",
    personal_account_connected_description: "GitHub hesabınız artık Plane'e bağlı",
    connect_personal_account: "Kişisel hesabı bağla",
    connect_personal_account_description: "GitHub hesabınızı Plane ile bağlayın.",
    repo_mapping: "Repository Eşleme",
    repo_mapping_description: "GitHub repository'lerinizi Plane projeleriyle eşleyin.",
    project_issue_sync: "Project Issue Senkronizasyonu",
    project_issue_sync_description: "GitHub'dan Plane projeye issue'leri senkronize edin",
    project_issue_sync_empty_state: "Eşlenen proje issue senkronizasyonları burada görünecek",
    configure_project_issue_sync_state: "Issue senkronizasyon durumunu yapılandırın",
    select_issue_sync_direction: "Issue senkronizasyon yönünü seçin",
    allow_bidirectional_sync: "Bidirectional - GitHub ve Plane arasında issue ve yorumları senkronize edin",
    allow_unidirectional_sync: "Unidirectional - GitHub'dan Plane'e issue ve yorumları senkronize edin",
    allow_unidirectional_sync_warning:
      "GitHub Issue'dan gelen veriler, Bağlantılı Plane Çalışma Öğesindeki verileri değiştirecek (sadece GitHub → Plane)",
    remove_project_issue_sync: "Bu Project Issue Senkronizasyonunu kaldırın",
    remove_project_issue_sync_confirmation: "Bu project issue senkronizasyonunu kaldırmak istediğinizden emin misiniz?",
    add_pr_state_mapping: "Plane projesine için Pull Request durum eşlemesini ekle",
    edit_pr_state_mapping: "Plane projesine için Pull Request durum eşlemesini düzenle",
    pr_state_mapping: "Pull Request durum eşlemesi",
    pr_state_mapping_description: "GitHub pull request durumlarını Plane projeye eşleyin",
    pr_state_mapping_empty_state: "Eşlenen PR durumları burada görünecek",
    remove_pr_state_mapping: "Bu Pull Request durum eşlemesini kaldırın",
    remove_pr_state_mapping_confirmation: "Bu pull request durum eşlemesini kaldırmak istediğinizden emin misiniz?",
    issue_sync_message: "İş öğeleri {project} projesine senkronize edildi",
    link: "GitHub repository'yi Plane projeye bağla",
    pull_request_automation: "Pull Request Otomasyonu",
    pull_request_automation_description: "GitHub'dan Plane projeye pull request durum eşlemesini yapılandırın",
    DRAFT_MR_OPENED: "Taslak MR açıldığında, durumu şuna ayarla",
    MR_OPENED: "MR açıldığında, durumu şuna ayarla",
    MR_READY_FOR_MERGE: "MR birleştirmeye hazır olduğunda, durumu şuna ayarla",
    MR_REVIEW_REQUESTED: "MR incelemesi istendiğinde, durumu şuna ayarla",
    MR_MERGED: "MR birleştirildiğinde, durumu şuna ayarla",
    MR_CLOSED: "MR Kapandığında, durumu şuna ayarla",
    ISSUE_OPEN: "Issue Açıldığında, durumu şuna ayarla",
    ISSUE_CLOSED: "Issue Kapandığında, durumu şuna ayarla",
    save: "Kaydet",
    start_sync: "Senkronizasyonu Başlat",
    choose_repository: "Repository Seçin...",
  },
  gitlab_integration: {
    name: "Gitlab",
    description: "Gitlab Merge Requestlerinizi Plane ile bağlayın ve senkronize edin.",
    connection_fetch_error: "Sunucudan bağlantı detayları getirilirken hata oluştu",
    connect_org: "Organizasyonu Bağla",
    connect_org_description: "Gitlab organizasyonunuzu Plane ile bağlayın.",
    project_connections: "Gitlab Proje Bağlantıları",
    project_connections_description: "Gitlab'dan Plane projelerine merge requestleri senkronize edin.",
    plane_project_connection: "Plane Proje Bağlantısı",
    plane_project_connection_description: "Gitlab'dan Plane projelerine pull request durum eşlemesini yapılandırın",
    remove_connection: "Bağlantıyı Kaldır",
    remove_connection_confirmation: "Bu bağlantıyı kaldırmak istediğinizden emin misiniz?",
    link: "Gitlab reposunu Plane projesine bağla",
    pull_request_automation: "Pull Request Otomasyonu",
    pull_request_automation_description: "Gitlab'dan Plane'e pull request durum eşlemesini yapılandırın",
    DRAFT_MR_OPENED: "Taslak MR açıldığında, durumu şuna ayarla",
    MR_OPENED: "MR açıldığında, durumu şuna ayarla",
    MR_REVIEW_REQUESTED: "MR incelemesi istendiğinde, durumu şuna ayarla",
    MR_READY_FOR_MERGE: "MR birleştirmeye hazır olduğunda, durumu şuna ayarla",
    MR_MERGED: "MR birleştirildiğinde, durumu şuna ayarla",
    MR_CLOSED: "MR kapatıldığında, durumu şuna ayarla",
    integration_enabled_text:
      "Gitlab entegrasyonu Etkinleştirildiğinde, iş öğesi iş akışlarını otomatikleştirebilirsiniz",
    choose_entity: "Varlık Seçin",
    choose_project: "Proje Seçin",
    link_plane_project: "Plane projesini bağla",
    project_issue_sync: "Proje Sorun Senkronizasyonu",
    project_issue_sync_description: "Gitlab'dan Plane projenize sorunları senkronize edin",
    project_issue_sync_empty_state: "Eşlenmiş proje sorun senkronizasyonu burada görünecek",
    configure_project_issue_sync_state: "Sorun Senkronizasyon Durumunu Yapılandır",
    select_issue_sync_direction: "Sorun senkronizasyon yönünü seçin",
    allow_bidirectional_sync:
      "Çift Yönlü - Gitlab ve Plane arasında sorunları ve yorumları her iki yönde senkronize et",
    allow_unidirectional_sync: "Tek Yönlü - Sorunları ve yorumları yalnızca Gitlab'dan Plane'e senkronize et",
    allow_unidirectional_sync_warning:
      "Gitlab Sorunu'ndaki veriler Bağlantılı Plane İş Öğesi'ndeki verilerin yerini alacak (yalnızca Gitlab → Plane)",
    remove_project_issue_sync: "Bu Proje Sorun Senkronizasyonunu Kaldır",
    remove_project_issue_sync_confirmation: "Bu proje sorun senkronizasyonunu kaldırmak istediğinizden emin misiniz?",
    ISSUE_OPEN: "Sorun Açık",
    ISSUE_CLOSED: "Sorun Kapalı",
    save: "Kaydet",
    start_sync: "Senkronizasyonu Başlat",
    choose_repository: "Depo Seçin...",
  },
  gitlab_enterprise_integration: {
    name: "Gitlab Enterprise",
    description: "Gitlab Enterprise örneğinizi Plane ile bağlayın ve senkronize edin.",
    app_form_title: "Gitlab Enterprise Yapılandırması",
    app_form_description: "Gitlab Enterprise'ı Plane'e bağlanmak için yapılandırın.",
    base_url_title: "Temel URL",
    base_url_description: "Gitlab Enterprise örneğinizin temel URL'si.",
    base_url_placeholder: 'örn. "https://glab.plane.town"',
    base_url_error: "Temel URL gereklidir",
    invalid_base_url_error: "Geçersiz temel URL",
    client_id_title: "Uygulama ID",
    client_id_description: "Gitlab Enterprise örneğinizde oluşturduğunuz uygulamanın ID'si.",
    client_id_placeholder: 'örn. "7cd732xxxxxxxxxxxxxx"',
    client_id_error: "Uygulama ID gereklidir",
    client_secret_title: "İstemci Gizli Anahtarı",
    client_secret_description: "Gitlab Enterprise örneğinizde oluşturduğunuz uygulamanın istemci gizli anahtarı.",
    client_secret_placeholder: 'örn. "gloas-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"',
    client_secret_error: "İstemci gizli anahtarı gereklidir",
    webhook_secret_title: "Webhook Gizli Anahtarı",
    webhook_secret_description:
      "Gitlab Enterprise örneğinden webhook'u doğrulamak için kullanılacak rastgele webhook gizli anahtarı.",
    webhook_secret_placeholder: 'örn. "webhook1234567890"',
    webhook_secret_error: "Webhook gizli anahtarı gereklidir",
    connect_app: "Uygulamayı Bağla",
  },
  slack_integration: {
    name: "Slack",
    description: "Slack workspacenizi Plane ile bağlayın.",
    connect_personal_account: "Kişisel Slack hesabınızı Plane ile bağlayın.",
    personal_account_connected: "Kişisel {providerName} hesabınız artık Plane'e bağlı.",
    link_personal_account: "Kişisel {providerName} hesabınızı Plane'e bağlayın.",
    connected_slack_workspaces: "Bağlı Slack workspaceleri",
    connected_on: "{date} tarihinde bağlandı",
    disconnect_workspace: "{name} workspaceini bağlantıdan kes",
    alerts: {
      dm_alerts: {
        title:
          "Önemli güncellemeler, hatırlatmalar ve sadece size özel uyarılar için Slack direkt mesajlarında bildirim alın.",
      },
    },
    project_updates: {
      title: "Proje Güncellemeleri",
      description: "Projeleriniz için proje güncelleme bildirimlerini yapılandırın",
      add_new_project_update: "Yeni proje güncelleme bildirimi ekle",
      project_updates_empty_state: "Slack Kanallarına bağlı projeler burada görünecek.",
      project_updates_form: {
        title: "Proje Güncellemelerini Yapılandır",
        description: "İş öğeleri oluşturulduğunda Slack'te proje güncelleme bildirimleri alın",
        failed_to_load_channels: "Slack'ten kanallar yüklenemedi",
        project_dropdown: {
          placeholder: "Bir proje seçin",
          label: "Plane Projesi",
          no_projects: "Kullanılabilir proje yok",
        },
        channel_dropdown: {
          label: "Slack Kanalı",
          placeholder: "Bir kanal seçin",
          no_channels: "Kullanılabilir kanal yok",
        },
        all_projects_connected: "Tüm projeler zaten Slack kanallarına bağlı.",
        all_channels_connected: "Tüm Slack kanalları zaten projelere bağlı.",
        project_connection_success: "Proje bağlantısı başarıyla oluşturuldu",
        project_connection_updated: "Proje bağlantısı başarıyla güncellendi",
        project_connection_deleted: "Proje bağlantısı başarıyla silindi",
        failed_delete_project_connection: "Proje bağlantısı silinemedi",
        failed_create_project_connection: "Proje bağlantısı oluşturulamadı",
        failed_upserting_project_connection: "Proje bağlantısı güncellenemedi",
        failed_loading_project_connections:
          "Proje bağlantılarınızı yükleyemedik. Bu, bir ağ sorunu veya entegrasyonla ilgili bir sorundan kaynaklanıyor olabilir.",
      },
    },
  },
  sentry_integration: {
    name: "Sentry",
    description: "Sentry çalışma alanınızı Plane ile bağlayın.",
    connected_sentry_workspaces: "Bağlı Sentry çalışma alanları",
    connected_on: "{date} tarihinde bağlandı",
    disconnect_workspace: "{name} çalışma alanını bağlantısını kes",
    state_mapping: {
      title: "Durum eşleştirme",
      description:
        "Sentry olay durumlarını proje durumlarınızla eşleştirin. Bir Sentry olayı çözüldüğünde veya çözülmediğinde hangi durumların kullanılacağını yapılandırın.",
      add_new_state_mapping: "Yeni durum eşleştirme ekle",
      empty_state:
        "Durum eşleştirme yapılandırılmamış. Sentry olay durumlarını proje durumlarınızla senkronize etmek için ilk eşleştirmenizi oluşturun.",
      failed_loading_state_mappings:
        "Durum eşleştirmelerinizi yükleyemedik. Bu, ağ sorunu veya entegrasyon sorunu nedeniyle olabilir.",
      loading_project_states: "Proje durumları yükleniyor...",
      error_loading_states: "Durumlar yüklenirken hata",
      no_states_available: "Kullanılabilir durum yok",
      no_permission_states: "Bu proje için durumlara erişim izniniz yok",
      states_not_found: "Proje durumları bulunamadı",
      server_error_states: "Durumlar yüklenirken sunucu hatası",
    },
  },
  github_enterprise_integration: {
    name: "GitHub Enterprise",
    description: "GitHub Enterprise organizasyonunuzu Plane ile bağlayın ve senkronize edin.",
    app_form_title: "GitHub Enterprise Yapılandırması",
    app_form_description: "GitHub Enterprise'ı Plane ile bağlamak için yapılandırın.",
    app_id_title: "App ID",
    app_id_description: "GitHub Enterprise organizasyonunuzda oluşturduğunuz uygulamanın ID'si.",
    app_id_placeholder: 'e.g., "1234567890"',
    app_id_error: "App ID gereklidir",
    app_name_title: "App Slug",
    app_name_description: "GitHub Enterprise organizasyonunuzda oluşturduğunuz uygulamanın slug'ı.",
    app_name_error: "App slug gereklidir",
    app_name_placeholder: 'e.g., "plane-github-enterprise"',
    base_url_title: "Base URL",
    base_url_description: "GitHub Enterprise organizasyonunuzun base URL'si.",
    base_url_placeholder: 'e.g., "https://gh.plane.town"',
    base_url_error: "Base URL gereklidir",
    invalid_base_url_error: "Geçersiz base URL",
    client_id_title: "Client ID",
    client_id_description: "GitHub Enterprise organizasyonunuzda oluşturduğunuz uygulamanın client ID'si.",
    client_id_placeholder: 'e.g., "1234567890"',
    client_id_error: "Client ID gereklidir",
    client_secret_title: "Client Secret",
    client_secret_description: "GitHub Enterprise organizasyonunuzda oluşturduğunuz uygulamanın client secret'i.",
    client_secret_placeholder: 'e.g., "1234567890"',
    client_secret_error: "Client secret gereklidir",
    webhook_secret_title: "Webhook Secret",
    webhook_secret_description: "GitHub Enterprise organizasyonunuzda oluşturduğunuz uygulamanın webhook secret'i.",
    webhook_secret_placeholder: 'e.g., "1234567890"',
    webhook_secret_error: "Webhook secret gereklidir",
    private_key_title: "Private Key (Base64 encoded)",
    private_key_description: "GitHub Enterprise organizasyonunuzda oluşturduğunuz uygulamanın private key'i.",
    private_key_placeholder: 'e.g., "MIIEpAIBAAKCAQEA...',
    private_key_error: "Private key gereklidir",
    connect_app: "Uygulamayı Bağla",
  },
  file_upload: {
    upload_text: "Dosya yüklemek için buraya tıklayın",
    drag_drop_text: "Sürükle ve Bırak",
    processing: "İşleniyor",
    invalid: "Geçersiz dosya tipi",
    missing_fields: "Eksik alanlar",
    success: "{fileName} Yüklendi!",
  },
  silo_errors: {
    invalid_query_params: "Sağlanan sorgu parametreleri geçersiz veya gerekli alanlar eksik",
    invalid_installation_account: "Sağlanan kurulum hesabı geçerli değil",
    generic_error: "İsteğiniz işlenirken beklenmeyen bir hata oluştu",
    connection_not_found: "İstenilen bağlantı bulunamadı",
    multiple_connections_found: "Yalnızca bir tane beklenirken birden fazla bağlantı bulundu",
    cannot_create_multiple_connections:
      "Organizasyonunuzu zaten bir workspeysle konnekt ettiniz. Lütfen yeni bir konnekşın yapmadan önce mevcut konnekşını diskonnekt edin.",
    installation_not_found: "İstenilen kurulum bulunamadı",
    user_not_found: "İstenilen kullanıcı bulunamadı",
    error_fetching_token: "Kimlik doğrulama tokeni alınamadı",
    invalid_app_credentials: "Sağlanan uygulama kimlik bilgileri geçersiz",
    invalid_app_installation_id: "Uygulama yüklenemedi",
  },
  import_status: {
    queued: "Sıraya Alındı",
    created: "Oluşturuldu",
    initiated: "Başlatıldı",
    pulling: "Çekiliyor",
    timed_out: "Zaman aşımı",
    pulled: "Çekildi",
    transforming: "Dönüştürülüyor",
    transformed: "Dönüştürüldü",
    pushing: "İtiliyor",
    finished: "Tamamlandı",
    error: "Hata",
    cancelled: "İptal Edildi",
  },
  jira_importer: {
    jira_importer_description: "Jira verilerinizi Plane projelerine import edin.",
    personal_access_token: "Kişisel Erişim Tokeni",
    user_email: "Kullanıcı Emaili",
    create_project_automatically: "Projeyi otomatik olarak oluştur",
    create_project_automatically_description: "Jira proje detaylarına göre sizin için yeni bir proje oluşturacağız.",
    import_to_existing_project: "Mevcut projeye aktar",
    import_to_existing_project_description: "Aşağıdaki açılır menüden mevcut bir projeyi seçin.",
    state_mapping_automatic_creation: "Tüm Jira durumları Plane'de otomatik olarak oluşturulacaktır.",
    atlassian_security_settings: "Atlassian Güvenlik Ayarları",
    email_description: "Bu, kişisel erişim tokeninize bağlı emaildir",
    jira_domain: "Jira Domain",
    jira_domain_description: "Bu, Jira instance'ınızın domainidir",
    steps: {
      title_configure_plane: "Plane'i Yapılandır",
      description_configure_plane:
        "Lütfen önce Jira verilerinizi taşımayı düşündüğünüz projeyi Plane'de oluşturun. Proje oluşturulduktan sonra, burada seçin.",
      title_configure_jira: "Jira'yı Yapılandır",
      description_configure_jira: "Lütfen verilerinizi taşımak istediğiniz Jira workspaceini seçin.",
      title_import_users: "Kullanıcıları İmport Et",
      description_import_users:
        "Lütfen Jira'dan Plane'e taşımak istediğiniz kullanıcıları ekleyin. Alternatif olarak, bu adımı atlayabilir ve daha sonra manuel olarak kullanıcı ekleyebilirsiniz.",
      title_map_states: "Durumları Eşleştir",
      description_map_states:
        "Jira durumlarını elimizden geldiğince Plane durumlarıyla otomatik olarak eşleştirdik. Devam etmeden önce lütfen kalan durumları eşleştirin, ayrıca manuel olarak durumlar oluşturup eşleştirebilirsiniz.",
      title_map_priorities: "Öncelikleri Eşleştir",
      description_map_priorities:
        "Öncelikleri elimizden geldiğince otomatik olarak eşleştirdik. Devam etmeden önce lütfen kalan öncelikleri eşleştirin.",
      title_summary: "Özet",
      description_summary: "İşte Jira'dan Plane'e taşınacak verilerin bir özeti.",
      custom_jql_filter: "Özel JQL Filtresi",
      jql_filter_description: "İçe aktarılacak belirli konuları filtrelemek için JQL kullanın.",
      project_code: "PROJE",
      enter_filters_placeholder: "Filtreleri girin (örn. status = 'In Progress')",
      validating_query: "Sorgu doğrulanıyor...",
      validation_successful_work_items_selected: "Doğrulama Başarılı, {count} İş Öğesi Seçildi.",
      run_syntax_check: "Sorgunuzu doğrulamak için sözdizimi kontrolünü çalıştırın",
      refresh: "Yenile",
      check_syntax: "Sözdizimini Kontrol Et",
      no_work_items_selected: "Sorgu tarafından hiçbir iş öğesi seçilmedi.",
      validation_error_default: "Sorgu doğrulanırken bir hata oluştu.",
    },
  },
  asana_importer: {
    asana_importer_description: "Asana verilerinizi Plane projelerine import edin.",
    select_asana_priority_field: "Asana Öncelik Alanını Seçin",
    steps: {
      title_configure_plane: "Plane'i Yapılandır",
      description_configure_plane:
        "Lütfen önce Asana verilerinizi taşımayı düşündüğünüz projeyi Plane'de oluşturun. Proje oluşturulduktan sonra, burada seçin.",
      title_configure_asana: "Asana'yı Yapılandır",
      description_configure_asana: "Lütfen verilerinizi taşımak istediğiniz Asana workspaceini ve projeyi seçin.",
      title_map_states: "Durumları Eşleştir",
      description_map_states: "Lütfen Plane proje durumlarına eşlemek istediğiniz Asana durumlarını seçin.",
      title_map_priorities: "Öncelikleri Eşleştir",
      description_map_priorities: "Lütfen Plane proje önceliklerine eşlemek istediğiniz Asana önceliklerini seçin.",
      title_summary: "Özet",
      description_summary: "İşte Asana'dan Plane'e taşınacak verilerin bir özeti.",
    },
  },
  linear_importer: {
    linear_importer_description: "Linear verilerinizi Plane projelerine import edin.",
    steps: {
      title_configure_plane: "Plane'i Yapılandır",
      description_configure_plane:
        "Lütfen önce Linear verilerinizi taşımayı düşündüğünüz projeyi Plane'de oluşturun. Proje oluşturulduktan sonra, burada seçin.",
      title_configure_linear: "Linear'ı Yapılandır",
      description_configure_linear: "Lütfen verilerinizi taşımak istediğiniz Linear takımını seçin.",
      title_map_states: "Durumları Eşleştir",
      description_map_states:
        "Linear durumlarını elimizden geldiğince Plane durumlarıyla otomatik olarak eşleştirdik. Devam etmeden önce lütfen kalan durumları eşleştirin, ayrıca manuel olarak durumlar oluşturup eşleştirebilirsiniz.",
      title_map_priorities: "Öncelikleri Eşleştir",
      description_map_priorities: "Lütfen Plane proje önceliklerine eşlemek istediğiniz Linear önceliklerini seçin.",
      title_summary: "Özet",
      description_summary: "İşte Linear'dan Plane'e taşınacak verilerin bir özeti.",
    },
  },
  jira_server_importer: {
    jira_server_importer_description: "Jira Server/Data Center verilerinizi Plane projelerine import edin.",
    steps: {
      title_configure_plane: "Plane'i Yapılandır",
      description_configure_plane:
        "Lütfen önce Jira verilerinizi taşımayı düşündüğünüz projeyi Plane'de oluşturun. Proje oluşturulduktan sonra, burada seçin.",
      title_configure_jira: "Jira'yı Yapılandır",
      description_configure_jira: "Lütfen verilerinizi taşımak istediğiniz Jira workspaceini seçin.",
      title_map_states: "Durumları Eşleştir",
      description_map_states: "Lütfen Plane proje durumlarına eşlemek istediğiniz Jira durumlarını seçin.",
      title_map_priorities: "Öncelikleri Eşleştir",
      description_map_priorities: "Lütfen Plane proje önceliklerine eşlemek istediğiniz Jira önceliklerini seçin.",
      title_summary: "Özet",
      description_summary: "İşte Jira'dan Plane'e taşınacak verilerin bir özeti.",
    },
    import_epics: {
      title: "Epikleri İş Öğesi Olarak İçe Aktar",
      description:
        "Bu özellik etkinleştirildiğinde, epikleriniz epik iş öğesi türünde bir iş öğesi olarak içe aktarılacaktır.",
    },
  },
  notion_importer: {
    notion_importer_description: "Notion verilerinizi Plane projelerine aktarın.",
    steps: {
      title_upload_zip: "Notion'dan Dışa Aktarılan ZIP'i Yükle",
      description_upload_zip: "Lütfen Notion verilerinizi içeren ZIP dosyasını yükleyin.",
    },
    upload: {
      drop_file_here: "Notion zip dosyanızı buraya bırakın",
      upload_title: "Notion Dışa Aktarımını Yükle",
      upload_from_url: "URL'den içe aktar",
      upload_from_url_description: "Devam etmek için ZIP dışa aktarımınızın herkese açık URL'sini yapıştırın.",
      drag_drop_description: "Notion dışa aktarım zip dosyanızı sürükleyip bırakın veya göz atmak için tıklayın",
      file_type_restriction: "Yalnızca Notion'dan dışa aktarılan .zip dosyaları desteklenir",
      select_file: "Dosya Seç",
      uploading: "Yükleniyor...",
      preparing_upload: "Yükleme hazırlanıyor...",
      confirming_upload: "Yükleme onaylanıyor...",
      confirming: "Onaylanıyor...",
      upload_complete: "Yükleme tamamlandı",
      upload_failed: "Yükleme başarısız",
      start_import: "İçe Aktarmayı Başlat",
      retry_upload: "Yüklemeyi Yeniden Dene",
      upload: "Yükle",
      ready: "Hazır",
      error: "Hata",
      upload_complete_message: "Yükleme tamamlandı!",
      upload_complete_description: 'Notion verilerinizin işlenmesini başlatmak için "İçe Aktarmayı Başlat"a tıklayın.',
      upload_progress_message: "Lütfen bu pencereyi kapatmayın.",
    },
  },
  confluence_importer: {
    confluence_importer_description: "Confluence verilerinizi Plane wiki'sine aktarın.",
    steps: {
      title_upload_zip: "Confluence'dan Dışa Aktarılan ZIP'i Yükle",
      description_upload_zip: "Lütfen Confluence verilerinizi içeren ZIP dosyasını yükleyin.",
    },
    upload: {
      drop_file_here: "Confluence zip dosyanızı buraya bırakın",
      upload_title: "Confluence Dışa Aktarımını Yükle",
      upload_from_url: "URL'den içe aktar",
      upload_from_url_description: "Devam etmek için ZIP dışa aktarımınızın herkese açık URL'sini yapıştırın.",
      drag_drop_description: "Confluence dışa aktarım zip dosyanızı sürükleyip bırakın veya göz atmak için tıklayın",
      file_type_restriction: "Yalnızca Confluence'dan dışa aktarılan .zip dosyaları desteklenir",
      select_file: "Dosya Seç",
      uploading: "Yükleniyor...",
      preparing_upload: "Yükleme hazırlanıyor...",
      confirming_upload: "Yükleme onaylanıyor...",
      confirming: "Onaylanıyor...",
      upload_complete: "Yükleme tamamlandı",
      upload_failed: "Yükleme başarısız",
      start_import: "İçe Aktarmayı Başlat",
      retry_upload: "Yüklemeyi Yeniden Dene",
      upload: "Yükle",
      ready: "Hazır",
      error: "Hata",
      upload_complete_message: "Yükleme tamamlandı!",
      upload_complete_description:
        'Confluence verilerinizin işlenmesini başlatmak için "İçe Aktarmayı Başlat"a tıklayın.',
      upload_progress_message: "Lütfen bu pencereyi kapatmayın.",
    },
  },
  flatfile_importer: {
    flatfile_importer_description: "CSV verilerinizi Plane projelerine import edin.",
    steps: {
      title_configure_plane: "Plane'i Yapılandır",
      description_configure_plane:
        "Lütfen önce CSV verilerinizi taşımayı düşündüğünüz projeyi Plane'de oluşturun. Proje oluşturulduktan sonra, burada seçin.",
      title_configure_csv: "CSV'yi Yapılandır",
      description_configure_csv: "Lütfen CSV dosyanızı yükleyin ve Plane alanlarına eşlenecek alanları yapılandırın.",
    },
  },
  csv_importer: {
    csv_importer_description: "CSV dosyalarından Plane projelerine iş öğelerini aktarın.",
    steps: {
      title_select_project: "Proje Seç",
      description_select_project: "Lütfen iş öğelerinizi içe aktarmak istediğiniz Plane projesini seçin.",
      title_upload_csv: "CSV Yükle",
      description_upload_csv:
        "İş öğelerini içeren CSV dosyanızı yükleyin. Dosya ad, açıklama, öncelik, tarihler và durum grubu sütunlarını içermelidir.",
    },
  },
  clickup_importer: {
    clickup_importer_description: "ClickUp verilerinizi Plane projelerine import edin.",
    select_service_space: "{serviceName} Space Seçin",
    select_service_folder: "{serviceName} Folder Seçin",
    selected: "Seçildi",
    users: "Kullanıcılar",
    steps: {
      title_configure_plane: "Plane'i Yapılandır",
      description_configure_plane:
        "Lütfen önce ClickUp verilerinizi taşımayı düşündüğünüz projeyi Plane'de oluşturun. Proje oluşturulduktan sonra, burada seçin.",
      title_configure_clickup: "ClickUp'ı Yapılandır",
      description_configure_clickup: "Lütfen ClickUp takımı, alan ve klasörünü seçin.",
      title_map_states: "Durumları Eşleştir",
      description_map_states:
        "ClickUp durumlarını Plane durumlarıyla otomatik olarak eşleştirdik. Devam etmeden önce lütfen kalan durumları eşleştirin, ayrıca manuel olarak durumlar oluşturup eşleştirebilirsiniz.",
      title_map_priorities: "Öncelikleri Eşleştir",
      description_map_priorities: "Lütfen ClickUp önceliklerini Plane proje önceliklerine eşlemek istediğinizi seçin.",
      title_summary: "Özet",
      description_summary: "İşte ClickUp'dan Plane'e taşınacak verilerin bir özeti.",
      pull_additional_data_title: "Yorumları ve Ekleri İmport Et",
    },
  },
  dashboards: {
    widget: {
      chart_types: {
        bar_chart: {
          short_label: "Bar",
          long_label: "Bar çart",
          chart_models: {
            basic: {
              short_label: "Beysik",
              long_label: "Beysik bar",
            },
            stacked: {
              short_label: "Stekt",
              long_label: "Stekt bar",
            },
            grouped: {
              short_label: "Grupd",
              long_label: "Grupd bar",
            },
          },
          orientation: {
            label: "Oryantasyon",
            horizontal: "Horizontal",
            vertical: "Vertikal",
            placeholder: "Oryantasyon ekle",
          },
          bar_color: "Bar rengi",
        },
        line_chart: {
          short_label: "Layn",
          long_label: "Layn çart",
          chart_models: {
            basic: {
              short_label: "Beysik",
              long_label: "Beysik layn",
            },
            multi_line: {
              short_label: "Multi-layn",
              long_label: "Multi-layn",
            },
          },
          line_color: "Layn rengi",
          line_type: {
            label: "Layn tipi",
            solid: "Solid",
            dashed: "Deşt",
            placeholder: "Layn tipi ekle",
          },
        },
        area_chart: {
          short_label: "Eriya",
          long_label: "Eriya çart",
          chart_models: {
            basic: {
              short_label: "Beysik",
              long_label: "Beysik eriya",
            },
            stacked: {
              short_label: "Stekt",
              long_label: "Stekt eriya",
            },
            comparison: {
              short_label: "Komperisın",
              long_label: "Komperisın eriya",
            },
          },
          fill_color: "Fil rengi",
        },
        donut_chart: {
          short_label: "Donıt",
          long_label: "Donıt çart",
          chart_models: {
            basic: {
              short_label: "Beysik",
              long_label: "Beysik donıt",
            },
            progress: {
              short_label: "Progrıs",
              long_label: "Progrıs donıt",
            },
          },
          center_value: "Sentır değeri",
          completed_color: "Tamamlanmış rengi",
        },
        pie_chart: {
          short_label: "Pay",
          long_label: "Pay çart",
          chart_models: {
            basic: {
              short_label: "Beysik",
              long_label: "Pay",
            },
          },
          group: {
            label: "Grupd parçalar",
            group_thin_pieces: "İnce parçaları grupla",
            minimum_threshold: {
              label: "Minimum treşhold",
              placeholder: "Treşhold ekle",
            },
            name_group: {
              label: "Grup ismi",
              placeholder: '"5%\'den az"',
            },
          },
          show_values: "Değerleri göster",
          value_type: {
            percentage: "Yüzde",
            count: "Sayı",
          },
        },
        number: {
          short_label: "Nambır",
          long_label: "Nambır",
          chart_models: {
            basic: {
              short_label: "Beysik",
              long_label: "Nambır",
            },
          },
          alignment: {
            label: "Tekst hizalama",
            left: "Sol",
            center: "Sentır",
            right: "Sağ",
            placeholder: "Tekst hizalama ekle",
          },
          text_color: "Tekst rengi",
        },
        table_chart: {
          short_label: "Tablo",
          long_label: "Tablo grafiği",
          chart_models: {
            basic: {
              short_label: "Temel",
              long_label: "Tablo",
            },
          },
          columns: "Sütunlar",
          rows: "Satırlar",
          rows_placeholder: "Satır ekle",
          configure_rows_hint: "Bu tabloyu görüntülemek için satırlar için bir özellik seçin.",
        },
      },
      sections: {
        charts: "Çarts",
        text: "Tekst",
      },
      color_palettes: {
        modern: "Modern",
        horizon: "Horayzın",
        earthen: "Örtın",
      },
      common: {
        add_widget: "Vicıt ekle",
        widget_title: {
          label: "Bu vicıtı adlandır",
          placeholder: 'örn., "Dünkü yapılacaklar", "Hepsi Tamamlandı"',
        },
        widget_type: "Vicıt tipi",
        date_group: {
          label: "Deyt grup",
          placeholder: "Deyt grup ekle",
        },
        group_by: "Grup bay",
        stack_by: "Stek bay",
        daily: "Deyli",
        weekly: "Vikli",
        monthly: "Mantli",
        yearly: "Yirli",
        work_item_count: "Work aytım sayısı",
        estimate_point: "Estimeyt poynt",
        pending_work_item: "Bekleyen work aytımlar",
        completed_work_item: "Tamamlanmış work aytımlar",
        in_progress_work_item: "Devam eden work aytımlar",
        blocked_work_item: "Bloklanmış work aytımlar",
        work_item_due_this_week: "Bu hafta dolan work aytımlar",
        work_item_due_today: "Bugün dolan work aytımlar",
        color_scheme: {
          label: "Renkler şeması",
          placeholder: "Renk şeması ekle",
        },
        smoothing: "Smuting",
        markers: "Markırlar",
        legends: "Lecınds",
        tooltips: "Tultips",
        opacity: {
          label: "Opasiti",
          placeholder: "Opasiti ekle",
        },
        border: "Bordır",
        widget_configuration: "Vicıt konfigürasyonu",
        configure_widget: "Vicıtı konfigüre et",
        guides: "Gaydlar",
        style: "Stayl",
        area_appearance: "Eriya görünümü",
        comparison_line_appearance: "Komperisın-layn görünümü",
        add_property: "Properti ekle",
        add_metric: "Metrik ekle",
      },
      not_configured_state: {
        bar_chart: {
          basic: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
          },
          stacked: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
            group_by: "Stek bay için değer eksik.",
          },
          grouped: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
            group_by: "Grup bay için değer eksik.",
          },
        },
        line_chart: {
          basic: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
          },
          multi_line: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
            group_by: "Grup bay için değer eksik.",
          },
        },
        area_chart: {
          basic: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
          },
          stacked: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
            group_by: "Stek bay için değer eksik.",
          },
          comparison: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
          },
        },
        donut_chart: {
          basic: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
          },
          progress: {
            y_axis_metric: "Metrik için değer eksik.",
          },
        },
        pie_chart: {
          basic: {
            x_axis_property: "X-ekseni için değer eksik.",
            y_axis_metric: "Metrik için değer eksik.",
          },
        },
        number: {
          basic: {
            y_axis_metric: "Metrik için değer eksik.",
          },
        },
        table_chart: {
          basic: {
            x_axis_property: "Sütunlar için değer eksik.",
            group_by: "Satırlar için değer eksik.",
          },
        },
        ask_admin: "Bu vicıtı konfigüre etmesi için admininize sorun.",
      },
      upgrade_required: {
        title: "Bu vicıt tipi planınıza dahil değil.",
      },
    },
    create_modal: {
      heading: {
        create: "Yeni deşbord oluştur",
        update: "Deşbordu güncelle",
      },
      title: {
        label: "Deşbordunuzu adlandırın.",
        placeholder: '"Projeler arası kapasite", "Takıma göre iş yükü", "Tüm projelerdeki durum"',
        required_error: "Başlık gerekli",
      },
      project: {
        label: "Projeleri seç",
        placeholder: "Bu projelerden gelen veriler bu deşbordu besleyecek.",
        required_error: "Projeler gerekli",
      },
      filters_label: "Yukarıdaki veri kaynakları için filtreler ayarlayın",
      create_dashboard: "Deşbord oluştur",
      update_dashboard: "Deşbordu güncelle",
    },
    delete_modal: {
      heading: "Deşbordu sil",
    },
    empty_state: {
      feature_flag: {
        title: "İlerlemeni talep üzerine, kalıcı deşbordlarda sun.",
        description:
          "İhtiyacın olan herhangi bir deşbordu oluştur ve verilerinin görünümünü mükemmel sunum için özelleştir.",
        coming_soon_to_mobile: "Yakında mobil uygulamada",
        card_1: {
          title: "Tüm projelerin için",
          description:
            "Tüm projelerinle workspeysin tanrı-bakışı görünümünü al veya ilerleme görünümün için work verilerini dilimle.",
        },
        card_2: {
          title: "Pleyn'deki herhangi bir veri için",
          description:
            "Hazır Analitiks ve hazır Saykıl çartlarının ötesine geç ve timleri, inisiyatifleri veya başka şeyleri daha önce görmediğin gibi gör.",
        },
        card_3: {
          title: "Tüm deyta viz ihtiyaçların için",
          description:
            "Work verilerini tam istediğin gibi görmek ve göstermek için ince ayarlı kontrollerle birkaç özelleştirilebilir çart arasından seç.",
        },
        card_4: {
          title: "Talep üzerine ve kalıcı",
          description:
            "Verilerinin otomatik yenilenmesi, skop değişiklikleri için kontekstual flagler ve paylaşılabilir permalinklerle bir kere oluştur, sonsuza kadar sakla.",
        },
        card_5: {
          title: "Eksportlar ve şedyuld komslar",
          description:
            "Linklerin çalışmadığı zamanlar için, deşbordlarını tek seferlik PDF'lere çıkar veya steykholderslara otomatik olarak gönderilmek üzere şedyul et.",
        },
        card_6: {
          title: "Tüm devayslar için oto-leyavt",
          description:
            "İstediğin leyavt için vicıtlarını yeniden boyutlandır ve mobil, tablet ve diğer bravzırlarda aynı şekilde gör.",
        },
      },
      dashboards_list: {
        title:
          "Verileri vicıtlarda vizualize et, deşbordlarını vicıtlarla oluştur ve en güncel halini talep üzerine gör.",
        description:
          "Deşbordlarını, verilerini belirttiğin skopta gösteren Kastım Vicıtlarla oluştur. Projeler ve timler arasındaki tüm işin için deşbordlar al ve talep üzerine takip için steykholderlarla permalinkler paylaş.",
      },
      dashboards_search: {
        title: "Bu bir deşbordun ismiyle eşleşmiyor.",
        description: "Kverinin doğru olduğundan emin ol veya başka bir kveri dene.",
      },
      widgets_list: {
        title: "Verilerini istediğin gibi vizualize et.",
        description:
          "Verilerini belirttiğin kaynaklardan istediğin şekilde görmek için laynlar, barlar, paylar ve diğer formatları kullan.",
      },
      widget_data: {
        title: "Burada görülecek bir şey yok",
        description: "Burada görmek için yenile veya veri ekle.",
      },
    },
    common: {
      editing: "Editliniyor",
    },
  },
  workflows: {
    workflow_states: {
      work_item_creation: "Yeni iş öğelerine izin ver",
      work_item_creation_disable_tooltip: "Bu durum için iş öğesi oluşturma devre dışı",
      default_state: "Varsayılan durum tüm üyelerin yeni iş öğeleri oluşturmasına izin verir. Bu değiştirilemez",
      state_change_count:
        "{count, plural, one {1 izin verilen durum değişikliği} other {{count} izin verilen durum değişikliği}}",
      movers_count: "{count, plural, one {1 listelenmiş inceleyici} other {{count} listelenmiş inceleyici}}",
      state_changes: {
        label: {
          default: "İzin verilen durum değişikliği ekle",
          loading: "İzin verilen durum değişikliği ekleniyor",
        },
        move_to: "Durumu şuna değiştir",
        movers: {
          label: "İncelendiğinde",
          tooltip: "İnceleyiciler, iş öğelerini bir durumdan diğerine taşıma izni olan kişilerdir.",
          add: "İnceleyici ekle",
        },
      },
    },
    workflow_disabled: {
      title: "Bu iş öğesini buraya taşıyamazsınız.",
    },
    workflow_enabled: {
      label: "Durum değişikliği",
    },
    workflow_tree: {
      label: "Şuradaki iş öğeleri için",
      state_change_label: "şuraya taşıyabilir",
    },
    empty_state: {
      upgrade: {
        title: "Değişikliklerin ve incelemelerin kargaşasını İş Akışları ile kontrol edin.",
        description:
          "Plane'deki İş Akışları ile işinizin nereye, kim tarafından ve ne zaman taşınacağına dair kurallar belirleyin.",
      },
    },
    quick_actions: {
      view_change_history: "Değişiklik geçmişini görüntüle",
      reset_workflow: "İş akışını sıfırla",
    },
    confirmation_modals: {
      reset_workflow: {
        title: "Bu iş akışını sıfırlamak istediğinizden emin misiniz?",
        description:
          "Bu iş akışını sıfırlarsanız, tüm durum değişikliği kurallarınız silinecek ve bunları bu projede çalıştırmak için yeniden oluşturmanız gerekecektir.",
      },
      delete_state_change: {
        title: "Bu durum değişikliği kuralını silmek istediğinizden emin misiniz?",
        description:
          "Silindikten sonra, bu değişikliği geri alamazsınız ve bu kuralı bu proje için çalıştırmak istiyorsanız tekrar ayarlamanız gerekecektir.",
      },
    },
    toasts: {
      enable_disable: {
        loading: "İş akışı {action}",
        success: {
          title: "Başarılı",
          message: "İş akışı başarıyla {action}",
        },
        error: {
          title: "Hata",
          message: "İş akışı {action} olamadı. Lütfen tekrar deneyin.",
        },
      },
      reset: {
        success: {
          title: "Başarılı",
          message: "İş akışı başarıyla sıfırlandı",
        },
        error: {
          title: "İş akışı sıfırlama hatası",
          message: "İş akışı sıfırlanamadı. Lütfen tekrar deneyin.",
        },
      },
      add_state_change_rule: {
        error: {
          title: "Durum değişikliği kuralı ekleme hatası",
          message: "Durum değişikliği kuralı eklenemedi. Lütfen tekrar deneyin.",
        },
      },
      modify_state_change_rule: {
        error: {
          title: "Durum değişikliği kuralı değiştirme hatası",
          message: "Durum değişikliği kuralı değiştirilemedi. Lütfen tekrar deneyin.",
        },
      },
      remove_state_change_rule: {
        error: {
          title: "Durum değişikliği kuralı kaldırma hatası",
          message: "Durum değişikliği kuralı kaldırılamadı. Lütfen tekrar deneyin.",
        },
      },
      modify_state_change_rule_movers: {
        error: {
          title: "Durum değişikliği kuralı inceleyicileri değiştirme hatası",
          message: "Durum değişikliği kuralı inceleyicileri değiştirilemedi. Lütfen tekrar deneyin.",
        },
      },
    },
  },
  customers: {
    label: "{count, plural, one {Müşteri} other {Müşteriler}}",
    open: "Müşteriyi aç",
    dropdown: {
      placeholder: "Müşteri seç",
      required: "Lütfen bir müşteri seçin",
      no_selection: "Müşteri yok",
    },
    upgrade: {
      title: "Müşterilerle işleri önceliklendir ve yönet.",
      description: "İşlerinizi müşterilere göre eşleştirin ve müşteri özelliklerine göre önceliklendirin.",
    },
    properties: {
      default: {
        title: "Varsayılan özellikler",
        customer_name: {
          name: "Müşteri adı",
          placeholder: "Bu kişi veya işletmenin adı olabilir",
          validation: {
            required: "Müşteri adı gereklidir.",
            max_length: "Müşteri adı 255 karakterden fazla olamaz.",
          },
        },
        description: {
          name: "Açıklama",
          validation: {},
        },
        email: {
          name: "Email",
          placeholder: "Email girin",
          validation: {
            required: "Email gereklidir.",
            pattern: "Geçersiz email adresi.",
          },
        },
        website_url: {
          name: "Website",
          placeholder: "https:// ile başlayan herhangi bir URL çalışacaktır.",
          placeholder_short: "Website ekle",
          validation: {
            pattern: "Geçersiz website URL'si",
          },
        },
        employees: {
          name: "Çalışanlar",
          placeholder: "Müşteriniz bir işletme ise çalışan sayısı.",
          validation: {
            min_length: "Çalışanlar 0'dan az olamaz.",
            max_length: "Çalışan sayısı 2147483647'yi aşamaz",
          },
        },
        size: {
          name: "Büyüklük",
          placeholder: "Şirket büyüklüğü ekle",
          validation: {
            min_length: "Geçersiz büyüklük",
          },
        },
        domain: {
          name: "Sektör",
          placeholder: "Perakende, e-Ticaret, Fintek, Bankacılık",
          placeholder_short: "Sektör ekle",
          validation: {},
        },
        stage: {
          name: "Aşama",
          placeholder: "Aşama seç",
          validation: {},
        },
        contract_status: {
          name: "Kontrat Durumu",
          placeholder: "Kontrat durumu seç",
          validation: {},
        },
        revenue: {
          name: "Gelir",
          placeholder: "Bu, müşterinizin yıllık olarak ürettiği gelirdir.",
          placeholder_short: "Gelir ekle",
          validation: {
            min_length: "Gelir 0'dan az olamaz.",
          },
        },
        requests: {
          name: "Talep sayısı",
        },
        invalid_value: "Geçersiz özellik değeri.",
      },
      custom: {
        title: "Özel özellikler",
        info: "İş öğelerini veya müşteri kayıtlarını daha iyi yönetebilmeniz için müşterilerinizin benzersiz özelliklerini Plane'e ekleyin.",
      },
      empty_state: {
        title: "Henüz özel özelliğiniz yok.",
        description:
          "İş öğelerinde, Plane'in başka yerlerinde veya CRM gibi Plane dışındaki bir araçta görmek istediğiniz özel özellikler, eklediğinizde burada görünecektir.",
      },
      add: {
        primary_button: "Yeni özellik ekle",
      },
    },
    stage: {
      lead: "Lead",
      sales_qualified_lead: "Satış onaylı lead",
      contract_negotiation: "Kontrat görüşmesi",
      closed_won: "Kazanıldı",
      closed_lost: "Kaybedildi",
    },
    contract_status: {
      active: "Aktif",
      pre_contract: "Kontrat öncesi",
      signed: "İmzalandı",
      inactive: "İnaktif",
    },
    empty_state: {
      detail: {
        title: "Bu müşteri kaydını bulamadık.",
        description: "Bu kayda giden bağlantı yanlış olabilir veya bu kayıt silinmiş olabilir.",
        primary_button: "Müşterilere git",
        secondary_button: "Müşteri ekle",
      },
      search: {
        title: "Bu terimle eşleşen müşteri kayıtlarınız yok gibi görünüyor.",
        description:
          "Başka bir arama terimiyle deneyin veya o terim için sonuç görmeniz gerektiğinden eminseniz bizimle iletişime geçin.",
      },
      list: {
        title: "İşinizin hacmini, ritmini ve akışını müşterileriniz için önemli olana göre yönetin.",
        description:
          "Plane'e özel bir özellik olan Müşteriler ile artık sıfırdan yeni müşteriler oluşturabilir ve bunları işinizle bağlantılandırabilirsiniz. Yakında, onları sizin için önemli olan özel özellikleriyle birlikte diğer araçlardan da getirebileceksiniz.",
        primary_button: "İlk müşterinizi ekleyin",
      },
    },
    settings: {
      unauthorized: "Bu sayfaya erişme yetkiniz yok.",
      description: "İş akışınızda müşteri ilişkilerini takip edin ve yönetin.",
      enable: "Müşterileri Etkinleştir",
      toasts: {
        enable: {
          loading: "Müşteriler özelliği etkinleştiriliyor...",
          success: {
            title: "Bu workspace için Müşterileri etkinleştirdiniz.",
            message:
              "Üyeler artık müşteri kayıtları ekleyebilir, bunları iş öğelerine bağlayabilir ve daha fazlasını yapabilir.",
          },
          error: {
            title: "Bu sefer Müşterileri etkinleştiremedik.",
            message: "Tekrar deneyin veya daha sonra bu ekrana geri dönün. Hala çalışmazsa.",
            action: "Destek ile görüşün",
          },
        },
        disable: {
          loading: "Müşteriler özelliği devre dışı bırakılıyor...",
          success: {
            title: "Müşteriler devre dışı",
            message: "Müşteriler özelliği başarıyla devre dışı bırakıldı!",
          },
          error: {
            title: "Hata",
            message: "Müşteriler özelliği devre dışı bırakılamadı!",
          },
        },
      },
    },
    toasts: {
      list: {
        error: {
          title: "Müşteri listenizi alamadık.",
          message: "Tekrar deneyin veya bu sayfayı yenileyin.",
        },
      },
      copy_link: {
        title: "Bu müşteriye doğrudan bağlantıyı kopyaladınız.",
        message: "Herhangi bir yere yapıştırın ve doğrudan buraya yönlendirecektir.",
      },
      create: {
        success: {
          title: "{customer_name} artık kullanılabilir",
          message:
            "Bu müşteriyi iş öğelerinde referans gösterebilir ve onlardan gelen talepleri de takip edebilirsiniz.",
          actions: {
            view: "Görüntüle",
            copy_link: "Bağlantıyı kopyala",
            copied: "Kopyalandı!",
          },
        },
        error: {
          title: "Bu sefer o kaydı oluşturamadık.",
          message:
            "Tekrar kaydetmeyi deneyin veya kaydedilmemiş metninizi tercihen başka bir sekmede yeni bir girişe kopyalayın.",
        },
      },
      update: {
        success: {
          title: "Başarılı!",
          message: "Müşteri başarıyla güncellendi!",
        },
        error: {
          title: "Hata!",
          message: "Müşteri güncellenemedi. Tekrar deneyin!",
        },
      },
      logo: {
        error: {
          title: "Müşterinin logosunu yükleyemedik.",
          message: "Logoyu tekrar kaydetmeyi deneyin veya sıfırdan başlayın.",
        },
      },
      work_item: {
        remove: {
          success: {
            title: "Bu müşterinin kaydından bir iş öğesini kaldırdınız.",
            message: "Bu müşteriyi iş öğesinden de otomatik olarak kaldırdık.",
          },
          error: {
            title: "Hata!",
            message: "Bu sefer o iş öğesini bu müşterinin kaydından kaldıramadık.",
          },
        },
        add: {
          error: {
            title: "Bu sefer o iş öğesini bu müşterinin kaydına ekleyemedik.",
            message: "O iş öğesini tekrar eklemeyi deneyin veya daha sonra geri dönün. Hala çalışmazsa, bize ulaşın.",
          },
          success: {
            title: "Bu müşterinin kaydına bir iş öğesi eklediniz.",
            message: "Bu müşteriyi iş öğesine de otomatik olarak ekledik.",
          },
        },
      },
    },
    quick_actions: {
      edit: "Düzenle",
      copy_link: "Müşteri bağlantısını kopyala",
      delete: "Sil",
    },
    create: {
      label: "Müşteri kaydı oluştur",
      loading: "Oluşturuluyor",
      cancel: "İptal",
    },
    update: {
      label: "Müşteriyi güncelle",
      loading: "Güncelleniyor",
    },
    delete: {
      title: "{customer_name} müşteri kaydını silmek istediğinizden emin misiniz?",
      description: "Bu kayıtla ilişkili tüm veriler kalıcı olarak silinecek. Bu kaydı daha sonra geri yükleyemezsiniz.",
    },
    requests: {
      empty_state: {
        list: {
          title: "Henüz gösterilecek talep yok.",
          description: "Müşterilerinizden iş öğelerine bağlayabileceğiniz talepler oluşturun.",
          button: "Yeni talep ekle",
        },
        search: {
          title: "Bu terimle eşleşen talepleriniz yok gibi görünüyor.",
          description:
            "Başka bir arama terimiyle deneyin veya o terim için sonuç görmeniz gerektiğinden eminseniz bizimle iletişime geçin.",
        },
      },
      label: "{count, plural, one {Talep} other {Talepler}}",
      add: "Talep ekle",
      create: "Talep oluştur",
      update: "Talebi güncelle",
      form: {
        name: {
          placeholder: "Bu talebi adlandırın",
          validation: {
            required: "İsim gereklidir.",
            max_length: "Talep adı 255 karakteri geçmemelidir.",
          },
        },
        description: {
          placeholder: "Talebin niteliğini açıklayın veya bu müşterinin başka bir araçtaki yorumunu yapıştırın.",
        },
        source: {
          add: "Kaynak ekle",
          update: "Kaynağı güncelle",
          url: {
            label: "URL",
            required: "URL gereklidir",
            invalid: "Geçersiz website URL'si",
          },
        },
      },
      toasts: {
        copy_link: {
          title: "Bağlantı kopyalandı",
          message: "Müşteri talebi bağlantısı panoya kopyalandı.",
        },
        attachment: {
          upload: {
            loading: "Ek yükleniyor...",
            success: {
              title: "Ek yüklendi",
              message: "Ek başarıyla yüklendi.",
            },
            error: {
              title: "Ek yüklenemedi",
              message: "Ek yüklenemedi.",
            },
          },
          size: {
            error: {
              title: "Hata!",
              message: "Bir seferde yalnızca bir dosya yüklenebilir.",
            },
          },
          length: {
            message: "Dosya {size}MB veya daha küçük boyutta olmalıdır",
          },
          remove: {
            success: {
              title: "Ek kaldırıldı",
              message: "Ek başarıyla kaldırıldı",
            },
            error: {
              title: "Ek kaldırılamadı",
              message: "Ek kaldırılamadı",
            },
          },
        },
        source: {
          update: {
            success: {
              title: "Başarılı!",
              message: "Kaynak başarıyla güncellendi!",
            },
            error: {
              title: "Hata!",
              message: "Kaynak güncellenemedi.",
            },
          },
        },
        work_item: {
          add: {
            error: {
              title: "Hata!",
              message: "Talebe iş öğeleri eklenemedi. Tekrar deneyin.",
            },
            success: {
              title: "Başarılı!",
              message: "Talebe iş öğeleri eklendi.",
            },
          },
        },
        update: {
          success: {
            message: "Talep başarıyla güncellendi!",
            title: "Başarılı!",
          },
          error: {
            title: "Hata!",
            message: "Talep güncellenemedi. Tekrar deneyin!",
          },
        },
        create: {
          success: {
            message: "Talep başarıyla oluşturuldu!",
            title: "Başarılı!",
          },
          error: {
            title: "Hata!",
            message: "Talep oluşturulamadı. Tekrar deneyin!",
          },
        },
      },
    },
    linked_work_items: {
      label: "Bağlantılı iş öğeleri",
      link: "İş öğelerini bağla",
      empty_state: {
        list: {
          title: "Bu müşteriye henüz bağlı iş öğeniz yok gibi görünüyor.",
          description:
            "Herhangi bir projeden mevcut iş öğelerini buraya bağlayın, böylece onları bu müşteriye göre takip edebilirsiniz.",
          button: "İş öğesi bağla",
        },
      },
      action: {
        remove_epic: "Epik'i kaldır",
        remove: "İş öğesini kaldır",
      },
    },
    sidebar: {
      properties: "Özellikler",
    },
  },
  templates: {
    settings: {
      title: "Şablonlar",
      description:
        "Şablonları kullandığınızda projeler, iş öğeleri ve sayfalar oluşturmak için harcanan zamanın %80'ini tasarruf edin.",
      options: {
        project: {
          label: "Proje şablonları",
        },
        work_item: {
          label: "İş öğesi şablonları",
        },
        page: {
          label: "Sayfa şablonları",
        },
      },
      create_template: {
        label: "Şablon oluştur",
        no_permission: {
          project: "Şablon oluşturmak için proje admininizle iletişime geçin",
          workspace: "Şablon oluşturmak için workspace admininizle iletişime geçin",
        },
      },
      use_template: {
        button: "Şablonu kullan",
      },
      template_source: {
        workspace: {
          info: "Workspace'den türetildi",
        },
        project: {
          info: "Projeden türetildi",
        },
      },
      form: {
        project: {
          template: {
            name: {
              placeholder: "Proje şablonunuzu adlandırın.",
              validation: {
                required: "Şablon adı gereklidir",
                maxLength: "Şablon adı 255 karakterden az olmalıdır",
              },
            },
            description: {
              placeholder: "Bu şablonun ne zaman ve nasıl kullanılacağını açıklayın.",
            },
          },
          name: {
            placeholder: "Projenizi adlandırın.",
            validation: {
              required: "Proje başlığı gereklidir",
              maxLength: "Proje başlığı 255 karakterden az olmalıdır",
            },
          },
          description: {
            placeholder: "Bu projenin amacını ve hedeflerini açıklayın.",
          },
          button: {
            create: "Proje şablonu oluştur",
            update: "Proje şablonunu güncelle",
          },
        },
        work_item: {
          template: {
            name: {
              placeholder: "İş-öğesi şablonunuzu adlandırın.",
              validation: {
                required: "Şablon adı gereklidir",
                maxLength: "Şablon adı 255 karakterden az olmalıdır",
              },
            },
            description: {
              placeholder: "Bu şablonun ne zaman ve nasıl kullanılacağını açıklayın.",
            },
          },
          name: {
            placeholder: "Bu iş öğesine bir başlık verin.",
            validation: {
              required: "İş öğesi başlığı gereklidir",
              maxLength: "İş öğesi başlığı 255 karakterden az olmalıdır",
            },
          },
          description: {
            placeholder: "Bu iş öğesini, tamamladığınızda ne başaracağınız açık olacak şekilde açıklayın.",
          },
          button: {
            create: "İş-öğesi şablonu oluştur",
            update: "İş-öğesi şablonunu güncelle",
          },
        },
        page: {
          template: {
            name: {
              placeholder: "Sayfa şablonunuzu adlandırın.",
              validation: {
                required: "Şablon adı gereklidir",
                maxLength: "Şablon adı 255 karakterden az olmalıdır",
              },
            },
            description: {
              placeholder: "Bu şablonun ne zaman ve nasıl kullanılacağını açıklayın.",
            },
          },
          name: {
            placeholder: "Başlıksız sayfa",
            validation: {
              maxLength: "Sayfa adı 255 karakterden az olmalıdır",
            },
          },
          button: {
            create: "Sayfa şablonu oluştur",
            update: "Sayfa şablonunu güncelle",
          },
        },
        publish: {
          action: "{isPublished, select, true {Yayın ayarları} other {Marketplace'de yayınla}}",
          unpublish_action: "Marketplace'den kaldır",
          title: "Şablonunuzu keşfedilebilir ve tanınabilir yapın.",
          name: {
            label: "Şablon adı",
            placeholder: "Şablonunuzu adlandırın",
            validation: {
              required: "Şablon adı gereklidir",
              maxLength: "Şablon adı 255 karakterden az olmalıdır",
            },
          },
          short_description: {
            label: "Kısa açıklama",
            placeholder: "Bu şablon, aynı anda birden fazla projeyi yöneten Proje Yöneticileri için mükemmeldir.",
            validation: {
              required: "Kısa açıklama gereklidir",
            },
          },
          description: {
            label: "Açıklama",
            placeholder: `Konuşma-Metin entegrasyonumuzla üretkenliği artırın ve iletişimi kolaylaştırın.
• Gerçek zamanlı dönüştürme: Söylenen kelimeleri anında doğru metne dönüştürün.
• Görev ve yorum oluşturma: Sesli komutlarla görevler, açıklamalar ve yorumlar ekleyin.`,
            validation: {
              required: "Açıklama gereklidir",
            },
          },
          category: {
            label: "Kategori",
            placeholder: "En uygun olduğunu düşündüğünüz yeri seçin. Birden fazla seçim yapabilirsiniz.",
            validation: {
              required: "En az bir kategori gereklidir",
            },
          },
          keywords: {
            label: "Anahtar kelimeler",
            placeholder: "Kullanıcılarınızın bu şablonu ararken arayacağını düşündüğünüz terimleri kullanın.",
            helperText:
              "Virgül ile ayrılmış anahtar kelimeleri girin, bu, insanların bu şablonu aramadan bulmasına yardımcı olacaktır.",
            validation: {
              required: "En az bir anahtar kelime gereklidir",
            },
          },
          company_name: {
            label: "Şirket adı",
            placeholder: "Plane",
            validation: {
              required: "Şirket adı gereklidir",
              maxLength: "Şirket adı 255 karakterden az olmalıdır",
            },
          },
          contact_email: {
            label: "Destek e-postası",
            placeholder: "help@plane.so",
            validation: {
              invalid: "Geçersiz e-posta adresi",
              required: "Destek e-postası gereklidir",
              maxLength: "Destek e-postası 255 karakterden az olmalıdır",
            },
          },
          privacy_policy_url: {
            label: "Gizlilik politikası bağlantısı",
            placeholder: "https://planes.so/privacy-policy",
            validation: {
              invalid: "Geçersiz URL",
              maxLength: "URL 800 karakterden az olmalıdır",
            },
          },
          terms_of_service_url: {
            label: "Kullanım koşulları bağlantısı",
            placeholder: "https://planes.so/terms-of-use",
            validation: {
              invalid: "Geçersiz URL",
              maxLength: "URL 800 karakterden az olmalıdır",
            },
          },
          cover_image: {
            label: "Pazaryerinde görüntülenecek bir kapak resmi ekleyin",
            upload_title: "Kapak resmi yükle",
            upload_placeholder: "Kapak resmi yüklemek için tıklayın veya sürükleyip bırakın",
            drop_here: "Buraya bırakın",
            click_to_upload: "Yüklemek için tıklayın",
            invalid_file_or_exceeds_size_limit: "Geçersiz dosya veya boyut sınırını aşıyor. Lütfen tekrar deneyin.",
            upload_and_save: "Yükle ve kaydet",
            uploading: "Yükleniyor",
            remove: "Kaldır",
            removing: "Kaldırılıyor",
            validation: {
              required: "Kapak resmi gereklidir",
            },
          },
          attach_screenshots: {
            label: "Bu şablonun görüntüleyicilerini etkileyeceğini düşündüğünüz belgeleri ve resimleri ekleyin.",
            validation: {
              required: "En az bir ekran görüntüsü gereklidir",
            },
          },
        },
      },
    },
    empty_state: {
      upgrade: {
        title: "Şablonlar",
        description:
          "Plane'deki proje, iş-öğesi ve sayfa şablonlarıyla, bir projeyi sıfırdan oluşturmanız veya iş öğesi özelliklerini manuel olarak ayarlamanız gerekmez.",
        sub_description: "Şablonları kullandığınızda admin zamanınızın %80'ini geri kazanın.",
      },
      no_templates: {
        button: "İlk şablonunuzu oluşturun",
      },
      no_labels: {
        description: "Henüz etiket yok. Projenizde iş öğelerini düzenlemek ve filtrelemek için etiketler oluşturun.",
      },
      no_work_items: {
        description: "Henüz iş öğesi yok. Bir tane ekleyin, işinizi daha iyi yapılandırın.",
      },
      no_sub_work_items: {
        description: "Henüz alt iş öğesi yok. Bir tane ekleyin, işinizi daha iyi yapılandırın.",
      },
      page: {
        no_templates: {
          title: "Erişiminiz olan şablon yok.",
          description: "Lütfen bir şablon oluşturun",
        },
        no_results: {
          title: "Bu bir şablonla eşleşmedi.",
          description: "Başka terimlerle arama yapmayı deneyin.",
        },
      },
    },
    toasts: {
      create: {
        success: {
          title: "Şablon oluşturuldu",
          message: "{templateType} şablonu olan {templateName}, artık workspace'iniz için kullanılabilir.",
        },
        error: {
          title: "Bu sefer o şablonu oluşturamadık.",
          message:
            "Detaylarınızı tekrar kaydetmeyi deneyin veya tercihen başka bir sekmede yeni bir şablona kopyalayın.",
        },
      },
      update: {
        success: {
          title: "Şablon değiştirildi",
          message: "{templateType} şablonu olan {templateName} değiştirildi.",
        },
        error: {
          title: "Bu şablondaki değişiklikleri kaydedemedik.",
          message:
            "Detaylarınızı tekrar kaydetmeyi deneyin veya daha sonra bu şablona geri dönün. Hala sorun yaşıyorsanız, bizimle iletişime geçin.",
        },
      },
      delete: {
        success: {
          title: "Şablon silindi",
          message: "{templateType} şablonu olan {templateName} artık workspace'inizden silindi.",
        },
        error: {
          title: "O şablonu bu sefer silemedik.",
          message: "Tekrar silmeyi deneyin veya daha sonra tekrar gelin. O zaman silemezseniz bizimle iletişime geçin.",
        },
      },
      unpublish: {
        success: {
          title: "Şablon yayından kaldırıldı",
          message: "{templateType} şablonu olan {templateName} marketplace'den kaldırıldı.",
        },
        error: {
          title: "Şablonu yayından kaldıramadık.",
          message:
            "Tekrar yayından kaldırmayı deneyin veya daha sonra tekrar gelin. O zaman kaldıramazsanız bizimle iletişime geçin.",
        },
      },
    },
    delete_confirmation: {
      title: "Şablonu sil",
      description: {
        prefix: "Şablonu silmek istediğinizden emin misiniz-",
        suffix: "? Şablonla ilgili tüm veriler kalıcı olarak kaldırılacak. Bu işlem geri alınamaz.",
      },
    },
    unpublish_confirmation: {
      title: "Şablonu yayından kaldır",
      description: {
        prefix: "Şablonu yayından kaldırmak istediğinizden emin misiniz-",
        suffix: "? Şablon marketplace'den kaldırılacak ve diğerleri için artık mevcut olmayacak.",
      },
    },
    dropdown: {
      add: {
        work_item: "Yeni şablon ekle",
        project: "Yeni şablon ekle",
      },
      label: {
        project: "Bir proje şablonu seçin",
        page: "Şablon seç",
      },
      tooltip: {
        work_item: "Bir iş öğesi şablonu seçin",
      },
      no_results: {
        work_item: "Şablon bulunamadı.",
        project: "Şablon bulunamadı.",
      },
    },
  },
  intake_forms: {
    create: {
      title: "Bir iş öğesi oluştur",
      "sub-title": "Ekibe ne üzerinde çalışmalarını istediğinizi bildirin.",
      name: "Ad",
      email: "E-posta",
      about: "Bu iş öğesi ne hakkında?",
      description: "Ne olması gerektiğini açıklayın",
      description_placeholder: "Ekip durumunuzu ve ihtiyaçlarınızı anlasın diye istediğiniz kadar ayrıntı ekleyin.",
      loading: "Oluşturuluyor",
      create_work_item: "İş öğesi oluştur",
      errors: {
        name: "Ad zorunludur",
        name_max_length: "Ad 255 karakterden az olmalıdır",
        email: "E-posta zorunludur",
        email_invalid: "Geçersiz e-posta adresi",
        title: "Başlık zorunludur",
        title_max_length: "Başlık 255 karakterden az olmalıdır",
      },
    },
    success: {
      title: "İş öğeniz artık ekibin kuyruğunda.",
      description: "Ekip bu iş öğesini alım kuyruğundan onaylayabilir veya atabilir.",
      primary_button: {
        text: "Başka bir iş öğesi ekle",
      },
      secondary_button: {
        text: "Alım hakkında daha fazla bilgi",
      },
    },
    how_it_works: {
      title: "Nasıl çalışır?",
      heading: "Bu bir alım formudur.",
      description:
        "Alım, proje yöneticilerinin ve yöneticilerinin dışarıdan iş öğelerini projelerine almasını sağlayan bir Plane özelliğidir.",
      steps: {
        step_1: "Bu kısa form, bir Plane projesinde yeni bir iş öğesi oluşturmanızı sağlar.",
        step_2: "Bu formu gönderdiğinizde, o projenin alımında yeni bir iş öğesi oluşturulur.",
        step_3: "O proje veya ekipten biri inceleyecektir.",
        step_4: "Onaylarlarsa bu iş öğesi projenin iş kuyruğuna taşınır. Aksi takdirde reddedilir.",
        step_5:
          "Bu iş öğesinin durumunu öğrenmek için proje yöneticisi, yönetici veya size bu sayfanın bağlantısını gönderen kişiyle iletişime geçin.",
      },
    },
    type_forms: {
      select_types: {
        title: "İş öğesi türü seç",
        search_placeholder: "İş öğesi türü ara",
      },
      actions: {
        select_properties: "Özellikleri seç",
      },
    },
  },
  recurring_work_items: {
    settings: {
      heading: "Yinelenen iş öğeleri",
      description:
        "Yinelenen iş öğelerini bir kere ayarlayın, ve biz onları yöneteceğiz. Zamanı geldiğinde burada göreceksin.",
      new_recurring_work_item: "Yeni yinelenen iş öğesi",
      update_recurring_work_item: "Yinelenen iş öğesini güncelle",
      form: {
        interval: {
          title: "Zamanlama",
          start_date: {
            validation: {
              required: "Başlangıç tarihi gereklidir",
            },
          },
          interval_type: {
            validation: {
              required: "Aralık türü gereklidir",
            },
          },
        },
        button: {
          create: "Yinelenen iş öğesi oluştur",
          update: "Yinelenen iş öğesini güncelle",
        },
      },
      create_button: {
        label: "Yinelenen iş öğesi oluştur",
        no_permission: "Yinelenen iş öğeleri oluşturmak için proje yöneticinizle iletişime geçin",
      },
    },
    empty_state: {
      upgrade: {
        title: "İşiniz, otomatik pilotta",
        description:
          "Bir kez ayarlayın. Zamanı geldiğinde geri getireceğiz. Yinelenen işleri zahmetsiz hale getirmek için Business'a yükseltin.",
      },
      no_templates: {
        button: "İlk yinelenen iş öğenizi oluşturun",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Yinelenen iş öğesi oluşturuldu",
          message: "{name} adlı yinelenen iş öğesi artık çalışma alanınızda kullanılabilir.",
        },
        error: {
          title: "Bu sefer yinelenen iş öğesini oluşturamadık.",
          message:
            "Bilgilerinizi tekrar kaydetmeyi deneyin veya bunları yeni bir yinelenen iş öğesine, tercihen başka bir sekmede, kopyalayın.",
        },
      },
      update: {
        success: {
          title: "Yinelenen iş öğesi değiştirildi",
          message: "{name} adlı yinelenen iş öğesi değiştirildi.",
        },
        error: {
          title: "Bu yinelenen iş öğesindeki değişiklikleri kaydedemedik.",
          message:
            "Bilgilerinizi tekrar kaydetmeyi deneyin veya bu yinelenen iş öğesine daha sonra geri dönün. Hala sorun yaşarsanız, bizimle iletişime geçin.",
        },
      },
      delete: {
        success: {
          title: "Yinelenen iş öğesi silindi",
          message: "{name} adlı yinelenen iş öğesi çalışma alanınızdan silindi.",
        },
        error: {
          title: "Bu yinelenen iş öğesini silemedik.",
          message:
            "Tekrar silmeyi deneyin veya daha sonra tekrar deneyin. Hala silemiyorsanız, bizimle iletişime geçin.",
        },
      },
    },
    delete_confirmation: {
      title: "Yinelenen iş öğesini sil",
      description: {
        prefix: "Yinelenen iş öğesini silmek istediğinizden emin misiniz-",
        suffix: "? Bu yinelenen iş öğesiyle ilgili tüm veriler kalıcı olarak silinecek. Bu işlem geri alınamaz.",
      },
    },
  },
  automations: {
    settings: {
      title: "Özel otomasyonlar",
      create_automation: "Otomasyon oluştur",
    },
    scope: {
      label: "Kapsam",
      run_on: "Çalıştır",
    },
    trigger: {
      label: "Tetikleyici",
      add_trigger: "Tetikleyici ekle",
      sidebar_header: "Tetikleyici yapılandırması",
      input_label: "Bu otomasyon için tetikleyici nedir?",
      input_placeholder: "Bir seçenek seçin",
      section_plane_events: "Plane olayları",
      section_time_based: "Zamana dayalı",
      fixed_schedule: "Sabit zamanlama",
      schedule: {
        frequency: "Sıklık",
        select_day: "Gün seçin",
        day_of_month: "Ayın günü",
        monthly_every: "Her",
        monthly_day_aria: "{day}. gün",
        time: "Saat",
        hour: "Saat",
        minute: "Dakika",
        hour_suffix: "sa",
        minute_suffix: "dk",
        am: "AM",
        pm: "PM",
        timezone: "Saat dilimi",
        timezone_placeholder: "Saat dilimi seçin",
        frequency_daily: "Günlük",
        frequency_weekly: "Haftalık",
        frequency_monthly: "Aylık",
        on: "Tarihinde",
        validation_weekly_day_required: "Haftanın en az bir gününü seçin.",
        validation_monthly_date_required: "Ayın bir gününü seçin.",
        main_content_schedule_summary_daily: "Her gün {time} saatinde ({timezone}).",
        main_content_schedule_summary_weekly: "Her hafta {days} günü {time} saatinde ({timezone}).",
        main_content_schedule_summary_monthly: "Her ay {day}. günü {time} saatinde ({timezone}).",
        schedule_mode: "Zamanlama modu",
        schedule_mode_fixed: "Sabit",
        schedule_mode_cron: "Cron",
        cron_expression_label: "Cron ifadesi girin",
        cron_expression_placeholder: "0 9 * * 1-5",
        cron_invalid: "Geçersiz cron ifadesi.",
        cron_preview: 'Bu Cron ifadesi "{description}" çalıştırır.',
        main_content_cron_summary: "{description} ({timezone}).",
      },
      button: {
        previous: "Geri",
        next: "Eylem ekle",
      },
    },
    condition: {
      label: "Sağlanan",
      add_condition: "Koşul ekle",
      adding_condition: "Koşul ekleniyor",
    },
    action: {
      label: "Eylem",
      add_action: "Eylem ekle",
      sidebar_header: "Eylemler",
      input_label: "Otomasyon ne yapar?",
      input_placeholder: "Bir seçenek seçin",
      handler_name: {
        add_comment: "Yorum ekle",
        change_property: "Özelliği değiştir",
      },
      configuration: {
        label: "Yapılandırma",
        change_property: {
          placeholders: {
            property_name: "Bir özellik seçin",
            change_type: "Seç",
            property_value_select: "{count, plural, one{Değer seç} other{Değerler seç}}",
            property_value_select_date: "Tarih seç",
          },
          validation: {
            property_name_required: "Özellik adı gerekli",
            change_type_required: "Değişiklik türü gerekli",
            property_value_required: "Özellik değeri gerekli",
          },
        },
      },
      comment_block: {
        title: "Yorum ekle",
      },
      change_property_block: {
        title: "Özelliği değiştir",
      },
      validation: {
        delete_only_action: "Tek eylemini silmeden önce otomasyonu devre dışı bırakın.",
      },
    },
    conjunctions: {
      and: "Ve",
      or: "Veya",
      if: "Eğer",
      then: "O zaman",
    },
    enable: {
      alert:
        "Otomasyonunuz tamamlandığında 'Etkinleştir'e basın. Etkinleştirildikten sonra, otomasyon çalışmaya hazır olacak.",
      validation: {
        required: "Otomasyonun etkinleştirilebilmesi için bir tetikleyicisi ve en az bir eylemi olmalıdır.",
      },
    },
    delete: {
      validation: {
        enabled: "Otomasyon silinmeden önce devre dışı bırakılmalıdır.",
      },
    },
    table: {
      title: "Otomasyon başlığı",
      last_run_on: "Son çalıştırma",
      created_on: "Oluşturulma tarihi",
      last_updated_on: "Son güncelleme",
      last_run_status: "Son çalıştırma durumu",
      average_duration: "Ortalama süre",
      owner: "Sahip",
      executions: "Yürütmeler",
    },
    create_modal: {
      heading: {
        create: "Otomasyon oluştur",
        update: "Otomasyonu güncelle",
      },
      title: {
        placeholder: "Otomasyonunuzu adlandırın.",
        required_error: "Başlık gerekli",
      },
      description: {
        placeholder: "Otomasyonunuzu açıklayın.",
      },
      submit_button: {
        create: "Otomasyon oluştur",
        update: "Otomasyonu güncelle",
      },
    },
    delete_modal: {
      heading: "Otomasyonu sil",
    },
    activity: {
      filters: {
        show_fails: "Hataları göster",
        all: "Tümü",
        only_activity: "Sadece etkinlik",
        only_run_history: "Sadece çalıştırma geçmişi",
      },
      run_history: {
        initiator: "Başlatıcı",
      },
    },
    toasts: {
      create: {
        success: {
          title: "Başarılı!",
          message: "Otomasyon başarıyla oluşturuldu.",
        },
        error: {
          title: "Hata!",
          message: "Otomasyon oluşturma başarısız.",
        },
      },
      update: {
        success: {
          title: "Başarılı!",
          message: "Otomasyon başarıyla güncellendi.",
        },
        error: {
          title: "Hata!",
          message: "Otomasyon güncelleme başarısız.",
        },
      },
      enable: {
        success: {
          title: "Başarılı!",
          message: "Otomasyon başarıyla etkinleştirildi.",
        },
        error: {
          title: "Hata!",
          message: "Otomasyon etkinleştirme başarısız.",
        },
      },
      disable: {
        success: {
          title: "Başarılı!",
          message: "Otomasyon başarıyla devre dışı bırakıldı.",
        },
        error: {
          title: "Hata!",
          message: "Otomasyon devre dışı bırakma başarısız.",
        },
      },
      delete: {
        success: {
          title: "Otomasyon silindi",
          message: "{name} adlı otomasyon artık projenizden silindi.",
        },
        error: {
          title: "Bu sefer o otomasyonu silemedik.",
          message:
            "Tekrar silmeyi deneyin veya daha sonra tekrar deneyin. O zaman da silemezseniz, bizimle iletişime geçin.",
        },
      },
      action: {
        create: {
          error: {
            title: "Hata!",
            message: "Eylem oluşturulamadı. Lütfen tekrar deneyin!",
          },
        },
        update: {
          error: {
            title: "Hata!",
            message: "Eylem güncellenemedi. Lütfen tekrar deneyin!",
          },
        },
      },
    },
    empty_state: {
      no_automations: {
        title: "Henüz gösterilecek otomasyon yok.",
        description:
          "Otomasyonlar, tetikleyiciler, koşullar ve eylemler ayarlayarak tekrarlayan görevleri ortadan kaldırmanıza yardımcı olur. Zaman kazanmak ve işlerin zahmetsizce devam etmesini sağlamak için bir tane oluşturun.",
      },
      upgrade: {
        title: "Otomasyonlar",
        description: "Otomasyonlar, projenizdeki görevleri otomatikleştirmenin bir yoludur.",
        sub_description: "Otomasyonları kullandığınızda yönetim zamanınızın %80'ini geri kazanın.",
      },
    },
  },
  sso: {
    header: "Kimlik",
    description: "Tek oturum açma dahil güvenlik özelliklerine erişmek için etki alanınızı yapılandırın.",
    domain_management: {
      header: "Etki alanı yönetimi",
      verified_domains: {
        header: "Doğrulanmış etki alanları",
        description: "Tek oturum açmayı etkinleştirmek için bir e-posta etki alanının sahipliğini doğrulayın.",
        button_text: "Etki alanı ekle",
        list: {
          domain_name: "Etki alanı adı",
          status: "Durum",
          status_verified: "Doğrulandı",
          status_failed: "Başarısız",
          status_pending: "Beklemede",
        },
        add_domain: {
          title: "Etki alanı ekle",
          description: "SSO&apos;yu yapılandırmak ve doğrulamak için etki alanınızı ekleyin.",
          form: {
            domain_label: "Etki alanı",
            domain_placeholder: "plane.so",
            domain_required: "Etki alanı gereklidir",
            domain_invalid: "Geçerli bir etki alanı adı girin (örn. plane.so)",
          },
          primary_button_text: "Etki alanı ekle",
          primary_button_loading_text: "Ekleniyor",
          toast: {
            success_title: "Başarılı!",
            success_message: "Etki alanı başarıyla eklendi. Lütfen DNS TXT kaydını ekleyerek doğrulayın.",
            error_message: "Etki alanı eklenemedi. Lütfen tekrar deneyin.",
          },
        },
        verify_domain: {
          title: "Etki alanınızı doğrulayın",
          description: "Etki alanınızı doğrulamak için bu adımları izleyin.",
          instructions: {
            label: "Talimatlar",
            step_1: "Etki alanı ana bilgisayarınızın DNS ayarlarına gidin.",
            step_2: {
              part_1: "Bir",
              part_2: "TXT kaydı",
              part_3: "oluşturun ve aşağıda sağlanan tam kayıt değerini yapıştırın.",
            },
            step_3: "Bu güncelleme genellikle birkaç dakika sürer ancak tamamlanması 72 saate kadar sürebilir.",
            step_4: 'DNS kaydınız güncellendikten sonra onaylamak için "Etki alanını doğrula" seçeneğine tıklayın.',
          },
          verification_code_label: "TXT kaydı değeri",
          verification_code_description: "Bu kaydı DNS ayarlarınıza ekleyin",
          domain_label: "Etki alanı",
          primary_button_text: "Etki alanını doğrula",
          primary_button_loading_text: "Doğrulanıyor",
          secondary_button_text: "Bunu daha sonra yapacağım",
          toast: {
            success_title: "Başarılı!",
            success_message: "Etki alanı başarıyla doğrulandı.",
            error_message: "Etki alanı doğrulanamadı. Lütfen tekrar deneyin.",
          },
        },
        delete_domain: {
          title: "Etki alanını sil",
          description: {
            prefix: "Silmek istediğinizden emin misiniz",
            suffix: "? Bu işlem geri alınamaz.",
          },
          primary_button_text: "Sil",
          primary_button_loading_text: "Siliniyor",
          secondary_button_text: "İptal",
          toast: {
            success_title: "Başarılı!",
            success_message: "Etki alanı başarıyla silindi.",
            error_message: "Etki alanı silinemedi. Lütfen tekrar deneyin.",
          },
        },
      },
    },
    providers: {
      header: "Tek oturum açma",
      disabled_message: "SSO&apos;yu yapılandırmak için doğrulanmış bir etki alanı ekleyin",
      configure: {
        create: "Yapılandır",
        update: "Düzenle",
      },
      switch_alert_modal: {
        title: "SSO yöntemini {newProviderShortName}&apos;a geçir?",
        content:
          "{newProviderLongName} ({newProviderShortName})&apos;ı etkinleştirmek üzeresiniz. Bu işlem {activeProviderLongName} ({activeProviderShortName})&apos;ı otomatik olarak devre dışı bırakacaktır. {activeProviderShortName} üzerinden giriş yapmaya çalışan kullanıcılar yeni yönteme geçene kadar platforma erişemeyeceklerdir. Devam etmek istediğinizden emin misiniz?",
        primary_button_text: "Geçir",
        primary_button_text_loading: "Geçiriliyor",
        secondary_button_text: "İptal",
      },
      form_section: {
        title: "{workspaceName} için IdP tarafından sağlanan ayrıntılar",
      },
      form_action_buttons: {
        saving: "Kaydediliyor",
        save_changes: "Değişiklikleri kaydet",
        configure_only: "Yalnızca yapılandır",
        configure_and_enable: "Yapılandır ve etkinleştir",
        default: "Kaydet",
      },
      setup_details_section: {
        title: "{workspaceName} IdP&apos;niz için sağlanan ayrıntılar",
        button_text: "Kurulum ayrıntılarını al",
      },
      saml: {
        header: "SAML&apos;i etkinleştir",
        description: "Tek oturum açmayı etkinleştirmek için SAML kimlik sağlayıcınızı yapılandırın.",
        configure: {
          title: "SAML&apos;i etkinleştir",
          description:
            "Tek oturum açma dahil güvenlik özelliklerine erişmek için bir e-posta etki alanının sahipliğini doğrulayın.",
          toast: {
            success_title: "Başarılı!",
            create_success_message: "SAML sağlayıcı başarıyla oluşturuldu.",
            update_success_message: "SAML sağlayıcı başarıyla güncellendi.",
            error_title: "Hata!",
            error_message: "SAML sağlayıcı kaydedilemedi. Lütfen tekrar deneyin.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web ayrıntıları",
            entity_id: {
              label: "Varlık Kimliği | Hedef Kitle | Meta veri bilgileri",
              description:
                "Bu Plane uygulamasını IdP&apos;nizde yetkili bir hizmet olarak tanımlayan meta verilerin bu bölümünü oluşturacağız.",
            },
            callback_url: {
              label: "Tek oturum açma URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin oturum açma yönlendirme URL&apos;si alanına ekleyin.",
            },
            logout_url: {
              label: "Tek oturum kapatma URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin tek oturum kapatma yönlendirme URL&apos;si alanına ekleyin.",
            },
          },
          mobile_details: {
            header: "Mobil ayrıntılar",
            entity_id: {
              label: "Varlık Kimliği | Hedef Kitle | Meta veri bilgileri",
              description:
                "Bu Plane uygulamasını IdP&apos;nizde yetkili bir hizmet olarak tanımlayan meta verilerin bu bölümünü oluşturacağız.",
            },
            callback_url: {
              label: "Tek oturum açma URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin oturum açma yönlendirme URL&apos;si alanına ekleyin.",
            },
            logout_url: {
              label: "Tek oturum kapatma URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin oturum kapatma yönlendirme URL&apos;si alanına ekleyin.",
            },
          },
          mapping_table: {
            header: "Eşleme ayrıntıları",
            table: {
              idp: "IdP",
              plane: "Plane",
            },
          },
        },
      },
      oidc: {
        header: "OIDC&apos;yi etkinleştir",
        description: "Tek oturum açmayı etkinleştirmek için OIDC kimlik sağlayıcınızı yapılandırın.",
        configure: {
          title: "OIDC&apos;yi etkinleştir",
          description:
            "Tek oturum açma dahil güvenlik özelliklerine erişmek için bir e-posta etki alanının sahipliğini doğrulayın.",
          toast: {
            success_title: "Başarılı!",
            create_success_message: "OIDC sağlayıcı başarıyla oluşturuldu.",
            update_success_message: "OIDC sağlayıcı başarıyla güncellendi.",
            error_title: "Hata!",
            error_message: "OIDC sağlayıcı kaydedilemedi. Lütfen tekrar deneyin.",
          },
        },
        setup_modal: {
          web_details: {
            header: "Web ayrıntıları",
            origin_url: {
              label: "Kaynak URL",
              description:
                "Bunu bu Plane uygulaması için oluşturacağız. Bunu IdP&apos;nizin ilgili alanına güvenilir bir kaynak olarak ekleyin.",
            },
            callback_url: {
              label: "Yönlendirme URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin oturum açma yönlendirme URL&apos;si alanına ekleyin.",
            },
            logout_url: {
              label: "Oturum kapatma URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin oturum kapatma yönlendirme URL&apos;si alanına ekleyin.",
            },
          },
          mobile_details: {
            header: "Mobil ayrıntılar",
            origin_url: {
              label: "Kaynak URL",
              description:
                "Bunu bu Plane uygulaması için oluşturacağız. Bunu IdP&apos;nizin ilgili alanına güvenilir bir kaynak olarak ekleyin.",
            },
            callback_url: {
              label: "Yönlendirme URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin oturum açma yönlendirme URL&apos;si alanına ekleyin.",
            },
            logout_url: {
              label: "Oturum kapatma URL&apos;si",
              description:
                "Bunu sizin için oluşturacağız. Bunu IdP&apos;nizin oturum kapatma yönlendirme URL&apos;si alanına ekleyin.",
            },
          },
        },
      },
    },
  },
  project_name_cannot_contain_special_characters: "Proje adı özel karakterler içeremez.",
  pql: {
    functions: {
      date: {
        now: {
          description: "Güncel tarih ve saat",
        },
        today: {
          description: "Bugünün tarihi",
        },
        start_of_day: {
          description: "Bugünün başlangıcı",
        },
        end_of_day: {
          description: "Bugünün sonu",
        },
        start_of_week: {
          description: "Mevcut haftanın başlangıcı",
        },
        end_of_week: {
          description: "Mevcut haftanın sonu",
        },
        start_of_month: {
          description: "Mevcut ayın başlangıcı",
        },
        end_of_month: {
          description: "Mevcut ayın sonu",
        },
        start_of_year: {
          description: "Mevcut yılın başlangıcı",
        },
        end_of_year: {
          description: "Mevcut yılın sonu",
        },
        days_ago: {
          description: "n gün önceki tarih",
        },
        days_from_now: {
          description: "n gün sonraki tarih",
        },
        weeks_ago: {
          description: "n hafta önceki tarih",
        },
        weeks_from_now: {
          description: "n hafta sonraki tarih",
        },
        months_ago: {
          description: "n ay önceki tarih",
        },
        months_from_now: {
          description: "n ay sonraki tarih",
        },
      },
      user: {
        current_user: {
          description: "Şu anda oturum açmış kullanıcı",
        },
        members_of: {
          description: '"project:<id>" veya "teamspace:<id>" üyeleri',
        },
        workspace_members: {
          description: "Tüm çalışma alanı üyeleri",
        },
      },
      cycle: {
        active_cycle: {
          description: "Bugün aktif döngü",
        },
        completed_cycles: {
          description: "Bitiş tarihi geçmiş döngüler",
        },
        upcoming_cycles: {
          description: "Başlangıç tarihi gelecekte olan döngüler",
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
          description: "Son tarih geçmiş VE durum açık",
        },
        has_no_assignee: {
          description: "İş öğesinin atanan kişisi yok",
        },
        has_no_label: {
          description: "İş öğesinin etiketi yok",
        },
        is_top_level: {
          description: "Alt iş öğesi değil (üst öğesi yok)",
        },
        is_sub_work_item: {
          description: "Alt iş öğesi (üst öğesi var)",
        },
        is_epic: {
          description: "Epic",
        },
        is_intake: {
          description: "Giriş iş öğesi",
        },
        is_draft: {
          description: "Taslak iş öğesi",
        },
        is_archived: {
          description: "Arşivlenmiş",
        },
        has_children: {
          description: "En az bir alt iş öğesi var",
        },
        has_start_and_due_dates: {
          description: "Başlangıç ve bitiş tarihleri var",
        },
      },
      relation: {
        linked_to: {
          description: "Verilen iş öğesiyle ilgili iş öğeleri",
        },
        blocked_by: {
          description: "Verilen iş öğesi tarafından engellenen iş öğeleri",
        },
        blocks: {
          description: "Verilen iş öğesini engelleyen iş öğeleri",
        },
        child_of: {
          description: "Verilen iş öğesinin alt öğeleri",
        },
        parent_of: {
          description: "Verilen iş öğesinin üst öğesi",
        },
        duplicate_of: {
          description: "Verilen iş öğesinin kopyası olarak işaretlenen öğeler",
        },
      },
      history: {
        was_ever: {
          description: "Alan bu değere sahipti",
        },
        was: {
          description: "Alan daha önce bu değerdeydi (değiştirildi)",
        },
        changed_from: {
          description: "Alan bu değerden değiştirildi",
        },
        changed_to: {
          description: "Alan bu değere değiştirildi",
        },
        changed: {
          description: "Alan değiştirildi",
        },
        updated_by: {
          description: "Bu kullanıcı tarafından güncellenen iş öğesi",
        },
        commented_by: {
          description: "Bu kullanıcı tarafından yorum yapılan iş öğesi",
        },
        field_changed_by: {
          description: "Bu kullanıcı tarafından değiştirilen alan",
        },
        was_assigned_to: {
          description: "Bu kullanıcıya atanmış iş öğesi",
        },
        changed_after: {
          description: "Bu tarihten sonra değiştirilen alan",
        },
        changed_before: {
          description: "Bu tarihten önce değiştirilen alan",
        },
        field_changed_after: {
          description: "Bu tarihten sonra değiştirilen alan",
        },
        field_changed_before: {
          description: "Bu tarihten önce değiştirilen alan",
        },
        changed_to_after: {
          description: "Bu tarihten sonra bu değere değiştirilen alan",
        },
        changed_to_before: {
          description: "Bu tarihten önce bu değere değiştirilen alan",
        },
        field_changed_between: {
          description: "Bu tarihler arasında değiştirilen alan",
        },
      },
    },
    autocomplete_dropdown: {
      navigate: "gezin",
      accept: "kabul et",
      close: "kapat",
      pick_date: "Tarih seçin",
    },
    placeholder: 'Bir sorgu yazın ve filtrelemek için "ENTER" tuşuna basın...',
    error: "Sorgu gönderilirken hata oluştu. Lütfen kontrol edip tekrar deneyin.",
  },
  releases: {
    label: "{count, plural, one {Sürüm} other {Sürümler}}",
    no_release: "Sürüm yok",
    unreleased: "Yayımlanmamış",
    select_releases: "Sürümleri seç",
    overview: "Genel bakış",
    scope: "Kapsam",
    page_title: {
      scope: "Sürüm - {name} | Kapsam",
      scope_fallback: "Sürüm | Kapsam",
    },
    properties: "Özellikler",
    target_date: "Hedef tarih",
    lead: "Sorumlu",
    release_tag: "Etiket",
    labels: "Etiketler",
    description_placeholder: "Açıklama ekleyin...",
    progress: "İlerleme",
    completed_work_items: "Tamamlanan iş öğeleri",
    pending_work_items: "Bekleyen iş öğeleri",
    cancelled_work_items: "İptal edilen iş öğeleri",
    scope_page: {
      work_items: "İş öğeleri",
      add_work_items: "İş öğeleri ekle",
      remove_from_release: "Sürümden kaldır",
      empty_state: {
        title: "İş öğesi yok",
        description: "Sürüm kapsamını tanımlamak için iş öğeleri ekleyin.",
      },
      confirm_remove: {
        content: "Bu iş öğesini sürümden kaldırmak istediğinizden emin misiniz? Projede kalır.",
        primary_button: {
          default: "Kaldır",
          loading: "Kaldırılıyor",
        },
      },
    },
    empty_state: {
      title: "Henüz kapsam yok",
      description: "Bu sürüm için tamamlanmalarını takip etmek üzere sürüme iş öğeleri ekleyin.",
      add_scope: "Kapsam ekle",
      not_found: {
        title: "Sürüm bulunamadı",
        description: "Sürüm silinmiş olabilir.",
        primary_button: "Sürümlere dön",
      },
    },
    toast: {
      work_items_added: "{count, plural, one {İş öğesi eklendi} other {İş öğeleri eklendi}}",
      work_items_error: "İş öğeleri eklenemedi",
    },
    count_releases: "{count, plural, one {# Sürüm} other {# Sürüm}}",
    actions: {
      delete: "Sil",
    },
    delete_modal: {
      title: "Sürümü sil",
      content: '"{releaseName}" sürümünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    },
    settings: {
      heading: {
        title: "Sürümler",
        description: "Sürümleri kullanarak proje teslimlerini hassas bir şekilde yönetin.",
      },
      toggle: {
        title: "Sürümleri etkinleştir",
        description: "Çalışma alanı üyeleri, kendi projelerinde kapsamı görüntüleme erişimine sahip olacak.",
      },
      toasts: {
        enable: {
          loading: "Sürümler etkinleştiriliyor...",
          success: {
            title: "Sürümler etkinleştirildi",
            message: "Sürümler bu çalışma alanı için etkinleştirildi.",
          },
          error: {
            title: "Hata",
            message: "Sürümler etkinleştirilemedi. Lütfen tekrar deneyin.",
          },
        },
        disable: {
          loading: "Sürümler devre dışı bırakılıyor...",
          success: {
            title: "Sürümler devre dışı bırakıldı",
            message: "Sürümler bu çalışma alanı için devre dışı bırakıldı.",
          },
          error: {
            title: "Hata",
            message: "Sürümler devre dışı bırakılamadı. Lütfen tekrar deneyin.",
          },
        },
      },
      tabs: {
        tags: "Sürüm etiketleri",
        labels: "Etiketler",
      },
      tags: {
        title: "Sürüm etiketleri",
        description: "Etiketleri kullanarak sürümlerinizi kategorize edin ve filtreleyin.",
        add: "Etiket ekle",
        empty_state: "Henüz etiket yok. İlk etiketinizi oluşturun.",
        errors: {
          version_required: "Sürüm gereklidir.",
          version_already_exists: "Bu sürüme sahip bir etiket zaten var.",
          generic: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
        },
        delete_modal: {
          title: "Etiketi sil",
          content: '"{tagVersion}" etiketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        },
        actions: {
          edit: "Etiketi düzenle",
          delete: "Etiketi sil",
        },
        toasts: {
          delete: {
            success: "Etiket başarıyla silindi.",
            error: "Etiket silinemedi. Lütfen tekrar deneyin.",
          },
        },
      },
      labels: {
        title: "Etiketler",
        description: "Girişimlerinizi etiketlerle yapılandırın ve düzenleyin.",
        add: "Etiket ekle",
        empty_state: "Henüz etiket yok. İlk etiketinizi oluşturun.",
        errors: {
          name_required: "Ad gereklidir.",
          name_already_exists: "Bu adda bir etiket zaten var.",
          generic: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
        },
        modal: {
          name_placeholder: "Etiket adı",
          pick_color: "Etiket rengini seçin",
        },
        actions: {
          edit: "Etiketi düzenle",
          delete: "Etiketi sil",
        },
        drag_to_reorder: "Yeniden sıralamak için sürükleyin",
        delete_modal: {
          title: "Etiketi sil",
          content: '"{labelName}" etiketini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        },
        toasts: {
          delete: {
            success: "Etiket başarıyla silindi.",
            error: "Etiket silinemedi. Lütfen tekrar deneyin.",
          },
        },
      },
    },
  },
  work_item_type_hierarchy: {
    settings: {
      title: "Hiyerarşi",
      tab_label: "Hiyerarşi",
      description:
        "Çalışmanızı düzenlemek için hiyerarşi seviyeleri oluşturun. Her seviye, doğrudan üstündeki öğeyle üst ilişkisi ve doğrudan altındaki öğeyle alt ilişkisi tanımlar. ",
      sidebar_label: "Hiyerarşi",
      enable_control: {
        title: "Hiyerarşiyi etkinleştir",
        description: "Farklı iş öğesi türleri arasında üst-alt ilişkileri oluşturun.",
        tooltip: "Hiyerarşi etkinleştirildikten sonra devre dışı bırakılamaz.",
      },
      workspace_work_item_types_disabled_banner: {
        content: "Yeni bir hiyerarşi oluşturmak için önce İş Öğesi Türlerini tanımlayın.",
        cta: "İş öğesi türleri ayarları",
      },
    },
    levels: {
      add_level_button: "Hiyerarşi seviyesi ekle",
      empty_level_placeholder: "{level}. seviyeye bir iş öğesi türü ekleyin",
      empty_level_unauthorized: "Bu seviyede iş öğesi türü bulunamadı.",
      zero_level_description: "Varsayılan olarak, tüm iş öğesi türleri bir hiyerarşiye atanana kadar seviye 0'dadır.",
    },
    add_level_modal: {
      title: "Hiyerarşi seviyesi ekle",
      description: "İş öğesi türüne yeni bir hiyerarşi seviyesi ekleyin.",
      work_item_type: "İş öğesi türü",
      empty_state: {
        title: "Tüm iş öğesi türleri kullanımda",
        description: "Bu çalışma alanında tanımlanan her iş öğesi türü zaten hiyerarşinizin bir parçasıdır.",
      },
      invalid_level_toast: {
        title: "Hata!",
        message: "{type_name}, hiyerarşi kurallarını bozduğundan {level}. seviyeye eklenemiyor.",
      },
      not_found_toast: {
        title: "Hata",
        message: "İş öğesi türü bulunamadı.",
      },
      error_toast: {
        title: "Hata",
        message: "İş öğesi türü hiyerarşiye eklenemedi.",
      },
    },
    remove_from_level_toast: {
      loading: "İş öğesi türü seviyeden kaldırılıyor",
      success: {
        title: "Başarılı!",
        message: "İş öğesi türü seviyeden başarıyla kaldırıldı.",
      },
      error: {
        title: "Hata!",
        message: "İş öğesi türü seviyeden kaldırılamadı.",
      },
    },
    work_item_modal: {
      invalid_work_item_type_create_toast: {
        title: "Hata!",
        message:
          "Seçilen iş öğesi türü, hiyerarşi kurallarını bozduğundan yeni bir iş öğesi oluşturmak için kullanılamaz.",
      },
      invalid_work_item_type_update_toast: {
        title: "Hata!",
        message: "İş öğesi türü, hiyerarşi kurallarını bozduğundan güncellenemiyor.",
      },
    },
  },
} as const;

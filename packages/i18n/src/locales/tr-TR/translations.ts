export default {
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
  theme: "Tema",
  system_preference: "Sistem tercihi",
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
  workspace: "Çalışma Alanı",
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
    "Projedeki iş öğelerini benzersiz şekilde tanımlamanıza yardımcı olur. Maks. 10 karakter.",
  description_placeholder: "Açıklama",
  only_alphanumeric_non_latin_characters_allowed: "Yalnızca alfasayısal ve Latin olmayan karakterlere izin verilir.",
  project_id_is_required: "Proje ID gereklidir",
  project_id_allowed_char: "Yalnızca alfasayısal ve Latin olmayan karakterlere izin verilir.",
  project_id_min_char: "Proje ID en az 1 karakter olmalı",
  project_id_max_char: "Proje ID en fazla 10 karakter olmalı",
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
  pages: "Sayfalar",
  intake: "Talep",
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
  discord: "Discord",
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
  priority: "Öncelik",
  none: "Yok",
  urgent: "Acil",
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
  members: "Üyeler",
  assignee: "Atanan",
  assignees: "Atananlar",
  you: "Siz",
  labels: "Etiketler",
  create_new_label: "Yeni etiket oluştur",
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
    clear_all: "Tümünü temizle",
    copied: "Kopyalandı!",
    link_copied: "Bağlantı kopyalandı!",
    link_copied_to_clipboard: "Bağlantı panoya kopyalandı",
    copied_to_clipboard: "İş öğesi bağlantısı panoya kopyalandı",
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
      description: "Yalnızca tamamlanmış veya iptal edilmiş\niş öğeleri arşivlenebilir",
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
      body: "Merhaba örnek yönetici(ler),\n\nLütfen [çalışma-alanı-adı] URL'si ile [çalışma alanı oluşturma amacı] için yeni bir çalışma alanı oluşturun.\n\nTeşekkürler,\n{firstName} {lastName}\n{email}",
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
        description: "Eşleşen kriterlerle proje bulunamadı. \n Bunun yerine yeni bir proje oluşturun.",
      },
      search: {
        description: "Eşleşen kriterlerle proje bulunamadı.\nBunun yerine yeni bir proje oluşturun",
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
        title: "API Token'ları",
        add_token: "API Token'ı ekle",
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
      },
      validation: {
        min_length: "Tahmin puanı 0'dan büyük olmalı.",
        unable_to_process: "İsteğiniz işlenemedi, lütfen tekrar deneyin.",
        numeric: "Tahmin puanı sayısal bir değer olmalı.",
        character: "Tahmin puanı karakter değeri olmalı.",
        empty: "Tahmin değeri boş olamaz.",
        already_exists: "Tahmin değeri zaten var.",
        unsaved_changes: "Kaydedilmemiş değişiklikleriniz var, bitirmeden önce lütfen kaydedin",
      },
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
        title: "Alım",
        short_title: "Alım",
        description:
          "Üye olmayanların hataları, geri bildirimleri ve önerileri paylaşmasına izin verin; iş akışınızı aksatmadan.",
        toggle_title: "Alımı etkinleştir",
        toggle_description: "Proje üyelerinin uygulama içinde alım talepleri oluşturmasına izin verin.",
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
      archive_module_description: "Yalnızca tamamlanmış veya iptal edilmiş\nmodüller arşivlenebilir.",
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
        description: "Arama kriterleriyle eşleşen görünüm yok. \n Bunun yerine yeni bir görünüm oluşturun.",
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
        description: "Size atanan iş öğelerinin güncellemelerini \n burada görebilirsiniz",
      },
      mentions: {
        title: "Atanan iş öğesi yok",
        description: "Size atanan iş öğelerinin güncellemelerini \n burada görebilirsiniz",
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
} as const;

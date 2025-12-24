export default {
  sidebar: {
    projects: "پروژه‌ها",
    pages: "صفحات",
    new_work_item: "مورد کاری جدید",
    home: "خانه",
    your_work: "کارهای شما",
    inbox: "پیام‌ها",
    workspace: "فضای کاری",
    views: "نمایش‌ها",
    analytics: "تحلیل‌ها",
    work_items: "موارد کاری",
    cycles: "چرخه‌ها",
    modules: "ماژول‌ها",
    intake: "دریافتی‌ها",
    drafts: "پیش‌نویس‌ها",
    favorites: "علاقه‌مندی‌ها",
    pro: "حرفه‌ای",
    upgrade: "ارتقاء"
  },

  auth: {
    common: {
      email: {
        label: "ایمیل",
        placeholder: "name@company.com",
        errors: {
          required: "وارد کردن ایمیل الزامی است",
          invalid: "ایمیل وارد شده نامعتبر است"
        }
      },
      password: {
        label: "رمز عبور",
        set_password: "تنظیم رمز عبور",
        placeholder: "رمز عبور را وارد کنید",
        confirm_password: {
          label: "تأیید رمز عبور",
          placeholder: "رمز عبور را تأیید کنید"
        },
        current_password: {
          label: "رمز عبور فعلی"
        },
        new_password: {
          label: "رمز عبور جدید",
          placeholder: "رمز عبور جدید را وارد کنید"
        },
        change_password: {
          label: {
            default: "تغییر رمز عبور",
            submitting: "در حال تغییر رمز عبور"
          }
        },
        errors: {
          match: "رمزهای عبور مطابقت ندارند",
          empty: "لطفاً رمز عبور خود را وارد کنید",
          length: "طول رمز عبور باید بیشتر از ۸ کاراکتر باشد",
          strength: {
            weak: "رمز عبور ضعیف است",
            strong: "رمز عبور قوی است"
          }
        },
        submit: "تنظیم رمز عبور",
        toast: {
          change_password: {
            success: {
              title: "موفق!",
              message: "رمز عبور با موفقیت تغییر یافت."
            },
            error: {
              title: "خطا!",
              message: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
            }
          }
        }
      },
      unique_code: {
        label: "کد یکتا",
        placeholder: "gets-sets-flys",
        paste_code: "کدی را که به ایمیل شما ارسال شده وارد کنید",
        requesting_new_code: "درخواست کد جدید",
        sending_code: "در حال ارسال کد"
      },
      already_have_an_account: "قبلاً حساب کاربری دارید؟",
      login: "ورود",
      create_account: "ایجاد حساب کاربری",
      new_to_plane: "تازه با Plane آشنا شدید؟",
      back_to_sign_in: "بازگشت به صفحه ورود",
      resend_in: "ارسال مجدد در {seconds} ثانیه",
      sign_in_with_unique_code: "ورود با کد یکتا",
      forgot_password: "رمز عبور خود را فراموش کرده‌اید؟"
    },
    sign_up: {
      header: {
        label: "برای مدیریت کار با تیمتان، حسابی ایجاد کنید.",
        step: {
          email: {
            header: "ثبت‌نام",
            sub_header: ""
          },
          password: {
            header: "ثبت‌نام",
            sub_header: "با استفاده از ترکیب ایمیل و رمز عبور ثبت‌نام کنید."
          },
          unique_code: {
            header: "ثبت‌نام",
            sub_header: "با استفاده از کد یکتایی که به ایمیل بالا ارسال شده ثبت‌نام کنید."
          }
        }
      },
      errors: {
        password: {
          strength: "برای ادامه، رمز عبور قوی‌تری تنظیم کنید"
        }
      }
    },
    sign_in: {
      header: {
        label: "برای مدیریت کار با تیمتان وارد شوید.",
        step: {
          email: {
            header: "ورود یا ثبت‌نام",
            sub_header: ""
          },
          password: {
            header: "ورود یا ثبت‌نام",
            sub_header: "برای ورود از ترکیب ایمیل و رمز عبور استفاده کنید."
          },
          unique_code: {
            header: "ورود یا ثبت‌نام",
            sub_header: "با استفاده از کدی که به ایمیل بالا ارسال شده وارد شوید."
          }
        }
      }
    },
    forgot_password: {
      title: "بازنشانی رمز عبور",
      description: "ایمیل تأییدشده حساب کاربری خود را وارد کنید تا لینک بازنشانی رمز عبور برایتان ارسال شود.",
      email_sent: "لینک بازنشانی به ایمیل شما ارسال شد",
      send_reset_link: "ارسال لینک بازنشانی",
      errors: {
        smtp_not_enabled: "به نظر می‌رسد سرور SMTP فعال نیست، بنابراین نمی‌توانیم لینک بازنشانی رمز عبور ارسال کنیم"
      },
      toast: {
        success: {
          title: "ایمیل ارسال شد",
          message:
            "صندوق ورودی خود را برای لینک بازنشانی رمز عبور بررسی کنید. اگر ظرف چند دقیقه ایمیل را دریافت نکردید، پوشه اسپم را بررسی کنید."
        },
        error: {
          title: "خطا!",
          message: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید."
        }
      }
    },
    reset_password: {
      title: "تنظیم رمز عبور جدید",
      description: "حساب خود را با رمز عبور قوی محافظت کنید"
    },
    set_password: {
      title: "امن‌سازی حساب شما",
      description: "تنظیم رمز عبور به شما کمک می‌کند تا ورود امن‌تری داشته باشید"
    },
    sign_out: {
      toast: {
        error: {
          title: "خطا!",
          message: "خروج از حساب انجام نشد. لطفاً دوباره تلاش کنید."
        }
      }
    }
  }
} as const;

export default {
  sidebar: {
    projects: "پروژه‌ها",
    pages: "صفحات",
    new_work_item: "مورد کاری جدید",
    home: "خانه",
    your_work: "کار شما",
    inbox: "صندوق ورودی",
    workspace: "فضای کاری",
    views: "نمایش‌ها",
    analytics: "تحلیل‌ها",
    work_items: "موارد کاری",
    cycles: "چرخه‌ها",
    modules: "ماژول‌ها",
    intake: "پذیرش",
    drafts: "پیش‌نویس‌ها",
    favorites: "علاقه‌مندی‌ها",
    pro: "حرفه‌ای",
    upgrade: "ارتقا",
  },

  auth: {
    common: {
      email: {
        label: "ایمیل",
        placeholder: "name@company.com",
        errors: {
          required: "ایمیل الزامی است",
          invalid: "ایمیل نامعتبر است",
        },
      },
      password: {
        label: "رمز عبور",
        set_password: "تعیین رمز عبور",
        placeholder: "رمز عبور را وارد کنید",
        confirm_password: {
          label: "تکرار رمز عبور",
          placeholder: "تکرار رمز عبور",
        },
        current_password: {
          label: "رمز عبور فعلی",
        },
        new_password: {
          label: "رمز عبور جدید",
          placeholder: "رمز عبور جدید را وارد کنید",
        },
        change_password: {
          label: {
            default: "تغییر رمز عبور",
            submitting: "در حال تغییر رمز عبور",
          },
        },
        errors: {
          match: "رمزهای عبور مطابقت ندارند",
          empty: "لطفاً رمز عبور خود را وارد کنید",
          length: "طول رمز عبور باید بیشتر از ۸ کاراکتر باشد",
          strength: {
            weak: "رمز عبور ضعیف است",
            strong: "رمز عبور قوی است",
          },
        },
        submit: "ثبت رمز عبور",
        toast: {
          change_password: {
            success: {
              title: "موفق!",
              message: "رمز عبور با موفقیت تغییر کرد.",
            },
            error: {
              title: "خطا!",
              message: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
            },
          },
        },
      },
      unique_code: {
        label: "کد یکتا",
        placeholder: "123456",
        paste_code: "کد ارسال شده به ایمیل خود را جایگذاری کنید",
        requesting_new_code: "در حال درخواست کد جدید",
        sending_code: "در حال ارسال کد",
      },
      already_have_an_account: "حساب کاربری دارید؟",
      login: "ورود",
      create_account: "ایجاد حساب کاربری",
      new_to_plane: "تازه وارد پلین شده‌اید؟",
      back_to_sign_in: "بازگشت به صفحه ورود",
      resend_in: "ارسال مجدد در {seconds} ثانیه",
      sign_in_with_unique_code: "ورود با کد یکتا",
      forgot_password: "رمز عبور را فراموش کرده‌اید؟",
    },
    sign_up: {
      header: {
        label: "یک حساب کاربری ایجاد کنید تا مدیریت کارها را با تیم خود شروع کنید.",
        step: {
          email: {
            header: "ثبت نام",
            sub_header: "",
          },
          password: {
            header: "ثبت نام",
            sub_header: "ثبت نام با استفاده از ایمیل و رمز عبور.",
          },
          unique_code: {
            header: "ثبت نام",
            sub_header: "ثبت نام با استفاده از کد یکتا ارسال شده به ایمیل بالا.",
          },
        },
      },
      errors: {
        password: {
          strength: "برای ادامه، یک رمز عبور قوی تعیین کنید",
        },
      },
    },
    sign_in: {
      header: {
        label: "وارد شوید تا مدیریت کارها را با تیم خود شروع کنید.",
        step: {
          email: {
            header: "ورود یا ثبت نام",
            sub_header: "",
          },
          password: {
            header: "ورود یا ثبت نام",
            sub_header: "از ترکیب ایمیل و رمز عبور خود برای ورود استفاده کنید.",
          },
          unique_code: {
            header: "ورود یا ثبت نام",
            sub_header: "با استفاده از کد یکتا ارسال شده به ایمیل بالا وارد شوید.",
          },
        },
      },
    },
    forgot_password: {
      title: "بازیابی رمز عبور",
      description: "ایمیل تایید شده حساب کاربری خود را وارد کنید تا لینک بازیابی رمز عبور را برای شما ارسال کنیم.",
      email_sent: "لینک بازیابی را به ایمیل شما ارسال کردیم",
      send_reset_link: "ارسال لینک بازیابی",
      errors: {
        smtp_not_enabled: "ما متوجه شدیم که سرور SMTP فعال نشده است، قادر به ارسال لینک بازیابی رمز عبور نیستیم",
      },
      toast: {
        success: {
          title: "ایمیل ارسال شد",
          message:
            "صندوق ورودی خود را برای لینک بازیابی رمز عبور بررسی کنید. اگر در چند دقیقه دریافت نکردید، پوشه اسپم را چک کنید.",
        },
        error: {
          title: "خطا!",
          message: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        },
      },
    },
    reset_password: {
      title: "تعیین رمز عبور جدید",
      description: "حساب خود را با یک رمز عبور قوی امن کنید",
    },
    set_password: {
      title: "امن‌سازی حساب کاربری",
      description: "تعیین رمز عبور به شما کمک می‌کند تا به صورت امن وارد شوید",
    },
    sign_out: {
      toast: {
        error: {
          title: "خطا!",
          message: "خروج ناموفق بود. لطفاً دوباره تلاش کنید.",
        },
      },
    },
  },
} as const;

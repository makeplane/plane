export default {
  sidebar: {
    projects: "Projects",
    pages: "Pages",
    new_work_item: "New work item",
    home: "Home",
    your_work: "Your work",
    inbox: "Inbox",
    workspace: "Workspace",
    views: "Views",
    analytics: "Analytics",
    work_items: "Work items",
    cycles: "Cycles",
    modules: "Modules",
    intake: "Intake",
    drafts: "Drafts",
    favorites: "Favorites",
    pro: "Pro",
    upgrade: "Upgrade",
  },

  auth: {
    common: {
      email: {
        label: "Email",
        placeholder: "name@company.com",
        errors: {
          required: "Email is required",
          invalid: "Email is invalid",
        },
      },
      password: {
        label: "Password",
        set_password: "Set a password",
        placeholder: "Enter password",
        confirm_password: {
          label: "Confirm password",
          placeholder: "Confirm password",
        },
        current_password: {
          label: "Current password",
        },
        new_password: {
          label: "New password",
          placeholder: "Enter new password",
        },
        change_password: {
          label: {
            default: "Change password",
            submitting: "Changing password",
          },
        },
        errors: {
          match: "Passwords don't match",
          empty: "Please enter your password",
          length: "Password length should me more than 8 characters",
          strength: {
            weak: "Password is weak",
            strong: "Password is strong",
          },
        },
        submit: "Set password",
        toast: {
          change_password: {
            success: {
              title: "Success!",
              message: "Password changed successfully.",
            },
            error: {
              title: "Error!",
              message: "Something went wrong. Please try again.",
            },
          },
        },
      },
      unique_code: {
        label: "Unique code",
        placeholder: "123456",
        paste_code: "Paste the code sent to your email",
        requesting_new_code: "Requesting new code",
        sending_code: "Sending code",
      },
      already_have_an_account: "Already have an account?",
      login: "Log in",
      create_account: "Create an account",
      new_to_plane: "New to Plane?",
      back_to_sign_in: "Back to sign in",
      resend_in: "Resend in {seconds} seconds",
      sign_in_with_unique_code: "Sign in with unique code",
      forgot_password: "Forgot your password?",
    },
    sign_up: {
      header: {
        label: "Create an account to start managing work with your team.",
        step: {
          email: {
            header: "Sign up",
            sub_header: "",
          },
          password: {
            header: "Sign up",
            sub_header: "Sign up using an email-password combination.",
          },
          unique_code: {
            header: "Sign up",
            sub_header: "Sign up using a unique code sent to the email address above.",
          },
        },
      },
      errors: {
        password: {
          strength: "Try setting-up a strong password to proceed",
        },
      },
    },
    sign_in: {
      header: {
        label: "Log in to start managing work with your team.",
        step: {
          email: {
            header: "Log in or sign up",
            sub_header: "",
          },
          password: {
            header: "Log in or sign up",
            sub_header: "Use your email-password combination to log in.",
          },
          unique_code: {
            header: "Log in or sign up",
            sub_header: "Log in using a unique code sent to the email address above.",
          },
        },
      },
    },
    forgot_password: {
      title: "Reset your password",
      description: "Enter your user account's verified email address and we will send you a password reset link.",
      email_sent: "We sent the reset link to your email address",
      send_reset_link: "Send reset link",
      errors: {
        smtp_not_enabled: "We see that your god hasn't enabled SMTP, we will not be able to send a password reset link",
      },
      toast: {
        success: {
          title: "Email sent",
          message:
            "Check your inbox for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.",
        },
        error: {
          title: "Error!",
          message: "Something went wrong. Please try again.",
        },
      },
    },
    reset_password: {
      title: "Set new password",
      description: "Secure your account with a strong password",
    },
    set_password: {
      title: "Secure your account",
      description: "Setting password helps you login securely",
    },
    sign_out: {
      toast: {
        error: {
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        },
      },
    },
  },
} as const;

/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export default {
  sidebar: {
    projects: "项目",
    pages: "页面",
    new_work_item: "新工作项",
    home: "主页",
    your_work: "我的工作",
    inbox: "收件箱",
    workspace: "工作区",
    views: "视图",
    analytics: "分析",
    work_items: "工作项",
    cycles: "周期",
    modules: "模块",
    intake: "收集",
    drafts: "草稿",
    favorites: "收藏",
    pro: "专业版",
    upgrade: "升级",
    stickies: "便签",
  },

  auth: {
    common: {
      email: {
        label: "邮箱",
        placeholder: "name@company.com",
        errors: {
          required: "邮箱是必填项",
          invalid: "邮箱格式无效",
        },
      },
      password: {
        label: "密码",
        set_password: "设置密码",
        placeholder: "输入密码",
        confirm_password: {
          label: "确认密码",
          placeholder: "确认密码",
        },
        current_password: {
          label: "当前密码",
        },
        new_password: {
          label: "新密码",
          placeholder: "输入新密码",
        },
        change_password: {
          label: {
            default: "修改密码",
            submitting: "正在修改密码",
          },
        },
        errors: {
          match: "密码不匹配",
          empty: "请输入密码",
          length: "密码长度应超过8个字符",
          strength: {
            weak: "密码强度较弱",
            strong: "密码强度较强",
          },
        },
        submit: "设置密码",
        toast: {
          change_password: {
            success: {
              title: "成功！",
              message: "密码修改成功。",
            },
            error: {
              title: "错误！",
              message: "出现错误。请重试。",
            },
          },
        },
      },
      unique_code: {
        label: "验证码",
        placeholder: "123456",
        paste_code: "粘贴发送到您邮箱的验证码",
        requesting_new_code: "正在请求新验证码",
        sending_code: "正在发送验证码",
      },
      already_have_an_account: "已有账号？",
      login: "登录",
      create_account: "创建账号",
      new_to_plane: "首次使用 Plane？",
      back_to_sign_in: "返回登录",
      resend_in: "{seconds} 秒后重新发送",
      sign_in_with_unique_code: "使用验证码登录",
      forgot_password: "忘记密码？",
    },
    sign_up: {
      header: {
        label: "创建账号以开始与团队一起管理工作。",
        step: {
          email: {
            header: "注册",
            sub_header: "",
          },
          password: {
            header: "注册",
            sub_header: "使用邮箱密码组合注册。",
          },
          unique_code: {
            header: "注册",
            sub_header: "使用发送到上述邮箱地址的验证码注册。",
          },
        },
      },
      errors: {
        password: {
          strength: "请设置强密码以继续",
        },
      },
    },
    sign_in: {
      header: {
        label: "登录以开始与团队一起管理工作。",
        step: {
          email: {
            header: "登录或注册",
            sub_header: "",
          },
          password: {
            header: "登录或注册",
            sub_header: "使用邮箱密码组合登录。",
          },
          unique_code: {
            header: "登录或注册",
            sub_header: "使用发送到上述邮箱地址的验证码登录。",
          },
        },
      },
    },
    forgot_password: {
      title: "重置密码",
      description: "输入您账号的已验证邮箱地址，我们将向您发送密码重置链接。",
      email_sent: "我们已向您的邮箱地址发送重置链接",
      send_reset_link: "发送重置链接",
      errors: {
        smtp_not_enabled: "检测到管理员未启用 SMTP，无法发送密码重置链接",
      },
      toast: {
        success: {
          title: "邮件已发送",
          message:
            "请查收重置密码链接的邮件。如未在几分钟内收到，请检查垃圾邮件文件夹。",
        },
        error: {
          title: "错误！",
          message: "出现错误。请重试。",
        },
      },
    },
    reset_password: {
      title: "设置新密码",
      description: "使用强密码保护您的账号",
    },
    set_password: {
      title: "保护您的账号",
      description: "设置密码有助于安全登录",
    },
    sign_out: {
      toast: {
        error: {
          title: "错误！",
          message: "退出失败。请重试。",
        },
      },
    },
  },
} as const;

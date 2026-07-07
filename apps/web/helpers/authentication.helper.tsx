/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import Link from "next/link";
// gizmo imports
import { SUPPORT_EMAIL } from "@plane/constants";

export enum EPageTypes {
  PUBLIC = "PUBLIC",
  NON_AUTHENTICATED = "NON_AUTHENTICATED",
  SET_PASSWORD = "SET_PASSWORD",
  ONBOARDING = "ONBOARDING",
  AUTHENTICATED = "AUTHENTICATED",
}

export enum EAuthModes {
  SIGN_IN = "SIGN_IN",
  SIGN_UP = "SIGN_UP",
}

export enum EAuthSteps {
  EMAIL = "EMAIL",
  PASSWORD = "PASSWORD",
  UNIQUE_CODE = "UNIQUE_CODE",
}

export enum EErrorAlertType {
  BANNER_ALERT = "BANNER_ALERT",
  INLINE_FIRST_NAME = "INLINE_FIRST_NAME",
  INLINE_EMAIL = "INLINE_EMAIL",
  INLINE_PASSWORD = "INLINE_PASSWORD",
  INLINE_EMAIL_CODE = "INLINE_EMAIL_CODE",
}

export enum EAuthenticationErrorCodes {
  // Global
  INSTANCE_NOT_CONFIGURED = "5000",
  INVALID_EMAIL = "5005",
  EMAIL_REQUIRED = "5010",
  SIGNUP_DISABLED = "5015",
  MAGIC_LINK_LOGIN_DISABLED = "5016",
  PASSWORD_LOGIN_DISABLED = "5018",
  USER_ACCOUNT_DEACTIVATED = "5019",
  // Password strength
  INVALID_PASSWORD = "5020",
  PASSWORD_TOO_WEAK = "5021",
  SMTP_NOT_CONFIGURED = "5025",
  // Sign Up
  USER_ALREADY_EXIST = "5030",
  AUTHENTICATION_FAILED_SIGN_UP = "5035",
  REQUIRED_EMAIL_PASSWORD_SIGN_UP = "5040",
  INVALID_EMAIL_SIGN_UP = "5045",
  INVALID_EMAIL_MAGIC_SIGN_UP = "5050",
  MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED = "5055",
  // Sign In
  USER_DOES_NOT_EXIST = "5060",
  AUTHENTICATION_FAILED_SIGN_IN = "5065",
  REQUIRED_EMAIL_PASSWORD_SIGN_IN = "5070",
  INVALID_EMAIL_SIGN_IN = "5075",
  INVALID_EMAIL_MAGIC_SIGN_IN = "5080",
  MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED = "5085",
  // Both Sign in and Sign up for magic
  INVALID_MAGIC_CODE_SIGN_IN = "5090",
  INVALID_MAGIC_CODE_SIGN_UP = "5092",
  EXPIRED_MAGIC_CODE_SIGN_IN = "5095",
  EXPIRED_MAGIC_CODE_SIGN_UP = "5097",
  EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN = "5100",
  EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP = "5102",
  // Oauth
  OAUTH_NOT_CONFIGURED = "5104",
  GOOGLE_NOT_CONFIGURED = "5105",
  GITHUB_NOT_CONFIGURED = "5110",
  GITLAB_NOT_CONFIGURED = "5111",
  GOOGLE_OAUTH_PROVIDER_ERROR = "5115",
  GITHUB_OAUTH_PROVIDER_ERROR = "5120",
  GITLAB_OAUTH_PROVIDER_ERROR = "5121",
  // Reset Password
  INVALID_PASSWORD_TOKEN = "5125",
  EXPIRED_PASSWORD_TOKEN = "5130",
  // Change password
  INCORRECT_OLD_PASSWORD = "5135",
  MISSING_PASSWORD = "5138",
  INVALID_NEW_PASSWORD = "5140",
  // set password
  PASSWORD_ALREADY_SET = "5145",
  // Admin
  ADMIN_ALREADY_EXIST = "5150",
  REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME = "5155",
  INVALID_ADMIN_EMAIL = "5160",
  INVALID_ADMIN_PASSWORD = "5165",
  REQUIRED_ADMIN_EMAIL_PASSWORD = "5170",
  ADMIN_AUTHENTICATION_FAILED = "5175",
  ADMIN_USER_ALREADY_EXIST = "5180",
  ADMIN_USER_DOES_NOT_EXIST = "5185",
  ADMIN_USER_DEACTIVATED = "5190",
  // Rate limit
  RATE_LIMIT_EXCEEDED = "5900",
}

export type TAuthErrorInfo = {
  type: EErrorAlertType;
  code: EAuthenticationErrorCodes;
  title: string;
  message: ReactNode;
};

// TODO: move all error messages to translation files
const errorCodeMessages: {
  [key in EAuthenticationErrorCodes]: { title: string; message: (email?: string) => ReactNode };
} = {
  // global
  [EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED]: {
    title: `Экземпляр не настроен`,
    message: () => `Экземпляр не настроен. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL]: {
    title: `Неверный email`,
    message: () => `Неверный email. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.EMAIL_REQUIRED]: {
    title: `Требуется эл. почта`,
    message: () => `Требуется эл. почта. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.SIGNUP_DISABLED]: {
    title: `Регистрация отключена`,
    message: () => `Регистрация отключена. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.MAGIC_LINK_LOGIN_DISABLED]: {
    title: `Вход по magic-ссылке отключён`,
    message: () => `Вход по magic-ссылке отключён. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.PASSWORD_LOGIN_DISABLED]: {
    title: `Вход по паролю отключён`,
    message: () => `Вход по паролю отключён. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.USER_ACCOUNT_DEACTIVATED]: {
    title: `Учётная запись деактивирована`,
    message: () => `Учётная запись деактивирована. Обратитесь к ${SUPPORT_EMAIL ? SUPPORT_EMAIL : "администратору"}.`,
  },
  [EAuthenticationErrorCodes.INVALID_PASSWORD]: {
    title: `Неверный пароль`,
    message: () => `Неверный пароль. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.PASSWORD_TOO_WEAK]: {
    title: `Слишком слабый пароль`,
    message: () => `Используйте более надёжный пароль.`,
  },
  [EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED]: {
    title: `SMTP не настроен`,
    message: () => `SMTP не настроен. Обратитесь к администратору.`,
  },

  // sign up
  [EAuthenticationErrorCodes.USER_ALREADY_EXIST]: {
    title: `Пользователь уже существует`,
    message: (email = undefined) => (
      <div>
        Такой аккаунт уже зарегистрирован.&nbsp;
        <Link
          className="font-medium underline underline-offset-4 transition-all hover:font-bold"
          href={`/sign-in${email ? `?email=${encodeURIComponent(email)}` : ``}`}
        >
          Войдите
        </Link>
        &nbsp;сейчас.
      </div>
    ),
  },
  [EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP]: {
    title: `Требуются эл. почта и пароль`,
    message: () => `Требуются эл. почта и пароль. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP]: {
    title: `Ошибка аутентификации`,
    message: () => `Ошибка аутентификации. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_UP]: {
    title: `Неверный email`,
    message: () => `Неверный email. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED]: {
    title: `Требуются эл. почта и код`,
    message: () => `Требуются эл. почта и код. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP]: {
    title: `Неверный email`,
    message: () => `Неверный email. Попробуйте ещё раз.`,
  },

  [EAuthenticationErrorCodes.USER_DOES_NOT_EXIST]: {
    title: `Пользователь не существует`,
    message: (email = undefined) => (
      <div>
        Аккаунт не найден.&nbsp;
        <Link
          className="font-medium underline underline-offset-4 transition-all hover:font-bold"
          href={`/${email ? `?email=${encodeURIComponent(email)}` : ``}`}
        >
          Создайте его
        </Link>
        ,&nbsp;чтобы начать.
      </div>
    ),
  },
  [EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN]: {
    title: `Требуются эл. почта и пароль`,
    message: () => `Требуются эл. почта и пароль. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN]: {
    title: `Ошибка аутентификации`,
    message: () => `Ошибка аутентификации. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_IN]: {
    title: `Неверный email`,
    message: () => `Неверный email. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED]: {
    title: `Требуются эл. почта и код`,
    message: () => `Требуются эл. почта и код. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN]: {
    title: `Неверный email`,
    message: () => `Неверный email. Попробуйте ещё раз.`,
  },

  // Both Sign in and Sign up
  [EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_IN]: {
    title: `Ошибка аутентификации`,
    message: () => `Неверный код. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_UP]: {
    title: `Ошибка аутентификации`,
    message: () => `Неверный код. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN]: {
    title: `Срок действия кода истёк`,
    message: () => `Срок действия кода истёк. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP]: {
    title: `Срок действия кода истёк`,
    message: () => `Срок действия кода истёк. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN]: {
    title: `Срок действия кода истёк`,
    message: () => `Срок действия кода истёк. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP]: {
    title: `Срок действия кода истёк`,
    message: () => `Срок действия кода истёк. Попробуйте ещё раз.`,
  },

  // Oauth
  [EAuthenticationErrorCodes.OAUTH_NOT_CONFIGURED]: {
    title: `OAuth не настроен`,
    message: () => `OAuth не настроен. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.GOOGLE_NOT_CONFIGURED]: {
    title: `Google не настроен`,
    message: () => `Google не настроен. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.GITHUB_NOT_CONFIGURED]: {
    title: `GitHub не настроен`,
    message: () => `GitHub не настроен. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.GITLAB_NOT_CONFIGURED]: {
    title: `GitLab не настроен`,
    message: () => `GitLab не настроен. Обратитесь к администратору.`,
  },
  [EAuthenticationErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR]: {
    title: `Ошибка OAuth-провайдера Google`,
    message: () => `Ошибка OAuth-провайдера Google. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR]: {
    title: `Ошибка OAuth-провайдера GitHub`,
    message: () => `Ошибка OAuth-провайдера GitHub. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR]: {
    title: `Ошибка OAuth-провайдера GitLab`,
    message: () => `Ошибка OAuth-провайдера GitLab. Попробуйте ещё раз.`,
  },

  // Reset Password
  [EAuthenticationErrorCodes.INVALID_PASSWORD_TOKEN]: {
    title: `Неверный токен пароля`,
    message: () => `Неверный токен пароля.`,
  },
  [EAuthenticationErrorCodes.EXPIRED_PASSWORD_TOKEN]: {
    title: `Срок действия токена пароля истёк`,
    message: () => `Срок действия токена пароля истёк. Попробуйте ещё раз.`,
  },

  // Change password
  [EAuthenticationErrorCodes.MISSING_PASSWORD]: {
    title: `Требуется пароль`,
    message: () => `Требуется пароль. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INCORRECT_OLD_PASSWORD]: {
    title: `Неверный старый пароль`,
    message: () => `Неверный старый пароль. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_NEW_PASSWORD]: {
    title: `Неверный новый пароль`,
    message: () => `Неверный новый пароль. Попробуйте ещё раз.`,
  },

  // set password
  [EAuthenticationErrorCodes.PASSWORD_ALREADY_SET]: {
    title: `Пароль уже установлен`,
    message: () => `Пароль уже установлен. Попробуйте ещё раз.`,
  },

  // admin
  [EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST]: {
    title: `Администратор уже существует`,
    message: () => `Администратор уже существует. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME]: {
    title: `Требуются эл. почта, пароль и имя`,
    message: () => `Требуются эл. почта, пароль и имя. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL]: {
    title: `Неверный email администратора`,
    message: () => `Неверный email администратора. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD]: {
    title: `Неверный пароль администратора`,
    message: () => `Неверный пароль администратора. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD]: {
    title: `Требуются эл. почта и пароль`,
    message: () => `Требуются эл. почта и пароль. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED]: {
    title: `Ошибка аутентификации`,
    message: () => `Ошибка аутентификации. Попробуйте ещё раз.`,
  },
  [EAuthenticationErrorCodes.ADMIN_USER_ALREADY_EXIST]: {
    title: `Администратор уже существует`,
    message: () => (
      <div>
        Администратор уже существует.&nbsp;
        <Link className="font-medium underline underline-offset-4 transition-all hover:font-bold" href={`/admin`}>
          Войдите
        </Link>
        &nbsp;сейчас.
      </div>
    ),
  },
  [EAuthenticationErrorCodes.ADMIN_USER_DOES_NOT_EXIST]: {
    title: `Администратор не существует`,
    message: () => (
      <div>
        Администратор не существует.&nbsp;
        <Link className="font-medium underline underline-offset-4 transition-all hover:font-bold" href={`/admin`}>
          Войдите
        </Link>
        &nbsp;сейчас.
      </div>
    ),
  },
  [EAuthenticationErrorCodes.ADMIN_USER_DEACTIVATED]: {
    title: `Учётная запись администратора деактивирована`,
    message: () => <div>Ваша учётная запись деактивирована</div>,
  },
  [EAuthenticationErrorCodes.RATE_LIMIT_EXCEEDED]: {
    title: "",
    message: () => `Превышен лимит запросов. Попробуйте позже.`,
  },
};

export const authErrorHandler = (errorCode: EAuthenticationErrorCodes, email?: string): TAuthErrorInfo | undefined => {
  const bannerAlertErrorCodes = [
    EAuthenticationErrorCodes.INSTANCE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.INVALID_EMAIL,
    EAuthenticationErrorCodes.EMAIL_REQUIRED,
    EAuthenticationErrorCodes.SIGNUP_DISABLED,
    EAuthenticationErrorCodes.MAGIC_LINK_LOGIN_DISABLED,
    EAuthenticationErrorCodes.PASSWORD_LOGIN_DISABLED,
    EAuthenticationErrorCodes.USER_ACCOUNT_DEACTIVATED,
    EAuthenticationErrorCodes.INVALID_PASSWORD,
    EAuthenticationErrorCodes.SMTP_NOT_CONFIGURED,
    EAuthenticationErrorCodes.USER_ALREADY_EXIST,
    EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_UP,
    EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_UP,
    EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_UP,
    EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_UP,
    EAuthenticationErrorCodes.MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED,
    EAuthenticationErrorCodes.USER_DOES_NOT_EXIST,
    EAuthenticationErrorCodes.AUTHENTICATION_FAILED_SIGN_IN,
    EAuthenticationErrorCodes.REQUIRED_EMAIL_PASSWORD_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_EMAIL_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_EMAIL_MAGIC_SIGN_IN,
    EAuthenticationErrorCodes.MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED,
    EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_IN,
    EAuthenticationErrorCodes.INVALID_MAGIC_CODE_SIGN_UP,
    EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_IN,
    EAuthenticationErrorCodes.EXPIRED_MAGIC_CODE_SIGN_UP,
    EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_IN,
    EAuthenticationErrorCodes.EMAIL_CODE_ATTEMPT_EXHAUSTED_SIGN_UP,
    EAuthenticationErrorCodes.OAUTH_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GOOGLE_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GITHUB_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GITLAB_NOT_CONFIGURED,
    EAuthenticationErrorCodes.GOOGLE_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.GITHUB_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.GITLAB_OAUTH_PROVIDER_ERROR,
    EAuthenticationErrorCodes.INVALID_PASSWORD_TOKEN,
    EAuthenticationErrorCodes.EXPIRED_PASSWORD_TOKEN,
    EAuthenticationErrorCodes.INCORRECT_OLD_PASSWORD,
    EAuthenticationErrorCodes.MISSING_PASSWORD,
    EAuthenticationErrorCodes.INVALID_NEW_PASSWORD,
    EAuthenticationErrorCodes.PASSWORD_ALREADY_SET,
    EAuthenticationErrorCodes.ADMIN_ALREADY_EXIST,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME,
    EAuthenticationErrorCodes.INVALID_ADMIN_EMAIL,
    EAuthenticationErrorCodes.INVALID_ADMIN_PASSWORD,
    EAuthenticationErrorCodes.REQUIRED_ADMIN_EMAIL_PASSWORD,
    EAuthenticationErrorCodes.ADMIN_AUTHENTICATION_FAILED,
    EAuthenticationErrorCodes.ADMIN_USER_ALREADY_EXIST,
    EAuthenticationErrorCodes.ADMIN_USER_DOES_NOT_EXIST,
    EAuthenticationErrorCodes.ADMIN_USER_DEACTIVATED,
    EAuthenticationErrorCodes.RATE_LIMIT_EXCEEDED,
    EAuthenticationErrorCodes.PASSWORD_TOO_WEAK,
  ];

  if (bannerAlertErrorCodes.includes(errorCode))
    return {
      type: EErrorAlertType.BANNER_ALERT,
      code: errorCode,
      title: errorCodeMessages[errorCode]?.title || "Ошибка",
      message: errorCodeMessages[errorCode]?.message(email) || "Что-то пошло не так. Попробуйте ещё раз.",
    };

  return undefined;
};

export const passwordErrors = [
  EAuthenticationErrorCodes.PASSWORD_TOO_WEAK,
  EAuthenticationErrorCodes.INVALID_NEW_PASSWORD,
];

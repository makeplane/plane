/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export default {
  sidebar: {
    projects: "Proyectos",
    pages: "Páginas",
    new_work_item: "Nueva incidencia",
    home: "Inicio",
    your_work: "Tu trabajo",
    inbox: "Bandeja de entrada",
    workspace: "Espacio de trabajo",
    views: "Vistas",
    analytics: "Analíticas",
    work_items: "Incidencias",
    cycles: "Ciclos",
    modules: "Módulos",
    intake: "Captura",
    drafts: "Borradores",
    favorites: "Favoritos",
    pro: "Pro",
    upgrade: "Actualizar plan",
  },

  auth: {
    common: {
      email: {
        label: "Correo electrónico",
        placeholder: "nombre@empresa.com",
        errors: {
          required: "El correo electrónico es obligatorio",
          invalid: "El correo electrónico no es válido",
        },
      },
      password: {
        label: "Contraseña",
        set_password: "Establecer una contraseña",
        placeholder: "Introduce la contraseña",
        confirm_password: {
          label: "Confirmar contraseña",
          placeholder: "Confirmar contraseña",
        },
        current_password: {
          label: "Contraseña actual",
        },
        new_password: {
          label: "Nueva contraseña",
        },
      },
      back_to_sign_in: "Volver al inicio de sesión",
      resend_in: "Reenviar en {seconds} segundos",
      sign_in_with_unique_code: "Iniciar sesión con código único",
      forgot_password: "¿Has olvidado tu contraseña?",
    },
    sign_up: {
      header: {
        label: "Crea una cuenta para empezar a gestionar el trabajo con tu equipo.",
        step: {
          email: {
            header: "Registrarse",
            sub_header: "",
          },
          password: {
            header: "Registrarse",
            sub_header: "Regístrate usando una combinación de correo y contraseña.",
          },
          unique_code: {
            header: "Registrarse",
            sub_header: "Regístrate usando el código único enviado a tu dirección de correo electrónico.",
          },
        },
      },
      errors: {
        password: {
          strength: "Intenta establecer una contraseña fuerte para continuar",
        },
      },
    },
    sign_in: {
      header: {
        label: "Inicia sesión para empezar a gestionar el trabajo con tu equipo.",
        step: {
          email: {
            header: "Iniciar sesión o registrarse",
            sub_header: "",
          },
          password: {
            header: "Iniciar sesión o registrarse",
            sub_header: "Usa tu combinación de correo y contraseña para iniciar sesión.",
          },
          unique_code: {
            header: "Iniciar sesión o registrarse",
            sub_header: "Inicia sesión usando el código único enviado a tu dirección de correo electrónico.",
          },
        },
      },
    },
    forgot_password: {
      title: "Restablecer tu contraseña",
      description: "Introduce la dirección de correo electrónico verificada de tu cuenta y te enviaremos un enlace para restablecer tu contraseña.",
      email_sent: "Hemos enviado el enlace de restablecimiento a tu correo electrónico",
      send_reset_link: "Enviar enlace de restablecimiento",
      errors: {
        smtp_not_enabled: "Parece que el administrador no ha habilitado SMTP, no podremos enviar el enlace de restablecimiento",
      },
      toast: {
        success: {
          title: "Correo enviado",
          message: "Revisa tu bandeja de entrada. Si no aparece en unos minutos, revisa tu carpeta de spam.",
        },
        error: {
          title: "¡Error!",
          message: "Algo ha ido mal. Por favor, inténtalo de nuevo.",
        },
      },
    },
    reset_password: {
      title: "Establecer nueva contraseña",
      description: "Protege tu cuenta con una contraseña fuerte",
    },
    set_password: {
      title: "Protege tu cuenta",
      description: "Establecer una contraseña te ayuda a iniciar sesión de forma segura",
    },
    sign_out: {
      toast: {
        error: {
          title: "¡Error!",
          message: "Fallo al cerrar sesión. Por favor, inténtalo de nuevo.",
        },
      },
    },
  },
} as const;

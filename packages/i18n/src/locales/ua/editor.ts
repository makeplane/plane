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
  attachmentComponent: {
    uploader: {
      drag_and_drop: "Перетягніть для завантаження зовнішніх файлів",
    },
    errors: {
      file_too_large: {
        title: "Файл занадто великий.",
        description: "Максимальний розмір файлу {maxFileSize} МБ",
      },
      unsupported_file_type: {
        title: "Непідтримуваний тип файлу.",
        description: "Переглянути підтримувані формати",
      },
      default: {
        title: "Завантаження не вдалося.",
        description: "Щось пішло не так. Спробуйте ще раз.",
      },
    },
    upgrade: {
      description: "Оновіть план для перегляду цього вкладення.",
    },
    aria: {
      click_to_upload: "Натисніть для завантаження вкладення",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Перетворити на вбудований вміст",
      convert_to_link: "Перетворити на посилання",
      convert_to_richcard: "Перетворити на rich-картку",
    },
    placeholder: {
      insert_embed: "Вставте тут своє бажане посилання для вбудовування, наприклад, відео YouTube, дизайн Figma тощо",
      link: "Введіть або вставте посилання",
    },
    input_modal: {
      embed: "Вбудувати",
      works_with_links: "Працює з YouTube, Figma, Google Docs та іншими",
    },
    error: {
      not_valid_link: "Будь ласка, введіть дійсну URL-адресу.",
    },
  },
} as const;

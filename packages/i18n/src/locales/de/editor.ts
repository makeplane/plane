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
      drag_and_drop: "Zum Hochladen externe Dateien ziehen und ablegen",
    },
    errors: {
      file_too_large: {
        title: "Datei zu groß.",
        description: "Maximale Größe pro Datei ist {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Nicht unterstützter Dateityp.",
        description: "Unterstützte Formate anzeigen",
      },
      default: {
        title: "Upload fehlgeschlagen.",
        description: "Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.",
      },
    },
    upgrade: {
      description: "Aktualisieren Sie Ihren Plan, um diesen Anhang anzuzeigen.",
    },
    aria: {
      click_to_upload: "Klicken Sie, um Anhang hochzuladen",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "In Einbettung umwandeln",
      convert_to_link: "In Link umwandeln",
      convert_to_richcard: "In Rich Card umwandeln",
    },
    placeholder: {
      insert_embed: "Fügen Sie hier Ihren bevorzugten Einbettungslink ein, z.B. YouTube-Video, Figma-Design usw.",
      link: "Link eingeben oder einfügen",
    },
    input_modal: {
      embed: "Einbetten",
      works_with_links: "Funktioniert mit YouTube, Figma, Google Docs und mehr",
    },
    error: {
      not_valid_link: "Bitte geben Sie eine gültige URL ein.",
    },
  },
} as const;

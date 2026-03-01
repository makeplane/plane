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
      drag_and_drop: "Přetáhněte soubory pro nahrání externích souborů",
    },
    errors: {
      file_too_large: {
        title: "Soubor je příliš velký.",
        description: "Maximální velikost na soubor je {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Nepodporovaný typ souboru.",
        description: "Zobrazit podporované formáty",
      },
      default: {
        title: "Nahrávání selhalo.",
        description: "Něco se pokazilo. Zkuste to znovu.",
      },
    },
    upgrade: {
      description: "Upgradujte svůj plán pro zobrazení této přílohy.",
    },
    aria: {
      click_to_upload: "Klikněte pro nahrání přílohy",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Převést na vložený obsah",
      convert_to_link: "Převést na odkaz",
      convert_to_richcard: "Převést na bohatou kartu",
    },
    placeholder: {
      insert_embed: "Vložte svůj preferovaný odkaz pro vložení, například video YouTube, design Figma atd.",
      link: "Zadejte nebo vložte odkaz",
    },
    input_modal: {
      embed: "Vložit",
      works_with_links: "Funguje s YouTube, Figma, Google Docs a dalšími",
    },
    error: {
      not_valid_link: "Zadejte prosím platnou URL adresu.",
    },
  },
} as const;

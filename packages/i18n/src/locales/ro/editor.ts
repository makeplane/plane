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
      drag_and_drop: "Trageți și plasați pentru a încărca fișiere externe",
    },
    errors: {
      file_too_large: {
        title: "Fișier prea mare.",
        description: "Dimensiunea maximă per fișier este {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Tip de fișier neacceptat.",
        description: "Vezi formatele acceptate",
      },
      default: {
        title: "Încărcarea a eșuat.",
        description: "Ceva a mers prost. Vă rugăm să încercați din nou.",
      },
    },
    upgrade: {
      description: "Actualizați planul pentru a vizualiza această atașare.",
    },
    aria: {
      click_to_upload: "Faceți clic pentru a încărca atașamentul",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Convertește în încorporare",
      convert_to_link: "Convertește în link",
      convert_to_richcard: "Convertește în card bogat",
    },
    placeholder: {
      insert_embed: "Introduceți aici linkul preferat pentru încorporare, cum ar fi video YouTube, design Figma etc.",
      link: "Introduceți sau lipiți un link",
    },
    input_modal: {
      embed: "Încorporează",
      works_with_links: "Funcționează cu YouTube, Figma, Google Docs și altele",
    },
    error: {
      not_valid_link: "Vă rugăm să introduceți o adresă URL validă.",
    },
  },
} as const;

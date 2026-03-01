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
      drag_and_drop: "Trascina e rilascia per caricare file esterni",
    },
    errors: {
      file_too_large: {
        title: "File troppo grande.",
        description: "La dimensione massima per file è {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Tipo di file non supportato.",
        description: "Vedi formati supportati",
      },
      default: {
        title: "Caricamento fallito.",
        description: "Qualcosa è andato storto. Riprova.",
      },
    },
    upgrade: {
      description: "Aggiorna il tuo piano per visualizzare questo allegato.",
    },
    aria: {
      click_to_upload: "Clicca per caricare allegato",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Converti in incorporamento",
      convert_to_link: "Converti in link",
      convert_to_richcard: "Converti in scheda ricca",
    },
    placeholder: {
      insert_embed: "Inserisci qui il tuo link di incorporamento preferito, come video YouTube, design Figma, ecc.",
      link: "Inserisci o incolla un link",
    },
    input_modal: {
      embed: "Incorpora",
      works_with_links: "Funziona con YouTube, Figma, Google Docs e altro",
    },
    error: {
      not_valid_link: "Inserisci un URL valido.",
    },
  },
} as const;

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
      drag_and_drop: "Glissez-déposez pour télécharger des fichiers externes",
    },
    errors: {
      file_too_large: {
        title: "Fichier trop volumineux.",
        description: "La taille maximale par fichier est de {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Type de fichier non pris en charge.",
        description: "Voir les formats pris en charge",
      },
      default: {
        title: "Échec du téléchargement.",
        description: "Quelque chose s'est mal passé. Veuillez réessayer.",
      },
    },
    upgrade: {
      description: "Mettez à niveau votre plan pour voir cette pièce jointe.",
    },
    aria: {
      click_to_upload: "Cliquez pour télécharger la pièce jointe",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Convertir en intégration",
      convert_to_link: "Convertir en lien",
      convert_to_richcard: "Convertir en carte enrichie",
    },
    placeholder: {
      insert_embed: "Insérez votre lien d'intégration préféré ici, comme une vidéo YouTube, un design Figma, etc.",
      link: "Entrez ou collez un lien",
    },
    input_modal: {
      embed: "Intégrer",
      works_with_links: "Fonctionne avec YouTube, Figma, Google Docs et plus encore",
    },
    error: {
      not_valid_link: "Veuillez entrer une URL valide.",
    },
  },
} as const;

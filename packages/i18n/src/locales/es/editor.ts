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
      drag_and_drop: "Arrastra y suelta para subir archivos externos",
    },
    errors: {
      file_too_large: {
        title: "Archivo demasiado grande.",
        description: "El tamaño máximo por archivo es {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Tipo de archivo no compatible.",
        description: "Ver formatos compatibles",
      },
      default: {
        title: "Error al subir.",
        description: "Algo salió mal. Por favor, inténtelo de nuevo.",
      },
    },
    upgrade: {
      description: "Actualice su plan para ver este archivo adjunto.",
    },
    aria: {
      click_to_upload: "Haga clic para subir archivo adjunto",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Convertir a incrustación",
      convert_to_link: "Convertir a enlace",
      convert_to_richcard: "Convertir a tarjeta enriquecida",
    },
    placeholder: {
      insert_embed: "Inserte aquí su enlace de incrustación preferido, como video de YouTube, diseño de Figma, etc.",
      link: "Ingrese o pegue un enlace",
    },
    input_modal: {
      embed: "Incrustar",
      works_with_links: "Funciona con YouTube, Figma, Google Docs y más",
    },
    error: {
      not_valid_link: "Por favor, ingrese una URL válida.",
    },
  },
} as const;

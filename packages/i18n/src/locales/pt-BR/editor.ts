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
      drag_and_drop: "Arraste e solte para fazer upload de arquivos externos",
    },
    errors: {
      file_too_large: {
        title: "Arquivo muito grande.",
        description: "O tamanho máximo por arquivo é {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Tipo de arquivo não suportado.",
        description: "Ver formatos suportados",
      },
      default: {
        title: "Falha no upload.",
        description: "Algo deu errado. Tente novamente.",
      },
    },
    upgrade: {
      description: "Atualize seu plano para visualizar este anexo.",
    },
    aria: {
      click_to_upload: "Clique para fazer upload do anexo",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Converter para incorporação",
      convert_to_link: "Converter para link",
      convert_to_richcard: "Converter para cartão rico",
    },
    placeholder: {
      insert_embed: "Insira aqui seu link de incorporação preferido, como vídeo do YouTube, design do Figma, etc.",
      link: "Digite ou cole um link",
    },
    input_modal: {
      embed: "Incorporar",
      works_with_links: "Funciona com YouTube, Figma, Google Docs e mais",
    },
    error: {
      not_valid_link: "Por favor, insira uma URL válida.",
    },
  },
} as const;

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
      drag_and_drop: "Harici dosyaları yüklemek için sürükle ve bırak",
    },
    errors: {
      file_too_large: {
        title: "Dosya çok büyük.",
        description: "Dosya başına maksimum boyut {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Desteklenmeyen dosya türü.",
        description: "Desteklenen formatları gör",
      },
      default: {
        title: "Yükleme başarısız.",
        description: "Bir şeyler ters gitti. Lütfen tekrar deneyin.",
      },
    },
    upgrade: {
      description: "Bu eki görüntülemek için planınızı yükseltin.",
    },
    aria: {
      click_to_upload: "Ek yüklemek için tıklayın",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Gömülü içeriğe dönüştür",
      convert_to_link: "Bağlantıya dönüştür",
      convert_to_richcard: "Zengin karta dönüştür",
    },
    placeholder: {
      insert_embed: "YouTube videosu, Figma tasarımı vb. tercih ettiğiniz gömme bağlantısını buraya ekleyin",
      link: "Bir bağlantı girin veya yapıştırın",
    },
    input_modal: {
      embed: "Göm",
      works_with_links: "YouTube, Figma, Google Docs ve daha fazlasıyla çalışır",
    },
    error: {
      not_valid_link: "Lütfen geçerli bir URL girin.",
    },
  },
} as const;

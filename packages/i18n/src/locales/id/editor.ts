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
      drag_and_drop: "Seret dan lepas untuk mengunggah file eksternal",
    },
    errors: {
      file_too_large: {
        title: "File terlalu besar.",
        description: "Ukuran maksimum per file adalah {maxFileSize} MB",
      },
      unsupported_file_type: {
        title: "Jenis file tidak didukung.",
        description: "Lihat format yang didukung",
      },
      default: {
        title: "Upload gagal.",
        description: "Terjadi kesalahan. Silakan coba lagi.",
      },
    },
    upgrade: {
      description: "Tingkatkan paket Anda untuk melihat lampiran ini.",
    },
    aria: {
      click_to_upload: "Klik untuk mengunggah lampiran",
    },
  },
  externalEmbedComponent: {
    block_menu: {
      convert_to_embed: "Ubah menjadi konten tertanam",
      convert_to_link: "Ubah menjadi tautan",
      convert_to_richcard: "Ubah menjadi kartu kaya",
    },
    placeholder: {
      insert_embed: "Masukkan tautan tertanam pilihan Anda di sini, seperti video YouTube, desain Figma, dll.",
      link: "Masukkan atau tempel tautan",
    },
    input_modal: {
      embed: "Tanam",
      works_with_links: "Bekerja dengan YouTube, Figma, Google Docs dan lainnya",
    },
    error: {
      not_valid_link: "Silakan masukkan URL yang valid.",
    },
  },
} as const;

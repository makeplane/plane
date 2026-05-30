# Hướng Dẫn Tạo Nội Dung Trung Tâm Trợ Giúp

> **Khán giả:** Admins Shinhan Bank (God Mode). Tất cả nội dung được chia sẻ trên tất cả ~100 phòng ban — không phải từng phòng ban.

## Tổng Quan

Trung Tâm Trợ Giúp (Help Center) là một nguồn hướng dẫn toàn cầu trong ứng dụng Shinhan Workspace. Điều này giúp nhân viên của bạn tìm câu trả lời nhanh chóng từ giao diện đăng nhập.

**Cách người dùng truy cập:**
- Nhấp vào biểu tượng **"?"** trong menu top nav → Dẫn đến `/help`
- Nhấn **Cmd+K** → Gõ "Trung Tâm Trợ Giúp" → Dẫn đến `/help`
- Nội dung hiển thị cho **tất cả nhân viên** (bất kỳ phòng ban nào)

**Bạn có thể truy cập nhà soạn thảo tại:** Admin panel → Trung Tâm Trợ Giúp (menu chính)

---

## Nội Dung Dưới Dạng Mã (Content-as-Code)

Ngoài giao diện Admin (God Mode), các nhà phát triển có thể quản lý nội dung trung tâm trợ giúp dưới dạng **markdown có cấu trúc** trong repository. Phương pháp này là **nguồn sự thật chính thức** cho nội dung seeded; nội dung UI của God Mode sẽ được đảo ngược khi re-seed lại từ mã.

### Cấu Trúc Nguồn

Tất cả tệp nguồn nằm ở: `apps/api/plane/db/fixtures/help_center/`

```
fixtures/help_center/
├── categories.yaml                 # Định nghĩa danh mục (biểu tượng, thứ tự, tên đa ngôn ngữ)
├── getting-started/
│   ├── article-one.vi.md          # Bài viết VI (frontmatter + markdown)
│   ├── article-one.en.md          # Bài viết EN
│   └── article-one.ko.md          # Bài viết KO (tùy chọn)
├── project-management/
│   ├── create-project.vi.md
│   └── ...
└── [more-categories]/
```

### Thêm Danh Mục Mới

Chỉnh sửa `apps/api/plane/db/fixtures/help_center/categories.yaml`:

```yaml
- slug: getting-started
  icon: play_circle          # Tên biểu tượng Material Design
  color: "5B5B5B"           # Màu HEX (tùy chọn)
  sort_order: 10
  names:
    vi: "Bắt Đầu Nhanh"
    en: "Getting Started"
    ko: "빨리 시작하기"

- slug: advanced-topics
  icon: settings
  sort_order: 20
  names:
    vi: "Chủ Đề Nâng Cao"
    en: "Advanced Topics"
    ko: "고급 주제"
```

**Lưu ý:** `sort_order` xác định thứ tự danh mục trên giao diện `/help`.

### Viết Bài Viết Mới

Tạo một tệp: `apps/api/plane/db/fixtures/help_center/<category-slug>/<article-slug>.<locale>.md`

**Ví dụ:** `apps/api/plane/db/fixtures/help_center/getting-started/create-first-issue.vi.md`

```markdown
---
category: getting-started
slug: create-first-issue
sort_order: 10
title: Cách Tạo Công Việc Đầu Tiên
status: published
---

Công việc (issue) là đơn vị cơ bản của dự án. Hướng dẫn này sẽ dạy bạn cách tạo công việc đầu tiên.

## Bước 1: Mở Dự Án

1. Đăng nhập vào Shinhan Workspace
2. Chọn dự án từ danh sách bên trái

## Bước 2: Tạo Công Việc

Nhấp nút **"+ Công Việc"** ở góc trên cùng bên phải.

{{screenshot:tao-cong-viec-modal}}

Một modal sẽ mở ra. Nhập tiêu đề (ví dụ: "Sửa lỗi đăng nhập").

## Bước 3: Lưu

Nhấp **"Tạo"** để lưu công việc.
```

**Frontmatter (metadata):**
- `category`: slug danh mục (phải tồn tại trong `categories.yaml`)
- `slug`: định danh duy nhất toàn cầu của bài viết (không có khoảng trắng, dùng dấu gạch ngang)
- `sort_order`: thứ tự trong danh mục (số nguyên)
- `title`: tiêu đề hiển thị
- `status`: `"published"` hoặc `"draft"`

**Markdown Body:** Dùng Markdown tiêu chuẩn (tiêu đề, danh sách, bảng, v.v.).

### Hình Ảnh & Ảnh Chụp Màn Hình

Bài viết có thể bao gồm một **placeholder ảnh chụp màn hình** để được injected sau này:

```markdown
{{screenshot:NAME}}
```

Ví dụ: `{{screenshot:tao-cong-viec-modal}}` — tên phải khớp với một target trong `tools/help-screenshots/targets.json`.

**Cách thức hoạt động:**
1. Loader chuyển placeholder thành marker: `<p data-help-screenshot="NAME"></p>`
2. Công cụ chụp ảnh (`tools/help-screenshots/`) chụp các ảnh và tạo tệp PNG (ví dụ: `tao-cong-viec-modal.png`)
3. Lệnh `inject_help_screenshots` tải PNG lên, lưu trữ dưới dạng tài sản toàn cầu (không per-workspace), và thay thế marker bằng `<img>` tag
4. Ảnh được phục vụ qua `/api/assets/v2/static/{id}/` — định danh instance-specific, **không hardcoded trong git**

Xem hướng dẫn chụp ảnh ở `tools/help-screenshots/README.md`.

### Dịch Sang Các Ngôn Ngữ Khác

Tạo các tệp bổ sung:
- `<article-slug>.en.md` (tiếng Anh)
- `<article-slug>.ko.md` (tiếng Hàn, tùy chọn)

**Lưu ý:** Các tệp dịch không cần frontmatter — chúng sử dụng metadata từ tệp VI. Chỉ cần nội dung markdown.

**Sai:**
```markdown
---
slug: my-article
category: getting-started
---
Content in English
```

**Đúng:**
```markdown
Content in English (no frontmatter, metadata from .vi.md)
```

### Quy Trình Seed (Tải Nội Dung)

Chạy lệnh này bên trong container API:

```bash
docker exec planeso-api-1 sh -c 'cd /code && python manage.py seed_help_center'
```

**Hành động:**
- Đọc tất cả tệp `.md` từ `fixtures/help_center/`
- Render markdown → HTML → sanitize → inject screenshot markers
- Upsert các danh mục + bài viết vào database (idempotent)
- **Không xóa** bài viết trong DB nếu chúng không tồn tại trong source tree (bảo vệ nội dung được viết bằng God Mode)

**Quan trọng:** Seed là **additive only** — nó không xóa các bài viết hoặc danh mục. Nếu bạn muốn xóa nội dung seeded, xóa mềm nó một cách rõ ràng trong database.

### Sanitization (Bảo Mật)

Loader sử dụng một **whitelist HTML cứng** (`nh3` library):
- Cho phép: `<p>`, `<h1>`–`<h6>`, `<strong>`, `<em>`, `<a>`, `<ul>`, `<ol>`, `<img>`, `<table>`, v.v.
- Loại bỏ: `<script>`, `<iframe>`, `<video>`, `<style>`, `on*` attributes
- **Raw HTML trong markdown được ESCAPE** trước sanitizing, vì vậy bạn không thể nhúng mã JavaScript

Điều này có nghĩa là bạn có thể viết Markdown sạch mà không lo lắng về các cuộc tấn công XSS.

### Perms & Ai Có Thể Làm Gì?

- **God Mode (Admin):** Chỉnh sửa + xem trước bài viết trong giao diện `/admin/help-center`
- **Nhà Phát Triển:** Chỉnh sửa tệp markdown + chạy `seed_help_center`
- **Tất Cả Người Dùng Đã Xác Thực:** Xem bài viết tại `/help`

Thay đổi từ developer (`git push`) và thay đổi từ admin UI là **bình đẳng** — re-seed sẽ đảo ngược UI edits và sử dụng markdown làm source of truth.

---

## Giao Diện Admin (Nhà Soạn Thảo)

### Khu Vực Chính

**Thanh bên trái (Danh sách):**
- Danh mục (categories): nhóm các bài viết liên quan
- Bài viết (articles): nội dung riêng lẻ

**Vùng chính (Editor):**
- Trình soạn thảo Rich Text (với công cụ cố định phía trên)
- Bảng chọn Ngôn ngữ (VI, EN, KO) — chuyển đổi để chỉnh sửa bản dịch
- Nút **Preview** — xem trước (không chế độ chỉnh sửa)
- Nút **Publish** — lưu và công bố bài viết

### Thanh Công Cụ Cố Định (Editor Toolbar)

Bạn sẽ thấy các nút định dạng tiêu chuẩn ở trên cùng của trình soạn thảo:

| Nút                      | Tác Vụ                                        |
|--------------------------|-----------------------------------------------|
| **B / I / U / S**        | In đậm / Nghiêng / Gạch dưới / Gạch ngang    |
| **H1 ... H6**            | Heading (tiêu đề cấp 1 đến 6)                |
| **Bullet List**          | Danh sách có dấu đầu dòng                    |
| **Numbered List**        | Danh sách có số                              |
| **Link**                 | Thêm siêu liên kết                           |
| **Image**                | Chèn hình ảnh (xem phần Hình Ảnh dưới)      |
| **Code Block**           | Khối mã định dạng sẵn                        |
| **Quote**                | Trích dẫn (blockquote)                       |
| **Table**                | Chèn bảng                                    |

---

## Tạo Một Danh Mục (Category)

Danh mục nhóm các bài viết cùng chủ đề. Ví dụ: "Bắt Đầu", "Quản Lý Dự Án", "Báo Cáo".

### Bước 1: Truy Cập Danh Sách Danh Mục

1. Mở Admin Panel → **Trung Tâm Trợ Giúp**
2. Ở phía trên bên trái, bạn sẽ thấy nút **"+ Danh Mục"** (hoặc tương tự)

### Bước 2: Tạo Danh Mục Mới

1. Nhấp **"+ Danh Mục"**
2. Nhập tên danh mục tiếng Việt (ví dụ: "Bắt Đầu Nhanh")
3. Chọn **biểu tượng** (icon) để đại diện cho danh mục
4. Nếu cần, nhập mô tả tóm tắt
5. Nhấp **Tạo**

### Bước 3: Dịch Danh Mục Sang EN / KO

Sau khi tạo danh mục, bạn có thể thêm các ngôn ngữ khác:

1. Chọn danh mục vừa tạo từ danh sách bên trái
2. Chuyển tab sang **EN** (tiếng Anh)
3. Nhập tên tiếng Anh + mô tả
4. Nhấp **Lưu**
5. Lặp lại cho **KO** (tiếng Hàn)

---

## Viết Một Bài Viết (Article)

### Bước 1: Tạo Bài Viết Mới

1. Chọn **danh mục** từ danh sách bên trái
2. Nhấp **"+ Bài Viết"** (hoặc tương tự)
3. Nhập tiêu đề bài viết (VI)
4. Nội dung sẽ mở ra trong trình soạn thảo

### Bước 2: Viết Nội Dung Bằng Tiếng Việt

1. **Tiêu đề:** Đã điền, bạn có thể chỉnh sửa lại nếu cần
2. **Nội dung chính:**
   - Dùng thanh công cụ để định dạng (in đậm, tiêu đề, danh sách, v.v.)
   - Viết rõ ràng, tập trung vào cách giải quyết vấn đề
   - **Mẹo:** Bắt đầu bằng một đoạn tóm tắt rõ ràng (2-3 câu)
   - Sử dụng tiêu đề phụ để phân chia bài viết thành các phần nhỏ

### Bước 3: Thêm Hình Ảnh (Nếu Cần)

1. Đặt con trỏ nơi bạn muốn chèn hình ảnh
2. Nhấp nút **Image** trong toolbar
3. Một hộp thoại sẽ xuất hiện để **tải lên** hình ảnh từ máy tính
4. Chọn tệp và **tải lên**
5. Hình ảnh sẽ được chèn vào bài viết

**Về hình ảnh:**
- ✅ Hỗ trợ: JPG, PNG, GIF, WebP
- ❌ Không hỗ trợ: Video, iframe nhúng, tệp phương tiện khác (vì lý do bảo mật)
- **Lưu ý:** Hình ảnh chưa hỗ trợ văn bản thay thế (alt text). Workaround: Hãy thêm một đoạn mô tả dưới hình ảnh để người dùng biết nó là gì.
- Hình ảnh được lưu trữ toàn cầu (một hình ảnh = tất cả phòng ban có thể thấy)

### Bước 4: Xem Trước Bài Viết

1. Nhấp **Preview** ở trên cùng
2. Bạn sẽ thấy bài viết như một người dùng sẽ nhìn thấy
3. Kiểm tra định dạng, khoảng trắng, liên kết
4. Quay lại chỉnh sửa bằng cách nhấp **Edit**

### Bước 5: Dịch Sang EN / KO

Sau khi viết xong bản VI, dịch sang các ngôn ngữ khác:

1. Nhấp tab **EN** ở trên bảng soạn thảo
2. Hệ thống sẽ hiển thị một trình soạn thảo trống cho phiên bản tiếng Anh
3. **Dịch tiêu đề** bài viết sang tiếng Anh
4. **Dịch nội dung** — cử từng phần từ bản VI, giữ cùng cấu trúc định dạng
5. **Thêm cùng hình ảnh** nếu bạn muốn (hình ảnh được chia sẻ trên tất cả ngôn ngữ)
6. Nhấp **Lưu**
7. Lặp lại cho **KO** (tiếng Hàn)

**Lưu ý:** Nếu bạn không dịch một ngôn ngữ, người dùng sẽ thấy phiên bản tiếng Anh làm dự phòng.

---

## Công Bố (Publishing)

### Khi Nào Công Bố?

- **Công bố bài viết** khi bạn chắc chắn nội dung đã sẵn sàng cho người dùng
- Bạn có thể lưu bản nháp mà không công bố (nhưng người dùng sẽ không thấy)
- **Bắt buộc:** Ít nhất một ngôn ngữ phải có tiêu đề để công bố

### Bước Công Bố

1. Hoàn thành chỉnh sửa (VI + EN + KO tùy chọn)
2. Nhấp **Publish** ở trên cùng
3. Hệ thống sẽ xác nhận việc công bố
4. Bài viết bây giờ **hiển thị cho tất cả người dùng** tại `/help`

**Cảnh báo:** Khi bạn công bố lại một phiên bản ngôn ngữ (ví dụ: cập nhật EN), nó sẽ **thay thế hoàn toàn** phiên bản trước đó. Không có lịch sử phiên bản. Hãy chắc chắn trước khi công bố!

---

## Tổ Chức & Thứ Tự

### Sắp Xếp Danh Mục

1. Trong danh sách danh mục bên trái, bạn có thể **kéo và thả** danh mục để sắp xếp
2. Danh mục sẽ hiển thị theo thứ tự này khi người dùng truy cập `/help`

### Sắp Xếp Bài Viết Trong Danh Mục

1. Chọn một danh mục
2. Bài viết sẽ liệt kê bên cạnh
3. **Kéo và thả** các bài viết để thay đổi thứ tự
4. Bài viết hàng đầu sẽ hiển thị trước

---

## Tìm Kiếm

Người dùng có thể **tìm kiếm** bài viết của bạn từ trang `/help`:

1. Một hộp tìm kiếm sẽ xuất hiện ở trên cùng
2. Gõ từ khóa (VI, EN, hoặc KO)
3. Tìm kiếm **không phân biệt dấu** (ví dụ: "da" sẽ khớp với "đã", "để", "đảng", v.v.)
4. Kết quả sẽ bao gồm các bài viết khớp từ **tất cả ngôn ngữ**

**Mẹo:** Hãy sử dụng các từ khóa mô tả rõ ràng trong tiêu đề và nội dung bài viết để giúp người dùng tìm thấy.

---

## Ngôn Ngữ & Dự Phòng (Locale Fallback)

Khi một người dùng truy cập `/help`:

1. Hệ thống kiểm tra ngôn ngữ của trình duyệt / tài khoản (VI, EN, KO)
2. Nếu bài viết có phiên bản cho ngôn ngữ đó → **hiển thị phiên bản đó**
3. Nếu không → **fallback sang tiếng Anh**
4. Nếu không có tiếng Anh → **sử dụng bất kỳ ngôn ngữ nào có sẵn**

**Thông báo Dự Phòng:** Nếu người dùng thấy bài viết không phải ngôn ngữ họ yêu cầu, một thông báo nhỏ sẽ xuất hiện (ví dụ: "Bài viết này không có sẵn bằng tiếng Việt, hiển thị bằng tiếng Anh").

---

## Giới Hạn & Lưu Ý

### ✅ Những Gì Bạn Có Thể Làm

- ✅ Định dạng chữ (in đậm, nghiêng, gạch chân, gạch ngang)
- ✅ Tiêu đề (H1–H6)
- ✅ Danh sách có dấu đầu dòng và danh sách có số
- ✅ Siêu liên kết (links)
- ✅ Hình ảnh (JPG, PNG, GIF, WebP)
- ✅ Bảng (table)
- ✅ Khối mã (code blocks)
- ✅ Trích dẫn (blockquote)

### ❌ Những Gì Bạn KHÔNG Thể Làm

- ❌ **Video nhúng** — không hỗ trợ (vi phạm chính sách bảo mật broadcast)
- ❌ **iframe nhúng** — không hỗ trợ (vì lý do bảo mật)
- ❌ **Tập tin media khác** — không hỗ trợ
- ❌ **Văn bản thay thế hình ảnh (alt text)** — editor chưa hỗ trợ (workaround: thêm mô tả dưới ảnh)
- ❌ **Lịch sử phiên bản** — công bố sẽ ghi đè hoàn toàn phiên bản trước

**Workaround cho Video:** Nếu bạn cần chia sẻ một video, hãy:
1. Tải video lên một dịch vụ tương tự YouTube hoặc Vimeo
2. Trong bài viết, thêm một **liên kết** đến video đó (ví dụ: "Xem video hướng dẫn")
3. Nêu một **ảnh chụp màn hình** của video với mô tả dưới đó

---

## Ví Dụ: Viết Một Bài Viết Hoàn Chỉnh

### Tình Huống

Bạn muốn viết bài viết về "Cách Tạo Một Vấn Đề (Issue)".

### Tiêu Đề

**VI:** "Cách Tạo Một Vấn Đề Mới"

### Nội Dung VI

```
Vấn đề (issue) là một tác vụ hoặc lỗi mà bạn muốn theo dõi trong dự án.
Hướng dẫn này sẽ hướng dẫn bạn từng bước.

## Bước 1: Mở Dự Án

1. Đăng nhập vào Shinhan Workspace
2. Chọn dự án của bạn từ danh sách

## Bước 2: Tạo Vấn Đề

1. Nhấp nút "+ Vấn Đề" ở góc trên cùng
2. Nhập tiêu đề cho vấn đề (ví dụ: "Sửa lỗi đăng nhập")
3. Nếu cần, thêm mô tả chi tiết

## Bước 3: Gán Người Giao

1. Nhấp vào trường "Người Giao"
2. Chọn thành viên dự án
3. Nhấp "Lưu"

Vấn đề của bạn bây giờ được tạo và các thành viên khác sẽ thấy nó!
```

### Hình Ảnh

Chèn một ảnh chụp màn hình show nút "+ Vấn Đề" với chú thích: "Nhân nút này để bắt đầu tạo vấn đề mới."

### Tiêu Đề EN

"How to Create a New Issue"

### Nội Dung EN

(Dịch toàn bộ nội dung VI sang tiếng Anh, giữ cùng cấu trúc)

### Tiêu Đề KO

"새 문제를 만드는 방법"

### Nội Dung KO

(Tương tự)

### Công Bố

Nhấp **Publish** để lưu và công bố tất cả 3 ngôn ngữ.

---

## Câu Hỏi Thường Gặp

### Q: Làm cách nào để cập nhật bài viết đã công bố?

**A:** Bạn có thể chỉnh sửa bài viết bất kỳ lúc nào. Chỉ cần mở bài viết, thực hiện thay đổi và công bố lại. Bài viết sẽ được cập nhật ngay lập tức cho tất cả người dùng. **Cảnh báo:** Không có lịch sử; công bố sẽ thay thế hoàn toàn phiên bản cũ.

### Q: Tôi có thể xóa một danh mục hoặc bài viết không?

**A:** Có. Mở danh mục/bài viết và tìm nút **Xóa**. Nó sẽ xóa mềm (dữ liệu được lưu nhưng không hiển thị). Không thể phục hồi trực tiếp; liên hệ với admin hệ thống nếu bạn cần khôi phục.

### Q: Bài viết của tôi sẽ không hiển thị cho ai?

**A:** Bài viết chỉ hiển thị nếu nó được **công bố**. Nếu bạn chỉ lưu bản nháp, nó sẽ không được công bố.

### Q: Người dùng có thể tìm kiếm bài viết của tôi không?

**A:** Có. Tìm kiếm sẽ quét tất cả tiêu đề và nội dung (cả 3 ngôn ngữ) và tìm kiếm không phân biệt dấu.

### Q: Tôi có thể thêm liên kết đến trang khác (như tài liệu bên ngoài) không?

**A:** Có. Sử dụng nút **Link** trong toolbar để thêm một siêu liên kết đến bất kỳ URL nào.

### Q: Hình ảnh của tôi được chia sẻ giữa các ngôn ngữ không?

**A:** Có. Khi bạn chèn hình ảnh trong phiên bản VI, hình ảnh đó cũng sẽ xuất hiện trong phiên bản EN và KO (nếu bạn đặt nó). Bạn không cần tải lên cùng một hình ảnh nhiều lần.

### Q: Tôi có thể sửa một hình ảnh sau khi chèn không?

**A:** Bạn không thể chỉnh sửa hình ảnh trong editor. Nếu bạn cần thay đổi hình ảnh, hãy xóa nó và chèn một hình ảnh mới.

### Q: Có bao nhiêu bài viết tôi có thể tạo?

**A:** Không có giới hạn. Hãy tạo bao nhiêu bài viết bạn cần để giúp người dùng của mình.

---

## Mẹo & Best Practices

1. **Viết rõ ràng:** Sử dụng câu ngắn, tránh thuật ngữ kỹ thuật nếu có thể.
2. **Sử dụng tiêu đề:** Chia bài viết dài thành các phần nhỏ với tiêu đề H2/H3.
3. **Thêm hình ảnh:** Ảnh chụp màn hình giúp người dùng theo dõi dễ dàng hơn.
4. **Liên kết liên quan:** Nếu bài viết của bạn liên quan đến bài viết khác, hãy thêm liên kết.
5. **Dịch chính xác:** Hãy có một người khác kiểm tra các bản dịch (EN/KO) trước khi công bố.
6. **Kiểm tra dự phòng:** Thử truy cập `/help` từ trình duyệt khác nhau để kiểm tra cách trang hiển thị.
7. **Cập nhật thường xuyên:** Nếu Shinhan Workspace thay đổi, hãy cập nhật các bài viết liên quan.

---

## Hỗ Trợ

Nếu bạn gặp vấn đề với trình soạn thảo hoặc cần hỗ trợ:

- Liên hệ với **Quản Trị Viên Hệ Thống** (God Mode controller)
- Hoặc gửi phản hồi qua Cmd+K → "Help" (trong ứng dụng)

---

**Cập nhật lần cuối:** 2026-05-30

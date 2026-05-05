# Workflow Rejection UI — Phân tích từng Layout

## Tóm tắt API

### PATCH Request (khi thay đổi state)

```
PATCH https://api.plane.so/api/workspaces/csms-ss/projects/<project_id>/issues/<issue_id>/
Body: { "state": "<state_uuid>" }
```

### Response khi bị từ chối (403 Forbidden)

- HTTP Status: **403 Forbidden**
- Message từ API: **"You are not permitted to make this state transition."** (hoặc tương đương)
- Toast UI: `"Error! / Error while updating work item"`

---

## 1. Kanban Layout

![Kanban Rejection](file:///Users/ngoctran/.gemini/antigravity/brain/4a38b70d-fea0-4adb-b78d-f5b820f985a3/kanban_rejection_reaction_1772622238455.png)

**Cách từ chối:**

- User kéo thả (drag-and-drop) card từ cột này sang cột khác.
- API gọi `PATCH /issues/<id>/` với `state` mới.
- API trả về **403 Forbidden**.
- Card **snap back** (tự động quay về vị trí cũ).
- Xuất hiện **toast ở góc dưới phải** màu đỏ:
  - Tiêu đề: **"Error!"** (icon ❌ vòng tròn đỏ)
  - Nội dung: **"Error while updating work item"**

---

## 2. List Layout

![List Layout with State Dropdown](file:///Users/ngoctran/.gemini/antigravity/brain/4a38b70d-fea0-4adb-b78d-f5b820f985a3/.system_generated/click_feedback/click_feedback_1772622554292.png)

**Cách từ chối:**

- User click vào badge state của issue (hiển thị "Draft"), dropdown xuất hiện với các states: Draft ✓, Todo, In Progress, Done, Cancelled.
- Khi user chọn state mới (ví dụ "Todo"), API gọi `PATCH /issues/<id>/` với state mới.
- API trả về **403 Forbidden**.
- **Toast đỏ** hiện ở góc dưới phải: `"Error while updating work item"`.
- Badge state **không thay đổi**, giữ nguyên "Draft".
- State dropdown dropdown đóng lại sau khi chọn.

---

## 3. Calendar Layout

![Calendar Layout](file:///Users/ngoctran/.gemini/antigravity/brain/4a38b70d-fea0-4adb-b78d-f5b820f985a3/.system_generated/click_feedback/click_feedback_1772622585079.png)

**Quan sát:**

- Calendar layout hiển thị theo tuần/tháng (March 2026).
- Các issues không có ngày due/start sẽ không hiển thị trong calendar.
- **State change** trong Calendar layout không phải thao tác chính — calendar cho phép drag ngày.
- Nếu có state thay đổi qua calendar, cùng toast error sẽ xuất hiện.

---

## 4. Gantt Layout

![Gantt Layout](file:///Users/ngoctran/.gemini/antigravity/brain/4a38b70d-fea0-4adb-b78d-f5b820f985a3/.system_generated/click_feedback/click_feedback_1772622955372.png)

**Quan sát:**

- Gantt layout hiển thị các issues theo timeline của tuần.
- Issues có start/due date được thể hiện như horizontal bars.
- CSMS-7 có thanh Gantt hiển thị.
- **State change** trong Gantt thường qua sidebar khi click vào issue.
- Nếu state change bị từ chối, toast error xuất hiện cùng cơ chế như List/Kanban.

---

## 5. Spreadsheet Layout

![Spreadsheet Layout](file:///Users/ngoctran/.gemini/antigravity/brain/4a38b70d-fea0-4adb-b78d-f5b820f985a3/.system_generated/click_feedback/click_feedback_1772622962538.png)

**Cách từ chối:**

- Spreadsheet hiển thị tất cả issues dạng bảng với cột State.
- User click vào cột "State" (ví dụ "Draft") của một row.
- Dropdown xuất hiện để chọn state mới.
- API gọi `PATCH /issues/<id>/` với state mới.
- API trả về **403 Forbidden**.
- **Toast đỏ** tương tự: `"Error while updating work item"`.
- Giá trị cột State **không thay đổi**, giữ nguyên.

---

## Nhận xét chung

| Layout          | Cách trigger state change        | Cơ chế reject UI                 |
| --------------- | -------------------------------- | -------------------------------- |
| **Kanban**      | Drag-and-drop card giữa columns  | Card snap-back + toast error     |
| **List**        | Click badge state → dropdown     | Dropdown close + toast error     |
| **Calendar**    | Không có state control trực tiếp | N/A (calendar chủ yếu cho dates) |
| **Gantt**       | Click issue → sidebar state      | Toast error (tương tự List)      |
| **Spreadsheet** | Click state cell → dropdown      | Cell không đổi + toast error     |

**Toast chung tất cả layouts:**

- Position: bottom-right
- Style: Đỏ, icon ❌
- Title: "Error!"
- Message: "Error while updating work item"

**API Pattern:**

- Endpoint: `PATCH /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/`
- Body: `{ "state": "<state_uuid>" }`
- Error Response: `403 Forbidden` với message từ chối của workflow

---

## Hàm ý cho Implementation (CE)

1. **Frontend cần bắt 403 error** khi PATCH issue và hiển thị toast error.
2. **Kanban drag**: Sau khi API trả 403, cần trigger re-render để snap card về vị trí cũ.
3. **Có thể cần thêm blocker message** cụ thể hơn (`"This state transition is not permitted by the workflow"`) thay vì generic error.
4. **PRO**: Có thể show modal/overlay giải thích reviewer cần approve (theo doc).
5. **Tất cả 5 layouts** đều dùng cùng PATCH API, chỉ khác cách trigger.

# Camp Report App – Full Stack

## Stack

- Backend: NestJS 11 + TypeScript, port 3000, MongoDB (Mongoose 9)
- Frontend: React 19 + Vite 8 + TypeScript, port 5173
- UI: AntDesign 6 + Tailwind CSS 4 + TanStack Query 5
- Auth: JWT (passport-jwt) + bcrypt, token expiry 7 ngày
- File parsing: xlsx, csv-parser, multer

## Cấu trúc thư mục

```
camp-report-app/
├── backend/          ← NestJS (backend-teammate sở hữu)
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── auth/           ← Auth module (register, login, JWT)
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/        (register.dto.ts, login.dto.ts)
│       │   ├── schemas/    (user.schema.ts)
│       │   └── strategies/ (jwt.strategy.ts, local.strategy.ts)
│       ├── import/         ← Import module (file upload & processing)
│       │   ├── import.controller.ts
│       │   ├── import.service.ts
│       │   ├── dto/        (upload-import.dto.ts)
│       │   └── schemas/    (import-session.schema.ts, import-record.schema.ts)
│       ├── report/         ← Report module (aggregation & compare)
│       │   ├── report.controller.ts
│       │   ├── report.service.ts
│       │   └── report.module.ts
│       ├── saved-products/ ← Saved Products module (bookmark mã hàng hóa)
│       │   ├── saved-products.controller.ts
│       │   ├── saved-products.service.ts
│       │   ├── saved-products.module.ts
│       │   ├── dto/        (create-saved-product.dto.ts)
│       │   └── schemas/    (saved-product.schema.ts)
│       ├── product-folders/ ← Product Folders module (phân loại sản phẩm vào folder)
│       │   ├── product-folders.controller.ts
│       │   ├── product-folders.service.ts
│       │   ├── product-folders.module.ts
│       │   ├── dto/        (create-folder.dto.ts, update-folder.dto.ts)
│       │   └── schemas/    (product-folder.schema.ts)
│       ├── user-preferences/ ← User Preferences module (highlight state)
│       │   ├── user-preferences.controller.ts
│       │   ├── user-preferences.service.ts
│       │   ├── user-preferences.module.ts
│       │   ├── dto/        (update-highlighted-sub-ids.dto.ts)
│       │   └── schemas/    (user-preference.schema.ts)
│       └── common/
│           ├── guards/        (jwt-auth.guard.ts, roles.guard.ts)
│           ├── decorators/    (roles.decorator.ts)
│           ├── interceptors/  (response.interceptor.ts)
│           └── middleware/     (request-logger.middleware.ts)
├── frontend/         ← React (frontend-teammate sở hữu)
│   └── src/
│       ├── main.tsx, App.tsx, index.css
│       ├── api/         (axios.ts – interceptor auto-attach token)
│       ├── components/  (AppLayout.tsx, ProtectedRoute.tsx, SavedProductsPanel.tsx, SaveFolderModal.tsx)
│       ├── hooks/       (useAuth.ts, useReport.ts, useHighlight.ts, useSavedProducts.ts, useProductFolders.ts, useImportSessions.ts)
│       ├── pages/       (LoginPage, RegisterPage, DashboardPage, ImportPage, ReportPage, SavedProductsPage, AdminUsersPage)
│       └── types/       (index.ts)
├── samples/          ← File mẫu để đọc cấu trúc cột
└── CLAUDE.md
```

## Domain Logic – ĐỌC KỸ

### File Hộ Kinh Doanh (.xlsx hoặc .csv)

- Cột cần: `Tên chiến dịch`, `Số tiền đã chi tiêu (VND)`
- Lọc các dòng có `Số tiền đã chi tiêu (VND)` > 0
- Nếu `Tên chiến dịch` có dấu `-`: Sub ID = phần CUỐI sau dấu `-` cuối cùng
  - VD: "17396120189-SHPAAP0725-DXYTuiXinh2101" → Sub ID = "DXYTuiXinh2101"
- Nếu `Tên chiến dịch` KHÔNG có dấu `-`: Sub ID = toàn bộ Tên chiến dịch
  - VD: "DXYTuiXinh2101" → Sub ID = "DXYTuiXinh2101"
- CP = giá trị `Số tiền đã chi tiêu (VND)`, group by Sub ID

### File AffiliateCommissionReport (.csv hoặc .xlsx)

- Cột cần: `Sub_id1`, `Sub_id2`, `Tổng hoa hồng đơn hàng(₫)`
- DT = tổng `Tổng hoa hồng đơn hàng(₫)` GROUP BY `Sub_id1` / `Sub_id2`
- Join với Shopee tùy thuộc format Tên chiến dịch:
  - Tên chiến dịch có dấu `-` → Sub ID join với cột `Sub_id2`
  - Tên chiến dịch KHÔNG có dấu `-` → Sub ID join với cột `Sub_id1`

### Công thức

- Hiệu quả % (HQ) = (DT / CP) × 100
- Tổng lợi nhuận (TLN) = TDT - TCP
- Mỗi campaign theo dõi tối đa 10 ngày liên tiếp
- Ngày 11+ → campaign xuống hàng phía ngay dưới

## MongoDB Schemas

### User
```
{ username (unique), password (bcrypt), role ('superadmin' | 'user', default 'user'), createdAt, updatedAt }
```
- Super admin được seed tự động khi khởi động với username `admin` nếu chưa có
- Code hiện tại hash mật khẩu cố định `Aa1234567@`; service có generate mật khẩu ngẫu nhiên để log ra console nhưng giá trị log này chưa khớp với mật khẩu thực tế đang lưu
- Chỉ superadmin mới tạo được user mới

### ImportSession
```
{ importDate, importOrder, userId (ref User), createdAt, updatedAt }
```

### ImportRecord
```
{ sessionId (ref ImportSession), subId, campaignName, cp, dt, importDate, importOrder, userId (ref User), createdAt, updatedAt }
```

### SavedProduct
```
{ userId (ref User), subId2, folderId (ref ProductFolder, nullable), createdAt, updatedAt }
Unique index: { userId, subId2 }
```

### ProductFolder
```
{ userId (ref User), name, createdAt, updatedAt }
Unique index: { userId, name }
```

### UserPreference
```
{ userId (ref User, unique), highlightedSubIds: string[], updatedAt }
```

## API Endpoints (tất cả prefix `/api`)

### Auth – `/auth`

| Method | Route              | Mô tả                        | Body / Auth                 |
|--------|--------------------|-------------------------------|-----------------------------|
| POST   | `/auth/login`      | Đăng nhập, trả JWT + role    | { username, password }      |
| POST   | `/auth/register`   | Tạo user (superadmin only)   | { username, password } + JWT |
| GET    | `/auth/users`      | Danh sách users (superadmin) | JWT                         |
| DELETE | `/auth/users/:id`  | Xóa user (superadmin only)   | JWT                         |

### Import – `/import` (cần JWT)

| Method | Route              | Mô tả                        | Body                        |
|--------|--------------------|-------------------------------|-----------------------------|
| POST   | `/import/upload`   | Upload 2 file (multipart)    | shopeeFile, affiliateFile, importDate? |
| GET    | `/import/sessions` | Lấy danh sách import sessions | –                           |
| DELETE | `/import/sessions/:id` | Xóa session + records, recalculate importOrder | –        |

Response upload: `{ sessionId, importDate, importOrder, recordCount }`
Response sessions: `[{ _id, importDate, importOrder, recordCount }]`

### Report – `/report` (cần JWT)

| Method | Route              | Mô tả                        | Params                      |
|--------|--------------------|-------------------------------|-----------------------------|
| GET    | `/report/total`    | Lũy kế tổng CP, DT, Profit  | –                           |
| GET    | `/report/expend`   | Chi tiêu group by SubID     | –                           |
| GET    | `/report/revenue`  | Doanh thu group by SubID    | –                           |
| GET    | `/report/compare`  | So sánh theo session + lọc campaign | ?sessionId (optional), ?campaignName (optional) |

**Compare response:**
```json
{
  "records": [{ "subId", "tcp", "tdt", "tln", "days": [{ "day", "cp", "dt", "hq" }] }],
  "total": number,
  "maxDays": number,
  "currentSessionId", "prevSessionId", "nextSessionId", "oldestSessionId"
}
```

### Saved Products – `/saved-products` (cần JWT)

| Method | Route                          | Mô tả                                    | Body / Params                     |
|--------|--------------------------------|-------------------------------------------|-----------------------------------|
| POST   | `/saved-products`              | Lưu mã hàng hóa (vào folder nếu có)     | { subId2, folderId? }             |
| GET    | `/saved-products`              | Lấy danh sách mã đã lưu                  | ?folderId (optional, "uncategorized" cho chưa phân loại) |
| PATCH  | `/saved-products/:subId2/move` | Di chuyển sản phẩm sang folder khác      | { folderId: string \| null }      |
| DELETE | `/saved-products/:subId2`      | Xóa mã hàng hóa đã lưu                  | –                                 |

### Product Folders – `/product-folders` (cần JWT)

| Method | Route                  | Mô tả                                           | Body          |
|--------|------------------------|--------------------------------------------------|---------------|
| POST   | `/product-folders`     | Tạo folder mới                                   | { name }      |
| GET    | `/product-folders`     | Lấy danh sách folder của user                    | –             |
| PATCH  | `/product-folders/:id` | Đổi tên folder                                   | { name }      |
| DELETE | `/product-folders/:id` | Xóa folder (sản phẩm chuyển về chưa phân loại)  | –             |

### User Preferences – `/user/preferences` (cần JWT)

| Method | Route                                | Mô tả                          | Body                          |
|--------|--------------------------------------|---------------------------------|-------------------------------|
| GET    | `/user/preferences`                  | Lấy danh sách highlight        | –                             |
| POST   | `/user/preferences/highlight`        | Upsert danh sách highlight     | { highlightedSubIds: string[] } |
| DELETE | `/user/preferences/highlight/:subId2`| Xóa highlight 1 mã             | –                             |

### Reset – `/reset` (cần JWT)

| Method | Route    | Mô tả           |
|--------|----------|------------------|
| DELETE  | `/reset` | Xóa toàn bộ data của user |

### Swagger: `/api/docs`

## Response format

```json
{ "data": ..., "message": "Success", "statusCode": 200 }
```

## Frontend Routes

| Route              | Page               | Auth | Mô tả                                           |
|--------------------|--------------------|------|--------------------------------------------------|
| `/login`           | LoginPage          | No   | Đăng nhập                                        |
| `/dashboard`       | DashboardPage      | Yes  | KPI cards: TCP, TDT, TLN                        |
| `/import`          | ImportPage         | Yes  | Upload 2 file + lịch sử import (xóa theo ngày) |
| `/report`          | ReportPage         | Yes  | Bảng so sánh với navigation session + highlight + lưu vào folder |
| `/saved-products`  | SavedProductsPage  | Yes  | Tabs folder: Tất cả / Chưa phân loại / Folder tùy chỉnh |
| `/admin/users`     | AdminUsersPage     | Yes (superadmin) | Quản lý tài khoản user                  |

Ghi chú: `RegisterPage.tsx` có tồn tại trong source frontend nhưng hiện chưa được mount vào router trong `frontend/src/App.tsx`, nên không có route đăng ký công khai.

## Chức năng chi tiết

### 1. Authentication & User Management
- Đăng nhập với JWT, token lưu localStorage (kèm role + username)
- Super admin với username `admin` được seed tự động khi backend khởi động nếu chưa có
- Theo code hiện tại, mật khẩu được lưu cho super admin mặc định là `Aa1234567@`; chuỗi mật khẩu random in ra console chưa phản ánh đúng mật khẩu đã hash
- Chỉ superadmin mới tạo/xóa user (trang /admin/users)
- Không có route đăng ký công khai; `RegisterPage.tsx` chỉ là file chưa được expose trong router
- Auto-attach token qua Axios interceptor
- 401 → redirect /login

### 2. Import file
- Upload 2 file: Hộ Kinh Doanh (.xlsx/.csv) + Affiliate (.csv/.xlsx)
- Auto-detect file format (extension + MIME type)
- Parse, join qua Sub ID, lưu ImportSession + ImportRecord
- Lịch sử import: hiển thị danh sách sessions đã import (ngày, lần thứ, số bản ghi)
- Xóa theo ngày: xóa session + records, tự động tính lại importOrder

### 3. Dashboard
- 3 KPI cards: Tổng Chi Phí (TCP), Tổng Doanh Thu (TDT), Tổng Lợi Nhuận (TLN)
- Format VND, responsive grid

### 4. Báo cáo So sánh (Report) – Core Feature
- Bảng động với cột Sub ID + Hiệu quả (TCP, TDT, TLN) + tối đa 10 cột ngày (CP, DT, HQ%)
- Row merging cho cùng SubID
- Sub ID dài → ellipsis (max 300px) + tooltip hiện full text
- TCP, TDT, TLN: background xanh nhạt + chữ đậm; TLN xanh/đỏ theo dương/âm
- HQ% > 200%: chữ xanh
- Sort tăng/giảm trên tất cả cột số (TCP, TDT, TLN, CP, DT, HQ%) – giữ nguyên nhóm SubID khi sort
- Navigation session: Mới nhất / Mới hơn / Cũ hơn / Cũ nhất
- Có filter `campaignName` ở backend và debounce search ở frontend để lọc theo campaign của session hiện tại
- Fixed columns + horizontal scroll, table height cố định (100vh - 280px)

### 5. Highlight mã hàng hóa
- Click Sub ID → toggle highlight (đổi màu dòng)
- Persist trên backend (user_preferences), sync qua API
- Badge hiển thị số mã đang highlight + nút Clear
- Reload / login lại → highlight giữ nguyên

### 6. Lưu mã hàng hóa (Saved Products)
- Nút "Lưu" ở ReportPage → mở Modal chọn folder
- Có thể lưu không phân loại hoặc chọn folder
- Tạo folder mới ngay trong modal
- Nút "Bỏ lưu" xóa trực tiếp

### 7. Product Folders (Phân loại sản phẩm vào folder)
- Trang SavedProductsPage hiển thị Tabs ngang: Tất cả / Chưa phân loại / Folder tùy chỉnh
- CRUD folder: tạo, đổi tên, xóa (cascade → sản phẩm về "Chưa phân loại")
- Di chuyển sản phẩm giữa các folder (nút "Chuyển" + dropdown)
- Click sản phẩm → auto highlight + navigate /report
- Badge đếm số lượng sản phẩm mỗi folder/tab

### 8. Reset data
- DELETE /reset xóa toàn bộ import data
- Highlight & saved products KHÔNG bị ảnh hưởng

## Cấu hình

- MongoDB: `mongodb://mongoadmin:secret@localhost:27017/camp-report?authSource=admin`
- JWT Secret: `camp-report-secret-key`
- CORS: `origin: '*'`
- Vite proxy: `/api` → `http://localhost:3000`
- Locale: Vietnamese (vi_VN)

## File ownership – QUAN TRỌNG

- backend-teammate: CHỈ viết vào backend/
- frontend-teammate: CHỈ viết vào frontend/
- KHÔNG ai được sửa file của người kia

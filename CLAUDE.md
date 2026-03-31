# Camp Report App – Full Stack

## Stack

- Backend: NestJS + TypeScript, port 3000, MongoDB
- Frontend: React 18 + Vite + TypeScript, poPRIORITY_LEVELSrt 5173
- UI: AntDesign + Tailwind CSS + TanStack Query

## Cấu trúc thư mục

camp-report-app/
├── backend/ ← NestJS (backend-teammate sở hữu)
├── frontend/ ← React (frontend-teammate sở hữu)
├── samples/ ← File mẫu để đọc cấu trúc cột
└── CLAUDE.md

## Domain Logic – ĐỌC KỸ

### File Hộ Kinh Doanh (.xlsx)

- Lọc các dòng có `Số tiền đã chi tiêu (VND)` > 0
- Sub ID = phần CUỐI của `Tên chiến dịch` sau dấu `-` cuối cùng
  - VD: "17396120189-SHPAAP0725-DXYTuiXinh2101" → Sub ID = "DXYTuiXinh2101"
- CP = giá trị `Số tiền đã chi tiêu (VND)`

### File AffiliateCommissionReport (.csv)

- DT = tổng `Tổng hoa hồng đơn hàng(₫)` GROUP BY `Sub_id2`
- Join với Shopee qua Sub ID = Sub_id2

### Công thức

- Hiệu quả % = (DT / CP) × 100
- Mỗi campaign theo dõi tối đa 10 ngày liên tiếp
- Ngày 11+ → campaign xuống hàng phía ngay dưới

## API Contract (backend → frontend)

POST /api/import { dayNumber, records: [{subId, campaignName, cp, dt}] }
GET /api/campaigns → danh sách campaign + tất cả day records
DELETE /api/reset → xóa toàn bộ
GET /api/docs → Swagger UI

## Response format

{ "data": ..., "message": "...", "statusCode": 200 }

## File ownership – QUAN TRỌNG

- backend-teammate: CHỈ viết vào backend/
- frontend-teammate: CHỈ viết vào frontend/
- KHÔNG ai được sửa file của người kia

## Agent 1: backend-teammate

#### 1. Thêm API endpoint GET `/report/total`

- Endpoint này có nhiệm vụ tính lũy kế tổng số tiền đã chi và lũy kế tổng hoa hồng đơn hàng của từng lần import file excel

#### 2. Thêm API endpoint GET `/report/expend`

- Endpoint này có nhiệm vụ xử lý file Hộ Kinh Doanh -> tính toán số tiền đã chi

#### 3. Thêm API endpoint GET `/report/revuene`

- Endpoint này có nhiệm vụ xử lý file affiliate -> tính toán số tiền hoa hồng nhận được

#### 4. API: /report/compare

- Endpoint này có nhiệm vụ show các thông tin tổng thu, hoa hồng của một loại hàng hóa trong file vừa import lên với các field: tổng chi phí (TCP), tổng doanh thu(TDT), tổng lợi nhuận = (TDT-TCP), chi phí (CP), doanh thu(DT), hiệu quả (HQ=DT/CP). Nếu mã hàng hóa đấy có doanh thu ở những ngày import trước đó thì lấy thêm vào danh sách {CP, DT, HQ}
- Endpoint này có dạng hiển thị pagination nếu user click > hoặc < thì sẽ là thông tin của ngày import trước đó với logic như trên

#### Sẽ có chức năng đăng nhập

## Agent 2: frontend-teammate

- Sẽ có chức năng đăng nhập
- Sau khi đăng nhập xong thì sẽ vào màn dashboard hiển thị Tổng chi phí và tổng doanh thu thông qua api: /report/total
- Màn import sẽ có 2 ô import 2 file
- Mà Report: Sẽ hiển thị thông tin mã đơn hàng có danh thu bao nhiêu và doanh thu của các lần import trước đó nếu có. Hình ảnh minh họa ở /home/kyhung/Personal/camp-report-app/samples/Screenshot from 2026-03-27 08-40-52.png

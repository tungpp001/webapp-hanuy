# BÁO CÁO KHẢO SÁT REPOSITORY (GIAI ĐOẠN 0)

> **Ngày khảo sát:** 08/11/2026 (Asia/Ho_Chi_Minh)  
> **Thư mục làm việc:** `c:\Users\Admin\Desktop\web app`  
> **Quyết định của chủ dự án:** Khởi tạo kiến trúc **Monorepo** ngay tại thư mục gốc và bảo toàn ứng dụng hiện tại (`HanYuFlow`) như một package riêng biệt (`packages/hanyuflow`).

---

## 1. Hiện trạng Repository & Công nghệ đang có

Qua khảo sát toàn bộ cây thư mục, file cấu hình và lịch sử Git (`tungpp001/webapp-hanuy`):

| Thành phần | Hiện trạng | Chi tiết |
| :--- | :--- | :--- |
| **Ứng dụng hiện có** | `HanYuFlow (汉语流)` | Web App Học Tiếng Trung Giao Tiếp Thực Chiến (Single-Page Application tĩnh). |
| **Frontend Framework** | React 19 + Vite 8 + TypeScript 6 | Cấu hình tại `package.json`, `vite.config.ts`, `tsconfig.json`. |
| **Styling & UI** | Tailwind CSS 3.4 + Lucide Icons | Có `tailwind.config.js`, `postcss.config.js`, `src/components/*`. |
| **Lưu trữ dữ liệu** | Tĩnh + `localStorage` | Dữ liệu từ vựng/bài học nằm trong `src/data/*.ts`, tiến độ học lưu trong `src/utils/storage.ts`. |
| **Backend / API** | **Chưa có (0%)** | Không có máy chủ backend, không có REST/GraphQL/WebSocket API. |
| **Database & ORM** | **Chưa có (0%)** | Không có PostgreSQL, Prisma hay cơ chế migration. |
| **Docker / Hạ tầng** | **Chưa có (0%)** | Không có `Dockerfile` hoặc `docker-compose.yml`. |
| **Kiểm thử tự động** | **Chưa có (0%)** | Chỉ có `oxlint` cho linting; chưa có Jest/Vitest/Playwright hay load test. |

---

## 2. Phân tích Khoảng cách (Gap Analysis) so với Đặc tả SaaS Quản lý Order Quán Ốc

Hệ thống mục tiêu là một **Nền tảng SaaS Hybrid (Cloud + Máy chủ Chi nhánh Offline-first)** phục vụ nghiệp vụ nhà hàng/quán ốc đa chi nhánh với yêu cầu toàn vẹn giao dịch tài chính nghiêm ngặt. Khoảng cách hiện tại là **100% về mặt nghiệp vụ và kiến trúc hệ thống**:

1. **Kiến trúc Hybrid (Cloud SaaS ↔ Branch Node):**
   - **Hiện trạng:** Chỉ có 1 SPA thuần client.
   - **Cần xây dựng:** Tách bạch dịch vụ Cloud Control Plane (quản lý tenant, hợp đồng, thương hiệu, menu chuẩn, báo cáo tổng hợp, giám sát thiết bị, nhận bản sao lưu mã hóa) và Branch Edge Server (xử lý order nội bộ qua LAN, phiên bàn, QR, bếp, máy in nhiệt, thanh toán, đồng bộ outbox, replication Primary-Standby).
2. **Quản lý Tenant, Hợp đồng & Giấy phép Offline:**
   - **Cần xây dựng:** Vòng đời tenant, chính sách gia hạn 7 ngày (grace period), khóa mở phiên bàn mới khi hết hạn nhưng cho phép đóng/thanh toán phiên đang mở, xác thực giấy phép đã đồng bộ có chữ ký số khi mất mạng Internet.
3. **Bảo mật, Xác thực & Phân quyền (RBAC + Tenant Isolation):**
   - **Cần xây dựng:** 7 vai trò (SaaS Admin, Kỹ thuật viên hỗ trợ, Chủ chuỗi, Quản lý chi nhánh, Thu ngân, Phục vụ, Bếp), mật khẩu Argon2id ($\ge 12$ ký tự), MFA (TOTP) bắt buộc cho SaaS Admin & Kỹ thuật viên, tự khóa POS sau 15 phút không hoạt động, luồng phê duyệt hỗ trợ từ xa có thời hạn, và phê duyệt độc lập cho 9 nhóm thao tác nhạy cảm.
4. **Menu Chuỗi, Giá Chi nhánh, Lịch phát hành & Món bán theo cân:**
   - **Cần xây dựng:** Quản lý phiên bản menu (`Asia/Ho_Chi_Minh`), cờ phân biệt tường minh giữa `INHERITED` (kế thừa giá chuẩn) và `OVERRIDE` (giá chi nhánh tự đặt), giới hạn tăng/giảm giá của quản lý chi nhánh, quy trình món bán theo cân (nhập trọng lượng thực tế, tính thành tiền số nguyên VND, xác nhận khách khi vượt ngưỡng), và lưu snapshot giá bán + giá vốn ước tính trên từng dòng giao dịch.
5. **Bàn, Phiên bàn, QR Cố định & Màn hình Bếp / Hàng đợi Máy in:**
   - **Cần xây dựng:** State machine cho bàn, phiên bàn, lượt gọi món (Order Round) và trạng thái từng món (tách biệt rõ *Đã gửi phiếu bếp* và *Đang chế biến*). Hàng đợi in bền vững trong PostgreSQL cho 2 máy in nhiệt (Bếp & Thu ngân), hỗ trợ `IN LẠI`, không in lặp món cũ.
6. **Hóa đơn, Tách Bill, Làm tròn & Thanh toán / Công nợ / Hoàn tiền:**
   - **Cần xây dựng:** Lưu tiền tệ kiểu số nguyên VND (`BIGINT`/`INT`), tách hóa đơn chia đều có phân bổ phần dư chính xác tuyệt đối ($\sum \text{hóa đơn con} = \text{tổng gốc}$), giảm giá 1 khoản cấp hóa đơn, đóng bàn còn nợ, thu nợ ghi nhận vào ngày thực thu, hoàn tiền & điều chỉnh không sửa ngược lịch sử.
7. **Tính toàn vẹn, Idempotency, Đồng bộ & Sao lưu / Dự phòng (Primary-Standby):**
   - **Cần xây dựng:** Bắt buộc `Idempotency-Key` + kiểm tra băm payload cho mọi thao tác ghi quan trọng, Outbox pattern đồng bộ Cloud, cơ chế xác nhận lưu bền vững giữa Primary và Standby trước khi trả kết quả thành công theo chính sách an toàn, kịch bản kiểm tra trước failover (chống split-brain) và đối soát sau mất điện.

---

## 3. Hiện trạng Môi trường Thực thi Cục bộ & Rủi ro Kỹ thuật

Qua kiểm tra trực tiếp trên máy phát triển hiện tại (Windows):

- **Node.js:** `v24.19.0` (Hoạt động tốt).
- **PowerShell Execution Policy:** Đang chặn chạy file `.ps1` (`npm.ps1`), do đó mọi lệnh npm cần gọi qua `npm.cmd` (ví dụ: `npm.cmd run build`).
- **Docker:** Đã cài `Docker version 28.0.1`, nhưng **Docker Desktop Linux Engine daemon hiện đang tắt** (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`).
  - *Ảnh hưởng & Giảm thiểu:* Chúng ta vẫn thiết kế đầy đủ `docker-compose.yml`, `Dockerfile`, script khởi tạo cluster PostgreSQL Primary-Standby và trình cài đặt tự động. Đối với việc chạy kiểm thử tự động (Unit/Integration/E2E) ngay trên máy hiện tại khi Docker daemon chưa bật, kiến trúc sẽ hỗ trợ chạy qua PostgreSQL local hoặc PGlite (WASM PostgreSQL chạy trực tiếp trên Node.js đầy đủ tính năng transaction/ACID) để kiểm chứng thực tế toàn bộ SQL/Prisma migration và kiểm thử nghiệp vụ mà không bao giờ giả lập kết quả.

---

## 4. Cấu trúc Monorepo Đề xuất

Để giữ nguyên vẹn ứng dụng `HanYuFlow` hiện tại và phát triển hệ thống SaaS Quản lý Order Quán Ốc một cách mô-đun hóa, thư mục gốc sẽ được tổ chức theo cấu trúc npm workspaces:

```text
/
├── docs/                         # Toàn bộ tài liệu kiến trúc, đặc tả, bảo mật, vận hành (Giai đoạn 1)
├── packages/
│   ├── hanyuflow/                # Ứng dụng học tiếng Trung hiện tại (được di chuyển nguyên vẹn)
│   ├── shared/                   # Các kiểu dữ liệu (TypeScript), hằng số, state machine, tiền tệ VND, validation
│   ├── database/                 # Prisma schema, migrations, seed, công cụ kiểm tra tính toàn vẹn & backup
│   ├── backend/                  # NestJS API (Modules: Auth, Tenant, Menu, Table/QR, Order, Kitchen, Print, Invoice, Payment, Sync, Report)
│   └── web/                      # Next.js App (7 phân hệ giao diện: QR Khách, Phục vụ, Bếp, Thu ngân, Quản lý CN, Chủ chuỗi, SaaS Admin)
├── infra/
│   ├── docker/                   # Docker Compose cho Cloud, Branch Primary, Branch Standby
│   └── installer/                # Script cài đặt tự động tại chi nhánh, kiểm tra phần cứng, healthcheck
└── package.json                  # Cấu hình Monorepo Workspaces & scripts kiểm thử chung
```

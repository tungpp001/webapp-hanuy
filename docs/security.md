# BẢO MẬT ỨNG DỤNG, PHÂN QUYỀN & KIỂM TOÁN (APPLICATION SECURITY)

## 1. Xác thực & Bảo mật Tài khoản (Authentication)

1. **Chính sách Mật khẩu & Thuật toán Băm:**
   - Độ dài tối thiểu **12 ký tự**, kiểm tra độ phức tạp và từ chối mật khẩu phổ biến.
   - Băm mật khẩu bằng **Argon2id** (hoặc tham số tương đương chuẩn OWASP: `memoryCost >= 19456 KiB`, `timeCost >= 2`, `parallelism = 1`). Tuyệt đối không lưu plaintext hay MD5/SHA1.
2. **Chống Brute-force & Rate Limiting:**
   - Giới hạn tốc độ theo IP và theo `username` trên endpoint đăng nhập và xác thực MFA.
   - Sau $N$ lần thử sai liên tiếp (mặc định $N = 5$, cấu hình được), tự động khóa tài khoản tạm thời trong khoảng thời gian tăng dần (`15 phút` $\rightarrow$ `60 phút`) và phát sinh cảnh báo `AUTH_ANOMALY_ALERT` trên Dashboard.
3. **Xác thực Đa yếu tố (MFA - TOTP RFC 6238):**
   - **Bắt buộc 100%** đối với `SAAS_ADMIN` và `TECH_SUPPORT`. Hệ thống chặn mọi thao tác nghiệp vụ của 2 vai trò này nếu MFA chưa được kích hoạt và xác minh trong phiên.
   - **Khuyến nghị & Hỗ trợ sẵn** đối với `CHAIN_OWNER` và `BRANCH_MANAGER`.
4. **Tự động Khóa Phiên POS sau 15 phút Không hoạt động:**
   - Màn hình POS của Thu ngân / Phục vụ / Quản lý chi nhánh tự động chuyển sang trạng thái `POS_LOCKED` sau **15 phút** (`900 giây`) không có tương tác.
   - **Bảo toàn dữ liệu đang thao tác:** Khi màn hình khóa, bản nháp đơn hàng hoặc thông tin đang nhập trên giao diện được giữ nguyên trong bộ nhớ phiên làm việc, không làm mất đơn hoặc tác vụ đang xử lý. Khi nhân viên xác thực lại, tiếp tục đúng ngữ cảnh trước khi khóa.
5. **Thu hồi Phiên & Nghỉ việc:**
   - Khi nhân viên nghỉ việc hoặc bị vô hiệu hóa (`status = DISABLED`), hệ thống lập tức thu hồi toàn bộ `UserSession` đang hoạt động (`revoked_at = NOW()`), đồng thời giữ nguyên 100% lịch sử giao dịch và audit log gắn với `user_id` đó.
   - Tuyệt đối không có tài khoản backdoor hoặc cờ bỏ qua xác thực trong mã nguồn.

---

## 2. Phân quyền RBAC & Cô lập Đa khách hàng (Tenant & Branch Isolation)

1. **Kiểm tra Đa lớp tại Máy chủ (Server-side Enforcement):**
   - Không bao giờ coi việc ẩn nút trên giao diện là bảo mật.
   - Mọi request tới Backend phải đi qua chuỗi Guard: `AuthenticationGuard` $\rightarrow$ `PosIdleLockGuard` $\rightarrow$ `TenantIsolationGuard` $\rightarrow$ `BranchScopeGuard` $\rightarrow$ `RolePermissionGuard` $\rightarrow$ `ContractExpirationGuard`.
2. **Quy tắc Cô lập:**
   - Người dùng thuộc `tenant_id = A` không thể đọc, sửa, xóa hoặc suy đoán bất kỳ bản ghi nào của `tenant_id = B`.
   - `BRANCH_MANAGER`, `CASHIER`, `WAITER`, `KITCHEN_STAFF` chỉ truy cập được dữ liệu có `branch_id` trùng với chi nhánh được phân quyền.
   - `CHAIN_OWNER` truy cập được tất cả các chi nhánh thuộc `tenant_id` của chuỗi mình.
   - `SAAS_ADMIN` quản lý cấu hình tenant/hợp đồng nhưng **không có quyền sửa đổi giao dịch tài chính** (hóa đơn, thanh toán, hoàn tiền) của chi nhánh.

---

## 3. Quy trình Hỗ trợ Từ xa Có Phê duyệt (Controlled Remote Support)

1. Mỗi Kỹ thuật viên (`TECH_SUPPORT`) sử dụng tài khoản định danh cá nhân riêng và bắt buộc bật MFA.
2. Kỹ thuật viên không thể truy cập dữ liệu chi nhánh nếu không có bản ghi **`SupportAccessGrant` đang hiệu lực**:
   - Có yêu cầu hỗ trợ (`reason`) và được phê duyệt bởi người có thẩm quyền (`CHAIN_OWNER`, `BRANCH_MANAGER` hoặc `SAAS_ADMIN` tùy phạm vi).
   - Quy định rõ phạm vi (`scope`), thời gian bắt đầu (`starts_at`) và thời gian hết hạn (`expires_at`, ví dụ tối đa 2 giờ).
   - Chủ chuỗi / Quản lý chi nhánh có nút **"Thu hồi quyền hỗ trợ ngay lập tức"** (`Revoke Now`).
3. **Giới hạn Cứng đối với Hỗ trợ Từ xa:**
   - Kỹ thuật viên bị chặn tuyệt đối (cấp mã nguồn trong Guard) đối với các API: tạo/sửa/hủy hóa đơn, xác nhận thanh toán, tạo/duyệt hoàn tiền, hoặc điều chỉnh công nợ.
   - Mọi thao tác trong phiên hỗ trợ đều ghi vào `audit_logs` kèm `support_grant_id`.

---

## 4. Kiểm soát 9 Thao tác Nhạy cảm & Nguyên tắc Maker-Checker

| Mã Thao tác | Ngưỡng Cấu hình | Người Duyệt Hợp lệ | Yêu cầu Bắt buộc |
| :--- | :--- | :--- | :--- |
| `DISCOUNT_OVER_LIMIT` | Vượt `%` hoặc số tiền VND tối đa của Thu ngân | `BRANCH_MANAGER` / `CHAIN_OWNER` | Lý do bắt buộc + Không tự duyệt chính mình |
| `CANCEL_ITEM_AFTER_KITCHEN` | Mọi món ở trạng thái `SENT_TO_KITCHEN` hoặc `COOKING` | `BRANCH_MANAGER` / `CHAIN_OWNER` | Lý do bắt buộc + Đánh dấu hao phí nếu đang nấu |
| `VOID_INVOICE` | Hóa đơn chưa thanh toán (`UNPAID`) | `BRANCH_MANAGER` / `CHAIN_OWNER` | Lý do bắt buộc + Giữ nguyên lịch sử |
| `REFUND_PAYMENT` | Hoàn tiền trên hóa đơn đã thu tiền | `BRANCH_MANAGER` / `CHAIN_OWNER` | Lý do + Số tiền $\le$ tiền thực thu đủ điều kiện |
| `ADJUST_RECEIVABLE` | Miễn/giảm tiền khiếu nại hoặc điều chỉnh nợ | `BRANCH_MANAGER` / `CHAIN_OWNER` | Lý do bắt buộc + Audit log trước/sau |
| `CLOSE_TABLE_WITH_DEBT` | Đóng bàn khi `debt_amount_vnd > 0` | `BRANCH_MANAGER` / `CHAIN_OWNER` | Lý do + Người duyệt + Giữ trạng thái hóa đơn nợ |
| `REOPEN_CLOSED_SESSION_OR_INVOICE` | Mở lại phiên bàn / hóa đơn đã đóng | `BRANCH_MANAGER` / `CHAIN_OWNER` | Lý do bắt buộc + Audit log mức `HIGH` |
| `PRICE_CHANGE_OVER_LIMIT` | Quản lý CN đổi giá vượt biên độ `%` / VND cho phép | `CHAIN_OWNER` | Chỉ có hiệu lực sau khi Chủ chuỗi duyệt |
| `DATA_RESTORE_OR_FAILOVER` | Khôi phục backup hoặc chuyển máy chủ Primary | `SAAS_ADMIN` / `CHAIN_OWNER` + `TECH_SUPPORT` | Checklist an toàn dữ liệu + Lý do + Audit log |

---

## 5. Bảo mật Hạ tầng Mạng & Sao lưu

- **Không phơi cổng nhạy cảm ra Internet:** PostgreSQL (`5432`), Redis/Queue nội bộ, SSH (`22`), RDP (`3389`) và cổng máy in nhiệt (`9100`) chỉ lắng nghe trên giao diện loopback hoặc VLAN quản trị nội bộ, tuyệt đối không mở port-forwarding trực tiếp ra WAN.
- **Mã hóa Bản sao lưu Cloud:** Trước khi đẩy bản sao lưu giao dịch từ chi nhánh lên Cloud, dữ liệu được nén và mã hóa bằng **AES-256-GCM** kèm mã kiểm tra toàn vẹn **SHA-256 checksum**.
- **Bảo vệ Xuất dữ liệu:** Các gói xuất JSON/Excel/CSV không bao giờ bao gồm các trường `password_hash`, `mfa_secret_enc`, `session_token`, khóa ký license hoặc secret hệ thống.

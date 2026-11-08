# ĐẶC TẢ YÊU CẦU NGHIỆP VỤ & HỆ THỐNG (REQUIREMENTS SPECIFICATION)

## 1. Phạm vi và Mục tiêu Hệ thống

Hệ thống **SaaS Quản lý Order Quán Ốc Đa Chi Nhánh (OcPOS SaaS)** là nền tảng thương mại thực tế phục vụ các chuỗi quán ốc và nhà hàng ăn uống tại Việt Nam:
- **Quy mô giai đoạn đầu:** 6–20 khách hàng (Tenants), mỗi khách hàng có nhiều chi nhánh (Branches), mỗi chi nhánh có khoảng 10–20 bàn.
- **Mô hình vận hành Hybrid:**
  - **Cloud SaaS Control Plane:** Quản lý tenant, hợp đồng, thương hiệu, menu chuẩn, lịch phát hành menu, báo cáo tổng hợp toàn chuỗi, giám sát trạng thái máy chủ/đồng bộ/sao lưu và lưu trữ bản sao lưu giao dịch đã mã hóa.
  - **Branch Server (Máy chủ tại chi nhánh):** Gồm 01 Máy chủ chính (Primary) và 01 Máy chủ dự phòng (Standby) tại mỗi chi nhánh, xử lý toàn bộ nghiệp vụ nội bộ qua mạng LAN (bàn, phiên bàn, QR order, duyệt món, màn hình bếp, hàng đợi in 2 máy in nhiệt, hóa đơn, tách bill, thanh toán, công nợ, hoàn tiền). Tiếp tục hoạt động bình thường khi mất kết nối Internet.

---

## 2. Phân định Thực thể & Cô lập Dữ liệu (Multi-Tenancy)

1. **SaaS Platform:** Đơn vị vận hành nền tảng phần mềm.
2. **Tenant (Khách hàng) & Hợp đồng (Contract):** Mỗi hợp đồng tương ứng với một thương hiệu (Brand) độc lập. Nếu một chủ sở hữu kinh doanh thương hiệu thứ hai, bắt buộc khởi tạo Tenant và Hợp đồng riêng.
3. **Chi nhánh (Branch):** Đơn vị vận hành trực thuộc một Tenant/Thương hiệu, sử dụng chung nhận diện thương hiệu và kế thừa danh mục Menu chuẩn nhưng có cấu hình giá chi nhánh, máy in, giờ bắt đầu ngày kinh doanh (`business_day_start_hour`) và máy chủ riêng.
4. **Cô lập tuyệt đối (Strict Tenant Isolation):** Mọi truy vấn và thao tác API đều bắt buộc kiểm tra `tenant_id` và `branch_id` từ ngữ cảnh phiên đăng nhập đã xác thực trên máy chủ. Tuyệt đối không cho phép truy cập chéo tenant.

---

## 3. Chính sách Hợp đồng, Gia hạn & Vận hành khi Hết hạn

| Trạng thái Hợp đồng | Quy định Nghiệp vụ |
| :--- | :--- |
| **`ACTIVE` (Đang hiệu lực)** | Toàn bộ chức năng hoạt động bình thường. |
| **`EXPIRING_SOON` (Sắp hết hạn)** | Hiển thị cảnh báo trên dashboard trước các mốc cấu hình (mặc định: 30, 14, 7, 3, 1 ngày). |
| **`GRACE_PERIOD` (Gia hạn 7 ngày)** | Mặc định 7 ngày sau `end_date` (cấu hình được). Chi nhánh vẫn được mở phiên bàn mới, nhưng hiển thị cảnh báo nổi bật cho Chủ chuỗi và Quản lý chi nhánh. |
| **`EXPIRED_RESTRICTED` (Quá hạn gia hạn)** | **Chặn tuyệt đối việc mở phiên bàn mới (`OPEN_TABLE_SESSION`).** Không cho phép lợi dụng phiên bàn cũ đã mở từ trước để thêm lượt gọi món mới sau thời điểm khóa hợp đồng. Các phiên bàn đang mở chỉ được phép hoàn tất món đang xử lý, tạo hóa đơn, ghi nhận thanh toán, in hóa đơn, đóng bàn và xuất báo cáo/dữ liệu. |
| **`SUSPENDED` / `TERMINATED`** | Chặn mở phiên bàn mới; cho phép đối soát và xuất dữ liệu bàn giao theo quy trình đóng chi nhánh/ngừng hợp đồng. Không tự động xóa dữ liệu chỉ vì hết hạn hợp đồng. |

- **Giấy phép Offline (Offline License Token):** Máy chủ chi nhánh lưu bản chụp giấy phép có chữ ký số (`SignedLicenseLease`) được đồng bộ từ Cloud. Khi mất Internet, máy chủ chi nhánh dựa vào `expires_at` và `grace_period_days` trong giấy phép đã đồng bộ, **không bao giờ coi việc mất Internet là hết hạn hợp đồng**.

---

## 4. Vai trò Người dùng, Phạm vi Truy cập & Thao tác Nhạy cảm

### 4.1. Ma trận 7 Vai trò (RBAC)

1. **`SAAS_ADMIN` (Quản trị viên SaaS):** Quản lý tenant, hợp đồng, phiên bản phần mềm, đóng chi nhánh, xuất dữ liệu bàn giao. Bắt buộc MFA. Không mặc nhiên được sửa dữ liệu giao dịch của nhà hàng.
2. **`TECH_SUPPORT` (Kỹ thuật viên hỗ trợ):** Tài khoản cá nhân riêng biệt, bắt buộc MFA. Chỉ truy cập phạm vi kỹ thuật/hỗ trợ của chi nhánh khi có **Yêu cầu hỗ trợ (`SupportTicket`) đã được phê duyệt**, có thời hạn (`expires_at`) và có thể thu hồi tức thì. Không được tự ý sửa hóa đơn, thanh toán hay hoàn tiền.
3. **`CHAIN_OWNER` (Chủ chuỗi):** Xem dashboard và báo cáo tổng hợp của tất cả chi nhánh thuộc chuỗi, cấu hình thương hiệu, quản lý menu chuẩn, lịch phát hành menu, phê duyệt thay đổi giá vượt khung và phê duyệt thao tác nhạy cảm. Khuyến nghị MFA.
4. **`BRANCH_MANAGER` (Quản lý chi nhánh):** Quản lý vận hành tại chi nhánh được phân quyền, cấu hình giá chi nhánh trong biên độ cho phép, quản lý trạng thái hết hàng/ẩn món, thu hồi/phát hành lại QR bàn, phê duyệt hủy món sau khi gửi bếp, hủy hóa đơn chưa thanh toán, đóng bàn còn nợ, hoàn tiền/điều chỉnh. Khuyến nghị MFA.
5. **`CASHIER` (Thu ngân):** Quản lý hóa đơn, tách/chia hóa đơn, áp dụng giảm giá trong hạn mức cho phép, ghi nhận thanh toán (tiền mặt/chuyển khoản QR tĩnh), thu nợ, in hóa đơn.
6. **`WAITER` (Nhân viên phục vụ):** Mở/chuyển/gộp bàn, tạo đơn hộ khách, nhập trọng lượng món bán theo cân, duyệt yêu cầu gọi món từ QR khách, đánh dấu đã phục vụ, hủy món trước khi duyệt theo quyền.
7. **`KITCHEN_STAFF` (Nhân viên bếp):** Sử dụng màn hình bếp (KDS), xác nhận bắt đầu chế biến (`COOKING`), đánh dấu hoàn thành (`COMPLETED`), theo dõi cảnh báo trễ món.

### 4.2. Danh mục 9 Thao tác Nhạy cảm (Cần Quyền riêng, Lý do bắt buộc & Audit Log)

1. **`DISCOUNT_OVER_LIMIT`**: Giảm giá vượt hạn mức của Thu ngân (theo % hoặc số tiền VND).
2. **`CANCEL_ITEM_AFTER_KITCHEN`**: Hủy món sau khi đã gửi phiếu bếp (`SENT_TO_KITCHEN`, `COOKING`).
3. **`VOID_INVOICE`**: Hủy hóa đơn chưa thanh toán.
4. **`REFUND_PAYMENT`**: Yêu cầu, phê duyệt và thực hiện hoàn tiền.
5. **`ADJUST_RECEIVABLE`**: Điều chỉnh/miễn giảm khoản phải thu hoặc xử lý khiếu nại trên món đã hoàn thành/phục vụ.
6. **`CLOSE_TABLE_WITH_DEBT`**: Đóng phiên bàn khi hóa đơn còn nợ hoặc mới thanh toán một phần.
7. **`REOPEN_CLOSED_SESSION_OR_INVOICE`**: Mở lại hóa đơn hoặc phiên bàn đã đóng trong trường hợp ngoại lệ.
8. **`PRICE_CHANGE_OVER_LIMIT`**: Quản lý chi nhánh thay đổi giá bán vượt biên độ `%` hoặc số tiền cho phép so với giá chuẩn.
9. **`DATA_RESTORE_OR_FAILOVER`**: Khôi phục dữ liệu từ bản sao lưu hoặc chuyển đổi vai trò máy chủ chính (Primary Failover).

> **Quy tắc bắt buộc:** Người yêu cầu thao tác vượt hạn mức không được tự phê duyệt yêu cầu của chính mình khi chính sách yêu cầu phê duyệt độc lập (Maker-Checker).

---

## 5. Yêu cầu Nghiệp vụ Cốt lõi

### 5.1. Menu, Phiên bản, Kế thừa Giá & Món bán theo cân
- Mỗi biến thể món (ví dụ: *Ốc hương hấp sả - Nhỏ*, *Ốc hương hấp sả - Lớn*, *Ốc hương rang muối - Bán theo kg*) là một bản ghi mặt hàng độc lập (`MenuItem`) với ID riêng.
- **Cơ chế giá chi nhánh:** Mỗi món tại chi nhánh có thuộc tính `price_mode` tường minh là `INHERITED` hoặc `OVERRIDE`. Khi Menu chuẩn phát hành phiên bản mới, chỉ các chi nhánh có `price_mode = INHERITED` mới cập nhật theo giá chuẩn mới; `OVERRIDE` giữ nguyên giá chi nhánh đã đặt.
- **Quy trình món bán theo cân (`WEIGHT_BASED`):**
  1. Khách hoặc nhân viên chọn món bán theo cân.
  2. Nhân viên cân thực tế và nhập trọng lượng $w$ ($\text{kg}$, độ chính xác 3 chữ số thập phân, ví dụ $0.920\text{ kg}$) cùng đơn giá $p$ ($\text{VND/kg}$, số nguyên).
  3. Hệ thống tính thành tiền dự kiến: $\text{amount} = \text{round}(w \times p)$ (ví dụ: $0.92 \times 450\,000 = 414\,000\text{ VND}$).
  4. Khách xác nhận mức giá trước khi gửi bếp. Nếu trọng lượng/thành tiền tăng vượt ngưỡng cấu hình (`weight_variance_threshold_pct`) so với ước tính ban đầu, bắt buộc trạng thái `WAITING_CUSTOMER_WEIGHT_CONFIRM` và không được gửi bếp cho đến khi khách đồng ý.
- **Giá vốn ước tính:** Lưu `estimated_cost_vnd` (hoặc `estimated_cost_per_kg_vnd`). Nếu chưa cấu hình, giữ giá trị `NULL` và hiển thị *"Chưa có dữ liệu giá vốn"*, tuyệt đối không gán bằng `0`. Khi tạo dòng order, lưu cứng snapshot giá bán và giá vốn tại thời điểm đó.

### 5.2. Bàn, Phiên bàn, QR Cố định & Trạng thái Món
- Mỗi bàn có mã QR cố định chứa định danh bàn và chữ ký. Máy chủ chi nhánh ánh xạ QR vào `TableSession` đang mở (`OPEN`) cùng `session_token` động. Khi phiên bàn đóng, `session_token` lập tức hết hiệu lực.
- **Trạng thái món tách biệt rõ ràng:**
  `PENDING_APPROVAL` $\rightarrow$ `APPROVED` $\rightarrow$ `SENT_TO_KITCHEN` $\rightarrow$ `COOKING` $\rightarrow$ `COMPLETED` $\rightarrow$ `SERVED` (cùng nhánh `PENDING_CANCELLATION` / `CANCELLED`).
- Bộ đếm thời gian chế biến chuẩn chỉ bắt đầu tính khi bếp chuyển trạng thái sang `COOKING`.

### 5.3. Hóa đơn, Tách Bill & Làm tròn Số nguyên VND
- Toàn bộ tiền tệ được lưu dưới dạng **số nguyên VND** (`integer`/`bigint`), không dùng số thực dấu phẩy động.
- **Quy tắc chia đều hóa đơn ($N$ phần):**
  Với tổng tiền cần thanh toán $T \in \mathbb{Z}_{\ge 0}$ và số phần chia $N \in \mathbb{Z}_{\ge 2}$:
  $$q = \lfloor T / N \rfloor, \quad r = T \bmod N$$
  - $r$ hóa đơn con đầu tiên nhận số tiền $q + 1\text{ VND}$.
  - $N - r$ hóa đơn con còn lại nhận số tiền $q\text{ VND}$.
  - Bảo đảm bất biến toán học: $\sum_{i=1}^{N} T_i = r(q+1) + (N-r)q = Nq + r = T$. Không thất thoát hay dư thừa 1 đồng nào.
  - Khoản giảm giá cấp hóa đơn (nếu có trước khi chia) cũng được phân bổ theo cùng thuật toán chia nguyên có dư để tổng giảm giá các bill con khớp tuyệt đối với tổng giảm giá gốc.
- **Mã hiển thị hóa đơn:** Định dạng `<Mã_CN>-<YYYYMMDD>-<Số_thứ_tự_4_chữ_số>` theo ngày kinh doanh của chi nhánh (ví dụ: `BG01-20261016-0001`), tách biệt với khóa chính `id` (UUIDv7/ULID) trong cơ sở dữ liệu.

### 5.4. Thanh toán, Giảm giá, Đóng bàn còn nợ & Hoàn tiền
- Hỗ trợ Tiền mặt (`CASH`) và Chuyển khoản ngân hàng qua QR tĩnh (`BANK_TRANSFER_STATIC_QR`), cho phép kết hợp nhiều lần/nhiều phương thức trên một hóa đơn.
- **Đóng bàn còn nợ:** Giải phóng trạng thái bàn về `AVAILABLE`/`CLEANING` nhưng giữ nguyên hóa đơn ở trạng thái `UNPAID` hoặc `PARTIALLY_PAID` với số dư nợ `debt_amount_vnd > 0`. Khi khách trả nợ vào ngày hôm sau, khoản thu được ghi nhận vào **ngày thực tế nhận tiền** (`collected_business_date`), gắn với hóa đơn gốc, **không cộng lặp vào doanh thu (`revenue`) ngày mới**.
- **Báo cáo tài chính tách biệt 8 chỉ số:** Doanh thu phát sinh, Tiền thực thu, Tiền mặt thực thu, Tiền chuyển khoản thực thu, Giảm giá, Hoàn tiền, Khoản phải thu (công nợ phát sinh/còn lại), và Khoản điều chỉnh.

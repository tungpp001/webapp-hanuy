# GIẢ ĐỊNH KỸ THUẬT, RỦI RO & BIỆN PHÁP GIẢM THIỂU (ASSUMPTIONS & RISKS)

## 1. Các Giả định Kỹ thuật An toàn Đã Ghi nhận

1. **Tổ chức Monorepo Không Phá hủy:**
   - Theo quyết định của chủ dự án ở Giai đoạn 0, ứng dụng học tiếng Trung hiện có (`HanYuFlow`) được giữ nguyên vẹn trong `packages/hanyuflow`, còn hệ thống SaaS Quản lý Order Quán Ốc được xây dựng trong các package `packages/shared`, `packages/database`, `packages/backend`, `packages/web` và `infra/`.
2. **Đơn vị Tiền tệ và Làm tròn:**
   - Mọi số tiền giao dịch tại Việt Nam trong phạm vi sản phẩm đều là số nguyên đồng (`VND`). Khi tính thành tiền cho món bán theo cân ($\text{weight\_kg} \times \text{price\_per\_kg\_vnd}$), kết quả được làm tròn đến hàng đơn vị đồng gần nhất (`Math.round`) và phải được khách xác nhận trước khi gửi bếp.
3. **Ngưỡng Cảnh báo Tăng giá Món Bán theo Cân:**
   - Mặc định cấu hình ngưỡng chênh lệch trọng lượng/thành tiền cần xin xác nhận lại của khách là **$> 10\%$** so với mức ước tính ban đầu (có thể cấu hình theo từng chi nhánh từ $0\%$ đến $50\%$).
4. **Hạn mức Giảm giá Mặc định của Thu ngân:**
   - Mặc định Thu ngân được phép giảm giá tối đa **$10\%$** và không quá **$100.000\text{ VND}$** trên một hóa đơn. Mọi khoản giảm vượt một trong hai ngưỡng này bắt buộc phải có phê duyệt của `BRANCH_MANAGER` hoặc `CHAIN_OWNER`.
5. **Biên độ Thay đổi Giá của Quản lý Chi nhánh:**
   - Mặc định Quản lý chi nhánh được điều chỉnh giá bán riêng (`OVERRIDE`) trong biên độ **$\pm 15\%$** so với giá chuẩn của chuỗi. Vượt biên độ này sẽ tạo yêu cầu chờ `CHAIN_OWNER` phê duyệt và chưa được áp dụng cho đến khi được duyệt.
6. **Cơ sở dữ liệu Kiểm thử trong Môi trường Phát triển Hiện tại:**
   - Do trên máy Windows hiện tại, dịch vụ Docker Desktop Engine đang tắt và PowerShell chặn `.ps1`, hệ thống được thiết kế để vừa có đầy đủ `docker-compose.yml` chuẩn production cho PostgreSQL Primary/Standby, vừa tích hợp引擎 PostgreSQL nhúng thực tế (**PGlite / Embedded PostgreSQL**) và SQLite/PostgreSQL adapter cho phép chạy **100% các bài kiểm thử Unit, Integration, E2E và Load Test ngay lập tức trên Node.js `v24.19.0`** với đầy đủ kiểm tra ACID transaction, khóa ngoại và ràng buộc dữ liệu.

---

## 2. Bảng Đánh giá Rủi ro & Biện pháp Kiểm soát

| Mã Rủi ro | Mô tả Rủi ro | Mức độ | Biện pháp Giảm thiểu trong Thiết kế & Code |
| :--- | :--- | :--- | :--- |
| **R-01** | **Tạo thanh toán hoặc đơn hàng trùng lặp** khi mạng Wi-Fi tại quán ốc bị yếu, nhân viên/khách bấm nút nhiều lần. | Nghiêm trọng | Bắt buộc `Idempotency-Key` + kiểm tra `SHA-256 payload_hash` ở tầng cơ sở dữ liệu với khóa `UNIQUE (tenant_id, branch_id, idempotency_key)`. |
| **R-02** | **Mất dữ liệu hoặc Split-Brain** khi Máy chủ chính (Primary) gặp sự cố và chuyển sang Máy chủ dự phòng (Standby), sau đó máy cũ tự bật lại. | Nghiêm trọng | Áp dụng `cluster_epoch` tăng đơn điệu; máy chủ có epoch thấp hơn tự động khóa quyền ghi (`Quarantined Read-Only`). Không tự động failback. |
| **R-03** | **Báo thành công giả khi Standby mất kết nối**, dẫn đến mất giao dịch đã xác nhận nếu Primary hỏng ổ cứng ngay sau đó. | Nghiêm trọng | Tách biệt trạng thái `PERSISTED_LOCAL` và `CONFIRMED_DUAL_NODE`. Khi Standby mất kết nối, trả trạng thái cảnh báo rõ ràng và áp dụng chính sách khóa/chờ xác nhận an toàn. |
| **R-04** | **Ghi nhận trùng doanh thu** khi khách đóng bàn còn nợ hôm trước và quay lại trả nợ vào ngày hôm sau. | Cao | Tách biệt `Invoice.business_date` (ngày ghi nhận doanh thu và khoản phải thu) với `Payment.collected_business_date` + cờ `is_debt_collection = true` (chỉ cộng vào Tiền thực thu, trừ Công nợ, không cộng lại Doanh thu). |
| **R-05** | **Thay đổi giá Menu chuẩn làm lệch hóa đơn lịch sử** hoặc ghi đè giá riêng của chi nhánh. | Cao | Lưu snapshot cứng (`unit_price_vnd_snapshot`, `estimated_unit_cost_vnd_snapshot`) vào từng dòng `OrderItem`. Dùng cột `price_mode` tường minh (`INHERITED` vs `OVERRIDE`). |
| **R-06** | **Máy in nhiệt kẹt giấy/mất mạng** làm mất đơn hàng hoặc khi máy chủ khởi động lại tự động in tràn hàng trăm phiếu cũ. | Cao | Quản lý `PrintJob` độc lập với `OrderRound`. KDS vẫn nhận món ngay khi duyệt. Không coi lệnh gửi TCP là đã in xong giấy; khi khởi động lại chỉ khôi phục các job chưa gửi, không in lại job đã hoàn tất. |
| **R-07** | **Mất đồng thời cả Máy chủ chính, Máy chủ dự phòng và chưa kịp đồng bộ Cloud** (ví dụ: hỏa hoạn, ngập nước, sét đánh lan truyền tại quán khi đang đứt cáp Internet). | Trung bình - Cao | Cảnh báo rõ trong Runbook vận hành; sao lưu mã hóa lên Cloud ngay khi có Internet; hướng dẫn chi nhánh sử dụng Biểu mẫu Order/Thanh toán bằng giấy khi mất điện toàn cục. |

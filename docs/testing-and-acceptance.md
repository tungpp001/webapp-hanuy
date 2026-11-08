# KIỂM THỬ, KIỂM THỬ TẢI & TIÊU CHÍ NGHIỆM THU (TESTING & ACCEPTANCE)

## 1. Chiến lược Kiểm thử Đa tầng (Testing Pyramid)

Tuyệt đối không nghiệm thu chỉ bằng cách mở giao diện web hoặc dùng dữ liệu giả lập. Mọi module phải vượt qua các tầng kiểm thử tự động thực tế:

1. **Unit Tests (Vitest / Jest):**
   - Kiểm thử các quy tắc nghiệp vụ cốt lõi: tính tiền món bán theo cân ($\text{kg} \times \text{VND/kg}$), thuật toán chia đều hóa đơn và phân bổ phần dư số nguyên VND, quy tắc kế thừa giá `INHERITED` vs `OVERRIDE`, kiểm tra trạng thái hợp đồng + 7 ngày gia hạn, state machine của bàn/phiên bàn/món ăn/hóa đơn.
2. **Integration & Data Integrity Tests (Chạy trên PostgreSQL / PGlite thực tế):**
   - Kiểm thử cô lập đa khách hàng (`Tenant Isolation`) và phạm vi chi nhánh (`Branch Scope`).
   - Kiểm thử `Idempotency-Key`: gửi lặp request tạo đơn, thanh toán, hoàn tiền, hủy hóa đơn (cùng key + cùng payload $\rightarrow$ trả kết quả gốc, không tạo bản ghi thứ 2; cùng key + khác payload $\rightarrow$ từ chối `409 Conflict`).
   - Kiểm thử chính sách xác nhận kép `Primary` + `Standby`: khi `Standby` ngừng phản hồi, hệ thống không trả kết quả `CONFIRMED_DUAL_NODE` giả tạo.
   - Kiểm thử quy trình Sao lưu (`Backup`), Giải mã và Khôi phục vào môi trường cách ly (`Isolated Restore Verification`), đối chiếu khớp 100% số hóa đơn và tổng tiền.
   - Kiểm thử quy trình Chuyển đổi máy chủ (`Failover`) và chặn `Split-Brain` khi máy chủ cũ sống lại.
3. **End-to-End (E2E) Workflow Tests:**
   - Luồng trọn vẹn từ mở phiên bàn $\rightarrow$ khách quét QR gọi món (gồm cả món bán theo phần và món bán cân cần khách xác nhận giá) $\rightarrow$ nhân viên duyệt $\rightarrow$ tạo phiếu in bếp (chỉ in món mới ở lượt gọi bổ sung) $\rightarrow$ bếp bấm `COOKING` rồi `COMPLETED` $\rightarrow$ phục vụ đánh dấu `SERVED` $\rightarrow$ tách hóa đơn / giảm giá $\rightarrow$ thanh toán kết hợp Tiền mặt + Chuyển khoản QR tĩnh / đóng bàn còn nợ $\rightarrow$ thu nợ ngày hôm sau $\rightarrow$ báo cáo tài chính tách biệt Doanh thu và Tiền thực thu.
4. **Load Testing (Kiểm thử tải 250 thiết bị đồng thời):**
   - Mô phỏng 250 thiết bị hoạt động đồng thời theo phân phối thực tế tại chuỗi quán ốc.

---

## 2. Danh mục Kiểm thử Nghiệp vụ & Dữ liệu Bắt buộc (32 Kịch bản)

| STT | Nhóm Kiểm thử | Kịch bản Kiểm chứng | Tiêu chí Đạt (Pass Criteria) |
| :--- | :--- | :--- | :--- |
| 1 | Tenant & Hợp đồng | Tạo tenant, hợp đồng, chi nhánh, cấu hình thương hiệu | Cô lập dữ liệu hoàn toàn giữa các tenant |
| 2 | Hết hạn Hợp đồng | Hợp đồng trong 7 ngày gia hạn vs sau 7 ngày gia hạn | Trong 7 ngày: cảnh báo nhưng mở bàn được; Sau 7 ngày: chặn mở phiên bàn mới và chặn thêm lượt gọi món mới vào phiên cũ, nhưng cho phép thanh toán & in hóa đơn phiên đang mở |
| 3 | Offline License | Mất Internet khi hợp đồng còn hạn | Chi nhánh tiếp tục hoạt động bình thường dựa trên `SignedLicenseLease`, không báo hết hạn giả |
| 4 | RBAC & MFA | Đăng nhập 7 vai trò, MFA cho SaaS Admin & Tech Support, tự khóa POS 15 phút | Chặn truy cập trái quyền ở cấp API; khóa POS sau 15 phút không làm mất đơn đang nhập |
| 5 | Hỗ trợ từ xa | Kỹ thuật viên truy cập khi có/không có phê duyệt | Không có grant hoặc hết hạn bị từ chối `403`; khi có grant vẫn bị chặn sửa hóa đơn/thanh toán/hoàn tiền |
| 6 | Menu & Kế thừa giá | Đổi giá chuẩn trên Cloud khi chi nhánh có món `INHERITED` và `OVERRIDE` | Món `INHERITED` nhận giá mới khi đồng bộ; món `OVERRIDE` giữ nguyên; hóa đơn cũ không đổi giá |
| 7 | Giới hạn đổi giá CN | Quản lý CN tăng/giảm giá trong khung vs vượt khung | Vượt khung tạo `ApprovalRequest` chờ Chủ chuỗi duyệt, chưa áp dụng ngay |
| 8 | Món bán theo cân | Nhân viên nhập kg, tính tiền, trường hợp tăng vượt ngưỡng | Yêu cầu khách xác nhận trước khi gửi bếp; lưu đầy đủ người nhập, kg, giá/kg, thời gian |
| 9 | Món hết hàng | Khách đặt món vừa hết hàng, nhân viên đề xuất món thay thế | Chỉ đổi khi khách đồng ý, lưu lịch sử món gốc + lý do, không tự đổi sang món đắt hơn |
| 10 | Giá vốn ước tính | Món có giá vốn vs món chưa nhập giá vốn (`NULL`) | Món chưa có hiển thị `"Chưa có dữ liệu giá vốn"`, không tự gán `0`; lưu snapshot vào `OrderItem` |
| 11 | QR Cố định & Phiên | Khách quét QR khi phiên đang mở vs sau khi phiên đã đóng / thu hồi QR | Phiên đóng hoặc QR bị thu hồi làm token cũ mất hiệu lực ngay lập tức |
| 12 | Gọi thêm món & In bếp | Phiên bàn gọi Lượt 1 (3 món), sau đó gọi thêm Lượt 2 (2 món) | Phiếu in bếp Lượt 2 chỉ chứa 2 món mới, không in lại 3 món của Lượt 1 |
| 13 | Màn hình Bếp (KDS) | Chuyển trạng thái `SENT_TO_KITCHEN` $\rightarrow$ `COOKING` $\rightarrow$ `COMPLETED` | Thời gian chế biến chỉ bắt đầu tính từ lúc bấm `COOKING` |
| 14 | Hủy món theo giai đoạn | Hủy trước duyệt, sau duyệt chưa gửi bếp, đang nấu, và sau khi hoàn thành | Trước bếp: dừng in; Sau bếp: bắt buộc Quản lý duyệt + lý do; Đang nấu: ghi nhận hao phí; Đã hoàn thành/phục vụ: chặn hủy xóa lịch sử, bắt buộc dùng giảm giá/điều chỉnh |
| 15 | Chuyển & Gộp bàn | Chuyển bàn B01 $\rightarrow$ B05; Gộp bàn B02 + B03 | Giữ nguyên toàn bộ lượt gọi món, không tạo giao dịch trùng hoặc mất món |
| 16 | Chia đều Hóa đơn | Chia hóa đơn `1.000.000 VND` cho `3` người | Tạo 3 hóa đơn con: `333.334`, `333.333`, `333.333 VND` (Tổng = `1.000.000 VND` chính xác) |
| 17 | Giảm giá & Hạn mức | Giảm giá trong hạn mức Thu ngân vs vượt hạn mức | Chỉ 1 khoản giảm giá/hóa đơn, không âm tiền, vượt hạn mức cần Quản lý/Chủ chuỗi duyệt |
| 18 | Thanh toán đa phương thức | Thanh toán 1 hóa đơn bằng Tiền mặt + Chuyển khoản QR tĩnh | Lưu từng lần thanh toán, người thu, mã tham chiếu; không tự coi ảnh chụp QR là đã trả tiền |
| 19 | Đóng bàn còn nợ & Thu nợ | Đóng bàn khi còn nợ `200.000 VND`, khách trả nợ vào ngày hôm sau | Giải phóng bàn nhưng giữ hóa đơn `PARTIALLY_PAID`/`UNPAID`; ngày hôm sau thu nợ cộng vào `Tiền thực thu` ngày mới, **không cộng lặp vào `Doanh thu`** |
| 20 | Hoàn tiền & Điều chỉnh | Hoàn tiền một phần/toàn phần trên hóa đơn đã thu | Không vượt quá số tiền thực thu đủ điều kiện; phân biệt Yêu cầu/Duyệt/Thực hiện; chống trùng khi bấm lặp |
| 21 | Hàng đợi In & Mất máy in | Máy in mất kết nối mạng LAN khi duyệt đơn / thanh toán | Đơn và thanh toán vẫn lưu bền vững, KDS vẫn hiện món; lệnh in vào trạng thái lỗi chờ thử lại; in lại có nhãn `"IN LẠI"`; khởi động lại không tự in lại phiếu đã hoàn tất |
| 22 | Idempotency & Retry | Mất phản hồi mạng, client gửi lại cùng `Idempotency-Key` | Trả về đúng kết quả giao dịch đầu tiên, số lượng bản ghi thanh toán/đơn hàng không tăng thêm |
| 23 | Đồng bộ Cloud & Offline | Chi nhánh mất Internet 2 giờ, thực hiện 50 đơn & thanh toán, sau đó có mạng lại | Toàn bộ `OutboxEvent` đồng bộ lên Cloud không thiếu, không trùng doanh thu, không bị dữ liệu Cloud cũ ghi đè |
| 24 | Backup, Restore & Failover | Sao lưu, khôi phục vào DB cách ly, chuyển quyền Primary sang Standby và bật lại máy cũ | Khôi phục khớp 100% số liệu; Failover kiểm tra điều kiện an toàn; máy cũ bật lại không gây Split-Brain |

---

## 3. Đặc tả Kiểm thử Tải (250 Thiết bị Đồng thời) & Ngưỡng Đề xuất

### 3.1. Mô hình Workload Thực tế (250 Thiết bị Đồng thời)
250 thiết bị kết nối đồng thời không đồng nghĩa với 250 giao dịch ghi mỗi giây, mà phân bổ theo hành vi thực tế tại các chi nhánh:
- **160 thiết bị Khách quét QR:** Xem menu, lọc nhóm món, gửi yêu cầu gọi món và theo dõi trạng thái món (tần suất thao tác trung bình 1 request mỗi 5–15 giây/thiết bị).
- **50 thiết bị Nhân viên Phục vụ:** Mở bàn, nhập cân nặng món ốc, duyệt đơn QR, đánh dấu đã phục vụ.
- **20 màn hình Bếp (KDS):** Polling/WebSocket nhận món mới và cập nhật trạng thái `COOKING` / `COMPLETED`.
- **15 máy Thu ngân / Quản lý CN:** Tạo hóa đơn, tách bill, ghi nhận thanh toán, xem báo cáo ca.
- **5 tiến trình Đồng bộ Chi nhánh $\leftrightarrow$ Cloud:** Đẩy lô sự kiện Outbox và kiểm tra sức khỏe.

### 3.2. Ngưỡng Độ trễ & Độ tin cậy Đề xuất (Để Chủ sản phẩm Phê duyệt)
- **Tỷ lệ lỗi giao dịch hợp lệ (Error Rate):** $0\%$ đối với lỗi làm sai lệch dữ liệu; $< 0.1\%$ đối với timeout tạm thời.
- **Số giao dịch trùng hoặc mất (Duplicate / Lost Confirmed Transactions):** **Tuyệt đối bằng `0`**.
- **Độ trễ API đọc (Menu, Bàn, KDS):** `p50 <= 50ms`, `p95 <= 200ms`, `p99 <= 400ms`.
- **Độ trễ API ghi giao dịch (Order, Payment có Idempotency):** `p50 <= 100ms`, `p95 <= 350ms`, `p99 <= 800ms`.

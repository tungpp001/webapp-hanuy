# SỔ TAY VẬN HÀNH, XỬ LÝ SỰ CỐ & BIỂU MẪU GIẤY DỰ PHÒNG (RUNBOOK & PAPER FALLBACK)

## 1. Xử lý Sự cố Thường gặp tại Chi nhánh

### 1.1. Mất Kết nối Internet (WAN Down, LAN vẫn hoạt động)
- **Triệu chứng:** Biểu ngữ trên màn hình POS hiện màu vàng *"ĐANG OFFLINE INTERNET — Vận hành nội bộ qua LAN"*.
- **Hành động:**
  1. Nhân viên phục vụ, bếp, thu ngân và khách quét QR (kết nối Wi-Fi nội bộ của quán) **tiếp tục gọi món, duyệt đơn, nấu món, in hóa đơn và thanh toán bình thường 100%**.
  2. Không khởi động lại router hay máy chủ khi đang giờ cao điểm nếu mạng LAN nội bộ vẫn thông suốt.
  3. Khi Internet có trở lại, tiến trình `CloudSyncWorker` sẽ tự động đẩy hàng đợi `OutboxEvent` lên Cloud mà không tạo giao dịch trùng.

### 1.2. Máy in Nhiệt Bếp hoặc Thu ngân Hỏng / Kẹt giấy / Mất kết nối LAN
- **Triệu chứng:** Cảnh báo `PRINT_QUEUE` màu đỏ/vàng trên POS; phiếu in ở trạng thái `FAILED` hoặc `DISPATCHED_UNVERIFIED`.
- **Hành động:**
  1. **Màn hình Bếp (KDS) vẫn hiển thị đầy đủ món mới ngay lập tức.** Bếp tiếp tục chế biến theo màn hình KDS.
  2. Kiểm tra nguồn điện, cuộn giấy nhiệt và dây cáp mạng LAN cắm vào máy in (`192.168.10.51` cho Bếp, `192.168.10.52` cho Thu ngân).
  3. Sau khi khắc phục máy in, bấm nút **`In lại (Nhãn "IN LẠI")`** trên từng phiếu bị lỗi. Hệ thống sẽ in phiếu kèm dòng chữ **`IN LẠI`** rõ ràng để bếp không nấu trùng món lần 2.

### 1.3. Mất Kết nối Giữa Máy chủ Chính (Primary) và Máy chủ Dự phòng (Standby)
- **Triệu chứng:** Cảnh báo đỏ `REPLICATION`: *"Máy chủ dự phòng chưa xác nhận dữ liệu giao dịch"*.
- **Hành động:**
  1. Kiểm tra dây mạng Ethernet nối giữa Máy chủ chính (`192.168.10.10`) và Máy chủ dự phòng (`192.168.10.11`) vào Switch nội bộ.
  2. Hệ thống giữ các giao dịch mới ở trạng thái `PERSISTED_LOCAL` và không bao giờ báo xác nhận kép giả tạo.
  3. Tuyệt đối **không bấm Failover mù quáng** khi máy dự phòng chưa đồng bộ đủ sequence.

### 1.4. Mất Điện Toàn Chi nhánh (Power Outage)
- **Trong lúc mất điện:**
  1. Thu ngân và Phục vụ chuyển ngay sang sử dụng **Biểu mẫu Order & Thanh toán bằng giấy** (Mục 2 bên dưới).
- **Khi có điện trở lại:**
  1. Khởi động Máy chủ chính (`192.168.10.10`) trước $\rightarrow$ Đợi dịch vụ PostgreSQL và API báo `Health: OK`.
  2. Khởi động Máy chủ dự phòng (`192.168.10.11`) và kiểm tra trạng thái Replication.
  3. Kiểm tra danh sách giao dịch `UNCERTAIN_NEEDS_RECONCILIATION` và hàng đợi in (hệ thống không tự động in tràn các phiếu đã hoàn tất trước khi mất điện).
  4. Nhập bổ sung các phiếu giấy phát sinh trong thời gian mất điện vào hệ thống để đối soát doanh thu và tiền thực thu.

---

## 2. Biểu mẫu Ghi Order & Thanh toán Bằng Giấy (Dùng khi Mất điện hoặc Sự cố Nghiêm trọng)

> **Hướng dẫn:** In sẵn tối thiểu 50 tờ biểu mẫu này để tại quầy Thu ngân của mỗi chi nhánh.

```text
================================================================================
              PHIẾU ORDER & THANH TOÁN DỰ PHÒNG (BẢN GIẤY)
Chi nhánh: [________]   Ngày kinh doanh: ____/____/202__   Ca: [ Sáng / Tối ]
Số Bàn:    [________]   Giờ mở bàn:      ____:____         Phục vụ: [_________]
Mã phiếu giấy (Số thứ tự): PG-____________
--------------------------------------------------------------------------------
STT |Lượt| Tên món ốc / Hải sản      | SL / Cân (kg)| Đơn giá   | Thành tiền |Khách ký nhận cân
----|----|---------------------------|--------------|-----------|------------|-----------------
 1  | #1 |                           |              |           |            |
 2  | #1 |                           |              |           |            |
 3  | #2 |                           |              |           |            |
 4  | #2 |                           |              |           |            |
--------------------------------------------------------------------------------
Tổng tiền món (Subtotal VND):          _______________________ VND
Giảm giá (Lý do: ___________________): _______________________ VND (QL ký: _____)
TỔNG CỘNG PHẢI THANH TOÁN:             _______________________ VND
--------------------------------------------------------------------------------
[ ] Tiền mặt: _________________ VND   [ ] Chuyển khoản QR: _________________ VND
    (Thu ngân đã kiểm tra App Ngân hàng lúc ___:___ - Mã GD: __________________)
[ ] Đóng bàn còn nợ: __________ VND   (Quản lý duyệt: __________ Lý do: ________)
--------------------------------------------------------------------------------
Trạng thái nhập lại vào hệ thống khi có điện:
[ ] Đã đối soát & nhập lúc ___:___ ngày ___/___/202__ bởi: ____________________
    Mã Hóa đơn hệ thống tương ứng: ___________________________
================================================================================
```

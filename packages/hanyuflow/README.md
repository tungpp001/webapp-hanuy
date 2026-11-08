# HanYuFlow (汉语流) - Web App Học Tiếng Trung Giao Tiếp Thực Chiến

Ứng dụng web chuyên sâu về **Tiếng Trung Giao Tiếp Thực Chiến (Conversational Chinese)** dành cho người Việt, kết hợp Chữ Hán, Pinyin, Âm Hán-Việt, Bản dịch ngữ cảnh, Audio phát âm giọng bản xứ và nhận diện giọng nói luyện phát âm AI qua Microphone.

![HanYuFlow Banner](https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?auto=format&fit=crop&w=1200&q=80)

---

## ✨ Tính Năng Nổi Bật

- **📖 Hội thoại Tình huống Thực tế (10+ chủ đề)**: Gọi món ăn, mặc cả mua sắm Taobao, hỏi đường, đi taxi, đặt phòng khách sạn, làm quen kết bạn, phỏng vấn xin việc, đi khám bệnh, sân bay...
- **🔤 Đa tầng hiển thị thông minh**: Bật/Tắt linh hoạt Chữ Hán, Pinyin, Âm Hán-Việt và Bản dịch tiếng Việt để luyện phản xạ.
- **🎙️ Chế độ Luyện Nói AI (Roleplay Mode)**: Đóng vai đối thoại 2 chiều, thu âm qua Microphone và chấm điểm phát âm thời gian thực (%).
- **🔍 Tra từ tức thì (Smart Lookup)**: Bấm vào bất kỳ từ nào trong câu để xem thẻ tra nghĩa, loại từ, bộ thủ và ví dụ câu.
- **🎵 Tone Master (Luyện 4 Thanh Điệu)**: Game luyện tai phân biệt thanh 1, 2, 3, 4, biểu đồ cao độ và bảng tra cứu Pinyin tương tác.
- **🧩 Practice Hub**: Game sắp xếp từ thành câu chuẩn ngữ pháp, trắc nghiệm nghe hiểu tình huống và Flashcard 3D SRS.
- **🌸 AI Chatbot Giao Tiếp (Tiểu Hoa)**: Trò chuyện tự do theo chủ đề bằng tiếng Trung có phát âm và dịch tự động.
- **🎨 Giao diện Á Đông Hiện Đại**: Tông màu Cố Cung (Đỏ Chu Sa & Vàng Kim), hỗ trợ Dark / Light Mode.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Canvas Confetti
- **Audio & Speech Engine**: Web Speech Synthesis API (TTS zh-CN) + Web Speech Recognition API (STT) + Web Audio API Synthesizer

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu
- Node.js (phiên bản 18 trở lên)
- Trình duyệt Chrome / Edge (để hỗ trợ tốt nhất tính năng nhận diện Microphone)

### Cài Đặt
```bash
# 1. Cài đặt các thư viện phụ thuộc
npm install

# 2. Khởi chạy môi trường phát triển (Dev server)
npm run dev

# 3. Mở trình duyệt và truy cập
http://localhost:5173
```

### Đóng Gói (Build)
```bash
npm run build
```

---

## 📄 Bản Quyền
Dự án được xây dựng phục vụ mục đích học tập và nâng cao kỹ năng giao tiếp tiếng Trung.

# Game Distance Tracker

Ứng dụng đo khoảng cách trong game theo thời gian thực (Real-time). Hỗ trợ xem kết quả ngay trên điện thoại của bạn mà không cần cài đặt thêm app!

## 🌟 Tính năng nổi bật
- **Không cần Python**: Phiên bản mới đã loại bỏ hoàn toàn sự rườm rà của Python. Toàn bộ hệ thống chạy trên nền tảng JavaScript/Electron.
- **Desktop App (.exe)**: Giao diện trực quan trên màn hình máy tính với đầy đủ công cụ.
- **Mobile PWA**: Xem khoảng cách ngay trên điện thoại thông qua trình duyệt web. Có thể "Cài đặt" (Add to Home Screen) để sử dụng như một app Native trên iOS/Android.
- **Giao diện đậm chất Gaming**: Dark theme cực kỳ chuyên nghiệp và sang trọng.

---

## 🚀 Hướng dẫn khởi động (PC)

### Cách 1: Chạy trực tiếp qua Source Code (Đang mở)
Do máy tính của bạn chưa có quyền Administrator để tạo file `.exe` (lỗi symlink của bộ nén), bạn hoàn toàn có thể chạy phần mềm ngay lập tức bằng lệnh sau trong Terminal/PowerShell:

```bash
npm start
```

### Cách 2: Tự Build file .exe
Nếu bạn muốn đóng gói thành file `.exe` để gửi cho bạn bè hoặc click chuột 2 lần là chạy:
1. Mở PowerShell dưới quyền **Run as Administrator**.
2. Di chuyển đến thư mục `c:\SD21202\CountPUBG`.
3. Chạy lệnh: `npm run dist`
4. File cài đặt sẽ được tạo ra trong thư mục `dist`.

---

## 📱 Hướng dẫn kết nối Điện Thoại

Bạn **không cần** chép source code này sang điện thoại. Máy tính (PC) sẽ đóng vai trò là Server phát tín hiệu cho điện thoại kết nối qua mạng WiFi.

1. Khởi động phần mềm trên máy tính.
2. Trên giao diện PC, phần mềm sẽ hiển thị một **Mã Kết Nối (Room Code)** gồm 6 chữ số và một **Mã QR Code**.
3. Cầm điện thoại (đảm bảo đang kết nối **cùng một mạng WiFi** với máy tính).
4. Mở Camera điện thoại và quét mã QR Code trên màn hình PC.
5. Điện thoại sẽ tự động mở trang web giao diện và kết nối thành công!

> **💡 Mẹo:** Khi web mở lên trên điện thoại, bạn có thể nhấn "Cài đặt App" (hoặc Thêm vào màn hình chính) để trải nghiệm toàn màn hình mà không bị thanh địa chỉ của trình duyệt làm phiền.

---

## 🎮 Cách sử dụng đo khoảng cách

Sau khi điện thoại đã báo "Đã kết nối", bạn sử dụng phần mềm bằng phím tắt:

1. **Mở bản đồ lớn (Big Map)** trong game.
2. **Đặt điểm đánh dấu (Marker)** màu đỏ tại vị trí bạn muốn đo khoảng cách tới.
3. Bấm tổ hợp phím **`Alt + Z`** trên bàn phím.
4. Khoảng cách (Mét) sẽ lập tức hiện lên màn hình PC và **hiện ngay trên điện thoại của bạn**.

### Calibrate (Căn chỉnh sai số)
Nếu bạn thấy khoảng cách báo chưa chính xác, hãy dùng tính năng Calibrate:
1. Đặt marker tại một điểm mà bạn *đã biết chính xác* khoảng cách thực tế là bao nhiêu mét.
2. Bấm phím **`Alt + C`**.
3. Tại cửa sổ phần mềm PC, nhập số mét thực tế đó vào ô Calibrate rồi nhấn OK.
4. Từ bây giờ các lần đo sẽ chuẩn xác 100%.

---

## 🧹 Dọn dẹp file cũ
Các file cũ sử dụng Python (`pc_script.py`, `requirements.txt`, `PUBG_Distance_Tracker.md`) đã không còn cần thiết và bạn có thể xóa chúng đi để thư mục gọn gàng hơn. Toàn bộ mã nguồn hiện tại đã được nâng cấp.

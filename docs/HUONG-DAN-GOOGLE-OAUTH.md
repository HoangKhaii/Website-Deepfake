# Hướng dẫn tránh lỗi 401: invalid_client / OAuth client không tìm thấy

Khi bấm **"Continue with Google"** mà gặp trang lỗi của Google: **"Access blocked: Authorization Error - The OAuth client was not found - Error 401: invalid_client"**, có hai hướng xử lý.

---

## Cách 1: Tránh lỗi khi chưa dùng Google (không cấu hình OAuth)

Nếu bạn **chưa muốn bật đăng nhập Google**, cần đảm bảo:

1. **File `.env` của backend** (thư mục `backend/`) vẫn dùng giá trị mẫu:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
   Không đổi thành chuỗi bất kỳ giống ID thật (ví dụ chuỗi có `.apps.googleusercontent.com`).

2. **Restart backend** sau mỗi lần sửa code hoặc .env:
   - Dừng server (Ctrl+C), chạy lại: `npm start` hoặc `node src/app.js` trong thư mục `backend/`.

3. **Luôn bấm "Continue with Google" từ trang Login của bạn**  
   Link phải trỏ tới backend: `http://localhost:5000/api/auth/google` (hoặc `API_BASE/auth/google`).  
   Trang Login hiện tại đã dùng `API_BASE` nên khi backend chạy đúng, sẽ không mở thẳng trang Google.

**Kết quả:** Khi chưa cấu hình Google thật, bấm "Continue with Google" sẽ **không** chuyển sang trang lỗi 401 của Google, mà quay về trang đăng nhập với thông báo: *"Google đăng nhập chưa được cấu hình..."*.

---

## Cách 2: Bật đăng nhập Google (cấu hình OAuth thật)

Lỗi **401: invalid_client** xảy ra vì Google không nhận ra "OAuth client" (ID/Secret trong .env là mẫu hoặc sai). Để sửa hẳn và dùng được Google login:

### Bước 1: Vào Google Cloud Console

- Mở: [Google Cloud Console](https://console.cloud.google.com/)
- Chọn project có sẵn hoặc **tạo project mới** (ví dụ: DeepCheck).

### Bước 2: Bật API cần thiết

- Vào **"API và dịch vụ"** → **"Thư viện"**.
- Tìm và bật **"Google People API"** (Google+ API đã bị deprecated, dùng People API thay thế).

### Bước 3: Cấu hình OAuth consent screen

- Vào **"API và dịch vụ"** → **"Màn hình đồng ý OAuth"**.
- Chọn **"External"** (để cho phép bất kỳ tài khoản Google nào đăng nhập).
- Điền **Tên ứng dụng**, **Email hỗ trợ** và các mục bắt buộc → **Lưu**.

### Bước 4: Tạo OAuth 2.0 Client ID

- Vào **"API và dịch vụ"** → **"Thông tin xác thực"** → **"Tạo thông tin xác thực"** → **"ID ứng dụng khách OAuth"**.
- **Loại ứng dụng:** chọn **"Ứng dụng web"**.
- **Nguồn JavaScript đã ủy quyền:** thêm **2 dòng**:
  - `http://localhost:5173`
  - `http://localhost:5000`
- **URI chuyển hướng đã ủy quyền:** thêm URL callback của backend:
  - `http://localhost:5000/api/auth/google/callback`
- **Tạo** → copy **Client ID** và **Client Secret**.

> **⚠️ Quan trọng:** Nếu bạn không thêm đúng redirect URI như trên vào Google Console, Google sẽ trả lỗi **401: invalid_client** hoặc **redirect_uri_mismatch**.

### Bước 5: Cập nhật file `.env` của backend

Trong thư mục `backend/`, mở file `.env` và sửa (không commit file .env lên Git):

```env
GOOGLE_CLIENT_ID=<Client ID vừa copy>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<Client Secret vừa copy>
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

- Nếu backend chạy ở port khác (ví dụ 3000), đổi `5000` cho đúng và cập nhật **URI chuyển hướng** trong Google Console cho khớp.

### Bước 6: Khởi động lại backend

- Lưu `.env` → dừng backend (Ctrl+C) → chạy lại backend.
- Mở trang Login → bấm **"Continue with Google"** để kiểm tra.

Sau khi làm đủ các bước trên, Google sẽ nhận đúng OAuth client và lỗi **401 / OAuth client không tìm thấy** sẽ hết. Nếu vẫn lỗi, kiểm tra lại Client ID, Client Secret và **GOOGLE_CALLBACK_URL** (phải trùng với URI đã thêm trong Console).

# Quick Tunnel (không mua domain) — demo / bảo vệ ~1 tuần

Dùng **Cloudflare Quick Tunnel** (`trycloudflare.com`). Miễn phí; URL **đổi** nếu tắt rồi bật lại `cloudflared`.

## Trước khi chạy tunnel

1. Máy PC: bật đủ **Silent-Face FastAPI (8010)** + **deepfake FastAPI (8000)** + **upload FastAPI (8001)**.
2. Bật **3 gateway Node**:
   - `antilogin-gateway` → **5003**
   - `ai-gateway` → **5001**
   - `upload-ai-gateway` → **5002**

**Cách bật chi tiết:** xem [CHAY-AI-LOCAL-WINDOWS.md](./CHAY-AI-LOCAL-WINDOWS.md) hoặc chạy `.\scripts\start-local-fastapi.ps1` rồi `.\scripts\start-local-gateways.ps1`.

Kiểm tra local: mở `http://127.0.0.1:5003/health` → có JSON.

**Số cửa sổ khi chạy đủ:** 6 cửa (FastAPI + gateway) — xem mục FAQ trong [CHAY-AI-LOCAL-WINDOWS.md](./CHAY-AI-LOCAL-WINDOWS.md). Sau đó thêm 3 cửa `cloudflared` nếu dùng Quick Tunnel.

## Bước 1 — Mở 3 tunnel (3 cửa sổ)

Mỗi cửa sổ **giữ chạy**; đừng đóng khi demo.

**Cửa sổ A — Silent-Face (antilogin):**

```powershell
cloudflared tunnel --url http://127.0.0.1:5003
```

**Cửa sổ B — Deepfake (ai-gateway):**

```powershell
cloudflared tunnel --url http://127.0.0.1:5001
```

**Cửa sổ C — Upload AI:**

```powershell
cloudflared tunnel --url http://127.0.0.1:5002
```

Mỗi lệnh in một dòng kiểu:

`https://random-words-1234.trycloudflare.com`

Ghi lại **3 URL khác nhau** (sao chép đầy đủ, có `https://`).

### Gợi ý nhanh (Windows)

Từ thư mục repo `Website-Deepfake`:

```powershell
.\scripts\start-quick-tunnels.ps1
```

Script mở 3 cửa sổ PowerShell; bạn vẫn phải **đọc và copy URL** từng cửa.

---

## Bước 2 — Chi tiết: đã chạy xong 3 tunnel, làm gì tiếp?

### 2.1 — Lấy đúng 3 URL từ 3 cửa `cloudflared`

Mỗi cửa PowerShell đang chạy `cloudflared tunnel --url ...` sẽ có vài dòng log. Tìm dòng giống:

`https://<một-chuỗi-random>.trycloudflare.com`

**Quy tắc ánh xạ (rất quan trọng — nhầm là hỏng luồng):**

| Cửa tunnel đang trỏ tới | Bạn gọi tên | Dùng cho biến Render |
|-------------------------|-------------|------------------------|
| `http://127.0.0.1:5003` | **URL_5003** | `ANTI_SPOOF_PREDICT_URL` (đăng ký / đăng nhập mặt) |
| `http://127.0.0.1:5001` | **URL_5001** | `AI_GATEWAY_DETECT_URL` và `AI_GATEWAY_COMPARE_URL` (cùng một URL gốc) |
| `http://127.0.0.1:5002` | **URL_5002** | `UPLOAD_AI_PREDICT_URL` |

Viết nháp (Notepad), ví dụ:

```text
URL_5003 = https://aaaa.trycloudflare.com
URL_5001 = https://bbbb.trycloudflare.com
URL_5002 = https://cccc.trycloudflare.com
```

- **Không** thêm `/` ở cuối URL gốc (đúng: `https://aaaa.trycloudflare.com` — sai: `https://aaaa.trycloudflare.com/`).
- Phải là **`https://`**, không dùng `http://`.

### 2.2 — Ghép thành 4 giá trị đưa vào Render

Chỉ **nối thêm path** như bảng (path **có** dấu `/` đầu):

| Key (tên biến trên Render) | Value (dán nguyên vào ô) |
|----------------------------|---------------------------|
| `ANTI_SPOOF_PREDICT_URL` | `URL_5003` + `/api/predict` |
| `AI_GATEWAY_DETECT_URL` | `URL_5001` + `/api/detect` |
| `AI_GATEWAY_COMPARE_URL` | `URL_5001` + `/api/compare-faces` |
| `UPLOAD_AI_PREDICT_URL` | `URL_5002` + `/api/predict` |

**Ví dụ số** (thay bằng URL thật của bạn):

```text
ANTI_SPOOF_PREDICT_URL=https://aaaa.trycloudflare.com/api/predict
AI_GATEWAY_DETECT_URL=https://bbbb.trycloudflare.com/api/detect
AI_GATEWAY_COMPARE_URL=https://bbbb.trycloudflare.com/api/compare-faces
UPLOAD_AI_PREDICT_URL=https://cccc.trycloudflare.com/api/predict
```

Lưu ý: **Hai biến** `AI_GATEWAY_DETECT_URL` và `AI_GATEWAY_COMPARE_URL` **cùng** hostname với nhau (đều từ tunnel cổng **5001**), chỉ khác đoạn cuối `/api/detect` và `/api/compare-faces`.

### 2.3 — Vào Render và sửa Environment

1. Mở trình duyệt → [https://dashboard.render.com](https://dashboard.render.com) → đăng nhập.
2. Vào **Dashboard** → chọn **Web Service** của **backend** (API Node, không phải frontend tĩnh nếu bạn tách).
3. Menu bên trái hoặc tab trên cùng: **Environment** (hoặc **Environment Variables**).
4. Với **mỗi** biến trong bảng trên:
   - Nếu **chưa có**: **Add Environment Variable** → **Key** = tên biến → **Value** = chuỗi đã ghép → **Save**.
   - Nếu **đã có** (từng để IP Radmin hoặc localhost): bấm **Edit** → **thay toàn bộ Value** bằng URL `https://....trycloudflare.com/...` mới → **Save**.
5. Sau khi 4 biến đã đúng: xác nhận không còn typo (không có khoảng trắng thừa, không thiếu `https`).

### 2.4 — Deploy lại backend

1. Cùng trang service backend: **Manual Deploy** → **Deploy latest commit** (hoặc **Clear build cache & deploy** nếu Render có nút đó).
2. Đợi trạng thái **Live** (có thể 2–5 phút).
3. Nếu không thấy Manual Deploy: **Save** env đôi khi đã tự trigger deploy — xem tab **Events** / **Logs** có dòng deploy mới.

### 2.5 — Kiểm tra nhanh trước khi vào web

1. Trên **điện thoại bật 4G** (hoặc máy không dùng Wi-Fi nhà bạn): mở trình duyệt:
   - `https://<URL_5003>/health`  
   → Kỳ vọng: JSON kiểu `antilogin-gateway ok` hoặc có `status`.
2. Nếu mở không được / 502: PC có thể sleep, tunnel tắt, hoặc gateway 5003 không chạy — quay lại bật đủ **6 cửa** + **3 cửa cloudflared**.

### 2.6 — Thử trên site thật

1. Mở frontend: ví dụ [https://website-deepfake.onrender.com](https://website-deepfake.onrender.com) (hoặc URL bạn deploy).
2. Thử **đăng nhập / đăng ký mặt** (dùng `ANTI_SPOOF_PREDICT_URL`).
3. Thử **upload phát hiện** nếu có (dùng `UPLOAD_AI_PREDICT_URL` và ai-gateway).

Nếu vẫn lỗi: mở **Logs** của service backend trên Render — tìm `ECONNREFUSED`, `timeout`, `ENOTFOUND` (thường là URL tunnel sai hoặc tunnel đã tắt).

---

## Bước 3 — Tóm tắt bảng biến (copy nhanh)

| Key | Value |
|-----|--------|
| `ANTI_SPOOF_PREDICT_URL` | `URL_5003/api/predict` |
| `AI_GATEWAY_DETECT_URL` | `URL_5001/api/detect` |
| `AI_GATEWAY_COMPARE_URL` | `URL_5001/api/compare-faces` |
| `UPLOAD_AI_PREDICT_URL` | `URL_5002/api/predict` |

(`URL_5003` / `URL_5001` / `URL_5002` = 3 URL `https://....trycloudflare.com` từ 3 cửa tunnel.)

## Bước 4 — Kiểm tra (checklist)

1. Điện thoại **4G** (hoặc máy ngoài mạng nhà): mở `https://<URL_5003>/health` → thấy JSON `antilogin-gateway ok` (hoặc tương đương).
2. Mở site `https://website-deepfake.onrender.com` → thử chức năng cần AI.

## Lưu ý quan trọng (bảo vệ)

- **Cắm điện**, tắt **Sleep / Hibernate** tạm thời; **không tắt** 3 cửa `cloudflared`.
- Tắt tunnel rồi bật lại → URL mới → **sửa lại Render + deploy**.
- Chuẩn bị **video demo dự phòng** nếu mạng / tunnel lỗi giờ hội đồng.

## Sau bảo vệ

Nên chuyển sang **1 domain + Cloudflare Tunnel cố định** (xem `Website-Deepfake-1/infrastructure/cloudflare/` nếu dùng bản có thư mục đó).

# Cách bật 3 FastAPI + 3 gateway trên Windows

Thứ tự gợi ý: **bật 3 FastAPI trước**, rồi **bật 3 gateway** (gateway gọi vào FastAPI trên `127.0.0.1`).

Đường dẫn mặc định trong script: thư mục gốc `d:\AI` (cùng cấp với `back_font_end`).

---

## Lần đầu (một lần)

### Python — mỗi project (tuỳ bạn dùng venv hay không)

**Silent-Face**

```powershell
cd d:\AI\Silent-Face-Anti-Spoofing-master
pip install -r requirements-api.txt
```

**deepfake_ai**

```powershell
cd d:\AI\deepfake_ai
pip install -r requirements.txt
```

**upload_ai**

```powershell
cd d:\AI\upload_ai
pip install -r requirements.txt
```

(Nếu bạn dùng **venv/conda**, kích hoạt môi trường đó **trước** khi `pip install` và **trước** khi `python -m api.main`.)

### Node — mỗi gateway

```powershell
cd d:\AI\back_font_end\Website-Deepfake\antilogin-gateway
npm install
```

Làm tương tự trong `ai-gateway` và `upload-ai-gateway`.

### File `.env` cho antilogin (nếu chưa có)

```powershell
copy d:\AI\back_font_end\Website-Deepfake\antilogin-gateway\.env.example d:\AI\back_font_end\Website-Deepfake\antilogin-gateway\.env
```

Mặc định trỏ `SILENT_FACE_ANTI_SPOOF_URL=http://127.0.0.1:8010` — đúng nếu Silent-Face chạy port 8010.

---

## Mỗi lần demo / bảo vệ

### Cách nhanh — 2 script (từ thư mục `Website-Deepfake`)

```powershell
cd d:\AI\back_font_end\Website-Deepfake
.\scripts\start-local-fastapi.ps1
.\scripts\start-local-gateways.ps1
```

Đợi vài giây rồi mở: http://127.0.0.1:5003/health

### Cách tay — 6 cửa sổ PowerShell

**Cửa sổ 1 — Silent-Face (port 8010)**

```powershell
cd d:\AI\Silent-Face-Anti-Spoofing-master
python -m api.main
```

**Cửa sổ 2 — deepfake_ai (port 8000)**

```powershell
cd d:\AI\deepfake_ai
python -m api.main
```

**Cửa sổ 3 — upload_ai (port 8001)**

```powershell
cd d:\AI\upload_ai
python -m api.main
```

**Cửa sổ 4 — antilogin-gateway (5003)**

```powershell
cd d:\AI\back_font_end\Website-Deepfake\antilogin-gateway
npm start
```

**Cửa sổ 5 — ai-gateway (5001)**

```powershell
cd d:\AI\back_font_end\Website-Deepfake\ai-gateway
npm start
```

**Cửa sổ 6 — upload-ai-gateway (5002)**

```powershell
cd d:\AI\back_font_end\Website-Deepfake\upload-ai-gateway
npm start
```

---

## Kiểm tra

| URL | Kỳ vọng |
|-----|--------|
| http://127.0.0.1:8010/docs | Swagger Silent-Face |
| http://127.0.0.1:8000/docs | Swagger deepfake (nếu có) |
| http://127.0.0.1:8001/docs | Swagger upload_ai (nếu có) |
| http://127.0.0.1:5003/health | JSON `antilogin-gateway ok` |

---

## Lỗi thường gặp

- **`EADDRINUSE` / port đã dùng** — tắt process cũ hoặc đổi port trong `configs/api.yaml` / `.env` gateway cho khớp.
- **Gateway báo lỗi kết nối upstream** — FastAPI tương ứng chưa chạy hoặc sai port trong `.env` gateway (`AI_SERVER`, `UPLOAD_AI_SERVER_URL`, `SILENT_FACE_ANTI_SPOOF_URL`).
- **Chỉ cần đăng nhập mặt** — vẫn cần **8010 + 5003**; deepfake/upload chỉ cần nếu bạn demo upload/phát hiện file.

---

## Câu hỏi thường gặp (FAQ)

### Chỉ thấy 3 cửa sổ sau `start-local-fastapi.ps1` — có thiếu không?

**Không thiếu.** `start-local-fastapi.ps1` chỉ mở **đúng 3 cửa** (3 FastAPI). Ba cửa còn lại là **gateway Node** — phải chạy thêm:

`.\scripts\start-local-gateways.ps1`

→ Tổng **6 cửa** = 3 Python + 3 `npm start`.

### Đã chạy `start-local-fastapi.ps1` rồi có cần tự gõ `python -m api.main` thêm không?

**Không.** Script đã chạy `python -m api.main` trong từng cửa. Nếu bạn tự mở thêm 3 cửa và gõ tay nữa sẽ **chạy đúp** → dễ **trùng port** (lỗi `EADDRINUSE`).

### Vì sao cửa **upload-ai-gateway** nhìn khác **ai-gateway**?

1. **`npm install` / audit** — `start-local-gateways.ps1` tự `npm install` nếu thư mục chưa có `node_modules`. Cửa nào vừa cài sẽ in dài (cảnh báo `multer`, `npm audit`, …). Cửa đã cài sẵn thì chỉ thấy `kill-port` + `node server.js`. Muốn sạch log: một lần chạy `npm install` trong từng thư mục gateway trước khi demo.

2. **Khác cách in log** — `ai-gateway/server.js` chỉ in 2 dòng ngắn (có emoji); `upload-ai-gateway/server.js` in khung `====` và liệt kê route (`POST /api/predict`, `GET /health`). Chỉ khác **giao diện console**, không phải lỗi.

3. **Forward port khác** — ai-gateway trỏ FastAPI **8000** (deepfake), upload-ai-gateway trỏ **8001** (upload_ai). **Đúng thiết kế.**

### Gateway in `Forwarding to … 26.x.x.x:8000` thay vì `127.0.0.1`?

Trong `.env` của từng gateway có thể đang đặt **IP Radmin/VPN** để máy khác trong VPN gọi được. Nếu **FastAPI chạy trên cùng máy** với gateway, nên dùng `http://127.0.0.1:8000` (và tương tự 8001, 8010) để tránh lệ thuộc VPN. Tunnel Quick (`cloudflared` → `127.0.0.1:5001/5002/5003`) vẫn chỉ cần gateway listen local.

### Quick Tunnel: tổng cộng bao nhiêu cửa sổ?

- **6** cửa: stack AI + gateway (như trên).
- **+3** cửa nếu bật `start-quick-tunnels.ps1` (mỗi cổng 5003 / 5001 / 5002 một `cloudflared`).

Giữ tất cả cửa đó mở khi demo online qua Render.

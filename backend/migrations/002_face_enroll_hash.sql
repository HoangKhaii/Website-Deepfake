-- Hash khuôn mặt lúc đăng ký (cùng thuật toán avg-hash 16x16 với frontend), dùng khi không có API so sánh
ALTER TABLE users ADD COLUMN IF NOT EXISTS face_enroll_hash TEXT;

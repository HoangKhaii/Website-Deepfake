/** Chuẩn hóa email làm khóa map/tra cứu (Open/Closed: một nơi định nghĩa quy tắc) */
function normalizeEmailKey(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

module.exports = { normalizeEmailKey };

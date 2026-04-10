const path = require('path');

/** Meta file chung cho các handler upload Multer (DRY + Open/Closed). */
function buildUploadedFileMeta(reqFile, body = {}, options = {}) {
  const { coerceUserIdString = false } = options;
  let raw = body.user_id ?? body.userId ?? body.userID ?? null;
  if (coerceUserIdString && raw != null) raw = String(raw);
  return {
    originalName: reqFile.originalname,
    storedName: reqFile.filename,
    mimeType: reqFile.mimetype,
    size: reqFile.size,
    relativePath: path.relative(process.cwd(), reqFile.path),
    absolutePath: reqFile.path,
    userId: raw,
  };
}

module.exports = { buildUploadedFileMeta };

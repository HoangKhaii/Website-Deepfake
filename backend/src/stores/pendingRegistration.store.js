const { normalizeEmailKey } = require('../utils/normalizeEmailKey');

const pendingRegisterStore = new Map();

function getPendingRegistration(email) {
  return pendingRegisterStore.get(normalizeEmailKey(email)) || null;
}

function setPendingRegistration(email, payload) {
  pendingRegisterStore.set(normalizeEmailKey(email), payload);
}

function clearPendingRegistration(email) {
  pendingRegisterStore.delete(normalizeEmailKey(email));
}

module.exports = {
  getPendingRegistration,
  setPendingRegistration,
  clearPendingRegistration,
};

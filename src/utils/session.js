const crypto = require('crypto');
const { sessionDays } = require('../config/env');

function generateSessionToken() {
  return crypto.randomBytes(48).toString('hex');
}

function expiresAtISOString() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + sessionDays);
  return expiresAt.toISOString();
}

module.exports = {
  generateSessionToken,
  expiresAtISOString,
};

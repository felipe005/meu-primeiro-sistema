function trialExpirationDate(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isExpired(dateISO) {
  if (!dateISO) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateISO);
  due.setHours(0, 0, 0, 0);
  return today > due;
}

module.exports = {
  trialExpirationDate,
  isExpired,
};

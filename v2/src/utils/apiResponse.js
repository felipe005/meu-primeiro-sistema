function ok(res, data = {}, status = 200) {
  res.status(status).json(data);
}

function fail(res, message, status = 400) {
  res.status(status).json({ message });
}

module.exports = {
  ok,
  fail,
};

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, cookie) => {
      const [name, ...rest] = cookie.split('=');
      acc[name] = decodeURIComponent(rest.join('='));
      return acc;
    }, {});
}

module.exports = {
  parseCookies,
};

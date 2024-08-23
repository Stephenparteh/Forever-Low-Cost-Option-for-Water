const ensureAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    return next();
  }
  res.redirect("/auth/login");
};

const ensureAdmin = (req, res, next) => {
  if (req.session.userId && req.session.role === "admin") {
    return next();
  }
  res.redirect("/auth/login");
};

module.exports = { ensureAuthenticated, ensureAdmin };

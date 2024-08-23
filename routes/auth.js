const express = require("express");
const router = express.Router();
const {
  createUser,
  findUserByUsername,
  findUserByUniqueId,
  verifyPassword,
} = require("../models/user");
const { ensureAdmin, ensureAuthenticated } = require("../middleware/auth");

router.get("/signup", ensureAdmin, (req, res) => {
  res.render("signup", { title: "Admin - Sign Up", user: req.session.user });
});

router.post("/signup", ensureAdmin, (req, res) => {
  const { username, password, unique_id } = req.body;
  createUser(username, password, "user", unique_id, (err) => {
    if (err) {
      res.render("signup", {
        title: "Admin - Sign Up",
        error: "Error creating user.",
        user: req.session.user,
      });
    } else {
      res.redirect("/auth/signup");
    }
  });
});

router.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  findUserByUsername(username, (err, user) => {
    if (err || !user) {
      res.render("login", {
        title: "Login",
        error: "Invalid username or password.",
      });
    } else {
      verifyPassword(user, password, (err, result) => {
        if (result) {
          req.session.userId = user.id;
          req.session.role = user.role;
          req.session.user = user;
          res.redirect(user.role === "admin" ? "/admin-dashboard" : "/profile");
        } else {
          res.render("login", {
            title: "Login",
            error: "Invalid username or password.",
          });
        }
      });
    }
  });
});

router.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { title: "Profile", user: req.session.user });
});

router.get("/admin-dashboard", ensureAdmin, (req, res) => {
  res.render("admin-dashboard", {
    title: "Admin Dashboard",
    user: req.session.user,
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;

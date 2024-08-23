const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

// Initialize SQLite database
const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT, unique_id TEXT)"
  );
});

const createUser = (username, password, role, unique_id, callback) => {
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return callback(err);
    db.run(
      "INSERT INTO users (username, password, role, unique_id) VALUES (?, ?, ?, ?)",
      [username, hash, role, unique_id],
      callback
    );
  });
};

const findUserByUsername = (username, callback) => {
  db.get("SELECT * FROM users WHERE username = ?", [username], callback);
};

const findUserByUniqueId = (unique_id, callback) => {
  db.get("SELECT * FROM users WHERE unique_id = ?", [unique_id], callback);
};

const verifyPassword = (user, password, callback) => {
  bcrypt.compare(password, user.password, callback);
};

module.exports = {
  createUser,
  findUserByUsername,
  findUserByUniqueId,
  verifyPassword,
};

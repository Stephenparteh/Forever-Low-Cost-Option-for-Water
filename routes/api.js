const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(":memory:");

router.get("/water-levels", (req, res) => {
  db.all(
    "SELECT * FROM water_levels ORDER BY timestamp DESC",
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: "success",
        data: rows,
      });
    }
  );
});

router.post("/water-levels", (req, res) => {
  const { level } = req.body;
  db.run(
    "INSERT INTO water_levels (level) VALUES (?)",
    [level],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        message: "success",
        data: { id: this.lastID },
      });
    }
  );
});

module.exports = router;

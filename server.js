const { count } = require("console");
const express = require("express"); //A web framework for Node.js
const app = express();
const multer = require("multer"); //A middleware for handling multipart/form-data, primarily used for uploading files
// const sqlite3 = require("sqlite3").verbose; //A SQLite client for Node.js
// const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");

app.use(
  session({
    secret: "flow-secret-key", // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

const path = require("path");

// Set EJS as the templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const port = 2000;

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(express.static(path.join(__dirname, "public")));

// Middleware for parsing form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./flow.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the flow database.");
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS user(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(100),
    email VARCHAR(100),
    phone_number VARCHAR(100),
    dob DATE,
    role_id VARCHAR(100) DEFAULT "client",
    photo BLOB,
    password VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS admin(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(100),
    email VARCHAR(100),
    phone_number VARCHAR(100),
    dob DATE,
    role_id VARCHAR(100),
    photo BLOB,
    password VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS roles(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role VARCHAR(100)
    )`
  );
  // add a foriegn key relationship between user and household in a column "owner_id"
  db.run(
    `CREATE TABLE IF NOT EXISTS household(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100),
    address VARCHAR(100),
    owner_id INTEGER,
    connection_status VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at VARCHAR(100),
    FOREIGN KEY (owner_id) REFERENCES user(id)
    )`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS water_usage(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER,
    water_used REAL,
    usaged_date DATETIME,
    cost REAL,
    meter_reading REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES household(id)
    )`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS water_source(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100),
    location VARCHAR(100),
    capacity REAL,
    current_level REAL,
    status VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS sensor(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(100),
    location VARCHAR(100),
    water_source_id INTEGER,
    status VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (water_source_id) REFERENCES water_source(id)
    )`
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS payment(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER,
    amount REAL,
    payment_date DATETIME,
    payment_method VARCHAR(100),
    transaction_id VARCHAR(100),
    status VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES household(id)
    )`
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS alert(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    household_id INTEGER,
    message VARCHAR(200),
    type VARCHAR(100),
    status VARCHAR(100),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (household_id) REFERENCES household(id)
    )`
  );
  db.run(`
    CREATE TABLE IF NOT EXISTS maintenance_logs(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    water_source_id INTEGER,
    sensor_id INTEGER,
    activity VARCHAR(100),
    performed_by VARCHAR(100),
    date DATE,
    status VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (water_source_id) REFERENCES water_source(id),
    FOREIGN KEY (sensor_id) REFERENCES sensor(id)
    )
    `);
  db.run(
    `
    CREATE TABLE IF NOT EXISTS language_setting(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    language_code VARCHAR(100),
    language_name VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    `
  );
  db.run(
    `
    CREATE TABLE IF NOT EXISTS system_transaction(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description VARCHAR(100),
    amount REAL,
    transaction_type VARCHAR(100), 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )    
    `
  );
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const loginData = {
    email: req.body.email,
    password: req.body.password,
  };

  console.log("Login data from form", loginData);
  db.get(
    `SELECT * FROM admin WHERE email = ? AND password = ?`,
    [loginData.email, loginData.password],
    (err, row) => {
      if (err) {
        console.log(err.message);
        return res.redirect("/login");
      }
      if (row) {
        console.log("User Info Login Route:", row);
        console.log("Login Successful!!");
        // current_user = row;
        res.redirect("/admin-dashboard");
        // res.render("dashboard.ejs", { user: user });
      } else {
        console.log("Wrong credential");
        res.redirect("/login");
      }
    }
  );
});

app.get("/admin-dashboard", (req, res) => {
  db.all(`SELECT * FROM user`, (err, users) => {
    if (err) {
      console.log(err.message);
    }
    db.all(`SELECT * FROM household`, (err, households) => {
      if (err) {
        console.log(err.message);
      }
      totalUsers = users.length;
      totalHousehold = households.length;
      console.log(totalUsers);
      console.log(totalHousehold);
      res.render("admin-dashboard", {
        totalUsers: totalUsers,
        totalHousehold: totalHousehold,
      });
    });
  });
});

app.get("/manage-user", (req, res) => {
  db.all(`SELECT * FROM user`, (err, users) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Error fetching users");
    }

    const totalUsers = users;
    const count = 1;
    console.log(totalUsers);
    res.render("manage-user", { totalUsers: totalUsers, count: count });
  });

  // res.render("manage-user");
});

app.get("/add-user", (req, res) => {
  res.render("add-user");
});

app.post("/add-user", upload.single("photo"), (req, res) => {
  const clientInfo = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    // userName: req.body.userName,
    email: req.body.email,
    phoneNumber: req.body.phoneNumber,
    address: req.body.address,
    dateOfBirth: req.body.dob,
    photo: req.file ? req.file.path : null,
    password: req.body.password,
  };
  const houseName = `${clientInfo.lastName}'s Residence`;

  db.run(
    `INSERT INTO user (first_name, last_name, email, phone_number, dob, photo, password) VALUES ( ?, ?, ?, ?, ?, ?, ?)`,
    [
      clientInfo.firstName,
      clientInfo.lastName,
      clientInfo.email,
      clientInfo.phoneNumber,
      clientInfo.dateOfBirth,
      clientInfo.photo,
      clientInfo.password,
    ],
    function (err) {
      if (err) {
        return console.log("Error inserting into user table", err.message);
      }
      const ownerId = this.lastID;
      console.log(`Owner ID: ${ownerId}`);
      db.run(
        `INSERT INTO household(name, address, owner_id, connection_status) VALUES (?, ?, ?, ?)`,
        [houseName, clientInfo.address, ownerId, "Connected"],
        function (err) {
          if (err) {
            console.log("Error inserting into household table", err.message);
          }
          console.log("User Created Successfully");
          console.log("Household created successfully");
          res.redirect("/manage-user");
        }
      );
    }
  );
  console.log("Client Info", clientInfo);
});

app.get("/manage-household", (req, res) => {
  db.all(`SELECT * FROM household`, (err, households) => {
    if (err) {
      console.log(err.message);
      return res.status(500).send("Error fetching hou 34seholds");
    }
    db.run(`SELECT * FROM user WHERE ${}`)
    const totalHouseholds = households;
    const count = 1;
    console.log(totalHouseholds);
    res.render("manage-household", {
      totalHouseholds: totalHouseholds,
      count: count,
    });
  });
});

app.get("/add-household", (req, res) => {
  res.render("add-household");
});

app.post("/add-household", (req, res) => {
  const householdInfo = {
    name: req.body.houseName,
    address: req.body.address,
    status: req.body.status,
  };

  console.log(householdInfo);
  db.run(
    `INSERT INTO household(name, address, connection_status) VALUES (?, ?, ?)`,
    [householdInfo.name, householdInfo.address, householdInfo.status],
    function (err) {
      if (err) {
        console.log("Error inserting into household table", err.message);
      }
      console.log("Household created successfully");
      res.redirect("/manage-household");
    }
  );
});

app.get("/manage-water-source", (req, res) => {
  res.render("manage-water-source");
});

app.get("/manage-payment", (req, res) => {
  res.render("manage-payment");
});

app.get("/view-log", (req, res) => {
  res.render("view-log");
});

app.get("/setting", (req, res) => {
  res.render("setting");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// const express = require("express");
// const session = require("express-session");
// const path = require("path");
// const indexRouter = require("./routes/index");
// const apiRouter = require("./routes/api");
// const authRouter = require("./routes/auth");

// const app = express();

// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "views"));

// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// app.use(
//   session({
//     secret: "your_secret_key",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// app.use("/", indexRouter);
// app.use("/api", apiRouter);
// app.use("/auth", authRouter);

// app.listen(3000, () => {
//   console.log("Server is running on http://localhost:3000");
// });

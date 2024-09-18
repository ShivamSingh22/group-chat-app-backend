const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

const userRoutes = require("./routes/userRoute");

const sequelize = require("./util/database");

const User = require("./models/userModel");

const app = express();
app.use(
  cors({
    origin: "http://127.0.0.1:3000",
  })
);
app.use(bodyParser.json({ extended: false }));

app.use("/user", userRoutes);

sequelize
  .sync()
  .then((result) => {
    app.listen(process.env.PORT || 3000);
    console.log(`Listening on ${process.env.PORT}`);
  })
  .catch((err) => {
    console.log(err);
  });

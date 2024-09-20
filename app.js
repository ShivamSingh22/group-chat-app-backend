const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

const userRoutes = require("./routes/userRoute");
const chatRoutes = require("./routes/chatRoute");
const sequelize = require("./util/database");

const User = require("./models/userModel");
const Chats = require("./models/chatModel")

const app = express();
app.use(
  cors({
    origin: "http://127.0.0.1:3000",
  })
);
app.use(bodyParser.json({ extended: false }));

app.use("/user", userRoutes);
app.use("/chat", chatRoutes);

User.hasMany(Chats);
Chats.belongsTo(User);

sequelize
  .sync()
  .then((result) => {
    app.listen(process.env.PORT || 3000);
    console.log(`Listening on ${process.env.PORT}`);
  })
  .catch((err) => {
    console.log(err);
  });

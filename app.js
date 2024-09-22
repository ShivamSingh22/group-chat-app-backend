const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");



require("dotenv").config();

const userRoutes = require("./routes/userRoute");
const chatRoutes = require("./routes/chatRoute");
const sequelize = require("./util/database");
const groupRoutes = require('./routes/groupRoute');

const User = require("./models/userModel");
const Chats = require("./models/chatModel");
const Group = require("./models/groupModel");
const GroupMember = require("./models/groupMemberModel");

const app = express();
app.use(
  cors({
    origin: ["http://127.0.0.1:3000", "http://localhost:3000", "null"],
    credentials: true,
  })
);
app.use(bodyParser.json({ extended: false }));

app.use("/user", userRoutes);
app.use("/chat", chatRoutes);
app.use("/group", groupRoutes);

// Associations
User.hasMany(Chats);
Chats.belongsTo(User);

User.hasMany(GroupMember);
GroupMember.belongsTo(User);

Group.hasMany(GroupMember);
GroupMember.belongsTo(Group);

Group.hasMany(Chats);
Chats.belongsTo(Group);

User.belongsToMany(Group, { through: GroupMember });
Group.belongsToMany(User, { through: GroupMember });

sequelize
  .sync()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

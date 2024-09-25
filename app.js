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
const GroupAdmin = require("./models/groupAdminModel");

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

app.use((req,res)=> {
  console.log(req.url);
  res.sendFile(path.join(__dirname, `public/${req.url}`));
})

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

Group.belongsToMany(User, { through: GroupAdmin, as: 'Admins' });
User.belongsToMany(Group, { through: GroupAdmin, as: 'AdminOf' });

sequelize
  .sync() 
  .then(result => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });

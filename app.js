const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require('http');
const socketIo = require('socket.io');

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
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://127.0.0.1:5500", "http://localhost:5500", "null"],
    methods: ["GET", "POST"]
  }
});

// Set io instance on app
app.set('io', io);

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

Group.belongsToMany(User, { through: GroupAdmin, as: 'Admins' });
User.belongsToMany(Group, { through: GroupAdmin, as: 'AdminOf' });

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join group', (groupId) => {
    socket.join(groupId);
    console.log(`User joined group ${groupId}`);
  });

  socket.on('leave group', (groupId) => {
    socket.leave(groupId);
    console.log(`User left group ${groupId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

sequelize
  .sync() 
  .then(result => {
    server.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch(err => {
    console.log(err);
  });

// After creating a new chat message
// io.to(groupId).emit('new message', {
//     id: chat.id,
//     message: chat.message,
//     userId: chat.userId,
//     username: req.user.username,
//     createdAt: chat.createdAt,
//     fileUrl: chat.fileUrl
// });

// Export both app and io
module.exports = { app, io };

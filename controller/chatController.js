const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const GroupMember = require('../models/groupMemberModel');
const {Op} = require('sequelize');
const { uploadToS3 } = require('../util/s3services');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const ArchivedChat = require('../models/ArchivedChat');

exports.postChat = async (req, res) => {
    try {
        const { message, groupId } = req.body;
        const isMember = await GroupMember.findOne({
            where: { groupId, userId: req.user.id }
        });
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        let fileUrl = null;
        if (req.file) {
            const fileName = `group-${groupId}/user-${req.user.id}/${Date.now()}-${req.file.originalname}`;
            fileUrl = await uploadToS3(req.file.buffer, fileName);
        }

        const chat = await Chat.create({
            message,
            userId: req.user.id,
            groupId,
            fileUrl
        });

        const newMessage = {
            id: chat.id,
            message: chat.message,
            userId: chat.userId,
            username: req.user.username,
            createdAt: chat.createdAt,
            fileUrl: chat.fileUrl,
            groupId: chat.groupId
        };

        const io = req.app.get('io');
        if (io) {
            io.to(groupId).emit('new message', newMessage);
        }

        res.status(200).json({ 
            message: "Message sent successfully",
            chatId: chat.id,
            username: req.user.username,
            createdAt: chat.createdAt,
            fileUrl: chat.fileUrl
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.getChat = async (req, res) => {
    try {
        const { groupId, lastId } = req.query;
        const isMember = await GroupMember.findOne({
            where: { groupId, userId: req.user.id }
        });
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        // Fetch recent chats from Chat table
        const recentChats = await Chat.findAll({
            where: {
                groupId,
                id: { [Op.gt]: lastId || 0 }
            },
            include: [{
                model: User,
                attributes: ['username']
            }],
            order: [['id', 'ASC']],
            limit: 100
        });

        // Fetch archived chats if needed
        let archivedChats = [];
        if (recentChats.length < 100) {
            const remainingLimit = 100 - recentChats.length;
            archivedChats = await ArchivedChat.findAll({
                where: {
                    groupId,
                    id: { [Op.gt]: lastId || 0 }
                },
                include: [{
                    model: User,
                    attributes: ['username']
                }],
                order: [['id', 'ASC']],
                limit: remainingLimit
            });
        }

        // Combine and format chats
        const allChats = [...recentChats, ...archivedChats];
        const formattedChats = allChats.map(chat => ({
            id: chat.id,
            message: chat.message,
            userId: chat.userId,
            username: chat.user ? chat.user.username : 'Unknown User',
            createdAt: chat.createdAt,
            fileUrl: chat.fileUrl
        }));
        
        res.status(200).json({ chats: formattedChats });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const GroupMember = require('../models/groupMemberModel');
const Op = require('sequelize').Op;

exports.postChat = async (req, res) => {
    try {
        const { message, groupId } = req.body;
        const isMember = await GroupMember.findOne({
            where: { groupId, userId: req.user.id }
        });
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }
        const chat = await Chat.create({
            message,
            userId: req.user.id,
            groupId
        });

        const newMessage = {
            id: chat.id,
            message: chat.message,
            userId: chat.userId,
            username: req.user.username,
            createdAt: chat.createdAt
        };
        const io = req.app.get('io');
        if (io) {
            // Emit the new message to all members of the group
            io.to(groupId).emit('new message', newMessage);
        } else {
            console.warn('Socket.IO instance not available');
        }

        res.status(200).json({ 
            message: "Message sent", 
            chatId: chat.id,
            username: req.user.username,
            createdAt: chat.createdAt
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
        const chats = await Chat.findAll({
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

        const formattedChats = chats.map(chat => ({
            id: chat.id,
            message: chat.message,
            userId: chat.userId,
            username: chat.user ? chat.user.username : 'Unknown User',
            createdAt: chat.createdAt
        }));
        
        res.status(200).json({ chats: formattedChats });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

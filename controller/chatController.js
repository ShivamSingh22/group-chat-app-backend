const Chats = require('../models/chatModel');
const User = require('../models/userModel');
const Op = require('sequelize').Op;

exports.postChat = async (req, res) => {
    try {
        const { message } = req.body;
        console.log(message);
        const chat = await req.user.createChat({
            message: message
        })
        res.status(200).json({ message: "Message received" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.getChat = async (req, res) => {
    try {
        const lastId = parseInt(req.query.lastId) || 0;
        
        const chats = await Chats.findAll({
            where: {
                id: { [Op.gt]: lastId }
            },
            include: [{
                model: User,
                attributes: ['username']
            }],
            order: [['id', 'ASC']]
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

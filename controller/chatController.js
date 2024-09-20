const Chats = require('../models/chatModel');
const User = require('../models/userModel');

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
        const chats = await Chats.findAll({
            include: [{
                model: User,
                attributes: ['username']
            }],
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

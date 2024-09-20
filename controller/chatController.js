const Chats = require('../models/chatModel');

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
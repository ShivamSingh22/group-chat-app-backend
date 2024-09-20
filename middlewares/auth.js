const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization');
        console.log(token);
        
        if(!token){
            return res.status(401).json({ success: false, message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: "Unauthorized" });
    }
}

module.exports = authenticate;
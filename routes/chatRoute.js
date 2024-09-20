const express=require('express');
const router = express.Router();
const userController = require('../controller/chatController');
const authenticate = require('../middlewares/auth');

router.post('/msg',authenticate,userController.postChat);

module.exports=router;
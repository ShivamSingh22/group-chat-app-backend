const express=require('express');
const router = express.Router();
const chatController = require('../controller/chatController');
const authenticate = require('../middlewares/auth');

router.post('/msg',authenticate,chatController.postChat);
router.get('/msg',authenticate,chatController.getChat);

module.exports=router;
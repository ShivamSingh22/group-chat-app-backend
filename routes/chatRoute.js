const express=require('express');
const router = express.Router();
const userController = require('../controller/chatController');
const authenticate = require('../middlewares/auth');

router.post('/msg',authenticate,userController.postChat);
router.get('/msg',authenticate,userController.getChat);

module.exports=router;
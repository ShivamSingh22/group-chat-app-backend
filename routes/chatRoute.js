const express = require('express');
const router = express.Router();
const userController = require('../controller/chatController');
const authenticate = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/msg', authenticate, upload.single('file'), userController.postChat);
router.get('/msg', authenticate, userController.getChat);

module.exports = router;
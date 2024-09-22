const express = require('express');
const router = express.Router();
const groupController = require('../controller/groupController');
const authenticate = require('../middlewares/auth');

router.post('/create', authenticate, groupController.createGroup);
router.post('/invite', authenticate, groupController.inviteToGroup);
router.get('/user-groups', authenticate, groupController.getUserGroups);

module.exports = router;
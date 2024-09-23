const express = require('express');
const router = express.Router();
const groupController = require('../controller/groupController');
const authenticate = require('../middlewares/auth');

router.post('/create', authenticate, groupController.createGroup);
router.get('/user-groups', authenticate, groupController.getUserGroups);
router.get('/:groupId/members', authenticate, groupController.getGroupMembers);
router.get('/search-users', authenticate, groupController.searchUsers);
router.post('/add-member', authenticate, groupController.addUserToGroup);
router.post('/make-admin', authenticate, groupController.makeAdmin);
router.post('/remove-user', authenticate, groupController.removeUser);

module.exports = router;
const Group = require('../models/groupModel');
const GroupMember = require('../models/groupMemberModel');
const User = require('../models/userModel');

exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const group = await Group.create({
            name,
            createdBy: req.user.id
        });
        await GroupMember.create({
            groupId: group.id,
            userId: req.user.id
        });
        res.status(201).json({ message: "Group created successfully", groupId: group.id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.inviteToGroup = async (req, res) => {
    try {
        const { groupId, userEmail } = req.body;
        const user = await User.findOne({ where: { email: userEmail } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await GroupMember.create({
            groupId,
            userId: user.id
        });
        res.status(200).json({ message: "User invited successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getUserGroups = async (req, res) => {
    try {
        const groupMembers = await GroupMember.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Group,
                attributes: ['id', 'name']
            }]
        });
        const groups = groupMembers.map(gm => gm.group);
        res.status(200).json({ groups });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
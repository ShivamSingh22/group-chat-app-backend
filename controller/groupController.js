const Group = require('../models/groupModel');
const GroupMember = require('../models/groupMemberModel');
const User = require('../models/userModel');
const { Op } = require('sequelize');
const sequelize = require('../util/database');

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
        console.log('Sending groups:', groups); // Add this line for debugging
        res.status(200).json({ groups });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        // Check if the user is a member of the group
        const isMember = await GroupMember.findOne({
            where: { groupId, userId: req.user.id }
        });
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }
        const members = await GroupMember.findAll({
            where: { groupId },
            include: [{
                model: User,
                attributes: ['id', 'username', 'email']
            }]
        });
        res.status(200).json({ members: members.map(m => m.user) });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getNonGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        // Check if the user is a member of the group
        const isMember = await GroupMember.findOne({
            where: { groupId, userId: req.user.id }
        });
        if (!isMember) {
            return res.status(403).json({ message: "You are not a member of this group" });
        }

        // Get all users who are not members of this group
        const nonMembers = await User.findAll({
            where: {
                id: {
                    [Op.notIn]: sequelize.literal(`(SELECT userId FROM groupMembers WHERE groupId = ${groupId})`)
                }
            },
            attributes: ['id', 'username', 'email']
        });

        res.status(200).json({ nonMembers });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.addUserToGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        // Check if the user making the request is a member of the group
        const isMember = await GroupMember.findOne({
            where: { groupId, userId: req.user.id }
        });
        if (!isMember) {
            return res.status(403).json({ message: "You are not authorized to add members to this group" });
        }

        // Check if the user to be added is already a member
        const existingMember = await GroupMember.findOne({
            where: { groupId, userId }
        });
        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this group" });
        }

        // Add the user to the group
        await GroupMember.create({ groupId, userId });

        res.status(200).json({ message: "User added to group successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
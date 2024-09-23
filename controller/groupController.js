const Group = require('../models/groupModel');
const GroupMember = require('../models/groupMemberModel');
const User = require('../models/userModel');
const GroupAdmin = require('../models/groupAdminModel');
const { Op } = require('sequelize');
const sequelize = require('../util/database');

exports.createGroup = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { name } = req.body;
        const group = await Group.create({
            name,
            createdBy: req.user.id
        }, { transaction: t });
        
        await GroupMember.create({
            groupId: group.id,
            userId: req.user.id
        }, { transaction: t });
        
        // Make the creator an admin
        await GroupAdmin.create({
            groupId: group.id,
            userId: req.user.id
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: "Group created successfully", groupId: group.id });
    } catch (error) {
        await t.rollback();
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.inviteToGroup = async (req, res) => {
    try {
        const { groupId, userIdentifier } = req.body;
        
        // Check if the inviting user is an admin
        const isAdmin = await GroupAdmin.findOne({
            where: { groupId, userId: req.user.id }
        });
        
        if (!isAdmin) {
            return res.status(403).json({ message: "Only admins can invite users to the group" });
        }

        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: userIdentifier },
                    { username: userIdentifier },
                    { contact: userIdentifier }
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const existingMember = await GroupMember.findOne({
            where: { groupId, userId: user.id }
        });

        if (existingMember) {
            return res.status(400).json({ message: "User is already a member of this group" });
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

exports.makeAdmin = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        
        // Check if the requesting user is an admin
        const isAdmin = await GroupAdmin.findOne({
            where: { groupId, userId: req.user.id }
        });
        
        if (!isAdmin) {
            return res.status(403).json({ message: "Only admins can make other users admin" });
        }

        // Check if the user is already an admin
        const alreadyAdmin = await GroupAdmin.findOne({
            where: { groupId, userId }
        });

        if (alreadyAdmin) {
            return res.status(400).json({ message: "User is already an admin" });
        }

        // Make the user an admin
        await GroupAdmin.create({ groupId, userId });

        res.status(200).json({ message: "User is now an admin of the group" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.removeUser = async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        
        // Check if the requesting user is an admin
        const isAdmin = await GroupAdmin.findOne({
            where: { groupId, userId: req.user.id }
        });
        
        if (!isAdmin) {
            return res.status(403).json({ message: "Only admins can remove users from the group" });
        }

        // Remove the user from the group
        await GroupMember.destroy({
            where: { groupId, userId }
        });

        // If the user was an admin, remove them from admin as well
        await GroupAdmin.destroy({
            where: { groupId, userId }
        });

        res.status(200).json({ message: "User removed from the group" });
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

        // Get the list of admins
        const admins = await GroupAdmin.findAll({
            where: { groupId },
            attributes: ['userId']
        });

        const adminIds = admins.map(admin => admin.userId);

        // Check if the requesting user is an admin
        const isAdmin = adminIds.includes(req.user.id);

        const membersWithAdminStatus = members.map(m => ({
            ...m.user.toJSON(),
            isAdmin: adminIds.includes(m.user.id)
        }));

        res.status(200).json({ members: membersWithAdminStatus, isUserAdmin: isAdmin });
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

exports.searchUsers = async (req, res) => {
    try {
        const { query, groupId } = req.query;
        
        // Check if the requesting user is an admin of the group
        const isAdmin = await GroupAdmin.findOne({
            where: { groupId, userId: req.user.id }
        });
        
        if (!isAdmin) {
            return res.status(403).json({ message: "Only admins can search and add users to the group" });
        }

        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { username: { [Op.like]: `%${query}%` } },
                    { email: { [Op.like]: `%${query}%` } },
                    { contact: { [Op.like]: `%${query}%` } }
                ],
                id: {
                    [Op.notIn]: sequelize.literal(`(SELECT userId FROM groupMembers WHERE groupId = ${groupId})`)
                }
            },
            attributes: ['id', 'username', 'email']
        });

        res.status(200).json({ users });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
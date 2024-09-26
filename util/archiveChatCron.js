const cron = require('node-cron');
const { Op } = require('sequelize');
const Chat = require('../models/chatModel');
const ArchivedChat = require('../models/ArchivedChat');
const sequelize = require('./database');

const archiveChats = async () => {
  const transaction = await sequelize.transaction();

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find chats older than 1 day
    const oldChats = await Chat.findAll({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo
        }
      },
      transaction
    });

    // Insert old chats into ArchivedChat
    await ArchivedChat.bulkCreate(
      oldChats.map(chat => ({
        message: chat.message,
        fileUrl: chat.fileUrl,
        userId: chat.userId,
        groupId: chat.groupId,
        createdAt: chat.createdAt
      })),
      { transaction }
    );

    // Delete old chats from Chat table
    await Chat.destroy({
      where: {
        createdAt: {
          [Op.lt]: oneDayAgo
        }
      },
      transaction
    });

    await transaction.commit();
    console.log('Chat archiving completed successfully');
  } catch (error) {
    await transaction.rollback();
    console.error('Error archiving chats:', error);
  }
};

// Schedule the cron job to run every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  console.log('Running chat archiving cron job');
  archiveChats();
});

module.exports = { archiveChats };
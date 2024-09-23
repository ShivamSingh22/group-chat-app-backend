const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const GroupAdmin = sequelize.define('groupAdmin', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
});

module.exports = GroupAdmin;
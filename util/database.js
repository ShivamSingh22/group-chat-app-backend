const Sequelize = require('sequelize');

const SQL_DB_NAME = process.env.SQL_DB_NAME;
const SQL_USER_NAME = process.env.SQL_USER_NAME;
const SQL_USER_PASS = process.env.SQL_USER_PASS;
const DB_HOST = process.env.DB_HOST;

const sequelize = new Sequelize(SQL_DB_NAME,SQL_USER_NAME,SQL_USER_PASS, {
    dialect: 'mysql',
    host: DB_HOST,
});

module.exports = sequelize;
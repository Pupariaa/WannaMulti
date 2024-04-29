const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const envFile = './config.env';

dotenv.config({path: envFile});

const db_wannamulti = new Sequelize({
    host: process.env.db_host,
    port: process.env.db_port,
    username: process.env.db_username,
    password: process.env.db_password,
    database: process.env.db_database,
    dialect: 'mysql',
    logging: false
  });

  const db_bellafiora = new Sequelize({
    host: process.env.db_bf_host,
    port: process.env.db_bf_port,
    username: process.env.db_bf_username,
    password: process.env.db_bf_password,
    database: process.env.db_bf_database,
    dialect: 'mysql',
    logging: false
  });

  module.exports = {db_wannamulti, db_bellafiora}
 


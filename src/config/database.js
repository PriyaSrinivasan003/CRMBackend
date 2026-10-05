const { Sequelize } = require('sequelize');
const env = require('./env');
const dbConfigs = require('./config');

const environment = env.NODE_ENV || 'development';
const config = dbConfigs[environment];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: config.logging,
    define: config.define,
    pool: config.pool
  }
);

const checkDatabaseConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`[Database] MySQL connection established successfully to '${config.database}' on ${config.host}:${config.port}`);
    return true;
  } catch (error) {
    console.error('[Database] Unable to connect to MySQL database:', error.message);
    throw error;
  }
};

module.exports = {
  sequelize,
  checkDatabaseConnection
};

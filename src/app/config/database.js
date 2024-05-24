const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_NAME, 
  process.env.DATABASE_USERNAME, 
  process.env.DATABASE_PASSWORD, 
  {
    host: process.env.DATABASE_HOSTNAME,
    dialect: 'mysql'
  }
);

async function connect() {
    try {
        await sequelize.sync()
        .then(() => {
          Object.values(sequelize.models)
            .filter(model => typeof model.associate === "function")
            .forEach(model => model.associate(sequelize.models));
          console.log('Database synchronization successful');
        })
        .catch((err) => {
          console.error('Database synchronization failed:', err);
        });
        console.log('Connect successfully!!!');
    } catch (error) {
        console.log('Connect failure!!!');
    }
}

module.exports = { sequelize, connect };

/*
 * /=======================================================\
 * | Copyright (c) P7COMunications LLC                     |
 * | Author: Francisco Medina [pancho7532@p7com.net]       |
 * | Date: 30/Jan/2023                                     |
 * |=======================================================|
 * |-> Purpose: Database connector/manager                 |
 * \=======================================================/
 */
const Sequelize = require("sequelize");
const configurationFile = require("../config/config.inc.json");
if(!configurationFile.databaseInfo.mysqlHost) { console.log("[ERROR] No database hostname specified at ./config/config.inc.json"); process.exit(1);}
if(!configurationFile.databaseInfo.mysqlUsername) { console.log("[ERROR] No database username specified at ./config/config.inc.json"); process.exit(1);}
if(!configurationFile.databaseInfo.mysqlPassword) { console.log("[ERROR] No database password specified at ./config/config.inc.json"); process.exit(1);}
if(!configurationFile.databaseInfo.mysqlDatabase) { console.log("[ERROR] No database name specified at ./config/config.inc.json"); process.exit(1);}
const sequelizeInstance = new Sequelize(configurationFile.databaseInfo.mysqlDatabase, configurationFile.databaseInfo.mysqlUsername, configurationFile.databaseInfo.mysqlPassword, {
    host: configurationFile.databaseInfo.mysqlHost,
    port: configurationFile.databaseInfo.mysqlPort || 3306,
    dialect: "mysql",
    define: {
        timestamps: false
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});
module.exports = sequelizeInstance;
/****************** ADD YOUR MODELS AND RELATIONSHIPS HERE ******************/
const user = require("./models/user.db");
/****************************************************************************/
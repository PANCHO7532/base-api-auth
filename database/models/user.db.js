/*
 * /=======================================================\
 * | Copyright (c) P7COMunications LLC                     |
 * | Author: Francisco Medina [pancho7532@p7com.net]       |
 * | Date: 30/Jan/2023                                     |
 * |=======================================================|
 * |-> Purpose: User database schema                       |
 * \=======================================================/
 */
const Sequelize = require("sequelize");
const sequelizeInstance = require("../index.js");
const user = sequelizeInstance.define("users", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userName: Sequelize.STRING,
    password: Sequelize.STRING,
    isAdmin: Sequelize.BOOLEAN,
    disabled: Sequelize.BOOLEAN
});
module.exports = user;
/*
 * /=======================================================\
 * | Copyright (c) P7COMunications LLC                     |
 * | Author: Francisco Medina [pancho7532@p7com.net]       |
 * | Date: 15/May/2023                                     |
 * |=======================================================|
 * |-> Purpose: Account database schema                    |
 * \=======================================================/
 */
const Sequelize = require("sequelize");
const sequelizeInstance = require("../index.js");
const account = sequelizeInstance.define("accounts", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userName: Sequelize.STRING,
    password: Sequelize.STRING,
    isAdmin: Sequelize.BOOLEAN,
    disabled: Sequelize.BOOLEAN,
    sessionIAT: Sequelize.DATE
});
module.exports = account;
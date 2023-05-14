/*
 * /=======================================================\
 * | Copyright (c) P7COMunications LLC                     |
 * | Author: Francisco Medina [pancho7532@p7com.net]       |
 * | Date: 14/May/2023                                     |
 * |=======================================================|
 * |-> Purpose: Contains all authentication-related logic  |
 * \=======================================================/
 */
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authConfiguration = require("../config/auth.config.json");
const userDatabase = require("../database/models/user.db");
exports.login = async(req, res, next) => {
    let userRegex = /^[a-zA-Z0-9]+$/;
    if(!req.body || !req.body.userName || !req.body.password) {
        await res.code(400).send({});
        return;
    }
    if(!userRegex.test(req.body.userName)) {
        await res.code(400).send({});
        return;
    }
    let userQuery = await userDatabase.findOne({ where: { userName: req.body.userName }});
    if(!userQuery) {
        await res.code(401).send({});
        return;
    }
    if(!bcrypt.compareSync(req.body.password, userQuery.password)) {
        await res.code(401).send({});
        return;
    }
    let tokenContent = authConfiguration.jwtDetails.jwtObject;
    tokenContent.userName = userQuery.userName;
    tokenContent = jwt.sign(tokenContent, authConfiguration.jwtDetails.jwtSecretKey, { expiresIn: authConfiguration.jwtDetails.jwtExpiration });
    await res.code(200).send({accessToken: tokenContent});
    return;
}
exports.logout = async(req, res, next) => {}
exports.register = async(req, res, next) => {
    let userRegex = /^[a-zA-Z0-9]+$/;
    let userDatabaseCount = await userDatabase.count();
    if(!req.body || !req.body.userName || !req.body.password) {
        await res.code(400).send({});
        return;
    }
    if(!userRegex.test(req.body.userName)) {
        await res.code(400).send({});
        return;
    }
    let userQuery = await userDatabase.findOne({ where: { userName: req.body.userName }});
    if(userQuery) {
        await res.code(409).send({});
        return;
    }
    let hashedPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    await userDatabase.create({
        userName: req.body.userName,
        password: hashedPassword,
        isAdmin: authConfiguration.firstUserIsAdmin && (userDatabaseCount == 0) ? true : false,
        disabled: false
    });
    await res.code(200).send({});
    return;
}
exports.manage = async(req, res, next) => {}
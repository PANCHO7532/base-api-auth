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
const accountDatabase = require("../database/models/account.db");
exports.login = async(req, res, next) => {
    let userRegex = /^[a-zA-Z0-9]+$/;
    if(!req.body || !req.body.userName || !req.body.password) {
        // do we actually have the user data?
        await res.code(400).send({});
        return;
    }
    if(!userRegex.test(req.body.userName)) {
        // username has weird characters
        await res.code(400).send({});
        return;
    }
    let userQuery = await accountDatabase.findOne({ where: { userName: req.body.userName }});
    if(!userQuery) {
        // user doesn't exists
        await res.code(401).send({});
        return;
    }
    if(!bcrypt.compareSync(req.body.password, userQuery.password)) {
        // password doesn't match
        await res.code(401).send({});
        return;
    }
    // initialize contents of the token payload
    let tokenContent = authConfiguration.jwtDetails.jwtObject;
    // store stuff, like the id and username for now
    tokenContent.accountID = userQuery.id;
    tokenContent.userName = userQuery.userName;
    // we overwrite the same variable with the now signed token
    tokenContent = jwt.sign(tokenContent, authConfiguration.jwtDetails.jwtSecretKey, { expiresIn: authConfiguration.jwtDetails.jwtExpiration });
    // store the last time the token was issued, this is used to track the active one and invalidate on request
    userQuery.sessionIAT = jwt.decode(tokenContent).iat * 1000;
    await userQuery.save();
    await res.code(200).send({accessToken: tokenContent});
    return;
}
exports.logout = async(req, res, next) => {
    // the token can only be in two places, the authorization header or in cookies as "accessToken", grab any of them.
    let userToken = (!!req.headers.authorization ? req.headers.authorization.split(" ")[1] : undefined) || req.cookies.accessToken;
    try {
        jwt.verify(userToken, authConfiguration.jwtDetails.jwtSecretKey);
    } catch(e) {
        // token is not valid, if it's a cookie, we invalidate it
        if(!!req.cookies.accessToken) {
            res.setCookie("accessToken", "{}", { path: "/", expires: 1 });
        }
        await res.code(400).send({});
        return;
    }
    // grab the payload contents
    let jwtObject = jwt.decode(userToken);
    // check to the database if the user exists
    let userQuery = await accountDatabase.findOne({ where: { accountID: jwtObject.accountID, userName: jwtObject.userName } });
    if(!userQuery) {
        // user does not exist, invalidate the cookie (if exists) and throw error
        if(!!req.cookies.accessToken) {
            res.setCookie("accessToken", "{}", { path: "/", expires: 1 });
        }
        await res.code(401).send({});
        return;
    }
    if(Math.floor(userQuery.sessionIAT / 1000) != jwtObject.iat) {
        // not the issued token, invalidate the cookie (if exists) and throw error
        if(!!req.cookies.accessToken) {
            res.setCookie("accessToken", "{}", { path: "/", expires: 1 });
        }
        await res.code(401).send({});
        return;
    }
    // set to 0, thus invalidating the current token
    userQuery.sessionIAT = 0;
    await userQuery.save();
    await res.code(200).send({});
    return;
}
exports.register = async(req, res, next) => {
    let userRegex = /^[a-zA-Z0-9]+$/;
    let userDatabaseCount = await accountDatabase.count();
    if(!req.body || !req.body.userName || !req.body.password) {
        // do we actually have the data?
        await res.code(400).send({});
        return;
    }
    if(!userRegex.test(req.body.userName)) {
        // username has weird characters
        await res.code(400).send({});
        return;
    }
    let userQuery = await accountDatabase.findOne({ where: { userName: req.body.userName }});
    if(userQuery) {
        // if there's already an registered user with that username, we return an error
        await res.code(409).send({});
        return;
    }
    let hashedPassword = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    await accountDatabase.create({
        userName: req.body.userName,
        password: hashedPassword,
        isAdmin: authConfiguration.firstUserIsAdmin && (userDatabaseCount == 0) ? true : false,
        disabled: false,
        sessionIAT: 0
    });
    await res.code(200).send({});
    return;
}
exports.manage = async(req, res, next) => {
    /* We are going to copy and paste some code from the logout function to validate the logged user */
    // the token can only be in two places, the authorization header or in cookies as "accessToken", grab any of them.
    let userToken = (!!req.headers.authorization ? req.headers.authorization.split(" ")[1] : undefined) || req.cookies.accessToken;
    try {
        jwt.verify(userToken, authConfiguration.jwtDetails.jwtSecretKey);
    } catch(e) {
        // token is not valid, throw error
        await res.code(401).send({});
        return;
    }
    // grab the payload contents
    let jwtObject = jwt.decode(userToken);
    // check to the database if the user exists
    let userQuery = await accountDatabase.findOne({ where: { id: jwtObject.accountID, userName: jwtObject.userName } });
    if(!userQuery) {
        // user does not exist, throw error
        await res.code(401).send({});
        return;
    }
    if(Math.floor(userQuery.sessionIAT / 1000) != jwtObject.iat) {
        // not the issued token, invalidate the cookie (if exists) and throw error
        await res.code(401).send({});
        return;
    }
    // At this point we have both an valid jwt object and the correspondent entry for the user in the database
    switch(req.method) {
        case "PUT":
            if(!req.body || !req.body.action || !req.body.data) {
                // do YOU actually have the data?
                await res.code(400).send({});
                return;
            }
            switch(req.body.action) {
                case "changePassword":
                    /*
                     * Data index (for users):
                     * 0 - Old password
                     * 1 - New password
                     * 2 - New password (again, for verify)
                     * 
                     * Data index (for admins):
                     * 0 - New password
                     * 1 - New password (again, for verify)
                     */
                    if(!!req.params || req.params.accountID != "") {
                        // we should reach this when we are specific on managing an account that isn't ours
                        // users that somehow find out that this is a thing shouldn't be able to manage other than their accounts without admin.
                        if(req.params.accountID != jwtObject.accountID) {
                            if(!userQuery.isAdmin) {
                                // nope, you can't manage other accounts if you're not admin
                                await res.code(401).send({});
                                break;
                            }
                            let userQuery2 = await accountDatabase.findOne({ where: { id: req.params.accountID } });
                            if(!userQuery2) {
                                // the user doesn't exist, since we are admins, we would be able to just throw 404 to indicate this as opposed to the login counterpart.
                                await res.code(404).send({});
                                break;
                            }
                            if(userQuery2.isAdmin) {
                                // you can't change the password to another admin
                                await res.code(403).send({});
                                break;
                            }
                            if(req.body.data[0] != req.body.data[1]) {
                                // new passwords don't match
                                await res.code(400).send({});
                                break;
                            }
                            let hashedPassword = bcrypt.hashSync(req.body.data[0], bcrypt.genSaltSync(10));
                            userQuery2.password = hashedPassword;
                            userQuery2.sessionIAT = 0; // invalidate current token
                            await userQuery2.save();
                            break;
                        }
                        // we will not break here, hopefully everything won't break
                    }
                    if(userQuery.isAdmin) {
                        // i'm on my own account and i'm an admin, I don't need my old password obviously
                        if(req.body.data[0] != req.body.data[1]) {
                            // new passwords don't match
                            await res.code(400).send({});
                            break;
                        }
                        let hashedPassword = bcrypt.hashSync(req.body.data[1], bcrypt.genSaltSync(10));
                        userQuery.password = hashedPassword;
                        /* re-login so old tokens should be invalidated, i'm going to copy-paste some of the login stuff */
                        // initialize contents of the token payload
                        let tokenContent = authConfiguration.jwtDetails.jwtObject;
                        // store stuff, like the id and username for now
                        tokenContent.accountID = userQuery.id;
                        tokenContent.userName = userQuery.userName;
                        // we overwrite the same variable with the now signed token
                        tokenContent = jwt.sign(tokenContent, authConfiguration.jwtDetails.jwtSecretKey, { expiresIn: authConfiguration.jwtDetails.jwtExpiration });
                        // store the last time the token was issued, this is used to track the active one and invalidate on request
                        userQuery.sessionIAT = jwt.decode(tokenContent).iat * 1000;
                        // write changes
                        await userQuery.save();
                        await res.code(200).send({accessToken: tokenContent});
                        break;
                    }
                    if(!bcrypt.compareSync(req.body.data[0], userQuery.password)) {
                        // old password is not the same as the current password
                        await res.code(401).send({});
                        break;
                    }
                    if(req.body.data[1] != req.body.data[2]) {
                        // new passwords don't match
                        await res.code(400).send({});
                        break;
                    }
                    let hashedPassword = bcrypt.hashSync(req.body.data[1], bcrypt.genSaltSync(10));
                    userQuery.password = hashedPassword;
                    /* re-login so old tokens should be invalidated, i'm going to copy-paste some of the login stuff */
                    // initialize contents of the token payload
                    let tokenContent = authConfiguration.jwtDetails.jwtObject;
                    // store stuff, like the id and username for now
                    tokenContent.accountID = userQuery.id;
                    tokenContent.userName = userQuery.userName;
                    // we overwrite the same variable with the now signed token
                    tokenContent = jwt.sign(tokenContent, authConfiguration.jwtDetails.jwtSecretKey, { expiresIn: authConfiguration.jwtDetails.jwtExpiration });
                    // store the last time the token was issued, this is used to track the active one and invalidate on request
                    userQuery.sessionIAT = jwt.decode(tokenContent).iat * 1000;
                    // write changes
                    await userQuery.save();
                    await res.code(200).send({accessToken: tokenContent});
                    break;
            }
            break;
        case "DELETE":
            if(!!req.params || req.params.accountID != "") {
            }
            break;
        default:
            // unknown method, not sure how you'll get here but good luck lol
            await res.code(405).send({});
            break;
    }
    return;
}
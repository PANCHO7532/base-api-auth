/*
 * /=======================================================\
 * | Copyright (c) P7COMunications LLC                     |
 * | Author: Francisco Medina [pancho7532@p7com.net]       |
 * | Date: 14/May/2023                                     |
 * |=======================================================|
 * |-> Purpose: Main file                                  |
 * \=======================================================/
 */
const fastify = require("fastify");
const database = require("./database");
const app = fastify();
const serverConfiguration = require("./config/server.config.json");
const serverHost = process.env.HOST || serverConfiguration.serverHost;
const serverPort = process.env.PORT || serverConfiguration.serverPort;
app.register(require("@fastify/cookie"));
app.register(require("@fastify/formbody"));
app.register(require("./routes"));
app.listen({port: serverPort, host: serverHost}, async(err, addr) => {
    if(err) {
        console.log("[ERROR] An error occurred!");
        app.log.error(err);
        process.exit(1);
    }
    console.log(`[INFO] Server started at ${serverHost} in port ${serverPort}`);
    // Only then we may sync the database
    try { await database.sync({force: true}); } catch(e) { console.log(`[ERROR] Couldn't sync database! ${e}`); }
});
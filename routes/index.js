const mainController = require("../controllers/main.controller");
const authController = require("../controllers/auth.controller");
module.exports = function(app, options) {
    app.post("/auth/login", authController.login);
    app.post("/auth/register", authController.register);
    app.post("/auth/manage", authController.manage);
    app.get("/auth/logout", authController.logout);
    return app;
}
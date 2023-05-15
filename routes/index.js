const mainController = require("../controllers/main.controller");
const authController = require("../controllers/auth.controller");
module.exports = function(app, options) {
    app.post("/auth/login", authController.login);
    app.get("/auth/logout", authController.logout);
    app.post("/auth/register", authController.register);
    app.put("/auth/manage", authController.manage);
    app.delete("/auth/manage", authController.manage);
    app.put("/auth/manage/:accountID", authController.manage);
    app.delete("/auth/manage/:accountID", authController.manage);
    return app;
}
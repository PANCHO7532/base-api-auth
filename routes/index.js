const mainController = require("../controllers/main.controller");
const authController = require("../controllers/auth.controller");
module.exports = function(app, options) {
    app.post("/auth/login", authController.login);
    app.get("/auth/logout", authController.logout);
    app.post("/auth/register", authController.register);
    app.post("/auth/manage/:id", authController.manage);
    app.delete("/auth/manage/:id", authController.manage);
    return app;
}
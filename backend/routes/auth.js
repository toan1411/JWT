const authController = require("../controllers/authControllers");
const middlewareController = require("../controllers/middlewareControllers");
const router = require("express").Router();

router.post("/register",authController.registerUser);

router.post("/login",authController.loginUser); 

router.post("/refresh", authController.requestRefeshToken);

router.post("/logout",middlewareController.verifyToken, authController.userLogout);
 

module.exports = router;


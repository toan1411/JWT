const userController = require("../controllers/userControllers");
const router = require("express").Router();
const middlewareController = require("../controllers/middlewareControllers")
// get all user
router.get("/",middlewareController.verifyToken,userController.getAllUser)

// delete user

router.delete("/:id",middlewareController.verifyTokenAndAdmin,userController.deleteUser)

module.exports = router;
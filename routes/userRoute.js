const express = require("express");
const router = express.Router();
const protect = require("../middleWare/authMiddleware");

const {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetpassword,
} = require("../controllers/userController");

// WHEN WE CREATE ROUTE FILE , WE MUST REQUIRE THAT IN SERVER.JS

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/getuser", protect, getUser);
router.get("/loggedin", loginStatus);
router.patch("/updateuser", protect, updateUser);
router.patch("/changepassword", protect, changePassword);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetpassword);

module.exports = router;

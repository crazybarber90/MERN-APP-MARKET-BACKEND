const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};
// ------------------ REGISTER USER -----------------------------------------
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // VALIDATION
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // CHECK IF USER EMAIL ALLREADY EXIST
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    throw new Error("Email has allready been registered");
  }

  // CREATE NEW USER
  const user = await User.create({
    name,
    email,
    password,
  });

  //GENERATE TOKEN F AFTER CREATE USER
  const token = generateToken(user._id);

  // SEND HTTP-only cookie to Frontend
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// ------------------ LOGIN USER -----------------------------------------

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // VALIDATE REQUEST
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password ");
  }

  // CHECK IF USER EXIST
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please sign up");
  }

  // USER EXIST , CHECK IF PASSWORD IS CORRECT
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //GENERATE TOKEN F AFTER CREATE USER
  const token = generateToken(user._id);

  // SEND HTTP-only cookie to Frontend
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });

  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// ------------------ LOGOUT USER -----------------------------------------

const logout = asyncHandler(async (req, res) => {
  // SEND HTTP-only cookie to Frontend
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: "none",
    secure: true,
  });
  return res.status(200).json({
    message: "Succesfuly logged out",
  });
});

// ------------------ GET USER DATA-----------------------------------------
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { _id, name, email, photo, phone, bio } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// ------------------ GET LOGIN STATUS -----------------------------------------
const loginStatus = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }

  // VERIFY TOKEN
  const verified = jwt.verify(token, process.env.JWT_SECRET);

  if (verified) {
    return res.json(true);
  }
  return res.json(false);
});

// ------------------ UPDATE USER -----------------------------------------

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, photo, phone, bio } = user;

    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// ------------------ CHANGE PASWORD -----------------------------------------
const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  // VALIDATE
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please add old and new password");
  }

  // CHECK IF OLD PASSWORD MATCHES PASSWORD IN DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // SAVE NEW PASSWORD
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password changed successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorect");
  }
});

// ------------------ FORGOT PASWORD -----------------------------------------
const forgotPassword = asyncHandler(async (req, res) => {
  //when someone press "forgot password", he will send to us his email via req
  const { email } = req.body;
  const user = await User.findOne({ email });

  //if user doesn't exist send error
  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // DELETE TOKEN IF IT EXIST IN MONGO DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  //if user exist , create reset token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  // console.log(resetToken);

  // HASH TOKEN BEFORE SAVING IN MONGO DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // SAVE TOKEN TO MONGO DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // 30mins
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset email
  const message = `
    <h2> Hello ${user.name}</h2>
    <p>Plese use the url below to reset your password</p>
    <p>This reset link is valid for only 30 minutes</p>
    <a href=${resetUrl} clicktracking=off >${resetUrl}</a>
    <p>Regards...</p>
    <p>Nikola Petrovic Team</p>
  `;

  // OTHER ARGUMENTS FOR sendEmail function in utils
  const subject = "Password Reset Request ";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// ------------------ RESET PASWORD -----------------------------------------
// we expect 2 params from frontend
// 1 (token through URL), 2 (new password)
const resetpassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // HASH TOKEN THEN COMPARE TO TOKEN FROM MONGO DB BCS IN DB IS HASHED TOKEN
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // F IND TOKEN IN MONGO DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() }, // gt = greater then
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or expired token");
  }

  // FIND USER
  const user = await User.findOne({
    _id: userToken.userId,
  });
  user.password = password;
  await user.save();
  res.status(200).json({ message: "Password reset successful, please Login" });

  //when we reset our password we will use token from url from email for params for testing
  //reset password or we will log reset token on line 252, to get reset token.
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetpassword,
};

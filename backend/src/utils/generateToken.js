const jwt = require("jsonwebtoken");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "dev_secret_change_this", {
    expiresIn: "7d",
  });

module.exports = generateToken;

const User = require('../../models/User');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


class LoginController {
  async login(req, res, next) {
    const { email, password } = req.body;

    if (!email || !password) {
      const conflictError = 'Please enter a valid email and password';
      return res.status(400).json({ conflictError, success: false });
    }

    try {
      const existingUser = await User.findOne({ where: { email } });

      if (!existingUser) {
        return res.status(404).json({ message: "User not found." });
      }

      const isPasswordValid = await bcrypt.compare(password, existingUser.password);
      const isActived = existingUser.actived === 1 ? true : false;
      if (isPasswordValid && isActived) {
        // Tạo session
        req.session.loggedin = true;
        req.session.user = existingUser;

        // Tạo JWT
        const token = jwt.sign({ id: existingUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(200).json({ message: "Success", id: existingUser.id, avatar: existingUser.avatar, success: true, token });
      } else {
        const conflictError = 'User credentials are not valid.';
        return res.status(401).json({ conflictError, success: false });
      }
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res) {
    req.session.destroy((err) => {
        if (err) res.status(500).json({message: err.message, success: false});
        return res.status(200).json({success: true});;
    })
  }
}

module.exports = new LoginController();

const User = require('../../models/User');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

const mailer = require('../../utils/mailer');

class RegisterController {
  async register(req, res, next) {
    const { email, password, name } = req.body;

    try {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await User.create({ name, email, password: hashedPassword, actived : 0 });
      bcrypt.hash(email, parseInt(process.env.BCRYPT_SALT_ROUND)).then((hashedEmail) => {
        console.log(`${process.env.APP_URL}/register/verify?email=${email}&token=${hashedEmail}`);
        mailer.sendMail(email, "Verify Email", `<a href="${process.env.APP_URL}/register/verify?email=${email}&token=${hashedEmail}"> Verify </a>`)
      });
      return res.status(200).json({ message: 'User created successfully', user: newUser, success: true });
    } catch (err) {
      next(err);
    }
  }

  async verify(req, res) {
    const { email, token } = req.query;
  
    try {
      const isValidToken = await bcrypt.compare(email, token);
  
      if (!isValidToken) {
        return res.status(404).json({ message: 'Not found.', success: false });
      }
  
      const user = await User.findOne({ where: { email } });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.', success: false });
      }
  
      user.actived = 1;
      await user.save();
  
      return res.redirect(process.env.CLIENT_URL);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error', success: false });
    }
  }


  async resetPassword(req, res, next) {
    const { email, newPassword } = req.body;

    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await user.update({ password: hashedPassword });

      return res.status(200).json({ message: 'Password reset successfully', user: updatedUser });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RegisterController();

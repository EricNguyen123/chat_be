const express = require('express');
const router = express.Router();
const LoginController = require('../controllers/auth/LoginController');
const authMiddleware = require('../middlewares/auth');

router.post('/', LoginController.login);
router.delete('/sign_out', LoginController.logout)


module.exports = router;

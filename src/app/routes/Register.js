const express = require('express');
const router = express.Router();
const RegisterController = require('../controllers/auth/RegisterController');

router.post('/', RegisterController.register);
router.get('/verify', RegisterController.verify);


module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const UserController = require('../controllers/UserController')

router.get('/', authMiddleware.loggedin);
router.get('/user/:id', authMiddleware.verifyToken, UserController.getUser );
router.get('/users', authMiddleware.verifyToken, UserController.getUsers );
router.get('/my_acount', authMiddleware.verifyToken, UserController.getCurrentUser )

module.exports = router;

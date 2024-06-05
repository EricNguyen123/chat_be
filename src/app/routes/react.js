const express = require('express');
const router = express.Router();
const ReactController = require('../controllers/ReactController');
const authMiddleware = require('../middlewares/auth');

router.post('/', authMiddleware.verifyToken, ReactController.createReact);
router.delete('/', authMiddleware.verifyToken, ReactController.deleteReact);
router.get('/', authMiddleware.verifyToken, ReactController.getReacts);

module.exports = router;

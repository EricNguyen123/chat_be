const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const RelationshipController = require('../controllers/RelationshipController')

router.get('/follow/:id', authMiddleware.verifyToken, RelationshipController.follow);
router.get('/unfollow/:id', authMiddleware.verifyToken, RelationshipController.unfollow);

module.exports = router;

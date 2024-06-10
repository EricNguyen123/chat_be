const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const authMiddleware = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.get('/:roomId', authMiddleware.verifyToken, MessageController.getAllMessagesByRoom);
router.delete('/:id', authMiddleware.verifyToken, MessageController.deleteMessage);
router.post('/', upload.array('mediaItems'), authMiddleware.verifyToken, MessageController.addMessage);

module.exports = router;

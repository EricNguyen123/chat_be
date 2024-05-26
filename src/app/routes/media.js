const express = require('express');
const router = express.Router();
const MediaController = require('../controllers/media/MediaController');
const authMiddleware = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('media'), authMiddleware.verifyToken, MediaController.uploadMedia);
router.post('/update_avatar', upload.single('avatar'), authMiddleware.verifyToken, MediaController.updateAvatar);

module.exports = router;

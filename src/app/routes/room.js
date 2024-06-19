const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const RoomController = require('../controllers/RoomController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/groups', upload.array('mediaItem'), authMiddleware.verifyToken, RoomController.createGroupRoom );
router.post('/destroy_group', authMiddleware.verifyToken, RoomController.deleteRemember);
router.post('/', authMiddleware.verifyToken, RoomController.createOneToOneRoom );
router.get('/', authMiddleware.verifyToken, RoomController.getAllRoomsForCurrentUser );

module.exports = router;

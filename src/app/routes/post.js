const express = require('express');
const router = express.Router();
const PostController = require('../controllers/PostController');
const authMiddleware = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.array('mediaItems'), authMiddleware.verifyToken, PostController.createPost);
router.get('/:id', authMiddleware.verifyToken, PostController.getPost);
router.get('/', authMiddleware.verifyToken, PostController.getAllRelatedPosts);
router.get('/user_posts/:id', authMiddleware.verifyToken, PostController.getAllUserPosts);
router.put('/:id', upload.array('mediaItems'), authMiddleware.verifyToken, PostController.updatePost);
router.delete('/:id', authMiddleware.verifyToken, PostController.deletePost);

module.exports = router;

const express = require('express');
const { registerUser, getUsers } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate, authorize('admin'));
router.post('/', registerUser);
router.get('/', getUsers);

module.exports = router;

const express = require('express');
const controller = require('../controllers/userController');

const router = express.Router();

router.get('/', controller.listUsers);
router.post('/', controller.createUser);
router.put('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

module.exports = router;

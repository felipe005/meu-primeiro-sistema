const express = require('express');
const controller = require('../controllers/teamController');

const router = express.Router();

router.get('/', controller.listTeam);
router.post('/', controller.createMember);
router.put('/:id', controller.updateMember);
router.delete('/:id', controller.deleteMember);

module.exports = router;

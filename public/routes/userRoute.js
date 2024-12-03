const express = require('express');
const router = express.Router();
const { setUsername, updateScore } = require('../controllers/userController');

router.post('/set-username', setUsername);
router.post('/score', updateScore);

module.exports = router;

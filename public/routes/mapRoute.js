const express = require('express');
const router = express.Router();
const { getMap } = require('../controllers/mapController');

router.get('/:mapName', getMap);

module.exports = router;

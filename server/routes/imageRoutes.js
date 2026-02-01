const express = require('express');
const router = express.Router();
const { getImage } = require('../controllers/imageController');

// Public route to serve images from GridFS
router.get('/:id', getImage);

module.exports = router;

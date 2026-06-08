const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, (req, res, next) => SearchController.globalSearch(req, res, next));

module.exports = router;

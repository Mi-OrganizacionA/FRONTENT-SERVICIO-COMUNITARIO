const express = require('express');
const router = express.Router();
const SearchController = require('../controllers/searchController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, (req, res, next) => SearchController.globalSearch(req, res, next));

module.exports = router;

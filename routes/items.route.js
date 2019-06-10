const express = require('express');
const router = express.Router();

const items_controller = require('../controllers/items.controller');

router.get('/test', items_controller.test);
router.get('/wikidata/:lang/:category/:wdt/:wd', items_controller.get_wikidata);

module.exports = router;

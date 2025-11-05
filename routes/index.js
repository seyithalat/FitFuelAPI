var express = require('express'); 
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'FitFuel v1.0.0' }); // Je eigen titel
});

module.exports = router;

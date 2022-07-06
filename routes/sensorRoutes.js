const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController')


router.get('/checkStatus',sensorController.check_status)
router.get('/getAllLevels',sensorController.get_all_levels)
// router.get('/:id',(req,res)=>{
//   res.send(`received request ${req.params.id}`)
// })

module.exports = router;
const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController')

router.get('/resetStatus',sensorController.reset_new_status)
router.get('/checkStatus',sensorController.update_new_status)

// router.get('/:id',(req,res)=>{
//   res.send(`received request ${req.params.id}`)
// })

module.exports = router;
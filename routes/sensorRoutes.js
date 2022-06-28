const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController')

router.get('/checkStatus',sensorController.getOneTableStatus)
// router.post('/checkStatus',tableController.getOneTableStatus)

// router.get('/:id',(req,res)=>{
//   res.send(`received request ${req.params.id}`)
// })

module.exports = router;
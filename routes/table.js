const express = require('express');
const router = express.Router();
const tableController = require('../controllers/table')

router.get('/checkStatus',tableController.getOneTableStatus)
// router.get('/:id',(req,res)=>{
//   res.send(`received request ${req.params.id}`)
// })

module.exports = router
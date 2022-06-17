const express = require('express')
const app = express()

const tableRouter = require('./routes/table')

app.get('/',(req,res)=>{
  res.send("Welcome to backend")
})

app.use('/table',tableRouter)

app.listen(3001)
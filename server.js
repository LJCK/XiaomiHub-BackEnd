const express = require('express')
const app = express()
const bodyParser = require('body-parser')
// const multer = require('multer') // v1.0.5
// const upload = multer() // for parsing multipart/form-data

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

const tableRouter = require('./routes/table')

app.get('/',(req,res)=>{
  res.send("Welcome to backend")
})

app.use('/table',tableRouter)

app.listen(3001)
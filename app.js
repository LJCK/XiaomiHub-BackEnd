const express = require('express');
const { result } = require('lodash');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const sensorRoutes = require('./routes/sensorRoutes');
// const multer = require('multer') // v1.0.5
// const upload = multer() // for parsing multipart/form-data



const app = express();

//connect to mongodb
const dbURI = 'mongodb+srv://qinxiang:qinxiang@cluster0.ojjsesl.mongodb.net/?retryWrites=true&w=majority'
mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true }) //its an async task, returns something like a promise
        .then(result => app.listen('3001', () => console.log('connected to db, server started')))
        .catch(err => console.log(err));


app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.get('/',(req,res)=>{
  res.send("Welcome to backend");
})

app.use('/sensors',sensorRoutes);
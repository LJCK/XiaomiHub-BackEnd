const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const oldOccupancySchema = new Schema({
    _id: { //need to find a way to replace auto generated id with this
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    date:{
        type: Date,
        required: true
    },
    desk:{
        type: Object,
        required: true
    }
});

const newOccupancySchema = new Schema({
    _id: { //need to find a way to replace auto generated id with this
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    desks:{
        type: Object,
        required: true
    } 
});

//create a model
const newOccupancy = mongoose.model('Current Occupancy', newOccupancySchema);
const oldOccupancy = mongoose.model('Old Occupancy', oldOccupancySchema);

module.exports = {newOccupancy,oldOccupancy}
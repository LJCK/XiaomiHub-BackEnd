const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const oldOccupancySchema = new Schema({
    level: {
        type: Number,
        required: true
    },
    deskOccupancy: {
        type: Array,
        required: true
    }
});

const deskObjSchema = new Schema({
    tableID: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    expiryTime: {
        type: String,
        required: true
    }
})

const newOccupancySchema = new Schema({
    level: {
        type: Number,
        required: true
    },
    deskOccupancy: {
        type: Object
    }
})

//create a model
const newOccupancy = mongoose.model('Current Occupancy', newOccupancySchema);
const oldOccupancy = mongoose.model('Old Occupancy', oldOccupancySchema);


// const table_obj_to_json = (id, status)=>{
//   const data = {
//     "table": id,
//     "status": status
//   }
//   return data
// }

module.exports = {newOccupancy,oldOccupancy}
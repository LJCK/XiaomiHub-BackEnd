const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const occupancySchema = new Schema({
    level: {
        type: Number,
        required: true
    },
    deskOccupancy: {
        type: Array,
        required: true
    }
});

//create a model
const newOccupancy = mongoose.model('Current Occupancy', occupancySchema);
const oldOccupancy = mongoose.model('Old Occupancy', occupancySchema);


// const table_obj_to_json = (id, status)=>{
//   const data = {
//     "table": id,
//     "status": status
//   }
//   return data
// }

module.exports = {newOccupancy,oldOccupancy}
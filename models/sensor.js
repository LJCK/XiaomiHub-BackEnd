const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorSchema = new Schema({
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
const Sensor = mongoose.model('Sensor', sensorSchema);


// const table_obj_to_json = (id, status)=>{
//   const data = {
//     "table": id,
//     "status": status
//   }
//   return data
// }

module.exports = {
  Sensor
}
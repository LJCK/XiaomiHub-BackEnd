const Influx = require('influx');
const moment = require("moment");
const Sensor = require('../models/sensor');

const client = new Influx.InfluxDB({
  database: "homeassistant",
  host: "192.168.197.48",
  port:8086,
  username: "admin",
  password: "admin"
});


const getOneTableStatus = async(req, res) => {
  
  const totalTable = req.query.totalTable;
  const array = req.body.array;
  if (array.length < totalTable){
    console.log("now creating array");
    for (i = 0; i < totalTable; i++){
      array.push("unoccupied");
    }
  }
  
  for(z=0; z < totalTable; z++){
    let ratio = 0;
    switch (array[z]){
      case "unoccupied":
        ratio = await check_sensor(z+1,4);
        console.log("table %d unoccupied",z+1);
        console.log(ratio);
        if (ratio >0.5){
          console.log("change to occupied");
          array[z]="occupied";
        }
        break;
      case "occupied":
        ratio = await check_sensor(z+1,60);
        console.log("table %d occupied",z+1);
        console.log(ratio);
        if (ratio<0.3){
          console.log("change to unoccupied");
          array[z]="unoccupied";
        }
        break;
      default:
        res.status(400).send("Wrong table status passed over.");
        break
      }
  }
  console.log(array);
  const sensor = new Sensor({level: 8, deskOccupancy: array});
  sensor.save()
      .then((result) => {
          console.log("saved to database");
      })
      .catch(err => console.log(err));
  console.log("end");
  res.json(array);
}

const check_sensor = async(id,time) => {
  let ratio = 0;
  try{
    let duration = 0;
    let results = await client.query(`SELECT distinct("value") AS "distinct_value" FROM "homeassistant"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND "entity_id"='vibration_sensor_${id}'GROUP BY time(1s) FILL(null)`);
  // console.log(results)
    for (i=0; i < results.length; i++){
      if (i == results.length - 1){
        break;
      }
      if(results[i].distinct_value == 0){
        continue;
      }
      start = results[i].time._nanoISO.slice(11,-1);
      end = results[++i].time._nanoISO.slice(11,-1);
      let t1 = moment(start,"hh:mm:ss");
      let t2 = moment(end,"hh:mm:ss");
      let diff = moment(t2.diff(t1)).format("ss");
      duration+=parseInt(diff);
    }
    ratio = duration/(time*60);
  }
  catch(err){
    console.log(err);
  }
return ratio;

}

module.exports = {
  getOneTableStatus
}
const Influx = require('influx');
const { result } = require('lodash');
const moment = require("moment");
// const oldOccupancy = require('../models/sensor');
const {newOccupancy, oldOccupancy} = require("../models/sensor")

const client = new Influx.InfluxDB({
  database: "homeassistant",
  host: "10.0.128.11",
  port:8086,
  username: "admin",
  password: "admin"
});
// moment.utc().local().format('YYYY-MM-DD HH:mm:ss')
const resetStatus=(req,res)=>{
  let level = 8
  oldOccupancy.findOneAndUpdate({level:level},{"$push":{deskOccupancy: resetTableStatus()}},(err, data)=>{
    if(err){
      res.status(404).send(err)
    }else{
      if (data == null){
        let c = oldOccupancy({level: level, deskOccupancy: resetTableStatus()})
        c.save()
        res.status(200).send("save to db")
      }else{
        res.status(200).send("db updated")
      }
    }
  })
  // const c = new Occupancy()
  // c.level = 8
  // c.deskOccupancy = getTableStatus()
  // c.updateOne()
  // console.log("save to db")
}
  
const resetTableStatus=()=>{
  let dic = new Object()
  let tableStatus = new Object()
  for(i=1;i<=64;i++){
    tableStatus["table "+i] = "unoccupied"
  }
  dic = {
    date : moment.utc().local().format('YYYY-MM-DD HH:mm:ss'),
    status : tableStatus
  }
  return dic
}

const getTableStatus = async(req, res) => {
  const totalTable = req.query.totalTable;
  const level = req.query.level;
  newOccupancy.findOne({level:level}).then((result)=>{
    if(result == null){
      let c = newOccupancy({level: level, deskOccupancy: generate_current_table_status(totalTable)})
      c.save()
      res.status(200).send("save to db")
    }
  }).catch(err=> console.log(err))
  // const new_table_status = generate_current_table_status(totalTable,newOccupancy.findOne({level:level}).deskOccupancy)
  // newOccupancy.findOneAndUpdate({level:level},{deskOccupancy:new_table_status})
}

const generate_current_table_status= async(totalTable, array=[])=>{
  let tableStatus = new Object()
  if(array ==[]){
    for(i=1;i<=totalTable;i++){
      tableStatus["table "+i] = "unoccupied"
    }
  }

  
  
}

//   const totalTable = req.query.totalTable;
//   const array = req.body.array;
//   if (array.length < totalTable){
//     console.log("now creating array");
//     for (i = 0; i < totalTable; i++){
//       array.push("unoccupied");
//     }
//   }
  
//   for(z=0; z < totalTable; z++){
//     let ratio = 0;
//     switch (array[z]){
//       case "unoccupied":
//         ratio = await check_sensor(z+1,4);
//         console.log("table %d unoccupied",z+1);
//         console.log(ratio);
//         if (ratio >0.5){
//           console.log("change to occupied");
//           array[z]="occupied";
//         }
//         break;
//       case "occupied":
//         ratio = await check_sensor(z+1,60);
//         console.log("table %d occupied",z+1);
//         console.log(ratio);
//         if (ratio<0.3){
//           console.log("change to unoccupied");
//           array[z]="unoccupied";
//         }
//         break;
//       default:
//         res.status(400).send("Wrong table status passed over.");
//         break
//       }
//   }
//   console.log(array);
//   res.json(array);
// }

// const reset_mongoDB = ()=>{
//   const totalTable = 2
//   let array = []
//   for (i = 0; i < totalTable; i++){
//     array.push("unoccupied");
//   }

//   Sensor.findOneAndReplace({level:8}, {level: 8, deskOccupancy: array})
//   .then((result) => {
//           console.log("saved to database");
//       })
//       .catch(err => console.log(err));

// }

// const update_mongoDB=async()=>{
//   const totalTable = 2
//   let array = []
//   await Sensor.find({"level":8}).then((result)=>{

//     array= result[0].deskOccupancy
//   }).catch(err =>console.log(err)) 
//   console.log(array)

//   for(z=0; z < totalTable; z++){
//     let ratio = 0;
//     switch (array[z]){
//       case "unoccupied":
//         ratio = await check_sensor(z+1,4);
//         console.log("table %d unoccupied",z+1);
//         console.log(ratio);
//         if (ratio >0.5){
//           console.log("change to occupied");
//           array[z]="occupied";
//         }
//         break;
//       case "occupied":
//         ratio = await check_sensor(z+1,60);
//         console.log("table %d occupied",z+1);
//         console.log(ratio);
//         if (ratio<0.3){
//           console.log("change to unoccupied");
//           array[z]="unoccupied";
//         }
//         break;
//       default:
//         res.status(400).send("Wrong table status passed over.");
//         break
//       }
//   }
//   // console.log(array);

//   // const sensor = new Sensor();
//   await Sensor.findOneAndReplace({level:8}, {level: 8, deskOccupancy: array})
//   .then((result) => {
//           console.log("saved to database");
//       })
//       .catch(err => console.log(err));
  
// }

const check_sensor = async(id,time) => {
  let end = moment()
  let start = moment.utc().subtract(time, 'minutes')
  console.log("start\n",start)
  console.log("end\n",end)
  let t1 = 0,t2=0, diff =0, time1 =0, time2=0, duration=0, ratio =0
  try{
    let results = await client.query(`SELECT distinct("value") AS "distinct_value" FROM "homeassistant"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND "entity_id"='vibration_sensor_${id}'GROUP BY time(1s) FILL(null)`);
    // console.log(results)
    for (i=0; i < results.length; i++){
      if(i === 0 && results[i].distinct_value == 0){
        // condition when first data is 0
        time2 = results[0].time._nanoISO.slice(11,-1);
        t2 = moment(time2,"hh:mm:ss").add(8,'hours');
        diff = t2.diff(start,'seconds');
        // console.log(i)
        // console.log("difference\n",t2,"-",start,"=",diff)
      }
      else if(i === results.length - 1 && results[i].distinct_value ==1){
        // condition when last data is 1
        time1 = results[i].time._nanoISO.slice(11,-1);
        t1 = moment(time1,"hh:mm:ss").add(8,'hours');
        diff = end.diff(t1,'seconds');
        // console.log(i)
        // console.log("difference\n",end,"-",t1,"=",diff)
      }
      else if(results[i].distinct_value == 0){
        time1 = results[i-1].time._nanoISO.slice(11,-1);
        time2 = results[i].time._nanoISO.slice(11,-1);
        t1 = moment(time1,"hh:mm:ss");
        t2 = moment(time2,"hh:mm:ss");
        diff = t2.diff(t1,'seconds');
        // console.log(i)
        // console.log("difference\n",t2,"-",t1,"=",diff)
      }
      duration+=parseInt(diff);
    }
    ratio = duration/(time*60);
  }catch(error){
    console.log(error)
  }
return ratio;

}

module.exports={
  resetStatus,
  getTableStatus
}
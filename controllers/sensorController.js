const Influx = require('influx');
const { result } = require('lodash');
const moment = require("moment");
// const oldOccupancy = require('../models/sensor');
const {newOccupancy, oldOccupancy} = require("../models/sensor")

const client = new Influx.InfluxDB({
  database: "level 8",
  host: "10.0.128.64",
  port:8086,
  username: "cpf",
  password: "cpf"
});
// moment.utc().local().format('YYYY-MM-DD HH:mm:ss')

const update_new_status= async(req, res)=>{
  const totalTable = req.query.totalTable;
  const level = req.query.level;
  try{
    let data = await newOccupancy.findOne({level: level})
    
    if (data == null){
      let c = newOccupancy({level: level, deskOccupancy: generate_current_table_status(level,totalTable)})
      try{
        await c.save()
        res.status(200).send("saved to db")
      }catch(error){console.log(error)}
    }else{
      // await newOccupancy.findOneAndUpdate({level: level},{deskOccupancy: generate_current_table_status(level,totalTable,data.deskOccupancy)},(error,data)=>{
      //   if(error){
      //     console.log("error\n",error)
      //   }else{
      //     console.log("data\n",data)
      //   }
      // })
    }
  }catch(error){console.log(error)}
  
  
}

// const log_old_status=(level, array)=>{
//   oldOccupancy.findOneAndUpdate({level:level},{"$push":{deskOccupancy: resetTableStatus()}},(err, data)=>{
//     if(err){
//       res.status(404).send(err)
//     }else{
//       if (data == null){
//         let c = oldOccupancy({level: level, deskOccupancy: resetTableStatus()})
//         c.save()
//         res.status(200).send("save to db")
//       }else{
//         res.status(200).send("db updated")
//       }
//     }
//   })
// }
  


// const getTableStatus = async(req, res) => {
//   const totalTable = req.query.totalTable;
//   const level = req.query.level;
//   newOccupancy.findOne({level:level}).then((result)=>{
//     if(result == null){
//       let c = newOccupancy({level: level, deskOccupancy: generate_current_table_status(totalTable)})
//       c.save()
//       res.status(200).send("save to db")
//     }
//   }).catch(err=> console.log(err))
  // const new_table_status = generate_current_table_status(totalTable,newOccupancy.findOne({level:level}).deskOccupancy)
  // newOccupancy.findOneAndUpdate({level:level},{deskOccupancy:new_table_status})
// }

const generate_current_table_status= async(level, totalTable, deskArr=[])=>{
  
  if(!deskArr.length){ //if no record in database, create new record
    for(i=1;i<=totalTable;i++){
      tableStatus = new Object()
      tableStatus["tableID"] = i,
      tableStatus["status"] = "unoccupied",
      tableStatus["expiryTime"] = moment.utc().local().format("HH:mm:ss")
      deskArr.push(tableStatus)
    }
  }

  for(z=0; z < totalTable; z++){ //check occupancy status of each table, and update deskArr accordingly
    let ratio = 0;
    ratio = await check_sensor(deskArr[z].tableID,5);
    if (ratio >0.5){
      if (deskArr[z].status == "unoccupied"){
        deskArr[z].status="occupied";
        deskArr[z].expiry_time = moment.utc().local().add(2,"hours").format("HH:mm:ss")
      }else{
        let expiry_time = moment(deskArr[z].expiry_time, 'hh:mm:ss')
        if(expiry_time.isBefore(moment.utc().local())){
          deskArr[z].status="unoccupied";        
        }
      }
    }
  }
  console.log(deskArr)
  return deskArr;
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
    let results = await client.query(`SELECT distinct("value") AS "distinct_value" FROM "level 8"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND "entity_id"='vibration_sensor_${id}'GROUP BY time(1s) FILL(null)`);
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
  update_new_status
}
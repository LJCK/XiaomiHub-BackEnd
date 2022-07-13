const Influx = require('influx');
const { result } = require('lodash');
const moment = require("moment");
const {create_table_object, create_influx_query} = require("../objects/tableObjects")
// const oldOccupancy = require('../models/sensor');
const {newOccupancy, oldOccupancy, loggingList} = require("../models/sensor")

const client = new Influx.InfluxDB({
  database: "level 8",
  host: "10.0.128.11",
  port:8086,
  username: "cpf",
  password: "cpf"
});
// moment.utc().local().format('YYYY-MM-DD HH:mm:ss')

// const update_new_status= async(req, res)=>{
//   const totalTable = req.query.totalTable;
//   const level = req.query.level;
//   try{
//     let data = await newOccupancy.findOne({level: level})
    
//     if (data == null){
//       let c = newOccupancy({level: level, deskOccupancy: generate_current_table_status(level,totalTable)})
//       try{
//         await c.save()
//         res.status(200).send("saved to db")
//       }catch(error){console.log(error)}
//     }else{
//       // await newOccupancy.findOneAndUpdate({level: level},{deskOccupancy: generate_current_table_status(level,totalTable,data.deskOccupancy)},(error,data)=>{
//       //   if(error){
//       //     console.log("error\n",error)
//       //   }else{
//       //     console.log("data\n",data)
//       //   }
//       // })
//     }
//   }catch(error){console.log(error)}
  
  
// }

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

const generate_current_table_status= async(object)=>{
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
  return objects;
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

const update_current_status=async()=>{
  const table_objects = await create_table_object()
  console.log("old table object\n", table_objects)
  const entities = create_influx_query()
  const temp = await check_sensor(table_objects,entities,5);
  console.log("new table object\n",temp)
  // for (let obj in objects){
  //   try{
  //     let table_record =  await newOccupancy.findById({'_id':obj})
  //     if(table_record == null){
  //       await generate_current_table_status(objects[obj])
  //     }else{

  //     }
  //   }catch(error){
  //     console.log(error)
  //   }
  // }
  
}

const check_sensor = async(table_objects,entities,query_time) => {
  let end = moment()
  let start = moment.utc().subtract(query_time, 'minutes')
  
  try{
    let results = await client.query(`SELECT distinct("value") AS "distinct_value" FROM "level 8"."autogen"."state" WHERE time < now() AND time>= (now()-${query_time}m) AND (${entities}) GROUP BY time(1s), "entity_id" FILL(null)`);
    console.log(results)
    // objects['nv_ta_l8_2'].push(results[0])
    for(i = 0;i<results.length;i++){
      influx_time = results[i].time._nanoISO.slice(11,-1);
      formatted_time = moment(influx_time,"hh:mm:ss").add(8,'hours');
      table_objects[results[i].entity_id].arr.push({time: formatted_time,distinct_value: results[i].distinct_value})
    }
    for(let obj in table_objects){
      const data = table_objects[obj].arr
      let t1 = 0,t2=0, diff =0, duration=0
      for (i=0; i < data.length; i++){
        if(i === 0 && data[i].distinct_value == 0){
          // condition when first data is 0
          t2 = data[i].time
          diff = t2.diff(start,'seconds');
          // console.log(i)
          // console.log("difference\n",t2,"-",start,"=",diff)
        }
        else if(i === data.length - 1 && data[i].distinct_value ==1){
          // condition when last data is 1
          t1 = data[i].time
          diff = end.diff(t1,'seconds');
          // console.log(i)
          // console.log("difference\n",end,"-",t1,"=",diff)
        }
        else if(data[i].distinct_value == 0){
          t1 = data[i-1].time
          t2 = data[i].time
          diff = t2.diff(t1,'seconds');
          // console.log(i)
          // console.log("difference\n",t2,"-",t1,"=",diff)
        }
        duration+=parseInt(diff);
        // console.log("duration\n",duration)
      }
      table_objects[obj].ratio = duration/(query_time*60);
      // console.log("ratio\n",duration,'/',query_time*60,'=',table_objects[obj].ratio)
      console.log(`${obj}`,table_objects[obj].ratio)
    }
    // for (i=0; i < results.length; i++){
    //   if(i === 0 && results[i].distinct_value == 0){
    //     // condition when first data is 0
    //     time2 = results[0].time._nanoISO.slice(11,-1);
    //     t2 = moment(time2,"hh:mm:ss").add(8,'hours');
    //     diff = t2.diff(start,'seconds');
    //     // console.log(i)
    //     // console.log("difference\n",t2,"-",start,"=",diff)
    //   }
    //   else if(i === results.length - 1 && results[i].distinct_value ==1){
    //     // condition when last data is 1
    //     time1 = results[i].time._nanoISO.slice(11,-1);
    //     t1 = moment(time1,"hh:mm:ss").add(8,'hours');
    //     diff = end.diff(t1,'seconds');
    //     // console.log(i)
    //     // console.log("difference\n",end,"-",t1,"=",diff)
    //   }
    //   else if(results[i].distinct_value == 0){
    //     time1 = results[i-1].time._nanoISO.slice(11,-1);
    //     time2 = results[i].time._nanoISO.slice(11,-1);
    //     t1 = moment(time1,"hh:mm:ss");
    //     t2 = moment(time2,"hh:mm:ss");
    //     diff = t2.diff(t1,'seconds');
    //     // console.log(i)
    //     // console.log("difference\n",t2,"-",t1,"=",diff)
    //   }
    //   duration+=parseInt(diff);
    // }
    // ratio = duration/(time*60);
  }catch(error){
    console.log(error)
  }
return table_objects;

}

const test=(req,res)=>{
  update_current_status()
}

module.exports={
  // update_current_status,
  test
}
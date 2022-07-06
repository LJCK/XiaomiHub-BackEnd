const Influx = require('influx');
const { result } = require('lodash');
const moment = require("moment");
// const oldOccupancy = require('../models/sensor');
const {newOccupancy, oldOccupancy} = require("../models/sensor")

const client = new Influx.InfluxDB({
  database: "level 8",
  host: "10.0.128.68",
  port:8086,
  username: "liang",
  password: "liang"
});
// moment.utc().local().format('YYYY-MM-DD HH:mm:ss')

// const update_new_status= async(req, res)=>{
const update_new_status= async(level, totalTable)=>{

  // const totalTable = req.query.totalTable;
  // const level = req.query.level;
  try{
    let data = await newOccupancy.findOne({level: level})
    
    if (data == null){
      let deskArr = await generate_current_table_status(level,totalTable)
      let c = newOccupancy({level: level, deskOccupancy: deskArr})
      try{
        await c.save()
        await log_old_status(level,deskArr)
        // res.status(200).send("saved to empty db")
      }catch(error){console.log(error)}
    }else{
      
      let deskArr = await generate_current_table_status(level,totalTable,data.deskOccupancy)
      newOccupancy.findOneAndUpdate({level: level},{deskOccupancy: deskArr},(error,data)=>{
        if(error){
          console.log("error\n",error)
        }else{
          log_old_status(level,deskArr).then((res)).catch(error=>{console.log(error)})
          // res.status(200).send("saved to updated db")
        }
      })
    }
  }catch(error){console.log(error)}
  
}

const log_old_status=async(level, deskArr)=>{
  old_record = {deskArr, "time":moment.utc().local().format("DD-MM-YYYY HH:mm:ss")}
  oldOccupancy.findOneAndUpdate({level:level},{"$push":{deskOccupancy: old_record}}, (err, data)=>{
    if(err){
      res.status(404).send(err)
    }else{
      console.log("log to old data base")
      if (data == null){
        console.log(old_record)
        let c = oldOccupancy({level: level, deskOccupancy: old_record})
        c.save()
      }
    }
  })
}

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
      deskArr[z].status="occupied";
      deskArr[z].expiryTime = moment.utc().local().add(2,"hours").format("HH:mm:ss")
    }else{
      let expiry_time = moment(deskArr[z].expiry_time, 'hh:mm:ss')
      if (expiry_time.isBefore(moment.utc().local())){
        deskArr[z].status="unoccupied";
      }
    }
  }
  // console.log(deskArr)
  return deskArr;
}

// const reset_new_status= async(req,res)=>{
const reset_new_status= async(level,totalTable)=>{

  deskArr =[]
  // let level =8, totalTable =2
  for(i=1;i<=totalTable;i++){
    tableStatus = new Object()
    tableStatus["tableID"] = i,
    tableStatus["status"] = "unoccupied",
    tableStatus["expiryTime"] = moment.utc().local().format("HH:mm:ss")
    deskArr.push(tableStatus)
  }
  console.log("reset\n", deskArr)
  newOccupancy.findOneAndReplace({level: level},{deskOccupancy: deskArr},async(error,data)=>{
    if(error){
      console.log("error\n",error)
    }else{
      if(data == null){
        let new_push = newOccupancy({level: level, deskOccupancy: deskArr})
        await new_push.save()
        // res.status(200).send("reset db")
      }
      log_old_status(level, deskArr)
    }
  })
  
}

const check_sensor = async(id,time) => {
  let end = moment()
  let start = moment.utc().subtract(time, 'minutes')
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
  update_new_status,
  reset_new_status
}
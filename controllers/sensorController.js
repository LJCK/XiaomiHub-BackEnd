const Influx = require('influx');
const { result, forEach } = require('lodash');
const moment = require("moment");
const {get_all_floors, create_table_object, create_influx_query} = require("./tableController")
// const oldOccupancy = require('../models/sensor');
const {newOccupancy, oldOccupancy, loggingList} = require("../models/sensor")

const client = new Influx.InfluxDB({
  database: "level 8",
  host: "10.0.128.11",
  port:8086,
  username: "cpf",
  password: "cpf"
});

const generate_current_status = async(time) => {

  try {
    let [table_objects, allFloors] = await create_table_object()
    // console.log("old table object\n", table_objects)
    const queryString = create_influx_query(allFloors, time)
    // console.log("queryString\n", queryString)
    table_objects = await check_sensor(table_objects,queryString,time);
    // console.log("table object with new ratio\n",table_objects)
    await update_current_status(table_objects)
  }
  catch(error) {
    console.log(error)
  }

}

const update_current_status = async(table_objects)=>{
  
  for (let table_key in table_objects){
    let temp_table = await newOccupancy.findOne({level: table_objects[table_key]["level"]}).catch(err => console.log(err))
    if (temp_table === null){ //if newOccupancies does not have he the current table
      // let c = newOccupancy({_id: table_key, location: table_objects[table_key].location, level: table_objects[table_key].level, occupancyStatus: table_objects[table_key].occupancyStatus, expiryTime: table_objects[table_key].expiryTime})
      // await c.save().catch(err => console.log(err))
    }else{
      if (table_objects[table_key].ratio > 0.5){ //if-else statement for updating occupancyStatus
        table_objects[table_key].occupancyStatus = "occupied"
        table_objects[table_key].expiryTime = moment.utc().local().add(2,"hours").format("HH:mm:ss")
        const target = `desks.${table_key}.expiryTime`
        const update = {}
        update[target]=table_objects[table_key].expiryTime
        await newOccupancy.findOneAndUpdate({level:table_objects[table_key]["level"]}, {'$set':update}).catch(err=>console.log(err))
        // await oldOccupancy.findOneAndUpdate() //KIV
      } else{
        if(table_objects[table_key].expiryTime!==null){
          let expiry_time = moment(table_objects[table_key].expiryTime, 'hh:mm:ss')
          if(expiry_time.isBefore(moment.utc().local())){
            table_objects[table_key].occpancyStatus="unoccupied";
          }
          //   await oldOccupancy.findOneAndUpdate({_id: table_key}, {occupancyStatus: table_objects[table_key].occupancyStatus}).catch(err => console.log(err))
            
          // }
        }
      }
    }
    // console.log(`table_object(${table_key}) is:`, table_objects[table_key])
    // console.log("\n")
  }
}

const reset_mongoDB=async()=>{

  allFloors=[]//a record of all tableIDs in the building
    const floors = await newOccupancy.find()
    floors.forEach(async(floor)=>{
      for(let desk_id in floor.desks){
        const target = `desks.${desk_id}.expiryTime`
        const update = {}
        update[target]=null
        await newOccupancy.findOneAndUpdate({level:floor.level},{"$set":update}).catch(err=>console.log(err))
      }
    })  
}

const check_sensor = async(table_objects,queryString,query_time) => {
  let end = moment()
  let start = moment.utc().subtract(query_time, 'minutes')
  
  try{
    let results = await client.query(queryString);
    // console.log("results:", results)
    // objects['nv_ta_l8_2'].push(results[0])
    for(i = 0;i<results.length;i++){
      influx_time = results[i].time._nanoISO.slice(11,-1);
      formatted_time = moment(influx_time,"hh:mm:ss").add(8,'hours');
      table_objects[results[i].entity_id].vibrationRecords.push({time: formatted_time,distinct_value: results[i].distinct_value})
    }
    for(let obj in table_objects){
      const data = table_objects[obj].vibrationRecords
      let t1 = 0,t2=0, diff =0, duration=0
      for (i=0; i < data.length; i++){
        if(i === 0 && data[i].distinct_value == 0){
          // condition when first data is 0
          t2 = data[i].time
          diff = t2.diff(start,'seconds');
          // console.log(i)
          // console.log("difference\n",t2,"-",start,"=",diff)
          duration+=parseInt(diff);
        }
        else if(i === data.length - 1 && data[i].distinct_value ==1){
          // condition when last data is 1
          t1 = data[i].time
          diff = end.diff(t1,'seconds');
          // console.log(i)
          // console.log("difference\n",end,"-",t1,"=",diff)
          duration+=parseInt(diff);
        }
        else if(data[i].distinct_value == 0){
          t1 = data[i-1].time
          t2 = data[i].time
          diff = t2.diff(t1,'seconds');
          // console.log(i)
          // console.log("difference\n",t2,"-",t1,"=",diff)
          duration+=parseInt(diff);
        }
        
        // console.log("duration\n",duration)
      }
      table_objects[obj].ratio = duration/(query_time*60);
      // console.log("ratio\n",duration,'/',query_time*60,'=',table_objects[obj].ratio)
      // console.log(`${obj}`,table_objects[obj].ratio)
    }
    return table_objects;
  }catch(error){
    console.log(error)
  }
}

// const test=async(req,res)=>{

//   try {
//     // await generate_current_status(5)
//     await reset_mongoDB()
//   }
//   catch(error) {
//     console.log(error)
//   }
// }

module.exports={
  generate_current_status,
  reset_mongoDB
  // test
}
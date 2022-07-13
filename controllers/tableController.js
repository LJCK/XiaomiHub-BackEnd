const {loggingList} = require("../models/sensor")
const moment = require("moment");



const get_all_floors = async() => {
  try {
    let floors = await loggingList.find()
    console.log(floors)
    return floors
  }
  catch(error){
    console.log(error)
  }
}

const create_table_object=(floor)=>{ //based on the loggingList
    const objects ={}
    floor.tables.forEach((table_id)=>{
      objects[table_id]={
        location: floor.location,
        level: floor.level,
        vibrationRecords:[],
        ratio:0,
        occupancyStatus:null,
        expiryTime:null//default expiry_time
      }
    })
    return objects
}

const create_influx_query=(floor, time)=>{
  let entities = ""
  floor.tables.forEach((table_id, index, arr) => {
    entities += `"entity_id"='${table_id}'`
    if(arr.length-1  !== index)
      entities += ' OR '
  })

  queryString = `SELECT distinct("value") AS "distinct_value" FROM "level 8"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND (${entities}) GROUP BY time(1s), "entity_id" FILL(null)`
  return queryString
}

module.exports={get_all_floors, create_table_object,create_influx_query}


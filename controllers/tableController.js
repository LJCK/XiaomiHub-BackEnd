const {loggingList, newOccupancy} = require("../models/sensor")
const moment = require("moment");

const create_table_object=async()=>{ //based on the loggingList

  try{
    allFloors=[]//a record of all tableIDs in the building
    const floors = await newOccupancy.find()
    const objects ={}//key is tableID
    floors.forEach((floor)=>{
      for(let desk_id in floor.desks){
        allFloors.push(desk_id)
        objects[desk_id]={
          location: floor.location,
          level: floor.level,
          vibrationRecords:[],
          occupancyStatus:null,
          ratio:0,
          expiryTime:floor.desks[desk_id]["expiryTime"]
        }
      }
    })
  
  return [objects,allFloors]
  }catch(error){
    console.log(error)
  }
}

const create_influx_query=(allFloors, time)=>{
  let entities = ""
  allFloors.forEach((table_id, index, arr) => {
    entities += `"entity_id"='${table_id}'`
    if(arr.length-1  !== index)
      entities += ' OR '
  })

  queryString = `SELECT distinct("value") AS "distinct_value" FROM "level 8"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND (${entities}) GROUP BY time(1s), "entity_id" FILL(null)`
  return queryString
}

module.exports={create_table_object,create_influx_query}


const {loggingList} = require("../models/sensor")
const moment = require("moment");

const create_table_object=async(id='NV_TA_L8')=>{ //based on the loggingList
  try{
    let temp = await loggingList.findById({_id:id})
    const objects ={}
    temp.tables.forEach((table_id,index,arr)=>{
      objects[table_id]={
        arr:[],
        ratio:0,
        expiry_time:moment.utc().local().format("HH:mm:ss")//default expiry_time
      }
    })
    return objects
  }catch(error){  
    console.log(error)
  }
  
}

const create_influx_query=async(id='NV_TA_L8')=>{
  try{
    let temp = await loggingList.findById({_id:id})
    let entities = ""
    temp.tables.forEach((table_id, index, arr) => {
      entities += `"entity_id"='${table_id}'`
      if(arr.length-1  !== index)
        entities += ' OR '
    })
  }catch(error){  
    console.log(error)
  }
  return entities
}

module.exports={create_table_object,create_influx_query}
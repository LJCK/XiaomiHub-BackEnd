const Influx = require('influx');
const moment = require("moment")
// const multer = require('multer') // v1.0.5
// const upload = multer() // for parsing multipart/form-data

const client = new Influx.InfluxDB({
  database: "homeassistant",
  host: "192.168.197.48",
  port:8086,
  username: "admin",
  password: "admin"
});


const getOneTableStatus = async(req,res)=>{
  
  const totalTable = req.query.totalTable
  const array = req.body.array
  if (array.length<totalTable){
    console.log("now creating array")
    for (i = 0;i<totalTable;i++){
      array.push("unoccupied")
    }
  }
  
  for(i=0;i<totalTable;i++){
    let ratio = 0
    switch (array[i]){
      case "unoccupied":
        console.log("table %d unoccupied", i+1)
        const ratio = await check_sensor(i+1,10)
        if (ratio>0.5){
            console.log("change to occupied")
            array[i]="occupied"
        }
        // check_sensor(i+1,10, function(ratio){
        //   if (ratio >0.5){
        //     console.log("change to occupied")
        //     array[i]="occupied"
        //   }
        // })
        break
      case "occupied":
        console.log("table %d occupied",i+1)
        check_sensor(i+1,60, function(ratio){
          if (ratio<0.3){
            console.log("change to unoccupied")
            array[i]="unoccupied"
          }
        })
        break
      default:
        res.status(400).send("Wrong table status passed over.")
        break
      }
  }
  console.log(array)
  console.log("end")
  res.json(array)
}

// const check_sensor = (id,time)=>{
//   return 5
// }

const table_obj_to_json = (id, status)=>{
  const data = {
    "table": id,
    "status": status
  }
  return data
}

const check_sensor=(id,time)=>{
  let duration = 0
  client.query(`SELECT distinct("value") AS "distinct_value" FROM "homeassistant"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND "entity_id"='vibration_sensor_${id}'GROUP BY time(1s) FILL(null)`).then(results => {

    // console.log(results)
    for (i=0;i<results.length;i++){
      if (i==results.length-1){
        break
      }
      if(results[i].distinct_value == 0){
        continue
      }
      start = results[i].time._nanoISO.slice(11,-1)
      end = results[++i].time._nanoISO.slice(11,-1)
      let t1 = moment(start,"hh:mm:ss")
      let t2 = moment(end,"hh:mm:ss")
      let diff = moment(t2.diff(t1)).format("ss")
      duration+=parseInt(diff)
    }
    let ratio = duration/(4*60)
    console.log("ratio: ",ratio)
    return new Promise(resolve=>{
      setTimeout(function() {
        resolve(ratio);
        }, 2000)
    })
    
  }).catch(err => console.log("error: ",err))
}

// const check_sensor=async(id,time, callBack)=>{
//   let duration = 0
//   client.query(`SELECT distinct("value") AS "distinct_value" FROM "homeassistant"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND "entity_id"='vibration_sensor_${id}'GROUP BY time(1s) FILL(null)`).then(results => {

//     // console.log(results)
//     for (i=0;i<results.length;i++){
//       if (i==results.length-1){
//         break
//       }
//       if(results[i].distinct_value == 0){
//         continue
//       }
//       start = results[i].time._nanoISO.slice(11,-1)
//       end = results[++i].time._nanoISO.slice(11,-1)
//       let t1 = moment(start,"hh:mm:ss")
//       let t2 = moment(end,"hh:mm:ss")
//       let diff = moment(t2.diff(t1)).format("ss")
//       duration+=parseInt(diff)
//     }
//     let ratio = duration/(4*60)
//     console.log("ratio: ",ratio)
//     return callBack(ratio)
    
//   }).catch(err => console.log("error: ",err))
// }

module.exports = {
  getOneTableStatus
}
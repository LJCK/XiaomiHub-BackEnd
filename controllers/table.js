const Influx = require('influx');

// const client = new Influx.InfluxDB({
//   database: "homeassistant",
//   host: "192.168.197.48",
//   port:8086,
//   username: "admin",
//   password: "admin"
// });


const getOneTableStatus = (req,res)=>{
  const id = req.query.id;
  const status = req.query.status
  let count = 0
  switch (status){
    case "unoccupied":
      count = check_sensor(id,10)
      if (count >4){
        res.send(table_obj_to_json(id,"occupied"))
      }else{
        res.send(table_obj_to_json(id,"unoccupied"))
      }
      break
    case "occupied":
      count = check_sensor(id,60)
      if (count >10){
        res.send(table_obj_to_json(id,"occupied"))
      }else{
        res.send(table_obj_to_json(id,"unoccupied"))
      }
      break
    default:
      res.status(400).send("Wrong table status passed over.")
      break
    }
}

const check_sensor = (id,time)=>{
  return 5
}

const table_obj_to_json = (id, status)=>{
  const data = {
    "table": id,
    "status": status
  }
  return data
}

// const check_sensor=(id,time)=>{
//   let count = 0
//   client.query(`SELECT distinct("value") AS "distinct_value" FROM "homeassistant"."autogen"."state" WHERE time < now() AND time>= (now()-${time}m) AND "entity_id"='vibration_sensor_${id}'GROUP BY time(1s) FILL(null)`).then(results => {

//     console.log(results)

//     results.forEach(element => {
//       if (element.distinct_value === 1){
//         count++
//       }

//     });
//     return count
    
//   }).catch(err => console.log("error: ",err))
// }

module.exports = {
  getOneTableStatus
}
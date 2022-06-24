const table_obj_to_json = (id, status)=>{
  const data = {
    "table": id,
    "status": status
  }
  return data
}

module.exports = {
  table_obj_to_json
}
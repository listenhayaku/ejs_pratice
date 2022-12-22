const mysql = require("mysql");
const { resolveInclude } = require("ejs");
const yaml = require("./yaml");
const child_process = require("child_process");
const { runInContext } = require("vm");


var get_mysql = exports.get_mysql = function(sql,callback){
  //console.log("(debug)[get_mysql()]sql = ",sql);
  var sql_login = yaml.parser('./sql_login.yaml');
  //console.log("(debug)[get_mysql]ori sql:",sql);
  sql = sql.replace("{database}",sql_login.database).replace("{table}",sql_login.table);
  //console.log("(debug)[get_mysql]new sql:",sql);
  var con = mysql.createConnection({
    host:sql_login.host,
    user:sql_login.user,
    password:sql_login.password,
    database:sql_login.database
  });
  con.connect(function(err){
    if(err) return false;
    con.query(sql,function(err,result){
      try{
        if(err) throw err;
        return callback(result);
      }
      catch(e){
        console.log("(debug)[get_mysql.query]catch e = "+e);
        return callback(false);
      } 
    });
    con.end(function(err){
      if(err) console.log("(error)[mylib.end]err:"+err);
    });
  });
}
var communicator = exports.communicator = function(ip,port,data){
  return new Promise((reslove,rejects)=>{     
    //console.log("(debug)[mylib][communicator]ip",ip,"port",port,"data",data);
    const pyProcess = child_process.spawn("python3",["-u","./lib/communicator.py",ip,port,data != undefined ? data : ""]);
    pyProcess.stdout.on("data",(data) =>{
        //console.log(data.toString());
    });
    pyProcess.stderr.on("data",(data) =>{
      //console.log("[communicator.js]error:"+data.toString());
      //console.log("[communicator]cannot connect");
    });
    pyProcess.on("close",(code)=>{
      var sql; 
      if(code == 1){
        sql = "UPDATE {database}.{table} SET status="+0+" WHERE ip=\""+ip+"\" and port="+port+";";
        get_mysql(sql,()=>{});
      }
      else if(code == 0){
        sql = "UPDATE {database}.{table} SET status="+1+" WHERE ip=\""+ip+"\" and port="+port+";";
        get_mysql(sql,()=>{});
      }
      else{
        console.log("[mylib][communicator]commnicator return value is not 1 or 0");
      }      
    });
  });
}
exports.monitor = function(){
  var sql = "SELECT * from {database}.{table};";
  get_mysql(sql,async function(result){
    async function run(para){
      //console.log("(debug)[mylib][monitor][run]:",para.id);
      var ret = await communicator(para.ip,para.port,"auto detect script");
      //console.log("(debug)[mylib][monitor]done",ret);
    }
    for(var i = 0;i < result.length;i++){
      run(result[i]);
    }
  });
}



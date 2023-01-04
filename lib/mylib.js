const mysql = require("mysql");
const { resolveInclude } = require("ejs");
const yaml = require("./yaml");
const child_process = require("child_process");
const { runInContext } = require("vm");
const { connect } = require("http2");
const { rejects } = require("assert");

let connecting = new Array();

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
var communicator = exports.communicator = function(ip,port,data,send = false){
  //console.log("(debug)[mylib][communicator]parameter:",data);
  //console.group("(debug)[mylib][communicator]start connecting.length",connecting.length);
  //搜尋看看是否已經在陣列裡面
  //console.group("(debug)[mylib][communicator]");
  //for(var i = 0;i < connecting.length;i++) console.log(connecting[i].ip,connecting[i].port);
  for(var i = 0;i < connecting.length;i++){
    if((connecting[i].ip == ip) && (connecting[i].port == port))
    {
      pyProcess = connecting[i].pyProcess;
      pyProcess.stdin.write(data);
      pyProcess.stdin.write("\r\n"); //要補給它enter
      //pyProcess.stdin.end();
      return true;
      /*
      //console.log("ip",ip,"port",port,"is in the list",connecting[i].pyProcess.pid);
      return new Promise((reslove,rejects)=>{
        console.log("(debug)[mylib]have connecting",new Date());
        //console.group("(debug)[mylib][communicator]");
        //console.log("start:",new Date())
        pyProcess = connecting[i].pyProcess;
        pyProcess.stdin.write(data);
        pyProcess.stdin.end();
        //console.log("end:",new Date())
        //console.groupEnd();
        reslove(true);
      });
      */
    }
  }
  //console.groupEnd();
  //搜尋看看是否已經在陣列裡面

  function updatedb(status = 0){
    var sql = "UPDATE {database}.{table} SET status="+status+" WHERE ip=\""+ip+"\" and port="+port+";";
    get_mysql(sql,()=>{});
  }
  return new Promise((reslove,rejects)=>{ 
    //console.log("(debug)[mylib][communicator]entering promise")
    //console.log("(debug)[mylib][communicator]ip",ip,"port",port,"data",data);
    const pyProcess = child_process.spawn("python3",["-u","./lib/communicator.py",ip,port,data != undefined ? data : "",send]);
    //console.log("(debug)][mylib]pyPorcess:",pyProcess.pid);
    var start = new Date();
    pyProcess.stdout.on("data",(data) =>{
        if(data.toString() == "[communicator.py]successful\n"){
          console.log("(debug)[mylib][communicator]py successful",ip,",",port,"pid:",pyProcess.pid);
          updatedb(1);/*
          pyProcess.stdin.write("Hsia ho-ching");
          pyProcess.stdin.end();*/
          connecting.push({ip,port,pyProcess});
          reslove(pyProcess);
        }
        else if(data.toString().includes("(debug)[communicator.py][inputFunc]tempStr:")){
          console.log(data.toString());
        }
    });
    pyProcess.stderr.on("data",(data) =>{
      //console.log("[communicator.js]error:"+data.toString());
      //console.log("[communicator]cannot connect ip",ip,"port",port);
    });
    pyProcess.on("close",(code)=>{
      var endtime = new Date();
      //console.log("(debug)[mylib][communicator]close:",ip,",",port,"startime",start,"endtime",endtime,"interval",endtime - start);
      updatedb(0);
      //移除已下線的節點
      for(var i = 0;i < connecting.length;i++) if((connecting[i].ip == ip) && (connecting[i].port == port)) connecting.splice(i,1);
      //移除已下線的節點
    });
    pyProcess.on("spawn",(code) =>{
      console.log("(debug)[communicator]spawn");
    });
  });
}
exports.monitor = function(){
  var sql = "SELECT * from {database}.{table};";
  get_mysql(sql,async function(result){
    async function run(para){
      //console.log("(debug)[mylib][monitor][run]:",para.id);
      var ret = await communicator(para.ip,para.port,"auto detect script",false);
      //console.log("(debug)[mylib][monitor]done",ret);
    }
    for(var i = 0;i < result.length;i++){
      if(result[i].status==0) run(result[i]);
    }
  });
}



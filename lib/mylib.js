const crypto = require("crypto");
const mysql = require("mysql");
const { resolveInclude } = require("ejs");
const yaml = require("./yaml");
const child_process = require("child_process");
const fs = require("fs");
const csv = require("fast-csv");
const { runInContext } = require("vm");
const { connect } = require("http2");
const { rejects } = require("assert");
const { resolve } = require("path");
const { Console, time } = require("console");


let connecting = new Array(); //{ip,port,pyProcess}
let timer = new Array(); //{ip,port,timer}


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

var get_mysql_ret = exports.get_mysql_ret = async function(sql){
  let ret;
  //console.log("(debug)[get_mysql()]sql = ",sql);
  var sql_login = yaml.parser('./sql_login.yaml');
  //console.group();
  //console.log("(debug)[get_mysql]ori sql:",sql);
  sql = sql.replace("{database}",sql_login.database).replace("{table}",sql_login.table);
  //console.log("(debug)[get_mysql]new sql:",sql);
  //console.groupEnd();
  var con = mysql.createConnection({
    host:sql_login.host,
    user:sql_login.user,
    password:sql_login.password,
    database:sql_login.database
  });

  return new Promise((resolve,rejects) => {
    con.connect(function(err){
      if(err) return false;
      ret = con.query(sql,function(err,result){
        try{
          if(err) throw err;
          resolve(result);
        }
        catch(e){
          console.log("(debug)[get_mysql.query]catch e = "+e);
          ret = false;
          return false;
        }
      });
      ret = con.end(function(err){
        if(err) console.log("(error)[mylib.end]err:"+err);
      });
    });
  });
}

var communicator = exports.communicator = function(ip,port,data,send = false){
  

  //搜尋看看是否已經在陣列裡面
  for(var i = 0;i < connecting.length;i++){
    if((connecting[i].ip == ip) && (connecting[i].port == port))
    {
      console.log("(debug)[mylib.communicator]in connecting list\n\tip:",ip,"\n\tport:",port);
    
      pyProcess = connecting[i].pyProcess;
      pyProcess.stdin.write(data);
      pyProcess.stdin.write("\r\n"); //要補給它enter
      return true;
    }
  }
  //console.groupEnd();
  //搜尋看看是否已經在陣列裡面

  async function updatedb(status = 0){
    var sql = "UPDATE {database}.{table} SET status="+status+" WHERE ip=\""+ip+"\" and port="+port+";";
    await get_mysql_ret(sql);
  }
  return new Promise((reslove,rejects)=>{ 
    const pyProcess = child_process.spawn("python3",["-u","./lib/communicator.py",ip,port,data != undefined ? data : "",send]);

    pyProcess.stdout.on("data",(data) =>{
        console.log(data.toString());
        if(data.toString().includes("[communicator.py]successful\n")){
          updatedb(1);
          //require data
          var temptimer = setInterval(() => {
            pyProcess.stdin.write("require//test");
            pyProcess.stdin.write("\r\n");
          },5000)
          connecting.push({ip,port,pyProcess});
          timer.push({ip,port,temptimer});
          reslove(pyProcess);
        }
        else if(data.toString().includes("ignore//")){  //node傳來要隔離誰
          try{
            var dataline = data.toString().split("\n")[0];
            console.log("(debug)[mylib][communicator]data.toString():",data.toString());
            var isolate_ip = dataline.toString().split("//")[1].split(":")[0];
            var isolate_port = dataline.toString().split("//")[1].split(":")[1];

            async function test(){
              var sql = "update {database}.{table} set isolating=\""+isolate_ip+":"+isolate_port+"\" where ip=\""+ip+"\"&& port="+port+";";
              console.log(await get_mysql_ret(sql));
            }
            test();
          }
          catch(e){
            if(e) throw e;
          }
        }

        else{
          //console.log("(debug)[mylib.js][communicator]pyProcess.stdout.on:",data.toString());
        }
    });
    pyProcess.stderr.on("data",(data) =>{
      console.log("(error)[communicator.py]stderr:",data.toString());
    });
    pyProcess.on("close",(code)=>{
      var endtime = new Date();
      //console.log("(debug)[mylib][communicator]close:",ip,",",port,"startime",start,"endtime",endtime,"interval",endtime - start);
      updatedb(0);
      //移除已下線的節點
      for(var i = 0;i < connecting.length;i++) if((connecting[i].ip == ip) && (connecting[i].port == port)){
        connecting.splice(i,1);
        var sql = "update {database}.{table} set isolating=NULL;";
        get_mysql_ret(sql);
      }
      //移除已下線的節點
      //移除已下線的timer
      for(var i = 0;i < timer.length;i++) if((timer[i].ip == ip) && (timer[i].port == port)){
        clearInterval(timer[i]["temptimer"]);
        timer.splice(i,1);
      }
      //移除已下線的timer
    });
    pyProcess.on("spawn",(code) =>{
      console.log("(debug)[communicator]spawn");
    });
  });
}
exports.monitor = function(){
  //console.log("(debug)[mylib][monitor]start",new Date());
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

exports.sha256 = function(plain){
  
  return crypto.createHash('sha256').update(plain).digest('base64');
}

exports.ParseCsv = async function ParseCsv(FileName = ""){
  if(FileName == "") return undefined;
  return new Promise((resolve,rejects) => {
    var ret = [];
    fs.createReadStream(FileName)
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => ret.push(row))
    .on('end', ()=>{resolve(ret)});
    return ret;
  });
};

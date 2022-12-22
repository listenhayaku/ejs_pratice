//=========================================================================
//declare
const url = require("url");
const fs = require("fs");
const child_process = require("child_process");
// EJS 核心
const express = require("express");
const engine = require("ejs-locals");
app = express();
app.engine("ejs", engine);
//mysql
const { resolveObjectURL } = require("buffer");
//mylib
const mylib = require("./lib/mylib");
const api = require("./api");
const communicator = require("./lib/communicator");
const { emitWarning } = require("process");
//declare
//===========================================================================
//
function main(){
  // 讀取 EJS 檔案位置
  app.set("views", "./views");
  // 用 EJS 引擎跑模板
  app.set("view engine", "ejs");
  app.use('/static', express.static(__dirname + '/public'));

  app.get("/", (req, res) => {
      res.render("index",{"title":"Home","description":"test description"});
  });
  app.get("/Drone_Status", (req, res) => {
    var q = url.parse(req.url,true).search;
    if(q != null){
      async function connect_to_node(){
        q = url.parse(req.url,true).query;
        const ret = await communicator.main(q.ip,q.port,q.Drone_Block_Input);
        console.log("(debug)[server.js][main]ret:",ret);
        var sql;
        if(ret == 1){
          sql = "UPDATE project.drone_info SET status="+0+" WHERE id="+q.id+";";
        }
        else if(ret == 0){
          sql = "UPDATE project.drone_info SET status="+1+" WHERE id="+q.id+";";
        }
        else{
          console.log("[server.js][main][Drone_Status]commnicator return value is not 1 or 0");
        }
        mylib.get_mysql(sql,function(result){
          //console.log("(debug)[server.js][main]sql = ",sql);
          //console.log("(debug)[server.js][main]sql result = ",result);
        });
      }
      connect_to_node();
    }
    mylib.get_mysql("SELECT * FROM project.drone_info;",function(result){
      res.render("Drone_Status",{"title":"Drone_Status","amount":result.length,"result":result,});
    });
    
  });
  app.get("/Chart", (req, res) => {
    res.render("Chart",{"title":"Chart","test":87,});
  });
  app.get("/Test", (req, res) => {
    res.render("index",{"title":"Home","description":"test description"});
  });
  app.get("/create_node", (req, res) => {
    var q = url.parse(req.url,true).query;
    if(q.id == undefined || q.id == "" || q.ip == undefined || q.ip == "" || q.port == undefined || q.port == "" || q.name == undefined || q.name == "" || q.description == undefined || q.description == ""){
      res.render("create_node",{"title":"create_node",});
    }
    else{
      mylib.get_mysql("INSERT INTO drone_info VALUES( "+q.id+",\""+q.ip+"\","+q.port+",\""+q.name+"\",\""+q.description+"\");",function(result){
        console.log("(debug)[create_node]INSERT sql:"+result);
        if(result == false){
          res.redirect("/Drone_Status");
        }
        else{
          res.redirect("/Drone_Status");
        }
      });     
    }
  });
  app.get("/show_log",(req ,res) => {
    var q = url.parse(req.url,true).search;
    if(q == null){
      res.render("show_log",{"title":"show log","number":"",})
    }
    else{
      var number = q.replace("?","");
      res.render("show_log",{"title":"show log","number":number,})
    }
  });

  //api
  app.get("/Ajax",(req,res) =>{
    var q = url.parse(req.url,true);
    console.log("(debug)[Ajaxtest]"+" "+q.search);
    if(q.search == "?Hello"){
      res.writeHead(200,{"Content-Type":"text/html"});
      res.write("Hello Welcome to My Api");
      res.end();
    }
    else if(q.search == "?Drone_Status"){
      mylib.get_mysql("SELECT * FROM project.drone_info",function(result){
        var write = result;
        res.write(JSON.stringify(result));
        res.end();
      })
      //res.json({"Drone_Status":[0,1,1,0,1,1,1]});
    }
    else if(q.search == "?show_log"){
      res.writeHead(200,{"Content-Type":"text/html"});
      fs.readFile("/home/user/ejs_pratice/blockchain.log",function(err,data){
        console.log("(debug)[Ajax?show_log]"+data);
        res.write(data);
        res.end();
      });
    }
    else if(q.search == "?ip"){
      res.writeHead(200,{"Content-Type":"text/html"});
      var ip = req.socket.remoteAddress;
      res.write(ip);
      res.end();
    }
  });
  //
  app.listen(8080);
}

main();
api.api();

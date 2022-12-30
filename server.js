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
const { emitWarning } = require("process");
const { render } = require("ejs");
const { post } = require("jquery");
//declare
//===========================================================================
//global

//global
//===========================================================================
function main(){
  // 讀取 EJS 檔案位置
  app.set("views", "./views");
  // 用 EJS 引擎跑模板
  app.set("view engine", "ejs");
  app.use('/static', express.static(__dirname + '/public'));
  app.use(express.json());
  app.use(express.urlencoded({extended:true}));

  app.get("/", (req, res) => {
      res.render("index",{"title":"Home","description":"test description"});
  });
  app.get("/Drone_Status",async (req, res) => {
    var q = url.parse(req.url,true).search;
    if(q != null){
      async function connect_to_node(){
        q = url.parse(req.url,true).query;
        //console.group("(debug)[server][Drone_Status]");
        //console.log("start:",new Date());
        await mylib.communicator(q.ip,q.port,q.Drone_Block_Input,true);
        //console.log("end:",new Date())
        //console.groupEnd();
      }
      connect_to_node();
    }
    mylib.get_mysql("SELECT * FROM {database}.{table};",function(result){
      res.render("Drone_Status",{"title":"Drone_Status","amount":result.length,"result":result,});
    });
  });
  app.post("/Drone_Status", (req, res) => {
    console.log("(debug)[server.js][Drone_Status.post]req.body",req.body);
    if(req.body.Drone_Block_Input != undefined) mylib.communicator(req.body.ip,req.body.port,req.body.Drone_Block_Input,false);
    res.redirect("/Drone_Status");
  });
  app.get("/Chart", (req, res) => {
    res.render("Chart",{"title":"Chart","test":87,});
  });
  app.get("/Test", (req, res) => {
    res.render("Test",{"title":"Home","description":"test description"});
  });
  app.get("/create_node", (req, res) => {
    console.log("(debug)[server.js][create_node.get]");
    res.render("create_node",{"title":"create_node",});
    /*
    var s = url.parse(req.url,true).search;
    if(s == undefined){
      res.render("create_node",{"title":"create_node",});
    }
    /*
    else{
      var q = url.parse(req.url,true).query;
      if(false){

      }
      else{
        q.id = parseInt(q.id,10);
        q.port = parseInt(q.port,10);
        //if(isNaN(q.id) || isNaN(q.port)) res.render("create_node",{"title":"create_node",});
        var sql = "INSERT INTO {table} VALUES( "+q.id+",\""+q.ip+"\","+q.port+",\""+q.name+"\",\""+q.description+"\",0);";
        console.group("(debug)[server.js][create_node]");
        console.log("sql:",sql);
        console.log("q.port:",q.port,isNaN(q.port));
        console.groupEnd();
        mylib.get_mysql(sql,function(result){
          console.log("(debug)[create_node]INSERT sql:"+result);
          if(result == false){
            //res.redirect("/Drone_Status");
            res.render("create_node",{"title":"create_node",});
          }
          else{
            res.redirect("/Drone_Status");
          }
        });     
      }    
    }
    */
  });
  app.post("/create_node", (req, res) => {
    /*
    console.group("(debug)[server.js][create_node.post]");
    console.log(req.body.id);
    console.log(req.body.ip);
    console.log(req.body.port);
    console.log(req.body.name);
    console.log(req.body.description);
    console.groupEnd();
    */

    var id = parseInt(req.body.id,10);
    var ip = req.body.ip;
    var port = parseInt(req.body.port,10);
    var name = req.body.name;
    var description = req.body.description;
    var postObj = {
      id,
      ip,
      port,
      name,
      description
    }
    //console.log("(debug)[server.js][create_node.post]postobj.length:");
    //parseInt到無法轉換的字串也會便NaN
    if(isNaN(postObj.id) || isNaN(postObj.port) || ip == "" || ip.includes("\"") || name == "" || name.includes("\"") || description.includes("\"")) res.redirect("/create_node");
    else{
      var sql = "INSERT INTO {table} VALUES( "+postObj.id+",\""+postObj.ip+"\","+postObj.port+",\""+postObj.name+"\",\""+postObj.description+"\",0);";
      console.log(sql);
      mylib.get_mysql(sql,function(result){
        if(result == false){
          res.render("create_node",{"title":"create_node",});
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
      mylib.get_mysql("SELECT * FROM {database}.{table}",function(result){
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

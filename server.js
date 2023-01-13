//=========================================================================
//declare
const url = require("url");
const fs = require("fs");
const child_process = require("child_process");
const jwt = require("jsonwebtoken");
const http = require("http");
const https = require("https");
// EJS 核心
const express = require("express");
const engine = require("ejs-locals");
const cookieParser = require("cookie-parser");

//mysql
const { resolveObjectURL } = require("buffer");
//mylib
const mylib = require("./lib/mylib");
const api = require("./api");
const { emitWarning } = require("process");
const { render } = require("ejs");
const { post } = require("jquery");
const { decode } = require("punycode");
const e = require("express");
//declare
//===========================================================================
//global

//global
//===========================================================================
function main(){
  app = express();

  app.engine("ejs", engine);
  // 讀取 EJS 檔案位置
  app.set("views", "./views");
  // 用 EJS 引擎跑模板
  app.set("view engine", "ejs");
  app.use('/static', express.static(__dirname + '/public'));
  app.use(express.json());
  app.use(express.urlencoded({extended:true}));
  app.use(cookieParser());

  app.get("*",(req, res ,next) => {
    if(req.protocol == "http") res.redirect("https://"+req.headers.host); //redirect http to https
    function verify_fail(){
      console.log("verify fail1");
      res.redirect("/login");
    }
    if(req.url != "/login"){
      var token = jwt.verify(req.cookies.token,"testsecret",function(err,result){return result});

      if(token != undefined){
        mylib.get_mysql("select * from project.user_info where user_id="+token.id+";",function(result){
          if(result[0].password == token.password){ //result[0] cause id number is unique
            var now = Math.floor(Date.now()/1000);  //https://stackoverflow.com/questions/13242828/javascript-gettime-to-10-digits-only
            if(now < token.exp) next(); //check token exp
            else verify_fail();
          }
          else{
            verify_fail();
          }
        });
      }
      else{
        verify_fail();
      }
    }
    else next();
  });
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

    if(req.body.Drone_Block_Input != undefined && req.body.Drone_Block_Input != "" && req.body.type != undefined && req.body.type != ""){
      if(req.body.type == "ascii"){
        mylib.communicator(req.body.ip,req.body.port,req.body.Drone_Block_Input,false);
      }
      else if(req.body.type == "hex"){
        function parseHexString(str){ 
          var result = [];
          while (str.length >= 2) { 
              result.push(parseInt(str.substring(0, 2), 16));
              str = str.substring(2, str.length);
          }
          var buffer = Buffer.from(result);
          return buffer;
        }
        var temp = parseHexString(req.body.Drone_Block_Input);
        
        mylib.communicator(req.body.ip,req.body.port,temp,false);
      }
      else if(req.body.type == "b64"){
        console.log("(debug)[server.js]b64 function is developing");
      }


      //mylib.communicator(req.body.ip,req.body.port,req.body.Drone_Block_Input,false);

    }else console.log("(deubg)[server.js]Drone_Status.post]Drone_Block_Input no input or no type");
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
  app.get("/login", (req, res) => {
    res.clearCookie("token");
    res.render("login",{"title":"login",});
  });
  app.post("/login", (req, res) => {
    mylib.get_mysql("SELECT * FROM project.user_info",function(result){
      for(var i = 0;i < result.length;i++){
        var hash_password = mylib.sha256(req.body.password);
        if(result[i].username == req.body.username && result[i].password == hash_password){
          var payload = {
            "id":result[0].user_id,
            "password":hash_password
          }
          var exp;
          if(result[i].user_id == "0"){ //give admin more time
            exp = 60*60;
          }
          else{
            exp = 10;
          }
          console.log("login successful");
          res.cookie("token",jwt.sign(payload,"testsecret",{expiresIn: exp}));
          res.redirect("/");
        }
        else{
          console.log("(debug)[server][login.post]login fail");
          res.clearCookie("test");
          res.redirect("/login"); 
        }
      }
    });
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
  function listen(app){
    //app.set("port",8080);
    var options = {
      key:fs.readFileSync('./keys/server.key'),
      cert:fs.readFileSync('./keys/server.crt')
    }
    var httpServer = http.createServer(app);
    var httpsServer = https.createServer(options,app);
    httpServer.listen(80);
    httpsServer.listen(443);
  }
  listen(app);
}

main();

api.api();

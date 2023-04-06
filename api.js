const fs = require("fs");
const https = require("https");

//import express 和 ws 套件
const express = require("express");
//mysql
const mysql = require("mysql");
const { resolveInclude } = require("ejs");

const mylib = require("./lib/mylib");

exports.api = function(){
  //import express 和 ws 套件
  const SocketServer = require('ws').Server

  //指定開啟的 port
  const PORT = 3000

  //創建 express 的物件，並綁定及監聽 3000 port ，且設定開啟後在 console 中提示
  var options = { 
    //https://stackoverflow.com/questions/46175397/https-server-with-websockets-on-node-js
    //貌似不需要pem
    /*key:fs.readFileSync('./keys/key.pem'),
    cert:fs.readFileSync('./keys/crt.pem')*/
    key:fs.readFileSync('./keys/server.key'),
    cert:fs.readFileSync('./keys/server.crt')
  }
  var server = https.createServer(options,server);
  server.listen(PORT);

  //將 express 交給 SocketServer 開啟 WebSocket 的服務
  const wss = new SocketServer({ server })

  //當 WebSocket 從外部連結時執行

  wss.on('connection', ws => {
      console.log('[api]Client connected')
      let monitorTimer;
      let sendNowTimer;
      let chartTimer;

      //對 message 設定監聽，接收從 Client 發送的訊息
      ws.on('message', data => {
        //console.log("(debug)[api][ws.on]message event data:",data.toString());
        if(data.toString() == "Drone_Status"){
          //console.log("(debug)[api][ws.on]event message data.toString() == Drone_Status");
          let clients = wss.clients;

          clients.forEach(client => {
            mylib.get_mysql("SELECT * FROM {database}.{table}",function(result){
              client.send(JSON.stringify(result));
            });
          });

          sendNowTimer = setInterval(()=>{
            clients.forEach(client => {
              mylib.get_mysql("SELECT * FROM {database}.{table}",function(result){
                client.send(JSON.stringify(result));
              });
            });
          },500);
          
          //開啟monitor監控
          //monitor改道這裡不知道會不會有問題，例如很多連線的時候會怎開timer？
          //突然想到其實讓它一直執行也沒關係，不過目前不是在Drone_Status頁面的話就用不到，之後在評估看看有沒有其他東西會用到，夠多的話就把它移到直接執行
          mylib.monitor();
          monitorTimer = setInterval(()=>mylib.monitor(),3000);
        }
        else if(data.toString() == "Chart"){
          async function Chart(){
            ws.send("Hello");
            var sql_data = await mylib.get_mysql_ret("select * from {database}.{table};");
            
            var data = [];
            console.log("(debug)[api][Chart]sql_data.length:",sql_data.length);
            for(var i = 0;i < sql_data.length;i++){
              var tempobj = {"gps":undefined,"bat":undefined};
              var FileName = "./public/file/log/gps/gps_"+sql_data[i].ip+":"+sql_data[i].port+".csv";
              if(fs.existsSync(FileName)){
                tempobj["gps"] = await mylib.ParseCsv(FileName); 
              }
              FileName = "./public/file/log/bat/bat_"+sql_data[i].ip+":"+sql_data[i].port+".csv";
              if(fs.existsSync(FileName)){
                tempobj["bat"] = await mylib.ParseCsv(FileName); 
              }

              data.push({"ip":sql_data[i].ip,"port":sql_data[i].port,"data":tempobj});
            }

            async function send(){
              ws.send(JSON.stringify(data));
            }
            chartTimer = setInterval(send,1000);
          }
          Chart();
        }
        else if(data.toString().includes("pauseButton_onclick")){
          var info = JSON.parse(data.toString().split("\n")[1]);
          //console.log(info);
          //console.log(JSON.parse(info));
          //console.log("(debug)[api]"+parseInt(data.toString().split(":")[1],10));
          mylib.communicator(info.ip,info.port,"pause",true);
        }
        else{
          console.log("(debug)[api][ws.on]event mseeage else data:",data.toString());
        }
      })

      ws.on('close', () => {
          clearInterval(sendNowTimer);
          clearInterval(monitorTimer);
          clearInterval(chartTimer);
          console.log('[api]Close connected')
      })
  })
}

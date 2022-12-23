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
  const server = express()
      .listen(PORT, () => console.log(`[api]Listening on ${PORT}`))

  //將 express 交給 SocketServer 開啟 WebSocket 的服務
  const wss = new SocketServer({ server })

  //當 WebSocket 從外部連結時執行


  wss.on('connection', ws => {
      console.log('[api]Client connected')

      let clients = wss.clients;

      clients.forEach(client => {
        mylib.get_mysql("SELECT * FROM {database}.{table}",function(result){
          client.send(JSON.stringify(result));
        });
      });
      
      const sendNowTime = setInterval(()=>{
        clients.forEach(client => {
          mylib.get_mysql("SELECT * FROM {database}.{table}",function(result){
            client.send(JSON.stringify(result));
          });
        });
      },500);
      
      //monitor改道這裡不知道會不會有問題，例如很多連線的時候會怎開timer？
      //突然想到其實讓它一直執行也沒關係，不過目前不是在Drone_Status頁面的話就用不到，之後在評估看看有沒有其他東西會用到，夠多的話就把它移到直接執行
      mylib.monitor();
      const monitorTimer = setInterval(()=>mylib.monitor(),5000);

      //對 message 設定監聽，接收從 Client 發送的訊息
      ws.on('message', data => {
          //data 為 Client 發送的訊息，現在將訊息原封不動發送出去
          /*console.log("(debug)[ws.on()]:"+data)
          ws.send(data)*/
          /*
          if(data == "Drone_Status"){
            clients.forEach(client => {
              mylib.get_mysql("SELECT * FROM {database}.{table}",function(result){
                client.send(JSON.stringify(result));
              })
            });
          }
          */
      })

      ws.on('close', () => {
          clearInterval(sendNowTime);
          clearInterval(monitorTimer);
          console.log('[api]Close connected')
      })
  })
}

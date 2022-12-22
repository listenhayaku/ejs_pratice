/*
const { rejects } = require("assert");
const child_process = require("child_process");
const { resolve } = require("path");
exports.main = function(ip,port,data){
    return new Promise((reslove,rejects)=>{
        const pyProcess = child_process.spawn("python3",["-u","./lib/communicator.py",ip,port,data != undefined ? data : ""]);
        pyProcess.stdout.on("data",(data) =>{
            console.log(data.toString());
        });
        pyProcess.stderr.on("data",(data) =>{
            console.log("[communicator.js]error:"+data.toString());
        });
        pyProcess.on("close",(code)=>{
            if(code == 1){
                reslove(1);
            }
            else{
                reslove(0);
            }            
            });
        });
}
*/
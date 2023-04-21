//const { get } = require("jquery");

let s = location.pathname;


function api(target = "Hello") {
    var scoreresult;    //變數明是直接抄學長mvc的
    var options = {
        type: "GET",
        url: "/Ajax?"+target,
        data: {},
        async: false,
        success: function (score) {
            scoreresult = score;
        },
        error:function(err){console.log(err)}
    };
    $.ajax(options);
    return scoreresult;
}

function post(url,data){
    var retResult;    //變數明是直接抄學長mvc的
    var options = {
        type: "POST",
        url: url,
        data: data,
        async: false,
        success: function (result) {
            retResult = result;
        },
        error:function(err){console.log(err)}
    };
    $.ajax(options);
    return retResult
}

if(s == "/Drone_Status"){
    function change_encode(type,id){
        console.log("(debug)[script.js][test]start",type);
        var drop_down_menu_list = document.querySelectorAll("[id=Drone_Block_"+id+"] form .drop_down_menu_list ul li a");
        var submitButton = document.querySelector("[id=Drone_Block_"+id+"] form input[type=button]");
        var temp = submitButton.value;
        submitButton.value = type;
        for(var i = 0;i < drop_down_menu_list.length;i++){
            if(drop_down_menu_list[i].textContent == type){
                drop_down_menu_list[i].textContent = temp;
                drop_down_menu_list[i].href="javascript:change_encode('"+temp+"',"+id+")";
            }
        }
    }
    function connect_to_api(data = ""){
        var Drone_Status_Sign = document.querySelectorAll("[id^=\"Drone_Status_Sign_\"");
        var Drone_Block_Input = document.querySelectorAll("[id^=\"Drone_Block_Input_\"");
    

        var ws = new WebSocket('wss://'+self.location.hostname+":3000");

        ws.onopen = () => {
            console.log('open connection');
            ws.send(data);
        }
        
        ws.onclose = () => {
            console.log('close connection');
        }
        
        //接收 Server 發送的訊息
        ws.onmessage = event => {
            if(event.data instanceof Blob){
                reader = new FileReader();
                reader.onload = () =>{
                    console.log(reader.result);
                }
                reader.readAsText(event.data);
            }
            else{
                //console.log("(debug)[onmessage]not blob:"+event.data);
                Drone_Status = JSON.parse(event.data);
                for(var i = 0;i < Drone_Status.length;i++){
                    //燈號部份
                    if(Drone_Status[i]["status"] == 1){
                        Drone_Status_Sign[i].textContent="online";
                        Drone_Status_Sign[i].id="Drone_Status_Sign_Online_"+i;
                        Drone_Block_Input[i].disabled="";
                        document.getElementById("pause_"+i).style="";
                    }
                    else{
                        Drone_Status_Sign[i].textContent="offline";
                        Drone_Status_Sign[i].id="Drone_Status_Sign_Offline_"+i;
                        Drone_Block_Input[i].disabled="disabled";
                        document.getElementById("pause_"+i).style="display: none;";
                    }
                    //隔離部份
                    if(Drone_Status[i]["isolating"] != null){
                        console.log("Drone_Status[i][isolating]",Drone_Status[i]["isolating"]);
                        var tempip = Drone_Status[i]["isolating"].split(":")[0];
                        var tempport = Drone_Status[i]["isolating"].split(":")[1];
                        for(var j = 0;j < Drone_Status.length;j++){
                            if(Drone_Status[j]["ip"] == tempip && Drone_Status[j]["port"] == tempport){
                                Isolatenode(i,j);
                            }
                        }
                    }
                }
            }
        }
        return ws;
    }
    function Isolatenode(nodeid,targetid){
        var tempelement = document.createElement("p");
        var isolatedip = document.querySelectorAll("[id=Drone_Block_"+targetid+"] .top .right p")[0].textContent;
        var isolatedport = document.querySelectorAll("[id=Drone_Block_"+targetid+"] .top .right p")[1].textContent;

        lIsolatednode.push({"node":nodeid,"target":targetid});
        document.getElementById("Drone_Block_"+targetid).style = "background-color: red;";
        
        tempelement.textContent = "isolated node:" + isolatedip + ":" + isolatedport;
        tempelement.classList.add("hiddenAni");
        document.getElementById("detail_infoFrame_"+nodeid).appendChild(tempelement);
    }

    var ws = connect_to_api("Drone_Status");

    var show_log = document.querySelectorAll("[id^=\"show_log_\"");
    var create_node = document.getElementById("create_node");
    var pauseButton = document.querySelectorAll("[id^=\"pause_\"");
    var submitButton = document.querySelectorAll("[id^=Drone_Block_] form input[type=button]");
    var detailButton = document.querySelectorAll("[id^=detail_infoButton_]");
    var LngButton = document.querySelectorAll("[id^=Lng_Button_]");
    var LatButton = document.querySelectorAll("[id^=Lat_Button_]");
    var IsolatedButton = document.querySelectorAll("[id^=IsolatedNode_]");

    var lIsolatednode = []; //[{"node":0,"target":13},{}...]
    var Drone_Status;

    for(let i = 0;i < show_log.length;i++){
        show_log[i].onclick = function(){
            location.href="/show_log?"+i;
        };
    };    
    for(let i = 0;i < submitButton.length;i++){
        submitButton[i].onclick = function(){
            console.log("test");
            id = document.querySelector("[id=Drone_Block_"+i+"] form [name=id]").value;
            ip = document.querySelector("[id=Drone_Block_"+i+"] form [name=ip]").value;
            port = document.querySelector("[id=Drone_Block_"+i+"] form [name=port]").value;
            name = document.querySelector("[id=Drone_Block_"+i+"] form [name=name]").value;
            description = document.querySelector("[id=Drone_Block_"+i+"] form [name=description]").value;
            Drone_Block_Input = document.getElementById("Drone_Block_Input_"+i).value;
            type = submitButton[i].value;
            document.getElementById("Drone_Block_Input_"+i).value = null;
            var tempObj = {
                id,
                ip,
                port,
                name,
                description,
                Drone_Block_Input,
                type
            }
            if(document.getElementById("Drone_Block_Input_"+i).disabled != true) post("Drone_Status",tempObj);
        };
    };
    create_node.onclick = function(){
        location.href="/create_node";
    };
      //i modified the query to post,this will be invalid now
    for(let i = 0;i < pauseButton.length;i++){
        pauseButton[i].onclick = function(){
            var id = document.querySelector("[id=Drone_Block_"+i+"] .top form input[name=id]").value;
            var ip = document.querySelector("[id=Drone_Block_"+i+"] .top form input[name=ip]").value;
            var port = document.querySelector("[id=Drone_Block_"+i+"] .top form input[name=port]").value;
            var name = document.querySelector("[id=Drone_Block_"+i+"] .top form input[name=name]").value;
            var description = document.querySelector("[id=Drone_Block_"+i+"] .top form input[name=description]").value;
            var tempObj = {
                id,
                ip,
                port,
                name,
                description
            }
            ws.send("pauseButton_onclick:"+i+"\n"+JSON.stringify(tempObj));
        }
    };
    for(let i = 0;i < detailButton.length;i++){
        detailButton[i].onclick = function(){
            if(!document.querySelector("[id^=detail_infoFrame_"+i+"]").classList.toString().includes("showAni")){
                document.querySelector("[id^=detail_infoFrame_"+i+"]").classList.add("showAni");
            }
            else{
                document.querySelector("[id^=detail_infoFrame_"+i+"]").classList.remove("showAni");
            }
        }
    };
    for(let i = 0;i < LngButton.length;i++){
        LngButton[i].onclick = function(){
            if(!document.querySelector("[id^=Lng_info_"+i+"]").classList.toString().includes("showAni")){
                document.querySelector("[id^=Lng_info_"+i+"]").classList.remove("hiddenAni");
                document.querySelector("[id^=Lng_info_"+i+"]").classList.add("showAni");
            }
            else{
                document.querySelector("[id^=Lng_info_"+i+"]").classList.remove("showAni");
                document.querySelector("[id^=Lng_info_"+i+"]").classList.add("hiddenAni");
            }
        };
    };
    for(let i = 0;i < LatButton.length;i++){
        LatButton[i].onclick = function(){
            if(!document.querySelector("[id^=Lat_info_"+i+"]").classList.toString().includes("showAni")){
                document.querySelector("[id^=Lat_info_"+i+"]").classList.remove("hiddenAni");
                document.querySelector("[id^=Lat_info_"+i+"]").classList.add("showAni");
            }
            else{
                document.querySelector("[id^=Lat_info_"+i+"]").classList.remove("showAni");
                document.querySelector("[id^=Lat_info_"+i+"]").classList.add("hiddenAni");
            }
        };
    };
    for(let i = 0;i < IsolatedButton.length;i++){
        IsolatedButton[i].onclick = function(){
            if(document.querySelector("[id=IsolatedNode_"+i+"]~p").classList.toString().includes("hiddenAni")){
                console.log("(debug)[test]hello");
                document.querySelector("[id=IsolatedNode_"+i+"]~p").classList.remove("hiddenAni");
                document.querySelector("[id=IsolatedNode_"+i+"]~p").classList.add("showAni");
            }
            else{
                console.log("(debug)[test]happy happy happy cat");
                document.querySelector("[id=IsolatedNode_"+i+"]~p").classList.remove("showAni");
                document.querySelector("[id=IsolatedNode_"+i+"]~p").classList.add("hiddenAni");
            }
        }
    };
    //connect_to_api("");

    //ws.send("Drone_Status");
}
else if(s == "/Chart"){
    var ws;
    var recv;
    var node;   //ip:port
    var chart_show = document.getElementById("chart_show");
    var canvas = document.querySelectorAll("canvas");
    var node_select = document.getElementById("node_select");
    var ul;
    var myChart1;
    var myChart2;
    var myCharOption = {
        maintainAspectRatio: false,
        animation: {
            duration: 0
        }
    }
    var UpdateChartTimer;


    function update_select_list(){
        ul = document.querySelector("[id=ul_node_select]");
        
        var old = document.querySelectorAll("[id=ul_node_select] li");
        for(var i = 0;i < old.length;i++){
            old[i].remove();
        }
        new_li = [];
        for(var i = 0;i < recv.length;i++){
            let templi = document.createElement("li");
            templi.classList.add("paddingtop02","bg_white_hover","paddingbottom02");
            templi.textContent = recv[i]["ip"]+":"+recv[i]["port"];
            ul.appendChild(templi);
        }

        for(let i = 0;i < document.querySelectorAll("[id=ul_node_select] li").length;i++){
            document.querySelectorAll("[id=ul_node_select] li")[i].onclick = function(){
                var ip = recv[i].ip;
                var port = recv[i].port;
                node = {ip,port};
                node_select.textContent = node["ip"]+":"+node["port"];
                document.querySelector("[id=ul_node_select]").classList.add("hiddenAni");
                ShowChart();
                UpdateChart();
            };
        }

    }
    function ShowChart(){
        var ctx1 = document.getElementById("chart1");
        myChart1 = new Chart(ctx1,{
            type: "line",
            data: undefined,
            options: undefined
        });
        var ctx2 = document.getElementById("chart2");
        myChart2 = new Chart(ctx2,{
            type: "line",
            data: undefined,
            options: undefined
        });
    }
    function UpdateChart(){
        console.log("(debug)[UpdateChart]start");
        var NodeData = {"Timestamp":[],"bat_volt(V)":[],"bat_cur(mA)":[],"bat_power(%)":[]};
        var RecvIndex;
        for(RecvIndex = 0;RecvIndex < recv.length;RecvIndex++){
            if(recv[RecvIndex].ip == node["ip"] && recv[RecvIndex].port == node["port"]){
                break;
            }
        }
        if(RecvIndex >= recv.length) return false;
        for(var i = (recv[RecvIndex]["data"]["bat"].length > 10 ? recv[RecvIndex]["data"]["bat"].length - 10: 0);i < recv[RecvIndex]["data"]["bat"].length;i++){
            NodeData["Timestamp"].push(recv[RecvIndex]["data"]["bat"][i]["Timestamp"]);
            NodeData["bat_volt(V)"].push(recv[RecvIndex]["data"]["bat"][i]["bat_volt(V)"]);
            NodeData["bat_cur(mA)"].push(recv[RecvIndex]["data"]["bat"][i]["bat_cur(mA)"]);
            NodeData["bat_power(%)"].push(recv[RecvIndex]["data"]["bat"][i]["bat_power(%)"]);
        }

        myChart1.data = {
            labels: NodeData["Timestamp"],
            datasets: [{
                label: "bat_power(%)",
                data: NodeData["bat_power(%)"],
                borderColor: "rgb(255,0,192)"
            }]
        };
        myChart1.options = myCharOption;
        myChart2.data = {
            labels: NodeData["Timestamp"],
            datasets: [{
                label: "bat_volt(V)",
                data: NodeData["bat_volt(V)"],
                borderColor: "rgb(74,192,192)"
            },
            {
                label: "bat_cur(mA)",
                data: NodeData["bat_cur(mA)"],
                borderColor: "rgb(0,255,192)"
            }]
        };
        myChart2.options = myCharOption;
        myChart1.update();
        myChart2.update();
    }
    node_select.onclick = function(){
        if(document.querySelector("[id=ul_node_select]").classList.toString().includes("hiddenAni")){
            document.querySelector("[id=ul_node_select]").classList.remove("hiddenAni");
        }
        else{
            document.querySelector("[id=ul_node_select]").classList.add("hiddenAni");
        }
        update_select_list();
    }
    function connect_to_api(msg = ""){
        ws = new WebSocket("wss://"+self.location.hostname+":3000");
        ws.onopen = () => {
            console.log("open connection");
            ws.send(msg);
            UpdateChartTimer = setInterval(UpdateChart,1000);
        }
        ws.onclose = () => {
            console.log("close connection");
            clearInterval(UpdateChartTimer);
        }
        ws.onmessage = event => {
            if(event.data instanceof Blob){
                reader = new FileReader();
                reader.onload = () => {
                    console.log(reader.result);
                }
                reader.readAsText(event.data);
            }
            else{
                try{
                    recv = JSON.parse(event.data);
                }
                catch(e){
                    //console.log(e);
                }
            }
        }
    }
    connect_to_api("Chart");
}
else if(s == "/Test"){
    
}
else if(s == "/show_log"){
    //var ws = new WebSocket('ws://localhost:3000');
    //var ws = new WebSocket("ws://"+api("ip")+":3000");
    var ws = new WebSocket('wss://'+self.location.hostname+":3000");

    ws.onopen = () => {
        console.log('open connection');
    }
    
    ws.onclose = () => {
        console.log('close connection');
    }
    
    //接收 Server 發送的訊息
    ws.onmessage = event => {
        if(event.data instanceof Blob){
            reader = new FileReader();
            reader.onload = () =>{
                console.log(reader.result);
            }
            reader.readAsText(event.data);  
        }
        else{
            console.log(event.data);
        }
    }
    console.log("(test)");
    async function sleep(){
        await new Promise(r => setTimeout(r, 5000));
    }
    sleep();
    async function show(){
        await sleep();
        document.querySelector("iframe").classList.remove("hiddenAni");
    }
    show();
}



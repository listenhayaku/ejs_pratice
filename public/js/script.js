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

if(s == "/Drone_Status"){
    function change_encode(type,id){
        console.log("(debug)[script.js][test]start",type);
        var drop_down_menu_list = document.querySelectorAll("[id=Drone_Block_"+id+"] form .drop_down_menu_list ul li a");
        var submitButton = document.querySelector("[id=Drone_Block_"+id+"] form input[type=submit]");
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

        var ws = new WebSocket('ws://'+self.location.hostname+":3000");

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
                console.log("(debug)[onmessage]not blob:"+event.data);
                var Drone_Status = JSON.parse(event.data);
                for(var i = 0;i < Drone_Status.length;i++){
                    if(Drone_Status[i]["status"] == 1){
                        Drone_Status_Sign[i].textContent="online";
                        Drone_Status_Sign[i].id="Drone_Status_Sign_Online_"+i;
                        Drone_Block_Input[i].disabled="";
                    }
                    else{
                        Drone_Status_Sign[i].textContent="offline";
                        Drone_Status_Sign[i].id="Drone_Status_Sign_Offline_"+i;
                        Drone_Block_Input[i].disabled="disabled";
                    }
                }
            }
        }
        return ws;
    }
    var ws = connect_to_api("Drone_Status");

    var show_log = document.querySelectorAll("[id^=\"show_log_\"");
    var create_node = document.getElementById("create_node");
    var pauseButton = document.querySelectorAll("[id^=\"pause_\"");

    for(let i = 0;i < show_log.length;i++){
        show_log[i].onclick = function(){
            location.href="/show_log?"+i;
        };
    };    
    create_node.onclick = function(){
        location.href="/create_node";
    };
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



    //connect_to_api("");

    //ws.send("Drone_Status");
}
else if(s == "/Chart"){
    var chart_show = document.getElementById("chart_show");
    var canvas = document.querySelector("canvas");
    chart_show.onclick = function(){
        if(canvas.id != "myChart"){
            canvas.id="myChart";
            var ctx = document.getElementById('myChart');
            var chart = new Chart(ctx, {
                type: "line", // 圖表類型
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [{
                        label: '平均溫度',
                        data: [20, 22.3, 25, 26, 28, 31.2, 33],
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                    }]
                } 
            });            
        }
        else{
            var ctx = document.getElementById('myChart');
            canvas.id="";
            var chart = new Chart(ctx, null);  
        }
    };

    function connect_to_api(data = ""){
        var ws = new WebSocket("ws://"+self.location.hostname+":3000");
        ws.onopen = () => {
            console.log("open connection");
            ws.send(data);
        }
        ws.onclose = () => {
            console.log("close connection");
        }
        ws.onmessage = event => {
            if(event.data instanceof Blob){
                reader = new FileReader();
                read.onload = () => {
                    console.log(reader.result);
                }
                reader.readAsText(event.data);
            }
            else{
                console.log(event.data);
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
    var ws = new WebSocket('ws://'+self.location.hostname+":3000");

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
}



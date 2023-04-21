import os
import sys
import socket
import threading
import time
import select

def client_init(ip,port,data):
    client = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    client.settimeout(2)
    client.connect((ip,port))
    client.settimeout(None)
    client.setblocking(True)
    return client

def readparam():
    ip = str(sys.argv[1])
    port = int(sys.argv[2])
    data = str(sys.argv[3])
    send = str(sys.argv[4])
    #print("(debug)[readparam]ip:{ip},port:{port},data:{data},send:{send}".format(ip=ip,port=port,data=data,send=send))
    return {"ip":ip,"port":port,"data":data,"send":send}
    
def inputFunc(client):
    global STOP
    global dataQueue
    while not(STOP):
        i, o, e = select.select( [sys.stdin], [], [], 1)
        if (i):
            dataQueue.append(sys.stdin.buffer.readline().strip())
        else:
            pass
        while len(dataQueue) > 0:
            tempStr = bytes(dataQueue.pop())
            print("(debug)[communicator.py][inputFunc]tempStr:",tempStr)
            client.send(tempStr)
            time.sleep(1)
        #print("(debug)[communicator.py][[testFunc]dataQueue:",dataQueue)
        #大感謝這個方法使input可以被中斷出來檢查flag是否轉為停止
        #https://stackoverflow.com/questions/1335507/keyboard-input-with-timeout -Pontus


def ParseData(msg = None):  #解析從node接收到的資料
    try:
        if(msg == None):
            print("(debug)[ParseData]msg is None")
            return False
        if(type(msg) != str):
            print("(error)[communicator.py][ParseData]msg type is not string")
            return False
        lMsg = msg.split("//")
        if(lMsg[0] != "data"):
            print("(error)[communicator.py][ParseData]lMsg[0] is not data,lMsg[0] is",lMsg[0])
            return False
        with open("public/file/log/data_{ip}:{port}.txt".format(ip=param["ip"],port=param["port"]),"a") as f:
            print("(debug)[ParseData]open lMsg[1]:",lMsg[1])
            #if(lMsg[1] != '\n'): lMsg[1] += '\n'
            f.writelines(lMsg[1])
        
        os.system("python3 ./lib/data_parser.py {ip} {port}".format(ip=param["ip"],port=param["port"]))

        
    except Exception as e:
        print("(error)[ParseData]e:",e)

STOP = False
dataQueue = []

param = readparam()
try:
    client = client_init(param["ip"],param["port"],param["data"])
    client.recv(1024)   #我寫的那個爛區塊練當別人連線近來會傳一個hello資訊
except socket.timeout:
    exit(0)
except Exception as e:
    print("(error)[main]client_init e:",e)

#print("(debug)[communicator.py]client:",client)
print("[communicator.py]successful")    #這行不可以刪掉，他是給呼叫他的js一個訊號


t = threading.Thread(target=inputFunc,args=(client,))
t.start()

try:
    client.send("response//GCS".encode("utf-8"))#這個是對node的serverlisten那邊初始話辨認用
    while not(STOP):
        if(param["send"] == "true"):
            client.send(param["data"].encode("utf-8"))  #這個是參數設定要傳遞的訊息
        msg = client.recv(4096)
        if(msg != ""):
            print(msg.decode("utf-8"))
            ParseData(msg.decode("utf-8"))
        else:STOP = True #maybe has problem
except ConnectionResetError:
    pass
except Exception as e:
    print("(error)[communicator.py][main]e:",e)
finally:
    STOP = True
    client.close()






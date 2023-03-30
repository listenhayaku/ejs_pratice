
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


def ParseData(msg = None):
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
        with open("public/file/data_{ip}:{port}.txt".format(ip=param["ip"],port=param["port"]),"a") as f:
            print("(debug)[ParseData]open lMsg[1]:",lMsg[1])
            f.writelines(lMsg[1])
    except Exception as e:
        print("(error)[ParseData]e:",e)

STOP = False
dataQueue = []

param = readparam()
client = client_init(param["ip"],param["port"],param["data"])
client.recv(1024)   #我寫的那個爛區塊練當別人連線近來會傳一個hello資訊
print("[communicator.py]successful")
t = threading.Thread(target=inputFunc,args=(client,))
t.start()
try:
    while not(STOP):
        if(param["send"] == "true"):client.send(param["data"].encode("utf-8"))
        msg = client.recv(4096)
        if(msg != ""):
            print("(debug)[main]recv msg:",msg)
            ParseData(msg.decode("utf-8"))
        else:STOP = True #maybe has problem
except Exception as e:
    print("(error)[communicator.py][main]e:",e)
finally:
    STOP = True
    client.close()







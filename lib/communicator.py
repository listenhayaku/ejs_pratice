
import sys
import socket
import threading
import time
import select



def client_init(ip,port,data):
    client = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    client.settimeout(3)
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
            dataQueue.append(sys.stdin.readline().strip())
        else:
            pass
        while len(dataQueue) > 0:
            tempStr = str(dataQueue.pop())
            client.send(tempStr.encode("utf-8"))
            time.sleep(1)
        #print("(debug)[communicator.py][[testFunc]dataQueue:",dataQueue)
        #大感謝這個方法使input可以被中斷出來檢查flag是否轉為停止
        #https://stackoverflow.com/questions/1335507/keyboard-input-with-timeout -Pontus


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
        client.recv(1024)
except Exception as e:
    print("(debug)[communicator.py][main]e:",e)
finally:
    STOP = True
    client.close()







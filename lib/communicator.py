
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
        else:STOP = True #maybe has problem
except Exception as e:
    print("(error)[communicator.py][main]e:",e)
finally:
    STOP = True
    client.close()







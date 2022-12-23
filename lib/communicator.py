import sys
import socket

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

STOP = False

param = readparam()
client = client_init(param["ip"],param["port"],param["data"])
client.recv(1024)   #我寫的那個爛區塊練當別人連線近來會傳一個hello資訊
print("[communicator.py]successful")
while not(STOP):
    #print("pass")
    if(param["send"] == "true"):client.send(param["data"].encode("utf-8"))
    client.recv(1024)
    
client.close()
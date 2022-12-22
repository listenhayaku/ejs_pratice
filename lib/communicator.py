import socket
import sys
import time

def init(ip,port):
    print("(debug)[communicator.py][init]start")
    client = socket.socket(socket.AF_INET,socket.SOCK_STREAM)
    client.settimeout(3)
    client.connect((ip,port))
    #try:
        #client.connect((ip,port))
    #except socket.timeout:
        #print("(debug)[communicator.py[init]timeout")
        #exit(1)
    return client


#print("(debug)[communicator.py]sys.argv:",sys.argv)
if(len(sys.argv) < 4):
    #print("[communicator.py]error:not enough arguments")
    exit(1)
else:
    try:
        ip = str(sys.argv[1])
        port = int(sys.argv[2])
        msg = str(sys.argv[3])
    except:
        #print("(debug)[communicator.py]argv read error")
        exit(0)

client = init(ip,port)
#print("(debug)[communicator.py]client init successful client = ",client)
STOP = False
#client.send(msg.encode("utf-8"))
print("(debug)[communicator.py]after client.send")
time.sleep(0.1)
client.close()
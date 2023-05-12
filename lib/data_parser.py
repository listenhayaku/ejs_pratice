import os
import sys
import time
import csv


datapath = os.getcwd()+"/public/file/log/"
batpath = os.getcwd()+"/public/file/log/bat/"
gpspath = os.getcwd()+"/public/file/log/gps/"

def claw_v4(ip,port): #最後server用

    with open(datapath+"data_{ip}:{port}.txt".format(ip=ip,port=port), 'r', encoding='utf-8') as f:    #寫入txt用w，寫到最新行，之後再用a謝新資料進csv
        content = f.readlines()
        
        data_list = list()
        gps_lat_list = list()
        gps_lng_list = list()
        bat_volt_list = list()
        bat_cur_list = list()
        bat_power_list = list()
        timestamp_list = list()
        
        for _ in range(len(content)):
            data_content = content[_].split(",")
            data_list.append(data_content)

        for _ in range(len(content)):
            for i in range(len(data_content)):
                if("time:" in data_list[_][i]):
                    timestamp = data_list[_][i].split("time:")[1]
                    timestamp_list.append(timestamp)
                if("lat:" in data_list[_][i]):
                    gps_lat = data_list[_][i].split("lat:")[1]
                    gps_lat_list.append(gps_lat)
                if("lon:" in data_list[_][i]):
                    gps_lng = data_list[_][i].split("lon:")[1]
                    gps_lng_list.append(gps_lng)
                if("vol:" in data_list[_][i]):
                    bat_volt = data_list[_][i].split("vol:")[1]
                    bat_volt_list.append(bat_volt)
                if("amp:" in data_list[_][i]):
                    bat_cur = data_list[_][i].split("amp:")[1]
                    bat_cur_list.append(bat_cur)
                if("per:" in data_list[_][i]):
                    bat_power = data_list[_][i].split("per:")[1]
                    bat_power_list.append(bat_power[0:2])

        gps = 0 ##len(list) + 1
        with open(gpspath+"gps_{ip}:{port}.csv".format(ip=ip,port=port),'w', newline='') as gps_csvfile:
            writer = csv.writer(gps_csvfile)
            writer.writerow(['ID', 'Timestamp', 'gps_lat', 'gps_lng'])                  #先寫好一個csv，之後就直接加資料上去就好
            for _ in range(len(timestamp_list)): 
                writer.writerow([str(_ + 1), str(timestamp_list[_]), str(gps_lat_list[_]), str(gps_lng_list[_])])
            gps_csvfile.close()
            
        bat = 0 ##len(list) + 1
        with open(batpath+"bat_{ip}:{port}.csv".format(ip=ip,port=port), 'w', newline='') as bat_csvfile:
            writer = csv.writer(bat_csvfile)
            writer.writerow(['ID', 'Timestamp', 'bat_volt(V)', 'bat_cur(mA)', 'bat_power(%)'])
            for _ in range(len(timestamp_list)): 
                writer.writerow([str(_ + 1), str(timestamp_list[_]), str(bat_volt_list[_]), str(bat_cur_list[_]), str(bat_power_list[_])])
            bat_csvfile.close()
    f.close()

def ReadParam():
    try:
        ip = str(sys.argv[1])
        port = str(sys.argv[2])
        return {"ip":ip,"port":port}
    except Exception as e:
        print("(error)[ReadParam]e:",e)
        return False

if __name__ == "__main__":
    try:
        param = ReadParam()
        claw_v4(param["ip"],param["port"])
    except Exception as e:
        print("(error)[data_parser][main]e:",e)

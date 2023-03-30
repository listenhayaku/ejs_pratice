import csv
import sys

def claw_v2(address,outputFileName_gps,outputFileName_bat):
    with open(address) as f:
        content = f.readlines()
        #print(content)
        #print(len(content))
        gps_time_stamp_list = list()
        gps_list = list()
        gps_lat_list = list()
        gps_lng_list = list()
        bat_time_stamp_list = list()
        bat_list = list()
        bat_volt_list = list()
        bat_cur_list = list()
        for _ in range(len(content)): #直接拉block.id
            if("GPS {" in content[_]):
                gps_content = content[_].split("\n")
                gps_list.append(gps_content)
                for i in gps_content:
                    if("Lat :" in i):
                        gps_lat = i.split("Lat :")[1]
                        gps_lat_list.append(gps_lat[0:9])
                for j in gps_content:
                    if("Lng :" in j):
                        gps_lng = j.split("Lng :")[1]
                        gps_lng_list.append(gps_lng[0:10])
            if("BAT" in content[_]):
                bat_content = content[_].split("\n")
                bat_list.append(bat_content)
                for a in bat_content:
                    if("VoltR :" in a):
                        bat_volt = a.split("VoltR : ")[1]
                        bat_volt_list.append(bat_volt[0:10])
                for b in bat_content:
                    if("CurrTot :" in b):
                        bat_cur = b.split("CurrTot : ")[1]
                        bat_cur_list.append(bat_cur[0:7])
        for _ in range(len(gps_list)):
            gps_time_stamp_list.append(gps_list[_][0][0:16])
        for _ in range(len(bat_list)):
            bat_time_stamp_list.append(bat_list[_][0][0:16])
        print("=======================================================================================")
        #print("test",len(bat_time_stamp_list))
        #print("test",len(bat_volt_list))
        #print("test",bat_cur_list[3369])

        #csv專用
        with open(outputFileName_gps, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['ID', 'Timestamp', 'gps_lat', 'gps_lng'])
            for _ in range(len(gps_time_stamp_list)):
                writer.writerow([str(_ + 1), gps_time_stamp_list[_], gps_lat_list[_], gps_lng_list[_]])
        with open(outputFileName_bat, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['ID', 'Timestamp', 'bat_volt', 'bat_cur', 'bat_power'])
            for _ in range(len(bat_volt_list)):
                writer.writerow([str(_ + 1), bat_time_stamp_list[_], bat_volt_list[_], bat_cur_list[_], str(float(bat_cur_list[_]) * float(bat_cur_list[_]))])
        f.close()
        
def readparam():
    try:    
        ip = str(sys.argv[1])
        port = int(sys.argv[2])
        return {"ip":ip,"port":port}
    except Exception as e:
        print("(error)[data_parser::readparam]e:",e)


if __name__ == "__main__":
    param = readparam()
    inputFileName = "public/file/log/data_{ip}:{port}.txt".format(ip = param["ip"],port = param["port"])
    outputFileName_gps = "public/file/log/gps/gps_{ip}:{port}.csv".format(ip = param["ip"],port = param["port"])
    outputFileName_bat = "public/file/log/bat/bat_{ip}:{port}.csv".format(ip = param["ip"],port = param["port"])
    claw_v2(inputFileName,outputFileName_gps,outputFileName_bat)

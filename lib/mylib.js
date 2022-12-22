const mysql = require("mysql");
const { resolveInclude } = require("ejs");
const yaml = require("./yaml");


exports.get_mysql = function(sql,callback){
  //console.log("(debug)[get_mysql()]sql = ",sql);
  var sql_login = yaml.parser('/home/user/ejs_pratice/sql_login.yaml');
  var con = mysql.createConnection({
    host:sql_login.host,
    user:sql_login.user,
    password:sql_login.password,
    database:sql_login.database
  });
  con.connect(function(err){
    if(err) return false;
    con.query(sql,function(err,result){
      try{
        if(err) throw err;
        return callback(result);
      }
      catch(e){
        console.log("(debug)[get_mysql.query]catch e = "+e);
        return callback(false);
      } 
    });
    con.end(function(err){
      if(err) console.log("(error)[mylib.end]err:"+err);
    });
    /*
    con.on("error",function(){
      con.end(function(err){
        if(err){
          return console.log("error:"+err.message);
        }
        console.log("close the database connection");
      });
    });
    */
  });
}




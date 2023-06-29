const mysql = require('mysql');  
const dbConnect = {
    getConnection:function(){
        const conn = mysql.createConnection({   
            host:"localhost",
            user:"root",
            password:"root",
            database:"HEAP"
        });
        return conn;
    }
}
module.exports = dbConnect;

const db = require('./databaseconfig');   
    
//sql scripts
function check_user_exist(email) {
    let sql_check=`SELECT COUNT(*) AS count FROM user WHERE email = "${email}";`

    //check if user exists in our databse:
    db.query(sql_check, [email], (err, result) => {
    if (err) {
        console.error('Error executing SQL query:', err);
    }

    // Access the count value from the result object
    const count = result[0].count;

    if (count == 1) {
        // email already exists, do not create another instance in db
        return true;
    } 
    });
    return false;
}

function get_user_id(email) {
    if (check_user_exist(email)) {
        let sql=`SELECT userId FROM user WHERE email = "${email}";`

        //check if user exists in our databse:
        db.query(sql, [email], (err, result) => {
        if (err) {
            console.error('Error executing SQL query:', err);
        }

        // Access the count value from the result object
        console.log(result);
        // const userId = result[0].count;

        }) 
    }
}

function create_event(email, EventName, StartDate, EndDate, StartTime, EndTime, EventLink) {

}

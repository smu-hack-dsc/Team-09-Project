const mysql = require('mysql');

// Create a connection pool
const pool = mysql.createPool({
    host:"localhost",
    port:8889,
    user:"root",
    // CHANGE PASSWORD TO root IF USING MAC or LEAVE IT EMPTY IN WINDOWS
    password:"root",
    database:"HEAP"
});

// Define the query function
function query(sql, values, callback) {
  // Acquire a connection from the pool
  pool.getConnection(function(err, connection) {
    if (err) {
      console.error('Error acquiring database connection:', err);
      callback(err, null);
      return;
    }

    // Execute the query with optional values
    connection.query(sql, values, function(err, results) {
      // Release the connection back to the pool
      connection.release();

      if (err) {
        console.error('Error executing SQL query:', err);
        callback(err, null);
        return;
      }

      callback(null, results);
    });
  });
}

module.exports = { query };
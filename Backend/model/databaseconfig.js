const mysql = require('mysql2');
const { promisify } = require('util');
const os = require('os');

// Create a connection pool
if (os.platform() === 'darwin') {
  // Mac
  password = 'root';
} else {
  // Windows or other platforms
  password = '';
}
const pool = mysql.createPool({
    host:"localhost",
    port:3306,
    user:"root",
    // CHANGE PASSWORD TO root IF USING MAC or LEAVE IT EMPTY IN WINDOWS
    password:password,
    database:"HEAP"
});

// Test the database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database!');
  connection.release();
});

// Export a function to execute queries
const callback_query = (sql, params, callback) => {
  pool.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return callback(err, null);
    }
    callback(null, results);
  });
};


const queryAsync = promisify(pool.query).bind(pool);

// Export a function to execute queries using async/await
const async_query = async (sql, params) => {
  try {
    const results = await queryAsync(sql, params);
    return results;
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  }
};

module.exports = { callback_query, async_query };
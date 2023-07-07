// const app = require('./controller/app.js');
// const port = 3000;
// const server = app.listen(port,function() {
//     console.log("App hosted at localhost:" + port);
// });

const app = require('express')();
const PORT = 3000;

app.listen(
    PORT,() => console.log(`It's alive on http://localhost:${PORT}`)
);
 
// app.listen(PORT, function(err){
//     if (err) console.log("Error in server setup")
//     console.log("Server listening on Port", PORT);
// })
const app = require('./controller/app.js');
const port = 8081;
const server = app.listen(port,function() {
    console.log("App hosted at localhost:" + port);
});''
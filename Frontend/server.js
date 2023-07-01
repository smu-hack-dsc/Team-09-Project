const express = require('./node_modules/express');

const app = express();
const port = 3001;

app.use(express.static('./public'));

app.listen(port, function(err) {
    console.log(`Listening on http://localhost:${port}`)
});


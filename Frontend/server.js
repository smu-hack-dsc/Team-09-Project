const express = require('express');
const axios = require('axios')
const app = express();
const port = 3001;

app.get('/',
    app.use(express.static('./public'))
);

app.listen(port, function(err) {
    console.log(`Listening on http://localhost:${port}`)
});



const express = require('express');
const axios = require('axios')
const app = express();
const port = 3001;

// const {readFile} = require('fs').promises;

// app.get('/', async (req,res) => {
//     res.send(await readFile('./public/index.html','utf8'));
// });

app.get('/',
    app.use(express.static('./public'))
);


app.listen(port, function(err) {
    console.log(`Listening on http://localhost:${port}`)
});



const jwt = require('jsonwebtoken')
const jwtSecretKey = require('../config')

function verifyToken(req, res, next) {
    const authorizationHeader = req.headers.authorization

    if (!authorizationHeader || !authorizationHeader.includes('Bearer ')) {
        res.status(401) // unauthenticated (formally: unauthorized)
        res.send()
        return
    }

    const accessToken = authorizationHeader.split('Bearer ')[1]

    // should be in a string format now
    jwt.verify(accessToken, jwtSecretKey, function(err, decoded) {
        if (err) {
            console.log(err)
            res.status(401)
            res.send()
            return
        }

        req.userId = decoded.userId

        next()
    })
}

module.exports = verifyToken
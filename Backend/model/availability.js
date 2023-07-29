const db = require("./databaseconfig");

const availabilityDB = {
    getAvailabilityByEvent(eventId, callback) {
        const sql = `
            SELECT USER.UserID, USER.Email, USER.Username, EVENT.EventID, EVENT.EventName, EVENT.EventOver, group_concat(Date separator ',') "Dates" FROM eventDate 
            INNER JOIN EVENT ON EVENT.EventID=eventDate.EventID
            INNER JOIN USER ON EVENT.CreatorID=USER.UserID
            WHERE eventDate.EventID= ?
            GROUP BY EVENT.EventID, EVENT.CreatorID, EVENT.EventName, EVENT.EventOver;
        `;
        db.callback_query(sql, [eventId], function (err, results) {
            if (err) {
                console.log('Failed to select data from event')
                callback(err, null)
                return
            }
            callback(null, results)
        })
    }
}

module.exports = availabilityDB;
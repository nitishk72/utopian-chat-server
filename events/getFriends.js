const User = require("../models").User

// Query and populate all of the friends of a user. 
module.exports = socket => ({from}) => {
    User
        .findOne({_id: from})
        .select('friends')
        .exec()
        .then(doc => {
            if(doc.friends.length < 1) return []
            return User.find({_id: {$in: doc.friends}}).select('_id name avatar').exec()
        })
        .then(list => {
            socket.emit('getFriends',list)
        })
}
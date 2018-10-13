const db = require("../models")

// Pull a message from the backend to the frontend.  
// Sorts messages by DM or Group
module.exports = (socket,io) => ({from,friendId,groupId,data}) => {
    let page = data.page || 1

    if(groupId) {
        findMsg({toGroup: groupId},page).then(coll => {
            socket.emit('pullMsg',{
                groupId,
                data: coll
            })
        }).catch(err => {
            socket.emit('pullMsg',err)
        })


    } else if(friendId && from) {
        let ids = [from,friendId]

        findMsg({from: {$in: ids},toUser: {$in: ids}},page).then(coll => {
            socket.emit('pullMsg',{
                friendId,
                data: coll
            })
        }).catch(err => {
            socket.emit('pullMsg',err)
        })

    } else {
        socket.emit('pullMsg',{status: 400,msg: 'missing parameters'})
    }
}

// Find a specific message in increments of 10.  Allows us to populate a group or DM with historic messages. 
// TODO: add the ability to timeout the messages after a period of time. 
function findMsg(opt,page) {
    return db.Message
        .find(opt)
        .sort({'createAt': -1})
        .skip((page - 1) * 10)
        .limit(10)
        .exec()
        .then(coll => {
            if(!coll) return []

            let promise_arr = []
            coll = coll.map(doc => doc.toObject())

            coll.forEach(doc => {
                let promise = db.User
                    .findById(doc.from)
                    .select('_id name avatar')
                    .exec()
                    .then(user => {
                        doc.from = user.toObject()
                    })

                promise_arr.push(promise)
            })

            return Promise.all(promise_arr).then(() => coll.reverse())
        })
}
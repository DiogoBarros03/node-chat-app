const path = require("path")
const express = require("express")
const http = require("http")
require("dotenv").config()
const {Server} = require("socket.io")
const cors = require("cors")
const Filter = require("bad-words")
const {generateMessage,generateLocationMessage} = require("./utils/messages")
const {addUser,removeUser,getUser,getUsersInRooms} = require("./utils/users")


const app = express()
const server = http.createServer(app);
const io = new Server(server)
const port = process.env.PORT || 3000
const public_directory = path.join(__dirname, "../public")

app.use(express.static(public_directory))
app.use(cors)

io.on("connection", (socket)=>{
    
   
    socket.on("join",(options,callback)=>{
        const {error,user} = addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }   
        socket.join(user.room)
        socket.emit("message", generateMessage("System","Welcome!"))
        socket.broadcast.to(user.room).emit("message", generateMessage("System",`${user.username} has joined!`))
        io.to(user.room).emit("roomData",{
            room: user.room,
            users: getUsersInRooms(user.room)
        })

        callback()
    })

    socket.on("sendMessage",(message,callback)=>{
        const user = getUser(socket.id)
        /*
         * In case we want to filter messages

            const filter = new Filter()
            if (filter.isProfane(message)){
                return callback("Profanity is not allowed!")
            }

        */
        io.to(user.room).emit("message", generateMessage(user.username,message))
        callback()
    })
    socket.on("sendLocation", ({latitude,longitude}, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit("locationMessage",generateLocationMessage(user.username,`https://google.com/maps?q=${latitude},${longitude}`))
        callback()
    })
    socket.on("disconnect",()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message",generateMessage("System",`${user.username} has left!`))
            io.to(user.room).emit("roomData",{
                room: user.room,
                users: getUsersInRooms(user.room)
            })
        }
        
    })
})

server.listen(port, ()=>{
    console.log(`Listening on port : ${port} `)
})
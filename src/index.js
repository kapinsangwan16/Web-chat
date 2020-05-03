const path=require('path') //no need to install it
const http=require('http')
const express =require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}=require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom}=require('./utils/users')

const app=express()
const server=http.createServer(app)
//event listener
//created a new instance of socket.io to configure web sockets to work with our server
const io=socketio(server)//socket io expects to be called with raw http server(continued in next line)
//that's why we reconfigured server and created one with http 

const port=process.env.PORT || 3000
const publicDirectoryPath=path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

let count =0;

//server (emit) => client (receive) -> countUpdated --acknowledgement-->client
//client (emit) => server (receive) -> increment --acknowledgement--> server



io.on('connection',(socket)=>{ //socket ia an object and contains the information about that new connection so we can use methosds on socket to communicate with the client  
    console.log('New web socket connection')
    //so when we are working with socket.io and transferring data,we are sending and receiving callled events
    //send an event fron the server and receive the event on client

    //when any aclinet joins the server ,it emits this below event 
    //socket.emit('countUpadated',count) //aocket.emit()->to send an event
    // socket.emit('message',{
    //     text:'Welcome!',
    //     createdAt:new Date().getTime()
    // })

    socket.on('join',({username,room},callback)=>{
        const {error,user}= addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }
        socket.join(user.room)

        //socket.emit,io.emit,socket.broadcast.emit
        //io.to.emit(emits an  event to everybody in the room without sending people in the other room)
        //socket.broadcast.to.emit

        socket.emit('message',generateMessage('Admin','Welcome!'))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        // socket.broadcast.emit('message',generateMessage("A new User has joined!"))
        socket.broadcast.to(user.room).emit('message',generateMessage(user.username+" has joined!"))

        callback();
    
    })


    socket.on('sendMessage',(message,callback)=>{  //callback function to send acknowledgement
        const filter=new Filter()
        const user=getUser(socket.id)
        if(!user){
            return callback("user doesnot exist!")
        }
        if(filter.isProfane(message))
        {
            return callback('Profanity is not allowed!')
        }
        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('sendLocation',(coords,callback)=>{
        // io.emit('message','Location: ${coords.latitude}, ${coords.longitude}')
        const user=getUser(socket.id)
        if(!user){
            return callback("user doesnot exist!")
        }
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,'https://google.com/maps?q='+ coords.latitude +','+ coords.longitude))
        callback()
    })


    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
        //we don't need to use broadcast because the client has already disconnected
        io.to(user.room).emit('message',generateMessage('Admin',user.username+ "has left!"))
        io.to(user.room).emit('roomData',{
            room:user.room,
            user:getUsersInRoom(user.room)
        })
        }

    })

    // socket.on('increment',()=>{ //received an event 'increment' from client
    //     count++;
    //    // socket.emit('countUpdated',count)//here we are emiting an event to a particular client
    //    // io.emit('countUpdated',count)//emit event to all connections
    // })
})
server.listen(port,()=>{
    console.log('Server is up on port ${port} !')
})
// Goal :Create an express web Server
//
// 1.Initialise npm and install express
// 2. Setup a new express Server
//     -Serve up the public directory
//     -Listen on port 3000
// 3. Create indexedDB.html and render "Chat App" to the screen
// 4. Test your work! Start the server and view the page in the Browser

// Challenge 2
//
// 1. Create a "start" script to start the app using Node
// 2. Install nodemon and a development dependency
// 3. Create a "dev" script to atrt the app using nodemon
// 4. Run both script to test your work!
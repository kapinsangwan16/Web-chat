

//client side JS file load that in and use whtas provided by the script (socket.io.js)
const socket=io() //used to send an event and receive an event that the server is sending to us
//io()->initializes a connnection
//socket.on('countUpdated',(count,message)=>{ //first argument:event name(i.e countUpdated) and second is function which needs to be updated when the event encountered
//console.log("The count has been updated!",count)
// console.log(message)
// })

//Elements
const $messageForm=document.querySelector('#message-form')
const $messageFormInput=$messageForm.querySelector('input')
const $messageFormButton=$messageForm.querySelector('button')
const $sendLocationButton=document.querySelector('#send-location')
const $messages=document.querySelector('#messages') //to select the place where we wnat to render the message
 
//Templates
const messageTemplate=document.querySelector('#message-template').innerHTML
const locationMesaageTemplate=document.querySelector('#location-message-template').innerHTML
const sidebarTemplate=document.querySelector('#sidebar-template').innerHTML

//Options
//we will send username and server into the database
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix:true})

const autoscroll=()=>{
//new message element
const $newMessage=$messages.lastElementChild

//Height of the new message
//to calculate margin bottom
const newMessageStyles=getComputedStyle($newMessage)   //function provided by browser
const newMessageMargin=parseInt(newMessageStyles.marginBottom)
const newMessageHeight=$newMessage.offsetHeight + newMessageMargin //this doesnot take into account margin
//console.log(newMessageStyles)
//console.log(newMessageMargin)

//visible height(the area in which messages are visible) 
const visibleHeight=$messages.offsetHeight

//height of messages container
const containerHeight=$messages.scrollHeight //total height we will be able to scroll through

//how far  have scrolled
// const scrollOffset=$messages.scrollTop //gives us number,amount we scrolled from the top
const scrollOffset=$messages.scrollTop+visibleHeight
//logic:if we,scroller, at the bottom then auto scroll otherwise not 
if(containerHeight-newMessageHeight<=scrollOffset){//this means we are in the bottom before the last message was added
    $messages.scrollTop=$messages.scrollHeight
}
}


socket.on('message',(message)=>{ //first argument:event name(i.e countUpdated) and second is function which needs to be updated when the event encountered
console.log(message)
//in order to render the template which we prepared in index.html
//we need to things:1.the template itself and 
//2.need to access the place where we want to render the message
const html=Mustache.render(messageTemplate,{
    //here we enter key -value pair which we want to accss in template
    //message:message
    username:message.username,
    message:message.text,
    createdAt:moment(message.createdAt).format('h:mm a') //short hand syntax
})
$messages.insertAdjacentHTML('beforeend',html)
autoscroll()
})

socket.on('locationMesaage',(message)=>{
    console.log(message)
    const html=Mustache.render(locationMessageTemplate,{
        url:message.url,
        username:message.username,
        createdAt:moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    // console.log(room)e
    // console.log(users)
    const html=Mustache.render(sidebarTemplate,{
        room,users
    })
    document.querySelector('#sidebar').innerHTML=html
})
// document.querySelector('#increment').addEventListener('click',()=>{
//     console.log('Clicked')
//     socket.emit('increment')//sends an event        
// })
$messageForm.addEventListener('submit', (e)=>{
    e.preventDefault()
    $messageFormButton.setAttribute('disabled','disabled')
    //disable the form(so that one can't send message until the previous message has been sent) also 
    //it prevents accidental double click

    //const message=document.querySelector('input').value
    const message=e.target.elements.message.value
    socket.emit('sendMessage',message,(error)=>{ //third argument is to send the acknowledgement to the server
       $messageFormButton.removeAttribute('disabled')
       //enable the form

        $messageFormInput.value='';
        $messageFormInput.focus()
        //to clear the message once the message is sent
       
       
        if(error){
            return console.log(error)
        }
        return console.log("Message delivered")
    })
})

$sendLocationButton.addEventListener('click',()=>{
    if(!navigator.geolocation){//property provided by browser(older version of browser might not support this)
        //Google MDN web docs
        return alert('Geolocation is not supported by your browser')
    }
    //disble
    $sendLocationButton.setAttribute('disabled','disabled');

    navigator.geolocation.getCurrentPosition((position)=>{  //getcurrent position is asynchronous, it takes some time to fetch info also
    //it doesnot support the promise api,we can't use async-await 
    console.log(position)
    socket.emit('sendLocation',{
      latitude:position.coords.latitude,
      longitude:position.coords.longitude
    },
    (error)=>{
        $sendLocationButton.removeAttribute('diabled')
        if(error)
        {
            return console.log(error)
        }
        return console.log("Location Shared")
    })
    })
})

socket.emit('join',{username,room},(error)=>{
    if(error)
    {
        alert(error)
        //to redirect them on join page
        location.href='/'
    }
})
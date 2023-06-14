const socket = io();

//Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#sidebar")

//Templates
const messageTemplate = document.querySelector(("#message-template")).innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML
//Options
const {username,room} = Qs.parse(location.search, {ignoreQueryPrefix:true})

const autoscroll = (sentMessage = false)=>{
  if(!sentMessage){
    const $newMessage = $messages.lastElementChild
    const newMessagesStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessagesStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
      $messages.scrollTop = $messages.scrollHeight
    }
  }else{
    $messages.scrollTop = $messages.scrollHeight
  }
  
}

socket.on("message", (message)=>{
  
  const html = Mustache.render(messageTemplate,{
    username: message.username,
    message:message.text,
    createdAt: moment(message.createdAt).format("HH:mm")
  })


  $messages.insertAdjacentHTML("beforeend",html)
  autoscroll()
})
socket.on("locationMessage", (location)=>{
  
  const html = Mustache.render(locationTemplate,{
    username: location.username,
    url: location.url,
    createdAt: moment(location.createdAt).format("HH:mm")
  })
  $messages.insertAdjacentHTML("beforeend",html)
  autoscroll()
})

socket.on("roomData", ({room, users}) =>{
  const html = Mustache.render(sidebarTemplate,{
    room,
    users
  })
  $sidebar.innerHTML = html

})

$messageForm.addEventListener("submit",(e)=>{
  e.preventDefault()

  $messageFormButton.setAttribute("disabled","disabled")
  const message = e.target.elements.message.value
 
  socket.emit("sendMessage", message, (error)=>{
    $messageFormButton.removeAttribute("disabled")
    $messageFormInput.value = ""
    $messageFormInput.focus()
    if(error){
      return console.log(error)
    }
    console.log("Message delivered!")
    autoscroll(true)
  })
})

$sendLocationButton.addEventListener("click",()=>{
  $sendLocationButton.setAttribute("disabled","disabled")
  if(!navigator.geolocation){
    return alert("Geolocation is not supported by your browser!")
  }
  navigator.geolocation.getCurrentPosition((position)=>{
    socket.emit("sendLocation", {latitude: position.coords.latitude, longitude: position.coords.longitude} , () =>{
      $sendLocationButton.removeAttribute("disabled")
      console.log("Location Shared!")
    })
  })
})

socket.emit("join",{username,room}, (error)=>{
  if(error){
    alert(error)
    location.href = "/"
  }
  
})
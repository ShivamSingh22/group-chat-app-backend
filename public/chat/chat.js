 function handleFormSubmit(event) {
    event.preventDefault();
    const message = document.querySelector('.chat-input').value;
    console.log(message);
    const obj = {
        message: message,
    }
    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/chat/msg', obj,{
        headers: {
            'Authorization': token
        }   
    }).then((res) => {
        console.log(res);
    }).catch((err) => {
        console.log(err);
    })
}
function displayChat(chats) {
    const ul = document.querySelector('.chat-container ul');
    chats.forEach((chat) => {
        const li = document.createElement('li');
        li.textContent = `${chat.username}: ${chat.message}`;
        ul.appendChild(li);
    })
}

function handleGetChat() {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:3000/chat/msg',{
        headers: {
            'Authorization': token
        }   
    }).then((res) => {
       const chats = res.data.chats;
        console.log(res);
        displayChat(chats);
    }).catch((err) => {
        console.log(err);
    })
}
window.addEventListener('DOMContentLoaded',() => {
    handleGetChat();
})
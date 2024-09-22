let lastMessageId = 0;

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
        event.target.reset();
    }).catch((err) => {
        console.log(err);
    })
}

function saveChatsToLocalStorage(chats) {
    localStorage.setItem('chats', JSON.stringify(chats));
    lastMessageId = Math.max(...chats.map(chat => chat.id), 0);
}

function getChatsFromLocalStorage() {
    const storedChats = localStorage.getItem('chats');
    return storedChats ? JSON.parse(storedChats) : [];
}

function displayChat(chats) {
    const ul = document.querySelector('.chat-container ul');
    ul.innerHTML = '';
    chats.forEach((chat) => {
        const li = document.createElement('li');
        li.textContent = `${chat.username} : ${chat.message}`;
        ul.appendChild(li);
    });
    saveChatsToLocalStorage(chats);
}

function handleGetChat() {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3000/chat/msg?lastId=${lastMessageId}`, {
        headers: {
            'Authorization': token
        }   
    }).then((res) => {
        const newChats = res.data.chats;
        const existingChats = getChatsFromLocalStorage();
        const updatedChats = [...existingChats, ...newChats];
        displayChat(updatedChats);
    }).catch((err) => {
        console.log(err);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    const storedChats = getChatsFromLocalStorage();
    displayChat(storedChats);
    handleGetChat();
});

setInterval(handleGetChat, 60000); // Poll for new messages every 5 seconds
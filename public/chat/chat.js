let lastMessageId = 0;
let currentGroupId = null;

function handleFormSubmit(event) {
    event.preventDefault();
    if (!currentGroupId) {
        alert("Please select a group first");
        return;
    }
    const message = document.querySelector('.chat-input').value;
    const obj = {
        message: message,
        groupId: currentGroupId
    }
    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/chat/msg', obj, {
        headers: { 'Authorization': token }
    }).then((res) => {
        console.log(res);
        event.target.reset();
        handleGetChat();
    }).catch((err) => {
        console.error(err);
    });
}

function saveChatsToLocalStorage(chats) {
    const existingChats = getChatsFromLocalStorage();
    const uniqueChats = [...existingChats, ...chats].reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
            return acc.concat([current]);
        } else {
            return acc;
        }
    }, []);
    
    localStorage.setItem(`chats_${currentGroupId}`, JSON.stringify(uniqueChats));
    lastMessageId = Math.max(...uniqueChats.map(chat => chat.id), 0);
}

function getChatsFromLocalStorage() {
    const storedChats = localStorage.getItem(`chats_${currentGroupId}`);
    return storedChats ? JSON.parse(storedChats) : [];
}

function displayChat(chats) {
    const ul = document.getElementById('messageList');
    ul.innerHTML = '';
    chats.forEach((chat) => {
        const li = document.createElement('li');
        li.textContent = `${chat.username}: ${chat.message}`;
        ul.appendChild(li);
    });
}

function handleGetChat() {
    if (!currentGroupId) return;
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3000/chat/msg?groupId=${currentGroupId}&lastId=${lastMessageId}`, {
        headers: { 'Authorization': token }
    }).then((res) => {
        const newChats = res.data.chats;
        if (newChats.length > 0) {
            const existingChats = getChatsFromLocalStorage();
            const updatedChats = [...existingChats, ...newChats];
            saveChatsToLocalStorage(updatedChats);
            displayChat(updatedChats);
        }
    }).catch((err) => {
        console.error(err);
    });
}

function displayGroups(groups) {
    const groupList = document.getElementById('groupList');
    groupList.innerHTML = '';
    groups.forEach(group => {
        const li = document.createElement('li');
        li.textContent = group.name;
        li.onclick = () => switchGroup(group.id);
        groupList.appendChild(li);
    });
}

function switchGroup(groupId) {
    currentGroupId = groupId;
    storeCurrentGroupId(groupId);
    const existingChats = getChatsFromLocalStorage();
    displayChat(existingChats);
    lastMessageId = Math.max(...existingChats.map(chat => chat.id), 0);
    handleGetChat();
}

function createGroup() {
    const groupName = prompt("Enter group name:");
    if (groupName) {
        const token = localStorage.getItem('token');
        axios.post('http://localhost:3000/group/create', { name: groupName }, {
            headers: { 'Authorization': token }
        }).then(() => {
            getUserGroups();
        }).catch(console.error);
    }
}

function inviteToGroup() {
    if (!currentGroupId) {
        alert("Please select a group first");
        return;
    }
    const userEmail = prompt("Enter user email to invite:");
    if (userEmail) {
        const token = localStorage.getItem('token');
        axios.post('http://localhost:3000/group/invite', { groupId: currentGroupId, userEmail }, {
            headers: { 'Authorization': token }
        }).then(() => {
            alert("User invited successfully");
        }).catch(console.error);
    }
}

function getUserGroups() {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:3000/group/user-groups', {
        headers: { 'Authorization': token }
    }).then((res) => {
        displayGroups(res.data.groups);
    }).catch(console.error);
}

window.addEventListener('DOMContentLoaded', () => {
    getUserGroups();
    document.getElementById('createGroupBtn').addEventListener('click', createGroup);
    // If there's a currentGroupId stored, load that group's messages
    const storedGroupId = localStorage.getItem('currentGroupId');
    if (storedGroupId) {
        switchGroup(parseInt(storedGroupId));
    }
});

// Add this function to store the current group ID
function storeCurrentGroupId(groupId) {
    localStorage.setItem('currentGroupId', groupId);
}

setInterval(handleGetChat, 300000); // Poll for new messages every 5 seconds
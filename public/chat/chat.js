const socket = io('http://localhost:3000', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

socket.on('connect', () => {
    console.log('Connected to socket server');
});

socket.on('new message', (message) => {
    console.log('New message received:', message);
    if (message.groupId === currentGroupId) {
        appendNewChatsToUI([message]);
    }
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});

let lastMessageIds = {};
let currentGroupId = null;

function switchGroup(groupId) {
    if (currentGroupId) {
        socket.emit('leave group', currentGroupId);
    }
    currentGroupId = groupId;
    socket.emit('join group', groupId);
    
    document.querySelectorAll('#groupList li').forEach(li => {
        li.classList.remove('selected');
    });
    
    const selectedGroup = document.querySelector(`#groupList li[data-group-id="${groupId}"]`);
    if (selectedGroup) {
        selectedGroup.classList.add('selected');
    }

    document.getElementById('messageList').innerHTML = '';
    lastMessageIds[groupId] = parseInt(localStorage.getItem(`lastMessageId_${groupId}`)) || 0;
    
    // Load messages from localStorage first
    loadMessagesFromLocalStorage(groupId);
    // Then fetch any new messages
    loadInitialMessages(groupId);
    fetchGroupMembers(groupId);
    // fetchNonGroupMembers(groupId);
}

function loadMessagesFromLocalStorage(groupId) {
    const storedMessages = JSON.parse(localStorage.getItem(`messages_${groupId}`)) || [];
    appendNewChatsToUI(storedMessages);
}

function loadInitialMessages(groupId) {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3000/chat/msg?groupId=${groupId}&lastId=${lastMessageIds[groupId]}`, {
        headers: { 'Authorization': token }
    }).then((res) => {
        const chats = res.data.chats;
        if (chats.length > 0) {
            appendNewChatsToUI(chats);
            lastMessageIds[groupId] = Math.max(...chats.map(chat => chat.id), lastMessageIds[groupId]);
            // Store the last message ID for this group in localStorage
            localStorage.setItem(`lastMessageId_${groupId}`, lastMessageIds[groupId]);
            // Store the messages in localStorage
            const storedMessages = JSON.parse(localStorage.getItem(`messages_${groupId}`)) || [];
            const updatedMessages = [...storedMessages, ...chats];
            localStorage.setItem(`messages_${groupId}`, JSON.stringify(updatedMessages));
        }
    }).catch((err) => {
        console.error(err);
    });
}

function appendNewChatsToUI(newChats) {
    const ul = document.getElementById('messageList');
    newChats.forEach((chat) => {
        if (!document.querySelector(`#messageList li[data-chat-id="${chat.id}"]`)) {
            const li = document.createElement('li');
            li.setAttribute('data-chat-id', chat.id);

            const userSpan = document.createElement('span');
            userSpan.textContent = `${chat.username}: `;
            li.appendChild(userSpan);

            if (chat.fileUrl) {
                const link = document.createElement('a');
                link.href = chat.fileUrl;
                link.target = '_blank'; // Open in new tab
                link.rel = 'noopener noreferrer'; // Security best practice for links opening in new tabs

                if (chat.fileUrl.match(/\.(jpeg|jpg|gif|png)$/)) {
                    const img = document.createElement('img');
                    img.src = chat.fileUrl;
                    img.style.maxWidth = '200px';
                    img.style.cursor = 'pointer'; // Change cursor to indicate clickable
                    link.appendChild(img);
                } else {
                    link.textContent = 'Download File';
                }

                li.appendChild(link);
            }

            if (chat.message) {
                const messageSpan = document.createElement('span');
                messageSpan.textContent = chat.message;
                li.appendChild(messageSpan);
            }

            ul.appendChild(li);
        }
    });
}

function handleFormSubmit(event) {
    event.preventDefault();
    if (!currentGroupId) {
        alert("Please select a group first");
        return;
    }
    const messageInput = document.querySelector('.chat-input');
    const message = messageInput.value;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!message.trim() && !file) {
        return; // Don't send empty messages or without a file
    }

    const formData = new FormData();
    formData.append('message', message);
    formData.append('groupId', currentGroupId);
    if (file) {
        formData.append('file', file);
    }

    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/chat/msg', formData, {
        headers: { 
            'Authorization': token,
            'Content-Type': 'multipart/form-data'
        }
    }).then((res) => {
        console.log(res);
        // Update UI immediately after sending the message
        const newMessage = {
            id: res.data.chatId,
            message: message,
            username: res.data.username,
            fileUrl: res.data.fileUrl,
            createdAt: res.data.createdAt
        };
        appendNewChatsToUI([newMessage]);
        messageInput.value = ''; // Clear the input field
        fileInput.value = ''; // Clear the file input
    }).catch((err) => {
        console.error(err);
    });
}

function handleNewMessage(message) {
    appendNewChatsToUI([message]);
    lastMessageIds[currentGroupId] = Math.max(lastMessageIds[currentGroupId], message.id);
    // Store the updated last message ID for this group in localStorage
    localStorage.setItem(`lastMessageId_${currentGroupId}`, lastMessageIds[currentGroupId]);
    // Update stored messages in localStorage
    const storedMessages = JSON.parse(localStorage.getItem(`messages_${currentGroupId}`)) || [];
    storedMessages.push(message);
    localStorage.setItem(`messages_${currentGroupId}`, JSON.stringify(storedMessages));
}

function fetchGroupMembers(groupId) {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3000/group/${groupId}/members`, {
        headers: { 'Authorization': token }
    }).then((res) => {
        displayGroupMembers(res.data.members, res.data.isUserAdmin);
    }).catch(console.error);
}

// New function to display group members
function displayGroupMembers(members, isUserAdmin) {
    const memberList = document.getElementById('memberList');
    memberList.innerHTML = '';
    members.forEach(member => {
        const li = document.createElement('li');
        li.textContent = member.username;
        
        if (member.isAdmin) {
            const adminLabel = document.createElement('span');
            adminLabel.textContent = ' (Admin)';
            adminLabel.classList.add('admin-label');
            li.appendChild(adminLabel);
        }
        
        if (isUserAdmin && !member.isAdmin) {
            const makeAdminBtn = document.createElement('button');
            makeAdminBtn.textContent = 'Make Admin';
            makeAdminBtn.onclick = () => makeAdmin(member.id);
            li.appendChild(makeAdminBtn);
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => removeUser(member.id);
            li.appendChild(removeBtn);
        }
        
        memberList.appendChild(li);
    });

    // Show/hide the "Add to Group" section based on admin status
    const addToGroupSection = document.querySelector('.add-to-group');
    if (addToGroupSection) {
        addToGroupSection.style.display = isUserAdmin ? 'block' : 'none';
    }
}

function searchUsers(query) {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3000/group/search-users?query=${query}&groupId=${currentGroupId}`, {
        headers: { 'Authorization': token }
    }).then((res) => {
        displaySearchResults(res.data.users);
    }).catch(console.error);
}

function displaySearchResults(users) {
    const searchResultsList = document.getElementById('searchResults');
    searchResultsList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        const username = document.createElement('div');
        username.className = 'username';
        username.textContent = user.username;
        userInfo.appendChild(username);
        
        const email = document.createElement('div');
        email.className = 'email';
        email.textContent = user.email;
        userInfo.appendChild(email);
        
        li.appendChild(userInfo);
        
        const addButton = document.createElement('button');
        addButton.textContent = 'Add';
        addButton.onclick = () => addMemberToGroup(currentGroupId, user.id);
        
        li.appendChild(addButton);
        searchResultsList.appendChild(li);
    });
}

function addMemberToGroup(groupId, userId) {
    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/group/add-member', 
        { groupId, userId },
        { headers: { 'Authorization': token } }
    ).then(() => {
        // Refresh the member lists
        fetchGroupMembers(groupId);
        document.getElementById('userSearchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }).catch(console.error);
}

function createGroup() {
    const groupName = prompt("Enter group name:");
    if (groupName) {
        const token = localStorage.getItem('token');
        axios.post('http://localhost:3000/group/create', { name: groupName }, {
            headers: { 'Authorization': token }
        }).then((res) => {
            console.log('Group created:', res.data);
            getUserGroups();
        }).catch((err) => {
            console.error('Error creating group:', err);
        });
    }
}

function makeAdmin(userId) {
    if (!currentGroupId) {
        alert("Please select a group first");
        return;
    }
    const token = localStorage.getItem('token');
    axios.post('http://localhost:3000/group/make-admin', { groupId: currentGroupId, userId }, {
        headers: { 'Authorization': token }
    }).then(() => {
        alert("User is now an admin of the group");
        fetchGroupMembers(currentGroupId);
    }).catch(error => {
        alert(error.response.data.message || "Error making user admin");
    });
}

function removeUser(userId) {
    if (!currentGroupId) {
        alert("Please select a group first");
        return;
    }
    if (confirm("Are you sure you want to remove this user from the group?")) {
        const token = localStorage.getItem('token');
        axios.post('http://localhost:3000/group/remove-user', { groupId: currentGroupId, userId }, {
            headers: { 'Authorization': token }
        }).then(() => {
            alert("User removed from the group");
            fetchGroupMembers(currentGroupId);
        }).catch(error => {
            alert(error.response.data.message || "Error removing user");
        });
    }
}

function getUserGroups() {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:3000/group/user-groups', {
        headers: { 'Authorization': token }
    }).then((res) => {
        console.log('Received groups:', res.data);
        displayGroups(res.data.groups);
    }).catch((err) => {
        console.error('Error fetching user groups:', err);
    });
}

function displayGroups(groups) {
    const groupList = document.getElementById('groupList');
    groupList.innerHTML = '';
    groups.forEach(group => {
        const li = document.createElement('li');
        li.textContent = group.name;
        li.setAttribute('data-group-id', group.id);
        li.onclick = () => switchGroup(group.id);
        groupList.appendChild(li);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    getUserGroups();
    document.getElementById('createGroupBtn').addEventListener('click', createGroup);
    
    const chatForm = document.getElementById('chatForm');
    chatForm.removeEventListener('submit', handleFormSubmit);
    chatForm.addEventListener('submit', handleFormSubmit);

    const userSearchInput = document.getElementById('userSearchInput');
    userSearchInput.addEventListener('input', (e) => {
        if (e.target.value.length >= 3) {
            searchUsers(e.target.value);
        } else {
            document.getElementById('searchResults').innerHTML = '';
        }
    });

    socket.on('new message', (message) => {
        console.log('New message received:', message);
        if (message.groupId === currentGroupId) {
            handleNewMessage(message);
        }
    });
});
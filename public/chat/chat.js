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
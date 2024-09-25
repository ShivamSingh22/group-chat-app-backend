function handleFormSubmit(event){
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    const messageLabel = document.querySelector('#msg-txt');

    const obj = {
        email:email,
        password:password
    }

    axios.post('http://43.205.209.88:3000/user/login', obj)
    .then((res)=>{
        localStorage.setItem('token', res.data.token);
        window.location.href = "../chat/chat.html";
        messageLabel.innerHTML = res.data.message;
        event.target.reset();
    })
    .catch(err=>{
        messageLabel.innerHTML = err.response.data.message;
        console.log(err);
    })
}
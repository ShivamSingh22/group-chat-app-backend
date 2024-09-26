function handleFormSubmit(event){
    event.preventDefault();
    
    const email = event.target.email.value;
    const password = event.target.password.value;
    const messageLabel = document.querySelector('#msg-txt');

    const obj = {
        email:email,
        password:password
    }

    axios.post('http://localhost:3000/user/login',obj)
    .then((res)=>{
        console.log('Login successful:', res.data);
        localStorage.setItem('token', res.data.token);
        window.location.href = "../chat/chat.html";
        messageLabel.innerHTML = res.data.message;
        event.target.reset();
    })
    .catch(err=>{
        console.error('Login error:', err);
        messageLabel.innerHTML = err.response ? err.response.data.message : 'An error occurred';
    })
}
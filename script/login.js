function fun(){
    let uname=document.getElementById("user").value
    let passd=document.getElementById("pw").value
    if(uname=="yashi pandey" && passd=="yashi#123")
    {
        alert("Login Successfull!")
        window.location.href='http://127.0.0.1:5500/admin.html'
    }
    else{
        alert("please enter correct username and password")
        return
    }
    
    }
const mensajeError = document.getElementsByClassName("error")[0]

document.getElementById("login-form").addEventListener("submit", async (e) =>{
    e.preventDefault();
    const correo = e.target.children.correo.value;
    const contrasena = e.target.children.contrasena.value;

    const res = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            correo, contrasena
        })
    });
    if(!res.ok){
        return mensajeError.classList.toggle("escondido", false);
    }else{
        const resJson = await res.json();
        if(resJson.redirect){
            window.location.href = resJson.redirect;
        }
    }
})
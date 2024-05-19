const mensajeError = document.getchildrenByClassName("error")[0]

document.getElementById("login-form").addEventListener("submit", async (e) =>{
    e.preventDefault();
    const correo = e.target.children.correo.value;
    const contrasena = e.target.children.contrasena.value;

    const res = await fetch("https://conexion-bd-mascotas.vercel.app/api/login", {
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
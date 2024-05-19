const mensajeError = document.getchildrenByClassName("error")[0];

document.getElementById("registro-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log(e.target.children.correo.value);
    const res = await fetch("https://conexion-bd-mascotas.vercel.app/api/registro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: e.target.children.nombre.value,
            apellidoP: e.target.children.apellidoP.value,
            apellidoM: e.target.children.apellidoM.value,
            correo: e.target.children.correo.value,
            contrasena: e.target.children.contrasena.value
        })
    })
    if(!res.ok){
        return mensajeError.classList.toggle("escondido", false);
    }else{
        const resJson = await res.json();
        if(resJson.redirect){
            window.location.href = resJson.redirect;
        }
    }
})
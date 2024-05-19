const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("registro-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log(e.target.elements.correo.value);
    const res = await fetch("https://conexion-bd-mascotas.vercel.app/api/registro", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: e.target.elements.nombre.value,
            apellidoP: e.target.elements.apellidoP.value,
            apellidoM: e.target.elements.apellidoM.value,
            correo: e.target.elements.correo.value,
            contrasena: e.target.elements.contrasena.value
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
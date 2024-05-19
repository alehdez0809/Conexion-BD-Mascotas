import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";
import fetch from "node-fetch";

const JWT_SECRET = 'mi_clave_secreta_token';



dotenv.config();

async function soloAdmin(req, res, next){
    const loggeado = await revisarCookie(req);
    if(loggeado){
        return next();
    }else{
        return res.redirect("/");
    }
}

async function soloPublico(req, res, next){
    const loggeado = await revisarCookie(req);
    if(!loggeado){
        return next();
    }else{
        return res.redirect("/inicio");
    }
}

async function revisarCookie(req){

    try{
        const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
        const decodificada = jsonwebtoken.verify(cookieJWT, JWT_SECRET);
        console.log(decodificada);
        const response = await fetch("https://conexion-bd-mascotas.vercel.app/api/obtenerUsuarios"); 
        const usuarios = await response.json();
        const correoARevisar = usuarios.find(usuario => usuario.correo_usuario === decodificada.correo);
        if(!correoARevisar){
            return false;
        }else{
            return true;
        }
    }catch{
        return false;
    }
    
}


export const metodos = {
    soloAdmin,
    soloPublico
};
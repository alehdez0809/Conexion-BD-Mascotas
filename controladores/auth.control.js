import bcryptjs from "bcryptjs";
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const JWT_SECRET = 'mi_clave_secreta_token';
const JWT_EXPIRA = '7d';
const JWT_COOKIE_EXPIRES = 1;

async function login(req, res){
    console.log(req.body);
    const correo = req.body.correo;
    const contrasena = req.body.contrasena;
    if(!correo || !contrasena){
        return res.status(400).send({status: "Error", message: "Los campos están incompletos"});
    }else{
        const response = await fetch("https://conexion-bd-mascotas.vercel.app/api/obtenerUsuarios"); 
        const usuarios = await response.json();
        const correoARevisar = usuarios.find(usuario => usuario.correo_usuario === correo);
        if(!correoARevisar){
            return res.status(400).send({status: "Error", message: "Error durante el login"});
        }else{
            const loginCorrecto = await bcryptjs.compare(contrasena, correoARevisar.contrasena_usuario);
            console.log(loginCorrecto);
            
            if(!loginCorrecto){
                return res.status(400).send({status: "Error", message: "Error durante el login"});
            }else{
                const token = jsonwebtoken.sign(
                    {correo:correoARevisar.correo_usuario}, 
                    JWT_SECRET,
                    {expiresIn: JWT_EXPIRA}
                );
                const cookie = {
                    expires: new Date(Date.now() + JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000) ,
                    path: "/"
                }
                res.cookie("jwt", token, cookie);
                res.send({status: "ok", message: "Usuario loggeado", redirect: "/inicio"})
            }
        }
    }
}

async function registro(req, res){

    const nombre = req.body.nombre;
    const apellidoP = req.body.apellidoP;
    const apellidoM = req.body.apellidoM;
    const correo = req.body.correo;
    const contrasena = req.body.contrasena;
    if(!nombre || !apellidoP || !apellidoM || !correo || !contrasena){
        return res.status(400).send({status: "Error", message: "Los campos están incompletos"});
    }else{
        const response = await fetch("https://conexion-bd-mascotas.vercel.app/api/obtenerUsuarios"); 
        const usuarios = await response.json();
        const correoARevisar = usuarios.some(usuario => usuario.correo_usuario === correo);
        if(correoARevisar){
            return res.status(400).send({status: "Error", message: "Este correo ya está registrado"});
        }else{
            const salt = await bcryptjs.genSalt(5);
            const hashContrasena = await bcryptjs.hash(contrasena, salt);
            const nuevoUsuario = {
                nombre: nombre, 
                apellidoP: apellidoP, 
                apellidoM: apellidoM, 
                correo: correo, 
                contrasena: hashContrasena
            }
            console.log(nuevoUsuario);
            const respuesta = await fetch("https://conexion-bd-mascotas.vercel.app/api/registrarUsuario", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(nuevoUsuario)
            });
            if(respuesta.ok){
                return res.status(201).send({status: "ok", message: "Usuario registrado exitosamente", redirect: '/'})
            }else{
                const errorData = await respuesta.json();
                return res.status(respuesta.status).send({status: "Error", message: errorData.error});
            }
        }
    }
}

export const metodos = {
    login, 
    registro
};
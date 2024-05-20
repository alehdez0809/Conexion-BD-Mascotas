import bcryptjs from "bcryptjs";
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';

import { con } from '../app.js';

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
        con.query('SELECT * FROM usuario WHERE correo_usuario = ?',[correo], async (error, result) => {
            if(error){
                return res.status(400).send({status: "Error", message: "Error al consultar a los usuarios"});
            }
            if(result.length === 0){
                return res.status(400).send({status: "Error", message: "El correo no está registrado"});
            }
            const loginCorrecto = await bcryptjs.compare(contrasena, result[0].contrasena_usuario);
            console.log(loginCorrecto);
            
            if(!loginCorrecto){
                return res.status(400).send({status: "Error", message: "La contraseña no coincide"});
            }else{
                const token = jsonwebtoken.sign(
                    {correo: result[0].correo_usuario}, 
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
        })
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
        con.query('SELECT * FROM usuario WHERE correo_usuario = ?', [correo], async (error, result) => {
            if(error){
                return res.status(400).send({status: "Error", message: "Error al consultar a los usuarios"});
            }
            if(result.length > 0){
                return res.status(400).send({status: "Error", message: "Este correo ya está registrado"});
            }
            const salt = await bcryptjs.genSalt(5);
            const hashContrasena = await bcryptjs.hash(contrasena, salt);
            con.query('INSERT INTO usuario (nombre_usuario, apellidop_usuario, apellidom_usuario, correo_usuario, contrasena_usuario) VALUES (?, ?, ?, ?, ?)', [nombre, apellidoP, apellidoM, correo, hashContrasena], async (error, result) => {
                if(error){
                    return res.status(400).send({status: "Error", message: "Error al registrar al usuario"});
                }
                res.send({status: "ok", message: "Usuario registrado exitosamente", redirect: "/"});
            })
        })
    }
}

export const metodos = {
    login, 
    registro
};
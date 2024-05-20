import express from 'express';
import mysql from 'mysql2';
import path from 'path';
import { fileURLToPath } from 'url';
import { metodos as autenticacion } from "./controladores/auth.control.js";
import { metodos as autorizacion} from "./middlewares/autorizacion.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import cookieParser from 'cookie-parser';

var app = express();

let mascotasHTML;

import { metodos } from "./config.js";

const con = mysql.createConnection({
    host: metodos.MYSQLHOST,
    user: metodos.MYSQLUSER,
    password: metodos.MYSQLPASSWORD,
    database: metodos.MYSQL_DATABASE,
    port: metodos.MYSQLPORT

});

con.connect(error => {
    if(error) throw error;
    console.log('Conexión a la base de datos MySQL establecida');
});

//Config
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//Rutas
app.get("/", autorizacion.soloPublico, (req, res) => res.sendFile(__dirname + "/pages/login.html")); 
app.get("/registro", autorizacion.soloPublico, (req, res) => res.sendFile(__dirname + "/pages/registro.html")); 
app.get("/inicio", autorizacion.soloAdmin, (req, res) => res.sendFile(__dirname + "/pages/admin/index.html")); 

app.post("/api/registro", autenticacion.registro); 
app.post("/api/login", autenticacion.login); 

//Usuarios
app.get('/api/obtenerUsuarios', (req, res) => {
    const sql = "SELECT * FROM usuario";
    con.query(sql, (err, results) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            res.status(500).json({ error: 'Error al obtener los usuarios' });
            return;
        }
        res.json(results);
    });
});

app.post('/api/registrarUsuario', (req, res) =>{
    const query = 'INSERT INTO usuario (nombre_usuario, apellidop_usuario, apellidom_usuario, correo_usuario, contrasena_usuario) VALUES (?, ?, ?, ?, ?)';
    
    const nombre = req.body.nombre;
    const apellidoP = req.body. apellidoP;
    const apellidoM = req.body.apellidoM;
    const correo = req.body.correo;
    const contrasena = req.body.contrasena;
    const values = [nombre, apellidoP, apellidoM, correo, contrasena];
    con.query(query, values, (err) =>{
        if(err){
            return res.status(500).json({error: "Error al registrar cuenta"});
        }
        
        return res.status(201).json({status: "ok", message: "Cuenta registrada exitosamente"});
    }); 
});





app.post('/agregarMascota', (req, res) => {
    var { nombre, edad, especie, estado } = req.body;
    const sql = 'INSERT INTO mascota (nombre, edad, especie, estado) VALUES (?, ?, ?, ?)';
    con.query(sql, [nombre, edad, especie, estado], (err, resultado) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send(`<script>alert('Error al agregar la mascota'); window.location.href='/';</script>`);
        }
        if(parseInt(especie)===1){
            especie = "Perro";
        }else if(parseInt(especie)===2){
            especie = "Gato";
        }else if(parseInt(especie)===3){
            especie = "Cuyo";
        }else if(parseInt(especie)===4){
            especie = "Pez";
        }else{
            especie = "Ave";
        }  
        
        if(parseInt(estado)===1){
            estado = "Adoptado";
        }else{
            estado = "No adoptado";
        }    
        res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="/style.css" rel="stylesheet">
    <title>Mascota Agregada</title>
</head>
<body>
    <h1>Mascota agregada con éxito</h1>
    <div>
        <p>Nombre: ${nombre}</p>
        <p>Edad: ${edad}</p>
        <p>Especie: ${especie}</p>
        <p>Estado: ${estado}</p>
        <a href="/"><button>Regresar</button></a>
    </div>
</body>
</html>`);
    });
});



// Ruta para obtener mascotas
app.get('/obtenerMascota', autorizacion.soloAdmin ,(req, res) => {
    const sql = `
        SELECT m.id_mascota, m.nombre, m.edad, e.especie AS nombre_especie, s.estado AS nombre_estado
        FROM mascota m
        JOIN especie e ON m.especie = e.id_especie
        JOIN estado s ON m.estado = s.id_estado`;

    con.query(sql, (err, mascotas) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send(`<script>alert('Error al obtener las mascotas'); window.location.href='/';</script>`);
        }
        if (mascotas.length === 0) {
            mascotasHTML = `<tr><td colspan="5">No hay mascotas registradas</td></tr>`;
        } else {
            mascotasHTML = mascotas.map((mascota, index) => 
                `<tr>
                    <td>${index + 1}</td>
                    <td>${mascota.nombre}</td>
                    <td>${mascota.edad}</td>
                    <td>${mascota.nombre_especie}</td>
                    <td>${mascota.nombre_estado}</td>
                </tr>`
            ).join('');
        }
        res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="/style.css" rel="stylesheet">
    <style>
        body{
            margin: 0;
            padding: 30px;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
        }
    </style>
    <title>Lista de Mascotas</title>
</head>
<body>
    <h1>Lista de Mascotas</h1>
    <br>
    <table>
        <tr>
            <th>Id</th>
            <th>Nombre</th>
            <th>Edad</th>
            <th>Especie</th>
            <th>Estado</th>
        </tr>
        ${mascotasHTML}
    </table>
</body>
</html>`);
    });
});


app.get('/actualizarMascota', autorizacion.soloAdmin ,(req, res) => {
    con.query('SELECT * FROM mascota', (err, mascotas) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send('Error al obtener las mascotas para actualización');
        }
        let opcionesMascotas = mascotas.map(mascota => `<option value="${mascota.id_mascota}">${mascota.nombre}</option>`).join('');

        res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="/style.css" rel="stylesheet">
    <title>Actualizar Mascota</title>
    <style>
        .input{
            width: 266px;
        }
        .form1{
            flex-direction: row;
        }
    </style>
    <script>
        function cargarDatosMascota() {
            const mascotaId = document.getElementById('mascota').value;
            const posicion = document.getElementById('mascota').selectedIndex;
            if (posicion === 0) {
                document.getElementById('nombre').setAttribute('placeholder', 'Nuevo nombre');
                document.getElementById('nombre').setAttribute('readonly', true);
                document.getElementById('nombre').value = '';
                document.getElementById('edad').setAttribute('readonly', true);
                document.getElementById('edad').value = '';
                document.getElementById('especie').setAttribute('disabled', true);
                document.getElementById('estado').setAttribute('disabled', true);
                document.getElementById('botonActualizar').setAttribute('disabled', true);
            } else {
                document.getElementById('nombre').removeAttribute('readonly');
                document.getElementById('edad').removeAttribute('readonly');
                document.getElementById('especie').removeAttribute('disabled');
                document.getElementById('estado').removeAttribute('disabled');
                document.getElementById('botonActualizar').removeAttribute('disabled');
            }
            fetch('/obtenerDatosMascota?id=' + mascotaId)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('nombre').value = data.nombre;
                    document.getElementById('edad').value = data.edad;
                    document.getElementById('especie').value = data.especie;
                    document.getElementById('estado').value = data.estado;
                })
                .catch(error => console.error('Error al cargar los datos de la mascota:', error));
        }
        window.onload = cargarDatosMascota();
    </script>
</head>
<body>
    <h1>Actualizar Mascota</h1>
    <p>Selecciona una mascota:</p>
    <form action="/procesarActualizacionMascota" method="post">
        <div class="form1">
        <select name="id" id="mascota" onchange="cargarDatosMascota()">
            <option value="">Seleccione una mascota</option>
            ${opcionesMascotas}
        </select>
        <br>
        <br>
        <br>
        <input type="text" id="nombre" name="nombre" placeholder="Nuevo nombre" required class="input">
        <input type="number" id="edad" name="edad" placeholder="Nueva edad" required min="0" max="25" step="1">
        <select id="especie" name="especie">
            <option value="1">Perro</option>
            <option value="2">Gato</option>
            <option value="3">Cuyo</option>
            <option value="4">Pez</option>
            <option value="5">Ave</option>
        </select>
        <select id="estado" name="estado">
            <option value="1">Adoptado</option>
            <option value="2">No adoptado</option>
        </select>
        </div>
        <br>
        <input type="submit" value="Actualizar Mascota" id="botonActualizar">
    </form>
</body>
</html>`);
    });
});

// Nuevo endpoint para obtener datos de una mascota específica
app.get('/obtenerDatosMascota', (req, res) => {
    const { id } = req.query;
    const sql = 'SELECT * FROM mascota WHERE id_mascota = ?';
    con.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error al obtener datos de la mascota:', err);
            return res.status(500).json({ error: 'Error al obtener datos de la mascota' });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'Mascota no encontrada' });
        }
    });
});





app.post('/procesarActualizacionMascota', (req, res) => {
    const { id, nombre, edad, especie, estado } = req.body;
    const sql = 'UPDATE mascota SET nombre = ?, edad = ?, especie = ?, estado = ? WHERE id_mascota = ?';
    con.query(sql, [nombre, edad, especie, estado, id], (err, resultado) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send(`<script>alert('Error al agregar la mascota');</script>`);
        }
        res.send(`<script>alert('Mascota actualizada con éxito'); window.location.href='/';</script>`);
    });
});



app.get('/eliminarMascota', autorizacion.soloAdmin ,(req, res) => {
    con.query('SELECT * FROM mascota', (err, mascotas) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send('Error al obtener las mascotas para eliminación');
        }
        let opcionesMascotas = mascotas.map(mascota => `<option value="${mascota.id_mascota}">${mascota.nombre}</option>`).join('');

        res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="/style.css" rel="stylesheet">
    <title>Eliminar Mascota</title>
</head>
<body>
    <h1>Eliminar Mascota</h1>
    <form action="/procesarEliminacionMascota" method="post">
        <label for="mascota">Selecciona una mascota para eliminar:</label>
        <select name="id" id="mascota">${opcionesMascotas}</select>
        <br>
        <input type="submit" value="Eliminar Mascota">
    </form>
</body>
</html>`);
    });
});


app.post('/procesarEliminacionMascota', (req, res) => {
    const { id } = req.body;
    const sql = 'DELETE FROM mascota WHERE id_mascota = ?';
    con.query(sql, [id], (err, resultado) => {
        if (err) {
            console.log('ERROR: ', err);
            return res.status(500).send(`<script>alert('Error al eliminar la mascota'); window.location.href='/';</script>`);
        }
        res.send(`<script>alert('Mascota eliminada con éxito'); window.location.href='/';</script>`);
    });
});

export { app, con };



app.set("port", 4000)

app.listen(app.get("port"),()=>{

    console.log('servidor escuchando en el puerto ' + app.get("port"));

});
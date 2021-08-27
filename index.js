const express = require('express');
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const sessions = require('express-session');
const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require("url");
const mysql = require('mysql');
const uuid = require('uuid');

const dbCreds = fs.readFileSync('mysql_user.cred', 'utf8').split('\n');
const pool = mysql.createPool({//Connection({
	connectionLimit : 20,
	host : 'localhost',
	user : dbCreds[0],
	password : dbCreds[1],
	database : 'fog'
});

const db = require('./db.js')(pool);

const FILE_OPT = {root:'site'};

const app = express();
//const httpsServer = https.createServer(app); //TODO need to setup a letsencrypt cert
const httpServer = http.createServer(app);
//httpsServer.listen(443);
httpServer.listen(8001); //80
//TODO setup an http version for testing ease

app.use(function(req, res, next){
	console.log(req.url);
	next();
});

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(sessions({
	secret : uuid.v4(),
	saveUninitialized : true,
	cookie : { maxAge : 1000 * 10 },
	resave : false
}));
var session;


app.get('/', (req, res) => {
	//user from remote device connecting to landing page
	//req.session.destroy();
	session = req.session;
	let file = '/login.html';
	console.log(session);
	if(session && session.userid){
		file = '/index.html';
	}
	res.sendFile(file, FILE_OPT);
});

app.post('/user', (req, res) => {
	if(req.body.username == 'a' && req.body.password == 'b'){
		pool.getConnection( (err, conn) => {
			if(err) throw err;

			conn.query('SELECT user_id FROM user WHERE 1', (err, results, fields) => {
				console.log(results);
				conn.release();
			});
		});
		session = req.session;
		session.userid = req.body.username;
		console.log(req.session);
		res.send(`Hey there, welcome <a href=\'/logout'>click to logout</a>`);
	}else{
		res.send('Invalid');
	}
});

app.get('/logout', (req, res) => {
	delete session;
	req.session.destroy();
	res.redirect('/'); 
});

app.get("*.html$|*.css$|*.js$|/images/*|/fonts/*$", function(req, res){
	//oh fuck
	console.log(url.parse(req.url).pathname.substring(1));
	res.sendFile(url.parse(req.url).pathname.substring(1), FILE_OPT);
});

app.get('/service-ping/:serviceId', (req, res) => {
	//a registered client checking in
	//update its ip in the db if it has changed
	//if it is not recognized, reject or demand authentication... or have this always post with auth
});

//TODO other endpoints for navigating dashboard, connecting to LAN services

app.post('/dashboard/login', (req, res) => {
	
});

app.get('/dashboard/:userId/:token', (req, res) => {

});

app.post('/register-service', (req, res) => {

});

app.delete('/delete-service', (req, res) => {

});

app.post('/edit-service', (req, res) => {

});

app.post('/share-service', (req, res) => {
	
});

app.post('/connect/:serviceId/:path', (req, res) => {
	//pass through ssh tunnel the user request, display response
});



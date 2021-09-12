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
const yargs = require('yargs');


const dbCreds = fs.readFileSync('mysql_user.cred', 'utf8').split('\n');
const pool = mysql.createPool({//Connection({
	connectionLimit : 20,
	host : 'localhost',
	user : dbCreds[0],
	password : dbCreds[1],
	database : 'fog'
});

const db = require('./db.js')(pool);

const argv = yargs
	.command('debug', 'Set the server to a debug mode which does not validate sessions for easier testing')
	.help()
	.alias('help', 'h')
	.argv;

const DEBUG = argv.debug;
if(DEBUG){
	console.log('DEBUG MODE');
}


const FILE_OPT = {root:'site'};

const app = express();
//const httpsServer = https.createServer(app); //TODO need to setup a letsencrypt cert
const httpServer = http.createServer(app);
//httpsServer.listen(443);
httpServer.listen(8001); //80
//TODO setup an http version for testing ease

app.use(function(req, res, next){
	console.log('USE LOG');
	console.log(req.url);
	next();
});

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(sessions({
	secret : 'Secret TODO',//uuid.v4(),
	saveUninitialized : true,
	cookie : { maxAge : 1000 * 10 },
	resave : false
}));
var session;

//check session
app.use( (req, res, next) => {
	if(DEBUG){
		next();
	}else{
		console.log('CHECK SESSION');
		console.log(req.url);
		if( (!req.session || !req.session.session_id) && !isResource(req.url)){
			console.log('NO SESSION, sending login page');
			res.sendFile('/login.html', FILE_OPT);
		}else{
			next();
		}
	}
});

function isResource(url){
	return url.indexOf('/style/') > -1 || url.indexOf('/js/') > -1 || url.indexOf('/images/') > -1 || url.indexOf('/login') > -1 || url.indexOf('/register') > -1;
}

app.use(express.static('site'));

app.get('/', (req, res) => {
	//user from remote device connecting to landing page
	//req.session.destroy();
	//session = req.session;
	//let file = '/login.html';
	//console.log(session);
	//if(session && session.user_id){
		file = '/index.html';
	//}
	res.sendFile(file, FILE_OPT);
});
/*
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
*/
app.post('/login', (req, res) => {
	db.login(req.body.username, req.body.password, function(sessionId, userId){
		if(!sessionId){
			//leave
			console.log('bad login');
			//res.redirect('/login.html?result=false');
			res.send({
				'status': false
			});//File('/login.html?result=false', FILE_OPT);
		}else{
			console.log('good login');
			req.session.session_id = sessionId;
			req.session.user_id = userId;			
			//cool allow them into the dashboard and setup the session
			//res.redirect('/dashboard');
			res.send({
				'status':true,
				'goto': '/dashboard/'+userId
				//TODO session id or something, so that they can navigate where they want 
			});
		}
	});
});

app.get('/logout', (req, res) => {
	delete session;
	req.session.destroy();
	res.redirect('/'); 
});

app.post('/register', (req, res) => {
	let email = req.body.username;
	let pass = req.body.password;
	let conf = req.body['confirm-password'];
	if(!passwordStrength(pass) || (pass !== conf)){
		res.send(JSON.stringify({'error':'bad or non-matching password'}));
	}else{
		db.register(email, pass, function(result){
			if(result){
				//registered
				console.log('registration success! welcome '+email);
			}else{
				console.log('registration failed... sorry '+email);
			}
		});
	}
});


app.get("*.html$|*.css$|*.js$|/images/*|/fonts/*$", function(req, res){
	//oh fuck
	console.log('get: '+req.url);
	console.log(url.parse(req.url).pathname.substring(1));
	res.sendFile(url.parse(req.url).pathname.substring(1), FILE_OPT);
});

app.get('/service-ping/:serviceId', (req, res) => {
	//a registered client checking in
	//update its ip in the db if it has changed
	//if it is not recognized, reject or demand authentication... or have this always post with auth
});

//TODO other endpoints for navigating dashboard, connecting to LAN services

app.get('/dashboard', (req, res) => {
	//TODO
	res.sendFile('dashboard.html');
});

app.get('/dashboard/:userId', (req, res) => {
	res.sendFile('dashboard.html', FILE_OPT);
});

app.get('/dashboard/data/:userId', (req, res) => {
	//TODO security issue: check that req.session.userId = the parameter user id and exit if not
	db.getAllWhere('device', {user_id: req.params.userId}, function(result){
		res.send(result);
	});
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

app.get('/confirm-email/:confId', (req, res) => {
	//TODO look it up, if good return it
});

function passwordStrength(pass){
	return true;
	//return pass.length >= 8; //yeah i know, needs some improvement
}


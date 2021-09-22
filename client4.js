const process = require('process');
const http = require('http');
const https = require('https');
const express = require('express'); //use this instead of http for the proxy, better cookie support
const sessions = require('express-session');
const cookieParser = require("cookie-parser");
const mime = require('mime');

const proxyMap = {
	// /start-service/08173b7d-5b5e-4882-82f9-7ec7243299a8/7e5d6bba-2d5f-498f-99bf-7efd656351b6
	// Or4nG3fir3
	'08173b7d-5b5e-4882-82f9-7ec7243299a8' : {
		token : '7e5d6bba-2d5f-498f-99bf-7efd656351b6',
		host : '192.168.1.1',
		port : 80
	},
	'59377abc-4a63-4dcf-a0bd-f4b78aeccd55' : {
		token : '646b3cf6-1df4-4ced-aa06-f14fa48af6ae',
		host : 'www.google.com',
		port : 80
	}
}

const app = express();

const httpServer = http.createServer(app);

httpServer.listen(9001);

app.use(function(req, res, next){
	console.log(req.url);
	next();
});

app.use(express.json());
app.use(express.urlencoded({ extended : true }));
//app.use(cookieParser());
app.use(sessions({
	secret : 'Secret TODO',//uuid.v4(),
	saveUninitialized : false,
	cookie : { maxAge : 1000 * 10, httpOnly: true },
	resave : false
}));

app.get('/start-service/:serviceId/:token', (req, res, next) => {
	console.log('candidate initializer');
	let serviceId = req.params.serviceId;
	let token = req.params.token;
	console.log(req.params);
	console.log(serviceId);
	console.log(token);

	if(isUUIDv4(serviceId) && proxyMap[serviceId]){
		console.log('adding session');
		//check token too in the future
		req.session.serviceId = serviceId;
		req.session.token = token;
		res.redirect('/');
	}else{
		//res.sendStatus(404);
		next();
	}
});

app.use('*', (req, res, next) => {
	if(!req.session){
		console.log('no session');
		next();
	}else{
		console.log('existing session');
		console.log(req.session);
		let serviceId = req.session.serviceId;
		if(isUUIDv4(serviceId) && proxyMap[serviceId]){
			proxy(req, res);
		}else{
			next();//res.sendStatus(403);
		}
	}
});

function proxy(req, res){
	console.log('attempting to proxy');
	let serviceId = req.session.serviceId;
	let service = proxyMap[serviceId];

	if(service){
		console.log('proxying');
		let opt = {
			hostname: service.host,
			port: service.port,
			method: req.method,
			headers: req.headers,
			path: req.url
		};

		let proxy = http.request(opt, function(proxy_res){
			console.log(proxy_res.headers);
			//res.writeHead(proxy_res.statusCode, proxy_res.headers);
			proxy_res.pipe(res, {end: true});
		});

		req.pipe(proxy, {end: true});
	}
}

function isUUIDv4(str){
	return str && str.match(/^([0-9]|[a-f]){8}\-([0-9]|[a-f]){4}\-4([0-9]|[a-f]){3}\-[8,9,a,b]([0-9]|[a-f]){3}\-([0-9]|[a-f]){12}$/i) !== null;
}

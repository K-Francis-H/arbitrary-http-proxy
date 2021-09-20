const process = require('process');
const http = require('http');
const https = require('https');
const express = require('express'); //use this instead of http for the proxy, better cookie support
const cookieParser = require("cookie-parser");
const mime = require('mime');

/*const proxyMap = [
	{
		base : '/router',
		host : '192.168.1.1',
		port : 80
	},
	{
		base : '/google',
		host : 'www.google.com',
		port : 80
	}
];*/

const proxyMap = {
	'123' : {
		token : 'abc',
		host : '192.168.1.1',
		port : 80
	},
	'345' : {
		token : 'abc',
		host : 'www.google.com',
		port : 80
	}
}

function findMatch(url){
	console.log(url);
	for(let i=0; i < proxyMap.length; i++){
		console.log('checking: '+url+' includes '+proxyMap[i].base);
		if(url.includes(proxyMap[i].base)){
			return proxyMap[i];
		}
	}
	return false;
}
//TODO switch back to basic http lib, parse cookies manually, its easier than reconfiguring express
const app = express();
app.use(cookieParser());

app.use( (req, res, next) => {
	console.log(req.url);
	
	if(req.url.includes('/setup-fog-session/')){
		next();
		return;
	}
	
	if(req.cookies){
		console.log(req.cookies);
		let serviceId = req.cookies.serviceId;
		let token = req.cookies.token;
		if(proxyMap[serviceId] && proxyMap[serviceId].token === token){
			proxyRequest(req, res, serviceId);
		}else{
			next();
		}
	}else{
		//no auth
		next();
	}
});

app.get('/setup-fog-session/:serviceId/:token', (req, res) => {
	//build a session and redirect to the mapping
	let serviceId = req.params.serviceId;
	let token = req.params.token;
	if(proxyMap[serviceId] && proxyMap[serviceId].token === token){
		res.cookie('serviceId', serviceId);
		res.cookie('token', token);
		res.redirect('/');
	}
});

function proxyRequest(inReq, inRes, serviceId){
	let prx = proxyMap[serviceId];

	let opt = {
		hostname : prx.host,
		port : prx.port,
		method : inReq.method,
		headers : inReq.headers,
		path : inReq.url
	};

	var proxy = http.request(opt, function(res){
		//console.log(res);
		//res.setHeader('Content-type', mime.lookup(this.url));
		res.pipe(inRes, {
			end : true
		});
	});

	console.log(proxy.headers);

	inReq.pipe(proxy, {
		end : true
	});
}

const httpServer = http.createServer(app);
httpServer.listen(9800); 




/*
let routingServer = http.createServer( (ext_req, ext_res) => {
	console.log(ext_req.url);
	let route = findMatch(ext_req.url);
	if(route){
	
		//need to get the base url (part that maps) and remove it from everything else
		

		let prx = route;
		//let path = ext_req.url.replace(
		let opt = {
			hostname : prx.host,//httpMap[serviceId][host],
			port : prx.port,//httpMap[serviceId][port],
			method : ext_req.method,
			headers : ext_req.headers,
			path : ext_req.url.replace(route.base, '') //this ones harder need to track it and set it on the back of the forward request
		}
		
		var proxy = http.request(opt, function(res){
			console.log(res);
			console.log(res.headers);
			console.log('RESURL: '+res.url);
			//pipe the incoming response to the original requestor
			ext_res.writeHead(res.statusCode, res.headers);
			ext_res.cookie('base', route.base);
			//ext_res.cookie('prxoy-session', ext_req.ip)
			res.pipe(ext_res, {
				end: true
			});
		});

		//pipe the body of the incoming request into the proxy outgoing request
		ext_req.pipe(proxy, {
			end: true
		});
	
	}else if(ext_req.cookies){
		console.log(req.cookies);
		
	}else{
		ext_res.writeHead(404, { 'Content-Type': 'text/plain' });
		ext_res.write('404 Not Found');
		ext_res.end();
	}

/*
	let opt = {
		hostname : 'www.google.com',//httpMap[serviceId][host],
		port : 80,//httpMap[serviceId][port],
		method : ext_req.method,
		headers : ext_req.headers,
		path : ext_req.url //this ones harder need to track it and set it on the back of the forward request
	};

	var proxy = http.request(opt, function(res){
		//pipe shit back to the real client, maybe rewrite links fuck
		//TODO

		//pipe the incoming response to the original requestor
		ext_res.writeHead(res.statusCode, res.headers);
		res.pipe(ext_res, {
			end: true
		});
	});

	//pipe the body of the incoming request into the proxy outgoing request
	ext_req.pipe(proxy, {
		end: true
	});
*/

//});

//routingServer.listen(9800);


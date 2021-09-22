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

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

function setCookie(res, cookies){
	res.setHeader('Set-Cookie', cookies);
}

let proxyServer = http.createServer( (inReq, inRes) => {
	//get cookies

	let cookies = parseCookies(inReq);
	console.log(inReq.url);
	console.log(cookies);

	if(cookies.serviceId && cookies.token){
		console.log('proxying');
		proxyRoute(inReq, inRes);
		return;
	}else{
		console.log('checking path');
		//check the url
		let parts = inReq.url.split('/');
		let serviceId, token;
		console.log(parts);
		if(parts[1] /*&& isUUIDv4(parts[1])*/){
			serviceId = parts[1];
			
		}
		if(parts[2] /*&& isUUIDv4(parts[2])*/){
			token = parts[2];
		}
		if(serviceId && token && proxyMap[serviceId] && proxyMap[serviceId].token == token){
			setCookie(inRes, ['serviceId='+serviceId, 'token='+token]);
			//console.log(res.headers);
			//inRes.writeHead(302, {
			//	location : '/'
			//});
			//inRes.end();
			proxyRoute(inReq, inRes, '/');
			return;
		}else{
			//just let it ride on to the 403 forbidden call
		}
		
	}

	inRes.writeHead(403);
	inRes.write('Forbidden');
	inRes.end();

	//check for cookies
		//if cookies
			//and the specific cookies we need
				//route user to service via proxy

	//else
		//check for url params
			//set cookies if params exist

	//otherwise
		//exit 403
});

function proxyRoute(inReq, inRes, path){
	let cookies = parseCookies(inReq);
	let serviceId = cookies.serviceId;
	let token = cookies.token;
	let url = path || inReq.url;
	
	if(proxyMap[serviceId] && proxyMap[serviceId].token == token){
		let prx = proxyMap[serviceId];
		//let path = ext_req.url.replace(
		//inReq.setHeader('Cookie', ['serviceId='+serviceId, 'token='+token]);
		let headers = JSON.parse(JSON.stringify(inReq.headers));
		headers
		let opt = {
			hostname : prx.host,//httpMap[serviceId][host],
			port : prx.port,//httpMap[serviceId][port],
			method : inReq.method,
			headers : inReq.headers,
			path : path
		}
		

		var proxy = http.request(opt, function(res){
			//pipe shit back to the real client, maybe rewrite links fuck
			//TODO

			//pipe the incoming response to the original requestor
			inRes.writeHead(res.statusCode, res.headers);
			res.pipe(inRes, {
				end: true
			});
		});

		//pipe the body of the incoming request into the proxy outgoing request
		inReq.pipe(proxy, {
			end: true
		});
	}
}

function isUUIDv4(str){
	return str && str.match(/^([0-9]|[a-f]){8}\-([0-9]|[a-f]){4}\-4([0-9]|[a-f]){3}\-[8,9,a,b]([0-9]|[a-f]){3}\-([0-9]|[a-f]){12}$/i) !== null;
}

proxyServer.listen(9800);


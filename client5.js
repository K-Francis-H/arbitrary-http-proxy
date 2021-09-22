const process = require('process');
const http = require('http');
const https = require('https');
const express = require('express'); //use this instead of http for the proxy, better cookie support
const sessions = require('express-session');
const cookieParser = require("cookie-parser");
const mime = require('mime');
const cookie = require('cookie');
const url = require('url');

const proxyMap = {
	// /08173b7d-5b5e-4882-82f9-7ec7243299a8/7e5d6bba-2d5f-498f-99bf-7efd656351b6
	// ?service=08173b7d-5b5e-4882-82f9-7ec7243299a8&token=7e5d6bba-2d5f-498f-99bf-7efd656351b6
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
};

let proxyServer = http.createServer( (req, res) => {

		//this works.
		//But I need the routing to be dynamic so...
		//we need to listen on a path for the serviceId/token and
		//then create a reliable way to figure out who we're talking to
		//so we can index the right host map and proxy to it
		console.log(req.url);
		//console.log(req.headers['user-agent']);
		//console.log(req.socket.remoteAddress);
		//console.log(req.headers['x-forwarded-for']);

		let cookies = cookie.parse(req.headers.cookie || '');
		console.log(cookies);

		let serviceId = cookies.serviceId;
		let token = cookies.token;

		if(req.url.includes(serviceId) || req.url.includes(token)){
			console.log('removing messed up url');
			//not sure why this happens but its annoying
			//just reset the url to /
			req.url = req.url.replace('/'+serviceId, '');
			req.url = req.url.replace('/'+token, '');
			console.log('cleaned url: '+req.url);
		}	

		let responseHandled = false;

		if(!serviceId && pathIsCandidateSession(req)){
			console.log('creating session');
			responseHandled = startNewSession(req, res);
		}
		else if(isUUIDv4(serviceId) && proxyMap[serviceId]){
			console.log('proxying');
			let service = proxyMap[serviceId];
			responseHandled = proxy(req, res, service);
		}


		if(!responseHandled){
			res.statusCode = 403;
			res.write('403 Forbidden');
			res.end();
		}
});

function proxy(req, res, service){
	if(service){
		let opt = {
			host: service.host,
			port: service.port,
			method: req.method,
			headers: req.headers,
			path: req.url
		};

		let proxy = http.request(opt, function(proxyRes){
			res.writeHead(proxyRes.statusCode, proxyRes.headers);
			proxyRes.pipe(res, {
				end: true
			});
		});

		req.pipe(proxy, {
			end: true
		});
		return true;
	}
	return false;
}

function pathIsCandidateSession(req){
	let params = url.parse(req.url, true).query;
	let serviceId = params.service;
	let token = params.token;

	if(serviceId && isUUIDv4(serviceId)){
		return true;
	}


/*	if(!url || url == ''){return false;}
	url = url.substring(1); //cut off first '/'
	let parts = url.split('/');
	if(parts.length == 1 && isUUIDv4(parts[0]) ){// && isUUIDv4(parts[1])){
		return true;
	}
*/
	return false;
}

function startNewSession(req, res){
	let params = url.parse(req.url, true).query;
	let serviceId = params.service;
	let token = params.token;
	if(isUUIDv4(serviceId) && proxyMap[serviceId]){
		console.log('redirecting to /');
		//check token
		//create session
		res.setHeader('Set-Cookie', cookie.serialize('serviceId', serviceId) );
		res.statusCode = 302;
		res.setHeader('Location', '/');
		res.end();
		
		return true;
	}
	//otherwise continue, maybe its a legit session already
}

function isUUIDv4(str){
	return str && str.match(/^([0-9]|[a-f]){8}\-([0-9]|[a-f]){4}\-4([0-9]|[a-f]){3}\-[8,9,a,b]([0-9]|[a-f]){3}\-([0-9]|[a-f]){12}$/i) !== null;
}

proxyServer.listen(9800);

const process = require('process');
const http = require('http');
const https = require('https');
const express = require('express'); //use this instead of http for the proxy, better cookie support
const sessions = require('express-session');
const cookieParser = require("cookie-parser");
const mime = require('mime');

const proxyMap = {
	// /08173b7d-5b5e-4882-82f9-7ec7243299a8/7e5d6bba-2d5f-498f-99bf-7efd656351b6
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

let proxyServer = http.createServer( (req, res) => {

		//this works.
		//But I need the routing to be dynamic so...
		//we need to listen on a path for the serviceId/token and
		//then create a reliable way to figure out who we're talking to
		//so we can index the right host map and proxy to it

		let service = proxyMap['08173b7d-5b5e-4882-82f9-7ec7243299a8'];
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
});

proxyServer.listen(9800);

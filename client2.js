const process = require('process');
const http = require('http');
const https = require('https');

const proxy = require('redbird')({port : 10080});

//proxy.register("localhost"
//proxy.register('https://fog.com/:serviceId/:token/', 'http://local_ip:local_port')

const SERVERS = [
	'localhost',
	'97.107.136.236'
];

function httpPing(){
	http.get('https://'+SERVERS[0]+'/'+CLIENT_SECRET, (res) => {
		let raw = '';
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			raw += chunk;
		});
		res.on('end', () => {
			try{
				let response = JSON.parse(raw);
				//TODO see what needs to be done, set up connections etc.
				handleResponse(response);
			}catch(e){
				console.log(e);
			}
		});
	});
}

function handleResponse(json){

	for(let i=0; i < json.addServices.length; i++){
		let service = json.addServices[i];
		proxy.register('fog.com/'+service.id+'/'+service.token, service.localPath+':'+service.localPort);
		if(service.timeout){
			function(){
				setTimeout(function(){
					prox.unregister('fog.com/'+service.id+'/'+service.token, service.localPath+':'+service.localPort);
				}, service.timeout);
			}();
		}
	}
	for(let i=0; i < json.removeServices.length; i++){
		let service = json.addServices[i];
		proxy.unregister('fog.com/'+service.id+'/'+service.token, service.localPath+':'+service.localPort);
	}
/*
	if(json.setupServices.length > 0){
		let remotePort = json.setupServices[i].port;
		let localService = json.setupServices[i].service;
			//contains serviceId : uuidv4
			//service localhost : wherever its hosted on the local net... here: localhost, my printer 192.168.2.150, etc
			//service protocol : http, ssh, etc
			//service port: <int> if not included try default for protocol
		//go through this and add services

		//run ssh -R SERVER[0]:remotePort 
		//proxy.register('fog.com/
	}
*/
}

//TODO connect to the server, either the url i setup or from a list of servers the user sets in config

//then begin pinging at a regular interval
//auth too, so the server knows who we are

//and handle recieving requests from the server...
//over https via express?
//or just plain tcp/ssl with an open socket for the whole session

//setup endpoint(s) to handle requests to be forwarded
const process = require('process');
const http = require('http');
const https = require('https');
const portControl = require('nat-puncher'); //don't really need except for udp protocols

const CLIENT_SECRET = ''

/*
portControl.probProtocolSupport()
.then( function(result){
	if(!result.natPmp && !result.pcp && !result.upnp){
		console.error('ERROR: No method to get around NAT available!');
		console.error('exiting...');
		process.exit(1);
	}else{
		init();
	}
});*/

const SERVERS = [
	'localhost',
	'97.107.136.236'
];

const httpMap = {};

//create local http(Ssh) server to recieve tunneled requests and route them based on the included service id and tmp token
let routingServer = http.createServer( (ext_req, ext_res) => {

	//allow a public passthrough, as well as a private blocking mechanism

	let url = ext_req.url;
	//split this and try to rip out the serviceId, tokenId
	let urlParts = url.split('/');
	let urlLen = urlParts.length;
	
	//wont work for the actual path since its appended on to these
	//best idea: run proxy on the remote server, the redirect to this port with headers that let it thorugh...
	//maybe not so secure though if one can find the port on their own
	let token = urlParts[urlLen-1];
	let serviceId = urlParts[urlLen-2];
	//this won't work we need some better way to track this...
	//maybe attach them as a query, or keep an ip map and maintain sessions
	//or keep the full path and remove it minus whats after the servceId/tokenId

	//or return an iframe page and embed the path, then use natural links

	let path = url.replace(ext_req.headers.host, ''); //will still leave the original serviceId/token/...
	//but we want just the content beyond serviceId/token/ or / otherwise...

	//TODO validate that these are uuidv4s
	if(httpMap[serviceId]){
		//we got one try to forward it
		let opt = {
			hostname : httpMap[serviceId][host],
			port : httpMap[serviceId][port],
			method : ext_req.method,
			headers : ext_req.headers,
			path : '/' //this ones harder need to track it and set it on the back of the forward request
		};

		var proxy = http.request(opt, function(res){
			//pipe shit back to the real client, maybe rewrite links fuck
			//TODO
			ext_res.writeHead(res.statusCode, res.headers);
			res.pipe(ext_res, {
				end: true
			});
		});

		ext_req.pipe(proxy, {
			end: true
		});

	}else{
		res.sendStatus(403);
	}
	

	//get params from request and forward to appropriate active service

	//if none found for given serviceId return 404

	//if token is bad 403 or no serviceId

	//if http protocol proxy it between the client and the local service
	//redirect to proxy that forwards to the service

	//if ssh... don't send here make a separate SOCKS server or SSH one
});
//routingServer.listen(

function init(){
	//create ping connection to server
	let pingCtl = setInterval(httpPing, 1000*10); //every 10 seconds check with server

	//wait for instruction

	//
}

function httpsPing(){
	//https.get('https://
}

function httpPing(){
	http.get('http://'+SERVERS[0]+'/'+CLIENT_SECRET, (res) => {
		let raw = '';
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			raw += chunk;
		});
		res.on('end', () => {
			try{
				let response = JSON.parse(raw);
				//TODO see what needs to be done, set up connections etc.
				//handleResponse(response);
			}catch(e){
				console.log(e);
			}
		});
	});
}

function setupHTTP(serviceInfo){
	/*
		serviceInfo : {
			serviceId : 	<uuidv4>,
			token :	   	<uuidv4>,
			host :		<local_private_ip or 'localhost'>,
			port :		<uint16>
		}
	*/

	//point an ssh tunnel from remote to our local routing proxy server
	httpMap[serviceId]
}

function setupSSH(){
	//point an ssh tunnel from remote to our local ssh
}

//setupSFTP or (S)FTP

function handleResponse(json){
	if(json.setupServices.length > 0){
		let remotePort = json.setupServices[i].port;
		let localService = json.setupServices[i].service;
			//contains serviceId : uuidv4
			//service localhost : wherever its hosted on the local net... here: localhost, my printer 192.168.2.150, etc
			//service protocol : http, ssh, etc
			//service port: <int> if not included try default for protocol
		//go through this and add services

		//run ssh -R SERVER[0]:remotePort 
	}
}

/*
> p.probeProtocolSupport()
Promise { <pending> }
> p
PortControl { dispatchEvent: undefined }
> p
PortControl { dispatchEvent: undefined }
> p.probeProtocolSupport().then( function(r){console.log(r);} )
Promise { <pending> }
> { natPmp: true, pcp: true, upnp: true }

> p.getPrivateIps()
Promise { [ '192.168.1.210', '192.168.250.1' ] }
> p.getActiveMappings()
Promise { {} }
> p.getPrivateIps().then( r => {console.log(r)} )
Promise { <pending> }
> [ '192.168.1.210', '192.168.250.1' ]


// Map internal port 50000 to external port 50000 with a 2 hr lifetime
portControl.addMapping(50000, 50000, 7200)

*/

const SERVER_ADDRESS = 'localhost';

//connect to local services and forward content

//load a local-services.config

//user can modify it from the server

//format 
/*
	{
		'service-name' : {
			'local-ip' : 'ipaddr',
			'port' : int(port)
			'path' : '/index.html'
			'auth' : {
				'type' : 'Basic, ...',
				'user' : 'user',
				'pass' : 'pass'
			}
		},
		...
	}
*/

//when server asks for a tunnel

ssh -N -R SERVER_ADDR:SERVER_SUPPLIED_PORT:localhost:loacl_service_port USER_ACCOUNT@SERVER_ADDR

//and kill it when the user session ends

//use ssh -L LOCALPORT:localhost:REMOTEPORT remotehost{the fog server}

//ssh -L LOCAL_SERVICE_PORT

//ssh -f -N -R 10022:localhost:22 -L19922:192.168.1.147:22 pi@192.168.1.147
//^ makes a tunnel to access hostb from port 10022 on hosta (192.168.1.147)
//when run from hostb (localhost)

//^use ssh -p 10022 hostb_user@localhost

//need to test using the tunnel to reroute http requests for security and access to services
//so try 443 or 80 instead of 22 for it


//maybe make a cli fog client
//Usage: fog user pass PROTOCOL

//https://juliansimioni.com/blog/howto-access-a-linux-machine-behind-a-home-router-with-ssh-tunnels/

//example
/*
	ssh -L localhost:9000:192.168.1.147:8080 pi@192.168.1.147
	
	the above binds port 9000 of localhost to 8080 on the remote.
	the traffic goes through an ssh tunnel and the website on
	remote:8080 is returned
*/



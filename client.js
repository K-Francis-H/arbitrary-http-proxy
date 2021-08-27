//TODO connect to the server, either the url i setup or from a list of servers the user sets in config

//then begin pinging at a regular interval
//auth too, so the server knows who we are

//and handle recieving requests from the server...
//over https via express?
//or just plain tcp/ssl with an open socket for the whole session

//setup endpoint(s) to handle requests to be forwarded
const http = require('http');
const https = require('https');

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



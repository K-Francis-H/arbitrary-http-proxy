const crypto = require('crypto');
const uuid = require('uuid');


module.exports = function(pool){
	return {
		//TODO all of your db calls
		
		getAll : function(table, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;

				conn.query('SELECT * FROM ? WHERE 1', [table], (err, results) => {
					if(err) throw err;
					conn.release();
					cb(results);
				});
			});
		},

		getAllWhere : function(table, opt, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;

				//build query
				let q = 'SELECT * FROM ? WHERE ';
				let paramNames = Object.keys(opt);
				let params = [table];
				for(let i=0; i < params.length; i++){
					q += paramNames[i]+' = ? ';
					params.push(opt[paramNames[i]]);
					if(i < params.length-1){
						q += 'AND ';
					}
				}

				conn.query(q, params, [table], (err, results) => {
					if(err) throw err;
					conn.release();
					cb(results);					
				});
			});
		},

		login : function(username, password, cb){
			
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				
				conn.query('SELECT salt FROM user WHERE (username = ? OR email = ?)', [username, username], (err, rows) => {
					if(err) throw err;
					if(rows.length == 0){ 
						//cb(false);
						//conn.release();
						//return;
						return cleanup(conn, cb); 
					}
					let hashword = crypto.scryptSync(
						password, 
						Buffer.from(rows[0].salt, 'base64'),
						128
					).toString('base64');
					console.log(hashword);
					console.log(username);
					conn.query('SELECT * FROM user WHERE (username = ? OR email = ?) AND password = ?', [username, username, hashword], (err, rows) => {
						if(err) throw err;
						console.log(rows);
						console.log(rows.length);
						if(rows.length == 0){
							console.log('no rows login');
							return cleanup(conn, cb);
						}
						//otherwise we should be good 2 login
						let user_id = rows[0].user_id;
						let session_id = uuid.v4();
						conn.query('INSERT INTO user_session (user_id, session_id) VALUES (?,?)', [user_id, session_id], (err, result) => {
							if(err) throw err;
							if(result.affectedRows > 0){
								//we good
								conn.release();
								cb(session_id);
							}else{
								return cleanup(conn, cb);
							}
						});
					});
						
					//if we have any rows -> they're real, give them a session and return it via cb
					//'SELECT * FROM user WHERE (username = ? OR email = ?) AND password = ?'
				});
			});
		},

		//the other parts of the user table can be filled out at the user's leisure
		register : function(email, password, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				//TODO validate inputs

				let salt = crypto.randomBytes(32).toString('base64');
				let userId = uuid.v4();
				let hashword = crypto.scryptSync(
					password, 
					Buffer.from(salt, 'base64'),
					128
				).toString('base64');
				
				conn.query('INSERT INTO user (user_id, password, salt, email) VALUES (?,?,?,?)', [userId, hashword, salt, email], (err, result) => {
					if(err) throw err;
					if(result.affectedRows > 0){
						cb(true);
					}else{
						console.log(result.message);
						cb(false);
					}
					conn.release();
				});
			});
		},

		generateDevice(user_id, nickname, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				let salt = crypto.randomBytes(32).toString('base64');
				let hashedOneTimeCode = crypto.scryptSync(
					generateOneTimeCode,
					Buffer.from(salt, 'base64'),
					128
				);
				conn.query('INSERT INTO device_register (device_id, user_id, nickname, one_time_code, salt) VALUES(?,?,?,?,?)', [uuid.v4(), user_id, nickname, hashedOneTimeCode, salt], (err, result) => {
					if(err) throw err;
					if(result.affectedRows > 0){
						cb(true);
					}else{
						cb(false);
					}
					conn.release();
				});
			});
		},

		registerDevice(username, one_time_code, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				/*conn.query('SELECT * FROM user WHERE username=? OR email=? AS u JOIN (SELECT * FROM device_register WHERE user_id IN (SELECT user_id FROM user WHERE', [username, username], (err, rows) => {
					if(err) throw err;
					if(rows.length < 1){

					}else{
						conn.query('SELECT * FROM
					}
				});*/
				conn.query('SELECT * FROM user WHERE username=? OR email=? AS u JOIN (SELECT * FROM device_register WHERE u.user_id IN (SELECT user_id FROM user WHERE username=? OR email=?) ) AS d ON u.ser_id=d.user_id', [username, username, username, username], (err, rows) => {
					if(err) throw err;
					if(rows.length < 1){
						//no device
						cb(false);
					}else{
						//TODO check one_time_code0
					}
				});
			});
		},

		//addPhoneNumber
		addPhoneNumber : function(user_id, phone, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				conn.query('UPDATE user SET phone = ? WHERE user_id =?', [phone, user_id], (err, result) => {
					if(err) throw err;
					if(result.affectedRows > 0){
						conn.release();
						cb(true);
					}else{
						return cleanup(conn, cb);
					}
				});
			});
		},

		//addUsername
		addPhoneNumber : function(user_id, username, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				conn.query('UPDATE user SET username = ? WHERE user_id =?', [username, user_id], (err, result) => {
					if(err) throw err;
					if(result.affectedRows > 0){
						conn.release();
						cb(true);
					}else{
						return cleanup(conn, cb);
					}
				});
			});
		},

		//generic
		update : function(table, id, opt, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;

				let q = 'UPDATE ? ';
				let params = [table];
				let set = Object.keys(opt.set);
				for(let i=0; i < set.length; i++){
					q += 'SET '+set[i]+' = ?';
					if(i < set.length-1){
						q += ', ';
					}
					params.push(opt.set[set[i]]);
				}
				q += ' WHERE ';
				let where = Object.keys(opt.where);
				for(let i=0; i < where.length; i++){
					q += where[i]+' = ? ';
					if(i < where.length-1){
						q += 'AND ';
					}
					params.push(opt.where[where[i]]);
				}
				conn.query(q, params, (err, result) => {
					if(err) throw err;
					if(result.affectedRows > 0){
						conn.release();
						cb(true);
					}else{
						return cleanup(conn, cb);
					}
				});
					
			});
		},

		insert : function(table, opt, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				let q = 'INSERT INTO ? ('
				let q2 = ' VALUES (';
				let params = [table];
				let params2 = [];
				let labels = Object.keys(opt);
				for(let i=0; i < labels.length; i++){
					q += '?';
					q2 +='?';
					if(i < labels.length-1){
						q +=',';
						q2 += ',';
					}else{
						q +=')';
						q2+=')';
					}
					params.push(labels[i]);
					params2.push(opt[labels[i]]);
				}
				q = q + q2;
				params = params.concat(params2);
				conn.query(q, params, (err, result) => {
					if(err) throw err;
					if(result.affecteRows > 0){
						conn.release();
						cb(true);
					}else{
						return cleanup(conn, cb);
					}
				});
			});
		},

		delete : function(table, opt, cb){
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				let q = 'DELETE FROM ? WHERE ';
				let params = [table];
				let where = Object.keys(opt);
				for(let i=0; i < where.length; i++){
					q += where[i]+' = ? ';
					if(i < where.length-1){
						q += 'AND ';
					}
					params.push(opt[where[i]]);
				}
				conn.query(q, params, (err, result) => {
					if(err) throw err;
					conn.release();
					cb(result.affectedRows > 0);
					/*if(result.affectedRows > 0){
						conn.release();
						cb(true);
					}else{
						return cleanup(conn, cb);
					}*/
				});
			});
		}

		//addDevice

		//addService

		//deleteDevice (recursively delete services)

		//deleteService

		//addSSHKey

		//deleteSSHKey

		

		

	};//end return
};

function cleanup(conn, cb){
	conn.release();
	cb(false);
}

function generateOneTimeCode(len){
	let code = '';
	for(let i=0; i < len; i++){
		code += ''+crypto.randomInt(0,9);
	}
	return code;
}

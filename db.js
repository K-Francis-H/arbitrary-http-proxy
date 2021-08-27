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
			function cleanup(conn, cb){
				conn.release();
				cb(false);
			}
			pool.getConnection( (err, conn) => {
				if(err) throw err;
				
				conn.query('SELECT salt FROM user WHERE (username = ? OR email = ?)', [username, username], (err, rows) => {
					if(err) throw err;
					if(results.length == 0){ 
						//cb(false);
						//conn.release();
						//return;
						return cleanup(conn, cb); 
					}
					let hashword = crypto.scryptSync(
						password, 
						Buffer.from(results[0].salt, 'base64'),
						128
					);
					conn.query('SELECT * FROM user WHERE (username = ? OR email = ?) AND password = ?', [username, username, hashword], (err, rows) => {
						if(err) throw err;
						if(results.length == 0){
							return cleanup(conn, cb);
						}
						//otherwise we should be good 2 login
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
					Buffer.from(results[0].salt, 'base64'),
					128
				);
				
				conn.query('INSERT INTO user (user_id, password, salt, email) VALUES (?,?,?,?)', [userId, hashword, salt, email], (err, result) => {
					if(err) throw err;
					if(result.affectedRows > 0){
						cb(true);
					}
				});
			});
		}

	};//end return
};

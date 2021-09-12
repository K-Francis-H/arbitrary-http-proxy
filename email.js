const mailgun = require("mailgun-js")({
	apiKey : "key-700dacff37c23496aa202d775174b304",
	domain : "mg.terraprint.co"//"sandboxfb86921cf44547debcd4aa3af366e9e8.mailgun.org"
});

const NO_REPLY = "Fog <noreply@fog.terraprint.co>";

const CONF_TEMPLATE = "Thank you for registering an account at fog.terraprint.co. Click the link below to confirm your email and activate your account.\n\n\nfog.terraprint.co/confirm-email/";

module.exports = {
	sendEmailConfirmation : function(email, confId){
	
		mailgun.messages().send({
			from : NO_REPLY,
			to : email,
			subject : 'Confirm Your Email',
			text : CONF_TEMPLATE+confId
		}, function(err, res){
			if(err) throw err;
			console.log(res);
		});
	}
};

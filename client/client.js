
/*Lineas mamada:
 * Partidas.find({}).forEach(function(elem){Partidas.remove(elem._id)})
 * Messages.find({}).forEach(function(elem){Messages.remove(elem._id)})
 */

Meteor.subscribe("messages");
Meteor.subscribe("partidas");
Meteor.subscribe("DatosUsuarios");

Meteor.startup(function(){
	screenauto();
});

var screenauto= function(){
console.log("scrauto")
	$("#containermain").css("width",document.documentElement.clientWidth.toString()+'px');
	$("#containermain").css("height",document.documentElement.clientHeight.toString()+'px');
	Meteor.setTimeout(screenauto,500)
};

$(function() {
	$( "#container2" ).tabs({ hide: { effect: "slide",direction:'up', duration: 100 }, show:{ effect: "slide",direction:'up', duration: 100 }  });
});


var Clip = function(msg,maxlen){
	if(msg.length>maxlen){
		var msgaux="";
		for(var i = 1;i<Math.floor(msg.length/maxlen);i++){
			msgaux+=msg.substring(maxlen*i,maxlen*(i+1))+"\n";
		}
		return msgaux;
	}else{
		return msg
	}
};

Template.input.events={
	'keydown input#message': function(event){
		if (event.which==13){
			var message=$("#message");
			if (message.val()!=""){
				var msg=Clip(message.val(),50);
				if (Meteor.user()){
					var name = Meteor.user().username;
				}else{
					var name="Anon";
				}
				Messages.insert({
					name:name,
					message:message.val(),
					time:Date.now()
				});
			}
			message.val("");	
		}
	}
}



Template.button.events={
	'click input.b1': function () {

	},
	'click input.b2': function(){

	}
}



Accounts.ui.config({
	passwordSignupFields:"USERNAME_AND_OPTIONAL_EMAIL"
});


Deps.autorun(function(){
	var chatArea = $('#firstRow');
	var msgs = Messages.find({},{sort:{time:-1}, limit:1});	
	msgs.forEach(function(message){
		chatArea.prepend("<tr><td><strong>"+message['name']+"</strong>:</td><td><div>"+message['message']+"</div></td>");
	});
});



Deps.autorun(function(){
	if (Meteor.user()){
		var user = Meteor.user();
		if(!user.puntuacion && user.puntuacion!=0){
			Meteor.call('InicializaCliente',user._id);
		}
	}
});




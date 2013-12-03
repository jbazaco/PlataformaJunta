
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

$(function(){
	$("#ListaPartidas1").hide();
	$("#ListaPartidas2").hide();
	$("#ListaPartidas3").hide();
	$("#game").hide()
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

	},
	'click a.juego1':function(){
		Session.set("Current_Game_Type","AlienInvasion");
		$("#ListaPartidas1").show(500);
		$("#ListaPartidas2").hide(500);
		$("#ListaPartidas3").hide(500);
		//     $("#game_alien").show(500);
		return false
	},
	'click a.juego2':function(){
		Session.set("Current_Game_Type","AngryFruits");
		$("#ListaPartidas2").show(500);
		$("#ListaPartidas1").hide(500);
		$("#ListaPartidas3").hide(500);
		//     $("#game_angry").show(500)
		$("#game").hide(500);
		return false
	},
	'click a.juego3':function(){
		Session.set("Current_Game_Type","Carca");
		$("#ListaPartidas3").show(500);
		$("#ListaPartidas1").hide(500);
		$("#ListaPartidas2").hide(500);
		//     $("#game_carca").show(500)
		$("#game").hide(500);
		return false
	},
	'click input.Lista1B1':function(){
		$("#game").show(500);
	},
	'click input.Lista1B2':function(){
		//alert("This button will make something awesome in the near future. Just hang tight...")
	}
}



Template.gamesList.gamesList = function(){
  return Partidas.find({})
};



Template.gamesList.imIn = function(){
  var usu = Meteor.userId()
  if (usu){
    return (usu in this.jugadores) | (usu in this.invitados)
  }else{
    return false;
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




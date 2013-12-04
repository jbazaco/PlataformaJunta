
/*Lineas mamada:
 * Partidas.find({}).forEach(function(elem){Partidas.remove(elem._id)})
 * Messages.find({}).forEach(function(elem){Messages.remove(elem._id)})
 */

Meteor.subscribe("messages");
Meteor.subscribe("partidas");
Meteor.subscribe("DatosUsuarios");

Meteor.startup(function(){
	screenauto();
	$( "#container2" ).tabs({ hide: { effect: "slide",direction:'up', duration: 100 }, show:{ effect: "slide",direction:'up', duration: 100 }  });
	$(".subtab").hide();
	$(".canvas").hide()
	Session.setDefault('Current_Game_id',0);
});

var screenauto= function(){
	$("#containermain").css("width",document.documentElement.clientWidth.toString()+'px');
	$("#containermain").css("height",document.documentElement.clientHeight.toString()+'px');
	Meteor.setTimeout(screenauto,500)
};


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
}

Template.games.events={
	'click a#game_1':function(){
		Session.set('Current_Game_id',1);
		$(".canvas").hide()
		$('#game').show(500);
		//$("#container2").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_2':function(){
		Session.set('Current_Game_id',2)
		$(".canvas").hide()
		$('#game2').show(500);
		//$("#container2").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_3':function(){
		Session.set('Current_Game_id',3)
		$(".canvas").hide()
		$('#game3').show(500);
		//$("#container2").tabs( "option", "active", 1);
		return false;
	} 
}



Meteor.autosrat
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

Deps.autorun(function(){
	var id = Session.get("Current_Game_id");
	if (id){
		var str="#tabs-2-"+id.toString();
		$('.subtab').hide(500);
		$(str).show(500);
	}
})




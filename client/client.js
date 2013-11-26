
/*Lineas mamada:
 * Partidas.find({}).forEach(function(elem){Partidas.remove(elem._id)})
 * Messages.find({}).forEach(function(elem){Messages.remove(elem._id)})
 */

Meteor.subscribe("messages");
Meteor.subscribe("partidas");

$(function() {
	$( "#container2" ).tabs({ hide: { effect: "slide",direction:'up', duration: 100 }, show:{ effect: "slide",direction:'up', duration: 100 }  });
});

$(function(){
	$("#ListaPartidas1").hide();
	$("#ListaPartidas2").hide();
	$("#ListaPartidas3").hide();
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

var GetSeq = function(){
	var lst = Partidas.find({},{sort:{id:1}}).fetch();
	for (var i=0; i<lst.length-1;i++){
		if (Number(lst[i].id)+1 != Number(lst[i+1].id)){
			var val = Number(lst[i].id)+1;
			Session.set("seq",val);	//Gap!
			return val;
		}
	}
	var val= lst.length==0 ? 0 : lst[lst.length-1].id+1;
	Session.set("seq",val)	//Not Gap..
	return val;
}

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
		alert('hola')
	},
	'click input.b2': function(){
		alert('hola')
	},
	'click a.juego1':function(){
		Session.set("Current_Game_Type","AlienInvasion");
		$("#ListaPartidas1").show(500);
		$("#ListaPartidas2").hide(500);
		$("#ListaPartidas3").hide(500);
		return false
	},
	'click a.juego2':function(){
		Session.set("Current_Game_Type","AngryFruits");
		$("#ListaPartidas2").show(500);
		$("#ListaPartidas1").hide(500);
		$("#ListaPartidas3").hide(500);
		return false
	},
	'click a.juego3':function(){
		Session.set("Current_Game_Type","Carca");
		$("#ListaPartidas3").show(500);
		$("#ListaPartidas1").hide(500);
		$("#ListaPartidas2").hide(500);
		return false
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


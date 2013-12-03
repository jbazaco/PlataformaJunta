
/*Lineas mamada:
 * Partidas.find({}).forEach(function(elem){Partidas.remove(elem._id)})
 * Messages.find({}).forEach(function(elem){Messages.remove(elem._id)})
 */

Meteor.subscribe("messages");
Meteor.subscribe("partidas");

Meteor.startup(function(){
	screenauto();
    $("#opciones").hide();
});

var screenauto= function(){
	$("#containermain").css("width",document.documentElement.clientWidth.toString()+'px');
	$("#containermain").css("height",document.documentElement.clientHeight.toString()+'px');
	Meteor.setTimeout(screenauto,2000)
};

$(function() {
	$( "#container2" ).tabs({ hide: { effect: "slide",direction:'up', duration: 100 }, show:{ effect: "slide",direction:'up', duration: 100 }  });
	$('.escenario').attr("disabled",true);
	
/*	var x = document.getElementById('form1');
    //nombre_partida = document.getElementById('nombre');
	//n_jugadores =document.getElementsByClassName('n_jugadores');
	//form.onsubmit = function() {
   	//	var variable = nombre_partida.value;
	//	var variable2 = n_jugadores.value;
    //	alert( variable2 );
	//};
	//for (var i=0;i<x.length;i++)
  	{
  		document.write(x.elements[i].value);
  		document.write("<br>");
  	}
*/
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
		$( "#opciones" ).fadeToggle( "slow", "linear" );

	},
        'click input.b2': function(){
                Meteor.users.insert({
		  nombre:peter,
		  time:Date.now()
		});
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


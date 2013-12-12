
/*Lineas mamada:
 * Partidas.find({}).forEach(function(elem){Partidas.remove(elem._id)})
 * Messages.find({}).forEach(function(elem){Messages.remove(elem._id)})
 */

Meteor.subscribe("messages");
Meteor.subscribe("partidas");
Meteor.subscribe("DatosUsuarios");

Meteor.startup(function(){
	screenauto();
    $("#opciones").hide();
	screenauto();	//Refresh automatico de la pantalla aunque el tamaño cambie
	$( "#container2" ).tabs({ hide: { effect: "slide",direction:'up', duration: 100 }, show:{ effect: "slide",direction:'up', duration: 100 }  });
	$(".subtab").hide();	//Esconde los subtans que se encuentran en la segunda pestaña del acordeon
	$(".canvas").hide();	//Esconde todos los canvas
	$('.escenario').attr("disabled",true);
// 	Meteor.setTimeout(function(){$(".user").click(ShowUserInfo)},500);		//Hacer click muestra estadisticas de usuario, otro click lo cierra.
// 	Meteor.setTimeout(function(){$(".match").click(ShowMatchInfo)},500);	//Hacer click muestra estadisticas de partida, otro click lo cierra.
	Session.setDefault('Current_Game_id',0);
});


// var ShowUserInfo = function(){
// 	console.log('Over User');
// 	return false;
// }


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

	}
}
Template.options.events={
	'click .submit': function () {
     	var opciones=[];

		if($("#nombre").val()==""){
			alert("Debes introducir un nombre para la partida");
			return false;
		}
		else{
			opciones.push($("#nombre").val());
			name=$("#nombre").val();		
		}
		opciones.push($('input[name=n_jugadores]:checked', '#opciones').val());
		if($('#tablero').is(':checked')){
			opciones.push('tablero');
		}

		opciones.push($('input[name=nivel]:checked', '#opciones').val());
		opciones.push($('input[name=escenario]:checked', '#opciones').val());
		alert(opciones);
		Partida.insert({
			name:name,
		});
	},
	'click .reset': function () {	
		$("#nombre").val("");
		if($('#tablero').is(':checked')){
			$('#tablero').prop('checked', false);
		}		
	}
      
}


Template.ListaEstados.ListaEstados = function(){
	return Meteor.users.find({},{sort:{estado:1,username:1}})
}

Template.ListaEstados.ColorEstado = function(){
	if (this.estado == "Conectado"){
		return true;	
	}
	else{
		return false;
	}
}

Template.gamesList.gamesList = function(){
	return Partidas.find({})
}


Template.gamesList.imIn = function(){
	var usu = Meteor.userId()
	if (usu){
		return (usu in this.jugadores) | (usu in this.invitados)
	}else{
		return false;
	};
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

Template.gamesList.gamesListIn = function(){
	var usuid = Meteor.userId();
	if (usuid){
		var usu = Meteor.users.findOne(usuid);
		if (usu){
			return Partidas.find({jugadores:{$all:[usu.username]}})
		}
	}
};
Template.gamesList.gamesListOut = function(){
	var usuid = Meteor.userId();
	if (usuid){
		var usu = Meteor.users.findOne(usuid);
		if (usu){
			return Partidas.find({jugadores:{$not:{$all:[usu.username]}}});
		}else{
			return Partidas.find();
		}
	}else{
		return Partidas.find();
	}
};

Template.gamesList.events={
	'click div.match':function(){
		$(".matchinfo").hide(100);
		$('#'+this.nombre).show();
	},
	'click a.watch_match':function(){
		var usuid = Meteor.userId();
		if (usuid){
			var usu = Meteor.users.findOne(usuid);
			if (usu){
				Meteor.call('IncluirInvitado',this._id,usu.username,function(err,res){
					if(! err){Meteor.subscribe(res)}
				})
			}
		}else{
			Meteor.call('IncluirInvitado',this._id,"Invitado",function(err,res){
				console.log(res)
				if(! err){Meteor.subscribe(res)}
			})
		}
		return false;
	},
	'click a.join_match':function(){
		var usuid = Meteor.userId();
		if (usuid){
			var usu = Meteor.users.findOne(usuid);
			if (usu){
				Meteor.call('IncluirJugador',this._id,usu.username,function(err,res){
					console.log(res)
					if(! err){Meteor.subscribe(res)}
				})
			}
		return false;
		}
	}
};

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
	Meteor.call('ActualizarEstado');
});

Deps.autorun(function(){
	var id = Session.get("Current_Game_id");
	if (id){
		var str="#tabs-2-"+id.toString();
		$('.subtab').hide(500);
		$(str).show(500);
	}
})




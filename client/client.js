
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
	$( ".startgame" ).click(function() {
		$( "#opciones" ).fadeToggle( "slow", "linear" );
	});
// 	Meteor.setTimeout(function(){$(".match").click(ShowUserInfo)},500);		//Hacer click muestra estadisticas de usuario, otro click lo cierra.
	Meteor.setTimeout(function(){$(".match").click(ShowMatchInfo)},500);	//Hacer click muestra estadisticas de partida, otro click lo cierra.
	Session.setDefault('Current_Game_id',0);
});

// var ShowUserInfo = function(){
// 	console.log('Over User');
// 	return false;
// }
// var HideUserInfo = function(){
// 	console.log('Not Over User');
// 	return false;
// }
ShowMatchInfo = function(){
	$(".match").unbind("click",ShowMatchInfo)
	console.log('Click open Match: '+this.innerHTML);
	$(".match").click(HideMatchInfo)
}
HideMatchInfo = function(){
	$(".match").unbind("click",HideMatchInfo)
	console.log('Click close Match');
	$(".match").click(ShowMatchInfo)
}


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
		$('#opciones').hide();
     	
		var opciones={
			jugadores_maquina: 0,
			tablero_inteligente: false,
			niveles: 'facil',
			escenario: 'normal'
		};

		if($("#nombre").val()==""){
			alert("Debes introducir un nombre para la partida");
			return false;
		}
		else{
			name=$("#nombre").val();	
		}
		n_players= parseInt($('input[name=n_jugadores]:checked', '#opciones').val());	
			opciones.jugadores_maquina=n_players;
		
		if($('#tablero').is(':checked')){
			opciones.tablero_inteligente= true;
		}
		
		nivel=$('input[name=nivel]:checked', '#opciones').val();
		escenario=$('input[name=escenario]:checked', '#opciones').val();
		opciones.niveles= nivel;
		opciones.escenario= escenario;
	
		Meteor.call("SuscribirPartida",[],opciones,[],name,function(error,result){
    		if(error){
        		console.log(error.reason);
    		}
    		else{
				console.log('Hola');
    		}
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
		
		$("#selectedgame").html("Alien Invasion");
		$("#container2").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_2':function(){
		Session.set('Current_Game_id',2)
		$(".canvas").hide()
		$('#game2').show(500);
		
		$("#selectedgame").html("Angry Fruits");
		$("#container2").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_3':function(){
		Session.set('Current_Game_id',3)
		$(".canvas").hide()
		$('#game3').show(500);

		$("#selectedgame").html("Carcassonne");	
		$("#container2").tabs( "option", "active", 1);
		return false;
	} 
}

Template.ranking.ranking = function (){
    var users_data = [];
	
	var usu = Meteor.user();
  	if (usu){
   	    users_data.push({name:usu.username, points:usu.puntuacion});
  	}
	return users_data;
}


Template.gamesList.gamesListIn = function(){
	return Partidas.find({jugadores:{$all:['usu1']}})
};
Template.gamesList.gamesListOut = function(){
	return Partidas.find({jugadores:{$not:{$all:['usu1']}}})
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




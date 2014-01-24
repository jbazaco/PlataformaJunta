
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
	$( "#container3" ).tabs({ hide: { effect: "slide",direction:'up', duration: 100 }, show:{ effect: "slide",direction:'up', duration: 100 }  });
	$(".subtab").hide();	//Esconde los subtans que se encuentran en la segunda pestaña del acordeon
	$(".canvas").hide();	//Esconde todos los canvas
	$('.escenario').attr("disabled",true);
// 	Meteor.setTimeout(function(){$(".user").click(ShowUserInfo)},500);		//Hacer click muestra estadisticas de usuario, otro click lo cierra.
	$( ".startgame" ).click(function() {
		$( "#opciones" ).fadeToggle( "slow", "linear" );
	});
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
				if(Meteor.users.findOne(Meteor.userId) != undefined){
					Messages.insert({
						name:name,
						message:message.val(),
						time:Date.now()
					});
				}
				else{
					alert('Debes estar registrado para poder mandar mensages')
				}
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
     	var jugadores=[];
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


		if(Meteor.users.findOne(Meteor.userId) != undefined){
			user=Meteor.users.findOne(Meteor.userId()).username;
			jugadores.push(user);
			if(n_players>0){
				for(var i=0; i<n_players; i++){
					jugadores.push('');				
				}
			}
			Meteor.call("SuscribirPartida",jugadores,opciones,[],name,function(error,result){
				if(error){
		    			console.log(error.reason);
				}
				else{
					Meteor.subscribe(result);
					Session.set("Current_Game",result);
					var canvas = "Canvas_"+result;
					$("#container").append("<canvas id='"+canvas+"' class='canvas' width='1070' height='650'></canvas>");
					$(".canvas").hide();
					console.log(canvas)
					$("#"+canvas).show();
				}
			});
			$('#opciones').hide();
		}
		else
			alert('Debes estar registrado para crear una partida');

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
		$(".canvas").hide();
		$(".gamelayer").hide();
		$('#game').show(500);
		
		$("#selectedgame").html("Alien Invasion");
		$("#container3").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_2':function(){
		Session.set('Current_Game_id',2)
		$(".canvas").hide();
		$('#gamecanvas').show(500);
		
		$("#selectedgame").html("Angry Fruits");
		$("#container3").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_3':function(){
		Session.set('Current_Game_id',3)
		$(".canvas").hide();
		$('#tablero').show(500);

		$("#selectedgame").html("Carcassonne");	
		$("#container3").tabs( "option", "active", 1);
		return false;
	} 
}


Template.RankingJuego.ranking = function(){
	return Meteor.users.find({},{sort:{'puntuacion.0.total':-1,'puntuacion.1.total':-1,'puntuacion.2.total':-1}})
}


Template.RankingJuego.Puntu = function(){
	//alert(Session.get('Current_Game_id'))
	if(!Session.get('Current_Game_id')){
		return false
	}
	else{
		if(Session.get('Current_Game_id')===1){
			p = this.puntuacion[0].total
		}
		if(Session.get('Current_Game_id')===2){
			p = this.puntuacion[1].total
		}
		if(Session.get('Current_Game_id')===3){
			p = this.puntuacion[2].total
		}
	return p
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
					if(! err){
						Meteor.subscribe(res)
						Session.set("Current_Game",res);
						console.log('esta es la res del susbcribe:      '+res)
						var canvas = "Canvas_"+res;
						$(".canvas").hide();
						if(!$("#"+canvas).length){
							$("#container").append("<canvas id='"+canvas+"' class='canvas' width='1150' height='1150'></canvas>");
							console.log(canvas+'                        1');
						}
						$("#"+canvas).show();
					}
				})
			}
		}else{
			Meteor.call('IncluirInvitado',this._id,"Invitado",function(err,res){
				console.log(res)
				if(! err){
					Meteor.subscribe(res)
					Session.set("Current_Game",res);
						var canvas = "Canvas_"+res;
						$(".canvas").hide();
						$("#container").append("<canvas id='"+canvas+"' class='canvas' width='1150' height='1150'></canvas>");
						console.log(canvas+'                            2');
						$("#"+canvas).show();
				}
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
					if(! err){
						Meteor.subscribe(res)
						$('.canvas').hide()
						$("#container").append("<canvas id='Canvas_"+res+"' class='canvas' width='1150' height='1150'></canvas>");
						Session.set("Current_Game",res)
					}
				})
			}
		return false;
		}else{
				alert('Debes estar registrado para unirte a una partida');
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
/*
Deps.autorun(function(){
	if (Meteor.user()){
	//alert(Meteor.user().username)
		var user = Meteor.user();
		if(user.registrado != 1){
			//alert("Cliente inicializado")
			//alert("registrado : "+user.registrado)
			Meteor.call('InicializaCliente',user._id);
		}
	}
	Meteor.call('ActualizarEstado');
});
*/
Deps.autorun(function(){
	var id = Session.get("Current_Game_id");
	if (id){
		var str="#tabs-2-"+id.toString();
		$('.subtab').hide(500);
		$(str).show(500);
	}
})

Deps.autorun(function(){
	alert(Partidas.findOne(Session.get("Current_Game")).estado)
})


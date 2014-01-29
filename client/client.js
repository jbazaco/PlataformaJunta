
/*Lineas mamada:
 * Partidas.find({}).forEach(function(elem){Partidas.remove(elem._id)})
 * Messages.find({}).forEach(function(elem){Messages.remove(elem._id)})
 */

Meteor.subscribe("messages");
Meteor.subscribe("partidas");
Meteor.subscribe("DatosUsuarios");


Meteor.startup(function(){
	Session.set("Chat_Selector","General");
	$('#sala_general').css('background-color','#ccc');
    $("#opciones").hide();

	$( "#container3" ).tabs({ hide: { effect: "slide",direction:'up', duration: 100 }, show:{ effect: "slide",direction:'up', duration: 100 }  });
	$(".subtab").hide();	//Esconde los subtans que se encuentran en la segunda pestaña del acordeon
	$(".canvas").hide();	//Esconde todos los canvas
	$('.escenario').attr("disabled",true);
  $('.gamelayer').hide();
	$( ".startgame" ).click(function() {
		$( "#opciones" ).fadeToggle( "slow", "linear" );
	});
	
	Session.setDefault('Current_Game_id',0);	

	$(".ajust").accordion();
	$("#pop_up").on('mouseenter', '.datos', function(){
		var id = Session.get("id_pop_up");
		Meteor.clearTimeout(id);
	});
	$("#pop_up").on('mouseleave', '.datos', function(){
		$(".datos").remove();
	});
	$(".games").mouseover(function(){

		if (this.id==="game_1") {
			logo = document.getElementById("alien");
			//logo.src="imagenes/alienInvasion.png"
		}
		else if (this.id==="game_2") {
			logo = document.getElementById("angry");
			//logo.src="imagenes/agryfruits.png"
		}
		else if (this.id==="game_3") {
			logo = document.getElementById("carca");
			//logo.src="imagenes/carcassonne-logo.jpg"
		}
  		logo.width = 100;
  		logo.height = 80;
	});
	$(".games").mouseout(function(){
		if (this.id==="game_1") {
			logo = document.getElementById("alien");
			logo.src="alienInvasion.png"
		}
		else if (this.id==="game_2") {
			logo = document.getElementById("angry");
			logo.src="agryfruits.png"
		}
		else if (this.id==="game_3") {
			logo = document.getElementById("carca");
			logo.src="carcassonne-logo.jpg"
		}
  		logo.width = 60;
  		logo.height = 41;
	});
/*
	$("#fondoPantalla").click(function(){
		$(".fondos").toggle();
	});
*/
	$(function() {
		$( "#accordion1" ).accordion({
		heightStyle: "fill"
		});
	});

	$(function() {
		$( "#accordionGeneral" ).resizable({
			resize: function() {
				$( "#accordion1" ).accordion( "refresh" );
			}
		});
	});
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
				var msg=Clip(message.val(),30);
				if (Meteor.user()){
					var name = Meteor.user().username;
				}else{
					var name="Anonymous";
				}
				if(Meteor.users.findOne(Meteor.userId) != undefined){
					Messages.insert({
						name:name,
						message:message.val(),
						time:Date.now(),
						sala:Session.get("Chat_Selector")
					});
          Session.set("Change_Pestaña",false);
				}
				else{
					alert('Debes estar registrado para poder mandar mensages')
				}
			}
			message.val("");        
		}
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
			$("#nombre").val("");	
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
	},
	'click .close_Div': function () {	
		$("#opciones").hide()
	}
      
}


Template.ListaEstados.ListaEstados = function(){
	return Meteor.users.find({},{sort:{estado:1,username:1,puntuacion:1}});
}

Template.ListaEstados.ColorEstado = function(){
	if (this.estado == "Conectado"){
		return true;	
	}
	else{
		return false;
	}
}
Template.ListaEstados.events={
	'mouseover .NombreUsuario':function(){
		$(".datos").hide();
		cadena="";
		cadena+="<div id='"+this.username+"_datos' class='datos' style='display:none'>"+this.username +": "+ this.estado+"</br>"
		switch (Session.get("Current_Game_id")){
			case 1 : cadena+=this.puntuacion[0].juego+" </br>Puntos totales: "+ this.puntuacion[0].total+" Record: "+this.puntuacion[0].record+"</br>"; break;
			case 2 : cadena+=this.puntuacion[1].juego+" </br>Puntos totales: "+ this.puntuacion[1].total+" Record: "+this.puntuacion[1].record+"</br>"; break;
			case 3 : cadena+=this.puntuacion[2].juego+" </br>Puntos totales: "+ this.puntuacion[2].total+" Record: "+this.puntuacion[2].record; break;
			default: console.log(Session.get("Current_Game_id"))
		}
		cadena+="</div>"
		$("#pop_up").append(cadena);
		username= this.username
		var id = Meteor.setTimeout(function(username){$("#"+this.username+"_datos").show()},500);
		Session.set("id_pop_up",id);
	},

	'mouseleave .NombreUsuario':function(){
		Meteor.clearTimeout(Session.get("id_pop_up"));
		$("#"+this.username+"_datos").remove();
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

function abrir(url) {
	open(url,'') ;
}


Template.ajustes.events={
	'click a#fondo0':function(){
		$("#containermain").css("background-image",'url(../imagenes/fondo3.jpg)');
		$("#container").css("border","3px solid black")
		$("#container2").css({"background-color":"#CBAD48","opacity":"0.6"})
		$("#container3").css({"background-color":"#CBAD48","opacity":"0.6"})
		$("#container4").css("background-color","#CBAD48")
		$("#container5").css({"background-color":"#CBAD48","border":"2px solid black"})
		return false;
	},
	'click a#fondo1':function(){
		$("#containermain").css("background-image",'url(../imagenes/papel.jpg)');
		$("#container").css("border","3px solid black")
		$("#container2").css({"background-color":"#20B2AA","opacity":"0.6"})
		$("#container3").css({"background-color":"#20B2AA","opacity":"0.6"})
		$("#container4").css("background-color","#20B2AA")
		$("#container5").css({"background-color":"#20B2AA","border":"2px solid black"})
		$('.bienvenida').css("color","black")
		return false;
	},
	'click a#fondo2':function(){
		$("#containermain").css("background-image",'url(../imagenes/negro.jpg)');
		$("#container").css("border","3px solid white")
		$("#container2").css({"background-color":"#DCDCDC","opacity":"0.6"})
		$("#container3").css({"background-color":"#DCDCDC","opacity":"0.6"})
		$("#container4").css("background-color","#C0C0C0")
		$("#container5").css({"background-color":"#C0C0C0","border":"2px solid white"})
		$('.bienvenida').css("color","white")
		//$("#input").css("background-color","green")
		return false;
	},
	'click a#fondo3':function(){
		$("#containermain").css("background-image",'url(../imagenes/lluvia.jpg)');
		$("#container").css("border","3px solid white")
		$("#container2").css({"background-color":"#F5FFFA","opacity":"1"})
		$("#container3").css({"background-color":"#F5FFFA","opacity":"1"})
		$("#container4").css("background-color","#C0C0C0")
		$("#container5").css({"background-color":"#C0C0C0","border":"2px solid white"})
		$('.bienvenida').css("color","black")
		//$("#input").css("background-color","green")
		return false;
	},
	'click a#fondo4':function(){
		$("#containermain").css("background-image",'url(../imagenes/nieve.jpg)');
		$("#container").css("border","3px solid white")
		$("#container2").css({"background-color":"#7B68EE","opacity":"1"})
		$("#container3").css({"background-color":"#7B68EE","opacity":"1"})
		$("#container4").css("background-color","#7B68EE")
		$("#container5").css({"background-color":"#7B68EE","border":"2px solid white"})
		$('.bienvenida').css("color","black")
		//$("#input").css("background-color","green")
		return false;
	},
	'click a#abrir':function(){
		abrir('http://www.defensacentral.com/')
		return false;
	},

	'click a#abrirterminos':function(){
		$(function() {
    		$("#terminos").dialog();
  		});
		return false;
	},
}


Template.games.events={
	'click a#game_1':function(){
		Session.set('Current_Game_id',1);
		Session.set("Chat_Selector",1);
		$('.boton').css('background-color','#eee');
		$('#sala_juego').css('background-color','#ccc');
		$(".canvas").hide();
		$(".gamelayer").hide();
		$('#game').show(500);
		
		$("#selectedgame").html("Alien Invasion");
		$("#container3").tabs( "option", "active", 1 );
		Clear_Chat();
		return false;
	},
	'click a#game_2':function(){
		Session.set('Current_Game_id',2)
		Session.set("Chat_Selector",2);
		$('.boton').css('background-color','#eee');
		$('#sala_juego').css('background-color','#ccc');
		$(".canvas").hide();
		game.showLevelScreen();

		$("#selectedgame").html("Angry Fruits");
		$("#container3").tabs( "option", "active", 1 );
		Clear_Chat();
		return false;
	},
	'click a#game_3':function(){
		Session.set('Current_Game_id',3)
		Session.set("Chat_Selector",3);
		$('.boton').css('background-color','#eee');
		$('#sala_juego').css('background-color','#ccc');
		$(".canvas").hide();
		$('#tablero').show(500);
    $(".gamelayer").hide();
		$("#selectedgame").html("Carcassonne");	
		$("#container3").tabs( "option", "active", 1);
		Clear_Chat();
		return false;
	},
	'mouseenter a#game_1':function(){
		$('#juego_descripcion').html('Haz click en la imagen y empieza a jugar ya a AlienInvasion!');
		return false;
	},
	'mouseenter a#game_2':function(){
		$('#juego_descripcion').html('Haz click en la imagen y empieza a jugar ya a AngryFruits!');
		return false;
	},
	'mouseenter a#game_3':function(){
		$('#juego_descripcion').html('Haz click en la imagen y empieza a jugar ya a este juego sin nombre!');
		return false;
	},
	'mouseleave':function(){
		$('#juego_descripcion').html('Haz click en cualquiera de los juegos de la izquierda para empezar a jugar!');
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
			return Partidas.find({$or:[{jugadores:{$all:[usu.username]}},{estado:"Empezada"}]});
		}
	}
};



Template.gamesList.gamesListOut = function(){
	var usuid = Meteor.userId();
	if (usuid){
		var usu = Meteor.users.findOne(usuid);
		if (usu){
			return Partidas.find({$nor:[{jugadores:{$all:[usu.username]}},{estado:"Empezada"},{estado:"Terminada"}]});
		}else{
			return Partidas.find();
		}
	}else{
		return Partidas.find();
	}
};

Template.popup.events={
	'click a.watch_match':function(){
		var usuid = Meteor.userId();
		if (usuid){
			var usu = Meteor.users.findOne(usuid);
			if (usu){
				Meteor.call('IncluirInvitado',Session.get('Game_Data_id'),usu.username,function(err,res){
					if(! err){
						Meteor.subscribe(res)
						Session.set("Current_Game",res);
						var canvas = "Canvas_"+res;
						$(".canvas").hide();
						if(!$("#"+canvas).length){
							$("#container").append("<canvas id='"+canvas+"' class='canvas' width='1070' height='650'></canvas>");
						}
						$("#"+canvas).show();
						$("#"+Session.get('Game_Data_id')+"_datos").remove()
					}
				})
			}
		}else{
			Meteor.call('IncluirInvitado',Session.get('Game_Data_id'),"Invitado",function(err,res){
				console.log(res)
				if(! err){
					Meteor.subscribe(res)
					Session.set("Current_Game",res);
						var canvas = "Canvas_"+res;
						$(".canvas").hide();
						if(!$("#"+canvas).length){
							$("#container").append("<canvas id='"+canvas+"' class='canvas' width='1070' height='650'></canvas>");
						}
						$("#"+canvas).show();
						$("#"+Session.get('Game_Data_id')+"_datos").remove()
				}
			})
		}
		return false;
	},
	'click a.join_match':function(){
		partida=Partidas.findOne(Session.get('Game_Data_id'));
		var usuid = Meteor.userId();
		if (usuid){
			var usu = Meteor.users.findOne(usuid);
			if (usu){
				Meteor.call('IncluirJugador',Session.get('Game_Data_id'),usu.username,function(err,res){
					if(! err){
						Meteor.subscribe(res)
						$('.canvas').hide()
						$("#container").append("<canvas id='Canvas_"+res+"' class='canvas' width='1070' height='650'></canvas>");
						Session.set("Current_Game",res)
						$("#"+Session.get('Game_Data_id')+"_datos").remove()
					}
				})
			}
		}else{
				alert('Debes estar registrado para unirte a una partida');
		}
		return false;
	},
	'click a.leave_match':function(){
		partida=Partidas.findOne(Session.get('Game_Data_id'))._id;
		
		var usuid = Meteor.userId();
		var usu = Meteor.users.findOne(usuid);
		
		Meteor.call('AbandonarPartida',usu.username,partida)/*,function(err,res){
					if(! err){
						alert("hey")
					}else{
						console.log(err);
					}
		})*/
		/*var usu = Meteor.users.findOne(usuid);
			if (usu){
				Meteor.call('IncluirJugador',Session.get('Game_Data_id'),usu.username,function(err,res){
					if(! err){
						Meteor.subscribe(res)
						$('.canvas').hide()
						$("#container").append("<canvas id='Canvas_"+res+"' class='canvas' width='1070' height='650'></canvas>");
						Session.set("Current_Game",res)
						$("#"+Session.get('Game_Data_id')+"_datos").remove()
					}
				})
			}
		}else{
				alert('Debes estar registrado para unirte a una partida');
		}*/
		return false;
	}
}

Template.gamesList.events={

	'mouseover div.match':function(){
		$(".datos").remove();
		Session.set('Game_Data_id',this._id)
		var Partida = Partidas.findOne({nombre:this.nombre});
		var usuid = Meteor.userId();
		var cadena = "";

		if (usuid){
			var usu = Meteor.users.findOne(usuid);
 			if (usu){
 				if ((Partida.jugadores.indexOf(usu.username)!=(-1)) || (Partida.estado != "Lobby")){
					if ((Partida.jugadores.indexOf(usu.username)>=0)){
						cadena = "<a class='watch_match' href=''>Observar partida<a></br><a class='leave_match' href=''>Abandonar<a></br>"
					}else{
						cadena = "<a class='watch_match' href=''>Observar partida<a></br>"
					}
				}else{
					cadena = "<a class='join_match' href=''>Unirse a partida </a></br><a class='watch_match' href=''>Observar partida<a></br>"
 				}
 			}
 		}
		var jugadores = "";
		for(var i=0; i<this.jugadores.length; i++){
			jugadores = jugadores + "Jugador"+i+": "+this.jugadores[i]+"</br>";
		};
		$("#pop_up").append("<div id='"+this._id+"_datos' class='datos' style='display:none'>Nombre Partida: "+this.nombre+"</br>Estado: "+this.estado +"</br>Jugadores: "+jugadores+"Tipo escenario:"+this.opciones.escenario +"</br>"+ "Numero jugadores maquina:" +this.opciones.jugadores_maquina+"</br> "+ "Nivel:"+this.opciones.niveles+"</br>"+ "Tablero inteligente"+ this.opciones.tablero_inteligente+"</br>"+cadena+"</br></div>");
		$("#"+this._id+"_datos").show(500);
	},

	'mouseleave div.match':function(){
		var partida_id = this._id;	//Otra chapuza premeditada sin sentido.
		var id = Meteor.setTimeout(function(partida_id){$("#"+Session.get('Game_Data_id')+"_datos").remove()},500);
		Session.set("id_pop_up",id);
	}
}

Template.salas.events={
	'click #sala_general':function(){
    var Cambio = false;
		console.log('1')
		if (Session.get("Chat_Selector") != "General"){
			console.log('11')
      Cambio = true;
			$('.boton').css('background-color','#eee');
			$('#sala_general').css('background-color','#ccc');
			$('#container5').show();
			Session.set("Chat_Selector","General");
			Clear_Chat(Cambio);
		}		
	},
	'click #sala_juego':function(){
		console.log('2')
    var Cambio = false;
		if (Session.get("Chat_Selector") != Session.get("Current_Game_id")){
			console.log('22')
      Cambio = true;
			$('.boton').css('background-color','#eee');
			$('#sala_juego').css('background-color','#ccc');
			$('#container5').show();
			Session.set("Chat_Selector",Session.get("Current_Game_id"));
			Clear_Chat(Cambio);
		}
	},
	'click #sala_privada':function(){
    var Cambio = false;
		console.log('3')
		if (Session.get("Chat_Selector") != "Privada"){
			console.log('33')
      Cambio = true;
			$('.boton').css('background-color','#eee');
			$('#sala_privada').css('background-color','#ccc');
			$('#container5').hide();
			Session.set("Chat_Selector","Privada");
			Clear_Chat(Cambio);
		}
	}
}

Clear_Chat = function(Cambio){
  Session.set("Change_Pestaña",Cambio)
	$('#ChatArea').html('<tr id="firstRow"></tr>');
	console.log('cleared')
	msgs_autorun._compute()
}

Accounts.ui.config({
	passwordSignupFields:"USERNAME_AND_OPTIONAL_EMAIL"
});

msgs_autorun = Deps.autorun(function(){
	console.log('filling')
	var chatArea = $('#firstRow');
  var Cambio = Session.get("Change_Pestaña");
  if (Cambio){
    var msgs = Messages.find({sala:Session.get("Chat_Selector")},{sort:{time:-1}, limit:10});
  }else{
    var msgs = Messages.find({sala:Session.get("Chat_Selector")},{sort:{time:-1}, limit:1});
  }
	msgs.forEach(function(message){
    if (Cambio){
     chatArea.append("<tr><td><strong>"+message['name']+"</strong>:</td><td><a>"+message['message']+"</a></td></tr>");
		 //chatArea.append("<tr><td><strong>"+message['name']+"</strong>:</td><td><a>"+message['message']+"</a></td></tr>");
    }else{
     chatArea.prepend("<tr style='align:center'><td><strong>"+message['name']+"</strong>:</td><td><a>"+message['message']+"</a></td></tr>"); 
    }
	});
});

Deps.autorun(function(){
	var id = Session.get("Current_Game_id");
	if (id){
		var str="#tabs-2-"+id.toString();
		$('.subtab').hide(500);
		$(str).show(500);
	}
})


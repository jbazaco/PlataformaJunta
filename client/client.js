
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
  //Meteor.setTimeout(function(){(".match").onmouseover(ShowPartidaInfo)},500);
	$( ".startgame" ).click(function() {
		$( "#opciones" ).fadeToggle( "slow", "linear" );
	});
	Session.setDefault('Current_Game_id',0);
  $("#pop_up").on('mouseenter', '.datos', function(){
   var id = Session.get("id_pop_up");
   Meteor.clearTimeout(id);
  });
  $("#pop_up").on('mouseleave', '.datos', function(){
    $("#"+this.id).remove();
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
    $("#pop_up").append("<div id='"+this.username+"' class='datos' style='display:none'>"+this.username +": "+ this.estado+"</br> "+ this.puntuacion[0].juego+"=> Puntuación Total:"+ this.puntuacion[0].total+" Puntuación Record: "+this.puntuacion[0].record+"</br>"+this.puntuacion[1].juego+"=> Puntuación Total:"+ this.puntuacion[1].total+" Puntuación Record: "+this.puntuacion[1].record+"</br>"+
this.puntuacion[2].juego+"=> Puntuación Total:"+ this.puntuacion[2].total+" Puntuación Record: "+this.puntuacion[2].record+"</div>");
    $("#"+this.username).show(500);
  },

  'mouseleave .NombreUsuario':function(){
    var id = Meteor.setTimeout(function(){$("#"+this.username).remove()},5000);
    Session.set("id_pop_up",id);
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
		$("#container2").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_2':function(){
		Session.set('Current_Game_id',2)
		$(".canvas").hide();
		$('#gamecanvas').show(500);
		
		$("#selectedgame").html("Angry Fruits");
		$("#container2").tabs( "option", "active", 1 );
		return false;
	},
	'click a#game_3':function(){
		Session.set('Current_Game_id',3)
		$(".canvas").hide();
		$('#tablero').show(500);

		$("#selectedgame").html("Carcassonne");	
		$("#container2").tabs( "option", "active", 1);
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
      return Partidas.find({},{sort:{jugadores:1}})
			//return Partidas.find({jugadores:{$all:[usu.username]}});
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

	'mouseover div.match':function(){
   var Partida = Partidas.findOne({nombre:this.nombre});
   var usuid = Meteor.userId();
	 var cadena = "";

	 if (usuid){
	    var usu = Meteor.users.findOne(usuid);
      if (usu){
          if ((usu.username in Partida.jugadores) || (Partida.estado /= "Lobby")){
            cadena = "<a class='watch_match' href=''>Obervar partida<a></br>"
          }else{
            cadena = "<a class='join_match' href=''>Unirse a partida </a></br><a class='watch_match' href=''>Obervar partida<a></br>"
          }
      }
    }
     var jugadores = "";
     for(var i=0; i<this.jugadores.length; i++){
      jugadores = jugadores + "Jugador"+i+": "+this.jugadores[i]+"</br>";
     };
     $("#pop_up").append("<div id='"+this.nombre+"' class='datos' style='display:none'>Nombre Partida: "+this.nombre+"</br>"+jugadores+"Tipo escenario:"+this.opciones.escenario +"</br>"+ "Numero jugadores maquina:" +this.opciones.jugadores_maquina+"</br> "+ "Nivel:"+this.opciones.niveles+"</br>"+ "Tablero inteligente"+ this.opciones.tablero_inteligente+"</br>"+cadena+"</br></div>");
     $("#"+this.nombre).show(500);
	},

  'mouseleave div.match':function(){
    var id = Meteor.setTimeout(function(){$("#"+this.username).remove()},5000);
    Session.set("id_pop_up",id);
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
						var canvas = "Canvas"+res;
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
						var canvas = "Canvas"+res;
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

Deps.autorun(function(){
	if (Meteor.user()){
		var user = Meteor.user();
		if(user.registrado != 1){
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

Deps.autorun(function(){
	alert(Partidas.findOne(Session.get("Current_Game")).estado)
})


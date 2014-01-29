// Publicaciones de las colecciones

Meteor.publish('messages', function(){
	return Messages.find({}, {sort: {time:-1}});
});

// Añadimos el campo ficha que representa el string de la ultima ficha que se ha movido
Meteor.publish('partidas',function(){
	return Partidas.find({},{fields: {nombre:1, jugadores:1,opciones:1,canvas:1,estado:1, ficha:1}});
});

// Publicacion del campo puntuacion para que puedan acceder los clientes.
Meteor.publish("DatosUsuarios", function () {
	return Meteor.users.find({},{fields: {username:1,puntuacion:1, historial:1, registrado: 1, services: 1,estado:1}});
});


// Actualiza el estado de todos los usuarios registrados cada vez que hay
// un cambio en la colección users.
ActualizarEstado = function(){
	var usuarios = Meteor.users.find({});	
	usuarios.forEach(function(user){
		if(user.services.resume.loginTokens[0] === undefined){
			//Usuario: No conectado
			Meteor.users.update(user,{$set:{estado:"No conectado"}});
			EliminarJugador(user.username);
		}else{
			//Usuario: Conectado
			if(user.estado === undefined){
				Meteor.call('InicializaCliente',user._id);
				console.log(user.username+": Inicializado")
			}
			else{Meteor.users.update(user,{$set:{estado:"Conectado"}});}
		}
	});
	Meteor.setTimeout(ActualizarEstado,500);
};
Meteor.setTimeout(ActualizarEstado,1000);


// Al terminar una partida se debe llamar a este método para todos y cada uno de los jugadores de esa
// partida y comprobar si han conseguido un nuevo record.
PuntuacionRecord = function(jugador,punt,juego){
	var user = Meteor.users.findOne({username:jugador})
	for(var i in user.puntuacion){
		if(user.puntuacion[i].juego === juego){
			var p = user.puntuacion[i].record;
			p>=punt? mayor=p : mayor=punt;
			switch(i){
				case "0": Meteor.users.update({username:jugador},{$set:{"puntuacion.0.record":mayor}}); break;
				case "1": Meteor.users.update({username:jugador},{$set:{"puntuacion.1.record":mayor}}); break;
				case "2": Meteor.users.update({username:jugador},{$set:{"puntuacion.2.record":mayor}}); break;
			}
		}		
	}
};
	
// Al terminar una partida se debe llamar a este método para todos y cada uno de los jugadores de esa
// partida y sumar la puntuación obtenida a la puntuación que tenía anteriormente.
PuntuacionTotal = function(jugador,punt,juego){
	var user = Meteor.users.findOne({username:jugador})
	for(var i in user.puntuacion){
		if(user.puntuacion[i].juego === juego){
			var p = user.puntuacion[i].total
			p+=punt
			switch(i){
				case "0": Meteor.users.update({username:jugador},{$set:{"puntuacion.0.total":p}}); break;
				case "1": Meteor.users.update({username:jugador},{$set:{"puntuacion.1.total":p}}); break;
				case "2": Meteor.users.update({username:jugador},{$set:{"puntuacion.2.total":p}}); break;
			}
		}		
	}
};


EliminarJugador = function(jugador){
	Partidas.find({jugadores:{$in:[jugador]}}).forEach(function(partida){
		partida.jugadores[partida.jugadores.indexOf(jugador)]="";
		Partidas.update(partida._id,{$set:{jugadores:partida.jugadores}})		
		AgregarPenalizacion(jugador,1);
		if (partida.jugadores.reduce(function(m,j){return m & j==''},true)){	//si no quedan jugadores humanos
			Partidas.remove(partida._id);
		}
	});
}

// Cada vez que un jugador pierde "x" tiempo en su turno se le penaliza. Igualmente
// si el jugador abandona el juego antes de que acabe la partida.
AgregarPenalizacion = function(nombre,penal){
	Meteor.users.update({username:nombre},{$inc:{penalizacion:penal}});
};

Meteor.methods({
	// Cada vez que un usuario se logee y en sus datos no se encuentre
	// el campo registrado, se inicializa y se pone a uno.
	InicializaCliente: function(id){
		var puntuacion = []
		var historial = []
		var objetoAlien = {"juego":"AlienInvasion","total":0,"record":0}
		var objetoFruits = {"juego":"AngryFruits","total":0,"record":0}
		var objetoCarca = {"juego":"Carcassonne","total":0,"record":0}
		var histAlien = {"juego":"AlienInvasion","jugadas":0,"ganadas":0,"perdidas":0,"abandonadas":0}
		var histFruits = {"juego":"AngryFruits","jugadas":0,"ganadas":0,"perdidas":0,"abandonadas":0}
		var histCarca = {"juego":"Carcassonne","jugadas":0,"ganadas":0,"perdidas":0,"abandonadas":0}
		puntuacion.push(objetoAlien)
		puntuacion.push(objetoFruits)
		puntuacion.push(objetoCarca)	
		historial.push(histAlien)
		historial.push(histFruits)
		historial.push(histCarca)
		Meteor.users.update(id,{$set:{puntuacion:puntuacion,historial:historial,equipos:[],torneos:[],penalizacion:0,estado:"Conectado",registrado:1}});
	},
	
	EliminarJugador : function(jugador){
		return EliminarJugador(jugador);
	},
	
	
	AbandonarPartida : function(jugador,idpartida){
		partida=Partidas.findOne(idpartida)
		partida.jugadores[partida.jugadores.indexOf(jugador)]="";
		Partidas.update(idpartida,{$set:{jugadores:partida.jugadores}})
		AgregarPenalizacion(jugador,1);
		if (partida.jugadores.length==1){	//si no quedan jugadores humanos
			Partidas.remove(idpartida);
		}
		
		//document.getElementById("Canvas_"+idpartida).remove();
	},
	// Actualiza el estado de todos los usuarios registrados cada vez que hay
	// un cambio en la colección users.
	ActualizarEstado: function(){
		ActualizarEstado();
	},

	//  Cada vez que un jugador sume una puntuación se deberá llamar a 
	//  esta función.
	IncrementarPuntuacion: function(id,punt){
		Meteor.users.update(id,{$inc:{puntuacion:punt}});
	},
	
	// Cada vez que se cree un equipo, el equipo es guardado en la colección
	// users. "equipos" es un campo de la colección de usuarios, que guarda la lista
	// de equipos en los que participa.
	AgregarEquipo: function(id,equipo){
		Meteor.users.update(id,{$push:{equipos:equipo}});
	},

	// Cada vez que se cree un torneo, el torneo es guardado en la colección
	// users. "torneos" es un campo de la colección de usuarios, que guarda la lista
	// de torneos en los que participa.
	AgregarTorneo: function(id,torneo){
		Meteor.users.update(id,{$push:{torneos:torneo}});
	},

	// Cada vez que un jugador pierde "x" tiempo en su turno se le penaliza. Igualmente
	// si el jugador abandona el juego antes de que acabe la partida.
	AgregarPenalizacion: function(id,penal){
		AgregarPenalizacion(id,penal)		
	},

	//  Cada vez que se quiera almacenar un movimiento de una partida se llamará 
	//  a esta funcion. Se comprueba que se el judgador que inicia el momimiento
	//  está autorizado (está en la lista de jugadores), despues se almacena la 
	//  jugada en la lista de jugadas de la partida.
	RegistrarMovimiento : function(id,jugador,movimiento){
		console.log("Registrar Movimientos, ID: " + id);
		//if(jugadorpermitido)
		Partidas.update(id,{$push:{jugadas:movimiento}});
		Partidas.update(id,{$set:{ultimaficha: "interrogante"}});
		RegMov1(id,jugador,movimiento);	
	},

	// Esta función devuelve el ultimo movimiento jugado en la partida
	// AUN NO ESTA CLARO si cualquiera puede mirar el ultimo movimiento
	// o debe estar en alguna de las listas de jugadores (usuarios, 
	// jugadores de partida o invitados a partida).
	UltimoMovimiento : function(id){
		console.log("Ultimo Movimiento");
		//if(jugadorpermitido)?
		var jugadas = Partidas.findOne(id).jugadas;
		return jugadas[jugadas.length-1];
	},

	// Devuelve el jugador AL QUE LE TOCA dando un identificador de partida
	// Si es el primer turno devuelve un jugador aleatorio de la lista de jugadores.
	// El jugador al que le toca es EL SIGUIENTE al que ha jugado la ultima jugada,
	// en la lista de jugadores según el orden en el que están almacenados en el array
	// de jugadores
	VerTurno : function(id){
		console.log("VerTurno");
		var partida = Partidas.findOne(id);
		if (partida.jugadas.length){
			return partida.jugadores[partida.jugadas.length%partida.jugadores.length];
		}else{
			return partida.jugadores[0];
		}
	},

	//Este metodo se llama después de crearse la partida (una vez se sabe el numero de jugadores que van
	//a participar en ella. Se inicializan las puntuaciones de todos los jugadores a cero en la colección
	//partidas. Se le pasa el id de la partida.
	InicializarPuntuacionesEnPartida: function(id){
		var numeroJugadores = Partidas.findOne(id).jugadores.length
		console.log(numeroJugadores)
		var puntuacion = Partidas.findOne(id).puntuacion
		for(i=0;i<numeroJugadores;i++){
			puntuacion.push(0);
		}
	},
	
	// Mete una nueva partida en el servidor. Devuelve un identificador
	// de partida UNICO no coincidente con la clave primaria al que 
	// el cliente debe suscribirse en su Deps.autorun().
	// Jugadores es un array con el identificador de cada jugador (nombre?)
	// Opciones es un map con las opciones que se quieran pasar a la partida.
	// Invitados es un array con los jugadores que observan la partida.
	// Nombre es un nombre que le quieras dar a la partida.
	SuscribirPartida : function(jugadores,opciones,invitados,nombre){
		console.log("SubscribirPartida");
	// 	if(permitido)?
		var id = Partidas.insert({
			nombre:nombre,
			jugadores: jugadores,
			invitados: [],
			opciones: opciones,
			empezada:false,
			jugadas:[],
			canvas: mycanvas,
			estado: "Lobby",
			puntuacion:[0]
		})

		var sid = id.toString();
		var mycanvas= "Canvas_"+sid;
		console.log(mycanvas)
		Partidas.update(id,{$set:{canvas:mycanvas}})

		Meteor.publish(sid,function(){
			return Partidas.find(id,{nombre:1, jugadores:1,invitados:1,opciones:1,jugadas:1,canvas:1});
		})
		return sid;
	},
  // Metodo para comprobar el estado de dicho campo ficha
  UltimaFicha : function(id){
    var UltimaFicha = Partidas.findOne(id).ultimaficha;
    return UltimaFicha;
  },

  // Metodo para actualizar la ultima ficha que se ha utilizado
  ActualizaFicha : function(id){
    var Partida = Partidas.findOne(id);
	console.log("se llama a aleatorio");
    var ficha = Aleatorio2(id);
    Partidas.update(id,{$set:{ultimaficha: ficha["nombre"]}});	
  },

	// Al terminar una partida se debe llamar a este método para todos y cada uno de los jugadores de esa
	// partida y comprobar si han conseguido un nuevo record.
	PuntuacionRecord : function(jugador,punt,juego){
		return PuntuacionRecord(jugador,punt,juego);
	},
	
	// Al terminar una partida se debe llamar a este método para todos y cada uno de los jugadores de esa
	// partida y sumar la puntuación obtenida a la puntuación que tenía anteriormente.
	PuntuacionTotal : function(jugador,punt,juego){
    console.log(jugador);
    console.log(punt);
    console.log(juego);
		return PuntuacionTotal(jugador,punt,juego);
	},

	//Se llama a este metodo para actualizar la puntuacion de cada jugada (punt) de cada 
	//jugador (jugador) en la partida (id)
	PuntuacionJugadorPartida: function(id,jugador,punt){
		var p = Partidas.findOne(id).puntuacion
		var idx = Partidas.findOne(id).jugadores.indexOf(jugador)
		p[idx]+=punt
		Partidas.update(id,{$set:{puntuacion:p}});
	},

	//Se llama a este metodo al terminar la partida para actualizar el historial de cada usuario para cada juego.
	//Los campos jugadas, ganadas, perdidas,abandonadas debe ser un entero 1 o 0.
	ActualizarHistorial: function(jugador,juego,jugadas,ganadas,perdidas,abandonadas){
		var user = Meteor.users.findOne({username:jugador})
		for(var i in user.historial){
			if(user.historial[i].juego === juego){
				var histJugadas = user.historial[i].jugadas
				var histGanadas = user.historial[i].ganadas
				var histPerdidas = user.historial[i].perdidas
				var histAbandonadas = user.historial[i].abandonadas
				histJugadas+=jugadas; histGanadas+=ganadas; histPerdidas+=perdidas; histAbandonadas+=abandonadas;
				switch(i){
					case "0": Meteor.users.update({username:jugador},{$set:{"historial.0.jugadas":histJugadas,
							"historial.0.ganadas":histGanadas,"historial.0.perdidas":histPerdidas,
							"historial.0.abandonadas":histAbandonadas}}); break;
					case "1": Meteor.users.update({username:jugador},{$set:{"historial.1.jugadas":histJugadas,
							"historial.1.ganadas":histGanadas,"historial.1.perdidas":histPerdidas,
							"historial.1.abandonadas":histAbandonadas}}); break;
					case "2": Meteor.users.update({username:jugador},{$set:{"historial.2.jugadas":histJugadas,
							"historial.2.ganadas":histGanadas,"historial.2.perdidas":histPerdidas,
							"historial.2.abandonadas":histAbandonadas}}); break;
				}
			}
		}
	},
	// Incluye jugadores en el array de jugadores dado el identificador primario de
	// la partida. Solo los incluye si no están ya incluidos. Aun no tiene un
	// máximo de jugadores.
	IncluirJugador: function(id, jugador){
		Partidas.update(id,{$addToSet:{jugadores:jugador},$push:{puntuacion:0}})
		return id
	},
	
	// Incluye observadores en el array de invitados dado el identificador primario de
	// la partida. Solo los incluye si no están ya incluidos. No tiene un
	// máximo de invitados.  
	IncluirInvitado: function(id, invitado){
		Partidas.update(id,{$addToSet:{invitados:invitado}})
		return (id);
	},
	
	// Cambia el estado de una partida a "Empezada" dado su identificador.
	EmpezarPartida:function(id){
		Partidas.update(id,{$set:{estado:"Empezada"}});
		console.log("EMPEZAMOS PARTIDA");
		CrearArJug2(id); 
	},
	
	// Cambia el estado de una partida a "Terminada" dado su identificador.
	// Añade las puntuaciones de los jugadores a la bd.Users
	TerminarPartida:function(id){
		Partidas.update(id,{$set:{estado:"Terminada"}});
		var p = Partidas.findOne(id)
		for(var i=0;i<p.jugadores.length;i++){
			PuntuacionTotal(p.jugadores[i],p.puntuacion[i],"Carcassonne");
			PuntuacionRecord(p.jugadores[i],p.puntuacion[i],"Carcassonne");
		}
		return (id);
	},
	
	//Disponible
	DevuelveFicha:function(){
		console.log("Aleatorio");
		return Aleatorio();
	},
	

	//Hay que pasar una Tablero dado de momento, hare que nosotros cojamos el tablero de plataforma
	ColocaFicha:function(Id, Ficha, x, y, rotacion){  // Dado una ficha y dos posiciones, se devuelve un booleano para si se puede o no colocar esa ficha
		console.log("Comprueba si la ficha se puede colocar");		
		return colocarficha1(Id,Ficha,x,y, rotacion);
	},
	
	ColocarSeguidor:function(ficha, campoficha, rotacion, x, y){
		return 1;	//funcion que devuelve si se puede poner un seguidor en la posicion de la ficha correspondiente.
	},
	
	EjecutaTotal: function(){
		EjecutaTotal();
	}
})

//Definición de permisos de usuarios que intentan tocar dentro de la colección users.
function adminUser(userId) {
    var adminUser = Meteor.users.findOne({username: "admin"});
    return (userId && adminUser && userId === adminUser._id);
}

Meteor.users.allow({
	remove: function(userId,doc){		//Solo el administrador puede eliminar cuentas de jugadores.
		return adminUser(userId);
	},
	update: function(userId,doc){		
		return Meteor.userId();
	}
});


var GetSeq = function(){
	var lst = Partidas.find({},{sort:{id:1}}).fetch();
	for (var i=0; i<lst.length-1;i++){
		if (Number(lst[i].id)+1 != Number(lst[i+1].id)){
			var val = Number(lst[i].id)+1;
			return val;		// Gap!!
		}
	}
	var val= lst.length==0 ? 0 : lst[lst.length-1].id+1;
	return val;				//Not Gap. Return the last+1 or 0 if no Games.
};

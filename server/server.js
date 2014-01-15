// Publicaciones de las colecciones


Meteor.publish('messages', function(){
	return Messages.find({}, {sort: {time:-1}});
});

Meteor.publish('partidas',function(){
	return Partidas.find({},{fields: {nombre:1, jugadores:1,opciones:1}});
});

// Publicacion del campo puntuacion para que puedan acceder los clientes.
Meteor.publish("DatosUsuarios", function () {
	return Meteor.users.find({},{fields: {username:1,puntuacion: 1,registrado: 1,services: 1,estado:1}});
});



Meteor.methods({
	
	// Cada vez que un usuario se logee y en sus datos no se encuentre
	// el campo registrado, se inicializa y se pone a uno.
	InicializaCliente: function(id){
		var puntuacion = []
		var objetoAlien = {"juego":"AlienInvasion","total":0,"record":0}
		var objetoFruits = {"juego":"AngryFruits","total":0,"record":0}
		var objetoCarca = {"juego":"Carcassonne","total":0,"record":0}
		puntuacion.push(objetoAlien)
		puntuacion.push(objetoFruits)
		puntuacion.push(objetoCarca)
		Meteor.users.update(id,{$set:{puntuacion:puntuacion,equipos:[],torneos:[],penalizacion:0,estado:"Conectado",registrado:1}});
	},
	
	// Actualiza el estado de todos los usuarios registrados cada vez que hay
	// un cambio en la colección users.
	ActualizarEstado: function(){
		var usuarios = Meteor.users.find({});	
		usuarios.forEach(function(user){
			if(user.services.resume.loginTokens[0] === undefined){
				//Usuario: No conectado
				Meteor.users.update(user,{$set:{estado:"No conectado"}});
			}
			else{
				//Usuario: Conectado
				Meteor.users.update(user,{$set:{estado:"Conectado"}});
			}
		});
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
		Meteor.users.update(id,{$inc:{penalizacion:penal}});
	},

	//  Cada vez que se quiera almacenar un movimiento de una partida se llamará 
	//  a esta funcion. Se comprueba que se el judgador que inicia el momimiento
	//  está autorizado (está en la lista de jugadores), despues se almacena la 
	//  jugada en la lista de jugadas de la partida.
	RegistrarMovimiento : function(id,jugador,movimiento){
		console.log("Registrar Movimientos");
		//if(jugadorpermitido)
		Partidas.update(id,{$push:{jugadas:movimiento}});
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
	// 	if(jugadorpermitido)?
		var partida = Partidas.findOne(id).jugadas;
		if (partida.jugadas.length()){
			return partida.jugadores[(partida.jugadores.indexOf(partida.jugadas[jugadas.length-1].jugador)+1)%partida.jugadores.length];
		}else{
			return(partida.jugadores[Math.floor(Math.random()*partida.jugadores.length)]);
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
			puntuacion:[]
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

	//Se llama a este metodo para actualizar la puntuacion de cada jugada (punt) de cada 
	//jugador (jugador) en la partida (id)
	PuntuacionJugadorPartida: function(id,jugador,punt){
		var p = Partidas.findOne(id).puntuacion
		var idx = Partidas.findOne(id).jugadores.indexOf(jugador)
		p[idx]+=punt
		Partidas.update(id,{$set:{puntuacion:p}});
	},

	// Al terminar una partida se debe llamar a este método para todos y cada uno de los jugadores de esa
	// partida y comprobar si han conseguido un nuevo record.
	PuntuacionRecord: function(jugador,punt,juego){
		var user = Meteor.users.findOne({username:jugador})
		for(var i in user.puntuacion){
			if(user.puntuacion[i].juego === juego){
				var p = user.puntuacion[i].record
				if(p>=punt){
					mayor = p;
				}
				else{
					mayor = punt;
				}
				Meteor.users.update({username:jugador},{$set:{"puntuacion.2.record":mayor}})
			}		
		}
	},

	// Al terminar una partida se debe llamar a este método para todos y cada uno de los jugadores de esa
	// partida y sumar la puntuación obtenida a la puntuación que tenía anteriormente.
	PuntuacionTotal: function(jugador,punt,juego){
		var user = Meteor.users.findOne({username:jugador})
		for(var i in user.puntuacion){
			if(user.puntuacion[i].juego === juego){
				var p = user.puntuacion[i].total
				p+=punt
				Meteor.users.update({username:jugador},{$set:{"puntuacion.2.total":p}})
			}		
		}
	},

	// Incluye jugadores en el array de jugadores dado el identificador primario de
	// la partida. Solo los incluye si no están ya incluidos. Aun no tiene un
	// máximo de jugadores.
	IncluirJugador: function(id, jugador){
		Partidas.update(id,{$addToSet:{jugadores:jugador}})
		return id
	},
	
	// Incluye observadores en el array de invitados dado el identificador primario de
	// la partida. Solo los incluye si no están ya incluidos. No tiene un
	// máximo de invitados.  
	IncluirInvitado: function(id, invitado){
		Partidas.update(id,{$addToSet:{invitados:invitado}})
		return ("_"+id);
	},
	
	// Cambia el estado de una partida a "Empezada" dado su identificador.
	EmpezarPartida:function(id){
		Partidas.update(id,{$set:{estado:"Empezada"}});
	},
	
	// Cambia el estado de una partida a "Terminada" dado su identificador.
	TerminarPartida:function(id){
		Partidas.update(id,{$set:{estado:"Terminada"}});

		return ("__Partida"+id+"__");
	},
	
	//Metodo temporal para añadir puntuacion a jugadores de partidas en curso
	AñadirPuntuacionTemporal: function(id,jugador,punt){
		var p = Partidas.findOne(id).puntuacion
		var idx = Partidas.findOne(id).jugadores.indexOf(jugador)
		p[idx]+=punt
		Partidas.update(id,{$set:{puntuacion:p}});		
	},
	
	//Disponible
	DevuelveFicha:function(){
		return Aleatorio();
	},
	//Hay que pasar una Tablero dado de momento, hare que nosotros cojamos el tablero de plataforma
	ColocaFicha:function(Tablero, Ficha, x, y){  // Dado una ficha y dos posiciones, se devuelve un booleano para si se puede o no colocar esa ficha
										 
		return colocarficha();
	},
	
	ColocarSeguidor:function(ficha, campoficha, rotacion, x, y){
		return 1;	//funcion que devuelve si se puede poner un seguidor en la posicion de la ficha correspondiente.
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


RegistrarMovimiento = function(id_partida,jugador,movimiento){
    console.log("Registrar Movimientos");
    console.log(this.args);
 	var seq = Partidas.find({id:id_partida}).count+1; //Sacar la secuencia del count
	Partidas.insert({
		id: id_partida,
		jugador: jugador,
		seq: seq,
		mov: movimiento
	})
	return 'poyas'
};

UltimoMovimiento = function(id_partida){
    console.log("Ultimo Movimiento");
    console.log(this.args);
	var jugada = Partidas.find({id: id_partida},{sort:{seq:-1},limit:1});
	return jugada;
};

TerminarPartida = function(){
    console.log("Terminar Partida");
    console.log(this.args);
};

SubscribirseaPartida = function(id_partida){
   console.log("SubscribirseaPartida");
   console.log(this.args);
};
/*
//Función para comprobar donde esta el seguidor
PosSeg = function(){



};

ColSeguidor = function(Id, Ficha, PosSeg, x, Y){
	//Aqui buscamos el tablero del que se nos está pidiendo que busquemos si se puede poner seguidor
	Tablero = Tableros[x].id; // Lo hace Alberto que se le da bien
	
	// Para que funcione tenemos que pasar primero la forma de leer los seguidores suya a la nuestra

	//       1
	//    -------
	//  4 |     | 2
	//    |     |
	//    -------
	//       3

	// Primero derivar sabiendo que vamos a tener 3 posibilidades de de posicionar del seguidor
 	if 	(PosSeg == 1)
	 
};
*/

/* Funcion para colocar seguidor en un castillo

	hay que ver si hay otro seguidor de otro jugador ya puesto en ese castillo para decir si se puede poner o no.
	
	Es un esbozo del algoritmo a usar===>>> tengo que hablar con Alberto y Pedro para acabar de concretar
*/
ColocarSeguidorCastillo = function(Id, Ficha, PosSeg, X, Y){
	// Posibles fichas que tengo que comprobar
	//no estoy seguro de que pueda coger los datos de estos arrays. De momento se mantiene
	var FichasLadoCastilloConexos =[
		'c3mur',
		'mur1',
		'cmur',
		'ccmur',
		'ccmur3',
		'murcam',
		'ccmur2',
		'ccmur2e',
		'murcame',
		'ciucam2e',
		'ciucam',
		'ciucam2',
		'chmur',
		'chmure',
		'ciucame',
		'ciudad'
	];
	
	var Fichas2LadosCierranCastillo =[
		'mur2',
		'mur2c'
	];
	
	var arr = [];	//Array con todas las direcciones por las que ya hemos pasado
	var constante = 0; //Con esta constante sabremos cuantas fichas hemos investigado en MeteDirec

	var Entrar = 0;
	MeteDirec = function(X, Y){         // Diccionario de las posiciones que ha tenido ese camino, para comprobar si hemos retornado al inicio.
		console.log("Metemos direccion: " + X + "," + Y);
    	var obj = {
			x: X,
			y: Y
		}
		arr.push(obj);
		constante++;
		Entrar = 1;
	};

	//Funcion que nos devuelve si en esa posicion ya hemos estado
	DarDirec = function(X, Y){
		Encontrado = true;
		if (Entrar == 1){
			for (i = 0; i <= constante - 1; i++){
				if (arr[i].x == X && arr[i].y == Y)				
					Encontrado = false;
			}
			return Encontrado;
		}		
		else
			return true;
	};
	
	
};

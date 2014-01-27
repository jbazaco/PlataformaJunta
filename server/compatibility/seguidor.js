
//Función para comprobar donde esta el seguidor
//PosSeg = function(){




//Función que mira si se puede poner el seguidor en la ficha, teniendo en cuenta los caminos
//Pos = posicion del seguidor dentro de la ficha
PonerSeguidorCamino = function(Tablero, Pos, X, Y){
	var fincamino = [ //Fichas que cierran camino
		'c3mur',
		'mc',
		'c4',
		'c3',
		'chmur',
		'chmure'
	];
	var contcamino = [ //Fichas que continuan camino
		'cc',
		'cr',
		'cmur',
		'ccmur',
		'ccmur3',
		'ccmur2',
		'ccmur2e'
	];

	var seguidores = 0;
	var flag = 0;
	var colocar_seguidor = false;
	var Ficha_Inicio = Tablero[X][Y];
	var direcciones = [];
	var z = 0;

	MeteDirec = function(X, Y){ 	
		var posicion = {
			x: X,
			y: Y
		}
		direcciones.push(posicion);
		z++;
	};

	DarDirec = function(X, Y){
		Encontrado = true;
		for (i = 0; i <= z - 1; i++){
			if (direcciones[i].x == X && direcciones[i].y == Y)
				Encontrado = false;
		}
		return Encontrado;
	};


	Recursiva = function(Tablero,banner,flag,X,Y) {

		if ((Tablero[X][Y] != 0) && (flag != 1)){ 	// Caso en el que tenemos ficha en esa dirección y todavía no hemos finalizado camino 	

			if (fincamino.indexOf(Tablero[X][Y].nombre) != -1){ 		// Si la ficha está en fincamino ya hemos finalizado el camino 		
				if (banner == "abajo"){	
					if (Tablero[X][Y].scuadrado != 8){
						coloca_seguidor == true;
					}
				}else if (banner == "izquierda"){
					if (Tablero[X][Y].scuadrado != 4){
						coloca_seguidor == true;
					}
				}else if (banner == "arriba"){
					if (Tablero[X][Y].scuadrado != 2){
						coloca_seguidor == true;
					}
				}else if (banner == "derecha"){
					if (Tablero[X][Y].scuadrado != 6){
						coloca_seguidor == true;
					}
				}			
				flag = flag + 1;

			}
			else if(contcamino.indexOf(Tablero[X][Y].nombre) != -1){ // Si la ficha está en contcamino seguimos haciendo recursiva

				if (banner == "abajo"){	
					if (Tablero[X][Y].scuadrado == 8){
						coloca_seguidor == false;
					}
				}else if (banner == "izquierda"){
					if (Tablero[X][Y].scuadrado == 4){
						coloca_seguidor == false;
					}
				}else if (banner == "arriba"){
					if (Tablero[X][Y].scuadrado == 2){
						coloca_seguidor == false;
					}
				}else if (banner == "derecha"){
					if (Tablero[X][Y].scuadrado == 6){
						coloca_seguidor == false;
					}
				}
			
				if ((Tablero[X][Y].u == 'camino') && (banner != 'arriba') && DarDirec(X,Y)){	
					if (Tablero[X][Y] == 2){
						flag = flag + 1;
						coloca_seguidor = false;
					}			
					Y1 = Y + 1;	
					MeteDirec(X,Y);				
					Recursiva(Tablero, 'abajo', flag, X, Y1);
				}
				if ((Tablero[X][Y].r == 'camino') && (banner != 'derecha') && DarDirec(X,Y)){			
					if (Tablero[X][Y] == 6){
						flag = flag + 1;
						coloca_seguidor = false;
					}		
					X1 = X + 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'izquierda', flag, X1, Y);
				}
				if ((Tablero[X][Y].d == 'camino') && (banner != 'abajo') && DarDirec(X,Y)){		
					if (Tablero[X][Y] == 8){
						flag = flag + 1;
						coloca_seguidor = false;
					}
					Y2 = Y - 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'arriba', flag, X, Y2);
				}
				if ((Tablero[X][Y].l == 'camino') && (banner != 'izquierda') && DarDirec(X,Y)){ 	
					if (Tablero[X][Y] == 4){
						flag = flag + 1;
						coloca_seguidor = false;
					}					
					X2 = X - 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'derecha', flag, X2, Y);
				}
			}
		}
	};

	SigueCamino = function(Tablero,Ficha,X,Y){		
		if (Ficha.u == 'camino'){
			Y1 = Y + 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "abajo", flag, X, Y1);	
		}
		if (Ficha.r == 'camino') {			
			X1 = X + 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "izquierda", flag, X1, Y);
		}
		if (Ficha.d == 'camino') {		
			Y2 = Y - 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "arriba", flag, X, Y2);
		}
		if (Ficha.l == 'camino'){			
			X2 = X - 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "derecha", flag, X2, Y);
		}
	};



	if (Pos == 2){  //miro arriba de la ficha
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){  // Si la ficha esta en fincamino	
			//flag = flag + 1; 								// Le sumamos uno porque va a ser un extremo del cierra camino(Va a haber dos)
			Y1 = Y + 1; 									// Vamos para arriba
			MeteDirec(X,Y);
			Recursiva(Tablero, "abajo", flag, X, Y1); 		// Llamamos a la funcion Recursiva pasandole la siguiente ficha y donde tiene que ir	
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){ 	//Aquí le diremos para donde tiene que tirar cada camino					
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}		
	}	
	else if (Pos == 6){ //Miro Derecha
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			X1 = X + 1; //Vamos para la derecha
			MeteDirec(X,Y);
			Recursiva(Tablero, "izquierda", flag, X1, Y);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}
	}
	else if (Pos == 8){ //Miro Abajo
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			Y2 = Y - 1; //Vamos para abajo
			MeteDirec(X,Y);
			Recursiva(Tablero, "arriba", flag, X, Y2);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}			
	}
	else if (Pos == 4){ //Miro Izquierda
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			X2 = X - 1; //Vamos para la izquierda
			MeteDirec(X,Y);	
			Recursiva(Tablero, "derecha", flag, X2, Y);		
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}	
	}
	else
		console.log("El Pos es incorrecto");

	
	direcciones = [];

	return colocar_seguidor;;
		
};


/*};

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

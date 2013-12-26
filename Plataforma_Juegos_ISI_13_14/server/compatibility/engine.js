
//       1
//    -------
//  4 |     | 2
//    |     |
//    -------
//       3

var CASTILLO = 'castillo';
var CAMINO = 'camino';
var CAMPO = 'campo;'

var FichaPropiedades = {
	murcam:  {nombre:"murcam", u:CAMPO,    r:CAMPO,    d:CASTILLO, l:CASTILLO, cont:5 },        		//media ficha muralla media ficha campo
	c3mur: 	 {nombre:"c3mur", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CASTILLO, cont:3 },           		//cruce de 3 caminos con muralla al lado
	mur2: 	 {nombre:"mur2", u:CAMPO,    r:CASTILLO, d:CAMPO,    l:CASTILLO, cont:3 },               	//una muralla a cada lado de la ficha
	m: 		 {nombre:"m", u: CAMPO,   r:CAMPO,    d:CAMPO,    l:CAMPO ,   cont:4 },                			//monasterio
  	mc: 	 {nombre:"mc", u:CAMPO,    r:CAMINO,   d:CAMPO,    l:CAMPO,    cont:2 },                			//monasterio con camino
	c4: 	 {nombre:"c4", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CAMINO,   cont:1 },                		//cruce de 4 caminos
	cc: 	 {nombre:"cc", u:CAMINO,   r:CAMINO,   d:CAMPO,    l:CAMPO,    cont:9 },                		//camino curva
 	cr: 	 {nombre:"cr", u:CAMPO,    r:CAMINO,   d:CAMPO,    l:CAMINO,   cont:8 },                		//camino recto
 	c3: 	 {nombre:"c3", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CAMPO,    cont:4 },                		//cruce de 3 caminos
	ciudad:  {nombre:"ciudad", u:CASTILLO, r:CASTILLO, d:CASTILLO, l:CASTILLO, cont:1 },        	//todo ciudad con escudo
	ciucam:  {nombre:"ciucam", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CASTILLO, cont:3 },        		//ciudad con un lado de campo
	chmur: 	 {nombre:"chmur", u:CASTILLO, r:CAMINO,   d:CASTILLO, l:CASTILLO, cont:1 },   			//camino hacia muralla
	mur2c: 	 {nombre:"mur2c", u:CASTILLO, r:CAMPO,    d:CAMPO,    l:CASTILLO, cont:2 },        			//2 murallas en lados contiguos
	mur1: 	 {nombre:"mur1", u:CAMPO,    r:CAMPO,    d:CAMPO,    l:CASTILLO, cont:5 },        				//1 muralla en un lado y el resto campo
 	cmur: 	 {nombre:"cmur", u:CAMINO,   r:CAMPO,    d:CAMINO,   l:CASTILLO, cont:3 },        			//camino recto con muralla al lado(una inicial)
 	ccmur: 	 {nombre:"ccmur", u:CAMINO,   r:CAMINO,   d:CAMPO,    l:CASTILLO, cont:3 },        			//camino con curva y con muralla al lado
	ccmur3:  {nombre:"ccmur3", u:CAMPO,    r:CAMINO,   d:CAMINO,   l:CASTILLO, cont:3 },        			//camino con curva y muralla al lado(otro)
	ciucam2: {nombre:"ciucam2", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CAMPO,    cont:1 },        		//ciudad con 2 lados opuestos de campo
	ccmur2:  {nombre:"ccmur2", u:CAMINO,   r:CAMINO,   d:CASTILLO, l:CASTILLO, cont:3 },	 			//camino con curva con 2 lados de ciudad contiguos
 	chmure:  {nombre:"chmure", u:CASTILLO, r:CAMINO,   d:CASTILLO, l:CASTILLO, cont:2 }, 			//camino hacia muralla con escudo
  	ccmur2e: {nombre:"ccmur2e", u:CAMINO,   r:CAMINO,   d:CASTILLO, l:CASTILLO, cont:2 },     		//camino con curva con 2 lados de ciudad,escudo
  	murcame: {nombre:"murcame", u:CAMPO,    r:CAMPO,    d:CASTILLO, l:CASTILLO, cont:2 },        		//media ficha muralla media ficha campo con escudo
  	ciucame: {nombre:"ciucame", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CASTILLO, cont:1 },        	//ciudad con un lado de campo con escudo
  	ciucam2e:{nombre:"ciucam2e", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CAMPO,    cont:2 }        		//ciudad con 2 lados opuestos de campo con escudo
}; 

//Defino los campos de las fichas. tengo que comprobar con el dibujo de las fichas ahora mismo no lo tengo.
//       1
//    -------
//  4 |1 2 3| 2
//    |4 5 6|
//    |7 8 9|
//    -------
//       3
// no necesito un array porque el nombre lo consigo de la estructura de arriba.

//Creo el array y luego hago el random del número que le pasamos al array
var Aleatorio = function(){
	var conjunto = _.toArray(FichaPropiedades);
	var a = Math.floor(Math.random()*24);
	while (conjunto[a].cont == 0){
		a = Math.floor(Math.random()*24);
	}
	// Les restamos uno de la que usamos
	conjunto[a].cont = conjunto[a].cont -1;	
	return conjunto[a];
};

var Prueba = function(A){
	var conjunto = _.toArray(FichaPropiedades);
	return conjunto[A];
}
	
//Creamos tablero
CrearTablero = function(){
	var x = new Array(72);
	for (var i = 0; i < 72; i++){
		x[i] = new Array(72);
	}//Rellenamos el tablero con cero para identificar posiciones vacías
	for (var i = 0; i < 72; i++){
		for (var j = 0; j < 72; j++){
			x[i][j] = 0;
		}
	}
	return x;
};
//Procedimiento que mira las posiciones del tablero para ver si se puede colocar la ficha
//Terminología: U: Up, R:Right, D: Down, L:Left. 
colocarficha = function(Tablero, Ficha, X, Y){
		var colocado = true;
		if (Tablero[X][Y] == 0){
			if ((X != 0 && Y != 0) || (X != 72 && Y != 0) || (Y != 0)){ //En cada una comprobamos las esquinas y los bordes(L-U,U,R-A)
				if (Tablero[X][(Y-1)] != 0){//Arriba
					if (Tablero[X][(Y-1)].d != Ficha.u)
						colocado = false;
				}
			}
			if ((X != 72 && Y != 0) || (X != 72 && Y != 72) || (X != 0)){// (R-U,R,R-D)
				if (Tablero[(X+1)][Y] != 0){//Derecha
					if (Tablero[(X+1)][Y].l != Ficha.r)
						colocado = false;				
				}
			}
			if ((X != 0 && Y != 72) || (X != 72 && Y != 72) || (Y != 72)){//(R-D, D, L-D)
				if (Tablero[X][(Y+1)] != 0){ //Abajo
					if (Tablero[X][(Y+1)].u != Ficha.d)
						colocado = false;
				}
			}
			if ((X != 0 && Y != 0) || (X != 0 && Y != 72) || (X != 0)){//(L-D, L, L-U)
				if (Tablero[(X-1)][Y] != 0){ //Izquierda
					if (Tablero[(X-1)][Y].r != Ficha.l)
						colocado = false;
				}
			}			
		}
		return colocado;			
};

direccamino = function(Ficha){ //Funcion que dada una ficha nos dice donde tiene los caminos
	var direc=[];
	if (Ficha.u == 'camino')
		direc.push('arriba');
	else if(Ficha.r == 'camino')
		direc.push('derecha');
	else if(Ficha.d == 'camino')
		direc.push('abajo');
	else if(Ficha.l == 'camino')
		direc.push('izquierda');
}
//funcion a la que se llamara a la hora de poner una ficha y comprobar si se pueden
//atribuir puntos a ese jugador o todavía no para ello tendremos dos objetivos a cumplir:
//			- Se cierra el castillo
//			- Hay algun seguidor en ese castillo
//Num = Posicion del seguidor dentro de la ficha(1..4)
//X = Posicion inicial de la ficha eje X.   Y = Posicion inicial de la ficha eje Y. 
CuentaPCamino = function(Tablero, Ficha, Num, X, Y){
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
	
	puntos = 0;
	flag = 0; //2 fincamino. 
	//Saber que aquí para probarlo solo van a entrar las fichas que estén en cont y fin camino
	//Comprobamos donde esta la ficha -- 4 Posibilidades (U-R-D-L)
	if(Num == 1){ //Miro Arriba
		if ((fincamino.indexOf(Ficha.nombre) != -1) && (Tablero[X][(Y-1)] != 0)){ //Buscamos si la ficha esta en fincamino
			flag = flag + 1; // Le sumamos uno porque va a ser un extremo del cierra camino(Va a haber dos)
			Y = Y - 1; //Vamos para arriba
			Recursiva(Tablero, "abajo", flag, X, Y); // Llamamos a la funcion Recursiva pasandole la siguiente ficha y donde tiene que ir
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){ //Aquí le diremos para donde tiene que tirar cada camino
			Continua(Tablero, Ficha, X, Y);
		}		
	}	
	else if (Num == 2){ //Miro Derecha
		if ((fincamino.indexOf(Ficha.nombre) != -1) && (Tablero[(X+1)][Y] != 0)){
			flag = flag + 1;
			X = X + 1; //Vamos para la derecha
			Recursiva(Tablero, "izquerda", flag, X, Y);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			Continua(Tablero, Ficha, X, Y);
		}
	}
	else if (Num == 3){ //Miro Abajo
		if ((fincamino.indexOf(Ficha.nombre) != -1) && (Tablero[X][(Y+1)] != 0)){
			flag = flag + 1;
			Y = Y + 1; //Vamos para abajo
			Recursiva(Tablero, "arriba", flag, X, Y);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			Continua(Tablero, Ficha, X, Y);
		}			
	}
	else if (Num == 4){ //Miro Izquierda
		if ((fincamino.indexOf(Ficha.nombre) != -1) && (Tablero[(X-1)][Y] != 0)){
			flag = flag + 1;
			X = X - 1; //Vamos para la izquierda
			Recursiva(Tablero, "derecha", flag, X, Y);			
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			Continua(Tablero, Ficha, X, Y);
		}	
	}
	else
		alert("El Num es incorrecto");
	//Hay que comprobar el que no revisemos dos posiciones iguales!!!
	//Funcion para las fichas iniciales continuas(Con dos posibles direcciones).
	Continua = function(Tablero, Ficha, X, Y){ 
		var direc = direccamino(Ficha);
		var i = 0;		
		if (direc[i] == 'arriba'){
			i = i + 1;
			Y = Y - 1;
			Recursiva(Tablero, "abajo", flag, X, Y);		
		}
		else if (direc[i] == 'derecha') {
			if (i < 1){i = i + 1};
			X = X + 1;
			Recursiva(Tablero, "izquierda", flag, X, Y);
		}
		else if (direc[i] == 'abajo') {	
			if (i < 1){i = i + 1};
			Y = Y + 1;
			Recursiva(Tablero, "arriba", flag, X, Y);
		}
		else{
			X = X + 1;
			Recursiva(Tablero, "derecha", flag, X, Y);
		}
	};
	//Funcion recursiva a la que le voy pasando la ficha siguiente
	Recursiva = function(Tablero, prohibido, flag, X, Y){

	};
	
	return puntos;
};

//función que comprueba si se ha cerrado el castillo y devuelve la puntuación.
//Para ello dos pasos:
	//ver si se ha cerrado el castillo.
	//ver si hay un caballero en el castillo cerrado.
CierraCastillo = function(Tablero, Ficha, Num, X, Y){
	
	var fichas1LadoCastillo =[
		'c3mur',
		'mur1',
		'cmur',
		'ccmur',
		'ccmur3'
	];
	
	
};

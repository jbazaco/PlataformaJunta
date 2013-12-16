
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

//defino los campos de las fichas. tengo que comprobar con el dibujo de las fichas ahora mismo no lo tengo.
//       1
//    -------
//  4 |1 2 3| 2
//    |4 5 6|
//    |7 8 9|
//    -------
//       3
// no necesito un array porque el nombre lo consigo de la estructura de arriba.
/*var CampoFicha = {
uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9
};*/

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

/*var Prueba = function(A){
	var conjunto = _.toArray(FichaPropiedades);
	return conjunto[A];
}*/
	
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
						colocado = 'arriba';
				}
			}
			if ((X != 72 && Y != 0) || (X != 72 && Y != 72) || (X != 0)){// (R-U,R,R-D)
				if (Tablero[(X+1)][Y] != 0){//Derecha
					if (Tablero[(X+1)][Y].l != Ficha.r)
						colocado = 'derecha';				
				}
			}
			if ((X != 0 && Y != 72) || (X != 72 && Y != 72) || (Y != 72)){//(R-D, D, L-D)
				if (Tablero[X][(Y+1)] != 0){ //Abajo
					if (Tablero[X][(Y+1)].u != Ficha.d)
						colocado = 'Abajo';
				}
			}
			if ((X != 0 && Y != 0) || (X != 0 && Y != 72) || (X != 0)){//(L-D, L, L-U)
				if (Tablero[(X-1)][Y] != 0){ //Izquierda
					if (Tablero[(X-1)][Y].r != Ficha.l)
						colocado = 'Izquierda';
				}
			}			
		}
		return colocado;			
};





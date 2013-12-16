// Hacemos primero un objeto dummy

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
var CampoFicha = {
uno:1, dos:2, tres:3, cuatro:4, cinco:5, seis:6, siete:7, ocho:8, nueve:9
};

//Creo el array y luego hago el random del número que le pasamos al array
var Aleatorio = function(){
	var conjunto = _.toArray(FichaPropiedades);
	var a = Math.floor(Math.random()*24);
	//alert("Numero aleatorio: " + a);
	//alert("Sprite aleatorio: " + conjunto[a]);
	return conjunto[a];
};
	
//Creamos tablero
CrearTablero = function(){
	var x = new Array(72);
	for (var i = 0; i < 72; i++){
		x[i] = new Array(72);
	}
	for (var i = 0; i < 72; i++){
		for (var j = 0; j < 72; j++){
			x[i][j] = 0;
		}
	}
	return x;
};

colocarficha = function(Tablero, Ficha, X, Y){
		var colocado = true;
		if (Tablero[X][Y] == 0){
			if (Tablero[(X-1)][Y] == 0){
				if (Tablero[X][Y].u != Ficha.d){
					colocado = false;
				}
			}	
			else if (Tablero[X][(Y+1)] == 0){
				if (Tablero[X][Y].r != Ficha.l){
					colocado = false;
				}
			}
			else if (Tablero[(X+1)][Y] == 0){
				if (Tablero[X][Y].d != Ficha.u)	{
					colocado = false;
				}
			}
			else if (Tablero[X][(Y-1)] == 0){
				if (Tablero[X][Y].l != Ficha.r){
					colocado = false;				
				}
			}		
		}
		return colocado;			
};

//añado la funcion colocar seguidor. NECESITARE QUE LO COMPROBEIS CHICOS.
// X e Y son la posicion de la ficha.
//campoficha es dentro de una ficha las 9 posiciones empezando desde arriba a la izquierda que tiene una ficha 
//tengo que ver que ficha es para saber que valor CampoFicha es el correspondiente ya que no es lo mismo el campo uno
//de la ficha m que de la ficha murcam. tambien hay que tener en cuenta si hay rotacion o no.

//tengo que definir los 9 campos de todas las fichas. lo hago arriba para seguir estructura.
//Si campoficha es un numero no necesito la estructura mencionada. De momento la dejo porque no lo tengo claro pero ahora no la
//voy a usar.

colocarseguidor = function(Ficha, CampoFicha, Rotacion, X, Y){
	var nombreficha = Ficha.nombre;
	var campoficha = CampoFicha;
	
	if (nombreficha == "murcam" && Rotacion==0){
		if (CampoFicha==1){
			alert("el seguidor esta arriba a la izquierda");
		}
		if (CampoFicha==2){
			alert("el seguidor esta arriba en el medio");
		}
		//asi con las 9 posiciones y sin estar rotado
		//no se que hacer cuando me meto dentro de if en el sentido que no se que devolver o saber si el seguidor
		//se puede colocar o no. 
	}  
};



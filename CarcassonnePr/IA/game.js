// Hacemos primero un objeto dummy

//       1
//    -------
//  4 |     | 2
//    |     |
//    -------
//       3


FICHA_H = 62;
FICHA_W = 62;

var sprites = {
        m: { sx: 253, sy: 44, w: FICHA_W, h: FICHA_H},                //monasterio
        mc: { sx: 331, sy: 44, w: FICHA_W, h: FICHA_H},                //monasterio con camino
        cr: { sx: 563, sy: 44, w: FICHA_W, h: FICHA_H},                //camino recto
        cc: { sx: 485, sy: 44, w: FICHA_W, h: FICHA_H},                //camino curva
        c3: { sx: 640, sy: 44, w: FICHA_W, h: FICHA_H},                //cruce de 3 caminos
        c4: { sx: 408, sy: 44, w: FICHA_W, h: FICHA_H},                //cruce de 4 caminos
        cmur: { sx: 408, sy: 137, w: FICHA_W, h: FICHA_H},        //camino recto con muralla al lado(una de las fichas es la inicial)
        ccmur: { sx: 485, sy: 137, w: FICHA_W, h: FICHA_H},        //camino con curva y con muralla al lado
        chmur: { sx: 175, sy: 137, w: FICHA_W, h: FICHA_H},        //camino hacia muralla
        chmure: { sx: 21, sy: 230, w: FICHA_W, h: FICHA_H},        //camino hacia muralla con escudo
        c3mur: { sx: 98, sy: 44, w: FICHA_W, h: FICHA_H},                //cruce de 3 caminos con muralla al lado
        ccmur2: { sx: 717, sy: 137, w: FICHA_W, h: FICHA_H},        //camino con curva con 2 lados de ciudad contiguos
        ccmur2e: { sx: 98, sy: 230, w: FICHA_W, h: FICHA_H},        //camino con curva con 2 lados de ciudad contiguos con escudo
        ccmur3: { sx: 562, sy: 137, w: FICHA_W, h: FICHA_H},        //camino con curva y muralla al lado(otro)
        murcam: { sx: 21, sy: 44, w: FICHA_W, h: FICHA_H},        //media ficha muralla media ficha campo
        murcame: { sx: 176, sy: 230, w: FICHA_W, h: FICHA_H},        //media ficha muralla media ficha campo con escudo
        mur2: { sx: 176, sy: 44, w: FICHA_W, h: FICHA_H},                //una muralla a cada lado de la ficha
        mur2c: { sx: 253, sy: 137, w: FICHA_W, h: FICHA_H},        //2 murallas en lados contiguos
        mur1: { sx: 330, sy: 137, w: FICHA_W, h: FICHA_H},        //1 muralla en un lado y el resto campo
        ciudad: { sx: 21, sy: 137, w: FICHA_W, h: FICHA_H},        //todo ciudad con escudo
        ciucam: { sx: 98, sy: 137, w: FICHA_W, h: FICHA_H},        //ciudad con un lado de campo
        ciucame: { sx: 331, sy: 230, w: FICHA_W, h: FICHA_H},        //ciudad con un lado de campo con escudo
        ciucam2: { sx: 640, sy: 137, w: FICHA_W, h: FICHA_H},        //ciudad con 2 lados opuestos de campo
        ciucam2e: { sx: 408, sy: 230, w: FICHA_W, h: FICHA_H},        //ciudad con 2 lados opuestos de campo con escudo
        interrogante: { sx: 253, sy: 230, w: FICHA_W, h: FICHA_H}        //ficha con un interrogante
};

var CASTILLO = 'castillo';
var CAMINO = 'camino';
var CAMPO = 'campo;'

var FichaPropiedades = {
	murcam: {u:CAMPO, r:CAMPO, d:CASTILLO, l:CASTILLO, cont:5 },        			//media ficha muralla media ficha campo
	c3mur: {u:CAMINO, r:CAMINO, d:CAMINO, l:CASTILLO, cont:3 },           //cruce de 3 caminos con muralla al lado
	mur2: {u:CAMPO, r:CASTILLO, d:CAMPO, l:CASTILLO, cont:3 },               //una muralla a cada lado de la ficha
	m: {u: CAMPO, r:CAMPO, d:CAMPO, l:CAMPO , cont:4},                		//monasterio
  mc: {u:CAMPO, r:CAMINO, d:CAMPO, l:CAMPO, cont:2 },                		//monasterio con camino
	c4: {u:CAMINO, r:CAMINO, d:CAMINO, l:CAMINO, cont:1 },                //cruce de 4 caminos
	cc: {u:CAMINO, r:CAMINO, d:CAMPO, l:CAMPO, cont:9 },                	//camino curva
  cr: {u:CAMPO, r:CAMINO, d:CAMPO, l:CAMINO, cont:8 },                	//camino recto
 	c3: {u:CAMINO, r:CAMINO, d:CAMINO, l:CAMPO, cont:4 },                	//cruce de 3 caminos
	ciudad: {u:CASTILLO, r:CASTILLO, d:CASTILLO, l:CASTILLO, cont:1},        			//todo ciudad con escudo
	ciucam: {u:CASTILLO, r:CAMPO, d:CASTILLO, l:CASTILLO, cont:3 },        			//ciudad con un lado de campo
	chmur: {u:CASTILLO, r:CAMINO, d:CASTILLO, l:CASTILLO, cont:1 },   		//camino hacia muralla
	mur2c: {u:CASTILLO, r:CAMPO, d:CAMPO, l:CASTILLO, cont:2 },        			//2 murallas en lados contiguos
	mur1: {u:CAMPO, r:CAMPO, d:CAMPO, l:CASTILLO, cont:5 },        				//1 muralla en un lado y el resto campo
 	cmur: {u:CAMINO, r:CAMPO, d:CAMINO, l:CASTILLO, cont:3 },        			//camino recto con muralla al lado(una de las fichas es la inicial)
 	ccmur: {u:CAMINO, r:CAMINO, d:CAMPO, l:CASTILLO, cont:3 },        		//camino con curva y con muralla al lado
	ccmur3: {u:CAMPO, r:CAMINO, d:CAMINO, l:CASTILLO, cont:3 },        			//camino con curva y muralla al lado(otro)
	ciucam2: {u:CASTILLO, r:CAMPO, d:CASTILLO, l:CAMPO, cont:1 },        		//ciudad con 2 lados opuestos de campo
	ccmur2: {u:CAMINO, r:CAMINO, d:CASTILLO, l:CASTILLO, cont:3 },	 			//camino con curva con 2 lados de ciudad contiguos
 	chmure: {u:CASTILLO, r:CAMINO, d:CASTILLO, l:CASTILLO, cont:2 }, 			//camino hacia muralla con escudo
  ccmur2e: {u:CAMINO, r:CAMINO, d:CASTILLO, l:CASTILLO, cont:2 },     		//camino con curva con 2 lados de ciudad contiguos con escudo
  murcame: {u:CAMPO, r:CAMPO, d:CASTILLO, l:CASTILLO, cont:2 },        		//media ficha muralla media ficha campo con escudo
  ciucame: {u:CASTILLO, r:CAMPO, d:CASTILLO, l:CASTILLO, cont:1 },        		//ciudad con un lado de campo con escudo
  ciucam2e: {u:CASTILLO, r:CAMPO, d:CASTILLO, l:CAMPO, cont:2 },        		//ciudad con 2 lados opuestos de campo con escudo
};
Inicio = new function() {
	Elegir = function() {
		var aleatorio = random.sprites();
		while (FichaPropiedades[aleatorio].cont == 0){
			aleatorio = random.sprites();
		}
		//aleatorio.cont = aleatorio.cont - 1;
		return aleatorio;	
	};	

	Ficha = function(x, y,sprite) {
    	    this.x = x;
    	    this.y = y;
    	    this.w = FICHA_W;
    	    this.h = FICHA_H;
    	    this.sprite = sprite;
			this.prop = FichaPropiedades[sprite]; 
	};

	//Función que una las dos antriores
	Initialize = function(){
			randoms = Elegir();
			var ficha_inicial = new Ficha(394, 263, randoms);
			{{ficha_inicial}};
	
	};	

};
$(function() {
    Inicio();
});

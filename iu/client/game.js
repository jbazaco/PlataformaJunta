//Altura y anchura de una ficha
var FICHA_H = 62;
var FICHA_W = 62;

var sprites = {
	m: { sx: 253, sy: 44, w: FICHA_W, h: FICHA_H},		//monasterio
	mc: { sx: 331, sy: 44, w: FICHA_W, h: FICHA_H},		//monasterio con camino
	cr: { sx: 563, sy: 44, w: FICHA_W, h: FICHA_H},		//camino recto
	cc: { sx: 485, sy: 44, w: FICHA_W, h: FICHA_H},		//camino curva
	c3: { sx: 640, sy: 44, w: FICHA_W, h: FICHA_H},		//cruce de 3 caminos
	c4: { sx: 408, sy: 44, w: FICHA_W, h: FICHA_H},		//cruce de 4 caminos
	cmur: { sx: 408, sy: 137, w: FICHA_W, h: FICHA_H},	//camino recto con muralla al lado(una de las fichas es la inicial)
	ccmur: { sx: 485, sy: 137, w: FICHA_W, h: FICHA_H},	//camino con curva y con muralla al lado
	chmur: { sx: 175, sy: 137, w: FICHA_W, h: FICHA_H},	//camino hacia muralla
	chmure: { sx: 21, sy: 230, w: FICHA_W, h: FICHA_H},	//camino hacia muralla con escudo
	c3mur: { sx: 98, sy: 44, w: FICHA_W, h: FICHA_H},		//cruce de 3 caminos con muralla al lado
	ccmur2: { sx: 717, sy: 137, w: FICHA_W, h: FICHA_H},	//camino con curva con 2 lados de ciudad contiguos
	ccmur2e: { sx: 98, sy: 230, w: FICHA_W, h: FICHA_H},	//camino con curva con 2 lados de ciudad contiguos con escudo
	ccmur3: { sx: 562, sy: 137, w: FICHA_W, h: FICHA_H},	//camino con curva y muralla al lado(otro)
	murcam: { sx: 21, sy: 44, w: FICHA_W, h: FICHA_H},	//media ficha muralla media ficha campo
	murcame: { sx: 176, sy: 230, w: FICHA_W, h: FICHA_H},	//media ficha muralla media ficha campo con escudo
	mur2: { sx: 176, sy: 44, w: FICHA_W, h: FICHA_H},		//una muralla a cada lado de la ficha
	mur2c: { sx: 253, sy: 137, w: FICHA_W, h: FICHA_H},	//2 murallas en lados contiguos
	mur1: { sx: 330, sy: 137, w: FICHA_W, h: FICHA_H},	//1 muralla en un lado y el resto campo
	ciudad: { sx: 21, sy: 137, w: FICHA_W, h: FICHA_H},	//todo ciudad con escudo
	ciucam: { sx: 98, sy: 137, w: FICHA_W, h: FICHA_H},	//ciudad con un lado de campo
	ciucame: { sx: 331, sy: 230, w: FICHA_W, h: FICHA_H},	//ciudad con un lado de campo con escudo
	ciucam2: { sx: 640, sy: 137, w: FICHA_W, h: FICHA_H},	//ciudad con 2 lados opuestos de campo
	ciucam2e: { sx: 408, sy: 230, w: FICHA_W, h: FICHA_H},	//ciudad con 2 lados opuestos de campo con escudo
	interrogante: { sx: 253, sy: 230, w: FICHA_W, h: FICHA_H},	//ficha con un interrogante
	s1: { sx: 511, sy: 242, w: 30, h: 30},			//seguidor amarillo
	s2: { sx: 553, sy: 242, w: 30, h: 30},			//seguidor rosa
	s3: { sx: 596, sy: 242, w: 30, h: 30},			//seguidor azul
	s4: { sx: 640, sy: 242, w: 30, h: 30},			//seguidor verde
	s5: { sx: 682, sy: 242, w: 30, h: 30}		//seguidor naranja
};


startGame = function() {

	

	Game.setBoard(0,Fondo);
	Game.setBoard(1,new GamePoints(0));
	var ficha_inicial = new Ficha(394, 263,"cmur");
	Game.setBoard(Game.boards.length,ficha_inicial);	//ficha inicial
	ficha_inicial.buscar_huecos();
	
	var numjugadores=3; //nos lo tiene que dar la plataforma de momento es un ejemplo
	
	for (i=1;i<=numjugadores;i++){	
		for (k=1;k<=7;k++){
			Game.setBoard(Game.boards.length, new Seguidor("s"+i, i));
		}
	}
	//proximo setboard a partir de 38
	Game.setBoard(Game.boards.length,FichaActual);
	

}


Fondo = new function() {
	this.draw = function(){
		// Dibujar rectangulo azul
		Game.ctx.fillStyle = "#44cbff";
		Game.ctx.fillRect(0,0,850,650);

		//Dibujar barra separadora
		Game.ctx.fillStyle = "#c9c9c9";
		Game.ctx.fillRect(850,0,20,650);

		//Dibujar barra-menu
		Game.ctx.fillStyle = "#000000";
		Game.ctx.fillRect(870,0,200,650); 
	}
}

Ficha = function(x, y, sprite) {
	this.x = x;
	this.y = y;
	this.w = FICHA_W;
	this.h = FICHA_H;
	this.sprite = sprite;
	
	//busca en las posiciones adyacentes de una ficha colocada, y si no hay ninguna ficha, 
	//pone la ficha "interrogante".
	this.buscar_huecos = function(){
		
		var derecha = elemInPos(this.x+this.w, this.y) ;
		if(derecha===null){
			var ficha = new Ficha(this.x+this.w, this.y, "interrogante");
			Game.setBoard(Game.boards.length,ficha);
		}
		
		var izquierda = elemInPos(this.x-this.w, this.y) ;
		if(izquierda===null){
			var ficha = new Ficha(this.x-this.w, this.y, "interrogante");
			Game.setBoard(Game.boards.length,ficha);
		}
		
		var arriba = elemInPos(this.x, this.y-this.h) ;
		if(arriba===null){
			var ficha = new Ficha(this.x, this.y-this.h, "interrogante");
			Game.setBoard(Game.boards.length,ficha);
		}
		var abajo = elemInPos(this.x, this.y+this.h) ;
		if(abajo===null){
			var ficha = new Ficha(this.x, this.y+this.h, "interrogante");
			Game.setBoard(Game.boards.length,ficha);
		}
	}
	
	
	this.draw = function(ctx) {
		SpriteSheet.draw(ctx,this.sprite,this.x, this.y);
	}	
}

//Es un singleton
FichaActual = new function() {
	this.h = FICHA_H;
	this.w = FICHA_W;
	this.inicialx = 940;
	this.inicialy = 120;
	this.x = 940;
	this.y = 120;
	this.sprite = 'interrogante';
	
	//Devuelve true si se gira la ficha
	this.pulsado = function() {
		if (this.sprite === 'interrogante') {
			this.sprite = 'm'; //PEDIR A LA IA!!!, de momento ponemos una ficha cualquiera
			return true;
		}
        alert('Ya has girado la ficha');
		return false;
	}
	//tendra que informar al resto de clientes que ficha le ha salido a este jugador
	//tiene que comprobar que el que hace click es el jugador al que le toca jugar, si no no puede mover

	this.mover = function(x,y) {
		if (this.sprite !== 'interrogante') {
			this.x = x;
			this.y = y;
		}
	}

	this.soltar = function(x,y) {
		//CAMBIAR cuando se coloquen las fichas
		var debajo = elemInPos(x,y);
		if(debajo){
			if (debajo instanceof Ficha){	
				if (debajo.sprite === "interrogante"){
					var nueva_ficha = new Ficha(debajo.x, debajo.y,this.sprite);
					Game.setBoard(Game.boards.length,nueva_ficha);
					nueva_ficha.buscar_huecos();
					console.log("len: "+Game.boards.length);
					this.sprite = "interrogante";
				}
			}		
		}
		this.x = this.inicialx;
		this.y = this.inicialy;
		
	}

	this.draw = function(ctx) {
		SpriteSheet.draw(ctx,this.sprite,this.x,this.y,0);
	}

};


Seguidor = function(sprite, numjugador) {
	
	this.inicialx=900;
	this.inicialy=200;
	if(numjugador){
		this.inicialy=this.inicialy + numjugador*60;
	}
	this.h = 30;
	this.w = 30;
	this.x=this.inicialx;
	this.y=this.inicialy;
	this.sprite=sprite;
	

	this.pulsado = function() {}
	//tiene que comprobar que el que hace click es el jugador al que le toca jugar, si no no puede mover

	this.mover = function(x,y) {
		//CAMBIAR Solo puedes mover tu seguidor
		miJugador=1;
		turno=1;//Falta funcion para saber de quien es el turno
		if(turno==miJugador && this.sprite=="s"+miJugador){
			this.x = x;
			this.y = y;
		}
	}
	
	this.soltar = function(x,y) {
		//CAMBIAR cuando se coloquen las fichas
		this.x = this.inicialx;
		this.y = this.inicialy;
	}


	this.draw = function(ctx) {
		SpriteSheet.draw(ctx,this.sprite,this.x,this.y,0);
	}
};

//Devuelve el elemento dibujado en (x,y)
//El elemento debe tener una funcion pulsado, mover y soltar
elemInPos = function(x, y) {
	//Aqui las acciones que no necesiten estar en tu turno

//	if (!Meteor.user() /*|| !IA.suTurno(Meteor.user().username))*/ ) { 
//		alert('No es tu turno');
//		return null;
//	}
	for(var i=2,len = Game.boards.length;i<len;i++) {
	//Aqui las acciones que necesiten estar en tu turno
		if (Game.boards[i]){
			if (y > Game.boards[i].y && y < Game.boards[i].y+Game.boards[i].h 
					&& x > Game.boards[i].x && x < Game.boards[i].x+Game.boards[i].w) {
				return Game.boards[i];
			}
		}
	}
	return null;
}

$(function() {
    Game.initialize("tablero",sprites,startGame);
});

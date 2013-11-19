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
	interrogante: { sx: 253, sy: 230, w: FICHA_W, h: FICHA_H}	//ficha con un interrogante
};


startGame = function() {
	
	// Dibujar rectangulo azul
	Game.ctx.fillStyle = "#44cbff";
	Game.ctx.fillRect(0,0,850,650);

	//Dibujar barra separadora
	Game.ctx.fillStyle = "#c9c9c9";
	Game.ctx.fillRect(850,0,20,650);

	//Dibujar barra-menu
	Game.ctx.fillStyle = "#000000";
	Game.ctx.fillRect(870,0,200,650); 
/*
	//Quitar cuando avancemos
	SpriteSheet.draw(Game.ctx,"m",60,60);
	SpriteSheet.draw(Game.ctx,"mc",150,60);
	SpriteSheet.draw(Game.ctx,"cr",240,60);
	SpriteSheet.draw(Game.ctx,"cc",330,60);
	SpriteSheet.draw(Game.ctx,"c3",420,60);
	SpriteSheet.draw(Game.ctx,"c4",510,60);
	SpriteSheet.draw(Game.ctx,"cmur",600,60);
	SpriteSheet.draw(Game.ctx,"ccmur",60,150);
	SpriteSheet.draw(Game.ctx,"chmur",150,150);
	SpriteSheet.draw(Game.ctx,"c3mur",240,150);
	SpriteSheet.draw(Game.ctx,"ccmur2",330,150);
	SpriteSheet.draw(Game.ctx,"ccmur3",420,150);
	SpriteSheet.draw(Game.ctx,"murcam",510,150);
	SpriteSheet.draw(Game.ctx,"mur2",600,150);
	SpriteSheet.draw(Game.ctx,"mur2c",60,240);
	SpriteSheet.draw(Game.ctx,"mur1",150,240);
	SpriteSheet.draw(Game.ctx,"ciudad",240,240);
	SpriteSheet.draw(Game.ctx,"ciucam",330,240);
	SpriteSheet.draw(Game.ctx,"ciucam2",420,240);
	SpriteSheet.draw(Game.ctx,"chmure",510,240);
	SpriteSheet.draw(Game.ctx,"ccmur2e",600,240);
	SpriteSheet.draw(Game.ctx,"murcame",60,330);
	SpriteSheet.draw(Game.ctx,"ciucame",150,330);
	SpriteSheet.draw(Game.ctx,"ciucam2e",240,330);
	SpriteSheet.draw(Game.ctx,"interrogante",330,330);
*/

	Game.setBoard(0,FichaActual);
	Game.setBoard(1,new GamePoints(0));
	Game.setBoard(2,ColocarFichas);
}

ColocarFichas = new function() {
	this.draw = function(ctx) {
		SpriteSheet.draw(ctx,"cmur",394, 263);
	}
	
}

//Es un singleton
FichaActual = new function() {
	this.girada = false;
	this.h = FICHA_H;
	this.w = FICHA_W;
	this.x = 940;
	this.y = 80;
	this.sprite = 'interrogante';
	
	//Devuelve true si se gira la ficha
	this.revelar_ficha = function(x, y) {

		if (this.sprite === 'interrogante') {
			this.sprite = 'm'; //PEDIR A LA IA!!!, de momento ponemos una ficha cualquiera
			return true;
		}
        alert('Ya has girado la ficha');
		return false;
	}
	//tendra que informar al resto de clientes que ficha le ha salido a este jugador
	//tiene que comprobar que el que hace click es el jugador al que le toca jugar, si no no puede mover

	this.draw = function(ctx) {
		SpriteSheet.draw(ctx,this.sprite,this.x,this.y,0);
	}

};

$(function() {
    Game.initialize("tablero",sprites,startGame);
});

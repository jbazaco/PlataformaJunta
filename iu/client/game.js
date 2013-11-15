//Altura y anchura de una ficha
var FICHA_H = 108;
var FICHA_W = 108;

var sprites = {
	m: { sx: 5, sy: 6, w: FICHA_W, h: FICHA_H},					//monasterio
	mc: { sx: 130, sy: 6, w: FICHA_W, h: FICHA_H},				//monasterio con camino
	cr: { sx: 255, sy: 5, w: FICHA_W, h: FICHA_H},				//camino recto
	cc: { sx: 384, sy: 6, w: FICHA_W, h: FICHA_H},				//camino curva
	c3: { sx: 4, sy: 151, w: FICHA_W, h: FICHA_H},				//cruce de 3 caminos
	c4: { sx: 127, sy: 154, w: FICHA_W, h: FICHA_H},			//cruce de 4 caminos
	cmur: { sx: 255, sy: 153, w: FICHA_W, h: FICHA_H},			//camino recto con muralla al lado(una de las fichas es la inicial)
	ccmur: { sx: 381, sy: 151, w: FICHA_W, h: FICHA_H},			//camino con curva y con muralla al lado
	chmur: { sx: 3, sy: 298, w: FICHA_W, h: FICHA_H},			//camino hacia muralla
	c3mur: { sx: 127, sy: 298, w: FICHA_W, h: FICHA_H},			//cruce de 3 caminos con muralla al lado
	ccmur2: { sx: 255, sy: 297, w: FICHA_W, h: FICHA_H},		//camino con curva con 2 lados de ciudad
	ccmur3: { sx: 380, sy: 295, w: FICHA_W, h: FICHA_H},		//camino con curva y muralla al lado(otro)
	murcam: { sx: 6, sy: 445, w: FICHA_W, h: FICHA_H},			//media ficha muralla media ficha campo
	mur2: { sx: 126, sy: 445, w: FICHA_W, h: FICHA_H},			//una muralla a cada lado de la ficha
	mur2c: { sx: 255, sy: 445, w: FICHA_W, h: FICHA_H},			//2 murallas en lados contiguos
	mur1: { sx: 379, sy: 444, w: FICHA_W, h: FICHA_H},			//1 muralla en un lado y el resto campo
	ciudad: { sx: 4, sy: 587, w: FICHA_W, h: FICHA_H},			//todo ciudad
	ciucam: { sx: 135, sy: 588, w: FICHA_W, h: FICHA_H},		//ciudad con un lado de campo
	ciucam2: { sx: 253, sy: 586, w: FICHA_W, h: FICHA_H}		//ciudad con 2 lados opuestos de campo
};


startGame = function() {
	
	// Dibujar rectangulo azul
	Game.ctx.fillStyle = "#44cbff";
	Game.ctx.fillRect(50,50,850,650);

	//Dibujar barra separadora
	Game.ctx.fillStyle = "#c9c9c9";
	Game.ctx.fillRect(900,50,20,650);

	//Dibujar barra-menu
	Game.ctx.fillStyle = "#000000";
	Game.ctx.fillRect(920,50,200,650); 

	//Quitar cuando avancemos
	SpriteSheet.draw(Game.ctx,"m",50,50);
	SpriteSheet.draw(Game.ctx,"mc",170,50);
	SpriteSheet.draw(Game.ctx,"cr",300,50);
	SpriteSheet.draw(Game.ctx,"cc",420,50);
	SpriteSheet.draw(Game.ctx,"c3",540,50);
	SpriteSheet.draw(Game.ctx,"c4",660,50);
	SpriteSheet.draw(Game.ctx,"cmur",780,50);
	SpriteSheet.draw(Game.ctx,"ccmur",50,170);
	SpriteSheet.draw(Game.ctx,"chmur",170,170);
	SpriteSheet.draw(Game.ctx,"c3mur",300,170);
	SpriteSheet.draw(Game.ctx,"ccmur2",420,170);
	SpriteSheet.draw(Game.ctx,"ccmur3",540,170);
	SpriteSheet.draw(Game.ctx,"murcam",660,170);
	SpriteSheet.draw(Game.ctx,"mur2",780,170);
	SpriteSheet.draw(Game.ctx,"mur2c",50,290);
	SpriteSheet.draw(Game.ctx,"mur1",170,290);
	SpriteSheet.draw(Game.ctx,"ciudad",300,290);
	SpriteSheet.draw(Game.ctx,"ciucam",420,290);
	SpriteSheet.draw(Game.ctx,"ciucam2",540,290);

	Game.setBoard(0,FichaActual);
}

//Es un singleton
var FichaActual = new function() {
	this.girada = false;
	this.h = FICHA_H;
	this.w = FICHA_W;
	this.x = 970;
	this.y = 100;
	this.sprite = 'm'; //Poner ficha '?'

	this.draw = function(ctx) {
		SpriteSheet.draw(ctx,this.sprite,this.x,this.y,0);
	}

};

$(function() {
    Game.initialize("tablero",sprites,startGame);
});

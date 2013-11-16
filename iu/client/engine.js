Game = new function() {																  

	// Inicializa el juego
	this.initialize = function(canvasElementId,sprite_data,callback) {
		this.canvas = document.getElementById(canvasElementId)
		this.width = this.canvas.width;
		this.height= this.canvas.height;

		this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
		if(!this.ctx) { return alert("Please upgrade your browser to play"); }

		this.loop(); 

		SpriteSheet.load (sprite_data,callback);
	};

	// Bucle del juego
	var boards = [];

	this.loop = function() { 

		for(var i=0,len = boards.length;i<len;i++) {
			if(boards[i]) { 
				boards[i].draw(Game.ctx);
			}
		}

		// Ejecutar dentro de 30 ms
		setTimeout(Game.loop,30);
	};
	// Para cambiar el panel activo en el juego.
	// Son capas: se dibujan de menor num a mayor
	// Cada capa tiene que tener en su interfaz draw()
	this.setBoard = function(num,board) { boards[num] = board; };
};

SpriteSheet = new function() {

	// Almacena nombre_de_sprite: rectángulo para que sea mas facil
	// gestionar los sprites del fichero public/fichas_carssonline.jpg
	this.map = { }; 

	// Para cargar hoja de sprites. 
	//
	// Parámetros: spriteData: parejas con nombre de sprite, rectángulo
	// callback: para llamarla cuando se haya cargado la hoja de
	// sprites
	this.load = function(spriteData,callback) { 
		this.map = spriteData;
		this.image = new Image();
		this.image.onload = callback;
		this.image.src = 'fichas_carssonline.jpg';
	};

 
	// Para dibujar sprites individuales en el contexto de canvas ctx
	//
	// Parámetros: contexto, string con nombre de sprite para buscar
	//  en this.map, x e y en las que dibujarlo, y opcionalmente,
	//  frame para seleccionar el frame de un sprite que tenga varios
	//  como la explosion
	this.draw = function(ctx,sprite,x,y,frame) {
		var s = this.map[sprite];
		if(!frame) frame = 0;
		ctx.drawImage(this.image,
					  s.sx + frame * s.w, 
					  s.sy, 
					  s.w, s.h, 
					  Math.floor(x), Math.floor(y),
					  s.w, s.h);
	};
}


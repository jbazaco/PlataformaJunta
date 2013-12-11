Game = new function() {																  
	this.anularClick=false;
	this.moviendoRaton=false;
	this.selec_elem = null;
	// Inicializa el juego
	this.initialize = function(canvasElementId,sprite_data,callback) {
		this.canvas = document.getElementById(canvasElementId)
		this.width = this.canvas.width;
		this.height= this.canvas.height;

		this.ctx = this.canvas.getContext && this.canvas.getContext('2d');
		if(!this.ctx) { return alert("Please upgrade your browser to play"); }

		this.loop(); 


		this.canvas.addEventListener('mousedown', function(event) {
			var x = event.pageX - Game.canvas.offsetLeft;
			var y = event.pageY - Game.canvas.offsetTop;
			
			this.selec_elem = elemInPos(x,y);
			this.anularClick=false;
		}, false);

		this.canvas.addEventListener('mouseup', function(event) {
			if(this.selec_elem && this.moviendoRaton) { //solo entra si el raton se ha estado moviendo
				var x = event.pageX - Game.canvas.offsetLeft;
				var y = event.pageY - Game.canvas.offsetTop;
				this.selec_elem.soltar(x,y);
				this.selec_elem = null;
				this.moviendoRaton = false;
			}
		}, false);

		this.canvas.addEventListener('mousemove', function(event) {
			if(this.selec_elem) {
				var x = event.pageX - Game.canvas.offsetLeft;
				var y = event.pageY - Game.canvas.offsetTop;
				this.selec_elem.mover(x,y) 
				this.anularClick=true;
				this.moviendoRaton = true;
			}
		}, false);


		this.canvas.addEventListener('click', function(event) {
			if(!this.anularClick && this.selec_elem){
				var x = event.pageX - Game.canvas.offsetLeft;
				var y = event.pageY - Game.canvas.offsetTop;
				
				this.selec_elem.pulsado();
				
				this.selec_elem = null;
				this.anularClick=false;
			}
		}, false);

		SpriteSheet.load (sprite_data,callback);
	};
	

	// Bucle del juego
	this.boards = [];
	
	this.loop = function() { 

		for(var i=0,len = Game.boards.length;i<len;i++) {
			if(Game.boards[len - 1- i]) { 
				Game.boards[len - 1- i].draw(Game.ctx);
			}
		}

		// Ejecutar dentro de 30 ms
		setTimeout(Game.loop,30);
	};
	// Para cambiar el panel activo en el juego.
	// Son capas: se dibujan de menor num a mayor
	// Cada capa tiene que tener en su interfaz draw()
	this.setBoard = function(num,board) { Game.boards[num] = board; };
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
		this.image.src = 'fichas_carssonline.png';
	};

 
	// Para dibujar sprites individuales en el contexto de canvas ctx
	//
	// Parámetros: contexto, string con nombre de sprite para buscar
	//  en this.map, x e y en las que dibujarlo, y opcionalmente,
	//  frame para seleccionar el frame de un sprite que tenga varios
	//  como la explosion
	this.draw = function(ctx,sprite,x,y,w,h,rotacion,frame) {
		var s = this.map[sprite];
		var sw = w || s.w;
		var sh = h || s.h;
		if(!frame) frame = 0;
		
		if (rotacion){
     			ctx.save();
           		ctx.translate(x+sw/2, y+sh/2);
            		ctx.rotate(rotacion*Math.PI/180); 
            		ctx.drawImage(this.image,
						  s.sx + frame * s.w, 
						  s.sy, 
						  sw, sh, 
						  Math.floor(-sw/2), Math.floor(-sh/2),
						  sw, sh);
			
         		ctx.restore();
        	}else{
			ctx.drawImage(this.image,
						  s.sx + frame * s.w, 
						  s.sy, 
						  sw, sh, 
						  Math.floor(x), Math.floor(y),
						  sw, sh);
		}
	};  
}


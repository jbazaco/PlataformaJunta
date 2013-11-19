Game = new function() {																  

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
			
			//Aqui las acciones que no necesiten estar en tu turno

			if (!Meteor.user() /*|| !IA.suTurno(Meteor.user().username))*/ ) { 
				alert('No es tu turno');
				return;
			}

			//Aqui las acciones que necesiten estar en tu turno
			if (y > FichaActual.y && y < FichaActual.y+FichaActual.h 
					&& x > FichaActual.x && x < FichaActual.x+FichaActual.w) {
				this.selec_elem = FichaActual;
				return;
			}
		}, false);

		this.canvas.addEventListener('mouseup', function(event) {
			this.selec_elem = null;
		}, false);

		this.canvas.addEventListener('mousemove', function(event) {
			if(this.selec_elem) {
				var x = event.pageX - Game.canvas.offsetLeft;
				var y = event.pageY - Game.canvas.offsetTop;
				this.selec_elem.x = x;
				this.selec_elem.y = y;
			}
		}, false);


		this.canvas.addEventListener('click', function(event) {
			var x = event.pageX - Game.canvas.offsetLeft;
			var y = event.pageY - Game.canvas.offsetTop;
			
			//Aqui las acciones que no necesiten estar en tu turno

			if (!Meteor.user() /*|| !IA.suTurno(Meteor.user().username))*/ ) { 
				alert('No es tu turno');
				return;
			}

			//Aqui las acciones que necesiten estar en tu turno
			if (y > FichaActual.y && y < FichaActual.y+FichaActual.h 
					&& x > FichaActual.x && x < FichaActual.x+FichaActual.w) {
				FichaActual.revelar_ficha();
				return;
			}
		}, false);

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
		this.image.src = 'fichas_carssonline.png';
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


GamePoints = function() {
	Game.points = 0;

	var pointsLength = 4;

	this.draw = function(ctx) {
	  	ctx.save();
	  	ctx.font = "bold 18px arial";
	    	ctx.fillStyle= "#FFFFFF";

	 	var txt = "" + Game.points;
	  	var i = pointsLength - txt.length, zeros = "";
	  	while(i-- > 0) { zeros += "0"; }

	    	ctx.fillText(zeros + txt,1000,30);
	    	ctx.restore();
	};
};




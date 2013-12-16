var nfich = 0;

Meteor.startup(function(){
});


//Altura y anchura de una ficha
var FICHA_H = 62;
var FICHA_W = 62;

var sprites = {
	m: { sx: 253, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"campo", cc:"monasterio", cd:"campo", ii:"campo", ic:"campo", id:"campo"},		//monasterio
	mc: { sx: 331, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"campo", cc:"monasterio", cd:"camino", ii:"campo", ic:"campo", id:"campo"},		//monasterio con camino
	cr: { sx: 563, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"camino", cc:"camino", cd:"camino", ii:"campo2", ic:"campo2", id:"campo2"},		//camino recto
	cc: { sx: 485, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"campo", cc:"camino", cd:"camino", ii:"campo", ic:"campo", id:"campo"},		//camino curva
	c3: { sx: 640, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"campo", cc:"no", cd:"camino2", ii:"campo", ic:"camino3", id:"campo3"},		//cruce de 3 caminos
	c4: { sx: 408, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"camino2", cc:"no", cd:"camino3", ii:"campo3", ic:"camino4", id:"campo4"},		//cruce de 4 caminos
	cmur: { sx: 408, sy: 137, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"ciudad", cc:"camino", cd:"campo2", ii:"campo", ic:"camino", id:"campo2"},	//camino recto con muralla al 												lado(una de las fichas es la inicial)
	ccmur: { sx: 485, sy: 137, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"ciudad", cc:"campo", cd:"camino", ii:"campo", ic:"campo", id:"campo"},	//camino con curva(de sc a cd) y 													con muralla al lado
	chmur: { sx: 175, sy: 137, w: FICHA_W, h: FICHA_H, si:"ciudad", sc:"ciudad", sd:"campo",
		ci:"ciudad", cc:"ciudad", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo2"},	//camino hacia muralla
	chmure: { sx: 21, sy: 230, w: FICHA_W, h: FICHA_H, si:"ciudad", sc:"ciudad", sd:"campo",
		ci:"ciudad", cc:"ciudad", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo2"},	//camino hacia muralla con escudo
	c3mur: { sx: 98, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"ciudad", cc:"no", cd:"camino2", ii:"campo", ic:"camino3", id:"campo3"},		//cruce de 3 caminos con 														muralla al lado
	ccmur2: { sx: 717, sy: 137, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"ciudad", cc:"camino", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo"},	//camino con curva con 2 lados de 													ciudad contiguos
	ccmur2e: { sx: 98, sy: 230, w: FICHA_W, h: FICHA_H, si:"campo", sc:"camino", sd:"campo2",
		ci:"ciudad", cc:"camino", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo"},	//camino con curva con 2 lados de 												ciudad contiguos con escudo
	ccmur3: { sx: 562, sy: 137, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"ciudad", cc:"camino", cd:"camino", ii:"campo", ic:"camino", id:"campo2"},	//camino con curva(de ic a cd) y 													muralla al lado(otro)
	murcam: { sx: 21, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"ciudad", cc:"no", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},	//media ficha muralla media ficha 													campo
	murcame: { sx: 176, sy: 230, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"ciudad", cc:"no", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},	//media ficha muralla media ficha 													campo con escudo
	mur2: { sx: 176, sy: 44, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"ciudad", cc:"campo", cd:"ciudad2", ii:"campo", ic:"campo", id:"campo"},		//una muralla a cada lado 														de la ficha
	mur2c: { sx: 253, sy: 137, w: FICHA_W, h: FICHA_H, si:"campo", sc:"ciudad", sd:"campo",
		ci:"ciudad2", cc:"campo", cd:"campo", ii:"campo", ic:"campo", id:"campo"},	//2 murallas en lados contiguos
	mur1: { sx: 330, sy: 137, w: FICHA_W, h: FICHA_H, si:"campo", sc:"campo", sd:"campo",
		ci:"ciudad", cc:"campo", cd:"campo", ii:"campo", ic:"campo", id:"campo"},	//1 muralla en un lado y el resto 													campo
	ciudad: { sx: 21, sy: 137, w: FICHA_W, h: FICHA_H, si:"ciudad", sc:"ciudad", sd:"ciudad",
		ci:"ciudad", cc:"ciudad", cd:"ciudad", ii:"ciudad", ic:"ciudad", id:"ciudad"},	//todo ciudad con escudo
	ciucam: { sx: 98, sy: 137, w: FICHA_W, h: FICHA_H, si:"ciudad", sc:"ciudad", sd:"campo",
		ci:"ciudad", cc:"ciudad", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},	//ciudad con un lado de campo
	ciucame: { sx: 331, sy: 230, w: FICHA_W, h: FICHA_H, si:"ciudad", sc:"ciudad", sd:"campo",
		ci:"ciudad", cc:"ciudad", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},	//ciudad con un lado de campo con 													escudo
	ciucam2: { sx: 640, sy: 137, w: FICHA_W, h: FICHA_H, si:"campo", sc:"ciudad", sd:"campo",
		ci:"campo", cc:"ciudad", cd:"campo", ii:"campo", ic:"ciudad", id:"campo"},	//ciudad con 2 lados opuestos de 													campo
	ciucam2e: { sx: 408, sy: 230, w: FICHA_W, h: FICHA_H, si:"campo", sc:"ciudad", sd:"campo",
		ci:"campo", cc:"ciudad", cd:"campo", ii:"campo", ic:"ciudad", id:"campo"},	//ciudad con 2 lados opuestos de 													campo con escudo
	interrogante: { sx: 253, sy: 230, w: FICHA_W, h: FICHA_H},	//ficha con un interrogante
	s1: { sx: 511, sy: 242, w: 30, h: 30},			//seguidor amarillo
	s2: { sx: 553, sy: 242, w: 30, h: 30},			//seguidor rosa
	s3: { sx: 596, sy: 242, w: 30, h: 30},			//seguidor azul
	s4: { sx: 640, sy: 242, w: 30, h: 30},			//seguidor verde
	s5: { sx: 682, sy: 242, w: 30, h: 30},		//seguidor naranja
	terminar: {sx: 727, sy: 44,w: 58,h: 20}		//Boton de temirnar
};

var ficha_inicial;

startGame = function() {

	Game.setBoard(0,new TitleScreen("Carcassone.", "Haga click para empezar.",playGame));
	
}

playGame = function(){
	Game.boards.length=0;
	var numjugadores=3; //nos lo tiene que dar la plataforma de momento es un ejemplo
	for (i=1;i<=numjugadores;i++){
		Game.setBoard(Game.boards.length, new NumSeguidores(i));
		Game.setBoard(Game.boards.length, new GamePoints(i));
	}
	for (i=1;i<=numjugadores;i++){	
		for (k=1;k<=7;k++){
			Game.setBoard(Game.boards.length, new Seguidor("s"+i, i));
		}
	}
	
	Game.setBoard(Game.boards.length,FichaActual);
	FichaActual.nextBoard = Game.boards.length;

	Game.setBoard(Game.boards.length,BotonFinTurno);
	
	ficha_inicial = new Ficha(394, 263,"cmur");
	Game.setBoard(Game.boards.length, ficha_inicial);
	Game.setBoard(Game.boards.length,Fondo);
	ficha_inicial.buscar_huecos();
	nfich++;

	/*Se subscribe a la partida*/
	Meteor.subscribe('mov_partida');
	Deps.autorun(function(){
		var nmovs = Movimientos.find().count();
		var movs = Movimientos.find({}, 
				{limit:nmovs-nfich, sort: {nmove:-1}});
		//Se invierte el orden para que si le llegan varios movimientos
		//los gestione en orden
		var arr = new Array();
        movs.forEach(function (m) {
			nfich++;
			arr.unshift(m);
        });
		arr.forEach(function(m) {
			gestionarMov(m);
		});
	});

}

gestionarMov = function(m) {
	var debajo = elemInPos(ficha_inicial.x+m.x*ficha_inicial.w+ficha_inicial.w/2,
						ficha_inicial.y-m.y*ficha_inicial.h+ficha_inicial.h/2, 
						FichaActual.nextBoard);
	if (debajo instanceof Ficha && debajo.sprite === "interrogante"){
		debajo.establecer(m.sprite, m.rotacion);
	}
};

TitleScreen = function TitleScreen(title,subtitle,callback) {
    
	this.x = 0;
	this.y = 0;
	this.w = 1070;
	this.h = 650;
	this.sprite = "";

	this.mover = function(x,y) {	}
	
	this.soltar = function(x,y) {	}

	this.pulsado = function() {
		callback();
		//Informar a Plataforma que se ha metido un jugador a la partida y espera rivales si no estan todos.
	}


        this.draw = function(ctx) {
	    ctx.fillStyle = "#FFFFFF";
	    ctx.textAlign = "center";
	
	    Game.ctx.fillStyle = "#000000";
	    Game.ctx.fillRect(0,0,1070,650);

	    ctx.fillStyle= "#c9c9c9";
	    ctx.font = "bold 100px arial";
	    ctx.fillText(title,Game.width/2,Game.height/2);

	    ctx.font = "bold 75px arial";
	    ctx.fillText(subtitle,Game.width/2+5,Game.height/2 + 100);
        }
}
BotonFinTurno = new function() {
	this.x = 940;
	this.y = 200;
	this.w = 58;
	this.h = 20;
	this.sprite = "terminar";

	this.mover = function(x,y) {	}
	
	this.soltar = function(x,y) {	}

	this.pulsado = function() {
		FichaActual.finTurno();	
		Seguidor.restar=true;
	}

	this.draw = function(ctx) {
		SpriteSheet.draw(ctx,this.sprite,this.x, this.y);
	}	
}

Fondo = new function() {
	this.x = 0;
	this.y = 0;
	this.w = 1070;
	this.h = 650;
	this.sprite = "";

	this.mover = function(x,y) {	}
	
	this.soltar = function(x,y) {	}

	this.pulsado = function() {	}
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
	this.rotacion=0;

	this.coordenadas = {x: !ficha_inicial ? 0:(this.x-ficha_inicial.x)/this.w,
						y: !ficha_inicial ? 0:(ficha_inicial.y-this.y)/this.h};
	

	
	//busca en las posiciones adyacentes de una ficha colocada, y si no hay ninguna ficha, 
	//pone la ficha "interrogante".
	this.buscar_huecos = function(){
		
		var derecha = elemInPos(this.x+3/2*this.w, this.y +this.h/2,
								FichaActual.nextBoard);
		
		if(derecha === null || derecha === Fondo){
			var ficha = new Ficha(this.x+this.w, this.y, "interrogante");
			Game.setBoard(Game.boards.length-1,ficha);
			Game.setBoard(Game.boards.length,Fondo);
		}	
		
		var izquierda = elemInPos(this.x-this.w/2, this.y+this.h/2);
		if(izquierda === null || izquierda === Fondo){
			var ficha = new Ficha(this.x-this.w, this.y, "interrogante");
			Game.setBoard(Game.boards.length-1,ficha);
			Game.setBoard(Game.boards.length,Fondo);
		}
		
		var arriba = elemInPos(this.x+this.w/2, this.y-this.h/2);
		if(arriba === null || arriba === Fondo){
			var ficha = new Ficha(this.x, this.y-this.h, "interrogante");
			Game.setBoard(Game.boards.length-1,ficha);
			Game.setBoard(Game.boards.length,Fondo);
		}
		var abajo = elemInPos(this.x+this.w/2, this.y+3/2*this.h);
		if(abajo === null || abajo === Fondo  || abajo===FichaActual){
			var ficha = new Ficha(this.x, this.y+this.h, "interrogante");
			Game.setBoard(Game.boards.length-1,ficha);
			Game.setBoard(Game.boards.length,Fondo);
		}
	}
	
	this.pulsado_en = {x:0, y:0};
	this.mover = function(x,y) {
		if (this.pulsado_en.x === 0 && this.pulsado_en.y === 0) {
			this.pulsado_en = {x: x, y: y};	
		} else {
			desplazarTablero(x-this.pulsado_en.x,y-this.pulsado_en.y);
			this.pulsado_en = {x: x, y: y};
		}
	}
	
	this.soltar = function(x,y) {
		desplazarTablero(x-this.pulsado_en.x,y-this.pulsado_en.y);
		this.pulsado_en = {x:0, y:0};
	}

	this.pulsado = function(x, y) {
		if (this.sprite === "interrogante") FichaActual.soltar(this.x+this.w/2,this.y+this.h/2);
	}

	//Si se sale del espacio del tablero no se pinta la parte que
	// sale de la pantalla
	this.draw = function(ctx) {
		var sw = this.w;
		var dibujar = true;
		if (this.x+this.w > 850) {
			var dif = 850 - this.x;
			if (dif < 0) {
				dibujar = false;
			} else {
				sw = dif;
			}
			
		}
		if(dibujar) SpriteSheet.draw(ctx,this.sprite,this.x, this.y, sw,0,this.rotacion);
	}

	this.establecer = function(sprite, rotacion) {
		this.sprite = sprite;
		this.rotacion = rotacion;
		this.buscar_huecos();
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
	this.nextBoard = 0;
	this.haySeguidor=false;
	this.colocado=null;
	this.rotacion = 0;
	
	//Devuelve true si se gira la ficha
	this.pulsado = function() {
	
		if (this.sprite === 'interrogante') {
			this.sprite = 'ccmur2e'; //PEDIR A LA IA!!!, de momento ponemos una ficha cualquiera
			return true;
		}
		if (this.x == this.inicialx && this.y == this.inicialy){
			if (this.rotacion === 270)
				this.rotacion = 0;
			else	
				this.rotacion+=90;
		}
		return false;
	}
	//tendra que informar al resto de clientes que ficha le ha salido a este jugador
	//tiene que comprobar que el que hace click es el jugador al que le toca jugar, si no no puede mover

	//Funcion para ver si las coordenadas que se le pasa estan sobre la FichaActual.
	this.EstaEn = function(x, y){
		if (x>=this.x && x<=this.x+FICHA_H && y>=this.y && y<=this.y+FICHA_W 
				&& this.x!=this.inicialx && this.y!=this.inicialy){
			return true;
		}else{
			return false;
		}
	}
	
	//Devuelve true si no esta en la posicion inicial
	this.seHaMovido = function() {
		return (this.x !== this.inicialx || this.y !== this.inicialy);
	}
	
	this.moviendo = false;
	this.mover = function(x,y) {
		this.moviendo = true;
		if (this.sprite !== 'interrogante') {
			this.x = x - this.w/2;
			this.y = y - this.h/2;
			if (this.colocado){	
				this.colocado.resetear();
				this.colocado=null;
			}
		}
	}

	this.soltar = function(x,y) {
		if (this.sprite !== "interrogante") {
			//CAMBIAR cuando se coloquen las fichas
			var debajo = elemInPos(x,y, this.nextBoard);

			if (debajo instanceof Ficha && debajo.sprite === "interrogante"){
				this.x = debajo.x;
				this.y = debajo.y;
			} else {	
				this.x = this.inicialx;
				this.y = this.inicialy;	
			}
			if (this.colocado){	
				this.colocado.resetear();
				this.colocado=null;
			}
		}
		this.moviendo = false;
	}

	this.draw = function(ctx) {
		var dibujar = true;
		var sw = this.w;
		//Si esta colocada en el tablero y se sale del espacio del tablero no 
		//se pinta la parte que sale de la pantalla
		if (!this.moviendo && this.seHaMovido() && this.x+this.w > 850) {
			var dif = 850 - this.x;
			if (dif < 0) {
				dibujar = false;
			} else {
				sw = dif;
			}	
		}
		if (dibujar) SpriteSheet.draw(ctx,this.sprite,this.x,this.y,sw,0,this.rotacion);
	}

	this.finTurno = function() {
		if (this.inicialx !== this.x) {
			var debajo = elemInPos(this.x+this.w/2, this.y+this.h/2, this.nextBoard);
			if (debajo instanceof Ficha && debajo.sprite === "interrogante"){
				Movimientos.insert({nmove: nfich-1, sprite: this.sprite, 
									rotacion: this.rotacion, x: debajo.coordenadas.x , 
									y: debajo.coordenadas.y});
				this.resetear();	
			}
		}
	}
	
	this.resetear = function() {
		this.sprite = "interrogante";
		this.x = this.inicialx;
		this.y = this.inicialy;	
		this.haySeguidor=false;
		this.colocado=false;
		this.rotacion=0;	
		Seguidor.resetear();
	}
	
	this.pintarRejilla = function(){
		
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x,this.y,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x+this.h/3,this.y,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x+2*this.h/3,this.y,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x,this.y+this.w/3,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x+this.h/3,this.y+this.w/3,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x+2*this.h/3,this.y+this.w/3,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x,this.y+2*this.w/3,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x+this.h/3,this.y+2*this.w/3,this.h/3,this.w/3);
		Game.ctx.fillStyle = "#000000";
		Game.ctx.strokeRect(this.x+2*this.h/3,this.y+2*this.w/3,this.h/3,this.w/3);
		
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
	this.zona="";
	this.restar=true;
	this.sumar=false;
	
	this.pulsado = function() {}
	//tiene que comprobar que el que hace click es el jugador al que le toca jugar, si no no puede mover

	this.moviendo = false;

	
	this.recalcular = function(x, y) {
		if (x>FichaActual.x && x<FichaActual.x+FichaActual.h/3 && y>FichaActual.y && y<FichaActual.y+FichaActual.w/3){
			this.x=FichaActual.x;
			this.y=FichaActual.y;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].si;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].ii;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].id;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].sd;
				
		}else if(x>FichaActual.x+FichaActual.h/3 && x<FichaActual.x+2*FichaActual.h/3 &&  y>FichaActual.y && y<FichaActual.y+FichaActual.w/3){
			this.x=FichaActual.x+FichaActual.h/3;
			this.y=FichaActual.y;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].sc;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].ci;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].ic;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].cd;	
		
		}else if(x>FichaActual.x+2*FichaActual.h/3 && x<FichaActual.x+3*FichaActual.h/3 && y>FichaActual.y && y<FichaActual.y+FichaActual.w/3){
			this.x=FichaActual.x+2*FichaActual.h/3;
			this.y=FichaActual.y;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].sd;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].si;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].ii;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].id;	

		}else if(x>FichaActual.x && x<FichaActual.x+FichaActual.h/3 && y>FichaActual.y+FichaActual.w/3 && y<FichaActual.y+2*FichaActual.w/3){
			this.x=FichaActual.x;
			this.y=FichaActual.y+FichaActual.w/3;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].ci;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].ic;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].cd;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].sc;

		}else if(x>FichaActual.x+FichaActual.h/3 && x<FichaActual.x+2*FichaActual.h/3 && y>FichaActual.y+FichaActual.w/3 && y<FichaActual.y+2*FichaActual.w/3){
			this.x=FichaActual.x+FichaActual.h/3;
			this.y=FichaActual.y+FichaActual.w/3;
			this.zona=sprites[FichaActual.sprite].cc;
			
		}else if(x>FichaActual.x+2*FichaActual.h/3 && x<FichaActual.x+3*FichaActual.h/3 && y>FichaActual.y+FichaActual.w/3 && y<FichaActual.y+2*FichaActual.w/3){
			this.x=FichaActual.x+2*FichaActual.h/3;
			this.y=FichaActual.y+FichaActual.w/3;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].cd;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].sc;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].ci;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].ic;	

		}else if(x>FichaActual.x && x<FichaActual.x+FichaActual.h/3 && y>FichaActual.y+2*FichaActual.w/3 && y<FichaActual.y+3*FichaActual.w/3){
			this.x=FichaActual.x;
			this.y=FichaActual.y+2*FichaActual.w/3;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].ii;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].id;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].sd;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].si;	

		}else if(x>FichaActual.x+FichaActual.h/3 && x<FichaActual.x+2*FichaActual.h/3 && y>FichaActual.y+2*FichaActual.w/3 && y<FichaActual.y+3*FichaActual.w/3){
			this.x=FichaActual.x+FichaActual.h/3;
			this.y=FichaActual.y+2*FichaActual.w/3;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].ic;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].cd;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].sc;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].ci;	

		}else if(x>FichaActual.x+2*FichaActual.h/3 && x<FichaActual.x+3*FichaActual.h/3 && y>FichaActual.y+2*FichaActual.w/3 && y<FichaActual.y+3*FichaActual.w/3){
			this.x=FichaActual.x+2*FichaActual.h/3;
			this.y=FichaActual.y+2*FichaActual.w/3;
			if (!FichaActual.rotacion)
				this.zona=sprites[FichaActual.sprite].id;
			else if (FichaActual.rotacion === 90)
				this.zona=sprites[FichaActual.sprite].sd;
			else if (FichaActual.rotacion === 180)
				this.zona=sprites[FichaActual.sprite].si;
			else if (FichaActual.rotacion === 270)
				this.zona=sprites[FichaActual.sprite].ii;
			
		}
	}
	
	this.mover = function(x,y) {
		this.moviendo = true;
		miJugador=1;
		turno=1;//Falta funcion para saber de quien es el turno
		if(turno==miJugador && this.sprite=="s"+miJugador && FichaActual.seHaMovido() && (!FichaActual.colocado || FichaActual.colocado==this)){
				this.x = x - this.w/2;
				this.y = y - this.h/2;
				FichaActual.pintarRejilla();
			
		}
	}
	
	this.soltar = function(x,y) {
		if (!FichaActual.haySeguidor){
			if ((!FichaActual.seHaMovido() || !FichaActual.EstaEn(x,y))){
				this.resetear();
				FichaActual.colocado=null;
				FichaActual.haySeguidor=false;
			}else{
				miJugador=1;
				turno=1;//Falta funcion para saber de quien es el turno
				if(turno==miJugador && this.sprite=="s"+miJugador && FichaActual.seHaMovido() && !FichaActual.haySeguidor){
					this.recalcular(x,y);
					if (this.zona==="no"){
						this.resetear();
					}else{
						console.log(this.zona);
						FichaActual.haySeguidor=true;
						this.sumar=true;
						FichaActual.colocado=this;
						if (this.restar){
							Game.boards[numjugador].num--;
							this.restar=false;
						}
					}
				}
			}	
			this.moviendo = false;
		}else{
			if ((!FichaActual.seHaMovido() || !FichaActual.EstaEn(x,y))){
				this.resetear();
			}else{
				if(this.seHaMovido()){
					this.recalcular(x,y);
					if (this.zona==="no"){
						this.resetear();
					}
				}
			}
		}
	}

	//Devuelve true si no esta en la posicion inicial
	this.seHaMovido = function() {
		return (this.x !== this.inicialx || this.y !== this.inicialy);
	}

	this.resetear = function() {
		this.x=this.inicialx;
		this.y=this.inicialy;
		this.restar=true;
		FichaActual.haySeguidor=false;
		if (FichaActual.colocado && this.sumar){
			Game.boards[numjugador].num++;	
			this.sumar=false;
		}
	}

	this.draw = function(ctx) {
		var dibujar = true;
		var sw = this.w;
		//Si esta colocado en el tablero y se sale del espacio del tablero no 
		//se pinta la parte que sale de la pantalla
		if (!this.moviendo && this.seHaMovido() && this.x+this.w > 850) {
			var dif = 850 - this.x;
			if (dif < 0) {
				dibujar = false;
			} else {
				sw = dif;
			}	
		}
		if (dibujar) SpriteSheet.draw(ctx,this.sprite,this.x,this.y,sw);
	}
};

//Devuelve el elemento dibujado en (x,y) a partir del board n
//El elemento debe tener una funcion pulsado, mover y soltar
elemInPos = function(x, y, n) {
	if (!n || n < 0) n = 0; //n<1 para ignorar GamePoints

	//len-1 para ignorar el fondo
	for(var i=n,len = Game.boards.length;i<len;i++) {
		if (Game.boards[i]){
			if (y >= Game.boards[i].y && y <= Game.boards[i].y+Game.boards[i].h 
					&& x >= Game.boards[i].x && x <= Game.boards[i].x+Game.boards[i].w) {
				return Game.boards[i];
			}
		}
	}
	return null;
}

var desplazarTablero = function(difx, dify) {
	 for(var i=0; i<Game.boards.length; i++) {
		if (Game.boards[i]){
			if (Game.boards[i] instanceof Ficha || 
					(Game.boards[i] instanceof Seguidor && Game.boards[i].seHaMovido())) {
				Game.boards[i].x += difx;
				Game.boards[i].y += dify;
			}
		}
	}

	if (FichaActual.seHaMovido()) {
		FichaActual.x += difx;
		FichaActual.y += dify;
	}

	
}


NumSeguidores = function(numjugador) {
	this.num = 7;
	this.x = 890;
	this.y = 220 +numjugador*60;
	this.w = 0;
	this.h = 0;
	this.sprite = "";

	this.mover = function(x,y) {	}
	
	this.soltar = function(x,y) {	}

	this.pulsado = function() {	}

	this.draw = function(ctx) {
	  	ctx.save();
	  	ctx.font = "bold 18px arial";
	    	ctx.fillStyle= "#FFFFFF";

	 	var txt = "" + this.num;
	    	ctx.fillText(txt,this.x,this.y);
	    	ctx.restore();
		
	};
};

GamePoints = function(numjugador) {
	this.points = 0;
	this.x = 960;
	this.y = 220 +numjugador*60;
	this.w = 0;
	this.h = 0;
	this.sprite = "";

	this.mover = function(x,y) {	}
	
	this.soltar = function(x,y) {	}

	this.pulsado = function() {	}

	var pointsLength = 3;

	this.draw = function(ctx) {
	  	ctx.save();
	  	ctx.font = "bold 18px arial";
	    	ctx.fillStyle= "#FFFFFF";

	 	var txt = "" + this.points;
	  	var i = pointsLength - txt.length, zeros = "";
	  	while(i-- > 0) { zeros += "0"; }

	    	ctx.fillText(zeros + txt,this.x,this.y);
	    	ctx.restore();
	};
};

$(function() {
    Game.initialize("tablero",sprites,startGame);
});

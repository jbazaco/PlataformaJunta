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
	s5: { sx: 682, sy: 242, w: 30, h: 30},		//seguidor naranja
	terminar: {sx: 727, sy: 44,w: 58,h: 20}		//Boton de temirnar
};

var ficha_inicial;

startGame = function() {

	
	Game.setBoard(0,new TitleScreen("Carcassone.", "Haga click para empezar.",playGame));

	
	
	
}
playGame = function(){

	Game.setBoard(0,new GamePoints(0));

	var numjugadores=3; //nos lo tiene que dar la plataforma de momento es un ejemplo
	
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
	ficha_inicial.nombrar_lados();
	ficha_inicial.buscar_huecos();
	

}
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
	this.ladod;	//lado Derecho
	this.ladoi;	//lado Izquierdo
	this.ladoa;	//lado Arriba;
	this.ladob;	//lado aBajo;

	this.coordenadas = {x: !ficha_inicial ? 0:(this.x-ficha_inicial.x)/this.w,
						y: !ficha_inicial ? 0:(ficha_inicial.y-this.y)/this.h};
	
	this.nombrar_lados = function(){
		if (this.sprite === 'm'){ 
			this.ladod = 'campo';
			this.ladoi = 'campo';
			this.ladoa = 'campo';
			this.ladob = 'campo';
		}else if (this.sprite === 'cmur'){
			this.ladod = 'campo';
			this.ladoi = 'ciudad';
			this.ladoa = 'camino';
			this.ladob = 'camino';
		}
	
	}
	
	
	//busca en las posiciones adyacentes de una ficha colocada, y si no hay ninguna ficha, 
	//pone la ficha "interrogante".
	this.buscar_huecos = function(){
		
		var derecha = elemInPos(this.x+3/2*this.w, this.y +this.h/2);
		
		if(derecha === Fondo || derecha===FichaActual){
			var ficha = new Ficha(this.x+this.w, this.y, "interrogante");
			Game.setBoard(Game.boards.length-1,ficha);
			Game.setBoard(Game.boards.length,Fondo);
		}	
		
		var izquierda = elemInPos(this.x-this.w/2, this.y+this.h/2);
		if(izquierda === Fondo || izquierda===FichaActual){
			var ficha = new Ficha(this.x-this.w, this.y, "interrogante");
			Game.setBoard(Game.boards.length-1,ficha);
			Game.setBoard(Game.boards.length,Fondo);
		}
		
		var arriba = elemInPos(this.x+this.w/2, this.y-this.h/2);
		if(arriba === Fondo || arriba===FichaActual){
			var ficha = new Ficha(this.x, this.y-this.h, "interrogante");
			Game.setBoard(Game.boards.length-1,ficha);
			Game.setBoard(Game.boards.length,Fondo);
		}
		var abajo = elemInPos(this.x+this.w/2, this.y+3/2*this.h);
		if(abajo === Fondo  || abajo===FichaActual){
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

	this.pulsado = function(x, y) {	}

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
		if(dibujar) SpriteSheet.draw(ctx,this.sprite,this.x, this.y, sw);
	}

	this.establecerActual = function() {
		//Se copiara tambien la orientacion
		this.sprite = FichaActual.sprite;
		this.ladod = FichaActual.ladod;
		this.ladoi = FichaActual.ladoi;
		this.ladoa = FichaActual.ladoa;
		this.ladob = FichaActual.ladob;
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
	this.ladod;	//lado Derecho
	this.ladoi;	//lado Izquierdo
	this.ladoa;	//lado Arriba;
	this.ladob;	//lado aBajo;
	
	//Devuelve true si se gira la ficha
	this.pulsado = function() {
		if (this.sprite === 'interrogante') {
			this.sprite = 'm'; //PEDIR A LA IA!!!, de momento ponemos una ficha cualquiera
			this.nombrar_lados();
			return true;
		}
		if (this.x == this.inicialx && this.y == this.inicialy){
			alert('Ya has girado la ficha');
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
			this.x = x;
			this.y = y;
			if (this.colocado){	
				this.colocado.x=this.colocado.inicialx;
				this.colocado.y=this.colocado.inicialy;
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
				/*if (!this.comparar_lados()){			
					this.x = this.inicialx;
					this.y = this.inicialy;
				}*/
			} else {	
				this.x = this.inicialx;
				this.y = this.inicialy;	
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
		if (dibujar) SpriteSheet.draw(ctx,this.sprite,this.x,this.y,sw);
	}

	this.finTurno = function() {
		if (this.inicialx !== this.x) {
			var debajo = elemInPos(this.x+this.w/2, this.y+this.h/2, this.nextBoard);
			if (debajo instanceof Ficha && debajo.sprite === "interrogante"){
				debajo.establecerActual();
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
	}
	
	this.comparar_lados = function(){
		var drcha = false;	
		var derecha = elemInPos(this.x+3/2*this.w, this.y +this.h/2);
		if(derecha && derecha!=FichaActual){
			if (derecha.ladoi === this.ladod || derecha.sprite ==='interrogante'){
				drcha = true;
			}
		}else if (derecha===null || derecha===FichaActual){
			drcha = true;
		}	
		
		var izq = false;
		var izquierda = elemInPos(this.x-this.w/2, this.y+this.h/2);
		if(izquierda && izquierda!=FichaActual){
			if (izquierda.ladod === this.ladoi || izquierda.sprite ==='interrogante'){
				izq = true;
			}
		}else if (izquierda===null || izquierda===FichaActual){
			izq = true;
		}
		
		var arr = false;
		var arriba = elemInPos(this.x+this.w/2, this.y-this.h/2);
		if(arriba && arriba!=FichaActual){
			if (arriba.ladob === this.ladoa || arriba.sprite ==='interrogante'){
				arr = true;
			}
		}else if (arriba===null || arriba===FichaActual){
			arr = true;
		}
		
		var ab = false;
		var abajo = elemInPos(this.x+this.w/2, this.y+3/2*this.h);
		if(abajo && abajo!=FichaActual){
			if (abajo.ladoa === this.ladob || abajo.sprite ==='interrogante'){
				ab = true;
			}
		}else if (abajo===null || abajo===FichaActual){
			ab = true;
		}

		return (drcha && izq && arr && ab);	//si devuelve true significa que puedo colocar la ficha en esa posición

	}
	
	this.nombrar_lados = function(){
		if (this.sprite === 'm'){
			this.ladod = 'campo';
			this.ladoi = 'campo';
			this.ladoa = 'campo';
			this.ladob = 'campo';
		}
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

	this.moviendo = false;
	this.mover = function(x,y) {
		this.moviendo = true;
		miJugador=1;
		turno=1;//Falta funcion para saber de quien es el turno
		if(turno==miJugador && this.sprite=="s"+miJugador && (!FichaActual.colocado || FichaActual.colocado==this)){ 
			this.x = x;
			this.y = y;
			
		}
	}
	this.soltar = function(x,y) {
		if ((!FichaActual.seHaMovido() || !FichaActual.EstaEn(this.x,this.y))){
			this.x = this.inicialx;
			this.y = this.inicialy;	
			FichaActual.haySeguidor=false;

		}else{
			FichaActual.haySeguidor=true;
			FichaActual.colocado=this;
		}
		this.moviendo = false;
	}

	//Devuelve true si no esta en la posicion inicial
	this.seHaMovido = function() {
		return (this.x !== this.inicialx || this.y !== this.inicialy);
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

$(function() {
    Game.initialize("tablero",sprites,startGame);
});

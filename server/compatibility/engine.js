
//       1
//    -------
//  4 |     | 2
//    |     |
//    -------
//       3

var CASTILLO = 'castillo';
var CAMINO = 'camino';
var CAMPO = 'campo'

var FichaPropiedades = {
/*0*/		murcam:  {nombre:"murcam", u:CAMPO,    r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},        //media ficha muralla media ficha campo
/*1*/		c3mur: 	 {nombre:"c3mur", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CASTILLO, gir: 0},         //cruce de 3 caminos con muralla al lado
/*2*/		mur2: 	 {nombre:"mur2", u:CAMPO,    r:CASTILLO, d:CAMPO,    l:CASTILLO, gir: 0},          //una muralla a cada lado de la ficha
/*3*/		m: 		 {nombre:"m", u: CAMPO,   r:CAMPO,    d:CAMPO,    l:CAMPO , gir: 0},               //monasterio
/*4*/  		mc: 	 {nombre:"mc", u:CAMPO,    r:CAMINO,   d:CAMPO,    l:CAMPO, gir: 0},               //monasterio con camino
/*5*/		c4: 	 {nombre:"c4", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CAMINO, gir: 0},              //cruce de 4 caminos
/*6*/		cc: 	 {nombre:"cc", u:CAMINO,   r:CAMINO,   d:CAMPO,    l:CAMPO, gir: 0},               //camino curva
/*7*/ 		cr: 	 {nombre:"cr", u:CAMPO,    r:CAMINO,   d:CAMPO,    l:CAMINO, gir: 0},              //camino recto
/*8*/ 		c3: 	 {nombre:"c3", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CAMPO, gir: 0},               //cruce de 3 caminos
/*9*/		ciudad:  {nombre:"ciudad", u:CASTILLO, r:CASTILLO, d:CASTILLO, l:CASTILLO, gir: 0},        //todo ciudad con escudo
/*10*/		ciucam:  {nombre:"ciucam", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},        //ciudad con un lado de campo
/*11*/		chmur: 	 {nombre:"chmur", u:CASTILLO, r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0},   	   //camino hacia muralla
/*12*/		mur2c: 	 {nombre:"mur2c", u:CASTILLO, r:CAMPO,    d:CAMPO,    l:CASTILLO, gir: 0},         //2 murallas en lados contiguos
/*13*/		mur1: 	 {nombre:"mur1", u:CAMPO,    r:CAMPO,    d:CAMPO,    l:CASTILLO, gir: 0},          //1 muralla en un lado y el resto campo
/*14*/		cmur: 	 {nombre:"cmur", u:CAMINO,   r:CAMPO,    d:CAMINO,   l:CASTILLO, gir: 0},          //camino recto con muralla al lado(ini)
/*15*/ 		ccmur: 	 {nombre:"ccmur", u:CAMINO,   r:CAMINO,   d:CAMPO,    l:CASTILLO, gir: 0},         //camino con curva y con muralla al lado
/*16*/		ccmur3:  {nombre:"ccmur3", u:CAMPO,    r:CAMINO,   d:CAMINO,   l:CASTILLO, gir: 0},        //camino con curva y muralla al lado(otro)
/*17*/		ciucam2: {nombre:"ciucam2", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CAMPO, gir: 0},          //ciudad con 2 lados opuestos de campo
/*18*/		ccmur2:  {nombre:"ccmur2", u:CAMINO,   r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0},	 	   //camino con curva con 2 lados de ciudad contiguos
/*19*/ 		chmure:  {nombre:"chmure", u:CASTILLO, r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0}, 	   //camino hacia muralla con escudo
/*20*/  	ccmur2e: {nombre:"ccmur2e", u:CAMINO,   r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0},       //camino con curva con 2 lados de ciudad,escudo
/*21*/  	murcame: {nombre:"murcame", u:CAMPO,    r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},       //media ficha muralla media ficha campo con escudo
/*22*/  	ciucame: {nombre:"ciucame", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},       //ciudad con un lado de campo con escudo
/*23*/  	ciucam2e:{nombre:"ciucam2e", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CAMPO, gir: 0}          //ciudad 2 lados opuestos campo con escudo
}; 

var ArFi = _.toArray(FichaPropiedades); //Convertimos lo que tenemos en un Array para poder tratarlo

var Contador = [5,3,3,4,2,1,9,8,4,1,3,1,2,5,3,3,3,1,3,2,2,2,1,2];

//Creo el array y luego hago el random del número que le pasamos al array
var Aleatorio = function(){
	var a = Math.floor(Math.random()*24);
	while (Contador[a] == 0){ 
		a = Math.floor(Math.random()*24);	
	}
	Contador[a] = Contador[a] - 1;
	return ArFi[a];
};

//Funcion de prueba para comprobar fichas
var Prueba = function(A){
	return ArFi[A];
}

//Girar Ficha
GirarFicha = function(Ficha){
	var aux = 0;
	while (Ficha.gir != 0){
		aux = Ficha.l;
		Ficha.l = Ficha.d;
		Ficha.d = Ficha.r;
		Ficha.r = Ficha.u;
		Ficha.u = aux;
		Ficha.gir = Ficha.gir - 1;
	}
	return Ficha;
};
	
//Creamos tablero
CrearTablero = function(){
	var x = new Array(10);
	for (var i = 0; i < 10; i++){
		x[i] = new Array(10);
	}//Rellenamos el tablero con cero para identificar posiciones vacías
	for (var i = 0; i < 10; i++){
		for (var j = 0; j < 10; j++){
			x[i][j] = 0;
		}
	}
	return x;
};
//Meteor.call("DevuelveFicha", function(error,resultado){
//	console.log(error)
//	console.lo(resultado)	
//})
// Para acceder a la base de datos meteor mongo
//Funcion Parsear
ParserTab = function(Id, Info){


};

//Este Deps lo usaremos para extraer la informacion de la base de datos de como esta actualmente
//el tablero correspondiente a cada identificador
Deps.autorun(function(){
	p = Partidas.find({estado: "Esperando"});
	p.forEach(function(){
		j = this.jugadas[this.jugadas.length - 1];
		ParserTab(this.id, j);
	});
});


//Procedimiento que mira las posiciones del tablero para ver si se puede colocar la ficha
//Terminología: U: Up, R:Right, D: Down, L:Left. 
colocarficha = function(Id, Ficha, X, Y){
		//Primero extremos el tablero mediante el Id
		Tablero = ListaTableros[Id];

		var colocado = true;
		if (Tablero[X][Y] == 0){
			if ((X != 0 && Y != 0) || (X != 72 && Y != 0) || (Y != 0)){ //En cada una comprobamos las esquinas y los bordes(L-U,U,R-A)
				if (Tablero[X][(Y-1)] != 0){//Arriba
					if (Tablero[X][(Y-1)].d != Ficha.u)
						colocado = false;
				}
			}
			if ((X != 72 && Y != 0) || (X != 72 && Y != 72) || (X != 0)){// (R-U,R,R-D)
				if (Tablero[(X+1)][Y] != 0){//Derecha
					if (Tablero[(X+1)][Y].l != Ficha.r)
						colocado = false;				
				}
			}
			if ((X != 0 && Y != 72) || (X != 72 && Y != 72) || (Y != 72)){//(R-D, D, L-D)
				if (Tablero[X][(Y+1)] != 0){ //Abajo
					if (Tablero[X][(Y+1)].u != Ficha.d)
						colocado = false;
				}
			}
			if ((X != 0 && Y != 0) || (X != 0 && Y != 72) || (X != 0)){//(L-D, L, L-U)
				if (Tablero[(X-1)][Y] != 0){ //Izquierda
					if (Tablero[(X-1)][Y].r != Ficha.l)
						colocado = false;
				}
			}			
		}
		return colocado;			
};



//funcion cierra claustro

console.log("antes del cierra claustro");
CierraClaustro = function(Tablero,X,Y){
	var cerrado = false;
	var contador = 0;
	var puntos = 1;

	console.log("-----");
	console.log("el valor de x es: " + X); 
	console.log("el valor de y es: " + Y);

	if(Tablero[X-1][(Y-1)] != 0){
		contador++;
		puntos++;
	}
	if(Tablero[(X)][(Y-1)] != 0){
		contador++;
		puntos++;
	}
	if(Tablero[(X+1)][Y-1] != 0){
		contador++;
		puntos++;
	}
	if(Tablero[(X+1)][(Y)] != 0){
		contador++;
		puntos++;
	}
	if(Tablero[X+1][(Y+1)] != 0){
		contador++;
		puntos++;
	}
	if(Tablero[(X)][(Y+1)] != 0){
		contador++;
		puntos++;
	}
	if(Tablero[(X-1)][Y+1] != 0){
		contador++;
		puntos++;
	}
	if(Tablero[(X-1)][(Y)] != 0){
		contador++;
		puntos++;
	}
	
	//console.log("el valor del contador es: " + contador);
	if (contador == 8){
		return [true,puntos]
	}else{
		return [false,puntos]
	}

};




//Funcion a la que se llamara a la hora de poner una ficha y comprobar si se pueden
//atribuir puntos a ese jugador o todavía no para ello tendremos dos objetivos a cumplir:
//			- Se cierra el castillo
//			- Hay algun seguidor en ese castillo
//Num = Posicion del seguidor dentro de la ficha(1..4) Se puede cambiar a como nos lo quieran pasar
//X = Posicion inicial de la ficha eje X.   Y = Posicion inicial de la ficha eje Y. 

CuentaPCamino = function(Tablero, Ficha, Num, X, Y){
	var fincamino = [ //Fichas que cierran camino
		'c3mur',
		'mc',
		'c4',
		'c3',
		'chmur',
		'chmure'
	];
	var contcamino = [ //Fichas que continuan camino
		'cc',
		'cr',
		'cmur',
		'ccmur',
		'ccmur3',
		'ccmur2',
		'ccmur2e'
	];
	
	puntos = 0;
	flag = 0;			 			// 2 fincamino. 
	var arr = [];					//Array con todas las direcciones por las que ya hemos pasado

	MeteDirec = function(X, Y){ 	// Diccionario de las posiciones que ha tenido ese camino, para comprobar si hemos retornado al inicio.
		var obj = {
			x: X,
			y: Y
		}
		arr.push(obj);
	};

	//Funcion que nos devuelve si en esa posicion ya hemos estado
	DarDirec = function(X, Y){
		for (i = 0; i <= puntos; i++){
			if (arr[i].x == X && arr[i].y == Y)
				return false;
			else
				return true;
		}
	};

	//Funcion recursiva a la que le voy pasando la ficha siguiente (a partir de la ficha inicial)
	Recursiva = function(Tablero, prohibido, flag, X, Y){
		if ((Tablero[X][Y] != 0) && (flag != 2)){ 		// Caso en el que tenemos ficha en esa dirección y todavía no hemos finalizado camino
			puntos = puntos + 1; 						// Si hay ficha, tiene que ser camino y por tanto sumamos puntos
			//console.log("Puntos que tengo: " + puntos);
			console.log("X: " + X + "Y: " + Y);
			if (fincamino.indexOf(Tablero[X][Y].nombre) != -1){ 		// Si la ficha está en fincamino ya hemos finalizado el camino
				//console.log("Recursiva Fincamino, Ficha: " + Tablero[X][Y].nombre);
				flag = flag + 1;
			}
			else if(contcamino.indexOf(Tablero[X][Y].nombre) != -1){ // Si la ficha está en contcamino seguimos haciendo recursiva
				console.log("Recursiva Contcamino, Ficha: " + Tablero[X][Y].nombre);
				if ((Tablero[X][Y].u == 'camino') && (prohibido != 'arriba') && DarDirec(X,Y)){
					Y1 = Y - 1;	
					MeteDirec(X,Y1);				
					Recursiva(Tablero, 'abajo', flag, X, Y1);
				}
				if ((Tablero[X][Y].r == 'camino') && (prohibido != 'derecha') && DarDirec(X,Y)){
					X1 = X + 1;
					MeteDirec(X1,Y);
					Recursiva(Tablero, 'izquierda', flag, X1, Y);
				}
				if ((Tablero[X][Y].d == 'camino') && (prohibido != 'abajo') && DarDirec(X,Y)){
					Y2 = Y + 1;
					MeteDirec(X,Y2);
					Recursiva(Tablero, 'arriba', flag, X, Y2);
				}
				if ((Tablero[X][Y].l == 'camino') && (prohibido != 'izquierda') && DarDirec(X,Y)){
					X2 = X - 1;
					MeteDirec(X2,Y);
					Recursiva(Tablero, 'derecha', flag, X2, Y);
				}
			}
		}	
	};

	//Funcion para las fichas iniciales continuas(Con dos posibles direcciones).
	Continua = function(Tablero, Ficha, X, Y){ 
		console.log("Entra en Continua");		
		if (Ficha.u == 'camino'){
			Y1 = Y - 1;
			//console.log("Cont Ficha arriba: " + Tablero[X][Y1].nombre);
			MeteDirec(X,Y1);
			Recursiva(Tablero, "abajo", flag, X, Y1);	
		}
		if (Ficha.r == 'camino') {			
			X1 = X + 1;
			//console.log("Cont Ficha derecha: " + Tablero[X1][Y].nombre);
			MeteDirec(X1,Y);
			Recursiva(Tablero, "izquierda", flag, X1, Y);
		}
		if (Ficha.d == 'camino') {			
			Y2 = Y + 1;
			//console.log("Cont Ficha abajo: " + Tablero[X][Y2].nombre);
			MeteDirec(X,Y2);
			Recursiva(Tablero, "arriba", flag, X, Y2);
		}
		if (Ficha.l == 'camino'){			
			X2 = X - 1;
			//console.log("Cont Ficha izquierda: " + Tablero[X2][Y].nombre);
			MeteDirec(X2,Y);
			Recursiva(Tablero, "derecha", flag, X2, Y);
		}
	};

	// Saber que aquí para probarlo solo van a entrar las fichas que estén en cont y fin camino
	// Comprobamos donde esta la ficha -- 4 Posibilidades (U-R-D-L)
	if(Num == 1){ //Miro Arriba
		if (fincamino.indexOf(Ficha.nombre) != -1){ // Buscamos si la ficha esta en fincamino		
			flag = flag + 1; 								// Le sumamos uno porque va a ser un extremo del cierra camino(Va a haber dos)
			Y = Y - 1; 										// Vamos para arriba
			Recursiva(Tablero, "abajo", flag, X, Y); 		// Llamamos a la funcion Recursiva pasandole la siguiente ficha y donde tiene que ir
			MeteDirec(X,Y);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){ 	//Aquí le diremos para donde tiene que tirar cada camino
			//console.log("Num = 1 contcamino Ficha: " + Ficha.nombre);						
			Continua(Tablero, Ficha, X, Y);
		}		
	}	
	else if (Num == 2){ //Miro Derecha
		if (fincamino.indexOf(Ficha.nombre) != -1){
			flag = flag + 1;
			X = X + 1; //Vamos para la derecha
			Recursiva(Tablero, "izquerda", flag, X, Y);
			MeteDirec(X,Y);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			Continua(Tablero, Ficha, X, Y);
		}
	}
	else if (Num == 3){ //Miro Abajo
		if (fincamino.indexOf(Ficha.nombre) != -1){
			flag = flag + 1;
			Y = Y + 1; //Vamos para abajo
			Recursiva(Tablero, "arriba", flag, X, Y);
			MeteDirec(X,Y);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			Continua(Tablero, Ficha, X, Y);
		}			
	}
	else if (Num == 4){ //Miro Izquierda
		if (fincamino.indexOf(Ficha.nombre) != -1){
			flag = flag + 1;
			X = X - 1; //Vamos para la izquierda
			Recursiva(Tablero, "derecha", flag, X, Y);	
			MeteDirec(X,Y);		
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			Continua(Tablero, Ficha, X, Y);
		}	
	}
	else
		console.log("El Num es incorrecto");
	/*for (i = 0; i <= puntos; i++){
		console.log("ArrayPosX: " + arr[i].x);
		console.log("ArrayPosY: " + arr[i].y);
	}*/
	return puntos;
};


//función que comprueba si se ha cerrado el castillo y devuelve la puntuación.
//Para ello dos pasos:
	//ver si se ha cerrado el castillo.
	//ver si hay un caballero en el castillo cerrado.
CierraCastillo = function(Tablero, Ficha, PosSeguidor, X, Y){

	//POSIBLES ESTRUCTURAS DE DATOS A USAR.
	var fichasLadoCastilloConexos =[
		'c3mur',
		'mur1',
		'cmur',
		'ccmur',
		'ccmur3',
		'murcam',
		'ccmur2',
		'ccmur2e',
		'murcame',
		'ciucam2e',
		'ciucam',
		'chmur',
		'chmure',
		'ciucame',
		'ciudad
	];
	
	var fichas2LadosCierranCastillo =[
		'mur2',
		'mur2c'
	];
	
	var fichasConEscudo = [
		'ciudad',
		'chmure',
		'ccmur2e',
		'murcame',
		'ciucame',
		'ciucam2e'
	];
		
	resultado = TipoCastillo(Ficha.nombre);
	console.log("el resultado del tipo de castillo es: " + resultado);
	//return resultado;
	MeteDirec = function(X, Y){         // Diccionario de las posiciones que ha tenido ese camino, para comprobar si hemos retornado al inicio.
    	var obj = {
			x: X,
			y: Y
		}
		arr.push(obj);
	};

	//Funcion que nos devuelve si en esa posicion ya hemos estado
	DarDirec = function(X, Y){
		for (i = 0; i <= puntos; i++){
			if (arr[i].x == X && arr[i].y == Y)
				return false;
			else
				return true;
		}
	};
	var Puntos=0;
	RecursivaCastillo= function(Ficha, Prohibido,X,Y){
		if (Tablero[X][Y]!=0){
			var A=0;
			if (fichas2LadosCastilloConsecutivo.indexOf(Ficha.nombre)!=-1){	//si la ficha esta en este array
				if (Ficha.u=="castillo")&& (Prohibido!= "arriba") && DarDirec(X,Y){
					A=Y-1;
					//si la ficha tiene escudo
					if (fichasConEscudo.indexOf(Ficha.nombre)!=-1){
						Puntos= Puntos + 4;
					}
					else{
						Puntos=Puntos+2;
					}
					MeteDirec(X,A);
					RecursivaCastillo(Tablero[X][A],"abajo",X,A);
				}	
				if (Ficha.r=="castillo") && (Prohibido!= "derecha") && DarDirec(X,Y){
					A=X+1;
					//si la ficha tiene escudo
					if (fichasConEscudo.indexOf(Ficha.nombre)!=-1){
						Puntos= Puntos + 4;
					}
					else{
						Puntos=Puntos+2;
					}
					MeteDirec(A,Y);
					RecursivaCastillo(Tablero[A][Y],"izquierda",A,Y);
				}
				if (Ficha.d=="castillo") && (Prohibido!= "abajo") && DarDirec(X,Y){
					A=Y+1;
					//si la ficha tiene escudo
					if (fichasConEscudo.indexOf(Ficha.nombre)!=-1){
						Puntos= Puntos + 4;
					}
					else{
						Puntos=Puntos+2;
					}
					MeteDirec(X,A);
					RecursivaCastillo(Tablero[X][A],"arriba",X,A);
				}
				if (Ficha.l=="castillo") && (Prohibido!= "izquierda") && DarDirec(X,Y){
					A=X-1;
					//si la ficha tiene escudo
					if (fichasConEscudo.indexOf(Ficha.nombre)!=-1){
						Puntos= Puntos + 4;
					}
					else{
						Puntos=Puntos+2;
					}
					MeteDirec(A,Y);
					RecursivaCastillo(Tablero[A][Y],"derecha",A,Y);
				}
			}
			else{
				Puntos=Puntos+2;
			}
		}
		else{
			Puntos=0;
		}
	};
	
	//tratamos el caso de que llega una ficha con seguidor
	//entramos en el caso de las fichas inconexas
	if (fichas2LadosCierranCastillo.indexOf(Ficha.nombre)!=-1){
		var A=0;
		//tengo que ver las 4 posiciones del seguidor
		if (PosSeguidor==1){
			A=Y-1;
			MeteDirec(X,A);
			RecursivaCastillo(Tablero[X][A], "abajo", X, Y);
			
		}
		if (PosSeguidor==2){
			A=X-1;
			MeteDirec(A,Y);
			RecursivaCastillo(Tablero[A][Y], "izquierda", X, Y);
		}
		if (PosSeguidor==3){
			A=Y+1;
			MeteDirec(X,A);
			RecursivaCastillo(Tablero[X][A], "arriba", X, Y);
		}
		if (PosSeguidor==4){
			A=X+1;
			MeteDirec(A,Y);
			RecursivaCastillo(Tablero[A][Y], "derecha", X, Y);
		}
	}
	else{
		MeteDirec(X,Y);
		RecursivaCastillo(Ficha,"nada", X, Y);
	}
};

CierraCampo = function(board){
	
	this.pointers={
		//Up
		UL:{
			id:"UL",
			points:"DR"
		},
		UC:{
			id:"UC",
			points:"DC"
		},
		UR:{
			id:"UR",
			points:"DL"
		},
		//Rigth
		RL:{
			id:"RL",
			points:"LR"
		},
		RC:{
			id:"RC",
			points:"LC"
		},
		RR:{
			id:"RR",
			points:"LL"
		},
		//Down
		DL:{
			id:"DL",
			points:"UR"
		},
		DC:{
			id:"DC",
			points:"UC"
		},
		DR:{
			id:"DR",
			points:"UL"
		},
		//Left
		LL:{
			id:"LL",
			points:"RR"
		},
		LC:{
			id:"LC",
			points:"RC"
		},
		LR:{
			id:"LR",
			points:"RL"
		}
	}
	
	//Const, touch this and i'll kill u.
	var UL = this.pointers["UL"];
	var UC = this.pointers["UC"];
	var UR = this.pointers["UR"];
	var RL = this.pointers["RL"];
	var RC = this.pointers["RC"];
	var RR = this.pointers["RR"];
	var DL = this.pointers["DL"];
	var DC = this.pointers["DC"];
	var DR = this.pointers["DR"];
	var LL = this.pointers["LL"];
	var LC = this.pointers["LC"];
	var LR = this.pointers["LR"];
	var SIDE = 0;
	var SUBSIDE = 1;
	
	//Rotate the tile, 90deg clockwise
	this._rotate=function(t){
		switch(tile.id){
			case "UL": return RL; break;
			case "UC": return RC; break;
			case "UR": return RR; break;
			case "RL": return DL; break;
			case "RC": return DC; break;
			case "RR": return DR; break;
			case "DL": return LL; break;
			case "DC": return LC; break;
			case "DR": return LR; break;
			case "LL": return UL; break;
			case "LC": return UC; break;
			case "LR": return UR; break;
		};
	};
	
	//Rotate the tile n times.
	this.Rotate = function(tile,times){
		var tmp = tile;
		for (var i = 0; i<times, i++){
			tmp = this._rotate(tmp);
		};
		return tmp;
	};
	
	//New field properties to the tiles.
	FichaPropiedades["murcam"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,RC]}
	}
	FichaPropiedades["c3mur"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,DR]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RL]},
		3:{id:"3",fieldOwner:[],fieldPointers:[RR,DL]}
	}
	FichaPropiedades["mur2"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,DC]}
	}
	FichaPropiedades["m"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,RC,DC,LC]}
	}
	FichaPropiedades["mc"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,RL,RR,DC,LC]}
	}
	FichaPropiedades["c4"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,LR]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RL]},
		3:{id:"3",fieldOwner:[],fieldPointers:[LL,DR]},
		4:{id:"4",fieldOwner:[],fieldPointers:[RR,DL]}
	}
	FichaPropiedades["cc"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,RR,DC,LC]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RL]}	
	}
	FichaPropiedades["cr"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,RL,LR]},
		2:{id:"2",fieldOwner:[],fieldPointers:[RR,DC,LL]}
	}
	FichaPropiedades["c3"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,DR,LC]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RL]},
		3:{id:"3",fieldOwner:[],fieldPointers:[RR,DL]}
	}
	FichaPropiedades["ciucam"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[RC]}
	}
	FichaPropiedades["chmur"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[RL]},
		2:{id:"2",fieldOwner:[],fieldPointers:[RR]}
	}
	FichaPropiedades["mur2c"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[RC,DC]}
	}
	FichaPropiedades["mur1"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,RC,DC]}
	}
	FichaPropiedades["cmur"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,DR]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RC,DL]}
	}
	FichaPropiedades["ccmur"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,RR,DC]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RL]}
	}
	FichaPropiedades["ccmur3"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,RL,DR]},
		2:{id:"2",fieldOwner:[],fieldPointers:[RR,DL]}
	}
	FichaPropiedades["ciucam2"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[LC]},
		2:{id:"2",fieldOwner:[],fieldPointers:[RC]}
	}
	FichaPropiedades["ccmur2"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,RR]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RL]}
	}
	FichaPropiedades["chmure"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[RL]},
		2:{id:"2",fieldOwner:[],fieldPointers:[RR]}
	}
	FichaPropiedades["ccmur2e"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UL,RR]},
		2:{id:"2",fieldOwner:[],fieldPointers:[UR,RL]}
	}
	FichaPropiedades["murcame"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[UC,RC]}
	}
	FichaPropiedades["ciucame"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[RC]}
	}
	FichaPropiedades["ciucam2e"]["fieldMap"]={
		1:{id:"1",fieldOwner:[],fieldPointers:[LC]},
		2:{id:"2",fieldOwner:[],fieldPointers:[RC]}
	}
	
	this.RecursiveChecker = function(board,xpos,ypos,from,owner,id){
		var tile = board[xpos][ypos];
		if (! tile.fielded){
			//first time to be fielded
			tile.fielded=[];
			board[xpos][ypos].fielded=[];
		}
		if (if ! id in tile.fielded){
			//we have not fielded this tile before
			board[xpos][ypos].fielded.push(id);	//push our id, next time we wont field it again
			if (from == ""){
				//initial growing point tile
				var fieldId = //tile.seguidor.what??
				var owner = //tile.seguidor.what??
			}else{
				//find the field id
				for(field in tile.fieldMap){
					if (from in field.fieldPointers){
						var fieldId = field.id;
						break;
					}
				}
			}
			board[xpos][ypos].fieldMap[fieldId].fieldOwner.push(owner)		//push the owner
			for (pointer in tile.fieldMap[fieldId].fieldPointers){			//each new direction in the same field
				if (pointer.id != from){
					// except the direction from where i came
					switch(pointer.points[SIDE]){
						case "U": RecursiveChecker(board,xpos,ypos-1,dir.points,owner);break;
						case "R": RecursiveChecker(board,xpos+1,ypos,dir.points,owner);break;
						case "D": RecursiveChecker(board,xpos,ypos+1,dir.points,owner);break;
						case "L": RecursiveChecker(board,xpos-1,ypos,dir.points,owner);break;
					}
				}
			}
		}
	};
	
	//Main loop
	this.Run = function(){
		var i = 0;
		for (i in board.length){
			for (j in board[i].length){
				var tile = board[i][j];
				//tile.seguidor??
				if (tile.seguidor){
					RecursiveChecker(board,tile,"","",i));
					i++;
				}
			}
		}
	}
};





//Añadidos de Jose
var FieldPointers={
        //Up
        UL:{id:"UL",points:"DR"        },
        UC:{id:"UC",points:"DC"        },
        UR:{id:"UR",points:"DL"        },
        //Rigth
        RL:{id:"RL",points:"LR"        },
        RC:{id:"RC",points:"LC"        },
        RR:{id:"RR",points:"LL"        },
        //Down
        DL:{id:"DL",points:"UR"        },
        DC:{id:"DC",points:"UC"        },
        DR:{id:"DR",points:"UL"        },
        //Left
        LL:{id:"LL",points:"RR"        },
        LC:{id:"LC",points:"RC"        },
        LR:{id:"LR",points:"RL"        }
}

var UL = FieldPointers["UL"];
var UC = FieldPointers["UC"];
var UR = FieldPointers["UR"];
var RL = FieldPointers["RL"];
var RC = FieldPointers["RC"];
var RR = FieldPointers["RR"];
var DL = FieldPointers["DL"];
var DC = FieldPointers["DC"];
var DR = FieldPointers["DR"];
var LL = FieldPointers["LL"];
var LC = FieldPointers["LC"];
var LR = FieldPointers["LR"];
var SIDE = 0;
var SUBSIDE = 1;
var CASTILLO = 'castillo';
var CAMINO = 'camino';
var CAMPO = 'campo';

//Descriptor de fichas dada la posicion del seguidor
var FichaPAmp = {
/*0*/		murcam:  {nombre:"murcam", si:"campo", sc:"campo", sd:"campo",
						ci:"ciudad", cc:"no", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},        //media ficha muralla media ficha campo
/*1*/		c3mur: 	 {nombre:"c3mur", si:"campo", sc:"camino", sd:"campo2",
						ci:"ciudad", cc:"no", cd:"camino2", ii:"campo", ic:"camino3", id:"campo3"},         //cruce de 3 caminos con muralla al lado
/*2*/		mur2: 	 {nombre:"mur2", si:"campo", sc:"campo", sd:"campo",
						ci:"ciudad", cc:"campo", cd:"ciudad2", ii:"campo", ic:"campo", id:"campo"},          //una muralla a cada lado de la ficha
/*3*/		m: 		 {nombre:"m", si:"campo", sc:"campo", sd:"campo",
						ci:"campo", cc:"monasterio", cd:"campo", ii:"campo", ic:"campo", id:"campo"},               //monasterio
/*4*/  		mc: 	 {nombre:"mc", si:"campo", sc:"campo", sd:"campo",
						ci:"campo", cc:"monasterio", cd:"camino", ii:"campo", ic:"campo", id:"campo"},               //monasterio con camino
/*5*/		c4: 	 {nombre:"c4", si:"campo", sc:"camino", sd:"campo2",
						ci:"camino2", cc:"no", cd:"camino3", ii:"campo3", ic:"camino4", id:"campo4"},              //cruce de 4 caminos
/*6*/		cc: 	 {nombre:"cc", si:"campo", sc:"camino", sd:"campo2",
						ci:"campo", cc:"camino", cd:"camino", ii:"campo", ic:"campo", id:"campo"},               //camino curva
/*7*/ 		cr: 	 {nombre:"cr", si:"campo", sc:"campo", sd:"campo",
						ci:"camino", cc:"camino", cd:"camino", ii:"campo2", ic:"campo2", id:"campo2"},              //camino recto
/*8*/ 		c3: 	 {nombre:"c3", si:"campo", sc:"camino", sd:"campo2",
						ci:"campo", cc:"no", cd:"camino2", ii:"campo", ic:"camino3", id:"campo3"},               //cruce de 3 caminos
/*9*/		ciudad:  {nombre:"ciudad", si:"ciudad", sc:"ciudad", sd:"ciudad",
						ci:"ciudad", cc:"ciudad", cd:"ciudad", ii:"ciudad", ic:"ciudad", id:"ciudad"},        //todo ciudad con escudo
/*10*/		ciucam:  {nombre:"ciucam", si:"ciudad", sc:"ciudad", sd:"campo",
						ci:"ciudad", cc:"ciudad", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},        //ciudad con un lado de campo
/*11*/		chmur: 	 {nombre:"chmur", si:"ciudad", sc:"ciudad", sd:"campo",
						ci:"ciudad", cc:"ciudad", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo2"},   	   //camino hacia muralla
/*12*/		mur2c: 	 {nombre:"mur2c", si:"campo", sc:"ciudad", sd:"campo",
						ci:"ciudad2", cc:"campo", cd:"campo", ii:"campo", ic:"campo", id:"campo"},         //2 murallas en lados contiguos
/*13*/		mur1: 	 {nombre:"mur1", si:"campo", sc:"campo", sd:"campo",
						ci:"ciudad", cc:"campo", cd:"campo", ii:"campo", ic:"campo", id:"campo"},          //1 muralla en un lado y el resto campo
/*14*/		cmur: 	 {nombre:"cmur", si:"campo", sc:"camino", sd:"campo2",
						ci:"ciudad", cc:"camino", cd:"campo2", ii:"campo", ic:"camino", id:"campo2"},          //camino recto con muralla al lado(ini)
/*15*/ 		ccmur: 	 {nombre:"ccmur", si:"campo", sc:"camino", sd:"campo2",
						ci:"ciudad", cc:"campo", cd:"camino", ii:"campo", ic:"campo", id:"campo"},         //camino con curva y con muralla al lado
/*16*/		ccmur3:  {nombre:"ccmur3", si:"campo", sc:"campo", sd:"campo",
						ci:"ciudad", cc:"camino", cd:"camino", ii:"campo", ic:"camino", id:"campo2"},        //camino con curva y muralla al lado(otro)
/*17*/		ciucam2: {nombre:"ciucam2", si:"campo", sc:"ciudad", sd:"campo",
						ci:"campo", cc:"ciudad", cd:"campo", ii:"campo", ic:"ciudad", id:"campo"},          //ciudad con 2 lados opuestos de campo
/*18*/		ccmur2:  {nombre:"ccmur2", si:"campo", sc:"camino", sd:"campo2",
						ci:"ciudad", cc:"camino", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo"},	 	   //camino con curva con 2 lados de ciudad seg
/*19*/ 		chmure:  {nombre:"chmure", si:"ciudad", sc:"ciudad", sd:"campo",
						ci:"ciudad", cc:"ciudad", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo2"}, 	   //camino hacia muralla con escudo
/*20*/  	ccmur2e: {nombre:"ccmur2e", si:"campo", sc:"camino", sd:"campo2",
						ci:"ciudad", cc:"camino", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo"},       //camino con curva con 2 lados de ciudad,escudo
/*21*/  	murcame: {nombre:"murcame", si:"campo", sc:"campo", sd:"campo",
						ci:"ciudad", cc:"no", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},       //media ficha muralla media ficha campo con escudo
/*22*/  	ciucame: {nombre:"ciucame", si:"ciudad", sc:"ciudad", sd:"campo",
						ci:"ciudad", cc:"ciudad", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"},       //ciudad con un lado de campo con escudo
/*23*/  	ciucam2e:{nombre:"ciucam2e", si:"campo", sc:"ciudad", sd:"campo",
						ci:"campo", cc:"ciudad", cd:"campo", ii:"campo", ic:"ciudad", id:"campo"}      
};

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

/*
//Funcion para girar ficha de fichas ampliadas
/*GirarFichaAmp = function (F){
	var Gir = F.gir;
	while (F.gir != 0){	
		auxe = F.si;
		F.si = F.ii;
		F.ii = F.id;
		F.id = F.sd;
		F.sd = auxe;

		auxi = F.sc;
		F.sc = F.ci;
		F.ci = F.ic;
		F.ic = F.cd;
		F.cd = auxi;
		
		F.gir = F.gir - 1; 
	}
	F.gir = Gir;
};
*/


/*
//Funcion para saber si se puede colocar un Ladron (seguidor en campo)
ColocarLadron = function(Tablero, cuadrado, zona, X, Y){
	//Funcion para transformar ficha de modelo simple a compuesto
	Transforma = function(Tablero, X, Y){
		var F = {
			nombre : "nada",
			si: "nada",
			sc: "nada",
			sd: "nada",
			ci: "nada",
			cc: "nada",
			cd: "nada",
			ii: "nada",
			ic: "nada",
			id: "nada",
			gir: 0
		}; 
		for(i = 0; i < 24; i++){
			if (Tablero[X][Y].nombre == ArFiAmp[i].nombre){
				F.nombre = ArFiAmp[i].nombre;
				F.si = ArFiAmp[i].si;
				F.sc = ArFiAmp[i].sc;
				F.sd = ArFiAmp[i].sd;
				F.cd = ArFiAmp[i].cd;
				F.cc = ArFiAmp[i].cc;
				F.ci = ArFiAmp[i].ci;
				F.ii = ArFiAmp[i].ii;
				F.ic = ArFiAmp[i].ic;
				F.id = ArFiAmp[i].id;
			}
		}
		F.gir = Tablero[X][Y].gir
		F = GirarFichaAmp(F);
		return F;
	};

	//FichaAct = Transforma(Tablero, X, Y);
	
	//Primero entramos aqui
	if (cuadrado == 1){

	}
	else if (cuadrado == 2){

	}

};
*/

//Función para comprobar donde esta el seguidor
ColocaSeguidor = function(Id, X, Y, cuadrado, zona){
	var puede = false;
	var Campo = [
	'campo',
	'campo2',
	'campo3',
	'campo4'
	];

	var Ciudad = [
	'ciudad',
	'ciudad2'
	];

	var Camino = [
	'camino',
	'camino2',
	'camino3',
	'camino4'
	];
	//Buscamos el tablero correspondiente a esa ficha
	for (i=0; i < CuentaTableros; i++){
		if(Tableros[i].id == Id){
			Tablero = Tableros[i].Tablero;
		}
	}
	// Si la zona esta en campo
	if (Campo.indexOf(zona) != 1){
		puede = ColocarLadron(Tablero, cuadrado, zona, X, Y)  //Pedro
	}		
	else if (Ciudad.indexOf(zona) != 1){
		puede = ColocarSeguidorCastillo(Tablero, cuadrado, X, Y); //Isra
	}
	else if (Camino.indexOf(zona) != 1){
		puede = PonerSeguidorCamino(Tablero, cuadrado, X, Y); //Alberto
	}
	return puede;	
};

ColocarLadron = function(Tablero, cuadrado, zona, X, Y){
	//Rotate the tile, 90deg clockwise
	_rotate=function(t){
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
    Rotate = function(tile){
		var tmp = tile;
        var times = tile.rotacion/90;
        for (var i = 0; i<times; i++){
                tmp = this._rotate(tmp);
        };
        return tmp;
	};

	var board=Tablero;
	
	RecursiveChecker = function(board,xpos,ypos,from,owner,id){
		var tile = board[xpos][ypos];
        if (! tile.fielded){
         	//first time to be fielded
            tile.fielded=[];
            board[xpos][ypos].fielded=[];
        }
        if (! id in tile.fielded){
			//we have not fielded this tile before
			board[xpos][ypos].fielded.push(id);        //push our id, next time we wont field it again
			if (from == ""){
				//initial growing point tile
                tile= this.Rotate(tile);
                console.log(tile.scuadrado)
                var fieldId = 0;
                var owner = 0;
        	}else{
        		//find the field id
            	for(field in tile.fieldMap){
					if (from in field.fieldPointers){
						var fieldId = field.id;
							break;
					}
				}
			}	
			board[xpos][ypos].fieldMap[fieldId].fieldOwner.push(owner)                //push the owner
			for (pointer in tile.fieldMap[fieldId].fieldPointers){                        //each new direction in the same field
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
              
	//Main loop.
	//Bucle para el caso de contar puntos en campo. Pero para colocar seguidor notengo que hacer esto
	var tile = board[X][Y];
	if (tile.szona=='campo'){
		RecursiveChecker(board,X,Y,tile,"","",i);
	}
	else{
		console.log("Board not found..!!")
    }
}

//Función que mira si se puede poner el seguidor en la ficha, teniendo en cuenta los caminos
//Pos = posicion del seguidor dentro de la ficha
PonerSeguidorCamino = function(Tablero, Pos, X, Y){

	console.log("========================");
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

	var seguidores = 0;
	var flag = 0;
	var colocar_seguidor = true;
	var Ficha_Inicio = Tablero[X][Y];
	console.log("la ficha donde quiero poner seguidor es:   " + Ficha_Inicio.nombre);
	var direcciones = [];
	var z = 0;
	var jugador = Ficha_Inicio.nomjug;

	console.log("el nombre del jugador es:   " + Ficha_Inicio.nombre);

	MeteDirec = function(X, Y){ 	
		var posicion = {
			x: X,
			y: Y
		}
		direcciones.push(posicion);
		z++;
	};

	DarDirec = function(X, Y){
		Encontrado = true;
		for (i = 0; i <= z - 1; i++){
			if (direcciones[i].x == X && direcciones[i].y == Y)
				Encontrado = false;
		}
		return Encontrado;
	};


	Recursiva = function(Tablero,banner,flag,X,Y) {

		//console.log("la ficha ahoraaa es:  ->>>>>>>>>>>>>>>> " + Tablero[X][Y].nombre);

		if ((Tablero[X][Y] != 0) && (flag != 2) && (colocar_seguidor != false)){ 	// Caso en el que tenemos ficha en esa dirección y todavía no hemos finalizado camino 	


			if (fincamino.indexOf(Tablero[X][Y].nombre) != -1){ 		// Si la ficha está en fincamino ya hemos finalizado el camino 		
				if (banner == "abajo"){	
					if (Tablero[X][Y].scuadrado != 8){
						//coloca_seguidor == true;
						seguidores = seguidores + 1;
						console.log("incremento seguidores a ---> " + seguidores);
					}else{
						colocar_seguidor = false;
					}
				}else if (banner == "izquierda"){
					if (Tablero[X][Y].scuadrado != 4){
						//coloca_seguidor == true;
						seguidores = seguidores + 1;
						console.log("incremento seguidores a ---> " + seguidores);
					}else{
						colocar_seguidor = false;
					}
				}else if (banner == "arriba"){
					if (Tablero[X][Y].scuadrado != 2){
						//coloca_seguidor == true;
						seguidores = seguidores + 1;
						console.log("incremento seguidores a ---> " + seguidores);
					}else{
						colocar_seguidor = false;
					}
				}else if (banner == "derecha"){
					if (Tablero[X][Y].scuadrado != 6){
						//coloca_seguidor == true;
						seguidores = seguidores + 1;
						console.log("incremento seguidores a ---> " + seguidores);
					}else{
						colocar_seguidor = false;
					}
				}			
				flag = flag + 1;

			}
			else if(contcamino.indexOf(Tablero[X][Y].nombre) != -1){ // Si la ficha está en contcamino seguimos haciendo recursiva

				console.log("DENTRO DE RECURSIVA: es cont camino");

				if (banner == "abajo"){	
					if ((Tablero[X][Y].scuadrado == 8) || (Tablero[X][Y].scuadrado == 5)){
						flag = flag + 1;
						colocar_seguidor = false;
					}
				}else if (banner == "izquierda"){
					if ((Tablero[X][Y].scuadrado == 4) || (Tablero[X][Y].scuadrado == 5)){
						flag = flag + 1;
						colocar_seguidor = false;
					}
				}else if (banner == "arriba"){
					if ((Tablero[X][Y].scuadrado == 2) || (Tablero[X][Y].scuadrado == 5)){
						console.log("hay seguidor arriba. Cambio valor de colocar_seguidor");
						flag = flag + 1;
						colocar_seguidor = false;
					}
				}else if (banner == "derecha"){
					if ((Tablero[X][Y].scuadrado == 6) || (Tablero[X][Y].scuadrado == 5)){
						flag = flag + 1;
						colocar_seguidor = false; 
					}
				}
			
				if ((Tablero[X][Y].u == 'camino') && (banner != 'arriba') && DarDirec(X,Y)){	
					if (Tablero[X][Y].scuadrado == 2){ 
						flag = flag + 1;
						colocar_seguidor = false;
					}			
					console.log("camino arriba.");
					Y1 = Y + 1;	
					MeteDirec(X,Y);				
					Recursiva(Tablero, 'abajo', flag, X, Y1);
				}
				if ((Tablero[X][Y].r == 'camino') && (banner != 'derecha') && DarDirec(X,Y)){			
					if (Tablero[X][Y].scuadrado == 6){
						flag = flag + 1;
						colocar_seguidor = false;
					}		
					console.log("camino a la dcha.");
					X1 = X + 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'izquierda', flag, X1, Y);
				}
				if ((Tablero[X][Y].d == 'camino') && (banner != 'abajo') && DarDirec(X,Y)){		
					if (Tablero[X][Y].scuadrado == 8){
						flag = flag + 1;
						colocar_seguidor = false;
					}
					console.log("camino abajo. ");
					Y2 = Y - 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'arriba', flag, X, Y2);
				}
				if ((Tablero[X][Y].l == 'camino') && (banner != 'izquierda') && DarDirec(X,Y)){ 	
					if (Tablero[X][Y].scuadrado == 4){
						flag = flag + 1;
						colocar_seguidor = false;
					}			
					console.log("camino izqda.  ");		
					X2 = X - 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'derecha', flag, X2, Y);
				}
			}
		}
	};

	SigueCamino = function(Tablero,Ficha,X,Y){		
		if (Ficha.u == 'camino'){
			console.log("hay camino arriba...me voy arriba");	
			Y1 = Y + 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "abajo", flag, X, Y1);	
		}
		if (Ficha.r == 'camino') {		
			console.log("hay camino a la derecha...me voy a la derecha");	
			X1 = X + 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "izquierda", flag, X1, Y);
		}
		if (Ficha.d == 'camino') {	
			console.log("hay camino abajo..me voy abajo");		
			Y2 = Y - 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "arriba", flag, X, Y2);
		}
		if (Ficha.l == 'camino'){	
			console.log("hay camino a la izqda...me voy a la izquierda");			
			X2 = X - 1;	
			//console.log("la pos de X es ---> " + X2);
			MeteDirec(X,Y);
			Recursiva(Tablero, "derecha", flag, X2, Y);
		}
	};



	if (Pos == 2){  //miro arriba de la ficha
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){  // Si la ficha esta en fincamino	
			//flag = flag + 1; 								// Le sumamos uno porque va a ser un extremo del cierra camino(Va a haber dos)
			seguidores = seguidores + 1;
			Y1 = Y + 1; 									// Vamos para arriba
			MeteDirec(X,Y);
			Recursiva(Tablero, "abajo", flag, X, Y1); 		// Llamamos a la funcion Recursiva pasandole la siguiente ficha y donde tiene que ir	
		}
		else if (contcamino.indexOf(Ficha_Inicio.nombre) != -1){ 	//Aquí le diremos para donde tiene que tirar cada camino					
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}		
	}	
	else if (Pos == 6){ //Miro Derecha
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			console.log("es una ficha de fin camino");
			//flag = flag + 1;
			seguidores = seguidores + 1;
			X1 = X + 1; //Vamos para la derecha
			MeteDirec(X,Y);
			Recursiva(Tablero, "izquierda", flag, X1, Y);
		}
		else if (contcamino.indexOf(Ficha_Inicio.nombre) != -1){
			console.log("es una ficha de contcamino");
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}
	}
	else if (Pos == 8){ //Miro Abajo
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			seguidores = seguidores + 1;
			Y2 = Y - 1; //Vamos para abajo
			MeteDirec(X,Y);
			Recursiva(Tablero, "arriba", flag, X, Y2);
		}
		else if (contcamino.indexOf(Ficha_Inicio.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}			
	}
	else if (Pos == 4){ //Miro Izquierda
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			seguidores = seguidores + 1;
			X2 = X - 1; //Vamos para la izquierda
			MeteDirec(X,Y);	
			Recursiva(Tablero, "derecha", flag, X2, Y);		
		}
		else if (contcamino.indexOf(Ficha_Inicio.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}	
	}
	else
		console.log("El Pos es incorrecto");

	
	direcciones = [];

	console.log("---------------------");
	console.log("los seguidores son: " + seguidores);
	console.log("colocar seguidor es:  " + colocar_seguidor);
	console.log("---------------------");

	if ((seguidores == 2) || (colocar_seguidor == true)){
		return true;
	}else{
		return false;
	}

	//return colocar_seguidor;;
		
};









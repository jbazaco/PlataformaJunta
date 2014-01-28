
//Función para comprobar donde esta el seguidor
//PosSeg = function(){

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

ArFiAmp = _.toArray(FichaPAmp);


//Funcion para girar ficha de fichas ampliadas
GirarFichaAmp = function (F){
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
};


//Funcion para saber si se puede colocar un Ladron (seguidor en campo)
ColocarLadron = function(Tablero, cuadrado, zona, X, Y){
	//Funcion para transformar ficha de modelo simple a compuesto
	Transforma = function(Tablero, X, Y){
		var F = {
			nombre: "nada",
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
	if (zona == 'campo'){
		
	}
	else if (zona == 'campo2'){

	}
	else if (zona == 'campo3'){

	}
	else if (zona == 'campo4'){}

};




//Función que mira si se puede poner el seguidor en la ficha, teniendo en cuenta los caminos
//Pos = posicion del seguidor dentro de la ficha
PonerSeguidorCamino = function(Tablero, Pos, X, Y){
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
	var colocar_seguidor = false;
	var Ficha_Inicio = Tablero[X][Y];
	var direcciones = [];
	var z = 0;

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

		if ((Tablero[X][Y] != 0) && (flag != 1)){ 	// Caso en el que tenemos ficha en esa dirección y todavía no hemos finalizado camino 	


			if (fincamino.indexOf(Tablero[X][Y].nombre) != -1){ 		// Si la ficha está en fincamino ya hemos finalizado el camino 		
				if (banner == "abajo"){	
					if (Tablero[X][Y].scuadrado != 8){
						coloca_seguidor == true;
					}
				}else if (banner == "izquierda"){
					if (Tablero[X][Y].scuadrado != 4){
						coloca_seguidor == true;
					}
				}else if (banner == "arriba"){
					if (Tablero[X][Y].scuadrado != 2){
						coloca_seguidor == true;
					}
				}else if (banner == "derecha"){
					if (Tablero[X][Y].scuadrado != 6){
						coloca_seguidor == true;
					}
				}			
				flag = flag + 1;

			}
			else if(contcamino.indexOf(Tablero[X][Y].nombre) != -1){ // Si la ficha está en contcamino seguimos haciendo recursiva

				if (banner == "abajo"){	
					if (Tablero[X][Y].scuadrado == 8){
						coloca_seguidor == false;
					}
				}else if (banner == "izquierda"){
					if (Tablero[X][Y].scuadrado == 4){
						coloca_seguidor == false;
					}
				}else if (banner == "arriba"){
					if (Tablero[X][Y].scuadrado == 2){
						coloca_seguidor == false;
					}
				}else if (banner == "derecha"){
					if (Tablero[X][Y].scuadrado == 6){
						coloca_seguidor == false;
					}
				}
			
				if ((Tablero[X][Y].u == 'camino') && (banner != 'arriba') && DarDirec(X,Y)){	
					if (Tablero[X][Y] == 2){
						flag = flag + 1;
						coloca_seguidor = false;
					}			
					Y1 = Y + 1;	
					MeteDirec(X,Y);				
					Recursiva(Tablero, 'abajo', flag, X, Y1);
				}
				if ((Tablero[X][Y].r == 'camino') && (banner != 'derecha') && DarDirec(X,Y)){			
					if (Tablero[X][Y] == 6){
						flag = flag + 1;
						coloca_seguidor = false;
					}		
					X1 = X + 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'izquierda', flag, X1, Y);
				}
				if ((Tablero[X][Y].d == 'camino') && (banner != 'abajo') && DarDirec(X,Y)){		
					if (Tablero[X][Y] == 8){
						flag = flag + 1;
						coloca_seguidor = false;
					}
					Y2 = Y - 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'arriba', flag, X, Y2);
				}
				if ((Tablero[X][Y].l == 'camino') && (banner != 'izquierda') && DarDirec(X,Y)){ 	
					if (Tablero[X][Y] == 4){
						flag = flag + 1;
						coloca_seguidor = false;
					}					
					X2 = X - 1;
					MeteDirec(X,Y);
					Recursiva(Tablero, 'derecha', flag, X2, Y);
				}
			}
		}
	};

	SigueCamino = function(Tablero,Ficha,X,Y){		
		if (Ficha.u == 'camino'){
			Y1 = Y + 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "abajo", flag, X, Y1);	
		}
		if (Ficha.r == 'camino') {			
			X1 = X + 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "izquierda", flag, X1, Y);
		}
		if (Ficha.d == 'camino') {		
			Y2 = Y - 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "arriba", flag, X, Y2);
		}
		if (Ficha.l == 'camino'){			
			X2 = X - 1;
			MeteDirec(X,Y);
			Recursiva(Tablero, "derecha", flag, X2, Y);
		}
	};



	if (Pos == 2){  //miro arriba de la ficha
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){  // Si la ficha esta en fincamino	
			//flag = flag + 1; 								// Le sumamos uno porque va a ser un extremo del cierra camino(Va a haber dos)
			Y1 = Y + 1; 									// Vamos para arriba
			MeteDirec(X,Y);
			Recursiva(Tablero, "abajo", flag, X, Y1); 		// Llamamos a la funcion Recursiva pasandole la siguiente ficha y donde tiene que ir	
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){ 	//Aquí le diremos para donde tiene que tirar cada camino					
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}		
	}	
	else if (Pos == 6){ //Miro Derecha
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			X1 = X + 1; //Vamos para la derecha
			MeteDirec(X,Y);
			Recursiva(Tablero, "izquierda", flag, X1, Y);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}
	}
	else if (Pos == 8){ //Miro Abajo
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			Y2 = Y - 1; //Vamos para abajo
			MeteDirec(X,Y);
			Recursiva(Tablero, "arriba", flag, X, Y2);
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}			
	}
	else if (Pos == 4){ //Miro Izquierda
		if (fincamino.indexOf(Ficha_Inicio.nombre) != -1){
			//flag = flag + 1;
			X2 = X - 1; //Vamos para la izquierda
			MeteDirec(X,Y);	
			Recursiva(Tablero, "derecha", flag, X2, Y);		
		}
		else if (contcamino.indexOf(Ficha.nombre) != -1){
			SigueCamino(Tablero, Ficha_Inicio, X, Y);
		}	
	}
	else
		console.log("El Pos es incorrecto");

	
	direcciones = [];

	return colocar_seguidor;;
		
};










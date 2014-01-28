/*
//Función para comprobar donde esta el seguidor
PosSeg = function(){



};

//Descriptor de fichas dada la posicion del seguidor
var FichaPAmp = {
/*0*/                murcam: {nombre:"murcam", si:"campo", sc:"campo", sd:"campo",
                                                ci:"ciudad", cc:"no", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"}, //media ficha muralla media ficha campo
/*1*/                c3mur:          {nombre:"c3mur", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"ciudad", cc:"no", cd:"camino2", ii:"campo", ic:"camino3", id:"campo3"}, //cruce de 3 caminos con muralla al lado
/*2*/                mur2:          {nombre:"mur2", si:"campo", sc:"campo", sd:"campo",
                                                ci:"ciudad", cc:"campo", cd:"ciudad2", ii:"campo", ic:"campo", id:"campo"}, //una muralla a cada lado de la ficha
/*3*/                m:                  {nombre:"m", si:"campo", sc:"campo", sd:"campo",
                                                ci:"campo", cc:"monasterio", cd:"campo", ii:"campo", ic:"campo", id:"campo"}, //monasterio
/*4*/                 mc:          {nombre:"mc", si:"campo", sc:"campo", sd:"campo",
                                                ci:"campo", cc:"monasterio", cd:"camino", ii:"campo", ic:"campo", id:"campo"}, //monasterio con camino
/*5*/                c4:          {nombre:"c4", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"camino2", cc:"no", cd:"camino3", ii:"campo3", ic:"camino4", id:"campo4"}, //cruce de 4 caminos
/*6*/                cc:          {nombre:"cc", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"campo", cc:"camino", cd:"camino", ii:"campo", ic:"campo", id:"campo"}, //camino curva
/*7*/                 cr:          {nombre:"cr", si:"campo", sc:"campo", sd:"campo",
                                                ci:"camino", cc:"camino", cd:"camino", ii:"campo2", ic:"campo2", id:"campo2"}, //camino recto
/*8*/                 c3:          {nombre:"c3", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"campo", cc:"no", cd:"camino2", ii:"campo", ic:"camino3", id:"campo3"}, //cruce de 3 caminos
/*9*/                ciudad: {nombre:"ciudad", si:"ciudad", sc:"ciudad", sd:"ciudad",
                                                ci:"ciudad", cc:"ciudad", cd:"ciudad", ii:"ciudad", ic:"ciudad", id:"ciudad"}, //todo ciudad con escudo
/*10*/                ciucam: {nombre:"ciucam", si:"ciudad", sc:"ciudad", sd:"campo",
                                                ci:"ciudad", cc:"ciudad", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"}, //ciudad con un lado de campo
/*11*/                chmur:          {nombre:"chmur", si:"ciudad", sc:"ciudad", sd:"campo",
                                                ci:"ciudad", cc:"ciudad", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo2"},          //camino hacia muralla
/*12*/                mur2c:          {nombre:"mur2c", si:"campo", sc:"ciudad", sd:"campo",
                                                ci:"ciudad2", cc:"campo", cd:"campo", ii:"campo", ic:"campo", id:"campo"}, //2 murallas en lados contiguos
/*13*/                mur1:          {nombre:"mur1", si:"campo", sc:"campo", sd:"campo",
                                                ci:"ciudad", cc:"campo", cd:"campo", ii:"campo", ic:"campo", id:"campo"}, //1 muralla en un lado y el resto campo
/*14*/                cmur:          {nombre:"cmur", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"ciudad", cc:"camino", cd:"campo2", ii:"campo", ic:"camino", id:"campo2"}, //camino recto con muralla al lado(ini)
/*15*/                 ccmur:          {nombre:"ccmur", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"ciudad", cc:"campo", cd:"camino", ii:"campo", ic:"campo", id:"campo"}, //camino con curva y con muralla al lado
/*16*/                ccmur3: {nombre:"ccmur3", si:"campo", sc:"campo", sd:"campo",
                                                ci:"ciudad", cc:"camino", cd:"camino", ii:"campo", ic:"camino", id:"campo2"}, //camino con curva y muralla al lado(otro)
/*17*/                ciucam2: {nombre:"ciucam2", si:"campo", sc:"ciudad", sd:"campo",
                                                ci:"campo", cc:"ciudad", cd:"campo", ii:"campo", ic:"ciudad", id:"campo"}, //ciudad con 2 lados opuestos de campo
/*18*/                ccmur2: {nombre:"ccmur2", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"ciudad", cc:"camino", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo"},                  //camino con curva con 2 lados de ciudad seg
/*19*/                 chmure: {nombre:"chmure", si:"ciudad", sc:"ciudad", sd:"campo",
                                                ci:"ciudad", cc:"ciudad", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo2"},          //camino hacia muralla con escudo
/*20*/         ccmur2e: {nombre:"ccmur2e", si:"campo", sc:"camino", sd:"campo2",
                                                ci:"ciudad", cc:"camino", cd:"camino", ii:"ciudad", ic:"ciudad", id:"campo"}, //camino con curva con 2 lados de ciudad,escudo
/*21*/         murcame: {nombre:"murcame", si:"campo", sc:"campo", sd:"campo",
                                                ci:"ciudad", cc:"no", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"}, //media ficha muralla media ficha campo con escudo
/*22*/         ciucame: {nombre:"ciucame", si:"ciudad", sc:"ciudad", sd:"campo",
                                                ci:"ciudad", cc:"ciudad", cd:"campo", ii:"ciudad", ic:"ciudad", id:"campo"}, //ciudad con un lado de campo con escudo
/*23*/         ciucam2e:{nombre:"ciucam2e", si:"campo", sc:"ciudad", sd:"campo",
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
                puede = ColocarLadron(Tablero, cuadrado, zona, X, Y) //Pedro
        }                
        else if (Ciudad.indexOf(zona) != 1){
                puede = ColocarSeguidorCastillo(Tablero, cuadrado, X, Y); //Isra
        }
        else if (Camino.indexOf(zona) != 1){
                puede = PonerSeguidorCamino(Tablero, cuadrado, X, Y); //Alberto
        }        
};

ColocarSeguidorCastillo = function(Tablero, cuadrado, X, Y){
	// Posibles fichas que tengo que comprobar
	//no estoy seguro de que pueda coger los datos de estos arrays. De momento se mantiene
	var FichasLadoCastilloConexos =[
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
		'ciucam2',
		'chmur',
		'chmure',
		'ciucame',
		'ciudad'
	];
	
	var Fichas2LadosCierranCastillo =[
		'mur2',
		'mur2c'
	];
	
	var arr = [];	//Array con todas las direcciones por las que ya hemos pasado
	var constante = 0; //Con esta constante sabremos cuantas fichas hemos investigado en MeteDirec
	var PuedesPonerSeguidor= true;
	var Entrar = 0;
	MeteDirec = function(X, Y){         // Diccionario de las posiciones que ha tenido ese camino, para comprobar si hemos retornado al inicio.
		console.log("Metemos direccion: " + X + "," + Y);
    	var obj = {
			x: X,
			y: Y
		}
		arr.push(obj);
		constante++;
		Entrar = 1;
	};

	//Funcion que nos devuelve si en esa posicion ya hemos estado
	DarDirec = function(X, Y){
		Encontrado = true;
		if (Entrar == 1){
			for (i = 0; i <= constante - 1; i++){
				if (arr[i].x == X && arr[i].y == Y)				
					Encontrado = false;
			}
			return Encontrado;
		}		
		else
			return true;
	};
	
	ComprobarSeguidor = function(Ficha){
		if (fichas2LadosCierranCastillo.indexOf(Ficha.nombre)!=-1){
			if (Ficha.gir==0){
				if (Ficha.nombre=="mur2"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==4)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==6)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
				if (Ficha.nombre=="mur2c"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==2)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==4)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
			}
			if (Ficha.gir==1){
				if (Ficha.nombre=="mur2"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==2)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==8)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
				if (Ficha.nombre=="mur2c"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==6)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==2)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
			}
			if (Ficha.gir==2){
				if (Ficha.nombre=="mur2"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==6)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==4)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
				if (Ficha.nombre=="mur2c"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==8)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==6)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
			}
			if (Ficha.gir==3){
				if (Ficha.nombre=="mur2"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==8)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==2)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
				if (Ficha.nombre=="mur2c"){
					if((Ficha.szona=="ciudad") && (Ficha.scuadrado==4)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else if((Ficha.szona=="ciudad2") && (Ficha.scuadrado==8)){
						PuedesPonerSeguidor= false;
						return PuedesPonerSeguidor;
					}
					else{
						PuedesPonerSeguidor= true;
						return PuedesPonerSeguidor;
					}
				}
			}
		}
		else{
			if (Ficha.szona=="ciudad"){
				PuedesPonerSeguidor= false;
				return PuedesPonerSeguidor;
			}
			else{
				PuedesPonerSeguidor= true;
				return PuedesPonerSeguidor;
			}
		}
	};
	
	 RecursivaSeguidor= function(Ficha, Prohibido,X,Y){
        console.log("                                ");
	    if (Tablero[X][Y]!=0){
	        console.log("LA FICHA: " + Ficha.nombre + " Coordenadas: X= " + X + "||| Y= " + Y);
        	Flag = true;
        	ComprobarSeguidor(Ficha);
		    if (fichasLadoCastilloConexos.indexOf(Ficha.nombre)!=-1){    //si la ficha esta en este array
		        console.log("la ficha "+ Ficha.nombre + " está en el array conexo | CX: " + X + "||| CY: " + Y);
		        console.log("DarDirec es: " + DarDirec(X,Y));
		        if (DarDirec(X,Y)){
		            if ((Ficha.u == "castillo") && (Prohibido != "arriba")){
		                Y1=Y+1;                       
		                MeteDirec(X,Y);
		                //puntos= DarPuntos(puntos, Ficha);
		                RecursivaSeguidor(Tablero[X][Y1],"abajo",X,Y1);
		                Flag = false;
		            }       
		            if ((Ficha.r=="castillo") && (Prohibido!= "derecha")){
		                if (Flag){                       
		                    MeteDirec(X,Y);
		                    //puntos= DarPuntos(puntos, Ficha);
		                }
		                X1=X+1;
		                RecursivaSeguidor(Tablero[X1][Y],"izquierda",X1,Y);
		                Flag = false;
		            }
		            if ((Ficha.d=="castillo") && (Prohibido!= "abajo")){
		                if (Flag){                       
		                    MeteDirec(X,Y);
		                    //puntos= DarPuntos(puntos, Ficha);
		                }
		                Y2=Y-1;
		                RecursivaSeguidor(Tablero[X][Y2],"arriba",X,Y2);
		                Flag = false;
		            }
		            if ((Ficha.l=="castillo") && (Prohibido!= "izquierda")){
		                if (Flag){                   
		                    MeteDirec(X,Y);
		                    //puntos= DarPuntos(puntos, Ficha);
		                }
		                X2=X-1;
		                RecursivaSeguidor(Tablero[X2][Y],"derecha",X2,Y);
		                Flag = false;
		            }
		        }
		    }
		    else if (DarDirec(X,Y)){
		        console.log("la ficha "+ Ficha.nombre + " está en el array inconexo.");
		        //puntos= DarPuntos(puntos, Ficha);;
		        if ((Ficha.scuadrado==8) && (Prohibido=="abajo")){
		        	console.log("no puedes poner seguidor en la ficha porque ya hay un seguidor en " + Ficha.nombre + "en la posicion " + Ficha.scuadrado);
		        	PuedesPonerSeguidor = false;
		        	return PuedesPonerSeguidor;
		        }
		        else if ((Ficha.scuadrado==6) && (Prohibido=="derecha")){
		        	console.log("no puedes poner seguidor en la ficha porque ya hay un seguidor en " + Ficha.nombre + "en la posicion " + Ficha.scuadrado);
		        	PuedesPonerSeguidor = false;
		        	return PuedesPonerSeguidor;
		        }
		        else if ((Ficha.scuadrado==4) && (Prohibido=="izquierda")){
		        	console.log("no puedes poner seguidor en la ficha porque ya hay un seguidor en " + Ficha.nombre + "en la posicion " + Ficha.scuadrado);
		        	PuedesPonerSeguidor = false;
		        	return PuedesPonerSeguidor;
		        }
		        else if ((Ficha.scuadrado==2) && (Prohibido=="arriba")){
		        	console.log("no puedes poner seguidor en la ficha porque ya hay un seguidor en " + Ficha.nombre + "en la posicion " + Ficha.scuadrado);
		        	PuedesPonerSeguidor = false;
		        	return PuedesPonerSeguidor;
		        }
		        MeteDirec(X,Y);
		    }
	    }
	    else{
	        console.log("El tablero está vacío.");
	        //puntos=0;
	    }
    };
   
    //tratamos el caso de que llega una ficha con seguidor
    
    if (Tablero[X][Y].szona=="ciudad" || Tablero[X][Y].szona=="ciudad2"){
		//entramos en el caso de las fichas inconexas
		if (fichas2LadosCierranCastillo.indexOf(Tablero[X][Y].nombre)!=-1){
		    console.log("x e y iniciales "+X+"   "+ Y);
		    if (cuadrado== 0){
		    	console.log("no estas pasando seguidor ya que la posicion del seguidor es: " + cuadrado);
		    }
		    //tengo que ver las 4 posiciones del seguidor
		    else if (cuadrado==2){
		        Y1=Y+1;
		        MeteDirec(X,Y);
		        RecursivaSeguidor(Tablero[X][Y1], "abajo", X, Y1);
		    }
		    else if (cuadrado==6){
		        //console.log("posicion del seguidor es: " + cuadrado);
		        X1=X+1;
		        MeteDirec(X,Y);
		        RecursivaSeguidor(Tablero[X1][Y], "izquierda", X1, Y);
		    }
		    else if (cuadrado==8){
		        //console.log("posicion del seguidor es: " + cuadrado);
		        Y2=Y-1;
		        MeteDirec(X,Y);
		        RecursivaSeguidor(Tablero[X][Y2], "arriba", X, Y2);
		    }
		    else if (cuadrado==4){
		        //console.log("posicion del seguidor es: " + cuadrado);
		        X2=X-1;
		        MeteDirec(X,Y);
		        RecursivaSeguidor(Tablero[X2][Y], "derecha", X2, Y);
		    }
		}
		else{
		    console.log("La ficha inicial es conexa");
		    MeteDirec(X,Y);
		    
		    Flag = true;
		    if (Tablero[X][Y].u=="castillo"){
		        console.log("Entra Arriba");
		        Y1=Y+1;
		        RecursivaSeguidor(Tablero[X][Y1],"abajo",X,Y1);
		        Flag = false;
		    }
		    if (Tablero[X][Y].r=="castillo"){
		        console.log("Entra Derecha");
		        X1=X+1;
		        RecursivaSeguidor(Tablero[X1][Y],"izquierda",X1,Y);
		        Flag = false;
		    }
		    if (Tablero[X][Y].d=="castillo"){
		        console.log("Ficha.nombre: " + Ficha.nombre);
		        console.log("Entra Abajo");
		        Y2=Y-1;           
		        RecursivaSeguidor(Tablero[X][Y2],"arriba",X,Y2);
		        Flag = false;
		    }
		    if (Tablero[X][Y].l=="castillo"){
		        console.log("Entra Izquierda");
		        X2=X-1;
		        RecursivaSeguidor(Tablero[X2][Y],"derecha",X2,Y);
		    }
		   
		}
		PuedesPonerSeguidor= 
    }
    
	
};

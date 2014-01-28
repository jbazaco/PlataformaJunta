/*
//Función para comprobar donde esta el seguidor
PosSeg = function(){
*/

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
		console.log(">>>>>>>>>>>>>>entro en comprobarseguidor<<<<<<<<<<<<<<");
		if (Fichas2LadosCierranCastillo.indexOf(Ficha.nombre)!=-1){
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
		    if (FichasLadoCastilloConexos.indexOf(Ficha.nombre)!=-1){    //si la ficha esta en este array
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
	    }
    };
   
    //tratamos el caso de que llega una ficha con seguidor
    if (Tablero[X][Y].szona=="ciudad" || Tablero[X][Y].szona=="ciudad2"){
		//entramos en el caso de las fichas inconexas
		if (Fichas2LadosCierranCastillo.indexOf(Tablero[X][Y].nombre)!=-1){
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
		        console.log("posicion del seguidor es: " + cuadrado);
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
		return PuedesPonerSeguidor;
    }	
};

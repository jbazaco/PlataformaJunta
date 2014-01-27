/*
//Función para comprobar donde esta el seguidor
PosSeg = function(){



};

ColSeguidor = function(Id, Ficha, PosSeg, x, Y){
	//Aqui buscamos el tablero del que se nos está pidiendo que busquemos si se puede poner seguidor
	Tablero = Tableros[x].id; // Lo hace Alberto que se le da bien
	
	// Para que funcione tenemos que pasar primero la forma de leer los seguidores suya a la nuestra

	//       1
	//    -------
	//  4 |     | 2
	//    |     |
	//    -------
	//       3

	// Primero derivar sabiendo que vamos a tener 3 posibilidades de de posicionar del seguidor
 	if 	(PosSeg == 1)
	 
};
*/

/* Funcion para colocar seguidor en un castillo

	hay que ver si hay otro seguidor de otro jugador ya puesto en ese castillo para decir si se puede poner o no.
	
	Es un esbozo del algoritmo a usar===>>> tengo que hablar con Alberto y Pedro para acabar de concretar
*/
ColocarSeguidorCastillo = function(Id, Ficha, PosSeg, X, Y){
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
	
	 RecursivaSeguidor= function(Ficha, Prohibido,X,Y){
        console.log("                                ");
        if (Tablero[X][Y]!=0){
            console.log("LA FICHA: " + Ficha.nombre + " Coordenadas: X= " + X + "||| Y= " + Y);
            Points = true;
            if (fichasLadoCastilloConexos.indexOf(Ficha.nombre)!=-1){    //si la ficha esta en este array
                console.log("la ficha "+ Ficha.nombre + " está en el array conexo | CX: " + X + "||| CY: " + Y);
                console.log("DarDirec es: " + DarDirec(X,Y));
                if (DarDirec(X,Y)){
                    if ((Ficha.u == "castillo") && (Prohibido != "arriba")){
                        Y1=Y+1;                       
                        MeteDirec(X,Y);
                        //puntos= DarPuntos(puntos, Ficha);
                        RecursivaSeguidor(Tablero[X][Y1],"abajo",X,Y1);
                        Points = false;
                    }       
                    if ((Ficha.r=="castillo") && (Prohibido!= "derecha")){
                        if (Points){                       
                            MeteDirec(X,Y);
                            //puntos= DarPuntos(puntos, Ficha);
                        }
                        X1=X+1;
                        RecursivaSeguidor(Tablero[X1][Y],"izquierda",X1,Y);
                        Points = false;
                    }
                    if ((Ficha.d=="castillo") && (Prohibido!= "abajo")){
                        if (Points){                       
                            MeteDirec(X,Y);
                            //puntos= DarPuntos(puntos, Ficha);
                        }
                        Y2=Y-1;
                        RecursivaSeguidor(Tablero[X][Y2],"arriba",X,Y2);
                        Points = false;
                    }
                    if ((Ficha.l=="castillo") && (Prohibido!= "izquierda")){
                        if (Points){                   
                            MeteDirec(X,Y);
                            //puntos= DarPuntos(puntos, Ficha);
                        }
                        X2=X-1;
                        RecursivaSeguidor(Tablero[X2][Y],"derecha",X2,Y);
                        Points = false;
                    }
                }
            }
            else if (DarDirec(X,Y)){
                console.log("la ficha "+ Ficha.nombre + " está en el array inconexo.");
                //puntos= DarPuntos(puntos, Ficha);;
                MeteDirec(X,Y);               
                //console.log("los puntos intermedios en la ficha inconexa " + Ficha.nombre + " son: " + puntos);
            }
        }
        else{
            console.log("El tablero está vacío.");
            //puntos=0;
        }
    };
   
    //tratamos el caso de que llega una ficha con seguidor
    //entramos en el caso de las fichas inconexas
    if (fichas2LadosCierranCastillo.indexOf(Ficha.nombre)!=-1){
        console.log("x e y iniciales "+X+"   "+ Y);
        //tengo que ver las 4 posiciones del seguidor
        if (PosSeguidor==2){
            Y1=Y+1;
            //puntos= DarPuntos(puntos, Ficha);
            MeteDirec(X,Y);
            RecursivaSeguidor(Tablero[X][Y1], "abajo", X, Y1);
        }
        else if (PosSeguidor==6){
            //console.log("posicion del seguidor es: " + PosSeguidor);
            X1=X+1;
            //puntos= DarPuntos(puntos,Ficha);
            MeteDirec(X,Y);
            RecursivaSeguidor(Tablero[X1][Y], "izquierda", X1, Y);
        }
        else if (PosSeguidor==8){
            //console.log("posicion del seguidor es: " + PosSeguidor);
            Y2=Y-1;
            //puntos= DarPuntos(puntos, Ficha);
            MeteDirec(X,Y);
            RecursivaSeguidor(Tablero[X][Y2], "arriba", X, Y2);
        }
        else if (PosSeguidor==4){
            //console.log("posicion del seguidor es: " + PosSeguidor);
            X2=X-1;
            //puntos= DarPuntos(puntos, Ficha);
            MeteDirec(X,Y);
            RecursivaSeguidor(Tablero[X2][Y], "derecha", X2, Y);
        }
    }
    else{
        console.log("La ficha inicial es conexa");
        MeteDirec(X,Y);
        Points = true;
        if (Ficha.u == "castillo"){
            console.log("Entra Arriba");
            Y1=Y+1;
            //puntos= DarPuntos(puntos, Ficha);
            RecursivaSeguidor(Tablero[X][Y1],"abajo",X,Y1);
            Points = false;
        }
        if ((Ficha.r=="castillo")){
            console.log("Entra Derecha");
            X1=X+1;
            if (Points)
                //puntos= DarPuntos(puntos, Ficha);
            RecursivaSeguidor(Tablero[X1][Y],"izquierda",X1,Y);
            Points = false;
        }
        if ((Ficha.d=="castillo")){
            console.log("Ficha.nombre: " + Ficha.nombre);
            console.log("Entra Abajo");
            Y2=Y-1;
            if (Points)           
                //puntos= DarPuntos(puntos, Ficha);
            RecursivaSeguidor(Tablero[X][Y2],"arriba",X,Y2);
            Points = false;
        }
        if ((Ficha.l=="castillo")){
            console.log("Entra Izquierda");
            X2=X-1;
            if (Points)
                //puntos= DarPuntos(puntos, Ficha);
            RecursivaSeguidor(Tablero[X2][Y],"derecha",X2,Y);
        }
       
    }
	
};

//Desde aquí ejecutamos todo el código.
	EjecutaTotal = function(){
		/*
			////////////////////////////// COMPROBAMOS TABLERO ///////////
			
		var Ficha1 = Aleatorio();
		var Ficha2 = Aleatorio();
		var FichaPrueba = Aleatorio();

		//alert("Ficha1: " + Ficha1.nombre);
		//alert("Ficha2: " + Ficha2.nombre);
		//alert("FichaPrueba: " + FichaPrueba.nombre);
		
			//Creamos tablero
		
		Tablero = CrearTablero();
			//Nos pasan una posición en el tablero mediante los ejes x e y
		x = 0;	
		y = 0;
		
			//Posicionamos ficha		
		Tablero[1][0] = Ficha1;
		Tablero[0][1] = Ficha2;
			//Hago una función para posicionar la ficha en la posición que me pasan		
		var Tablibres = colocarficha(Tablero, FichaPrueba, x, y);
		//alert(Tablibres);
		*/
			//////////////////////////////////////////////////////////////
		
			////////////////////////PRUEBA CON FICHA DADA//////
		/*
		Tablero = CrearTablero();
		x = 0;	
		y = 0;
	
		var FichaP1 = Prueba(3);
		var FichaP2 = Prueba(9);
		var FichaPrueba = Prueba(0);
		alert("FichaP1: " + FichaP1.nombre);
		alert("FichaP2: " + FichaP2.nombre);
		alert("FichaPrueba: " + FichaPrueba.nombre);
		Tablero[1][0] = FichaP1;
		Tablero[0][1] = FichaP2;
		alert("Empezamos prueba");
		var Tablibres = colocarficha(Tablero, FichaPrueba, x, y);
		alert("u: " + FichaPrueba.u + "r: " + FichaPrueba.r + "d: " + FichaPrueba.d + "l: " + FichaPrueba.l);		
		FichaPrueba.gir = 2;		
		FichaPrueba = GirarFicha(FichaPrueba);
		alert("u: " + FichaPrueba.u + "r: " + FichaPrueba.r + "d: " + FichaPrueba.d + "l: " + FichaPrueba.l);
		alert(Tablibres);
		alert("Terminamos Prueba");
		*/
			///////////////////////////////////////////////////
		
		///////////PROBAMOS CIERRACAMINO //////////
		
			//Creamos Tablero
		/*Tablero = CrearTablero();
			//Asignamos unas determinadas fichas para ver si funciona la función y cuenta los puntos correctamente.
			//Preguntar porqué aquí si igualo diferentes fichas
		var Ficha1 = Prueba(15); //ccmur
		Ficha1.gir = 1;
		Ficha1 = GirarFicha(Ficha1);
		Tablero[0][0] = Ficha1;


		var Ficha2 = Prueba(16); //ccmur3
		Ficha2.gir = 1;
		Ficha2 = GirarFicha(Ficha2);
		Tablero[1][0] = Ficha2;
		
		var Ficha3 = Prueba(6); //cc [girar1]
		Ficha3.gir = 3;	
		Ficha3 = GirarFicha(Ficha3);
		Tablero[1][1] = Ficha3;
	
		var Ficha4 = Prueba(18); //ccmur2 [girar3]
		Ficha4 = GirarFicha(Ficha4);
		
			//Le pasamos a la funcion la ficha donde este el seguidor y en que posición determinada está. 
		var Num = 1;
		var X = 0;
		var Y = 1; 		
		var PuntosCamino = CuentaPCamino(Tablero, Ficha4, Num, X, Y);
		alert("Puntos que tengo: " + PuntosCamino);*/

		////////////////////////////////////////////
		////////////////////////////////////////////
		////////////////////////////////////////////	

		///////Compruebo el CierraClaustro//////////

		/*Tablero = CrearTablero();

		//asigno posicion a varias fichas
		var Ficha1 = Prueba(10);    //ciucam
		Tablero[1][2] = Ficha1;

		var Ficha2 = Prueba(12);	//mur2c
		Tablero[2][2] = Ficha1;

		var Ficha3 = Prueba(14);	//cmur
		Tablero[2][4] = Ficha1;


		var X = 2;
		var Y = 3;
		var puntosclaustro = CierraClaustro(Tablero,X,Y);
		alert("los puntos del claustro son: " + puntosclaustro);

		////////////////////////////////////////////
		////////////////////////////////////////////
		////////////////////////////////////////////
		*/
		
		/////////TESTEAR CIERRACASTILLO/////////
		
		Tablero= CrearTablero();
		var Ficha1= Prueba(2);	//mur2
		Tablero[1][1]= Ficha1;
		
		var Ficha2 = Prueba(13);	//mur1
		Tablero[2][1] = Ficha2;
		
		//var Ficha3 = Prueba(17);	//ciucam2 
		//Tablero[2][1]
		var puntoscastillo = CierraCastillo(Tablero, Ficha1, 2, 1, 1);
	};



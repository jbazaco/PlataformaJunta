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
		/*
			//Creamos Tablero
		Tablero = CrearTablero();
			//Asignamos unas determinadas fichas para ver si funciona la función y cuenta los puntos correctamente.
		var Ficha1 = Prueba();
		var Ficha2 = Prueba();
		var Ficha3 = Prueba();
		var Ficha4 = Prueba();
		var Ficha5 = Prueba();
		var Ficha6 = Prueba();
		var Ficha7 = Prueba();
		var Ficha8 = Prueba();
			//Colocamos las Fichas
		Tablero[][] = Ficha1;
		Tablero[][] = Ficha2;
		Tablero[][] = Ficha3;
		Tablero[][] = Ficha4;
		Tablero[][] = Ficha5;
		Tablero[][] = Ficha6;
		Tablero[][] = Ficha7;
		Tablero[][] = Ficha8;
			//Le pasamos a la funcion la ficha donde este el seguidor y en que posición determinada está. 		
		var PuntosCamino = CuentaPCamino(Tablero, Ficha, Num, X, Y);
		////////////////////////////////////////////	
		*/
	};

$(EjecutaTotal);



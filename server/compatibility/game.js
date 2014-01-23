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
			//Preguntar porqué aquí si igualo diferentes fichas
		console.log("Ficha1");
		var Ficha1 = Prueba(6); //cc [gira 1] 
		Ficha1.gir = 1;
		Ficha1 = GirarFicha(Ficha1);
		Tablero[1][1] = Ficha1;

		console.log("Ficha2");
		var Ficha2 = Prueba(7); //cr [gira 0]
		Tablero[2][1] = Ficha2;

		console.log("Ficha3");
		var Ficha3 = Prueba(6); //cc [gira 2] De momento 3
		Ficha3.gir = 2;
		Ficha3 = GirarFicha(Ficha3);
		Tablero[3][1] = Ficha3;

		console.log("Ficha4");
		var Ficha4 = Prueba(8); //c3 [gira 0]
		Tablero[1][2] = Ficha4;

		console.log("Ficha5");
		var Ficha5 = Prueba(7); //cr [gira 0]
		Tablero[2][2] = Ficha5;
	
		console.log("Ficha6");	
		var Ficha6 = Prueba(5); //c4 [gira 0]
		Tablero[3][2] = Ficha6;
		
			//Le pasamos a la funcion la ficha donde este el seguidor y en que posición determinada está. 
		var Num = 3;
		var X = 3;
		var Y = 1; 		
		var PuntosCamino = CuentaPCamino(Tablero, Ficha3, Num, X, Y);
		console.log("Los puntos de este camino son: " + PuntosCamino);
		*/
		////////////////////////////////////////////



		///////Compruebo el CierraClaustro//////////
		/*
		Tablero = CrearTablero();

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
		*/
		////////////////////////////////////////////
		
		
	};



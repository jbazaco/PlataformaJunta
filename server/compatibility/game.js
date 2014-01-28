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
=======

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
		
		/////////TESTEAR CIERRACASTILLO/////////
		
		//Tablero= CrearTablero();
		
		/*var Ficha1= Prueba(2);	//mur2
		Tablero[1][1]= Ficha1;
		
		var Ficha2 = Prueba(23);	//ciucam2e
		Ficha2.gir= 1;
		Ficha2 = GirarFicha(Ficha2);
		Tablero[3][1] = Ficha2;
		
		var Ficha3 = Prueba(17);	//ciucam2
		Ficha3.gir= 1;
		Ficha3 = GirarFicha(Ficha3);
		Tablero[2][1] = Ficha3;
		
		var Ficha4 = Prueba(13);	//mur1 
		Tablero[4][1]= Ficha4;
		*/
		
		
		/*var Ficha11 = Prueba(0);	//murcam
		Ficha11.gir= 3;
		Ficha11 = GirarFicha(Ficha11);
		Tablero[1][1]= Ficha11;
		
		var Ficha21 = Prueba(10);	//ciucam
		Ficha21.gir= 3;
		Ficha21 = GirarFicha(Ficha21);
		Tablero[2][1]= Ficha21;
		
		var Ficha31 = Prueba(12); //mur2c
		Ficha31.gir= 3;
		Ficha31 = GirarFicha(Ficha31);
		Tablero[3][1]= Ficha31;
		
		var Ficha12 = Prueba(18);	//ccmur2 
		Ficha12.gir= 2;
		Ficha12 = GirarFicha(Ficha12);
		Tablero[1][2]= Ficha12;
		
		var Ficha22 = Prueba(10);	//ciucam 
		Ficha22.gir= 1;
		Ficha22 = GirarFicha(Ficha22);
		Tablero[2][2]= Ficha22;
		
		var Ficha32 = Prueba(0);	//murcam 
		Ficha32.gir= 1;
		Ficha32 = GirarFicha(Ficha32);
		Tablero[3][2]= Ficha32;

		/*
		//caso base
		var Ficha1 = Prueba(13); //mur1
		Ficha1.gir= 2;
		Ficha1 = GirarFicha(Ficha1);
		Tablero[1][1]= Ficha1;
		
		var Ficha2 = Prueba(13); //mur1
		Tablero[2][1]= Ficha1;
		*/
		
		/*var Ficha1 = Prueba(0);
		Tablero[2][1] = Ficha1;
		
		var Ficha2 = Prueba(2);
		Tablero[1][1] = Ficha2;
		
		var Ficha3 = Prueba(14);
		Ficha3.gir= 1;
		Ficha3 = GirarFicha(Ficha3);
		Tablero[2][2]= Ficha3;
		*/
		/*var Ficha1 = Prueba(13);
		Ficha1.gir= 2;
		Ficha1 = GirarFicha(Ficha1);
		Tablero[1][1]= Ficha1;
		
		var Ficha4 = Prueba(13);
		Ficha4.gir= 1;
		Ficha4 = GirarFicha(Ficha4);
		Tablero[2][2]= Ficha4;
		
		var Ficha2 = Prueba(19);
		Ficha2.gir= 3;
		Ficha2 = GirarFicha(Ficha2);
		Tablero[2][1]= Ficha2;
		
		var Ficha3 = Prueba(13);
		Tablero[3][1]= Ficha3;
		*/
		
		//var puntoscastillo = CierraCastillo(Tablero, Ficha11, 2, 1, 1);
		//console.log("la puntuacion total es: " + puntoscastillo);
		
		/*
		var Ficha0 = Prueba(10);	//ciucam
		Ficha0.gir = 3;
		Ficha0 = GirarFicha(Ficha0);
		console.log("con giro 3 >>>>>>>> " + "arriba: " + Ficha0.u + "|| derecha: " + Ficha0.r + " ||abajo: " + Ficha0.d + " ||izquierda: " + Ficha0.l);
		*/
		
		
		/*var Ficha0 = Prueba(0);	//murcam
		Ficha0.gir= 0;
		Ficha0 = GirarFicha(Ficha0);
		console.log("sin giro>>>>>> " + "arriba: " + Ficha0.u + "|| derecha: " + Ficha0.r + " ||abajo: " + Ficha0.d + " ||izquierda: " + Ficha0.l);
		
		var Ficha1 = Prueba(0);	//murcam
		Ficha1.gir= 1;
		Ficha1 = GirarFicha(Ficha1);
		console.log("con giro 1 >>>>>>>> " + "arriba: " + Ficha1.u + "|| derecha: " + Ficha1.r + " ||abajo: " + Ficha1.d + " ||izquierda: " + Ficha1.l);
		*/
		/*var Ficha0 = Prueba(0);	//murcam
		Ficha0.gir = 0;
		Ficha0 = GirarFicha(Ficha0);
		console.log("con giro 0 >>>>>>>> " + "arriba: " + Ficha0.u + "|| derecha: " + Ficha0.r + " ||abajo: " + Ficha0.d + " ||izquierda: " + Ficha0.l);
		
		var Ficha1 = Prueba(0);	//murcam
		Ficha1.gir = 1;
		Ficha1 = GirarFicha(Ficha1);
		console.log("con giro 1 >>>>>>>> " + "arriba: " + Ficha1.u + "|| derecha: " + Ficha1.r + " ||abajo: " + Ficha1.d + " ||izquierda: " + Ficha1.l);
		
		var Ficha2 = Prueba(0);	//murcam
		Ficha2.gir = 2;
		Ficha2 = GirarFicha(Ficha2);
		console.log("con giro 2 >>>>>>>> " + "arriba: " + Ficha2.u + "|| derecha: " + Ficha2.r + " ||abajo: " + Ficha2.d + " ||izquierda: " + Ficha2.l);
		
		var Ficha3 = Prueba(0);	//murcam
		Ficha3.gir = 3;
		Ficha3 = GirarFicha(Ficha3);
		console.log("con giro 3 >>>>>>>> " + "arriba: " + Ficha3.u + "|| derecha: " + Ficha3.r + " ||abajo: " + Ficha3.d + " ||izquierda: " + Ficha3.l);
		*/

		// ===================

		// Prueba del Poner Seguidor en camino


		console.log("prueba seguidor camino (1)");

		/*var Ficha1 = Prueba(7)   									//camino recto  cr
		console.log("la primera ficha es:  " + Ficha1.nombre); 
		Ficha1.gir = 0;
		Ficha1.nomjug = "jug1";
		Ficha1.scuadrado = 0;
		Ficha1.szona = "nada";

		var Ficha2 = Prueba(6);  								 	//camino curvo girado dos a la derecha  cc
		console.log("la segunda ficha es:  " + Ficha2.nombre); 
		//console.log("lo que hay arriba de la ficha es: " + Ficha2.u);
		//console.log("lo que hay dcha de la ficha es: " + Ficha2.r);
		//console.log("lo que hay abajo de la ficha es: " + Ficha2.l);
		//console.log("lo que hay izq de la ficha es: " + Ficha2.d);
		Ficha2.gir = 2;
		Ficha2.nomjug = "jug1";
		Ficha2.scuadrado = 0;
		Ficha2.szona = "nada";
		GirarFicha(Ficha2);

		var Ficha3 = Prueba(6);  									//camino curvo   cc
		console.log("la tercera ficha es:  " + Ficha3.nombre); 
		Ficha3.gir = 0;
		Ficha3.nomjug = "jug1";
		Ficha3.scuadrado = 0;
		Ficha3.szona = "nada";

		var Ficha4 = Prueba(4);  									//monasterio girado dos veces     mc
		console.log("la cuarta ficha es:  " + Ficha4.nombre); 
		Ficha4.gir = 2;
		Ficha4.nomjug = "jug1";
		Ficha4.scuadrado = 0;
		Ficha4.szona = "nada";
		GirarFicha(Ficha4);

		var Ficha5 = Prueba(6);  									//camino girado uno   cc
		console.log("la quinta ficha es:  " + Ficha5.nombre); 
		Ficha5.gir = 1;
		Ficha5.nomjug = "jug1";
		Ficha5.scuadrado = 0;
		Ficha5.szona = "nada";
		GirarFicha(Ficha5);

		var Ficha6 = Prueba(8);  									//cruce de tres caminos     c3
		console.log("la sexta ficha es:  " + Ficha6.nombre); 
		Ficha6.gir = 3;
		Ficha6.nomjug = "jug1";
		Ficha6.scuadrado = 0;
		Ficha6.szona = "nada";
		GirarFicha(Ficha6);




		/*var Ficha1 = Prueba(8)   									//camino tres camino     c3
		console.log("la primera ficha es:  " + Ficha1.nombre); 
		Ficha1.gir = 0;
		Ficha1.nomjug = "jug1";
		Ficha1.scuadrado = 0;
		Ficha1.szona = "nada";

		var Ficha2 = Prueba(7)   									//camino recto  cr
		console.log("la segunda ficha es:  " + Ficha2.nombre); 
		Ficha2.gir = 0;
		Ficha2.nomjug = "jug1";
		Ficha2.scuadrado = 0;
		Ficha2.szona = "nada";

		var Ficha3 = Prueba(6)   									//camino curva girado dos    cc
		console.log("la primera ficha es:  " + Ficha3.nombre); 
		Ficha3.gir = 2;
		Ficha3.nomjug = "jug1";
		Ficha3.scuadrado = 0;
		Ficha3.szona = "nada";
		GirarFicha(Ficha3);

		var Ficha4 = Prueba(5)   									//cruce de cuatro caminos c4
		console.log("la primera ficha es:  " + Ficha4.nombre); 
		Ficha4.gir = 0;
		Ficha4.nomjug = "jug1";
		Ficha4.scuadrado = 0;
		Ficha4.szona = "nada";*/



		/*var Ficha1 = Prueba(4);  									//monasterio girado dos veces     mc
		console.log("la cuarta ficha es:  " + Ficha1.nombre); 
		Ficha1.gir = 2;
		Ficha1.nomjug = "jug1";
		Ficha1.scuadrado = 0;
		Ficha1.szona = "nada";

		var Ficha2 = Prueba(7)   									//camino recto  cr
		console.log("la segunda ficha es:  " + Ficha2.nombre); 
		Ficha2.gir = 0;
		Ficha2.nomjug = "jug1";
		Ficha2.scuadrado = 0;
		Ficha2.szona = "nada";
		
		var Ficha3 = Prueba(5)   									//cruce de cuatro caminos c4
		console.log("la primera ficha es:  " + Ficha3.nombre); 
		Ficha3.gir = 0;
		Ficha3.nomjug = "jug1";
		Ficha3.scuadrado = 4;
		Ficha3.szona = "nada";*/

		/*Tablero = CrearTablero();

		Tablero[10][10] = Ficha1;
		Tablero[9][10] = Ficha5;
		Tablero[9][9] = Ficha6;
		Tablero[11][10] = Ficha2;
		Tablero[11][9] = Ficha3;
		Tablero[12][9] = Ficha4;


		/*Tablero[10][10] = Ficha1;
		Tablero[11][10] = Ficha2;
		Tablero[12][10] = Ficha3;*/


 		//console.log("pruebaaa");
		
		//valor = PonerSeguidorCamino(Tablero,6,10,10)
		
		//console.log("¿se puede poder seguidor ahi? --> " + valor);



		//==================================







	};



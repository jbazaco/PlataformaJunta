//Desde aquí ejecutamos todo el código.
	EjecutaTotal = function(){
		
		Tablero= CrearTablero();
		
		/*var Ficha1 =PruebaItera("mur2", 0);
		Ficha1.szona="ciudad2";
		Ficha1.scuadrado=6;
		Tablero[1][1]= Ficha1;
		*/
		var Ficha1 =PruebaItera("ciucam2", 0);
		Ficha1.szona="ciudad";
		Ficha1.scuadrado=4;
		Tablero[1][1]= Ficha1;
		
		var Ficha2 =PruebaItera("ciucam2", 90);
		Tablero[2][1]= Ficha2;
		
		
		console.log(Tablero[1][1]);
		console.log("                      ");
		console.log(Tablero[2][1]);
		//var resultado= ColocarSeguidorCastillo(Tablero, 6, 1, 1);
		//console.log("¿Puedo poner el seguidor? >>>>>> " + resultado);
	};



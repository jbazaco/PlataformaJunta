//Desde aquí ejecutamos todo el código.
	EjecutaTotal = function(){
		var Ficha1 = Aleatorio();
		var Ficha2 = Aleatorio();
		var FichaPrueba = Aleatorio();

		//Comparar(Ficha1, Ficha2);
		alert("Ficha1: " + Ficha1.nombre);
		alert("Ficha2: " + Ficha2.nombre);
		alert("FichaPrueba: " + FichaPrueba.nombre);
		//Creamos tablero
		Tablero = CrearTablero();
		//Posicionamos ficha		
		Tablero[36][36] = Ficha1;
		Tablero[37][35] = Ficha2;
		//Nos pasan una posición en el tablero mediante los ejes x e y
		x = 37;	
		y = 36;
		//Hago una función para posicionar la ficha en la posición que me pasan		
		var Tablibres = colocarficha(Tablero, FichaPrueba, x, y);
		alert(Tablibres);
	};

$(function() {
	EjecutaTotal();
});

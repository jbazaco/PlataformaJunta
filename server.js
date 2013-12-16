/*******************************************************************************
*  Defines functions that can be invoked over the network by clients.
*/




/*******************************************************************************
*  Defines functions that can be invoked over the network by clients.
*
*/


Meteor.methods({

	devolverficha = function(){	//habría que definir una coleccion de fichas que es de donde hay que devolver?? definida en models.js
		return aleatorio;
	}

	colocarficha = function(x,y,ficha){  //función que devuelve un array de las posiciones donde se puede poner la ficha que nos pasan,
										  //en las coordenadas que también nos pasan
		return posiciones{} ;
	}
	
	colocarseguidor = function(ficha, campoficha, rotacion, posicionficha){
	return Boolean;	//funcion que devuelve si se puede poner un seguidor en la posicion de la ficha correspondiente.
	}

});
	

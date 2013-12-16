/*******************************************************************************
*  Defines functions that can be invoked over the network by clients.
*/

Meteor.methods({

	devolverficha = function(){	//Definida en models.js
		return aleatorio;
	}

	colocarficha = function(x,y,ficha){  // Dado una ficha y dos posiciones, se devuelve un booleano para si se puede o no colocar esa ficha
										 
		return Boolean ;
	}
	
	colocarseguidor = function(ficha, campoficha, rotacion, x, y){
		
	return Boolean;	//funcion que devuelve si se puede poner un seguidor en la posicion de la ficha correspondiente.
	}

});
	

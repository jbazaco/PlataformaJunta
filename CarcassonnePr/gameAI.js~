function startGame() {
    
    // Sin jQuery obtendríamos así el canvas: var canvas =
    // document.getElementById('game'); 
    // Usamos jQuery: el elemento del DOM, necesario para obtener el
    // contexto del canvas, está accesible en la propiedad 0 del
    // elemento jQuery:
    var canvas = $('#game')[0];

    // El contexto del canvas es el objeto sobre el cual se aplican
    // las llamadas de la API. Lo obtenemos a partir del canvas:
    var ctx = canvas.getContext && canvas.getContext('2d');

    if(!ctx) {
		// Si no hay contexto 2d informamos al usuario
		alert('Please upgrade your browser');
		return;
    }
    
    // Dibujar rectangulo azul
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(50,100,380,400);

    // Dibujar rectangulo azul semitransparente 
    ctx.fillStyle = "rgba(0,0,128,0.8)";
    ctx.fillRect(25,50,380,400);

    // Cargar la hoja de sprites de images/sprites.png 
    var img = new Image();
    // Cuando el fichero asignado a img.src mas abajo haya sido
    // cargado, se ejecutara esta callback:
    img.onload = function() {
		// Dibuja toda la hoja de sprites en el destino dx dy
		//                dx  dy
		ctx.drawImage(img,100,100);

		// Escala a dWidth dHeight la hoja de sprites, y la dibuja en dx dy
		//                    dx dy   dWidth dHeight
		ctx.drawImage(img,    0, 250, 300,   100);

		// Coge de la hoja de sprites el rectangulo
        // sx,sy,sWidth,sHeight y lo coloca en dx,dy escalado a dWidth
        // y dHeight
        //                sx sy sWidth sHeight dx   dy   dWidth dHeight
		ctx.drawImage(img,0, 0, 37,    42,     200, 400, 37,    42);
    }

    // Comienza a cargar asincronamente el fichero que contiene la
    // hoja de sprites Cuando se cargue, llamaran a img.onload
    img.src = 'images/sprites.png';

}


$(startGame);


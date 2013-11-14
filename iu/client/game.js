function startGame() {
    
   
    var canvas = $('#tablero')[0];

    
    var ctx = canvas.getContext && canvas.getContext('2d');

    if(!ctx) {
	// Si no hay contexto 2d informamos al usuario
	alert('Please upgrade your browser');
	return;
    }
    
    // Dibujar rectangulo azul
    ctx.fillStyle = "#44cbff";
    ctx.fillRect(50,50,850,650);

    ctx.fillStyle = "#c9c9c9";
    ctx.fillRect(900,50,20,650);

    ctx.fillStyle = "#000000";
    ctx.fillRect(920,50,200,650);
}
$(startGame);

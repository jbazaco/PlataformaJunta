
//       1
//    -------
//  4 |     | 2
//    |     |
//    -------
//       3

/*
seguidores

            1   2   3
        12    ---------  4
            |        |
        11    |        |  5
            |        |
        10    ---------  6
            9    8    7
variable seguid = posicion del seguidor dentro de la ficha entre las 12 posibles.
*/

var CASTILLO = 'castillo';
var CAMINO = 'camino';
var CAMPO = 'campo';

var FichaPropiedades = {
/*0*/        murcam:  {nombre:"murcam", u:CAMPO,    r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},        //media ficha muralla media ficha campo
/*1*/        c3mur:      {nombre:"c3mur", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CASTILLO, gir: 0},         //cruce de 3 caminos con muralla al lado
/*2*/        mur2:      {nombre:"mur2", u:CAMPO,    r:CASTILLO, d:CAMPO,    l:CASTILLO, gir: 0},          //una muralla a cada lado de la ficha
/*3*/        m:          {nombre:"m", u: CAMPO,   r:CAMPO,    d:CAMPO,    l:CAMPO , gir: 0},               //monasterio
/*4*/          mc:      {nombre:"mc", u:CAMPO,    r:CAMINO,   d:CAMPO,    l:CAMPO, gir: 0},               //monasterio con camino
/*5*/        c4:      {nombre:"c4", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CAMINO, gir: 0},              //cruce de 4 caminos
/*6*/        cc:      {nombre:"cc", u:CAMINO,   r:CAMINO,   d:CAMPO,    l:CAMPO, gir: 0},               //camino curva
/*7*/         cr:      {nombre:"cr", u:CAMPO,    r:CAMINO,   d:CAMPO,    l:CAMINO, gir: 0},              //camino recto
/*8*/         c3:      {nombre:"c3", u:CAMINO,   r:CAMINO,   d:CAMINO,   l:CAMPO, gir: 0},               //cruce de 3 caminos
/*9*/        ciudad:  {nombre:"ciudad", u:CASTILLO, r:CASTILLO, d:CASTILLO, l:CASTILLO, gir: 0},        //todo ciudad con escudo
/*10*/        ciucam:  {nombre:"ciucam", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},        //ciudad con un lado de campo
/*11*/        chmur:      {nombre:"chmur", u:CASTILLO, r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0},          //camino hacia muralla
/*12*/        mur2c:      {nombre:"mur2c", u:CASTILLO, r:CAMPO,    d:CAMPO,    l:CASTILLO, gir: 0},         //2 murallas en lados contiguos
/*13*/        mur1:      {nombre:"mur1", u:CAMPO,    r:CAMPO,    d:CAMPO,    l:CASTILLO, gir: 0},          //1 muralla en un lado y el resto campo
/*14*/        cmur:      {nombre:"cmur", u:CAMINO,   r:CAMPO,    d:CAMINO,   l:CASTILLO, gir: 0},          //camino recto con muralla al lado(ini)
/*15*/         ccmur:      {nombre:"ccmur", u:CAMINO,   r:CAMINO,   d:CAMPO,    l:CASTILLO, gir: 0},         //camino con curva y con muralla al lado
/*16*/        ccmur3:  {nombre:"ccmur3", u:CAMPO,    r:CAMINO,   d:CAMINO,   l:CASTILLO, gir: 0},        //camino con curva y muralla al lado(otro)
/*17*/        ciucam2: {nombre:"ciucam2", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CAMPO, gir: 0},          //ciudad con 2 lados opuestos de campo
/*18*/        ccmur2:  {nombre:"ccmur2", u:CAMINO,   r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0},            //camino con curva con 2 lados de ciudad contiguos
/*19*/         chmure:  {nombre:"chmure", u:CASTILLO, r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0},        //camino hacia muralla con escudo
/*20*/      ccmur2e: {nombre:"ccmur2e", u:CAMINO,   r:CAMINO,   d:CASTILLO, l:CASTILLO, gir: 0},       //camino con curva con 2 lados de ciudad,escudo
/*21*/      murcame: {nombre:"murcame", u:CAMPO,    r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},       //media ficha muralla media ficha campo con escudo
/*22*/      ciucame: {nombre:"ciucame", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CASTILLO, gir: 0},       //ciudad con un lado de campo con escudo
/*23*/      ciucam2e:{nombre:"ciucam2e", u:CASTILLO, r:CAMPO,    d:CASTILLO, l:CAMPO, gir: 0}          //ciudad 2 lados opuestos campo con escudo
};

ArFi = _.toArray(FichaPropiedades); //Convertimos lo que tenemos en un Array para poder tratarlo

var Tableros = []; //Array de [ID | Tablero correspondiente a ese ID]

var ParJugadas = [];

ContadorJugadas = 0;
CuentaTableros = 0;

Aleatorio = function(){
    var decision = false
    var a = Math.floor(Math.random()*24);
    var Ficha = {
        nombre: "nada"
    };
    Ficha.nombre = ArFi[a].nombre;
    if (decision = false)
        decision = true;
    else
        decision
    return Ficha;
}

//Funcion de prueba para comprobar fichas dada una posicion A (int)
Prueba = function(A){
    var Ficha = {
        nombre: "nada",
        u: CAMINO,
        r: CAMINO,
        d: CAMINO,
        l: CAMINO,
        gir:0
    };
    Ficha.nombre = ArFi[A].nombre;
    Ficha.u = ArFi[A].u;
    Ficha.r = ArFi[A].r;
    Ficha.d = ArFi[A].d;
    Ficha.l = ArFi[A].l;
    return Ficha;
};

//Funcion que a través de la ficha que se nos da en la llamada ColocaFicha sacamos ficha y rotacion
PruebaItera = function(Ficha,rotacion){
    var FichaDev = {
        nombre: "nada",
        u: CAMINO,
        r: CAMINO,
        d: CAMINO,
        l: CAMINO,
        gir:0,
        nomjug:"nada",
        scuadrado: 0,
        szona: "nada"
    };
    for(i = 0; i < 24; i++){
        if (ArFi[i].nombre == Ficha){
            FichaDev.nombre = ArFi[i].nombre;
            FichaDev.u = ArFi[i].u;
            FichaDev.r = ArFi[i].r;
            FichaDev.d = ArFi[i].d;
            FichaDev.l = ArFi[i].l;
            //console.log("Rotacion: " + rotacion); //Comprobamos la rotación que se nos pasa
            if (rotacion == 0)
                FichaDev.gir = 0;
            if (rotacion == 90)
                FichaDev.gir = 1;
            if (rotacion == 180)   
                FichaDev.gir = 2;
            if (rotacion == 270)
                FichaDev.gir = 3;
            //console.log("AGF FichaDev.u: " + FichaDev.u + " FichaDev.r: " + FichaDev.r + " FichaDev.d: " + FichaDev.d + " FichaDev.l: " + FichaDev.l);
            return FichaDev;
        }
    }
};


//Girar Ficha a partir del campo Ficha.gir
GirarFicha = function(Ficha){
    var aux = 0;
    var gira = Ficha.gir;
    //console.log("giro inicial de: " + Ficha.gir);
    while (Ficha.gir != 0){
        aux = Ficha.l;
        Ficha.l = Ficha.d;
        Ficha.d = Ficha.r;
        Ficha.r = Ficha.u;
        Ficha.u = aux;
        Ficha.gir = Ficha.gir - 1;
    }
    Ficha.gir = gira; //Con esto lo que hago es recordar como de girada esta la ficha ya estando girada
    return Ficha;
};
   
//Creamos tablero multidimensional
CrearTablero = function(){
    var iMax = 50;
    f = new Array();

    for(i = -iMax; i < iMax ; i++){
        f[i] = new Array();
        for(j = -iMax; j < iMax ; j++){
            f[i][j] = 0;
        }
    }
    return f;
};


// Lista de Tableros es una funcion que recoge el identificador de una partida y un Tablero que se
// le pase y los mete en un array.

//PRIMERA FUNCION: AUTORUN PARTIDAS
CrearArJug = function(id){
    var Tablero = CrearTablero();
    Tablero[0][0] = Prueba(14);

    ContadorJugadas = ContadorJugadas + 1;;
    //console.log("CrearArJug(1) ContadorJugadas: " + ContadorJugadas);

    //console.log("--------");
    //console.log("CrearArJug: " + ParJugadas[0].id);
    //console.log("--------");

    var partida = {
        id: id,
        Tablero: Tablero
    }
    //console.log("CREAMOS TABLERO DE PARTIDA");
    Tableros.push(partida);
    CuentaTableros++; 
    //console.log("CrearArJug(2) CuentaTableros: " + CuentaTableros);
}

//SEGUNDA FUNCIÓN AUTORUN JUGADAS
//función añadir jugada nueva en tablero
CrearTabJug = function(id, x, y, ficha, rota, user, cuadrado, zona){
    Ficha1 = PruebaItera(ficha,rota);
    Ficha1.nomjug = user;
    Ficha1.scuadrado = cuadrado;
    Ficha1.szona = zona;
    //console.log("COMPROBACION GENERAL DE COMO INSERTO LA FICHA EN TABLERO");
    //console.log("AGF Ficha1.u: " + Ficha1.u + " Ficha1.r: " + Ficha1.r + " Ficha1.d: " + Ficha1.d + " Ficha1.l: " + Ficha1.l + "Ficha.gir" + Ficha1.gir);
    Ficha1 = GirarFicha(Ficha1);
    //console.log("AGF Ficha1.u: " + Ficha1.u + " Ficha1.r: " + Ficha1.r + " Ficha1.d: " + Ficha1.d + " Ficha1.l: " + Ficha1.l + "Ficha.gir" + Ficha1.gir);
    for(i=0; i<= CuentaTableros - 1;i++){
        if (Tableros[i].id == id){
            //console.log("INSERTA FICHA EN TABLERO");
            //console.log("CrearTabJug(1). Tableros[i].id: " + Tableros[i].id + " id: " + id);
            Tableros[i].Tablero[x][y] = Ficha1;   
        }
    }
};


RegMov = function(id, jugador, m){
    CrearTabJug(id, m.x, m.y, m.sprite, m.rotacion, m.user, m.scuadrado, m.szona);
}

//Procedimiento que mira las posiciones del tablero para ver si se puede colocar la ficha
//Terminología: U: Up, R:Right, D: Down, L:Left.
colocarficha = function(id_part, Ficha, X, Y, rotacion){
        //console.log("                                           ");
        //console.log("                   JUGADA NUEVA            ");
        //console.log("MIRANDO ROTACION");
        //console.log("Rotacion que nos pasan: " + rotacion);
        Ficha = PruebaItera(Ficha,rotacion);
        //console.log("Gira que tenemos: " + Ficha.gir);
        Ficha = GirarFicha(Ficha);
        //console.log("Gira que tenemos: " + Ficha.gir);
       
        var encontrado = false;
        var colocado = true;
  
        for(i=0; i<= CuentaTableros - 1;i++){
            if(Tableros[i].id == id_part){
                Tablero = Tableros[i].Tablero;
            }
        }

        //console.log("Pos X: " + X + " Pos Y: " + Y);       
        if (Tablero[X][Y] == 0){
            //if ((X != 0 && Y != 0) || (X != 72 && Y != 0) || (Y != 0)){ //En cada una comprobamos las esquinas y los bordes(L-U,U,R-A)
            if (Tablero[X][(Y+1)] != 0){//Arriba
                console.log("----------------------------------------------------------------------------");
                console.log("Tablero[X][(Y+1)].u: " + Tablero[X][(Y+1)].u + " Tablero[X][(Y+1)].r: " + Tablero[X][(Y+1)].r);
                console.log("Tablero[X][(Y+1)].d: " + Tablero[X][(Y+1)].d + " Tablero[X][(Y+1)].l: " + Tablero[X][(Y+1)].l);
                console.log("----------------------------------------------------------------------------");
                if (Tablero[X][(Y+1)].d != Ficha.u){
                    console.log(Tablero[X][(Y+1)].d + "  " + Ficha.u);
                    console.log("ColocarFicha(en el for): colocado es------------->: " + encontrado );
                    colocado = false;
                }
            }
            //if ((X != 72 && Y != 0) || (X != 72 && Y != 72) || (X != 0)){// (R-U,R,R-D)
            if (Tablero[(X+1)][Y] != 0){//Derecha
                console.log("----------------------------------------------------------------------------");
                console.log("Tablero[(X+1)][Y].u: " + Tablero[(X+1)][Y].u + " Tablero[(X+1)][Y].r: " + Tablero[(X+1)][Y].r);
                console.log("Tablero[(X+1)][Y].d: " + Tablero[(X+1)][Y].d + " Tablero[(X+1)][Y].l: " + Tablero[(X+1)][Y].l);
                console.log("----------------------------------------------------------------------------");
                if (Tablero[(X+1)][Y].l != Ficha.r){
                    console.log(Tablero[(X+1)][Y].l + "  " + Ficha.r);
                    console.log("ColocarFicha(en el for2): colocado es------------->: " + encontrado );
                    colocado = false;
                }               
            }
            //if ((X != 0 && Y != 72) || (X != 72 && Y != 72) || (Y != 72)){//(R-D, D, L-D)
            if (Tablero[X][(Y-1)] != 0){ //Abajo
                console.log("----------------------------------------------------------------------------");
                console.log("Tablero[X][(Y-1)].u: " + Tablero[X][(Y-1)].u + " Tablero[X][(Y-1)].r: " + Tablero[X][(Y-1)].r);
                console.log("Tablero[X][(Y-1)].d: " + Tablero[X][(Y-1)].d + " Tablero[X][(Y-1)].l: " + Tablero[X][(Y-1)].l);
                console.log("----------------------------------------------------------------------------");
                if (Tablero[X][(Y-1)].u != Ficha.d){   
                    console.log(Tablero[X][(Y-1)].u + "  " + Ficha.d);
                    console.log("ColocarFicha(en el for3): colocado es------------->: " + encontrado );
                    colocado = false;
                }
            }
            //if ((X != 0 && Y != 0) || (X != 0 && Y != 72) || (X != 0)){//(L-D, L, L-U)
            if (Tablero[(X-1)][Y] != 0){ //Izquierda
                console.log("----------------------------------------------------------------------------");
                console.log("Tablero[(X-1)][Y].u: " + Tablero[(X-1)][Y].u + " Tablero[(X-1)][Y].r: " + Tablero[(X-1)][Y].r);
                console.log("Tablero[(X-1)][Y].d: " + Tablero[(X-1)][Y].d + " Tablero[(X-1)][Y].l: " + Tablero[(X-1)][Y].l);
                console.log("----------------------------------------------------------------------------");
                if (Tablero[(X-1)][Y].r != Ficha.l){
                    console.log(Tablero[(X-1)][Y].r + "  " + Ficha.l);
                    console.log("ColocarFicha(en el for4): colocado es------------->: " + encontrado );
                    colocado = false;
                }
            }           
        }

        console.log("ColocarFicha(4): el valor de colocado es: " + colocado);
        return colocado;           
};


//funcion cierra claustro

CierraClaustro = function(Tablero,X,Y){
    var cerrado = false;
    var contador = 0;
    var puntos = 1;

    if(Tablero[X-1][(Y-1)] != 0){
        contador++;
        puntos++;
    }
    if(Tablero[(X)][(Y-1)] != 0){
        contador++;
        puntos++;
    }
    if(Tablero[(X+1)][Y-1] != 0){
        contador++;
        puntos++;
    }
    if(Tablero[(X+1)][(Y)] != 0){
        contador++;
        puntos++;
    }
    if(Tablero[X+1][(Y+1)] != 0){
        contador++;
        puntos++;
    }
    if(Tablero[(X)][(Y+1)] != 0){
        contador++;
        puntos++;
    }
    if(Tablero[(X-1)][Y+1] != 0){
        contador++;
        puntos++;
    }
    if(Tablero[(X-1)][(Y)] != 0){
        contador++;
        puntos++;
    }
   
    //alert("el valor del contador es: " + contador);
    if (contador == 8){
        return [true,puntos]
    }else{
        return [false,puntos]
    }

};




//Funcion a la que se llamara a la hora de poner una ficha y comprobar si se pueden
//atribuir puntos a ese jugador o todavía no para ello tendremos dos objetivos a cumplir:
//            - Se cierra el castillo
//            - Hay algun seguidor en ese castillo
//Num = Posicion del seguidor dentro de la ficha(1..4) Se puede cambiar a como nos lo quieran pasar
//X = Posicion inicial de la ficha eje X.   Y = Posicion inicial de la ficha eje Y.

CuentaPCamino = function(Tablero, Ficha, Num, X, Y){
    var fincamino = [ //Fichas que cierran camino
        'c3mur',
        'mc',
        'c4',
        'c3',
        'chmur',
        'chmure'
    ];
    var contcamino = [ //Fichas que continuan camino
        'cc',
        'cr',
        'cmur',
        'ccmur',
        'ccmur3',
        'ccmur2',
        'ccmur2e'
    ];
   
    puntos = 0;
    flag = 0;                         // 2 fincamino.
    var arr = [];                    //Array con todas las direcciones por las que ya hemos pasado
    constante = 0;
    MeteDirec = function(X, Y){     // Diccionario de las posiciones que ha tenido ese camino, para comprobar si hemos retornado al inicio.
        var obj = {
            x: X,
            y: Y
        }
        arr.push(obj);
        constante++;
    };

    //Funcion que nos devuelve si en esa posicion ya hemos estado
    DarDirec = function(X, Y){
        Encontrado = true;
        for (i = 0; i <= constante - 1; i++){
            if (arr[i].x == X && arr[i].y == Y)
                Encontrado = false;
        }
        return Encontrado;
    };

    //Funcion recursiva a la que le voy pasando la ficha siguiente (a partir de la ficha inicial)
    Recursiva = function(Tablero, prohibido, flag, X, Y){
        //console.log("Entra en Recursiva");
        //console.log("La ficha es: " + Tablero[X][Y].nombre + " Posicion: " + X + "," + Y);
        if ((Tablero[X][Y] != 0) && (flag != 2)){         // Caso en el que tenemos ficha en esa dirección y todavía no hemos finalizado camino
            puntos = puntos + 1;                         // Si hay ficha, tiene que ser camino y por tanto sumamos puntos
            if (fincamino.indexOf(Tablero[X][Y].nombre) != -1){         // Si la ficha está en fincamino ya hemos finalizado el camino
                puntos = puntos + 1;                        
                //console.log("Recursiva Fincamino, Ficha: " + Tablero[X][Y].nombre);
                flag = flag + 1;
            }
            else if(contcamino.indexOf(Tablero[X][Y].nombre) != -1){ // Si la ficha está en contcamino seguimos haciendo recursiva
                if ((Tablero[X][Y].u == 'camino') && (prohibido != 'arriba') && DarDirec(X,Y)){
                    puntos = puntos + 1;                        
                    Y1 = Y + 1;   
                    MeteDirec(X,Y);               
                    Recursiva(Tablero, 'abajo', flag, X, Y1);
                }
                if ((Tablero[X][Y].r == 'camino') && (prohibido != 'derecha') && DarDirec(X,Y)){
                    puntos = puntos + 1;                        
                    X1 = X + 1;
                    MeteDirec(X,Y);
                    Recursiva(Tablero, 'izquierda', flag, X1, Y);
                }
                if ((Tablero[X][Y].d == 'camino') && (prohibido != 'abajo') && DarDirec(X,Y)){
                    puntos = puntos + 1;                        
                    Y2 = Y - 1;
                    MeteDirec(X,Y);
                    Recursiva(Tablero, 'arriba', flag, X, Y2);
                }
                if ((Tablero[X][Y].l == 'camino') && (prohibido != 'izquierda') && DarDirec(X,Y)){
                    puntos = puntos + 1;                        
                    X2 = X - 1;
                    MeteDirec(X,Y);
                    Recursiva(Tablero, 'derecha', flag, X2, Y);
                }
            }
        }   
    };

    //Funcion para las fichas iniciales continuas(Con dos posibles direcciones).
    Continua = function(Tablero, Ficha, X, Y){
        puntos = puntos + 1;       
        if (Ficha.u == 'camino'){
            Y1 = Y + 1;
            //alert("Cont Ficha arriba: " + Tablero[X][Y1].nombre);
            MeteDirec(X,Y);
            Recursiva(Tablero, "abajo", flag, X, Y1);   
        }
        if (Ficha.r == 'camino') {           
            X1 = X + 1;
            //alert("Cont Ficha derecha: " + Tablero[X1][Y].nombre);
            MeteDirec(X,Y);
            Recursiva(Tablero, "izquierda", flag, X1, Y);
        }
        if (Ficha.d == 'camino') {       
            Y2 = Y - 1;
            //alert("Cont Ficha abajo: " + Tablero[X][Y2].nombre);
            MeteDirec(X,Y);
            Recursiva(Tablero, "arriba", flag, X, Y2);
        }
        if (Ficha.l == 'camino'){           
            X2 = X - 1;
            //alert("Cont Ficha izquierda: " + Tablero[X2][Y].nombre);
            MeteDirec(X,Y);
            Recursiva(Tablero, "derecha", flag, X2, Y);
        }
    };

    // Saber que aquí para probarlo solo van a entrar las fichas que estén en cont y fin camino
    // Comprobamos donde esta la ficha -- 4 Posibilidades (U-R-D-L)
    if(Num == 2){ //Miro Arriba
        if (fincamino.indexOf(Ficha.nombre) != -1){ // Buscamos si la ficha esta en fincamino
            puntos = puntos + 1;       
            flag = flag + 1;                                 // Le sumamos uno porque va a ser un extremo del cierra camino(Va a haber dos)
            Y1 = Y + 1;                                         // Vamos para arriba
            MeteDirec(X,Y);
            Recursiva(Tablero, "abajo", flag, X, Y1);         // Llamamos a la funcion Recursiva pasandole la siguiente ficha y donde tiene que ir   
        }
        else if (contcamino.indexOf(Ficha.nombre) != -1){     //Aquí le diremos para donde tiene que tirar cada camino
            //alert("Num = 1 contcamino Ficha: " + Ficha.nombre);                       
            Continua(Tablero, Ficha, X, Y);
        }       
    }   
    else if (Num == 6){ //Miro Derecha
        if (fincamino.indexOf(Ficha.nombre) != -1){
            puntos = puntos + 1;
            flag = flag + 1;
            X1 = X + 1; //Vamos para la derecha
            MeteDirec(X,Y);
            Recursiva(Tablero, "izquierda", flag, X1, Y);
        }
        else if (contcamino.indexOf(Ficha.nombre) != -1){
            Continua(Tablero, Ficha, X, Y);
        }
    }
    else if (Num == 8){ //Miro Abajo
        if (fincamino.indexOf(Ficha.nombre) != -1){
            puntos = puntos + 1;
            flag = flag + 1;
            Y2 = Y - 1; //Vamos para abajo
            MeteDirec(X,Y);
            Recursiva(Tablero, "arriba", flag, X, Y2);
        }
        else if (contcamino.indexOf(Ficha.nombre) != -1){
            Continua(Tablero, Ficha, X, Y);
        }           
    }
    else if (Num == 4){ //Miro Izquierda
        //console.log("La Ficha es: " + Ficha.nombre);
        if (fincamino.indexOf(Ficha.nombre) != -1){
            puntos = puntos + 1;
            flag = flag + 1;
            X2 = X - 1; //Vamos para la izquierda
            MeteDirec(X,Y);   
            Recursiva(Tablero, "derecha", flag, X2, Y);       
        }
        else if (contcamino.indexOf(Ficha.nombre) != -1){
            Continua(Tablero, Ficha, X, Y);
        }   
    }
    else
        console.log("El Num es incorrecto");
    /*for (i = 0; i <= puntos; i++){
        alert("ArrayPosX: " + arr[i].x);
        alert("ArrayPosY: " + arr[i].y);
    }*/
    arr = [];
    return puntos;
};


//función que comprueba si se ha cerrado el castillo y devuelve la puntuación.
//Para ello dos pasos:
    //ver si se ha cerrado el castillo.
    //ver si hay un caballero en el castillo cerrado.
CierraCastillo = function(Tablero, Ficha, PosSeguidor, X, Y){

    //POSIBLES ESTRUCTURAS DE DATOS A USAR.
    var fichasLadoCastilloConexos =[
        'c3mur',
        'mur1',
        'cmur',
        'ccmur',
        'ccmur3',
        'murcam',
        'ccmur2',
        'ccmur2e',
        'murcame',
        'ciucam2e',
        'ciucam',
        'ciucam2',
        'chmur',
        'chmure',
        'ciucame',
        'ciudad'
    ];
   
    var fichas2LadosCierranCastillo =[
        'mur2',
        'mur2c'
    ];
   
    var fichasConEscudo = [
        'ciudad',
        'chmure',
        'ccmur2e',
        'murcame',
        'ciucame',
        'ciucam2e'
    ];
       
    var arr = [];    //Array con todas las direcciones por las que ya hemos pasado
    var constante = 0; //Con esta constante sabremos cuantas fichas hemos investigado en MeteDirec
    //resultado = TipoCastillo(Ficha.nombre);
    //console.log("Estoy dentro de CierraCastillo");
    //return resultado;
    var Entrar = 0;
    MeteDirec = function(X, Y){         // Diccionario de las posiciones que ha tenido ese camino, para comprobar si hemos retornado al inicio.
        console.log("Metemos direccion: " + X + "," + Y);
        var obj = {
            x: X,
            y: Y
        }
        arr.push(obj);
        constante++;
        Entrar = 1;
    };

    //Funcion que nos devuelve si en esa posicion ya hemos estado
    DarDirec = function(X, Y){
        Encontrado = true;
        if (Entrar == 1){
            for (i = 0; i <= constante - 1; i++){
                if (arr[i].x == X && arr[i].y == Y)               
                    Encontrado = false;
            }
            return Encontrado;
        }       
        else
            return true;
    };
   
    var puntos=0;
   
    DarPuntos= function(puntos, Ficha){
        if (fichasConEscudo.indexOf(Ficha.nombre)!=-1){
            //console.log("entro en ficha con escudo");
            puntos= puntos + 4;
            console.log("los puntos intermedios CE son: " + puntos);
        }
        else{
            //console.log("entro en ficha sin escudo");
            puntos=puntos+2;
            console.log("los puntos intermedios SE son: " + puntos);
        }
        return puntos;
    };
    RecursivaCastillo= function(Ficha, Prohibido,X,Y){
        console.log("                                ");
        if (Tablero[X][Y]!=0){
            console.log("LA FICHA: " + Ficha.nombre + " Coordenadas: X= " + X + "||| Y= " + Y);
            Points = true;
            if (fichasLadoCastilloConexos.indexOf(Ficha.nombre)!=-1){    //si la ficha esta en este array
                console.log("la ficha "+ Ficha.nombre + " está en el array conexo | CX: " + X + "||| CY: " + Y);
                console.log("DarDirec es: " + DarDirec(X,Y));
                if (DarDirec(X,Y)){
                    if ((Ficha.u == "castillo") && (Prohibido != "arriba")){
                        Y1=Y+1;                       
                        MeteDirec(X,Y);
                        puntos= DarPuntos(puntos, Ficha);
                        RecursivaCastillo(Tablero[X][Y1],"abajo",X,Y1);
                        Points = false;
                    }       
                    if ((Ficha.r=="castillo") && (Prohibido!= "derecha")){
                        if (Points){                       
                            MeteDirec(X,Y);
                            puntos= DarPuntos(puntos, Ficha);
                        }
                        X1=X+1;
                        RecursivaCastillo(Tablero[X1][Y],"izquierda",X1,Y);
                        Points = false;
                    }
                    if ((Ficha.d=="castillo") && (Prohibido!= "abajo")){
                        if (Points){                       
                            MeteDirec(X,Y);
                            puntos= DarPuntos(puntos, Ficha);
                        }
                        Y2=Y-1;
                        RecursivaCastillo(Tablero[X][Y2],"arriba",X,Y2);
                        Points = false;
                    }
                    if ((Ficha.l=="castillo") && (Prohibido!= "izquierda")){
                        if (Points){                   
                            MeteDirec(X,Y);
                            puntos= DarPuntos(puntos, Ficha);
                        }
                        X2=X-1;
                        RecursivaCastillo(Tablero[X2][Y],"derecha",X2,Y);
                        Points = false;
                    }
                }
            }
            else if (DarDirec(X,Y)){
                console.log("la ficha "+ Ficha.nombre + " está en el array inconexo.");
                puntos= DarPuntos(puntos, Ficha);;
                MeteDirec(X,Y);               
                //console.log("los puntos intermedios en la ficha inconexa " + Ficha.nombre + " son: " + puntos);
            }
        }
        else{
            console.log("El tablero está vacío.");
            //puntos=0;
        }
    };
   
    //tratamos el caso de que llega una ficha con seguidor
    //entramos en el caso de las fichas inconexas
    if (fichas2LadosCierranCastillo.indexOf(Ficha.nombre)!=-1){
        console.log("x e y iniciales "+X+"   "+ Y);
        //tengo que ver las 4 posiciones del seguidor
        if (PosSeguidor==2){
            Y1=Y+1;
            puntos= DarPuntos(puntos, Ficha);
            MeteDirec(X,Y);
            RecursivaCastillo(Tablero[X][Y1], "abajo", X, Y1);
        }
        else if (PosSeguidor==6){
            //console.log("posicion del seguidor es: " + PosSeguidor);
            X1=X+1;
            puntos= DarPuntos(puntos,Ficha);
            MeteDirec(X,Y);
            RecursivaCastillo(Tablero[X1][Y], "izquierda", X1, Y);
        }
        else if (PosSeguidor==8){
            //console.log("posicion del seguidor es: " + PosSeguidor);
            Y2=Y-1;
            puntos= DarPuntos(puntos, Ficha);
            MeteDirec(X,Y);
            RecursivaCastillo(Tablero[X][Y2], "arriba", X, Y2);
        }
        else if (PosSeguidor==4){
            //console.log("posicion del seguidor es: " + PosSeguidor);
            X2=X-1;
            puntos= DarPuntos(puntos, Ficha);
            MeteDirec(X,Y);
            RecursivaCastillo(Tablero[X2][Y], "derecha", X2, Y);
        }
    }
    else{
        console.log("La ficha inicial es conexa");
        MeteDirec(X,Y);
        Points = true;
        if (Ficha.u == "castillo"){
            console.log("Entra Arriba");
            Y1=Y+1;
            puntos= DarPuntos(puntos, Ficha);
            RecursivaCastillo(Tablero[X][Y1],"abajo",X,Y1);
            Points = false;
        }
        if ((Ficha.r=="castillo")){
            console.log("Entra Derecha");
            X1=X+1;
            if (Points)
                puntos= DarPuntos(puntos, Ficha);
            RecursivaCastillo(Tablero[X1][Y],"izquierda",X1,Y);
            Points = false;
        }
        if ((Ficha.d=="castillo")){
            console.log("Ficha.nombre: " + Ficha.nombre);
            console.log("Entra Abajo");
            Y2=Y-1;
            if (Points)           
                puntos= DarPuntos(puntos, Ficha);
            RecursivaCastillo(Tablero[X][Y2],"arriba",X,Y2);
            Points = false;
        }
        if ((Ficha.l=="castillo")){
            console.log("Entra Izquierda");
            X2=X-1;
            if (Points)
                puntos= DarPuntos(puntos, Ficha);
            RecursivaCastillo(Tablero[X2][Y],"derecha",X2,Y);
        }
       
    }

    for (i = 0; i <= constante-1; i++)
        console.log("PosX: " + arr[i].x + " PosY: " + arr[i].y);

    if (puntos==4){
        puntos= 2;
        return puntos;
    }
    else{
        return puntos;
    }
};


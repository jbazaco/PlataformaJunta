Plataforma_Juegos_ISI_13_14
===========================
Para que funcione esto desde cero:

1.- Añadir los widgets del accounts:
  meteor add accounts-ui
  meteor add accounts-password
  
2.- Quitar el autopublish:
  meteor remove autopublish
  
3.- Instalar meteorite (mrt):
  npm install meteorite
  
4.- Mover la carpeta node_modules al home
  mv node_modules ~

5.- Renombrarla como oculto:
  cd ~
  mv node_modules .node_modules
  
6.- Añadir al bashrc el ejecutable de mrt
  echo "export PATH=~/.node_modules/.bin:$PATH" >> ~/.bashrc
  
7.- Cierra el terminal, abre otro nuevo (esto es para que el terminal vuelva a cargr el bashrc)
    
8.- En la carpeta de tu proyecto, añadir jquery-ui.
  cd <Tu_Proyecto>
  mrt add jquery-ui
  
9.- Cruza los dedos, reza y ejecuta meteor.

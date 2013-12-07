
Meteor.publish('mov_partida', function() {
	return Movimientos.find();
});


Meteor.startup(function() {

});

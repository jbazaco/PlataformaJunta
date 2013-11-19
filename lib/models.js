Messages = new Meteor.Collection('messages');
Partidas = new Meteor.Collection('partidas')

Meteor.publish('messages', function(){
	return Messages.find({}, {sort: {time:-1}});
});

Meteor.publish('partidas',function(){
	return Partidas.find({});
})
Meteor.subscribe("messages");
// Meteor.subscribe("partidas");

var Clip = function(msg,maxlen){
	if(msg.length>maxlen){
		var msgaux="";
		for(var i = 1;i<Math.floor(msg.length/maxlen);i++){
			msgaux+=msg.substring(maxlen*i,maxlen*(i+1))+"\n";
		}
		return msgaux;
	}else{
		return msg
	}
};

Template.input.events={
	'keydown input#message': function(event){
		if (event.which==13){
			var message=$("#message");
			if (message.val().replace(' ','')!=""){
				var msg=Clip(message.val(),50);
				if (Meteor.user()){
					var name = Meteor.user().username;
				}else{
					var name="Anon";
				}
				Messages.insert({
					name:name,
					message:message.val(),
					time:Date.now()
				});
			}
			message.val("");		
		}
	}
}

Template.games.events={
	'click input.inc': function () {
		var seq = Session.get("seq");
		if (!seq){
			seq=1;
			Session.set("seq",1)
		}
		Partidas.insert({
			id:"Partida"+seq.toString(),
			jugadas:0
		});
		Session.set("seq",seq+1);
    },
	'click input.inc2': function(){
		var pid = Partidas.findOne({id: 'Partida'+Session.get("seq").toString()})._id
		Partidas.update(pid,{$inc:{jugadas:1}});
	}
}

Accounts.ui.config({
	passwordSignupFields:"USERNAME_AND_OPTIONAL_EMAIL"
});

Deps.autorun(function(){
	var chatArea = $('#firstRow');
	var msgs = Messages.find({},{sort:{time:-1}, limit:1});	
	msgs.forEach(function(message){
		chatArea.prepend("<tr><td><strong>"+message['name']+"</strong>:</td><td><div>"+message['message']+"</div></td>");
	});
});

Deps.autorun(function(){
	var txtArea=$('#Listapartidas');
	var gameslist=Partidas.find({},{sort:{partida:1, seq:1},limit:1})
	gameslist.forEach(function(partida){
		txtArea.append("id:"+partida.id+" jugadas:"+partida.jugadas+"\n");
	})
});

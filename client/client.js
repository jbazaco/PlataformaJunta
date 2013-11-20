/*Lineas mamada:
 * Partidas.find({}).forEach(function(elem){Partidas.remove(elem._id)})
 * Messages.find({}).forEach(function(elem){Messages.remove(elem._id)})
 */

Meteor.subscribe("messages");
Meteor.subscribe("partidas");

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
		Session.set("jug",0)
		Partidas.insert({
			id:GetSeq(),
			jugadas:[]
		});
    },
	'click input.inc2': function(){
		var jug = Session.get("jug");
		var pid = Partidas.findOne({id: (Session.get("seq"))})._id
		Partidas.update(pid,{$push:{jugadas:jug}});
		Session.set("jug",jug+1);
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
	txtArea.text('')
	var gameslist=Partidas.find({},{sort:{partida:0}});
	gameslist.forEach(function(partida){
		txtArea.append("id:"+partida.id+" jugadas:"+partida.jugadas+"\n");
	})
});

var GetSeq = function(){
	var lst = Partidas.find({},{sort:{id:1}}).fetch();
	for (var i=0; i<lst.length-1;i++){
		if (Number(lst[i].id)+1 != Number(lst[i+1].id)){
			var val = Number(lst[i].id)+1;
			Session.set("seq",val);	//Gap!
			return val;
		}
	}
	var val= lst.length==0 ? 0 : lst[lst.length-1].id+1;
	Session.set("seq",val)	//Not Gap..
	return val;
}



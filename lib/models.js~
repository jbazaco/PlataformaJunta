Messages = new Meteor.Collection('messages');


Meteor.publish("msgs", function(){
  return Messages.find({}, {sort: {time:-1}, limit:1});
});


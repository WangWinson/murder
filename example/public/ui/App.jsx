'use strict';
/*jshint quotmark:false*/

var React = window.React,
    Murder = window.Murder,
    SignIn = window.SignIn;

var App = window.App = React.createClass({
  render: function() {
    var crows = window.crows;
    return (
      <div className="app">
        <Murder crdt={crows}/>
        <SignIn/>
      </div>
    );
  }
});

loadApp();

function loadApp() {
  if (window.crows && window.main) {
    return React.render(<App/>, window.main);
  }
  setTimeout(loadApp, 50);
}

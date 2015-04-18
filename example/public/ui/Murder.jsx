'use strict';
/*jshint quotmark:false*/

var CRDTReactMixin = window.CRDTReactMixin,
    Crow = window.Crow,
    React = window.React;

window.Murder = React.createClass({
  mixins: [CRDTReactMixin],

  setCRDTState: function (crdt) {
    crdt.collect().then(function () {
      this.setState(crdt.state);
    }.bind(this));
  },

  renderCrow: function (crow) {
    return (
      <Crow key={crow.id} crdt={crow}/>
    );
  },

  render: function () {
    var crdt = this.props.crdt,
        crows = crdt.toArray().map(this.renderCrow);

    return (
      <div className="murder">{crows}</div>
    );
  }
});

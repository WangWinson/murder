'use strict';
/*jshint quotmark:false*/

var CRDTReactMixin = window.CRDTReactMixin,
    React = window.React;

window.Crow = React.createClass({
  mixins: [CRDTReactMixin],

  render: function() {
    // if (this.state.x === 0 && this.state.y === 0)
    //   { return ''; }
    var style = {
      left: (this.state.x * 100) + '%',
      top: (this.state.y * 100) + '%'
    };
    return (
      <div className="crow" style={style}>
        <strong>{this.props.crdt.id}</strong>
      </div>
    );
  }
});

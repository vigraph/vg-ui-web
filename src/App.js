import React, { Component } from 'react';
import './App.css';
import Node from './Node.js';

export default class App extends Component
{
  static nodes = [ "a", "b", "c" ];

  render()
  {
    return (
      <svg id="diagram">
        { App.nodes.map( (node, i) => {
            return <Node key={i} x={10} y={100*i} height={50+50*i} name={node} />
          })
        }
      </svg>
    );
  }
}


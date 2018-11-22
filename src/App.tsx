import * as React from 'react';

import * as Model from './model';

import './App.css';
import Node from './Node';

// tslint:disable:no-console

export default class App extends React.Component
{
  private graph: Model.Graph = new Model.Graph;

  constructor(props: any)
  {
    super(props);
    this.graph.addNode("foo", "x");
    this.graph.setNodePosition("foo", { x: 10, y: 50 });
    this.graph.addNode("bar", "y");
    this.graph.setNodePosition("bar", { x: 20, y: 150 });
    this.graph.addNode("splat", "z");
    this.graph.setNodePosition("splat", { x: 10, y: 300 });
  }

  public render()
  {
    console.log("Render");
    return (
      <div id="container">
        <button onClick={this.handleUndo}>Undo</button>
        <button onClick={this.handleRedo}>Redo</button>
        <svg id="diagram">
          {
            this.graph.getNodes().map((node: Model.Node, i) =>
            {
              console.log("Node " + node.id + " x=" + node.position.x);
              return <Node key={i} node={node}
                x={node.position.x} y={node.position.y}
                name={node.id + ": " + node.type} />
            })
          }
        </svg>
      </div>
    );
  }

  private handleUndo = () =>
  {
    this.graph.undo();
    this.forceUpdate();
  }

  private handleRedo = () =>
  {
    this.graph.redo();
    this.forceUpdate();
  }

}

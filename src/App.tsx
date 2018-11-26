import * as React from 'react';

import * as Model from './model';

import './App.css';
import Node from './Node';

export default class App extends React.Component
{
  private graph: Model.Graph = new Model.Graph;

  constructor(props: any)
  {
    super(props);
    this.graph.addNode("foo", "x").position = { x: 10, y: 50 };
    this.graph.addNode("bar", "y").position = { x: 20, y: 150 };
    this.graph.addNode("splat", "z").position = { x: 10, y: 300 };
    this.graph.resetBaseline();
  }

  public render()
  {
    return (
      <div id="container">
        <button onClick={this.handleUndo}>Undo</button>
        <button onClick={this.handleRedo}>Redo</button>
        <svg id="diagram">
          {
            this.graph.getNodes().map((node: Model.Node, i) =>
            {
              return <Node key={i} node={node}
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

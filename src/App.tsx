import * as React from 'react';

import * as Model from './model';

import './App.css';
import Edge from './Edge';
import Node from './Node';

export default class App extends React.Component
{
  private graph: Model.Graph = new Model.Graph;

  constructor(props: any)
  {
    super(props);
    const foo = this.graph.addNode("foo", "x");
    foo.position = { x: 10, y: 50 };
    const bar = this.graph.addNode("bar", "y");
    bar.position = { x: 20, y: 150 };
    const splat = this.graph.addNode("splat", "z");
    splat.position = { x: 10, y: 300 };

    foo.addEdge("out1", bar, "in1");
    splat.addEdge("out1", bar, "in2");

    this.graph.resetBaseline();
  }

  public render()
  {
    return (
      <div id="container">
        <button onClick={this.handleUndo}>Undo</button>
        <button onClick={this.handleRedo}>Redo</button>
        <svg id="diagram">
          <svg id="nodes">
            {
              this.graph.getNodes().map((node: Model.Node, i) =>
              {
                return <Node key={i} node={node}
                  name={node.id + ": " + node.type}
                  startDragUpdate={this.startDragUpdate}
                  dragUpdate={this.dragUpdate}
                  endDragUpdate={this.endDragUpdate} />
              })
            }
          </svg>
          <svg id="edges">
            {
              this.graph.getNodes().map((node: Model.Node, i) =>
                Array.from(node.getForwardEdges(),
                  ([output, to]) =>
                  {
                    return <Edge key={i} src={node} dest={to.dest} />
                  })
              )
            }
          </svg>
          }
        </svg>
      </div>
    );
  }

  private startDragUpdate = () =>
  {
    this.graph.beginTransaction();
  }

  private dragUpdate = () =>
  {
    this.forceUpdate();
  }

  private endDragUpdate = () =>
  {
    this.graph.commitTransaction();
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

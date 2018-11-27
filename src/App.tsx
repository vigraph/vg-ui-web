import * as React from 'react';

import './App.css';
import Graph from './Graph';

const exampleGraph =
{
  nodes: [
    {
      id: 'foo', type: 'x', x: 10, y: 50, w: 100, h: 100,
      edges: [
        { output: 'out1', dest: 'bar', input: 'in1' }
      ]
    },
    {
      id: 'bar', type: 'y', x: 200, y: 150, w: 100, h: 50
    },
    {
      id: 'splat', type: 'z', x: 10, y: 300, w: 100, h: 75,
      edges: [
        { output: 'out1', dest: 'bar', input: 'in2' }
      ]
    },
  ]
};

export default class App extends React.Component
{
  private graph = React.createRef<Graph>();

  constructor(props: any)
  {
    super(props);
  }

  public render()
  {
    return (
      <div id="container">
        <button onClick={this.handleUndo}>Undo</button>
        <button onClick={this.handleRedo}>Redo</button>
        <Graph ref={this.graph} from={exampleGraph} />
      </div>
    );
  }

  private handleUndo = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.undo();
    }
  }

  private handleRedo = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.redo();
    }
  }
}

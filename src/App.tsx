import * as React from 'react';

import './App.css';
import Graph from './Graph';

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
        <Graph ref={this.graph} />
      </div>
    );
  }

  public componentDidMount()
  {
    if (this.graph.current)
    {
      this.graph.current.createExampleGraph();
    }
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

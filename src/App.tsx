import * as React from 'react';

import './App.css';
import Graph from './Graph';

const exampleGraph =
{
  nodes: [
    {
      id: 'foo', type: 'x', x: 10, y: 50, w: 110, h: 100,
      inputs: [
        { id: 'in1', type: 'i', maxConnections: 1 }
      ],
      outputs: [
        { id: 'out1', type: 'i', maxConnections: 2 }
      ],
      edges: [
        { output: 'out1', dest: 'bar', input: 'in1' }
      ],
      properties: [
        { id: 'first', controlType: 'knob', subType: 'default', x: 20, y: 45,
          value: 0, rangeMin: 0, rangeMax: 100, increment: 50 }
      ]
    },
    {
      id: 'bar', type: 'y', x: 200, y: 150, w: 110, h: 75,
      inputs: [
        { id: 'in1', type: 'i', maxConnections: 1 },
        { id: 'in2', type: 'i', maxConnections: 1 }
      ],
      outputs: [
        { id: 'out1', type: 'i', maxConnections: 1 }
      ],
      properties: [
        { id: 'second', controlType: 'slider', subType: 'horz', x: 20, y: 40,
          value: 0.5, rangeMin: -1000, rangeMax: 1000, increment: 1 }
      ]
    },
    {
      id: 'splat', type: 'z', x: 10, y: 300, w: 110, h: 75,
      inputs: [
        { id: 'in1', type: 'i', maxConnections: 1 }
      ],
      outputs: [
        { id: 'out1', type: 'i', maxConnections: 1 }
      ],
      edges: [
        { output: 'out1', dest: 'bar', input: 'in2' }
      ],
      properties: [
        { id: 'third', controlType: 'switch', subType: 'circle', x: 20, y: 40,
          value: 0, rangeMin: 0, rangeMax: 1, increment: 1 }
      ]
    },
    {
      id: 'bing', type: 'z', x: 400, y: 300, w: 110, h: 75,
      inputs: [
        { id: 'in1', type: 'i', maxConnections: 1 }
      ],
      outputs: [
        { id: 'out1', type: 'i', maxConnections: 1 }
      ],
      edges: [],
      properties: [
        { id: 'fourth', controlType: 'slider', subType: 'selector', x: 20,
          y: 40, value: 0.3, rangeMin: 100, rangeMax: 300, increment: 100 }
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
        <button onClick={this.handleToggleControls}>Toggle Controls</button>
        <button onClick={this.handleToggleLabels}>Toggle Labels</button>
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

  private handleToggleControls = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.toggleDisplay("controls");
    }
  }

  private handleToggleLabels = () =>
  {
    if (this.graph.current)
    {
      this.graph.current.toggleDisplay("labels");
    }
  }
}

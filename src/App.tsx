import * as React from 'react';

import './App.css';
import Graph from './Graph';
import WebsocketCanvas from './WebsocketCanvas';

/* const exampleGraph =
{
  nodes: [
    {
      id: 'foo', type: 'x', x: 10, y: 50, w: 80, h: 100,
      inputs: [
        { id: 'in1', connectorType: 'i', multiple: false }
      ],
      outputs: [
        { id: 'out1', connectorType: 'i', multiple: false }
      ],
      edges: [
        { output: 'out1', destId: 'bar', input: 'in1' }
      ],
      properties: [
        { id: 'first', controlType: 'knob', subType: 'default', x: 20, y: 40,
          value: 0, rangeMin: 0, rangeMax: 100, increment: 50 },
      ]
    },
    {
      id: 'bar', type: 'y', x: 200, y: 150, w: 115, h: 80,
      inputs: [
        { id: 'in1', connectorType: 'i', multiple: false },
        { id: 'in2', connectorType: 'i', multiple: false }
      ],
      outputs: [
        { id: 'out1', connectorType: 'i', multiple: false }
      ],
      properties: [
        { id: 'second', controlType: 'slider', subType: 'default', x: 20, y: 40,
          value: 0.5, rangeMin: -1000, rangeMax: 1000, increment: 1 }
      ]
    },
    {
      id: 'splat', type: 'z', x: 10, y: 300, w: 80, h: 100,
      inputs: [
        { id: 'in1', connectorType: 'i', multiple: false }
      ],
      outputs: [
        { id: 'out1', connectorType: 'i', multiple: false }
      ],
      edges: [
        { output: 'out1', destId: 'bar', input: 'in2' }
      ],
      properties: [
        { id: 'third', controlType: 'button', subType: 'circle', x: 20, y: 40,
          value: 0, rangeMin: 0, rangeMax: 1, increment: 1 }
      ]
    },
    {
      id: 'bing', type: 'z', x: 400, y: 100, w: 125, h: 80,
      inputs: [
        { id: 'in1', connectorType: 'i', multiple: false }
      ],
      outputs: [
        { id: 'out1', connectorType: 'i', multiple: false }
      ],
      edges: [],
      properties: [
        { id: 'fourth', controlType: 'selector', subType: 'default', x: 20,
          y: 40, value: "option1", available: ["option1","option2","option3"],
          rangeMin: 100, rangeMax: 300, increment: 100 }
      ]
    },
    {
      id: 'bang', type: 'y', x: 400, y: 300, w: 110, h: 75,
      inputs: [
        { id: 'in1', connectorType: 'i', multiple: false }
      ],
      outputs: [
        { id: 'out1', connectorType: 'i', multiple: false }
      ],
      edges: [],
      properties: [
        { id: 'fourth', controlType: 'colourPicker', subType: 'default',
          x: 20, y: 40, value: "#CCCCCC",
          rangeMin: 0, rangeMax: 1, increment: 1 }
      ]
    },
  ]
}; */

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
        <div id="buttons">
          <button onClick={this.handleUndo}>Undo</button>
          <button onClick={this.handleRedo}>Redo</button>
          <button onClick={this.handleToggleControls}>Toggle Controls</button>
          <button onClick={this.handleToggleLabels}>Toggle Labels</button>
        </div>
        <Graph ref={this.graph} /* from={exampleGraph} */ />
        <WebsocketCanvas size={{ x: 1000, y: 500 }} />
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

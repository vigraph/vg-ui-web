import * as React from 'react';

import * as Model from './model';

import './Graph.css';

import Connector from './Connector';
import Edge from './Edge';
import Node from './Node';
import Property from './Property';

const csize: number = 5;

interface IProps
{
  from?: any;
}

interface IState
{
  propertiesDisplay: {labels: boolean; controls: boolean},
  tempNodes: {dummy: Model.Node, real: Model.Node} | null,
  tempConnectors:{ dummy: Model.Connector,  real: Model.Connector} | null
  targetConnector: { connector: Model.Connector, parent: Model.Node } | null
}

export default class Graph extends React.Component<IProps, IState>
{
  private graph: Model.Graph = new Model.Graph();

  constructor(props: IProps)
  {
    super(props);
    if (props.from)
    {
      // Note we load the graph directly, not doing forceUpdate()
      this.graph.loadFrom(props.from);
    }

    this.state =
    {
      propertiesDisplay: {labels: true, controls: true},
      tempNodes: null,
      tempConnectors: null,
      targetConnector: null
    };
  }

  // Load a new graph after mounting
  public loadFrom(json: any)
  {
    this.graph = new Model.Graph();
    this.graph.loadFrom(json);
    this.forceUpdate();
  }

  public render()
  {
    return (
      <svg id="graph">
        <svg id="edges">
          {
            this.graph.getNodes().map((node: Model.Node, i) =>
            {
              return node.getForwardEdges().map(
                (edge: {outputId: string, dest: Model.Node, destInput: string},
                  index) =>
                {
                  return <Edge key={i+","+index} src={node}
                    srcOutput={edge.outputId} dest={edge.dest}
                    destInput={edge.destInput} offset={csize}
                    removeEdge={this.removeEdge}
                    moveEdge={this.moveEdge}/>
                });
            })
          }
        </svg>
        <svg id="nodes">
          {
            this.graph.getNodes().map((node: Model.Node, i) =>
            {
              return <Node key={i} node={node}
                name={node.id + ": " + node.type}
                startDragUpdate={this.startUpdate}
                dragUpdate={this.movementUpdate}
                endDragUpdate={this.endUpdate}
                padding={csize*2}>
                {this.graph.getNodeConnectors(node.id, "input").map(
                  (connector: Model.Connector, j) =>
                  {
                    return <Connector key={j}
                      parent={node}
                      connector={connector}
                      connectorSelected={this.connectorSelected}
                      updateTargetConnector={this.updateTargetConnector}
                      radius={csize}/>
                  })}
                {this.graph.getNodeConnectors(node.id, "output").map(
                  (connector: Model.Connector, j) =>
                  {
                    return <Connector key={j}
                      parent={node}
                      connector={connector}
                      connectorSelected={this.connectorSelected}
                      updateTargetConnector={this.updateTargetConnector}
                      radius={csize}/>
                  })}
                {this.graph.getProperties(node.id).map(
                  (property: Model.Property, j) =>
                  {
                    return <Property key={j} property={property}
                      name={property.id}
                      display={this.state.propertiesDisplay}
                      startUpdate={this.startUpdate}
                      update={this.movementUpdate}
                      endUpdate={this.endUpdate}/>
                  })}
              </Node>
            })
          }
        </svg>
        }
      </svg>
    );
  }

  public undo = () =>
  {
    this.graph.undo();
    this.forceUpdate();
  }

  public redo = () =>
  {
    this.graph.redo();
    this.forceUpdate();
  }

  public toggleDisplay = (prop: string) =>
  {
    const display = this.state.propertiesDisplay;
    display[prop] = !display[prop];
    this.setState({propertiesDisplay: display});
  }

  private startUpdate = () =>
  {
    this.graph.beginTransaction();
  }

  private movementUpdate = () =>
  {
    this.forceUpdate();
  }

  private endUpdate = () =>
  {
    this.graph.commitTransaction();
  }

  private removeEdge = (src: Model.Node, srcOutput: string, dest: Model.Node,
    destInput: string) =>
  {
    this.graph.removeEdge(src.id, srcOutput, dest.id, destInput);
    this.forceUpdate();
  }

  private moveEdge = (node: Model.Node, connectorId: string,
    e: MouseEvent, direction: string, remove: () => void) =>
  {
    const connector = (direction === "output") ?
      node.getOutputConnector(connectorId) :
      node.getInputConnector(connectorId);

    if (connector)
    {
      this.connectorSelected(node, connector, e, remove);
    }
  }

  private connectorSelected = (node: Model.Node, connector: Model.Connector,
    e: React.MouseEvent | MouseEvent, preSelection?: () => void) =>
  {
    window.addEventListener('mouseup', this.handleConnectorMouseUp);
    window.addEventListener('mousemove', this.handleConnectorMouseMove);

    this.graph.beginTransaction();

    if (preSelection)
    {
      preSelection();
    }

    // Create dummy node and connect to selected connector to simulate
    // moving unconnected edge
    const dummyNode = this.graph.addNode("dummynode","dummy");
    dummyNode.size = {w: 0, h: 0};

    const graphEle = document.getElementById("graph");
    const graphOffsetX = graphEle ? graphEle.getBoundingClientRect().left : 0;
    const graphOffsetY = graphEle ? graphEle.getBoundingClientRect().top : 0;

    dummyNode.position = {x: e.pageX-(3*csize)-graphOffsetX,
      y: e.pageY-csize-graphOffsetY}

    let dummyConnector;

    if (connector.direction === "input")
    {
      dummyConnector = this.graph.addNodeOutput("dummynode","dummyconnector",
        connector.connectorType);
      this.graph.addEdge(dummyNode.id, dummyConnector.id, node.id,
        connector.id);
    }
    else
    {
      dummyConnector = this.graph.addNodeInput("dummynode","dummyconnector",
        connector.connectorType);
      this.graph.addEdge(node.id, connector.id, dummyNode.id,
        dummyConnector.id);
    }

    dummyConnector.maxConnections = 1;
    dummyConnector.position = {x: csize, y: csize};

    this.setState({ tempNodes: {dummy: dummyNode, real: node }});
    this.setState({ tempConnectors: {dummy: dummyConnector, real: connector}});

    this.forceUpdate();
  }

  private handleConnectorMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleConnectorMouseUp);
    window.removeEventListener('mousemove', this.handleConnectorMouseMove);

    if (this.state.tempNodes && this.state.tempConnectors)
    {
      // Remove temporary dummy node and connector
      const dnode = this.state.tempNodes.dummy;
      const rnode = this.state.tempNodes.real;
      const dconnector = this.state.tempConnectors.dummy;
      const rconnector = this.state.tempConnectors.real;

      const tconnector = this.state.targetConnector;

      if (rconnector.direction === "input")
      {
        this.graph.removeEdge(dnode.id, dconnector.id, rnode.id,
          rconnector.id);
      }
      else
      {
        this.graph.removeEdge(rnode.id, rconnector.id, dnode.id,
          dconnector.id);
      }

      this.graph.removeNode(dnode.id);

      // If the target connector has the same connector type as the previously
      // selected connector, the same direction as the dummy connector and has
      // not reached its maximum number of connectors, then add a permanent
      // edge between selected connector and target connector.
      if (tconnector && tconnector.connector && tconnector.parent &&
        tconnector.connector.connectorType === rconnector.connectorType &&
        tconnector.connector.direction === dconnector.direction &&
        tconnector.parent.edgesFromConnector(tconnector.connector) <
        tconnector.connector.maxConnections)
      {
        if (tconnector.connector.direction === "input")
        {
          this.graph.addEdge(rnode.id, rconnector.id, tconnector.parent.id,
            tconnector.connector.id);
        }
        else
        {
          this.graph.addEdge(tconnector.parent.id, tconnector.connector.id,
            rnode.id, rconnector.id);
        }
      }
    }

    this.setState({tempConnectors: null, tempNodes: null});

    this.graph.commitTransaction();

    this.forceUpdate();
  }

  private handleConnectorMouseMove = (e: MouseEvent) =>
  {
    // Move temp dummy node positioned so the connector is under the mouse
    if (this.state.tempNodes)
    {
      const dnode = this.state.tempNodes.dummy;

      const graphEle = document.getElementById("graph");
      const graphOffsetX = graphEle ? graphEle.getBoundingClientRect().left : 0;
      const graphOffsetY = graphEle ? graphEle.getBoundingClientRect().top : 0;

      dnode.position = {x: e.pageX-(3*csize)-graphOffsetX,
        y: e.pageY-csize-graphOffsetY}

      this.setState({tempNodes: {dummy: dnode,
        real: this.state.tempNodes.real}});
    }
  }

  // Target (mouse over) connector
  private updateTargetConnector = (target: {connector: Model.Connector,
    parent: Model.Node} | null) =>
  {
    this.setState({targetConnector: target});
  }
}

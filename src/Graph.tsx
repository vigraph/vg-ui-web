import * as React from 'react';

import * as Model from './model';

import { graphData } from './data/GraphData';

import './Graph.css';

import Connector from './Connector';
import Edge from './Edge';
import Node from './Node';

const csize: number = 5;

interface IProps
{
  from?: any;
}

interface IState
{
  propertiesDisplay: {labels: boolean; controls: boolean},
  tempNodes: {dummy: Model.Node, real: Model.Node} | null,
  tempConnectors:{ dummy: Model.Connector,  real: Model.Connector} | null,
  targetConnector: { connector: Model.Connector, parent: Model.Node } | null,
  showMenu: boolean
}

export default class Graph extends React.Component<IProps, IState>
{
  private graph: Model.Graph = new Model.Graph();
  private mouseClick: {x: number, y: number};
  private subMenu: string | null;
  private idCount: number;

  constructor(props: IProps)
  {
    super(props);
    if (props.from)
    {
      // Note we load the graph directly, not doing forceUpdate()
      this.graph.loadFrom(props.from);
    }
    else
    {
      graphData.generateGraph((json:any) =>
        {
          this.graph.loadFrom(json);
          this.forceUpdate();
        });
    }

    this.state =
    {
      propertiesDisplay: {labels: true, controls: true},
      tempNodes: null,
      tempConnectors: null,
      targetConnector: null,
      showMenu: false
    };

    this.mouseClick = {x: 0, y: 0};
    this.subMenu = null;
    this.idCount = 0;
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
      <div className="wrapper">
        {this.state.showMenu && this.createMenu()}
        <svg id="graph" onMouseDown={this.handleMouseDown}
          onContextMenu={this.handleContextMenu}>
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
                return <Node key={node.id} node={node}
                  startUpdate={this.startUpdate}
                  update={this.movementUpdate}
                  endUpdate={this.endUpdate}
                  padding={csize*2}
                  propertiesDisplay={this.state.propertiesDisplay}
                  removeNode={this.removeNode}>
                  {
                    this.graph.getNodeConnectors(node.id, "input").map(
                    (connector: Model.Connector, j) =>
                    {
                      return <Connector key={j}
                        parent={node}
                        connector={connector}
                        inputConnectorSelected={this.moveEdgeFromInput}
                        outputConnectorSelected={this.newMovingConnectorEdge}
                        updateTargetConnector={this.updateTargetConnector}
                        radius={csize}/>
                    })}
                  {this.graph.getNodeConnectors(node.id, "output").map(
                    (connector: Model.Connector, j) =>
                    {
                      return <Connector key={j}
                        parent={node}
                        connector={connector}
                        inputConnectorSelected={this.moveEdgeFromInput}
                        outputConnectorSelected={this.newMovingConnectorEdge}
                        updateTargetConnector={this.updateTargetConnector}
                        radius={csize}/>
                    })}
                </Node>
              })
            }
          </svg>
          }
        </svg>
      </div>
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

  private createMenu = () =>
  {
    const sMetadata = graphData.returnSectionedMetadata();

    let aMetadata = []

    if (this.subMenu)
    {
      aMetadata = sMetadata[this.subMenu];
    }
    else
    {
      for (const key of Object.keys(sMetadata))
      {
        aMetadata.push(key);
      }
    }

    return <div className="menu" style={{left: this.mouseClick.x,
        top: this.mouseClick.y}} onContextMenu={this.handleMenuContextMenu}>
      {
        aMetadata.map((value: string, index: number) =>
        {
          return <div key={index} id={"menu-"+value} className="menu-item"
            onMouseDown={this.handleMenuMouseDown}> {value} </div>
        })
      }
    </div>
  }

  private handleMenuMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    const target = e.currentTarget.id;
    const id = target.substring(5, target.length);

    if (!this.subMenu)
    {
      this.subMenu = id;
      this.forceUpdate();
    }
    else
    {
      this.subMenu = null;
      this.setState({showMenu: false});
      this.createNewNode(id);
    }
  }

  // Do nothing - prevents browser context menu from showing
  private handleMenuContextMenu = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    e.preventDefault();
  }

  // Do nothing - prevents browser context menu from showing
  private handleContextMenu = (e: React.MouseEvent<SVGSVGElement>) =>
  {
    e.preventDefault();
  }

  private handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) =>
  {
    e.preventDefault();

    if (e.button === 2)
    {
      this.subMenu = null;
      this.mouseClick = {x: e.pageX, y: e.pageY};
      this.setState({showMenu: true});
    }
    else
    {
      this.subMenu = null;
      this.setState({showMenu: false});
    }
  }

  private createNewNode = (type: string) =>
  {
    let flag = false;

    while (!flag)
    {
      const node = this.graph.getNode(type+"-"+this.idCount);
      if (node)
      {
        this.idCount++;
      }
      else
      {
        flag = true;
      }
    }

    const id = type+"-"+this.idCount;

    graphData.createNode(id, type);

    // TODO: add new node to model without needing a full refresh
  }

  private removeNode = (id: string) =>
  {
    graphData.deleteNode(id);

    const node = this.graph.getNode(id);

    // Delete node and all of its edges from the model
    if (node)
    {
      const reverseEdges = node.getReverseEdges();
      const forwardEdges = node.getForwardEdges();

      reverseEdges.forEach((value: { inputId: string, src: Model.Node,
        srcOutput: string}) =>
      {
        this.graph.removeEdge(value.src.id, value.srcOutput, id, value.inputId);
      });

      forwardEdges.forEach((value: { outputId: string, dest: Model.Node,
        destInput: string}) =>
      {
        this.graph.removeEdge(id, value.outputId, value.dest.id,
          value.destInput);
      });

      this.graph.removeNode(id);
    }
  }

  private addEdge = (srcID: string, srcOutput: string, destID: string,
    destInput: string) =>
  {
    const src = this.graph.getNode(srcID);
    const output = src ? src.getOutputConnector(srcOutput) : null;

    if (src && output)
    {
      // Only add edge if there are no other connections between the same
      // connectors on the same nodes
      if (!src.getForwardEdges().some((value:{outputId: string, dest: Model.Node,
        destInput: string}) =>
        {
          if (value.outputId === srcOutput && value.dest.id === destID &&
            value.destInput === destInput)
          {
            return true;
          }
          else
          {
            return false;
          }
        }))
      {
        const edges = src.edgesFromConnector(output);
        edges.push({dest: destID, destInput});

        graphData.updateEdges(srcID, srcOutput, edges, () =>
          {
            this.graph.addEdge(srcID, srcOutput, destID, destInput);
            this.forceUpdate();
          });
      }
    }
  }

  private removeEdge = (srcID: string, srcOutput: string, destID: string,
    destInput: string, success?: ()=>void) =>
  {
    const src = this.graph.getNode(srcID);
    const output = src ? src.getOutputConnector(srcOutput) : null;

    if (src && output)
    {
      const edges = src.edgesFromConnector(output);
      const newEdges = edges.filter((value: {dest: string, destInput: string}) =>
        {
          return !(destID === value.dest && destInput === value.destInput);
        });

      graphData.updateEdges(srcID, srcOutput, newEdges, () =>
        {
          this.graph.removeEdge(srcID, srcOutput, destID, destInput);
          if (success)
          {
            success();
          }
          this.forceUpdate();
        });
    }
  }

  private moveEdge = (node: Model.Node, connectorId: string,
    e: MouseEvent, direction: string, selfRemove: (success: ()=>void) => void) =>
  {
    const connector = (direction === "output") ?
      node.getOutputConnector(connectorId) :
      node.getInputConnector(connectorId);

    if (connector)
    {
      selfRemove(() =>
        {
          this.graph.beginTransaction();
          this.newMovingConnectorEdge(node, connector, e, true);
        });
    }
  }

  private moveEdgeFromInput = (inNode: Model.Node, inConnector: Model.Connector,
    e: React.MouseEvent) =>
  {
    const reverse = inNode.getReverseEdges();
    let srcNode;
    let srcConnector;

    for (const edge of reverse)
    {
      if (edge.inputId === inConnector.id)
      {
        srcNode = edge.src;
        srcConnector = srcNode.getOutputConnector(edge.srcOutput);
        break;
      }
    }

    if (srcNode && srcConnector)
    {
      const sNode: Model.Node = srcNode;
      const sConnector: Model.Connector = srcConnector;
      this.removeEdge(sNode.id, sConnector.id, inNode.id, inConnector.id,
        () =>
        {
          this.graph.beginTransaction();
          this.newMovingConnectorEdge(sNode, sConnector, e, true);
        });
    }
  }

  private newMovingConnectorEdge = (node: Model.Node, connector: Model.Connector,
    e: React.MouseEvent | MouseEvent, transactionStarted: boolean) =>
  {
    window.addEventListener('mouseup', this.dropConnectorEdge);
    window.addEventListener('mousemove', this.moveConnectorEdge);

    if (!transactionStarted)
    {
      this.graph.beginTransaction();
    }

    // Create dummy node and connect to selected connector to simulate
    // moving unconnected edge
    const dummyNode = this.graph.addNode("dummynode","dummy");

    dummyNode.size = {w: 0, h: 0};

    const graphEle = document.getElementById("graph");
    const graphOffsetX = graphEle ? graphEle.getBoundingClientRect().left +
      window.scrollX : 0;
    const graphOffsetY = graphEle ? graphEle.getBoundingClientRect().top +
      window.scrollY : 0;

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

    dummyConnector.multiple = false;
    dummyConnector.position = {x: csize, y: csize};

    this.setState({ tempNodes: {dummy: dummyNode, real: node }});
    this.setState({ tempConnectors: {dummy: dummyConnector, real: connector}});

    this.forceUpdate();
  }

  private dropConnectorEdge = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.dropConnectorEdge);
    window.removeEventListener('mousemove', this.moveConnectorEdge);

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
      // selected connector, the same direction as the dummy connector and can
      // accept multiple connections (input only), then add a permanent
      // edge between selected connector and target connector.
      if (tconnector && tconnector.connector && tconnector.parent &&
        tconnector.connector.connectorType === rconnector.connectorType &&
        tconnector.connector.direction === dconnector.direction)
      {
        if (tconnector.connector.direction === "input")
        {
          if (tconnector.connector.multiple ||
            tconnector.parent.edgesFromConnector(tconnector.connector).length <
            1)
          {
            this.addEdge(rnode.id, rconnector.id, tconnector.parent.id,
              tconnector.connector.id);
          }
        }
        else
        {
          this.addEdge(tconnector.parent.id, tconnector.connector.id,
            rnode.id, rconnector.id);
        }
      }
    }

    this.setState({tempConnectors: null, tempNodes: null});

    this.graph.commitTransaction();

    this.forceUpdate();
  }

  private moveConnectorEdge = (e: MouseEvent) =>
  {
    // Move temp dummy node positioned so the connector is under the mouse
    if (this.state.tempNodes)
    {
      const dnode = this.state.tempNodes.dummy;

      const graphEle = document.getElementById("graph");
      const graphOffsetX = graphEle ? graphEle.getBoundingClientRect().left +
        window.scrollX : 0;
      const graphOffsetY = graphEle ? graphEle.getBoundingClientRect().top +
        window.scrollY : 0;

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

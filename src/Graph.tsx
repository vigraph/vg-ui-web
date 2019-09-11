import * as React from 'react';

import * as Model from './model';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils';

import './Graph.css';

import Connector from './Connector';
import Edge from './Edge';
import Node from './Node';
import Menu from './Menu';
import Info from './Info';

const csize: number = 5;
const zoomFactor: number = 1.1;
const viewDefault: {x: number, y: number, w: number, h: number} =
  {x: 0, y: 0, w: 5000, h: 5000};

interface IProps
{
  from?: any;
  notifyGraphRoot: (graphRoot: boolean) => void;
}

interface IState
{
  tempNodes: {dummy: Model.Node, real: Model.Node} | null,
  tempConnectors:{ dummy: Model.Connector,  real: Model.Connector} | null,
  targetConnector: { connector: Model.Connector, parent: Model.Node } | null,
  showMenu: boolean,
  showInfo: Model.Node | null,
  view: {x: number, y: number, w: number, h: number}
}

export default class Graph extends React.Component<IProps, IState>
{
  private graphs: Model.Graph[] = [];
  private graphIndex: number = -1;
  private mouseClick: {x: number, y: number};
  private idCount: number;
  private graphRef: SVGSVGElement | null;
  private currentGraphPath: Array<{path: string, pathSpecific?: string}>;
  private firstLoad: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.graph = new Model.Graph();

    if (props.from)
    {
      // Note we load the graph directly, not doing forceUpdate()
      this.graph.loadFrom(props.from);
    }
    else
    {
      vgData.generateGraph((json:any) =>
        {
          this.graph.loadFrom(json);
          this.forceUpdate();
        });
    }

    this.state =
    {
      tempNodes: null,
      tempConnectors: null,
      targetConnector: null,
      showMenu: false,
      showInfo: null,
      view: viewDefault
    };

    this.mouseClick = {x: 0, y: 0};
    this.idCount = 0;
    this.graphRef = null;
    this.firstLoad = true;
    this.currentGraphPath = [];
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
    const view = this.state.view;

    return (
      <div className="wrapper">
        {this.state.showMenu && <Menu position={this.mouseClick}
          menuClosed={this.menuClosed}
          menuItemSelected={this.menuItemSelected}/>}

        {this.state.showInfo && <Info graph={this.graph}
          node={this.state.showInfo} deleteNode={this.removeNode}/>}

        <svg id="graph"
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          ref={(ref) => { this.graphRef = ref; }}
          onMouseDown={this.handleGraphMouseDown}
          onContextMenu={this.handleContextMenu}
          onWheel={this.handleMouseWheel}>
          <svg id="edges">
            {
              this.graph.getNodes().map((node: Model.Node, i) =>
              {
                return node.getForwardEdges().map(
                  (edge: {outputId: string, dest: Model.Node, destInput: string},
                    index) =>
                  {
                    return edge.dest.id !== "dummynode" ?
                      this.createEdgeComponent(node, edge,
                      node.path+":"+i+","+index) : "";
                  });
              })
            }
          </svg>
          <svg id="nodes">
            {
              this.graph.getNodes().map((node: Model.Node, i) =>
              {
                return node.id !== "dummynode" ?
                  this.createNodeComponent(node, i) : "";
              })
            }
          </svg>
          {this.createDummyNode()}
          }
        </svg>
      </div>
    );
  }

  private createNodeComponent = (node: Model.Node, i: number) =>
  {
    return <Node key={node.path+":"+i} node={node}
      startUpdate={this.startUpdate} update={this.movementUpdate}
      endUpdate={this.endUpdate} padding={csize*2} graphRef={this.graphRef}
      removeNode={this.removeNode} showNodeGraph={this.showNodeGraph}
      showNodeInfo={this.showNodeInfo}>
      {
        this.graph.getNodeConnectors(node.id, "input").map(
        (connector: Model.Connector, j) =>
        {
          return <Connector key={j} parent={node} connector={connector}
            inputConnectorSelected={this.moveEdgeFromInput}
            outputConnectorSelected={this.newMovingConnectorEdge}
            updateTargetConnector={this.updateTargetConnector}
            radius={csize} position={node.getConnectorPosition(connector)}/>
        })}
      {
        this.graph.getNodeConnectors(node.id, "output").map(
        (connector: Model.Connector, j) =>
        {
          return <Connector key={j} parent={node} connector={connector}
            inputConnectorSelected={this.moveEdgeFromInput}
            outputConnectorSelected={this.newMovingConnectorEdge}
            updateTargetConnector={this.updateTargetConnector}
            radius={csize} position={node.getConnectorPosition(connector)}/>
        })}
    </Node>
  }

  private createEdgeComponent = (node: Model.Node, edge?: {outputId: string,
    dest: Model.Node, destInput: string}, key?: string) =>
  {
    if (edge)
    {
      return <Edge key={key} src={node} srcOutput={edge.outputId}
        dest={edge.dest} destInput={edge.destInput} offset={csize}
        graphRef={this.graphRef} removeEdge={this.removeEdge}
        moveEdge={this.moveEdge}/>
    }
  }

  private createDummyNode = () =>
  {
    if (this.state.tempNodes)
    {
      return <svg id="dummynode">
        {this.createNodeComponent(this.state.tempNodes.dummy, 0)}
        {this.createEdgeComponent(this.state.tempNodes.real,
          this.state.tempNodes.real.getForwardEdges().find(x => x.dest.id ===
          "dummynode"), "0")}
      </svg>
    }
  }

  // Centre graph in display on first load
  public componentDidUpdate()
  {
    if (this.firstLoad)
    {
      this.firstLoad = false;

      const nodes = this.graph.getNodes();

      if (nodes.length === 0)
      {
        return;
      }

      let min = {...nodes[0].position};
      let max = {x: nodes[0].position.x + nodes[0].size.w,
        y: nodes[0].position.y + nodes[0].size.h};

      nodes.forEach((node: Model.Node, index: number) =>
        {
          let nodeX = node.position.x;
          let nodeY = node.position.y;
          let nodeW = node.size.w;
          let nodeH = node.size.h;

          min.x = nodeX < min.x ? nodeX : min.x;
          min.y = nodeY < min.y ? nodeY : min.y;
          max.x = nodeX + nodeW > max.x ? nodeX + nodeW : max.x;
          max.y = nodeY + nodeH > max.y ? nodeY + nodeH : max.y;
        });

      const centre = {x: (min.x + max.x)/2, y: (min.y + max.y)/2};
      const screenCentreSVG = vgUtils.windowToSVGPosition(
        {x: window.innerWidth/2, y: window.innerHeight/2}, this.graphRef);

      const newView = Object.assign({}, this.state.view);
      newView.x = -(screenCentreSVG.x - centre.x);
      newView.y = -(screenCentreSVG.y - centre.y);
      this.setState({view: newView});
    }
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

  public goBack = () =>
  {
    if (this.graphIndex > 0)
    {
      this.graphIndex--;

      this.currentGraphPath.pop();

      this.firstLoad = true;
      this.setState({view: viewDefault});

      this.props.notifyGraphRoot(this.graphIndex < 1);
    }
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

  //============================================================================
  // Mouse click/move functions
  //============================================================================

  // Do nothing - prevents browser context menu from showing
  private handleContextMenu = (e: React.MouseEvent<SVGSVGElement>) =>
  {
    e.preventDefault();
  }

  // Mouse wheel to zoom in/out
  private handleMouseWheel = (e: React.WheelEvent<SVGSVGElement>) =>
  {
    e.preventDefault();

    const scale = -1 * Math.sign(e.deltaY) > 0 ? 1 / zoomFactor : zoomFactor;

    const startPoint = vgUtils.windowToSVGPosition({x: e.pageX, y: e.pageY},
      this.graphRef);

    const newView = Object.assign({}, this.state.view);

    newView.x -= (startPoint.x - newView.x) * (scale - 1);
    newView.y -= (startPoint.y - newView.y) * (scale - 1);
    newView.w *= scale;
    newView.h *= scale;

    this.setState({view: newView});
  }

  private handleGraphMouseDown = (e: React.MouseEvent<SVGSVGElement>) =>
  {
    e.preventDefault();
    this.mouseClick = {x: e.pageX, y: e.pageY};

    if (e.button === 2 && !this.state.showMenu)
    {
      this.setState({showMenu: true});
    }
    else
    {
      if (this.state.showMenu)
      {
        this.setState({showMenu: false});
      }

      this.clearInfo();

      window.addEventListener('mousemove', this.handleGraphDrag);
      window.addEventListener('mouseup', this.handleGraphDragRelease);
    }
  }

  // Move/scroll graph by dragging background
  private handleGraphDrag = (e: MouseEvent) =>
  {
    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.graphRef);

    const svgMouseClick = vgUtils.windowToSVGPosition(
      {x: this.mouseClick.x, y: this.mouseClick.y}, this.graphRef);

    const diffX = Math.round(currentPosition.x - svgMouseClick.x);
    const diffY = Math.round(currentPosition.y - svgMouseClick.y);

    const newView = Object.assign({}, this.state.view);
    newView.x = newView.x - diffX;
    newView.y = newView.y - diffY;

    this.mouseClick = {x: e.pageX, y: e.pageY};

    this.setState({view: newView});
  }

  private handleGraphDragRelease = (e: MouseEvent) =>
  {
    window.removeEventListener('mousemove', this.handleGraphDrag);
    window.removeEventListener('mouseup', this.handleGraphDragRelease);
  }

  //============================================================================
  // Menu functions
  //============================================================================

  private menuClosed = () =>
  {
    this.setState({showMenu: false});
  }

  private menuItemSelected = (id: string) =>
  {
    this.createNewNode(id);
  }

  //============================================================================
  // Node/Edge functions
  //============================================================================

  private showNodeInfo = (node: Model.Node) =>
  {
    if (!this.state.showInfo || node.id !== this.state.showInfo.id)
    {
      this.setState({showInfo: node});
    }
  }

  private clearInfo = () =>
  {
    if (this.state.showInfo)
    {
      this.setState({showInfo: null});
    }
  }

  private showNodeGraph = (path: string, pathSpecific?: string,
    sourceSpecific?: string) =>
  {
    this.clearInfo();

    this.currentGraphPath.push({path, pathSpecific});

    this.graph = new Model.Graph();

    const sourcePath = path + (sourceSpecific ? sourceSpecific : "");
    const parentPath = path + (pathSpecific ? pathSpecific : "");

    vgData.generateGraph((json:any) =>
      {
        // Reset View
        this.firstLoad = true;
        this.graph.loadFrom(json);
        this.setState({view: viewDefault});
      },
      {sourcePath, parentPath});
  }

  private createNewNode = (type: string) =>
  {
    this.graph.beginTransaction();
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

    const currGraphPathLen = this.currentGraphPath.length;

    let path: string | undefined;

    if (currGraphPathLen === 0)
    {
      path = undefined;
    }
    else
    {
      const currentPath = this.currentGraphPath[currGraphPathLen-1];
      path = currentPath.pathSpecific ? (currentPath.path +
        currentPath.pathSpecific) : currentPath.path;
    }

    // Create new node, get with properties etc, add layout data and add to
    // graph model
    vgData.createNode(id, type, path, () =>
      {
        vgData.getNode(id, path, (node: any) =>
        {
          const svgMouseClick = vgUtils.windowToSVGPosition(
            {x: this.mouseClick.x, y: this.mouseClick.y}, this.graphRef);
          node.x = svgMouseClick.x;
          node.y = svgMouseClick.y;

          vgData.updateLayout(node.path,
            {x: svgMouseClick.x, y: svgMouseClick.y});

          this.graph.addNodeFromJSON(node);
          this.forceUpdate();

          this.graph.commitTransaction();
        })
      });
  }

  private removeNode = (node: Model.Node) =>
  {
    this.graph.beginTransaction();

    this.clearInfo();

    vgData.deleteNode(node.path);

    // Delete node and all of its edges from the model
    const reverseEdges = node.getReverseEdges();
    const forwardEdges = node.getForwardEdges();

    reverseEdges.forEach((value: { inputId: string, src: Model.Node,
      srcOutput: string}) =>
    {
      this.graph.removeEdge(value.src.id, value.srcOutput, node.id,
        value.inputId);
    });

    forwardEdges.forEach((value: { outputId: string, dest: Model.Node,
      destInput: string}) =>
    {
      this.graph.removeEdge(node.id, value.outputId, value.dest.id,
        value.destInput);
    });

    this.graph.removeNode(node.id);

    this.graph.commitTransaction();
    this.forceUpdate();
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

        vgData.updateEdges(src.path, srcOutput, edges, () =>
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

      vgData.updateEdges(src.path, srcOutput, newEdges, () =>
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
          this.newMovingConnectorEdge(node, connector, e);
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
      e.persist();
      this.removeEdge(sNode.id, sConnector.id, inNode.id, inConnector.id,
        () =>
        {
          this.newMovingConnectorEdge(sNode, sConnector, e);
        });
    }
  }

  private newMovingConnectorEdge = (node: Model.Node, connector: Model.Connector,
    e: React.MouseEvent | MouseEvent) =>
  {
    window.addEventListener('mouseup', this.dropConnectorEdge);
    window.addEventListener('mousemove', this.moveConnectorEdge);

    this.graph.beginTransaction();

    // Create dummy node and connect to selected connector to simulate
    // moving unconnected edge
    const dummyNode = this.graph.addNode("dummynode","dummy");

    dummyNode.size = {w: 0, h: 0};

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.graphRef);

    dummyNode.position = {x: currentPosition.x - (2*csize),
      y: currentPosition.y}

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

    this.setState({ tempNodes: {dummy: dummyNode, real: node }});
    this.setState({ tempConnectors: {dummy: dummyConnector, real: connector}});
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
      // selected connector (or "any"), the same direction as the dummy
      // connector and can accept multiple connections (input only), then add
      // a permanent edge between selected connector and target connector.
      if (tconnector && tconnector.connector && tconnector.parent &&
        (tconnector.connector.connectorType === rconnector.connectorType ||
        tconnector.connector.connectorType === "any" ||
        rconnector.connectorType === "any") &&
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

      const currentPosition = vgUtils.windowToSVGPosition(
        {x: e.pageX, y: e.pageY}, this.graphRef);

      dnode.position = {x: currentPosition.x - (2*csize),
        y: currentPosition.y};

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

  private get graph(): Model.Graph
  {
    return this.graphs[this.graphIndex];
  }

  private set graph(graph: Model.Graph)
  {
    // Move forward
    this.graphIndex++;

    if (this.graphs.length > this.graphIndex)
    {
      this.graphs = this.graphs.slice(0, this.graphIndex);
    }

    this.props.notifyGraphRoot(this.graphIndex < 1);

    this.graphs.push(graph);
  }

}

import * as React from 'react';

import * as Model from './model';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils';
import { vgConfig } from './lib/Config';
import * as vgTypes from './lib/Types';

import './Graph.css';

import Connector from './Connector';
import Edge from './Edge';
import Node from './Node';
import KnobNode from './KnobNode';
import SliderNode from './SliderNode';
import Menu from './Menu';
import InfoPanel from './InfoPanel';
import WebsocketDisplay from './WebsocketDisplay'

interface IProps
{
  from?: any;
  notifyGraphRoot: (graphRoot: boolean) => void;
}

interface IState
{
  tempNodes: { dummy: Model.Node, real: Model.Node } | null,
  tempConnectors:{ dummy: Model.Connector,  real: Model.Connector } | null,
  targetNode: Model.Node | null,
  targetConnector: { connector: Model.Connector, parent: Model.Node } | null,
  targetIcon: {name: string, position: {x: number, y: number}} | null,
  menuState: string,
  infoState: string,
  wsDisplays: Array<{id: string, port: number, pinned: boolean, position:
    {x: number, y: number}}>
  view: { x: number, y: number, w: number, h: number },
  pointerDown: boolean
}

export default class Graph extends React.Component<IProps, IState>
{
  private graph: Model.Graph;
  private pointerClick: {x: number, y: number, t: number};
  private idCount: number;
  private graphRef: SVGSVGElement | null;
  private firstLoad: boolean;
  private csize: number;
  private pointerCache: any[];
  private pointerDiff: number;

  constructor(props: IProps)
  {
    super(props);

    this.graph = new Model.Graph();

    if (props.from)
    {
      // Note we load the graph directly, not doing forceUpdate()
      this.graph.loadFrom(props.from, true, "graph");
    }
    else
    {
      vgData.startUp(() =>
        {
          vgData.generateGraph("graph", (json:any) =>
            {
              this.graph.loadFrom(json, true, "graph");
              this.forceUpdate();
            });
        });
    }

    this.state =
    {
      tempNodes: null,
      tempConnectors: null,
      targetNode: null,
      targetConnector: null,
      targetIcon: null,
      menuState: "hidden",
      infoState: "hidden",
      view: vgConfig.Graph.viewDefault,
      pointerDown: false,
      wsDisplays: []
    };

    this.pointerClick = {x: 0, y: 0, t: 0};
    this.idCount = 0;
    this.graphRef = null;
    this.firstLoad = true;
    this.csize = vgConfig.Graph.connector.size;
    this.pointerCache = [];
    this.pointerDiff = 0;
  }

  public render()
  {
    const view = this.state.view;
    const pointerPos = {x: this.pointerClick.x, y: this.pointerClick.y};

    return (
      <div className="wrapper">
        <Menu graphDisplay={this.state.menuState}
          position={pointerPos}
          menuStateUpdate={this.menuStateUpdate}
          menuItemSelected={this.menuItemSelected}/>

        {this.state.infoState !== "hidden" && <InfoPanel
          graph={this.graph} node={this.state.targetNode}
          startUpdate={this.startUpdate} update={this.update}
          endUpdate={this.endUpdate} pinInfo={this.pinInfo}
          dynamicNodeUpdate={this.dynamicNodeUpdate}/>}

        {this.state.wsDisplays.map((ws: {id: string, port: number,
          pinned: boolean, position: {x: number, y: number}},
          index: number) =>
          {
            return <WebsocketDisplay id={ws.id} key={"ws-display-"+index}
              port={ws.port} pinDisplay={this.pinWSDisplay}
              removeDisplay={this.removeWebsocketDisplay}
              startPosition={ws.position}/>
          })}

        <svg id="graph"
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          ref={(ref) => { this.graphRef = ref; }} touch-action="none"
          onPointerDown={this.handleGraphPointerDown}
          onContextMenu={this.handleContextMenu}
          onWheel={this.handleMouseWheel}>
          <svg id="edges">
            {
              this.graph.getNodes().map((node: Model.Node, i) =>
              {
                return node.getForwardEdges().map(
                  (edge: {outputId: string, dest: Model.Node,
                    destInput: string}, index) =>
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
          {this.createConnectorLabel(this.state.targetConnector)}
          {this.createIconLabel()}
        </svg>
      </div>
    );
  }

  private createNodeComponent = (node: Model.Node, i: number,
    hideHeader?: boolean) =>
  {
    const clearUI = this.state.pointerDown || (this.state.targetNode !== null &&
      this.state.targetNode.id !== node.id);

    let CNode = Node;
    switch (node.type)
    {
      case "control/knob":
        CNode = KnobNode;
      break;

      case "control/slider":
        CNode = SliderNode;
      break;
    }

    return <CNode key={node.path+":"+i} node={node}
      startUpdate={this.startUpdate} update={this.update}
      endUpdate={this.endUpdate} padding={this.csize*2} graphRef={this.graphRef}
      showNodeGraph={this.showNodeGraph} removeNode={this.removeNode}
      updateTargetNode={this.updateTargetNode}
      dynamicNodeUpdate={this.dynamicNodeUpdate}
      updateTargetIcon={this.updateTargetIcon}
      clearUI={clearUI}
      showWebsocketDisplay={this.showWebsocketDisplay}
      hideHeader={hideHeader}>
      {
        this.graph.getNodeConnectors(node.id, "input").map(
        (connector: Model.Connector, j) =>
        {
          // Don't create input connector for pin with output connected
          if (node.category !== "pin" || !node.getForwardEdges().length)
          {
            return <Connector key={j} parent={node} connector={connector}
              inputConnectorSelected={this.moveEdgeFromInput}
              outputConnectorSelected={this.newMovingConnectorEdge}
              updateTargetConnector={this.updateTargetConnector}
              radius={this.csize} nodePadding={this.csize*2}
              position={node.getConnectorPosition(connector)}/>
          }
          else
          {
            return "";
          }
        })}
      {
        this.graph.getNodeConnectors(node.id, "output").map(
        (connector: Model.Connector, j) =>
        {
          // Don't create output conntor for pin with input connected
          if (node.category !== "pin" || !node.getReverseEdges().length)
          {
            return <Connector key={j} parent={node} connector={connector}
              inputConnectorSelected={this.moveEdgeFromInput}
              outputConnectorSelected={this.newMovingConnectorEdge}
              updateTargetConnector={this.updateTargetConnector}
              radius={this.csize} nodePadding={this.csize*2}
              position={node.getConnectorPosition(connector)}/>
          }
          else
          {
            return "";
          }
        })}
    </CNode>
  }

  private createEdgeComponent = (node: Model.Node, edge?: {outputId: string,
    dest: Model.Node, destInput: string}, key?: string) =>
  {
    if (edge)
    {
      const oConnector = node.getOutputConnector(edge.outputId);
      const iConnector = edge.dest.getInputConnector(edge.destInput);

      if (oConnector && iConnector)
      {
        return <Edge key={key} src={node} srcOutput={oConnector}
          dest={edge.dest} destInput={iConnector} offset={this.csize}
          graphRef={this.graphRef} removeEdge={this.removeEdge}
          moveEdgeFromInput={this.moveEdgeFromInput}
          moveEdgeFromOutput={this.moveEdgeFromOutput}
          showConnectorLabel={this.createConnectorLabel}
          clearUI={this.state.pointerDown}/>
      }
    }
  }

  private createDummyNode = () =>
  {
    if (this.state.tempNodes)
    {
      return <svg id="dummynode">
        {this.createNodeComponent(this.state.tempNodes.dummy, 0, true)}
        {this.createEdgeComponent(this.state.tempNodes.real,
          this.state.tempNodes.real.getForwardEdges().find(x => x.dest.id ===
          "dummynode"), "0")}
      </svg>
    }
  }

  private createConnectorLabel = (label: {connector: Model.Connector,
    parent: Model.Node} | null) =>
  {
    if (label)
    {
      const node = label.parent;
      const connector = label.connector;

      const position = node.getConnectorPosition(connector);

      const x = node.position.x + position.x;
      const y = node.position.y + position.y;

      const fontSize = vgConfig.Graph.fontSize.connectorLabel;

      let displayID = connector.id;

      if (node.category === "subgraph")
      {
        const layout = vgData.getLayoutByID(node.path + "/" + connector.id);

        displayID = (layout && layout.n ? layout.n : displayID);
      }

      const textBox = vgUtils.textBoundingSize(displayID, fontSize);

      if (connector.direction === "input")
      {
        return <svg className="connector-label-wrapper input"
          x={x - textBox.width} y={y - ((textBox.height + 8) / 2)}>
          <rect className="connector-label-border" height={textBox.height+8}
            width={textBox.width+8} x={0} y={0}/>
          <text className="label connector-label input"
            fontSize={fontSize} x={4} y={textBox.height}>
            {displayID}
          </text>
          </svg>
      }
      else
      {
        return <svg className="connector-label-wrapper output"
          x={x + (3 * this.csize) + 1} y={y - ((textBox.height + 8) / 2)}>
          <rect className="connector-label-border" height={textBox.height+8}
            width={textBox.width+8} x={0} y={0}/>
          <text className="label connector-label output"
            fontSize={fontSize} x={4} y={textBox.height}>
            {displayID}
          </text>
          </svg>
      }
    }
  }

  private createIconLabel = () =>
  {
    if (this.state.targetIcon)
    {
      const icon = this.state.targetIcon;
      const fSize = vgConfig.Graph.fontSize.iconLabel;
      const name = vgUtils.capitaliseFirstLetter(icon.name);
      const nameSize = vgUtils.textBoundingSize(name, fSize);

      return <svg className={"icon-label-wrapper"}
        x={icon.position.x}
        y={icon.position.y}>
        <rect className="icon-label-border" x={0} y={0}
          height={nameSize.height+4} width={nameSize.width+4}/>
          <text className="label icon-label" fontSize={fSize} x={2} y={3}>
            {name}
          </text>
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

    // Clear the target node if the node shown no longer exists after undo
    if (this.state.targetNode && !this.graph.getNode(this.state.targetNode.id))
    {
      this.updateTargetNode();
    }

    this.props.notifyGraphRoot(this.graph.graphIsRoot());
    this.forceUpdate();
  }

  public redo = () =>
  {
    this.graph.redo();

    // Clear the target node if the node shown no longer exists after redo
    if (this.state.targetNode && !this.graph.getNode(this.state.targetNode.id))
    {
      this.updateTargetNode();
    }

    this.props.notifyGraphRoot(this.graph.graphIsRoot());
    this.forceUpdate();
  }

  // Clear Graph and Layout data and reload
  public clear = () =>
  {
    this.updateTargetNode();
    this.setState({infoState: "hidden", menuState: "hidden"});

    if (window.confirm(vgConfig.Strings.clearGraph))
    {
      vgData.clear(() =>
        {
          vgData.generateGraph("graph", (json:any) =>
            {
              this.graph.loadFrom(json, true, "graph");
              this.forceUpdate();
            });
        });
    }
  }

  public goBack = () =>
  {
    this.updateTargetNode();
    this.graph.back(() =>
      {
        this.props.notifyGraphRoot(this.graph.graphIsRoot());
        this.resetView();
      });
  }

  private resetView = () =>
  {
    this.firstLoad = true;
    this.setState({view: vgConfig.Graph.viewDefault});
  }

  private startUpdate = () =>
  {
    this.graph.beginTransaction();
  }

  private update = () =>
  {
    this.forceUpdate();
  }

  private endUpdate = () =>
  {
    this.graph.commitTransaction();
  }

  public save = () =>
  {
    vgData.getGraphToStore((graphJSON: vgTypes.ICombinedGraph) =>
    {
      const saveJSON = JSON.stringify(graphJSON);
      vgUtils.saveToFile(saveJSON);
    });
  }

  public load = (fileInputID: string) =>
  {
    this.updateTargetNode();
    this.setState({infoState: "hidden", menuState: "hidden"});

    vgUtils.loadFromFile(fileInputID, (fileContents: string) =>
      {
        const graphJSON: vgTypes.ICombinedGraph = JSON.parse(fileContents);

        vgData.loadGraphJSON(graphJSON, () =>
        {
          vgData.generateGraph("graph", (json:any) =>
          {
            this.graph.loadFrom(json, true, "graph");
            this.resetView();
            this.forceUpdate();
          });
        });

      });
  }

  //============================================================================
  // Mouse/Pointer click/move functions
  //============================================================================

  // Do nothing - prevents browser context menu from showing
  private handleContextMenu = (e: React.MouseEvent<SVGSVGElement>) =>
  {
    e.preventDefault();
  }

  // Zoom view around given centre point
  private zoomView = (zoomCentre: {x: number, y: number}, direction: number) =>
  {
    const zoomFactor = vgConfig.Graph.zoomFactor;
    const scale = -1 * Math.sign(direction) > 0 ? 1 / zoomFactor : zoomFactor;

    const startPoint = vgUtils.windowToSVGPosition(zoomCentre, this.graphRef);

    const newView = Object.assign({}, this.state.view);

    newView.x -= (startPoint.x - newView.x) * (scale - 1);
    newView.y -= (startPoint.y - newView.y) * (scale - 1);
    newView.w *= scale;
    newView.h *= scale;

    this.setState({view: newView});
  }

  // Mouse wheel to zoom in/out
  private handleMouseWheel = (e: React.WheelEvent<SVGSVGElement>) =>
  {
    this.zoomView({x: e.pageX, y: e.pageY}, e.deltaY);
  }

  private handleGraphPointerDown = (e: React.PointerEvent<SVGSVGElement>) =>
  {
    e.preventDefault();
    e.persist();

    // Store pointer down time to track long press, unless multiple pointer
    // points down (touch pinch to zoom)
    const date = new Date();
    this.pointerClick = {x: e.pageX, y: e.pageY, t: date.getTime()};

    if (this.pointerCache.length > 1)
    {
      this.pointerClick.t = 0;
    }

    if (e.button === 2 && this.state.menuState === "hidden")
    {
      this.setState({menuState: "show"});
    }
    else
    {
      const menuState = this.state.menuState === "show" ? "hidden" :
        this.state.menuState;
      const infoState = this.state.infoState === "show" ? "hidden" :
        this.state.infoState;

      this.pointerCache.push(e);

      const pointerDown = true;

      // Hide (remove) all unpinned websocket display
      const wsDisplays = this.state.wsDisplays.filter(
        (wsDisplay: {id: string, port: number, pinned: boolean}) =>
        {
          return wsDisplay.pinned;
        });

      this.setState({menuState, infoState, pointerDown, wsDisplays});

      window.addEventListener('pointermove', this.handleGraphDrag);
      window.addEventListener('pointerup', this.handleGraphDragRelease);
    }
  }

  // Move/scroll graph by dragging background
  private handleGraphDrag = (e: PointerEvent) =>
  {
    // Reset pointer time so long press isn't triggered on graph drag
    this.pointerClick.t = 0;

    // Find this event in the cache and update its record with this event
    for (var i = 0; i < this.pointerCache.length; i++)
    {
      if (e.pointerId === this.pointerCache[i].pointerId)
      {
        this.pointerCache[i] = e;
        break;
      }
    }

    // Multiple points - touch pinch zoom instead of graph drag
    if (this.pointerCache.length > 1)
    {
      const x1 = this.pointerCache[1].clientX;
      const x2 = this.pointerCache[0].clientX;
      const y1 = this.pointerCache[1].clientY;
      const y2 = this.pointerCache[0].clientY;

      const curDiff = Math.hypot(x1 - x2, y1 - y2);
      const cX = (x1 + x2) / 2;
      const cY = (y1 + y2) / 2;

      const moveDiff = this.pointerDiff - curDiff;

      if (this.pointerDiff > 0)
      {
        this.zoomView({x: cX, y: cY}, moveDiff);
      }

      this.pointerDiff = curDiff;
    }
    else
    {
      const currentPosition = vgUtils.windowToSVGPosition(
        {x: e.pageX, y: e.pageY}, this.graphRef);

      const svgPointerClick = vgUtils.windowToSVGPosition(
        {x: this.pointerClick.x, y: this.pointerClick.y}, this.graphRef);

      const diffX = Math.round(currentPosition.x - svgPointerClick.x);
      const diffY = Math.round(currentPosition.y - svgPointerClick.y);

      const newView = Object.assign({}, this.state.view);
      newView.x = newView.x - diffX;
      newView.y = newView.y - diffY;

      this.pointerClick = {...this.pointerClick, ...{x: e.pageX, y: e.pageY}};

      this.setState({view: newView});
    }
  }

  private handleGraphDragRelease = (e: PointerEvent) =>
  {
    const date = new Date();
    const pointerDuration = date.getTime() - this.pointerClick.t;

    // Show menu on single long press
    if (this.pointerClick.t && pointerDuration >
      (vgConfig.Graph.longPressTime * 1000) && this.state.menuState === "hidden")
    {
      this.setState({menuState: "show"});
    }

    // Remove pointer event from cache
    for (let i = 0; i < this.pointerCache.length; i++)
    {
      if (e.pointerId === this.pointerCache[i].pointerId)
      {
        this.pointerCache.splice(i, 1);
      }
    }

    if (this.pointerCache.length < 1)
    {
      this.pointerDiff = 0;
      window.removeEventListener('pointermove', this.handleGraphDrag);
      window.removeEventListener('pointerup', this.handleGraphDragRelease);
      this.setState({pointerDown: false});
    }
  }

  //============================================================================
  // UI Panel (Menu, Info and Websocket Display) functions
  //============================================================================

  private menuStateUpdate = (menuState: string) =>
  {
    this.setState({menuState});
  }

  private menuItemSelected = (id: string, position?: {x: number, y: number}) =>
  {
    this.createNewNode(id, position);
  }

  private pinInfo = (pin: boolean) =>
  {
    this.setState({infoState: (pin ? "pinned" : "show")});
  }

  private showWebsocketDisplay = (id: string, port: number,
    position: {x: number, y: number}) =>
  {
    const currentWS = this.state.wsDisplays;

    if (!currentWS.find(x => x.id === id))
    {
      currentWS.push({id, port, pinned: false, position});
      this.setState({wsDisplays: currentWS});
    }
  }

  private removeWebsocketDisplay = (id: string) =>
  {
    const newWS = this.state.wsDisplays;

    const index = newWS.findIndex(x => x.id === id);

    if (index >= 0)
    {
      newWS.splice(index, 1);
      this.setState({wsDisplays: newWS});
    }
  }

  private pinWSDisplay = (pinned: boolean, id?: string) =>
  {
    if (id)
    {
      const updatedWS = this.state.wsDisplays;

      const index = updatedWS.findIndex(x => x.id === id);

      updatedWS[index].pinned = pinned;

      this.setState({wsDisplays: updatedWS});
    }
  }

  //============================================================================
  // Node/Edge functions
  //============================================================================

  private showNodeGraph = (path: string) =>
  {
    this.updateTargetNode();

    vgData.generateGraph(path, (json:any) =>
      {
        // Reset View
        this.graph.forward(json, path);
        this.resetView();
        this.props.notifyGraphRoot(false);
      });
  }

  private createNewNode = (type: string, position?: {x: number, y: number}) =>
  {
    this.graph.beginTransaction();
    let flag = false;

    const typeID = type.split("/")[1];

    while (!flag)
    {
      const node = this.graph.getNode(typeID + "-" + this.idCount);

      if (node)
      {
        this.idCount++;
      }
      else
      {
        flag = true;
      }
    }

    const id = typeID + "-" + this.idCount;

    // Create new node, get with properties etc, add layout data and add to
    // graph model
    vgData.createNode(id, type, this.graph.getGraphID(),
      () =>
      {
        vgData.getNode(id, this.graph.getGraphID(), (node: any) =>
        {
          const svgPointerClick = vgUtils.windowToSVGPosition(
            (position?position:this.pointerClick), this.graphRef);
          node.x = svgPointerClick.x;
          node.y = svgPointerClick.y;

          vgData.updateLayout(node.path,
            {x: svgPointerClick.x, y: svgPointerClick.y});

          this.graph.addNodeFromJSON(node);
          this.forceUpdate();

          this.graph.commitTransaction();
        }, () =>
        {
          this.graph.commitTransaction();
        })
      },
      () =>
      {
        this.graph.commitTransaction();
      });
  }

  private removeNode = (node: Model.Node) =>
  {
    this.graph.beginTransaction();

    if (this.state.targetNode && node.id === this.state.targetNode.id)
    {
      this.updateTargetNode();
    }

    vgData.deleteNode(node.path,
      () =>
      {
        this.removeNodeFromModel(node, () =>
        {
          this.graph.commitTransaction();
          this.forceUpdate();
        });
      },
      () =>
      {
        this.graph.commitTransaction();
      });
  }

  private removeNodeFromModel = (node: Model.Node, success: () => void) =>
  {
    // Delete node and all of its edges from the model
    const reverseEdges = node.getReverseEdges();
    const forwardEdges = node.getForwardEdges();

    reverseEdges.forEach((value: { inputId: string, src: Model.Node,
      srcOutput: string}) =>
    {
      this.removeEdgefromModel(value.src.id, value.srcOutput, node.id,
        value.inputId, false);
    });

    const fEdges = forwardEdges.length;
    let updateCount = 0;

    const finished = () =>
    {
      this.graph.removeNode(node.id);

      success();
    }

    if (fEdges)
    {
      forwardEdges.forEach((value: { outputId: string, dest: Model.Node,
        destInput: string}) =>
      {
        this.removeEdgefromModel(node.id, value.outputId, value.dest.id,
          value.destInput, false);

        // Input no longer has connection so update its value
        this.updatePropertyValue(value.dest, value.destInput, () =>
          {
            updateCount++;
            if (updateCount === fEdges)
            {
              finished();
            }
          });
      });
    }
    else
    {
      finished();
    }
  }

  private removeEdgefromModel = (srcID: string, srcOutput: string,
    destID: string, destInput: string, updateProp: boolean,
    success?: () => void) =>
  {
    const src = this.graph.getNode(srcID);
    const dest = this.graph.getNode(destID);

    this.graph.removeEdge(srcID, srcOutput, destID, destInput);

    if (src && src.category === "pin")
    {
      this.updateGraphPin(src, "output");
    }

    if (dest)
    {
      if (dest.category === "pin")
      {
        this.updateGraphPin(dest, "input");
      }

      if (updateProp)
      {
        // Edge connection to input removed so update property value
        this.updatePropertyValue(dest, destInput, () =>
        {
          if (success)
          {
            success();
          }
          this.forceUpdate();
        })
      }
    }
  }

  // Get property value from the engine and update model property value
  private updatePropertyValue(node: Model.Node, propID: string,
    success?: () => void)
  {
    vgData.getPropertyValue(node.path, propID,
        (propValue: any) =>
        {
          const prop = node.getProperties().find(x => x.id === propID);
          if (prop)
          {
            prop.value = propValue;
          }

          if (success)
          {
            success();
          }
        });
  }

  // Update dynamic node by removing the node from the model and recreating
  private dynamicNodeUpdate = (updateNode: Model.Node, finished?: () => void) =>
  {
    vgData.getNode(updateNode.id, this.graph.getGraphID(),
      (node: any) =>
      {
        this.graph.addNodeFromJSON(node);

        const newNode = this.graph.getNode(node.id);

        // Remove any edges that have connectors that no longer exist
        if (newNode)
        {
          newNode.getReverseEdges().forEach((rEdge: {inputId: string,
            src: Model.Node, srcOutput: string}) =>
          {
            if (!newNode.getInputConnector(rEdge.inputId))
            {
              this.removeEdgefromModel(rEdge.src.id, rEdge.srcOutput,
                newNode.id, rEdge.inputId, false);
            }
          })

          newNode.getForwardEdges().forEach((fEdge: {outputId: string,
            dest: Model.Node, destInput: string}) =>
          {
            if (!newNode.getOutputConnector(fEdge.outputId))
            {
              this.removeEdgefromModel(newNode.id, fEdge.outputId,
                fEdge.dest.id, fEdge.destInput, true,
                () => { this.forceUpdate(); });
            }
          });
        }

        this.forceUpdate();
        if (finished)
        {
          finished();
        }
      }, finished);
  }

  // Update graph pin direction based on connected edges
  private updateGraphPin = (node: Model.Node, direction: string) =>
  {
    const num = (direction === "input" ? node.getReverseEdges().length :
      node.getForwardEdges().length);

    // Pin has no edges so must have had its input/output edge removed
    // Reset pin direction
    if (num === 0)
    {
      vgData.nonPropertyDelete(node.id, this.graph.getGraphID());
    }
    // Pin now has a single edge connected so set pin direction based on
    // connection
    else if (num === 1)
    {
      const pinDirection = (direction === "input" ? "out" : "in");
      vgData.nonPropertyPost(node.id, {direction: pinDirection},
        this.graph.getGraphID());
    }
  }

  private addEdge = (srcID: string, srcOutput: string, destID: string,
    destInput: string, finished: () => void) =>
  {
    const src = this.graph.getNode(srcID);
    const dest = this.graph.getNode(destID);
    const output = src ? src.getOutputConnector(srcOutput) : null;

    if (src && dest && output)
    {
      // Only add edge if there are no other connections between the same
      // connectors on the same nodes
      if (!src.getForwardEdges().some((value:{outputId: string,
        dest: Model.Node, destInput: string}) =>
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

            if (src.category === "pin")
            {
              this.updateGraphPin(src, "output");
            }
            else if (dest.category === "pin")
            {
              this.updateGraphPin(dest, "input");
            }

            finished();
          },
          finished);
      }
      else
      {
        finished();
      }
    }
    else
    {
      finished();
    }
  }

  private removeEdge = (srcID: string, srcOutput: string, destID: string,
    destInput: string, success?: ()=>void) =>
  {
    const src = this.graph.getNode(srcID);
    const dest = this.graph.getNode(destID);
    const output = src ? src.getOutputConnector(srcOutput) : null;

    if (src && dest && output)
    {
      const edges = src.edgesFromConnector(output);
      const newEdges = edges.filter((value: {dest: string,
        destInput: string}) =>
        {
          return !(destID === value.dest && destInput === value.destInput);
        });

      vgData.updateEdges(src.path, srcOutput, newEdges, () =>
        {
          this.removeEdgefromModel(srcID, srcOutput, destID, destInput, true,
            success);
        });
    }
  }

  private moveEdgeFromInput = (inNode: Model.Node, inConnector: Model.Connector,
    position: {x: number, y: number}) =>
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
      this.graph.beginTransaction();
      const sNode: Model.Node = srcNode;
      const sConnector: Model.Connector = srcConnector;
      this.removeEdge(sNode.id, sConnector.id, inNode.id, inConnector.id,
        () =>
        {
          this.newMovingConnectorEdge(sNode, sConnector, position, true);
        });
    }
  }

  private moveEdgeFromOutput = (outNode: Model.Node,
    outConnector: Model.Connector, position: {x: number, y: number}) =>
  {
    const forward = outNode.getForwardEdges();
    let destNode;
    let destConnector;

    for (const edge of forward)
    {
      if (edge.outputId === outConnector.id)
      {
        destNode = edge.dest;
        destConnector = destNode.getInputConnector(edge.destInput);
        break;
      }
    }

    if (destNode && destConnector)
    {
      this.graph.beginTransaction();
      const dNode: Model.Node = destNode;
      const dConnector: Model.Connector = destConnector
      this.removeEdge(outNode.id, outConnector.id, dNode.id, dConnector.id,
        () =>
        {
          this.newMovingConnectorEdge(dNode, dConnector, position, true);
        });
    }
  }

  private newMovingConnectorEdge = (node: Model.Node,
    connector: Model.Connector, position: {x: number, y: number},
    blockBeginTrans?: boolean) =>
  {
    if (this.graphRef)
    {
      this.graphRef.addEventListener('pointermove', this.moveConnectorEdge);
      this.graphRef.addEventListener('pointerup', this.dropConnectorEdge);
    }

    if (!blockBeginTrans)
    {
      this.graph.beginTransaction();
    }

    // Create dummy node and connect to selected connector to simulate
    // moving unconnected edge
    const dummyNode = this.graph.addNode("dummynode","dummy");

    dummyNode.size = {w: 0, h: 0};

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: position.x, y: position.y}, this.graphRef);

    dummyNode.position = {x: currentPosition.x - (2 * this.csize),
      y: currentPosition.y}

    let dummyConnector;

    if (connector.direction === "input")
    {
      dummyConnector = this.graph.addNodeOutput("dummynode","dummyconnector",
        connector.type);
      this.graph.addEdge(dummyNode.id, dummyConnector.id, node.id,
        connector.id);
    }
    else
    {
      dummyConnector = this.graph.addNodeInput("dummynode","dummyconnector",
        connector.type);
      this.graph.addEdge(node.id, connector.id, dummyNode.id,
        dummyConnector.id);
    }

    this.setState({ tempNodes: {dummy: dummyNode, real: node }});
    this.setState({ tempConnectors: {dummy: dummyConnector, real: connector}});
  }

  private dropConnectorEdge = (e: PointerEvent) =>
  {
    if (this.graphRef)
    {
      window.removeEventListener('pointerup', this.dropConnectorEdge);
      window.removeEventListener('pointermove', this.moveConnectorEdge);
    }

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

      const finished = () =>
      {
        this.setState({tempConnectors: null, tempNodes: null});

        this.graph.commitTransaction();

        this.forceUpdate();
      }

      // If the target connector has the same connector type as the previously
      // selected connector (or "any") and the same direction as the dummy
      // connector, then add a permanent edge between selected connector and
      // target connector.
      if (tconnector && tconnector.connector && tconnector.parent &&
        (tconnector.connector.type === rconnector.type ||
        tconnector.connector.type === "any" ||
        rconnector.type === "any") &&
        tconnector.connector.direction === dconnector.direction)
      {
        if (dconnector.direction === "input")
        {
          this.addEdge(rnode.id, rconnector.id, tconnector.parent.id,
            tconnector.connector.id, finished);
        }
        else
        {
          this.addEdge(tconnector.parent.id, tconnector.connector.id, rnode.id,
            rconnector.id, finished);
        }
      }
      else
      {
        finished();
      }
    }


  }

  private moveConnectorEdge = (e: PointerEvent) =>
  {
    e.preventDefault();
    // Move temp dummy node positioned so the connector is under the 'cursor'
    if (this.state.tempNodes)
    {
      const dnode = this.state.tempNodes.dummy;

      const currentPosition = vgUtils.windowToSVGPosition(
        {x: e.pageX, y: e.pageY}, this.graphRef);

      dnode.position = {x: currentPosition.x - (2 * this.csize),
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

  // Target (click) node - will be shown in info panel
  private updateTargetNode = (node?: Model.Node) =>
  {
    if (!node)
    {
      this.setState({targetNode: null});
    }
    else
    {
      const infoState = this.state.infoState === "hidden" ? "show" :
        this.state.infoState;
      this.setState({targetNode: node, infoState});
    }
  }

  // Target (hover) node icon - shows icon label
  private updateTargetIcon = (icon: {name: string,
    position: {x: number, y: number}} | null) =>
  {
    if (!icon)
    {
      this.setState({targetIcon: null});
    }
    else
    {
      this.setState({targetIcon: icon});
    }
  }
}

import * as React from 'react';
import * as Model from './model';

import Property from './Property';
import WebsocketCanvas from './WebsocketCanvas';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils'

const fontSize = 12;

interface IProps
{
  node: Model.Node;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
  padding: number;
  graphRef: SVGSVGElement | null;
  removeNode: (node: Model.Node) => void;
  showNodeGraph: (path: string, pathSpecific?: string,
    sourceSpecific?: string) => void;
  showNodeInfo: (node: Model.Node) => void;
}

interface IState
{
  dragging: boolean;
  resizing: boolean;
  x: number;
  y: number;
  h: number;
  w: number;
  hover: boolean;
}

export default class Node extends React.Component<IProps, IState>
{
  // Reset state from node when not dragging - allows movement not by
  // dragging (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.dragging || state.resizing ? null :
      { x: props.node.position.x, y: props.node.position.y,
        h: props.node.size.h, w: props.node.size.w };
  }

  private node: Model.Node;
  private offsetX: number;
  private offsetY: number;
  private mouseDown: {x: number, y: number, t: number};
  private resizeMouseDown: {x: number, y: number};
  private titleHeight: number;
  private updateStarted: boolean;

  constructor(props: IProps)
  {
    super(props);
    this.state =
      {
        dragging: false,
        resizing: false,
        x: props.node.position.x,
        y: props.node.position.y,
        h: props.node.size.h,
        w: props.node.size.w,
        hover: false
      };

    this.node = props.node;
    this.offsetX = 0;
    this.offsetY = 0;
    this.mouseDown = {x: 0, y: 0, t: 0};
    this.resizeMouseDown = {x: 0, y: 0};
    this.titleHeight = fontSize;
    this.updateStarted = false;
  }

  public render()
  {
    const height = this.state.h;
    const width = this.state.w;
    const padding = this.props.padding;

    const properties = this.node.getProperties();

    const deleteX = padding + width;
    const deleteY = 0;

    const reverseEdges = this.node.getReverseEdges();

    return (
      <svg id={`node-${this.node.id}`} className={"node"}
        x={this.state.x} y={this.state.y}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}>
        <rect x={padding} width={width} height={height}
          className={`node-border ${this.state.dragging ? "dragging" : ""} ` +
            `${this.state.resizing ? "resizing" : ""}`}
          onMouseDown={this.handleMouseDown}
          onContextMenu={this.handleContextMenu}
        />
        {this.state.hover && <svg className="delete-wrapper">
            <circle className="node-delete"
              cx={deleteX} cy={deleteY} r={8}
              onMouseDown={this.removeNode}/>
            <path className="delete-line" d={`M ${deleteX-5} ${deleteY-5} L` +
              `${deleteX+5} ${deleteY+5}`}/>
            <path className="delete-line" d={`M ${deleteX-5} ${deleteY+5} L` +
              `${deleteX+5} ${deleteY-5}`}/>
        </svg>}
        {this.generateTitle()}
        {this.generateSpecialCases()}
        {this.generateResizeIcon()}
        {properties.map((property: Model.Property, j) =>
          {
            return <Property key={j} property={property}
              name={property.id}
              parent={this.node}
              startUpdate={this.props.startUpdate}
              update={this.props.update}
              endUpdate={this.props.endUpdate}
              showNodeGraph={this.props.showNodeGraph}
              disabled={!!reverseEdges.find(x => x.inputId === property.id)}
              padding={this.props.padding}/>
          })}
        {this.props.children}
        />
      </svg>
    );
  }

  private generateTitle = () =>
  {
    const width = this.state.w;
    const padding = this.props.padding;

    if (typeof this.node.name === "undefined")
    {
      return "";
    }
    else
    {
      const linesArray = vgUtils.wrapText(this.node.name,
        width - this.props.padding, fontSize);

      this.titleHeight = linesArray.length * fontSize;

      return <text className={"node-label " + this.props.node.id}
        fontSize={fontSize} x={(width/2)+padding} y={15}>
          {linesArray.map((word: string, index: number) =>
            {
              return <tspan key={index} x={(width/2)+padding}
                dy={index*fontSize}>{word}</tspan>
            })}
        </text>
    }
  }

  private generateSpecialCases = () =>
  {
    const padding = this.props.padding;

    const portProperty = this.props.node.getProperties().find(
      x => x.id === "port");

    if (this.node.type === "vector:websocket-display" && portProperty)
    {
      return <foreignObject id="ws-canvas-wrapper"
        className={"ws-canvas " + this.props.node.id}
        x={2 * padding} y={this.titleHeight + (3 * padding)}>
        <WebsocketCanvas size={{ x: this.state.w - (2 * padding),
          y: this.state.h - (4 * padding) - this.titleHeight }}
          port={portProperty.value}/>
      </foreignObject>
    }
  }

  private generateResizeIcon = () =>
  {
    if (this.node.type === "vector:websocket-display" || this.node.type ===
      "core:interpolate")
    {
      return <svg id={"node-resize-wrapper"}
        x={this.state.w+this.props.padding-3} y={this.state.h-3}>
        <rect className={"node-resize-boundary"} x={-3} y={-3} width={15}
          height={15} onMouseDown={this.handleResizeMouseDown}/>
        <rect className={"node-resize-icon"} x={0} y={0} width={6} height={6}/>
      </svg>
    }
  }

  // Do nothing - prevents browser context menu from showing
  private handleContextMenu = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleMouseDown = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.setState({ dragging: true });

    this.props.showNodeInfo(this.node);

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    const date = new Date();

    if (this.mouseDown.t && date.getTime() - this.mouseDown.t < 250)
    {
      this.setState({ dragging: false });
      window.removeEventListener('mouseup', this.handleMouseUp);
      window.removeEventListener('mousemove', this.handleMouseMove);
      if (this.node.subGraph)
      {
        this.props.showNodeGraph(this.node.path, undefined, "/elements");
      }
      else if (this.node.cloneGraph)
      {
        this.props.showNodeGraph(this.node.path, "/graph", "/graph");
      }
      return;
    }

    this.mouseDown = {x: this.state.x, y: this.state.y, t: date.getTime()};

    this.offsetX = currentPosition.x - this.state.x;
    this.offsetY = currentPosition.y - this.state.y;
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    this.setState({ dragging: false });
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);

    if (this.mouseDown.x !== this.state.x || this.mouseDown.y !==
      this.state.y)
    {
      // Update graph layout data
      vgData.updateLayout(this.node.path, {x: this.state.x, y: this.state.y});
    }

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }

    this.updateStarted = false;
  }

  private handleMouseMove = (e: MouseEvent) =>
  {
    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    if (this.props.startUpdate && !this.updateStarted)
    {
      this.updateStarted = true;
      this.props.startUpdate();
    }

    if (this.state.dragging)
    {
      this.setState({
        x: currentPosition.x - this.offsetX,
        y: currentPosition.y - this.offsetY
      });
    }

    this.node.position = { x: this.state.x, y: this.state.y };
    if (this.props.update)
    {
      this.props.update();
    }
  }

  private handleMouseEnter = () =>
  {
    this.setState({hover: true});
  }

  private handleMouseLeave = () =>
  {
    this.setState({hover: false});
  }

  private handleResizeMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();

    this.setState({resizing: true});

    window.addEventListener('mouseup', this.handleResizeMouseUp);
    window.addEventListener('mousemove', this.handleResizeMouseMove);

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    this.resizeMouseDown = {x: currentPosition.x, y: currentPosition.y};

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private handleResizeMouseMove = (e: MouseEvent) =>
  {
    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    const diffX = currentPosition.x - this.resizeMouseDown.x

    const newState = {...this.state};
    newState.w += diffX;

    const aspectRatio = this.state.h / this.state.w;
    newState.h = newState.w * aspectRatio;

    if (newState.h >= 100 && newState.w >= 100)
    {
      this.setState(newState);

      this.node.size = {h: newState.h, w: newState.w};

      if (this.props.update)
      {
        this.props.update();
      }
    }

    this.resizeMouseDown = {x: currentPosition.x, y: currentPosition.y};
  }

  private handleResizeMouseUp = (e: MouseEvent) =>
  {
    this.setState({resizing: false});

    window.removeEventListener('mouseup', this.handleResizeMouseUp);
    window.removeEventListener('mousemove', this.handleResizeMouseMove);

    this.resizeMouseDown = {x: 0, y: 0};

    vgData.updateLayout(this.node.path, undefined, {w: this.state.w,
      h: this.state.h});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private removeNode = (e: React.MouseEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    this.props.removeNode(this.node);
  }
}


import * as React from 'react';
import * as Model from './model';

import Property from './Property';
import WebsocketCanvas from './WebsocketCanvas';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils';
import { vgConfig } from './lib/Config';

interface IProps
{
  node: Model.Node;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
  dynamicNodeUpdate: (node: Model.Node, finished: () => void) => void;
  padding: number;
  graphRef: SVGSVGElement | null;
  removeNode: (node: Model.Node) => void;
  showNodeGraph: (path: string, pathSpecific?: string,
    sourceSpecific?: string) => void;
  targetNode: (node: Model.Node) => void;
  updateTargetProperty: (updateID: string, property: Model.Property | null,
    updating: boolean) => void;
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
  relatedProperties?: {[key: string]: Model.Property};
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

  private offsetX: number;
  private offsetY: number;
  private mouseDown: {x: number, y: number};
  private resizeMouseDown: {x: number, y: number};
  private titleFontSize: number;
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
        hover: false,
        relatedProperties: undefined
      };

    this.offsetX = 0;
    this.offsetY = 0;
    this.mouseDown = {x: 0, y: 0};
    this.resizeMouseDown = {x: 0, y: 0};
    this.titleFontSize = vgConfig.Graph.fontSize.nodeTitle;
    this.updateStarted = false;
  }

  public render()
  {
    const height = this.state.h;
    const width = this.state.w;
    const padding = this.props.padding;

    const properties = this.props.node.getProperties();

    const deleteX = padding + width;
    const deleteY = 0;

    return (
      <svg id={`node-${this.props.node.id}`}
        className={"node " + this.props.node.type.replace("/","-") + " " +
          (this.props.node.category ? this.props.node.category : "")}
        x={this.state.x} y={this.state.y}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}>
        <rect x={padding} width={width} height={height}
          className={`node-border ${this.state.dragging ? "dragging" : ""} ` +
            `${this.state.resizing ? "resizing" : ""}`}
          onMouseDown={this.handleMouseDown}
          onDoubleClick={this.handleDoubleClick}
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
              parent={this.props.node}
              startUpdate={this.props.startUpdate}
              update={this.props.update}
              endUpdate={this.endPropertyUpdate}
              showNodeGraph={this.props.showNodeGraph}
              padding={this.props.padding}
              updateTargetProperty={this.props.updateTargetProperty}
              relatedProperties={this.state.relatedProperties}/>
          })}
        {this.props.children}
        />
      </svg>
    );
  }

  // Component has been created - collect together related properties in this
  // node and fill in any missing values (properties that have connections)
  public componentDidMount()
  {
    if (this.state.relatedProperties === undefined)
    {
      let relatedProps: {[key: string]: Model.Property} =
        this.getRelatedProperties();

      const updateProps: Array<Model.Property> = [];

      if (Object.keys(relatedProps).length > 0)
      {
        for (const key of Object.keys(relatedProps))
        {
          if (relatedProps[key] && relatedProps[key].value === undefined)
          {
            updateProps.push(relatedProps[key]);
          }
        }
      }

      const updatePropsLength = updateProps.length;
      let updatePropsCount = 0;

      if (updatePropsLength > 0)
      {
        updateProps.forEach((prop: Model.Property) =>
        {
          vgData.getPropertyValue(this.props.node.path, prop.id, (value: any) =>
          {
            relatedProps[prop.id].value = value;
            updatePropsCount++;

            if (updatePropsCount === updatePropsLength)
            {
              this.setState({relatedProperties: relatedProps});
            }
          });
        });
      }
      else
      {
        this.setState({relatedProperties: relatedProps});
      }

    }
  }

  private generateTitle = () =>
  {
    const width = this.state.w;
    const padding = this.props.padding;

    if (typeof this.props.node.name === "undefined")
    {
      return "";
    }
    else
    {
      const linesArray = vgUtils.wrapText(this.props.node.name,
        width - (this.props.padding * 2), this.titleFontSize);

      return <text className={"node-label " + this.props.node.id}
        fontSize={this.titleFontSize} x={(width/2)+padding} y={15}>
          {linesArray.map((word: string, index: number) =>
            {
              return <tspan key={index} x={(width/2)+padding}
                dy={index*this.titleFontSize}>{word}</tspan>
            })}
        </text>
    }
  }

  private generateSpecialCases = () =>
  {
    const padding = this.props.padding;

    const portProperty = this.props.node.getProperties().find(
      x => x.id === "port");

    if (this.props.node.category === "websocket-display" && portProperty)
    {
      const width = this.state.w - (2 * padding);
      const height = this.state.h - (2 * padding) - this.titleFontSize;

      return <foreignObject id="ws-canvas-wrapper"
        className={"ws-canvas " + this.props.node.id}
        width={width} height={height} x={2 * padding}
        y={this.titleFontSize + (1 * padding)}>
        <WebsocketCanvas size={{ x: width, y: height }}
          port={portProperty.value}/>
      </foreignObject>
    }
  }

  private generateResizeIcon = () =>
  {
    if (this.resizeNodeProps() !== null)
    {
      return <svg id={"node-resize-wrapper"}
        x={this.state.w+this.props.padding-3} y={this.state.h-3}>
        <rect className={"node-resize-boundary"} x={-3} y={-3} width={15}
          height={15} onMouseDown={this.handleResizeMouseDown}/>
        <rect className={"node-resize-icon"} x={0} y={0} width={6} height={6}/>
      </svg>
    }
  }

  // Returns nodes resize props (aspect ratio, minimum width and height) from
  // config or null if node doesn't support resizing
  private resizeNodeProps = () =>
  {
    if (this.props.node.category === "websocket-display")
    {
      return vgConfig.Graph.websocket.resizeProps;
    }
    else if (this.props.node.type === "core/interpolate")
    {
      return vgConfig.Graph.interpolate.resizeProps;
    }
    else
    {
      return null;
    }
  }

  // Do nothing - prevents browser context menu from showing
  private handleContextMenu = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleDoubleClick = (e: React.MouseEvent<SVGRectElement>) =>
  {
    this.setState({ dragging: false });
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    if (this.props.node.subGraph)
    {
      this.props.showNodeGraph(this.props.node.path);
    }
  }

  private handleMouseDown = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.setState({ dragging: true });

    this.props.targetNode(this.props.node);

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    this.mouseDown = {x: this.state.x, y: this.state.y};

    this.offsetX = currentPosition.x - this.state.x;
    this.offsetY = currentPosition.y - this.state.y;
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    if (this.state.dragging)
    {
      this.setState({ dragging: false });
    }

    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);

    if (this.mouseDown.x !== this.state.x || this.mouseDown.y !==
      this.state.y)
    {
      // Update graph layout data
      vgData.updateLayout(this.props.node.path, {x: this.state.x,
        y: this.state.y});
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

    this.props.node.position = { x: this.state.x, y: this.state.y };
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

    const diffX = currentPosition.x - this.resizeMouseDown.x;
    const diffY = currentPosition.y - this.resizeMouseDown.y;

    const newState = {...this.state};
    newState.w += diffX;

    const resizeProps = this.resizeNodeProps();
    const aspectRatio = resizeProps.aspectRatio;

    newState.h = (aspectRatio ? newState.w * aspectRatio : newState.h + diffY);

    if (newState.h >= resizeProps.minHeight &&
      newState.w >= resizeProps.minWidth)
    {
      this.setState(newState);

      this.props.node.size = {h: newState.h, w: newState.w};

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

    vgData.updateLayout(this.props.node.path, undefined, {w: this.state.w,
      h: this.state.h});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private removeNode = (e: React.MouseEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    this.props.removeNode(this.props.node);
  }

  private endPropertyUpdate = () =>
  {
    if (this.props.node.dynamic)
    {
      this.props.dynamicNodeUpdate(this.props.node, this.props.endUpdate);
    }
    else
    {
      this.props.endUpdate();
    }
  }

  // Return current property and any related properties e.g. all individual
  // colour properties for colourPicker
  private getRelatedProperties = () =>
  {
    let relatedProperties = {};

    if (this.props.node.category === "colourPicker")
    {
      const properties = this.props.node.getProperties();

      relatedProperties =
      {
        hex: properties.find(x => x.id === "hex"),
        h: properties.find(x => x.id === "h"),
        s: properties.find(x => x.id === "s"),
        l: properties.find(x => x.id === "l"),
        r: properties.find(x => x.id === "r"),
        g: properties.find(x => x.id === "g"),
        b: properties.find(x => x.id === "b")
      };
    }

    return relatedProperties;
  }
}


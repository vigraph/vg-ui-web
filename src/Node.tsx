import * as React from 'react';
import * as Model from './model';

import Property from './Property';
import WebsocketCanvas from './WebsocketCanvas';

import { vgData } from './data/Data';
import { vgUtils } from './lib/Utils';
import { vgConfig } from './lib/Config';
import { vgIcons } from './icons/Icons';

interface IProps
{
  node: Model.Node;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
  dynamicNodeUpdate: (node: Model.Node, finished: () => void) => void;
  padding: number;
  graphRef: SVGSVGElement | null;
  showNodeGraph: (path: string, pathSpecific?: string,
    sourceSpecific?: string) => void;
  updateTargetNode: (node: Model.Node) => void;
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
  private pointerDown: {x: number, y: number};
  private resizePointerDown: {x: number, y: number};
  private titleFontSize: number;
  private updateStarted: boolean;
  private lastPointerUp: number;

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
        relatedProperties: undefined
      };

    this.offsetX = 0;
    this.offsetY = 0;
    this.pointerDown = {x: 0, y: 0};
    this.resizePointerDown = {x: 0, y: 0};
    this.titleFontSize = vgConfig.Graph.fontSize.nodeTitle;
    this.updateStarted = false;
    this.lastPointerUp = 0;
  }

  public render()
  {
    const height = this.state.h;
    const width = this.state.w;
    const padding = this.props.padding;

    const properties = this.props.node.getProperties();

    return (
      <svg id={`node-${this.props.node.id}`}
        className={"node " + this.props.node.type.replace("/","-") + " " +
          (this.props.node.category ? this.props.node.category : "")}
        x={this.state.x} y={this.state.y}>
        <rect x={padding} y={0} width={width} height={height}
          className={`node-background ${this.state.dragging ? "dragging" :
            ""} ${this.state.resizing ? "resizing" : ""}`}
          onPointerDown={this.handlePointerDown}
          onContextMenu={this.handleContextMenu}
        />
        <path className={`node-border ${this.state.dragging ? "dragging" :
          ""} ${this.state.resizing ? "resizing" : ""}`}
          d={`M ${padding} ${0} L ${padding} ${height} L ${padding+width}
            ${height} L ${padding+width} ${0}`}
        />
        {this.generateHeader()}
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

  private generateHeader = () =>
  {
    const node = this.props.node;
    const title = node.displayName || node.name;

    const width = this.state.w;
    const padding = this.props.padding;
    const iconSize = vgConfig.Graph.node.iconSize;
    // Full width minus left padding, icon width and icon padding
    const titleWidth = this.state.w - padding - (iconSize + padding / 2);

    const linesArray = vgUtils.wrapText(title, titleWidth, this.titleFontSize);
    const textBox = vgUtils.textBoundingSize(linesArray[0], this.titleFontSize);

    const height = (textBox.height * linesArray.length) + padding;

    const Icon = vgIcons.Menu[node.type] ? vgIcons.Menu[node.type] : "";

    return <svg id={node.id+"-header-wrapper"} className={"node-header-wrapper"}
      x={padding} y={-height}>
        <rect x={0} y={0} width={width} height={height}
          className={`node-background ${this.state.dragging ? "dragging" :
            ""} ${this.state.resizing ? "resizing" : ""}`}
          onPointerDown={this.handlePointerDown}
          onContextMenu={this.handleContextMenu}/>
        <path className={`node-border ${this.state.dragging ? "dragging" :
          ""} ${this.state.resizing ? "resizing" : ""}`}
          d={`M ${0} ${height} L ${0} ${0}
            L ${width} ${0} L ${width} ${height}`}/>
        <text className={"node-title " + this.props.node.id}
          fontSize={this.titleFontSize} x={padding} y={(padding/2)+1}>
            {linesArray.map((word: string, index: number) =>
              {
                return <tspan key={index} x={padding}
                  dy={(index?1:0)*this.titleFontSize}>{word}</tspan>
              })}
        </text>
        {
          Icon ? <Icon x={width-(iconSize+padding/4)} y={padding/4}
            width={iconSize} height={iconSize}/> : ""
        }
        <path className={"node-header-separator"}
          d={`M ${padding/2} ${height} L ${width-(padding/2)} ${height}`}/>
      </svg>
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
          height={15} onPointerDown={this.handleResizePointerDown}/>
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

  private handlePointerDown = (e: React.PointerEvent<SVGRectElement>) =>
  {
    e.stopPropagation();
    e.preventDefault();
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointermove', this.handlePointerMove);
    this.setState({ dragging: true });

    this.props.updateTargetNode(this.props.node);

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    this.pointerDown = {x: this.state.x, y: this.state.y};

    this.offsetX = currentPosition.x - this.state.x;
    this.offsetY = currentPosition.y - this.state.y;
  }

  private handlePointerUp = (e: PointerEvent) =>
  {
    if (this.state.dragging)
    {
      this.setState({ dragging: false });
    }

    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);

    if (this.pointerDown.x !== this.state.x || this.pointerDown.y !==
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

    const date = new Date();

    if (date.getTime() - this.lastPointerUp < 300)
    {
      if (this.props.node.subGraph)
      {
        this.props.showNodeGraph(this.props.node.path);
      }
    }

    this.lastPointerUp = date.getTime();
  }

  private handlePointerMove = (e: PointerEvent) =>
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

  private handleResizePointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();

    this.setState({resizing: true});

    window.addEventListener('pointerup', this.handleResizePointerUp);
    window.addEventListener('pointermove', this.handleResizePointerMove);

    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    this.resizePointerDown = {x: currentPosition.x, y: currentPosition.y};

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private handleResizePointerMove = (e: PointerEvent) =>
  {
    const currentPosition = vgUtils.windowToSVGPosition(
      {x: e.pageX, y: e.pageY}, this.props.graphRef);

    const diffX = currentPosition.x - this.resizePointerDown.x;
    const diffY = currentPosition.y - this.resizePointerDown.y;

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

    this.resizePointerDown = {x: currentPosition.x, y: currentPosition.y};
  }

  private handleResizePointerUp = (e: PointerEvent) =>
  {
    this.setState({resizing: false});

    window.removeEventListener('pointerup', this.handleResizePointerUp);
    window.removeEventListener('pointermove', this.handleResizePointerMove);

    this.resizePointerDown = {x: 0, y: 0};

    vgData.updateLayout(this.props.node.path, undefined, {w: this.state.w,
      h: this.state.h});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
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


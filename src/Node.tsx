import * as React from 'react';
import * as Model from './model';

import Property from './Property';
import WebsocketCanvas from './WebsocketCanvas';
import Delete from './Delete'

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
  updateTargetProperty: (updateID: Model.Property,
    property: Model.Property | null, updating: boolean) => void;
  updateTargetIcon: (icon: {name: string,
    position: {x: number, y: number}} | null) => void;
  removeNode: (node: Model.Node) => void;
  clearUI: boolean;
}

interface IState
{
  dragging: boolean;
  resizing: boolean;
  showDelete: boolean;
  editTitle: boolean;
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
  private pointerDown: {x: number, y: number, target: string};
  private resizePointerDown: {x: number, y: number};
  private titleFontSize: number;
  private updateStarted: boolean;
  private lastPointerUp: number;
  private headerHeight: number;

  constructor(props: IProps)
  {
    super(props);
    this.state =
      {
        dragging: false,
        resizing: false,
        showDelete: false,
        editTitle: false,
        x: props.node.position.x,
        y: props.node.position.y,
        h: props.node.size.h,
        w: props.node.size.w,
        relatedProperties: undefined
      };

    this.offsetX = 0;
    this.offsetY = 0;
    this.pointerDown = {x: 0, y: 0, target: ""};
    this.resizePointerDown = {x: 0, y: 0};
    this.titleFontSize = vgConfig.Graph.fontSize.nodeTitle;
    this.updateStarted = false;
    this.lastPointerUp = 0;
    this.headerHeight = 0;
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
        <rect x={padding} y={0} width={width} height={height} id={"node-body"}
          className={`node-background ${this.state.dragging ? "dragging" :
            ""} ${this.state.resizing ? "resizing" : ""}`}
          onPointerDown={this.handlePointerDown}
          onContextMenu={this.handleContextMenu}/>
        />
        <path className={`node-border ${this.state.dragging ? "dragging" :
          ""} ${this.state.resizing ? "resizing" : ""}`}
          d={`M ${padding} ${0} L ${padding} ${height} L ${padding+width}
            ${height} L ${padding+width} ${0}`}
        />
        {this.createHeader()}
        {this.createSpecialCases()}
        {this.createResizeIcon()}
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

  // Clear UI (title edit and delete icon) if set in properties
  public componentDidUpdate()
  {
    if (this.props.clearUI && (this.state.showDelete || this.state.editTitle))
    {
      this.setState({showDelete: false, editTitle: false});
    }
  }

  private createHeader = () =>
  {
    const node = this.props.node;
    const title = node.displayName || node.name;

    const width = this.state.w;
    const padding = this.props.padding;
    const iconSize = vgConfig.Graph.node.iconSize;
    // Full width minus left padding, icon width and icon padding
    const titleWidth = (this.state.w ? this.state.w - padding - (iconSize +
      padding / 2) : 0);

    const linesArray = vgUtils.wrapText(title, titleWidth, this.titleFontSize);
    const textBox = vgUtils.textBoundingSize(linesArray[0], this.titleFontSize);

    const height = (textBox.height * linesArray.length) + padding;
    this.headerHeight = height;

    const Icon = vgIcons.Menu[node.type] ? vgIcons.Menu[node.type] : "";

    // Display title text or edit box
    const titleDisplay = () =>
    {
      if (this.state.editTitle)
      {
        return  <foreignObject id="node-title-edit-wrapper"
          className={"foreign-object " + this.props.node.id}
          width={titleWidth} height={height}
          fontSize={this.titleFontSize} x={2} y={2}>
          <input id="node-title-edit-input" type="text"
            className={"value-input display-name"} autoComplete={"off"}
            width={titleWidth} height={height} defaultValue={title}
            onPointerDown={this.titleEditPointerdown}
            onBlur={this.titleEditOnBlur}
            onKeyDown={this.titleEditKeyDown}/>
        </foreignObject>;
      }
      else
      {
        return <svg className={"node-title-wrapper " + this.props.node.id}
          width={titleWidth} height={height} x={padding} y={(padding/2)+1}>
          <text className={"node-title " + this.props.node.id}
            fontSize={this.titleFontSize} x={0} y={0}>
              {linesArray.map((word: string, index: number) =>
                {
                  return <tspan key={index} x={0} width={titleWidth}
                    dy={(index?1:0)*this.titleFontSize}>{word}</tspan>
                })}
          </text>
        </svg>
      }
    }

    return <svg id={node.id+"-header-wrapper"} className={"node-header-wrapper"}
      x={padding} y={-height}>
        <rect x={0} y={0} width={width} height={height} id={"node-header"}
          className={`node-background ${this.state.dragging ? "dragging" :
            ""} ${this.state.resizing ? "resizing" : ""}`}
          onPointerDown={this.handlePointerDown}
          onContextMenu={this.handleContextMenu}/>
        <path className={`node-border ${this.state.dragging ? "dragging" :
          ""} ${this.state.resizing ? "resizing" : ""}`}
          d={`M ${0} ${height} L ${0} ${0}
            L ${width} ${0} L ${width} ${height}`}/>
        { titleDisplay() }
        {
          Icon ? <Icon x={width-(iconSize+padding/4)} y={padding/4}
            width={iconSize} height={iconSize}
            onPointerEnter={this.iconPointerEnter}
            onPointerLeave={this.iconPointerLeave}
            onPointerDown={this.iconPointerDown}/> : ""
        }
        <path className={"node-header-separator"}
          d={`M ${padding/2} ${height} L ${width-(padding/2)} ${height}`}/>
        {this.state.showDelete && <Delete x={0} y={0}
          deletePressed={this.deleteNode}/>}
      </svg>
  }

  private createSpecialCases = () =>
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

  private createResizeIcon = () =>
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

  // Create node delete icon if info panel shown
  private deleteNode = () =>
  {
    this.props.removeNode(this.props.node);
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

    this.pointerDown = {x: this.state.x, y: this.state.y,
      target: e.currentTarget.id};

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

    // Only update layout if node has been moved
    if (this.pointerDown.x !== this.state.x || this.pointerDown.y !==
      this.state.y)
    {
      // Update graph layout data
      vgData.updateLayout(this.props.node.path, {x: this.state.x,
        y: this.state.y});

    }
    // Click without moving - hide title edit box if it is shown otherwise
    // show delete icon
    else if (this.state.editTitle)
    {
      this.setState({editTitle: false});
    }
    else
    {
      this.setState({showDelete: !this.state.showDelete});
    }

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }

    this.updateStarted = false;

    const date = new Date();

    if (date.getTime() - this.lastPointerUp < 300)
    {
      if (this.pointerDown.target === "node-header")
      {
        this.setState({editTitle: true, showDelete: false});
      }
      else if (this.props.node.subGraph)
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

  private iconPointerEnter = (e: React.PointerEvent<SVGElement>) =>
  {
    const node = this.props.node;
    const padding = this.props.padding;
    const iconSize = vgConfig.Graph.node.iconSize;

    const name = node.type.split("/")[1];
    const x = node.position.x + node.size.w + padding - (iconSize + padding/4);
    const y = node.position.y + padding/4 - this.headerHeight;
    const position = {x, y};

    this.props.updateTargetIcon({name, position})
  }

  private iconPointerLeave = (e: React.PointerEvent<SVGElement>) =>
  {
    this.props.updateTargetIcon(null);
  }

  private iconPointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
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

  // Stop pointer event in edit box propagating to graph background
  private titleEditPointerdown = (e: React.PointerEvent<HTMLInputElement>) =>
  {
    e.stopPropagation();
  }

  // On blur (focus off) update display name of node
  private titleEditOnBlur = (e: React.FocusEvent<HTMLInputElement>) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    if (textBox && this.props.node)
    {
      const node = this.props.node;

      vgData.updateLayout(node.path, undefined, undefined,
        {n: textBox.value.toString()}, () =>
        {
          this.props.startUpdate();
          node.displayName = textBox.value.toString();
          this.props.update();
          this.props.endUpdate();
        });
    }

    // Scroll page back to 0,0 in case it was moved showing onscreen keyboard
    window.scrollTo(0,0);
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;

    this.setState({editTitle: false});
  }

  // Pressing enter removes focus from the text box
  // Value validation and updating happens on text box onBlur (focus lost)
  // so simulates pressing enter submitting the new value
  private titleEditKeyDown = (e: React.KeyboardEvent) =>
  {
    const textBox =
      document.getElementById(e.currentTarget.id) as HTMLInputElement;

    // Enter key = 13
    if (textBox && e.which === 13)
    {
      textBox.blur();
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


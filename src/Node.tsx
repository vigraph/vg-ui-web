import * as React from 'react';
import * as Model from './model';

import Property from './Property';
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
  showWebsocketDisplay: (id: string, port: number, position: {x: number,
    y: number}) => void;
  hideHeader?: boolean;
}

interface IState
{
  dragging: boolean;
  showDelete: boolean;
  editTitle: boolean;
  x: number;
  y: number;
  relatedProperties?: {[key: string]: Model.Property};
}

export default class Node extends React.Component<IProps, IState>
{
  // Reset state from node when not dragging - allows movement not by
  // dragging (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.dragging ? null :
      { x: props.node.position.x, y: props.node.position.y };
  }

  private offsetX: number;
  private offsetY: number;
  private pointerDown: {x: number, y: number, target: string};
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
        showDelete: false,
        editTitle: false,
        x: props.node.position.x,
        y: props.node.position.y,
        relatedProperties: undefined
      };

    this.offsetX = 0;
    this.offsetY = 0;
    this.pointerDown = {x: 0, y: 0, target: ""};
    this.titleFontSize = vgConfig.Graph.fontSize.nodeTitle;
    this.updateStarted = false;
    this.lastPointerUp = 0;
    this.headerHeight = 0;
  }

  public render()
  {
    const height = this.props.node.size.h;
    const width = this.props.node.size.w;
    const padding = this.props.padding;
    const properties = this.props.node.getProperties();

    return (
      <svg id={`node-${this.props.node.id}`}
        className={"node " + this.props.node.type.replace("/","-") + " " +
          (this.props.node.category ? this.props.node.category : "")}
        x={this.state.x} y={this.state.y}>
        <rect x={padding} y={0} width={width} height={height} id={"node-body"}
          className={`node-background ${this.state.dragging ? "dragging" : ""}`}
          onPointerDown={this.handlePointerDown}
          onContextMenu={this.handleContextMenu}
        />
        <path className={`node-border ${this.state.dragging ? "dragging" : ""}`}
          d={`M ${padding} ${0} L ${padding} ${height} L ${padding+width}
            ${height} L ${padding+width} ${0}`}
        />
        {!this.props.hideHeader && this.createHeader()}
        {this.createSpecialCases()}
        {this.props.children}
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

    const width = node.size.w;
    const padding = this.props.padding;
    const iconSize = vgConfig.Graph.node.iconSize;
    // Full width minus left padding, icon width and icon padding
    const titleWidth = width - padding - (iconSize + padding / 2);

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
          className={`node-background ${this.state.dragging ? "dragging" : ""}`}
          onPointerDown={this.handlePointerDown}
          onContextMenu={this.handleContextMenu}/>
        <path className={`node-border ${this.state.dragging ? "dragging" : ""}`}
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
    const portProperty = this.props.node.getProperties().find(
      x => x.id === "port");

    if (this.props.node.category === "websocket-display" && portProperty)
    {
      const padding = this.props.padding;
      const Icon = vgIcons.App["show-ws"];
      const iconSize = vgConfig.Graph.node.iconSize;
      return <svg id="node-show-ws-wrapper"
        x={this.props.node.size.w - (2*padding)} y={padding}
        width={iconSize} height={iconSize}>
        <rect id="node-show-ws-background"width={iconSize} height={iconSize}
          x={0} y={0} onPointerDown={this.showWebsocketPointerDown} />
        <Icon id="node-show-ws-icon" width={iconSize} height={iconSize} x={0}
          y={0}/>
      </svg>
    }
  }

  // Create node delete icon if info panel shown
  private deleteNode = () =>
  {
    this.props.removeNode(this.props.node);
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

  private showWebsocketPointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
    const portProperty = this.props.node.getProperties().find(
      x => x.id === "port");
    if (portProperty !== undefined)
    {
      this.props.showWebsocketDisplay(this.props.node.id, portProperty.value,
        {x: e.pageX + (3 * this.props.padding), y: e.pageY});
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

      vgData.updateLayout(node.path, undefined, {n: textBox.value.toString()},
        () =>
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


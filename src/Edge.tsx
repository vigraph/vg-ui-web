import * as React from 'react';
import * as Model from './model';
import Delete from './Delete'

import { vgUtils } from './lib/Utils';
import { vgConfig } from './lib/Config';

interface IProps
{
  src: Model.Node;
  srcOutput: Model.Connector;
  dest: Model.Node;
  destInput: Model.Connector;
  offset: number;
  graphRef: SVGSVGElement | null;
  removeEdge: (srcID: string, srcOutput: string, destID: string,
    destInput: string, success?: () => void) => void;
  moveEdgeFromInput: (inNode: Model.Node, inConnector: Model.Connector,
    position: {x: number, y: number}) => void;
  moveEdgeFromOutput: (outNode: Model.Node, outConnector: Model.Connector,
    position: {x: number, y: number}) => void;
  showConnectorLabel: (label: {connector: Model.Connector,
    parent: Model.Node}) => void;
  clearUI: boolean;
}

interface IState
{
  edgeSelected: boolean;
  hover: boolean;
}

export default class Edge extends React.Component<IProps, IState>
{
  private pointerStart: {x: number, y: number};
  private edgeStart: {x: number, y: number};
  private edgeStop: {x: number, y: number};
  private hoverTimer: number | null;
  private hoverTriggered: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      edgeSelected: false,
      hover: false
    }

    this.pointerStart = {x: 0, y: 0};
    this.edgeStart = {x: 0, y: 0};
    this.edgeStop = {x: 0, y: 0};
    this.hoverTimer = null;
    this.hoverTriggered = false;
  }

  public render()
  {
    const offset = this.props.offset;

    // Add offset (size of connector) so that the edge starts at the right
    // boundary of connector and ends at the left boundary
    let sx = this.props.src.position.x + (3*offset);
    let sy = this.props.src.position.y;
    let dx = this.props.dest.position.x + (2*offset);
    let dy = this.props.dest.position.y;

    const outputPosition =
      this.props.src.getConnectorPosition(this.props.srcOutput);
    const inputPosition =
      this.props.dest.getConnectorPosition(this.props.destInput);
    sx += outputPosition.x;
    sy += outputPosition.y;
    dx += inputPosition.x;
    dy += inputPosition.y;

    // Calculate distance of control point as fraction of the distance,
    // with minimum - gives a nice smooth curve and long distance
    let cpx = (dx - sx) / 2;
    if (cpx < 100) { cpx = 100; }

    // Centre point of the delete icon
    const deleteX = sx+((dx-sx)/2);
    const deleteY = sy+((dy-sy)/2);

    this.edgeStart = {x: sx, y: sy};
    this.edgeStop = {x: dx, y: dy};

    return (
      <svg id="edge-wrapper">
        <>
        <path className={`edge ${this.state.edgeSelected ? "selected" : ""} ` +
          `${this.state.hover ? "hover" : "" } ${this.props.srcOutput.type} ` +
          `${(this.props.src.type === "dummy" ||
            this.props.dest.type === "dummy") ? "dummy":""}`}
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
        />
        <path className={`edge-boundary ${(this.props.src.type === "dummy" ||
            this.props.dest.type === "dummy") ? "dummy":""}`}
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
          touch-action="none"
          onPointerDown={this.edgePointerDown}
          onPointerEnter={this.edgePointerEnter}
          onPointerLeave={this.edgePointerLeave}
        />
        {
          this.state.edgeSelected && <Delete x={deleteX} y={deleteY}
            deletePressed={this.removeEdge}/>
        }
        {
          (this.state.edgeSelected &&
            this.props.showConnectorLabel({connector: this.props.srcOutput,
            parent: this.props.src}))
        }
        {
          (this.state.edgeSelected &&
            this.props.showConnectorLabel({connector: this.props.destInput,
            parent: this.props.dest}))
        }
        </>
      </svg>
    );
  }

  // Clear UI (delete icon) if set in properties
  public componentDidUpdate()
  {
    if (this.props.clearUI && this.state.edgeSelected)
    {
      this.setState({edgeSelected: false});
    }
  }

  private edgePointerEnter = (e: React.PointerEvent<SVGElement>) =>
  {
    this.setState({hover: true});

    this.hoverTimer = window.setTimeout(() =>
      {
        if (!this.state.edgeSelected)
        {
          this.hoverTriggered = true;
          this.setState({edgeSelected: true});
        }
      }, vgConfig.Graph.edge.hoverTime * 1000);
  }

  private edgePointerLeave = (e: React.PointerEvent<SVGElement>) =>
  {
    this.setState({hover: false});

    if (this.hoverTriggered)
    {
      this.setState({edgeSelected: false});
    }

    this.clearHoverTimeout();
  }

  private edgePointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
    this.pointerStart = {x: e.pageX, y: e.pageY};
    this.clearHoverTimeout();
    window.addEventListener('pointerup', this.edgePointerUp);
    window.addEventListener('pointermove', this.edgePointerMove);
  }

  private edgePointerMove = (e: PointerEvent) =>
  {
    // If pointer moved more than 5 pixels (to avoid unintentional moving)
    // disconnect edge from closest connector and start moving the connector
    if (Math.abs(this.pointerStart.x - e.pageX) > 5 || Math.abs(
      this.pointerStart.y - e.pageY) > 5)
    {
      window.removeEventListener('pointermove', this.edgePointerMove);
      window.removeEventListener('pointerup', this.edgePointerUp);

      if (this.state.edgeSelected)
      {
        this.setState({edgeSelected: false});
      }

      const mStart = vgUtils.windowToSVGPosition({x: this.pointerStart.x,
        y: this.pointerStart.y}, this.props.graphRef);

      const srcPointerDistance = Math.hypot(this.edgeStart.x - mStart.x,
        this.edgeStart.y - mStart.y);

      const destPointerDistance = Math.hypot(this.edgeStop.x - mStart.x,
        this.edgeStop.y - mStart.y);

      const position = {x: e.pageX, y: e.pageY};

      if (srcPointerDistance < destPointerDistance)
      {
        this.props.moveEdgeFromOutput(this.props.src, this.props.srcOutput,
          position);
      }
      else
      {
        this.props.moveEdgeFromInput(this.props.dest, this.props.destInput,
            position);
      }
    }
  }

  private edgePointerUp = (e: PointerEvent) =>
  {
    window.removeEventListener('pointermove', this.edgePointerMove);
    window.removeEventListener('pointerup', this.edgePointerUp);
    this.setState({edgeSelected: !this.state.edgeSelected});
    this.clearHoverTimeout();
  }

  private removeEdge = () =>
  {
    this.setState({edgeSelected: false});
    this.clearHoverTimeout();
    this.props.removeEdge(this.props.src.id, this.props.srcOutput.id,
      this.props.dest.id, this.props.destInput.id);
  }

  private clearHoverTimeout = () =>
  {
    if (this.hoverTimer)
    {
      this.hoverTriggered = false;
      window.clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }
}


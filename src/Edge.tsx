import * as React from 'react';
import * as Model from './model';

import { vgUtils } from './lib/Utils';

interface IProps
{
  src: Model.Node;
  srcOutput: string;
  dest: Model.Node;
  destInput: string;
  offset: number;
  graphRef: SVGSVGElement | null;
  removeEdge: (srcID: string, srcOutput: string, destID: string,
    destInput: string, success?: () => void) => void;
  moveEdgeFromInput: (inNode: Model.Node, inConnector: Model.Connector,
    position: {x: number, y: number}) => void;
  moveEdgeFromOutput: (outNode: Model.Node, outConnector: Model.Connector,
    position: {x: number, y: number}) => void;
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
  }

  public render()
  {
    const outputConnector =
      this.props.src.getOutputConnector(this.props.srcOutput);
    const inputConnector =
      this.props.dest.getInputConnector(this.props.destInput);

    const offset = this.props.offset;

    // Add offset (size of connector) so that the edge starts at the right
    // boundary of connector and ends at the left boundary
    let sx = this.props.src.position.x + (3*offset);
    let sy = this.props.src.position.y;
    let dx = this.props.dest.position.x + (2*offset);
    let dy = this.props.dest.position.y;

    if (outputConnector && inputConnector)
    {
      const outputPosition =
        this.props.src.getConnectorPosition(outputConnector);
      const inputPosition =
        this.props.dest.getConnectorPosition(inputConnector);
      sx += outputPosition.x;
      sy += outputPosition.y;
      dx += inputPosition.x;
      dy += inputPosition.y;
    }

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
        <path className={`edge ${this.state.edgeSelected ? "selected" : ""} ` +
          `${this.state.hover ? "hover" : "" }` +
          `${(this.props.src.type === "dummy" ||
            this.props.dest.type === "dummy") ? "dummy":""}`}
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
        />
        <path className="edge-boundary"
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
          touch-action="none"
          onPointerDown={this.edgePointerDown}
          onPointerEnter={this.edgePointerEnter}
          onPointerLeave={this.edgePointerLeave}
        />
        {
          this.state.edgeSelected && <svg className="delete-wrapper">
            <circle className="edge-delete"
              cx={deleteX} cy={deleteY} r={8}
              onPointerDown={this.removeEdgePointer}/>
            <path className="delete-line" d={`M ${deleteX-5} ${deleteY-5} L` +
              `${deleteX+5} ${deleteY+5}`}/>
            <path className="delete-line" d={`M ${deleteX-5} ${deleteY+5} L` +
              `${deleteX+5} ${deleteY-5}`}/>
            </svg>
        }
      </svg>
    );
  }

  private edgePointerEnter = (e: React.PointerEvent<SVGElement>) =>
  {
    this.setState({hover: true});
  }

  private edgePointerLeave = (e: React.PointerEvent<SVGElement>) =>
  {
    this.setState({hover: false});
  }

  private edgePointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
    this.pointerStart = {x: e.pageX, y: e.pageY};
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
        const outputConnector =
          this.props.src.getOutputConnector(this.props.srcOutput);

        if (outputConnector)
        {
          this.props.moveEdgeFromOutput(this.props.src, outputConnector,
            position);
        }
      }
      else
      {
        const inputConnector =
          this.props.dest.getInputConnector(this.props.destInput);

        if (inputConnector)
        {
          this.props.moveEdgeFromInput(this.props.dest, inputConnector,
            position);
        }
      }
    }
  }

  private edgePointerUp = (e: PointerEvent) =>
  {
    window.removeEventListener('pointermove', this.edgePointerMove);
    window.removeEventListener('pointerup', this.edgePointerUp);
    this.setState({edgeSelected: !this.state.edgeSelected});
  }

  private removeEdgePointer = (e: React.PointerEvent<SVGCircleElement>) =>
  {
    e.stopPropagation();
    this.props.removeEdge(this.props.src.id, this.props.srcOutput,
      this.props.dest.id, this.props.destInput);
  }
}


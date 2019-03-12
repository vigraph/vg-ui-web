import * as React from 'react';
import * as Model from './model';

interface IProps
{
  src: Model.Node;
  srcOutput: string;
  dest: Model.Node;
  destInput: string;
  offset: number;
  removeEdge: (src: Model.Node, srcOutput: string, dest: Model.Node,
    destInput: string) => void;
}

interface IState
{
  edgeSelected: boolean;
}

export default class Edge extends React.Component<IProps, IState>
{
  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      edgeSelected: false
    }
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
    let dx = this.props.dest.position.x + offset;
    let dy = this.props.dest.position.y;

    if (outputConnector && inputConnector)
    {
      sx += outputConnector.position.x;
      sy += outputConnector.position.y;
      dx += inputConnector.position.x;
      dy += inputConnector.position.y;
    }

    // Calculate distance of control point as fraction of the distance,
    // with minimum - gives a nice smooth curve and long distance
    let cpx = (dx - sx) / 2;
    if (cpx < 100) { cpx = 100; }

    // Centre point of the delete icon
    const deleteX = sx+((dx-sx)/2);
    const deleteY = sy+((dy-sy)/2);

    return (
      <svg>
        <path className={`edge ${this.state.edgeSelected ? "selected" : ""}`}
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
        />
        <path className="edge-boundary"
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
          onMouseDown={this.edgeSelected}
        />
        {
          this.state.edgeSelected && <svg className="delete-wrapper">
            <circle className="edge-delete"
              cx={deleteX} cy={deleteY} r={8}
              onMouseDown={this.removeEdge}/>
            <path className="delete-line" d={`M ${deleteX - 5} ${deleteY-5} L` +
              `${deleteX+5} ${deleteY+5}`}/>
            <path className="delete-line" d={`M ${deleteX - 5} ${deleteY+5} L` +
              `${deleteX+5} ${deleteY-5}`}/>
            </svg>
        }
      </svg>
    );
  }

  private edgeSelected = () =>
  {
    this.setState({edgeSelected: !this.state.edgeSelected});
  }

  private removeEdge = () =>
  {
    this.props.removeEdge(this.props.src, this.props.srcOutput, this.props.dest,
      this.props.destInput);
  }
}


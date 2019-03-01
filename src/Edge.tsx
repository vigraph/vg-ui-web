import * as React from 'react';
import * as Model from './model';

interface IProps
{
  src: Model.Node;
  srcOutput: string;
  dest: Model.Node;
  destInput: string;
  offset: number;
}

export default class Edge extends React.Component<IProps>
{
  constructor(props: IProps)
  {
    super(props);
  }

  public render()
  {
    const outputConnector = this.props.src.getOutputConnector(this.props.srcOutput);
    const inputConnector = this.props.dest.getInputConnector(this.props.destInput);

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

    return (
      <svg>
        <path className="edge"
          d={`M${sx} ${sy} C ${sx + cpx} ${sy} ${dx - cpx} ${dy} ${dx} ${dy}`}
        />
      </svg>
    );
  }
}


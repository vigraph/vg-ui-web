import * as React from 'react';

interface IProps
{
  x: number;
  y: number;
  r: number;
}

export default class Connector extends React.Component<IProps>
{
  constructor(props: IProps)
  {
    super(props);
  }

  public render()
  {
    return (
      <svg>
        <circle className="connector"
          cx={this.props.x} cy={this.props.y} r={this.props.r} />
      </svg>
    );
  }
}


import * as React from 'react';
import * as Model from './model';

interface IProps
{
  parent: Model.Node;
  connector: Model.Connector;
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
          cx={this.props.connector.position.x}
          cy={this.props.connector.position.y}
          r={5} />
      </svg>
    );
  }
}


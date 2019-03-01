import * as React from 'react';
import * as Model from './model';

interface IProps
{
  parent: Model.Node;
  connector: Model.Connector;
  connectorSelected: (node: Model.Node, connector: Model.Connector,
    e: React.MouseEvent) => void;
  updateTargetConnector: (target: {connector: Model.Connector,
    parent: Model.Node } | null) => void;
  radius: number;
}

export default class Connector extends React.Component<IProps>
{
  constructor(props: IProps)
  {
    super(props);
  }

  public render()
  {
    const position = this.props.connector.position;
    const radius = this.props.radius;

    return (
      <svg>
        <rect className={"connector-boundary " + this.props.connector.id}
          x={position.x} y={position.y-(2*radius)}
          width={radius*4} height={radius*4} onMouseEnter={this.mouseEnter}
          onMouseLeave={this.mouseLeave}
          onMouseDown={this.mouseDown} />
        <circle className={"connector " + this.props.connector.id}
          cx={position.x+(2*radius)}
          cy={position.y}
          r={radius} />
      </svg>
    );
  }

  private mouseDown = (e: React.MouseEvent<SVGRectElement>) =>
  {
    const parent = this.props.parent;
    const connector = this.props.connector;

    // Input connectors cannot have more than one edge
    // Output connectors cannot have more edges (connections) than their
    // maxConnections
    if ((connector.direction === "input" &&
      parent.edgesFromConnector(connector) < 1) ||
      (connector.direction === "output" &&
      parent.edgesFromConnector(connector) < connector.maxConnections))
    {
      this.props.connectorSelected(this.props.parent, this.props.connector, e);
    }
  }

  private mouseEnter = (e: React.MouseEvent<SVGRectElement>) =>
  {
    this.props.updateTargetConnector({connector: this.props.connector,
      parent: this.props.parent});
  }

  private mouseLeave = (e: React.MouseEvent<SVGRectElement>) =>
  {
    this.props.updateTargetConnector(null);
  }

}

import * as React from 'react';
import * as Model from './model';

interface IProps
{
  parent: Model.Node;
  connector: Model.Connector;
  inputConnectorSelected: (inNode: Model.Node, inConnector: Model.Connector,
    e: React.MouseEvent) => void;
  outputConnectorSelected: (node: Model.Node, connector: Model.Connector,
    e: React.MouseEvent, transactionStarted: boolean) => void;
  updateTargetConnector: (target: {connector: Model.Connector,
    parent: Model.Node } | null) => void;
  radius: number;
}

interface IState
{
  hover: boolean;
}

export default class Connector extends React.Component<IProps,IState>
{
  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      hover: false
    }
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
        <circle className={"connector " + this.props.connector.id + " " +
            this.props.connector.direction}
          cx={position.x+(2*radius)}
          cy={position.y}
          r={radius} />
        {this.props.connector.direction === "input" && this.state.hover ?
          <text className="label connector-label input"
            x={position.x + (radius*3)}
            y={position.y}>{this.props.connector.id}</text> : ""}
      </svg>
    );
  }

  private mouseDown = (e: React.MouseEvent<SVGRectElement>) =>
  {
    e.stopPropagation();
    const connector = this.props.connector;

    if (connector.direction === "output")
    {
      this.props.outputConnectorSelected(this.props.parent,
        this.props.connector, e, false);
    }
    else if (connector.direction === "input" && connector.multiple)
    {
      this.props.inputConnectorSelected(this.props.parent, this.props.connector,
        e);
    }
  }

  private mouseEnter = (e: React.MouseEvent<SVGRectElement>) =>
  {
    this.props.updateTargetConnector({connector: this.props.connector,
      parent: this.props.parent});

    this.setState({hover: true});
  }

  private mouseLeave = (e: React.MouseEvent<SVGRectElement>) =>
  {
    this.props.updateTargetConnector(null);

    this.setState({hover: false});
  }

}

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

    const disabled = (this.props.connector.direction === "input" &&
      !this.props.connector.multiple &&
      this.props.parent.edgesFromConnector(this.props.connector).length > 0);

    return (
      <svg id={`connector-${this.props.connector.id}`} className={"connector"}>
        <rect className={"connector-boundary " + this.props.connector.id}
          x={position.x} y={position.y-(2*radius)}
          width={radius*4} height={radius*4} onMouseEnter={this.mouseEnter}
          onMouseLeave={this.mouseLeave}
          onMouseDown={this.mouseDown} />
        <circle className={`connector-icon ${this.props.connector.id}` +
          ` ${this.props.connector.direction} ${disabled ? "disabled":""}`}
          cx={position.x+(2*radius)}
          cy={position.y}
          r={radius} />
        {this.state.hover ? this.createLabels() : ""}
      </svg>
    );
  }

  private createLabels = () =>
  {
    const position = this.props.connector.position;
    const radius = this.props.radius;

    if (this.props.connector.direction === "input")
    {
      return <text className="label connector-label input"
                x={position.x}
                y={position.y}>{this.props.connector.id}</text>
    }
    else
    {
      return <text className="label connector-label output"
                x={position.x + (radius*3)}
                y={position.y}>{this.props.connector.id}</text>
    }
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
    else if (connector.direction === "input" &&
      this.props.parent.edgesFromConnector(this.props.connector).length === 1)
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

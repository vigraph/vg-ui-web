import * as React from 'react';
import * as Model from './model';

import Knob from './Knob';

const controlTypes = {"knob": Knob};

interface IProps
{
  property: Model.Property;
  name: string;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
}

interface IState
{
  currentPercent: number;
  updating: boolean;
}

export default class Property extends React.Component<IProps, IState>
{
  // Reset state from property when not updating - allows movement not by
  // updating (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.updating ? null :
      { currentPercent: props.property.value };
  }

  private property: Model.Property;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.state =
    {
      currentPercent: this.property.value,
      updating: false
    };
  }

  public render()
  {
    const position = this.property.position;

    const Component = controlTypes[this.property.controlType];

    return(
      <svg id={this.props.name.toLowerCase()+"-property"}
        className="property-wrapper">
        <text className="label property-label" x={position.x}
          y={position.y}>{this.props.name+": "+
          Math.round(this.state.currentPercent*this.property.maxValue)}</text>
        <Component property={this.property}
          startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
          endUpdate={this.endPropertyUpdate}/>
      </svg>
    );
  }

  private startPropertyUpdate = () =>
  {
    this.setState({updating: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private endPropertyUpdate = () =>
  {
    this.setState({updating: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private propertyUpdate = (value: number) =>
  {
    this.setState({currentPercent: value});

    this.property.value = value;

    if (this.props.update)
    {
      this.props.update();
    }
  }

}

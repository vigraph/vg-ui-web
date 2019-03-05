import * as React from 'react';
import * as Model from './model';

import Knob from './Knob';
import Slider from './Slider';
import Switch from './Switch';

const controlTypes = {"knob": Knob, "switch": Switch, "slider": Slider};

interface IProps
{
  property: Model.Property;
  name: string;
  display: {labels: boolean, controls: boolean};
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

    // Ensure value conforms to increment bounds
    const value = this.snapValueToIncrement(this.property.value);
    this.property.value = value;

    this.state =
    {
      currentPercent: value,
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
        {this.props.display.labels ?
          <text className="label property-label" x={position.x}
          y={position.y}>{this.props.name + ": " +
          this.calculateRoundedDisplayValue(this.property.value)}</text> : ""}
        {this.props.display.controls ?
           <Component property={this.property}
            startUpdate={this.startPropertyUpdate} update={this.propertyUpdate}
            endUpdate={this.endPropertyUpdate}/> : ""}
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
    const newValue = this.snapValueToIncrement(value);

    this.setState({currentPercent: newValue});

    this.property.value = newValue;

    if (this.props.update)
    {
      this.props.update();
    }
  }

  // Calculate the value to display with the same accuracy as the given
  // increment.
  private calculateRoundedDisplayValue = (value: number) =>
  {
    const increment = this.property.increment;
    const split = increment.toString().split(".");
    const decimalPlaces = split[1] ? split[1].length : 0;

    const range = this.property.range;
    const valueRange = range.max - range.min;
    const displayValue = (value * valueRange) + range.min;
    const roundedDisplayValue = displayValue.toFixed(decimalPlaces);

    return parseInt(roundedDisplayValue, 10)
  }

  // Snap value to closest increment
  private snapValueToIncrement = (value: number) =>
  {
    const roundedDisplayValue = this.calculateRoundedDisplayValue(value);

    const increment = this.property.increment;
    const range = this.property.range;
    const valueRange = range.max - range.min;

    const mod = roundedDisplayValue % increment;
    const diff = roundedDisplayValue - mod;

    // Snap to the closest increment
    const snap = (mod > increment/2) ? increment : 0;

    const newValue = (diff + snap - range.min) / valueRange;

    return newValue;
  }

}

import * as React from 'react';
import * as Model from './model';

import Button from './Button';
import ColourPicker from './ColourPicker';
import Knob from './Knob';
import Selector from './Selector';
import Slider from './Slider';

const controlTypes = {"none": null, "knob": Knob, "button": Button,
  "slider": Slider, "colourPicker": ColourPicker, "selector": Selector};

interface IProps
{
  property: Model.Property;
  name: string;
  position: {x: number, y: number};
  display: {labels: boolean, controls: boolean};
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
}

interface IState
{
  value: any;
  updating: boolean;
}

export default class Property extends React.Component<IProps, IState>
{
  // Reset state from property when not updating - allows movement not by
  // updating (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.updating ? null :
      { value: props.property.value };
  }

  private property: Model.Property;
  private numerical: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    // Buttons, knobs and sliders are numerical and snap to increments. All
    // other types e.g. selectors and colourPicker are not numerical.
    if (this.property.controlType === "knob" || this.property.controlType ===
      "slider" || this.property.controlType === "button")
    {
      this.numerical = true;

      // Ensure value conforms to increment bounds
      this.property.value = this.snapValueToIncrement(this.property.value);
    }
    else
    {
      this.numerical = false;
    }

    this.state =
    {
      value: this.property.value,
      updating: false
    };
  }

  public render()
  {
    const position = this.props.position;
    const Component = controlTypes[this.property.controlType];

    let displayValue = "";

    if (this.numerical && typeof this.property.value === "number")
    {
      displayValue = this.formatValueForDisplay(this.property.value).toString();
    }
    else if (typeof this.property.value === "string")
    {
      displayValue = this.property.value;
    }

    return(
      <svg id={this.props.name.toLowerCase()+"-property"}
        className="property-wrapper">
        {this.props.display.labels ?
          <text className="label property-label" x={position.x}
          y={position.y}>{this.props.name + ": " + displayValue}</text> : ""}
        {this.props.display.controls && Component ?
           <Component property={this.property}
            position={{x: position.x, y: position.y + 10}}
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

  // Numerical control types return percentage (0-1)
  private propertyUpdate = (value: any) =>
  {
    const newValue = this.numerical && typeof value === "number" ?
      this.snapValueToIncrement(value) : value;

    this.setState({value: newValue});

    this.property.value = newValue;

    if (this.props.update)
    {
      this.props.update();
    }
  }

  // Calculate the value to display with the same accuracy as the given
  // increment.
  private formatValueForDisplay = (value: number) =>
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
    const roundedDisplayValue = this.formatValueForDisplay(value);

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

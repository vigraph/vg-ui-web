import * as React from 'react';
import * as Model from './model';

import * as vgType from './Types';

import { vgUtils } from './Utils';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: number) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
}

interface IState
{
  currentValue: number;
  turning: boolean;
}

export default class Knob extends React.Component<IProps, IState>
{
  // Reset state from knob when not turning - allows movement not by
  // turning (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.turning ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private arcStart: {x: number, y: number};
  private mouseStart: {x: number, y: number};
  private circleCentre: {x: number, y: number};
  private range: number;

  private settings: vgType.IKnobSettings;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const knobSettings = require('./json/ControlSettings.json').knob;

    this.settings = knobSettings[this.property.subType] ?
      knobSettings[this.property.subType] : knobSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      turning: false
    };

    this.arcStart = {x: this.settings.radius, y: 2*this.settings.radius};
    this.mouseStart = {x: 0, y: 0};
    this.circleCentre = {x: 0, y: 0};

    this.range = this.settings.rangeMax - this.settings.rangeMin;
  }

  public render()
  {
    const r = this.settings.radius
    const oR = this.settings.overlayRadius;

    const settings = this.settings;

    if (settings.logControl && this.property.range.min === 0)
    {
      vgUtils.log("Knob Error - Logarithmic control with minimum range set " +
        "to 0");
    }

    const rangeMin = settings.logControl ? Math.log10(this.property.range.min) :
      this.property.range.min;
    const rangeMax = settings.logControl ? Math.log10(this.property.range.max) :
      this.property.range.max;
    const currentValue = settings.logControl ?
      Math.log10(this.state.currentValue) : this.state.currentValue;

    // Current position in degrees from 0
    const currentPos = ((currentValue - rangeMin) /
      (rangeMax - rangeMin) * this.range) + settings.rangeMin;

    // Calculate knob arc end point from arc start point and angle (position)
    // of the knob
    const num90 = Math.floor(currentPos / 90);
    const remain90 = currentPos % 90;
    const remain90rad = (remain90 * Math.PI) / 180;

    const z = Math.sqrt((r*r) + (r*r) - (2*r*r*Math.cos(remain90rad)));

    const x = Math.sin(remain90rad)*r;
    const y = Math.sqrt((z*z) - (x*x));

    let newX = this.arcStart.x;
    let newY = this.arcStart.y;

    switch (num90)
    {
      case 0:
        newX = this.arcStart.x - x;
        newY = this.arcStart.y - y;
        break;

      case 1:
        newX = 0 + y;
        newY = r - x;
        break;

      case 2:
        newX = r + x;
        newY = 0 + y;
        break;

      case 3:
        newX = (r*2) - y;
        newY = (r) + x;
        break;

      default:
        break;
    }

    const arcSweep = currentPos > 180 ? 1 : 0

    const position = this.props.position;

    return(
        <svg id="knob" className={this.property.subType}
          height={r*2} width={r*2}
          onMouseDown={this.handleMouseDown}>
          <circle className={`knob-background`}
            cx={r} cy={r} r={r}
            transform={`scale(${this.state.turning ?
              this.settings.turnScale : 1})`}
          />
          <path
            className={`knob-arc`}
            d={`M${r} ${r} `+
              `L${this.arcStart.x},${this.arcStart.y} `+
              `A${r},${r} 1 ${arcSweep},1 `+
              `${newX},${newY} z`}
            transform={`scale(${this.state.turning ? this.settings.turnScale :
              1}) rotate(${this.settings.offset}, ${r}, ${r})`}
          />
          <path
            className={`knob-dial`}
            d={`M${r} ${r} L${newX},${newY} z`}
            transform={`scale(${this.state.turning ? this.settings.turnScale :
              1}) rotate(${this.settings.offset}, ${r}, ${r})`}
          />
          <circle className="knob-overlay"
            cx={r} cy={r} r={oR}
            transform={`scale(${this.state.turning ?
              this.settings.turnScale : 1})`}
          />
        </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);

    this.circleCentre.x = e.currentTarget.getBoundingClientRect().left +
      this.settings.radius;
    this.circleCentre.y = e.currentTarget.getBoundingClientRect().top +
      this.settings.radius;

    // Mouse start coordinates with circle centre as origin
    this.mouseStart.x = e.pageX - this.circleCentre.x;
    this.mouseStart.y = e.pageY - this.circleCentre.y;

    this.setState({turning: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);

    this.setState({turning: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private handleMouseMove = (e: MouseEvent) =>
  {
    // Current mouse position coordinates with circle centre as origin
    const currentX = e.pageX - this.circleCentre.x;
    const currentY = e.pageY - this.circleCentre.y;

    const settings = this.settings;
    const rangeMin = settings.logControl ? Math.log10(this.property.range.min) :
      this.property.range.min;
    const rangeMax = settings.logControl ? Math.log10(this.property.range.max) :
      this.property.range.max;
    const currentValue = settings.logControl ?
      Math.log10(this.state.currentValue) : this.state.currentValue;

    // Calculate angle between mouse start position and current mouse posiiton
    // and add to current knob position (angle)
    const dot = (this.mouseStart.x * currentX) + (this.mouseStart.y * currentY);
    const det = (this.mouseStart.x * currentY) - (this.mouseStart.y * currentX);
    const angleRad = Math.atan2(det, dot);
    const angle = angleRad * (180 / Math.PI);

    // Current position in degrees from 0
    let newPos = ((currentValue - rangeMin) /
      (rangeMax - rangeMin) * this.range) + settings.rangeMin + angle;

    // Mouse start can now but current mouse coords
    this.mouseStart.x = currentX;
    this.mouseStart.y = currentY;

    newPos = this.limitPosition(newPos);

    let newValue = ((newPos / settings.rangeMax) * (rangeMax -
      rangeMin)) + rangeMin;

    if (settings.logControl)
    {
      newValue = Math.pow(10, newValue);
    }

    this.setState({currentValue: newValue});

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }

  // Limit the position given to between the knob minimum and maximum properties
  private limitPosition = (position: number) =>
  {
    if (position > this.settings.rangeMax)
    {
      position = this.settings.rangeMax;
    }
    else if (position < this.settings.rangeMin)
    {
      position = this.settings.rangeMin;
    }

    return position
  }
}

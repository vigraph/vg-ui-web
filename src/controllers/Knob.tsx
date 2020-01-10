import * as React from 'react';
import * as Model from '../model';

import { vgConfig } from '../lib/Config';
import { vgUtils } from '../lib/Utils';
import * as vgTypes from '../lib/Types';

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: number) => void;
  endUpdate: () => void;
  position: {x: number, y: number};
  disabled: boolean;
  settingsType: string;
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
  private pointerStart: {x: number, y: number};
  private circleCentre: {x: number, y: number};
  private range: number;

  private settings: vgTypes.IKnobSettings;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    const knobSettings = vgConfig.Controls.knob;

    this.settings = knobSettings[this.props.settingsType] ?
      knobSettings[this.props.settingsType] : knobSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      turning: false
    };

    this.arcStart = {x: this.settings.radius, y: 2*this.settings.radius};
    this.pointerStart = {x: 0, y: 0};
    this.circleCentre = {x: 0, y: 0};

    this.range = this.settings.rangeMax - this.settings.rangeMin;
  }

  public render()
  {
    const r = this.settings.radius
    const oR = this.settings.overlayRadius;

    const settings = this.settings;

    if (settings.logControl && (this.property.range.min === undefined ||
      this.property.range.min <= 0))
    {
      vgUtils.log("Knob Error - Logarithmic control minimum range");
    }

    const propRange = Object.assign({}, this.property.range);
    propRange.min = (propRange.min !== undefined ? propRange.min : 0);
    propRange.max = (propRange.max !== undefined ? propRange.max : 1);

    const rangeMin = settings.logControl ? Math.log10(propRange.min) :
      propRange.min;
    const rangeMax = settings.logControl ? Math.log10(propRange.max) :
      propRange.max;
    let currentValue = settings.logControl ?
      Math.log10(this.state.currentValue) : this.state.currentValue;

    currentValue = Math.min(currentValue, rangeMax);
    currentValue = Math.max(currentValue, rangeMin);

    if (isNaN(currentValue))
    {
      currentValue = rangeMin;
    }

    // Current position in degrees from 0
    const currentPos = ((currentValue - rangeMin) /
      (rangeMax - rangeMin) * this.range) + settings.rangeMin;

    const arcEnd = this.positionToCords(currentPos);
    const arcSweep = currentPos > 180 ? 1 : 0;

    const backgroundEnd = this.positionToCords(settings.rangeMax);
    const backgroundSweep = settings.rangeMax > 180 ? 1 : 0;

    return(
        <svg id="knob" className={this.props.settingsType}
          height={r*2} width={r*2}
          onPointerDown={this.handlePointerDown}>
          <path
            className={`knob-background range`}
            d={`M${r} ${r} `+
              `L${this.arcStart.x},${this.arcStart.y} `+
              `A${r},${r} 1 ${backgroundSweep},1 `+
              `${backgroundEnd.x},${backgroundEnd.y} z`}
            transform={`scale(${this.state.turning ? settings.turnScale :
              1}) rotate(${settings.offset}, ${r}, ${r})`}
          />
          <circle className={`knob-background full`}
            cx={r} cy={r} r={r}
            transform={`scale(${this.state.turning ? settings.turnScale : 1})`}
          />
          <path
            className={`knob-arc`}
            d={`M${r} ${r} `+
              `L${this.arcStart.x},${this.arcStart.y} `+
              `A${r},${r} 1 ${arcSweep},1 `+
              `${arcEnd.x},${arcEnd.y} z`}
            transform={`scale(${this.state.turning ? settings.turnScale :
              1}) rotate(${settings.offset}, ${r}, ${r})`}
          />
          <path
            className={`knob-dial`}
            d={`M${r} ${r} L${arcEnd.x},${arcEnd.y} z`}
            transform={`scale(${this.state.turning ? settings.turnScale :
              1}) rotate(${settings.offset}, ${r}, ${r})`}
          />
          <circle className="knob-overlay"
            cx={r} cy={r} r={oR}
            transform={`scale(${this.state.turning ? settings.turnScale : 1})`}
          />
        </svg>
    );
  }

  private handlePointerDown = (e: React.PointerEvent<SVGElement>) =>
  {
    e.stopPropagation();
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointermove', this.handlePointerMove);

    this.circleCentre.x = e.currentTarget.getBoundingClientRect().left +
      this.settings.radius;
    this.circleCentre.y = e.currentTarget.getBoundingClientRect().top +
      this.settings.radius;

    // Pointer start coordinates with circle centre as origin
    this.pointerStart.x = e.pageX - this.circleCentre.x;
    this.pointerStart.y = e.pageY - this.circleCentre.y;

    this.setState({turning: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private handlePointerUp = (e: PointerEvent) =>
  {
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);

    this.setState({turning: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private handlePointerMove = (e: PointerEvent) =>
  {
    // Current pointer position coordinates with circle centre as origin
    const currentX = e.pageX - this.circleCentre.x;
    const currentY = e.pageY - this.circleCentre.y;

    const settings = this.settings;

    const propRange = Object.assign({}, this.property.range);
    propRange.min = (propRange.min !== undefined ? propRange.min : 0);
    propRange.max = (propRange.max !== undefined ? propRange.max : 1);

    const rangeMin = settings.logControl ? Math.log10(propRange.min) :
      propRange.min;
    const rangeMax = settings.logControl ? Math.log10(propRange.max) :
      propRange.max;
    const currentValue = settings.logControl ?
      Math.log10(this.state.currentValue) : this.state.currentValue;

    const currentPos = ((currentValue - rangeMin) /
      (rangeMax - rangeMin) * this.range) + this.settings.rangeMin

    let newPos;

    // Knob control mode
    if (this.settings.controlMode === "physical")
    {
      newPos = this.physicalMode(currentX, currentY, currentPos);
    }
    else if (this.settings.controlMode === "slider")
    {
      newPos = this.sliderMode(currentX, currentY, currentPos);
    }
    else
    {
      newPos = this.basicMode(currentX, currentY, currentPos);
    }

    newPos = this.limitPosition(newPos);

    let newValue = ((newPos / settings.rangeMax) * (rangeMax -
      rangeMin)) + rangeMin;

    if (settings.logControl)
    {
      newValue = Math.pow(10, newValue);
    }

    // Pointer start can now be current pointer coords
    this.pointerStart.x = currentX;
    this.pointerStart.y = currentY;

    if (this.state.currentValue !== newValue)
    {
      this.setState({currentValue: newValue});

      if (this.props.update)
      {
        this.props.update(newValue);
      }
    }
  }

  // Basic - Moving right increases knob value
  private basicMode = (currentX: number, currentY: number,
    currentPos: number) =>
  {
    const distance = Math.hypot(currentX - this.pointerStart.x, currentY -
      this.pointerStart.y) * Math.sign(currentX - this.pointerStart.x);

    const newPos = currentPos + distance;

    return newPos
  }

  // Physical - replicate physical knob control
  private physicalMode = (currentX: number, currentY: number,
    currentPos: number) =>
  {
    // Calculate angle between pointer start position and current pointer posiiton
    // and add to current knob position (angle)
    const dot = (this.pointerStart.x * currentX) + (this.pointerStart.y * currentY);
    const det = (this.pointerStart.x * currentY) - (this.pointerStart.y * currentX);
    const angleRad = Math.atan2(det, dot);
    const angle = angleRad * (180 / Math.PI);

    // Current position in degrees from 0
    const newPos = currentPos + angle;

    return newPos
  }

  // Slider - Vertical distance changes knob value, horizontal distance changes
  // scale of the knob value change
  private sliderMode = (currentX: number, currentY: number,
    currentPos: number) =>
  {
    const diffX = currentX;
    const diffY = (currentY - this.pointerStart.y) * (-1);

    const diff = (diffY * (Math.abs(diffX) / 500));

    const newPos = currentPos + diff;

    return newPos;
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

  // Calculate knob arc end point from arc start point and angle (position)
  // of the knob
  private positionToCords = (position: number) =>
  {
    const r = this.settings.radius
    const num90 = Math.floor(position / 90);
    const remain90 = position % 90;
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

    return {x: newX, y: newY}
  }
}

import * as React from 'react';
import * as Model from './model';

// turnScale - Scale increase whilst turning knob
// radius    - Knob radius
// rangeMin  - Usable knob range minimum from 0 (r, 2r)
// rangeMax  - Usable knob range maximum from 0 (r, 2r)
// offset    - Rotation offset of start from 0 (r, 2r)
const typeSettings: {default: {}, basic: {}, mini: {}} =
  {
    default : {radius: 20, rangeMin: 0, rangeMax: 359, offset: 0, turnScale: 1},
    basic : {radius: 20, rangeMin: 0, rangeMax: 270, offset: 225, turnScale: 1.5},
    mini : {radius: 10, rangeMin: 0, rangeMax: 270, offset: 225, turnScale: 1.5}
  }

interface IProps
{
  knob: Model.Knob;
  name: string;
  startUpdate: () => void;
  update: () => void;
  endUpdate: () => void;
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
      { currentValue: props.knob.start };
  }

  private knob: Model.Knob;

  private arcStart: {x: number, y: number};
  private mouseStart: {x: number, y: number};
  private circleCentre: {x: number, y: number};

  private settings: {radius: number, rangeMin: number, rangeMax: number,
    offset: number, turnScale: number}

  constructor(props: IProps)
  {
    super(props);

    this.knob = props.knob;

    this.settings = typeSettings[this.knob.type] ?
      typeSettings[this.knob.type] : typeSettings.default;

    this.state =
    {
      currentValue: this.knob.start,
      turning: false
    };

    this.arcStart = {x: this.settings.radius, y: 2*this.settings.radius};
    this.mouseStart = {x: 0, y: 0};
    this.circleCentre = {x: 0, y: 0};
  }

  public render()
  {
    const r = this.settings.radius

    // Current position in degrees from 0
    const currentPos = this.valueToPosition(this.state.currentValue);

    // Calculate knob arc end point from arc start point and angle (position)
    // of the knob
    const num90 = Math.floor(currentPos / 90);
    const remain90 = currentPos % 90;
    const remain90rad = (remain90 * Math.PI) / 180;

    const z = Math.sqrt((r*r) +
      (r*r) -
      (2*r*r*Math.cos(remain90rad)));

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
        newX = 0 + y,
        newY = r - x
        break;

      case 2:
        newX = r + x,
        newY = 0 + y
        break;

      case 3:
        newX = (r*2) - y,
        newY = (r) + x
        break;

      default:
        break;
    }

    const arcSweep = currentPos > 180 ? 1 : 0

    // Calculate value based on current position, range and maximum value
    const percent = currentPos / this.settings.rangeMax;
    const newValue = Math.round(percent * this.knob.maxValue);

    const position = this.props.knob.position;

    return(
      <svg id={this.props.name.toLowerCase()+"-knob"} className="knob-wrapper">
        <text className="label knob-label" x={position.x}
          y={position.y}>{this.props.name+":"+newValue}</text>
        <svg id="knob" className={this.knob.type} height={r*2} width={r*2}
          x={position.x} y={position.y+10}
          onMouseDown={this.handleMouseDown}>
          <circle className={`knob-background`}
            cx={r} cy={r} r={r}
            transform={"scale("+`${this.state.turning?
              this.settings.turnScale:"1"}`+")"}
          />
          <path
            className={`knob-arc`}
            d={`M${r} ${r} `+
              `L${this.arcStart.x},${this.arcStart.y} `+
              `A${r},${r} 1 ${arcSweep},1 `+
              `${newX},${newY} z`}
            transform={`scale(`+`${this.state.turning?
              this.settings.turnScale:"1"}) `+
              `rotate(${this.settings.offset}, ${r}, ${r})`}
          />
          <path
            className={`knob-dial`}
            d={`M${r} ${r} L${newX},${newY} z`}
            transform={`scale(`+`${this.state.turning?
              this.settings.turnScale:"1"}) `+
              `rotate(${this.settings.offset}, ${r}, ${r})`}
          />
          <circle className="knob-overlay"
            cx={r} cy={r}
            r={r/2}
            transform={"scale("+`${this.state.turning?
              this.settings.turnScale:"1"}`+")"}
          />
        </svg>
      </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
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

    // Calculate angle between mouse start position and current mouse posiiton
    // and add to current knob position (angle)
    const dot = (this.mouseStart.x * currentX) + (this.mouseStart.y * currentY);
    const det = (this.mouseStart.x * currentY) - (this.mouseStart.y * currentX);
    const angleRad = Math.atan2(det, dot);
    const angle = angleRad * (180 / Math.PI);
    let newPos = this.valueToPosition(this.state.currentValue) + angle;

    // Mouse start can now but current mouse coords
    this.mouseStart.x = currentX;
    this.mouseStart.y = currentY;

    newPos = this.limitPosition(newPos);

    const newValue = (newPos/this.settings.rangeMax)*this.knob.maxValue;

    this.setState({currentValue: newValue});

    this.knob.start = newValue;

    if (this.props.update)
    {
      this.props.update();
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

  // Convert value of knob to position of dial (degrees)
  private valueToPosition = (value: number) =>
  {
    return this.limitPosition((value/this.knob.maxValue)*this.settings.rangeMax);
  }
}

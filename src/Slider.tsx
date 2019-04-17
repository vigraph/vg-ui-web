import * as React from 'react';
import * as Model from './model';

// slideScale - Scale increase whilst sliding slider
const sliderSettings: {default: {}, horz: {}, vert: {}} =
  {
    default : {length: 80, thickness: 20, horizontal: true, slideScale: 1,
      dialThickness: 1, clickMove: true},
    horz : {length: 80, thickness: 20, horizontal: true, slideScale: 1.5,
      dialThickness: 1, clickMove: false},
    vert : {length: 80, thickness: 20, horizontal: false, slideScale: 1.5,
      dialThickness: 1, clickMove: false},
  }

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: number) => void;
  endUpdate: () => void;
  position: {x: number, y:number};
}

interface IState
{
  currentValue: number;
  sliding: boolean;
}

export default class Slider extends React.Component<IProps, IState>
{
  // Reset state from slider when not sliding - allows movement not by
  // sliding (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.sliding ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private mouseStart: {x: number, y: number};

  private settings: {length: number, thickness: number, horizontal: boolean,
    slideScale: number, dialThickness: number, clickMove: boolean};

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.settings = sliderSettings[this.property.subType] ?
      sliderSettings[this.property.subType] : sliderSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      sliding: false
    };

    this.mouseStart = {x: 0, y: 0};
  }

  public render()
  {
    // Current position from 0
    const currentPos =  ((this.state.currentValue - this.property.range.min) /
      (this.property.range.max - this.property.range.min)) * this.settings.length;
    const position = this.props.position;
    const settings = this.settings;

    return(
        <svg id="slider" className={this.property.subType}
          x={position.x} y={position.y}
          onMouseDown={this.handleMouseDown}>

          <rect className="slider-background"
            width={settings.length} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -settings.length},0)`}/>

          <rect className="slider-value"
            width={currentPos} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -settings.length},0)`}/>

          <rect className="slider-dial"
            x={currentPos}
            width={settings.dialThickness} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -settings.length},0)`}/>

        </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);

    this.mouseStart.x = e.pageX;
    this.mouseStart.y = e.pageY;

    this.setState({sliding: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    // Move current value to click position
    if (this.settings.slideScale === 1 && this.settings.clickMove)
    {
      const newDistance = this.settings.horizontal ?
        e.pageX - e.currentTarget.getBoundingClientRect().left - window.scrollX:
        this.settings.length - (e.pageY -
        e.currentTarget.getBoundingClientRect().top - window.scrollY);
      const newPos = this.limitPosition(newDistance);
      const newPercent = newPos / this.settings.length;
      const newValue = (newPercent * (this.property.range.max -
        this.property.range.min)) + this.property.range.min;

      this.setState({currentValue: newValue});
      if (this.props.update)
      {
        this.props.update(newValue);
      }
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);

    this.setState({sliding: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private handleMouseMove = (e: MouseEvent) =>
  {
    const diff = this.settings.horizontal ? e.pageX - this.mouseStart.x :
      this.mouseStart.y - e.pageY;

    let newPos = (((this.state.currentValue - this.property.range.min ) /
      (this.property.range.max - this.property.range.min)) * this.settings.length) +
      (diff / this.settings.slideScale);

    newPos = this.limitPosition(newPos);

    const newPercent = newPos / this.settings.length;
    const newValue = (newPercent * (this.property.range.max -
      this.property.range.min)) + this.property.range.min;

    this.setState({currentValue: newValue});

    this.mouseStart.x = e.pageX;
    this.mouseStart.y = e.pageY;

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }

  // Limit the position given to between 0 and the slider maximum (length)
  private limitPosition = (position: number) =>
  {
    if (position > this.settings.length)
    {
      position = this.settings.length;
    }
    else if (position < 0)
    {
      position = 0;
    }

    return position
  }
}

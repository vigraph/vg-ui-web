import * as React from 'react';
import * as Model from './model';

// slideScale - Scale increase whilst sliding slider
const sliderSettings: {default: {}, horz: {}, vert: {}, selector: {}} =
  {
    default : {length: 80, thickness: 20, horizontal: true, slideScale: 1,
      dialThickness: 1, padding: 0},
    horz : {length: 80, thickness: 20, horizontal: true, slideScale: 1.5,
      dialThickness: 1, padding: 0},
    vert : {length: 80, thickness: 20, horizontal: false, slideScale: 1.5,
      dialThickness: 1, padding: 0},
    selector : {length: 60, thickness: 20, horizontal: true, slideScale: 1,
      dialThickness: 30, padding: 15}
  }

interface IProps
{
  property: Model.Property;
  startUpdate: () => void;
  update: (value: number) => void;
  endUpdate: () => void;
}

interface IState
{
  currentPercent: number;
  sliding: boolean;
}

export default class Slider extends React.Component<IProps, IState>
{
  // Reset state from slider when not sliding - allows movement not by
  // sliding (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.sliding ? null :
      { currentPercent: props.property.value };
  }

  private property: Model.Property;

  private mouseStart: {x: number, y: number};

  private settings: {length: number, thickness: number, horizontal: boolean,
    slideScale: number, dialThickness: number, padding: number};

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.settings = sliderSettings[this.property.subType] ?
      sliderSettings[this.property.subType] : sliderSettings.default;

    this.state =
    {
      currentPercent: this.property.value,
      sliding: false
    };

    this.mouseStart = {x: 0, y: 0};
  }

  public render()
  {
    // Current position from 0
    const currentPos = (this.state.currentPercent*this.settings.length)
    const position = this.props.property.position;
    const settings = this.settings;
    const padding = this.settings.padding;
    const paddedLength = settings.length + (2 * padding);

    return(
        <svg id="slider" className={this.property.subType}
          x={position.x} y={position.y+10}
          onMouseDown={this.handleMouseDown}>

          <rect className="slider-background"
            width={paddedLength} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -paddedLength},0)`}/>

          <rect className="slider-value"
            width={currentPos + padding} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -paddedLength},0)`}/>

          <rect className="slider-dial"
            x={currentPos}
            width={settings.dialThickness} height={settings.thickness}
            transform={`scale(${this.state.sliding ? settings.slideScale :
              "1"}) rotate(${settings.horizontal ? "0" : "270"}, ${0}, ${0})` +
              `translate(${settings.horizontal ? "0" : -paddedLength},0)`}/>

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

    let newPos = (this.state.currentPercent * this.settings.length) +
      (diff / this.settings.slideScale);

    newPos = this.limitPosition(newPos);

    const newPercent = newPos / this.settings.length;

    this.setState({currentPercent: newPercent});

    this.mouseStart.x = e.pageX;
    this.mouseStart.y = e.pageY;

    if (this.props.update)
    {
      this.props.update(newPercent);
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

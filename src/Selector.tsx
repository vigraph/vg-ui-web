import * as React from 'react';
import * as Model from './model';

const selectorSettings: {default: {}, horz: {}, vert: {}} =
  {
    default : {length: 80, thickness: 20, horizontal: true},
    horz : {length: 80, thickness: 20, horizontal: true},
    vert : {length: 80, thickness: 20, horizontal: false},
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
  selecting: boolean;
}

export default class Selector extends React.Component<IProps, IState>
{
  // Reset state from selector when not selecting - allows movement not by
  // selecting (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.sliding ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private settings: {length: number, thickness: number, horizontal: boolean};
  private availableLength: number;
  private intervalSize: number;

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.settings = selectorSettings[this.property.subType] ?
      selectorSettings[this.property.subType] : selectorSettings.default;

    this.state =
    {
      currentValue: this.property.value,
      selecting: false
    };

    this.availableLength = this.props.property.available.length;
    this.intervalSize = this.settings.length / this.availableLength;
  }

  public render()
  {
    const position = this.props.position;
    const settings = this.settings;
    const availablePos = this.props.property.available
    const currentPos = availablePos.indexOf(this.state.currentValue);

    const positionSize = settings.length / availablePos.length;

    return(
        <svg id="selector" className={`${this.property.subType}
          ${this.state.selecting ? "selecting" : ""}`}
          x={position.x} y={position.y}
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}>

          <rect className="selector-background" width={settings.length}
            height={settings.thickness}
            transform={`rotate(${settings.horizontal ? "0" : "270"}, ${0},
              ${0}) translate(${settings.horizontal ? "0" :
              -settings.length - 5}, 0)`}/>

          {this.props.property.available.map((value: any, index: number) =>
            {
              return <svg id="selector-value" key={index}>
                <rect className={`selector-position ${value.toString()}
                  ${value === this.state.currentValue ? "selected" : ""}`}
                  width={positionSize} height={settings.thickness}
                  x={(positionSize * index)}
                  transform={`rotate(${settings.horizontal ? "0" : "270"}, ${0},
                  ${0}) translate(${settings.horizontal ? "0" :
                  -settings.length - 5}, 0)`}/>
                <text className="label selector-label"
                  x={`${settings.horizontal ? (positionSize * index) + 5 :
                    settings.thickness + 10}`}
                  y={`${settings.horizontal ? settings.thickness + 10 :
                    settings.length - (positionSize * index) + 15 -
                    positionSize}`}>
                  {value}
                </text>
              </svg>
            })
          }

          <rect className="selector-dial"
            x={(positionSize * currentPos) + (positionSize / 2)}
            width={1} height={settings.thickness}
            transform={`rotate(${settings.horizontal ? "0" : "270"}, ${0},
              ${0}) translate(${settings.horizontal ? "0" :
              -settings.length},0)`}/>

        </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({selecting: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    this.calculateNewPosition(e);
  }

  private handleMouseMove = (e: React.MouseEvent<SVGElement>) =>
  {
    if (this.state.selecting)
    {
      this.calculateNewPosition(e);
    }
  }

  private calculateNewPosition = (e: React.MouseEvent<SVGElement>) =>
  {
    const position = this.settings.horizontal ?
    e.pageX - e.currentTarget.getBoundingClientRect().left :
    this.settings.length - (e.pageY -
    e.currentTarget.getBoundingClientRect().top);

    if (position < 0)
    {
      return;
    }

    const selectValuePos = Math.floor(position / this.intervalSize);
    const newValuePos = selectValuePos > this.availableLength - 1 ?
      this.availableLength - 1: selectValuePos;
    const newValue = this.props.property.available[newValuePos];

    if (this.state.currentValue !== newValue)
    {
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

    this.setState({selecting: false});

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }
}

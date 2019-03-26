import * as React from 'react';
import * as Model from './model';

const buttonSettings: {default: {}, square: {}, circle: {}} =
{
  default: {height: 40, width: 40, rx: 10, ry: 10, offset: 10, latch: true},
  square: {height: 40, width: 40, rx: 0, ry: 0, offset: 10, latch: true},
  circle: {height: 40, width: 40, rx: 100, ry: 100, offset: 10, latch: false}
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
  pressing: boolean;
}

export default class Button extends React.Component<IProps, IState>
{
  // Reset state from button when not pressing - allows movement not by
  // pressing (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.pressing ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private settings: {height: number, width: number, rx: number, ry: number,
    offset: number, circle: boolean, latch: boolean};

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.settings = buttonSettings[this.property.subType] ?
      buttonSettings[this.property.subType] : buttonSettings.default;

    this.state =
    {
      // Either 0 (off) or 1 (on)
      currentValue: this.property.value ? 1 : 0,
      pressing: false
    };
  }

  public render()
  {
     const position = this.props.position;
     const settings = this.settings;

    return(
        <svg id="button" className={this.property.subType}
          height={this.settings.height} width={this.settings.width}
          x={position.x} y={position.y}
          onMouseDown={this.handleMouseDown}>

          <rect className="button-outer"
            width={settings.width} height={settings.height}
            rx={settings.rx} ry={settings.ry} />

          <rect className={`button-inner ` +
            `${this.state.currentValue ? "on" : "off"} ` +
            `${this.state.pressing ? "pressing" : ""}`}
            x={settings.offset/2} y={settings.offset/2}
            width={settings.width - settings.offset}
            height={settings.height - settings.offset}
            rx={settings.rx} ry={settings.ry} />
        </svg>
    );
  }

  private handleMouseDown = (e: React.MouseEvent<SVGElement>) =>
  {
    window.addEventListener('mouseup', this.handleMouseUp);

    this.setState({pressing: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }

    if (!this.settings.latch)
    {
      this.toggleValue();
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleMouseUp);

    this.toggleValue();

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }

  private toggleValue = () =>
  {
    this.setState({pressing: false});

    const newValue = this.state.currentValue ? 0 : 1;
    this.setState({currentValue: newValue});

    if (this.props.update)
    {
      this.props.update(newValue);
    }
  }
}

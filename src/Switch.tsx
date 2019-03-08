import * as React from 'react';
import * as Model from './model';

const switchSettings: {default: {}, square: {}, circle: {}} =
{
  default: {height: 40, width: 40, rx: 10, ry: 10, offset: 10},
  square: {height: 40, width: 40, rx: 0, ry: 0, offset: 10},
  circle: {height: 40, width: 40, rx: 100, ry: 100, offset: 10}
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
  currentValue: number;
  switching: boolean;
}

export default class Switch extends React.Component<IProps, IState>
{
  // Reset state from switch when not switching - allows movement not by
  // switching (e.g. undo/redo) to work
  public static getDerivedStateFromProps(props: IProps, state: any)
  {
    return state.switching ? null :
      { currentValue: props.property.value };
  }

  private property: Model.Property;

  private settings: {height: number, width: number, rx: number, ry: number,
    offset: number, circle: boolean};

  constructor(props: IProps)
  {
    super(props);

    this.property = props.property;

    this.settings = switchSettings[this.property.subType] ?
      switchSettings[this.property.subType] : switchSettings.default;

    this.state =
    {
      // Either 0 (off) or 1 (on)
      currentValue: this.property.value ? 1 : 0,
      switching: false
    };
  }

  public render()
  {
     const position = this.property.position;
     const settings = this.settings;

    return(
        <svg id="switch" className={this.property.subType}
          height={this.settings.height} width={this.settings.width}
          x={position.x} y={position.y+10}
          onMouseDown={this.handleMouseDown}>

          <rect className="switch-outer"
            width={settings.width} height={settings.height}
            rx={settings.rx} ry={settings.ry} />

          <rect className={`switch-inner ` +
            `${this.state.currentValue ? "on" : "off"} ` +
            `${this.state.switching ? "switching" : ""}`}
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

    this.setState({switching: true});

    if (this.props.startUpdate)
    {
      this.props.startUpdate();
    }
  }

  private handleMouseUp = (e: MouseEvent) =>
  {
    window.removeEventListener('mouseup', this.handleMouseUp);

    this.setState({switching: false});

    const newValue = this.state.currentValue ? 0 : 1;
    this.setState({currentValue: newValue});

    if (this.props.update)
    {
      this.props.update(newValue);
    }

    if (this.props.endUpdate)
    {
      this.props.endUpdate();
    }
  }
}

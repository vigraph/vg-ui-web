import * as React from 'react';

interface IProps
{
  startPosition: {x: number, y: number},
  horizontal: boolean,
  empty: boolean,
  notifyPin: (pin: boolean) => void
}

interface IState
{
  pinned: boolean,
  x: number,
  y: number
}

export default class Panel extends React.Component<IProps, IState>
{
  private offsetX: number;
  private offsetY: number;
  private panelRef: HTMLDivElement | null;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      pinned: false,
      x: this.props.startPosition.x,
      y: this.props.startPosition.y
    }

    this.offsetX = 0;
    this.offsetY = 0;
    this.panelRef = null;
  }

  public render()
  {
    return <div id="panel" className={`panel-wrapper ${this.props.horizontal ?
      "horizontal": ""} ${this.props.empty ? "empty" : ""}`}
      style={{left: this.state.x, top: this.state.y}}
      ref={(ref) => { this.panelRef = ref; }}>
        <div id="panel-ui-wrapper">
          <svg id="pin-button" className={this.state.pinned?"pinned":""}
            onPointerDown={this.togglePin}>
            <circle cx="7" cy="7" r="7"/>
          </svg>
          <div id="drag-bar-wrapper" onPointerDown={this.handlePointerDown}>
            <div id="drag-bar-1" className={"drag-bar"}/>
            <div id="drag-bar-2" className={"drag-bar"}/>
            <div id="drag-bar-3" className={"drag-bar"}/>
          </div>
        </div>
      {this.props.children}
    </div>;
  }

  // Update panel position on window resize so panel isn't lost off the side of
  // the window
  public componentDidMount()
  {
    window.addEventListener("resize", this.checkCurrentPanelPosition);
  }

  public componentWillUnmount()
  {
    window.removeEventListener("resize", this.checkCurrentPanelPosition);
  }

  private togglePin = (e: React.PointerEvent<SVGSVGElement>) =>
  {
    e.stopPropagation();
    const newPinState = !this.state.pinned;
    this.props.notifyPin(newPinState);
    this.setState({pinned: newPinState});
  }

  // Start drag move if panel isn't pinned
  private handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.stopPropagation();
    e.preventDefault();

    if (!this.state.pinned)
    {
      window.addEventListener('pointerup', this.handlePointerUp);
      window.addEventListener('pointermove', this.handlePointerMove);

      this.offsetX = e.pageX - this.state.x;
      this.offsetY = e.pageY - this.state.y;
    }
  }

  private handlePointerUp = (e: PointerEvent) =>
  {
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
  }

  private handlePointerMove = (e: PointerEvent) =>
  {
    this.setState(this.checkPanelPosition(e.pageX - this.offsetX,
      e.pageY - this.offsetY));
  }

  // Ensure panel isn't moved off any of the window edges
  private checkPanelPosition = (x: number, y: number) =>
  {
    let newX = (x < 0 ? 0 : x);
    let newY = (y < 0 ? 0 : y);

    // Don't allow panel to be moved off screen
    if (this.panelRef)
    {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const menuBoundX = newX + this.panelRef.offsetWidth;
      const menuBoundY = newY + this.panelRef.offsetHeight;

      if (menuBoundX > windowWidth)
      {
        newX = windowWidth - this.panelRef.offsetWidth;
      }

      if (menuBoundY > windowHeight)
      {
        newY = windowHeight - this.panelRef.offsetHeight;
      }
    }

    return {x: newX, y: newY};
  }

  private checkCurrentPanelPosition = () =>
  {
    this.setState(this.checkPanelPosition(this.state.x, this.state.y));
  }
}

import * as React from 'react';

interface IProps
{
  id: string,
  startPosition: {x: number, y: number},
  horizontal: boolean,
  empty: boolean,
  notifyPin: (pin: boolean, id?: string) => void,
  returnRef?: (ref: HTMLDivElement | null) => void,
  parentRef?: HTMLDivElement,
  parentPadding?: number
}

interface IState
{
  id: string,
  pinned: boolean,
  x: number,
  y: number
}

export default class Panel extends React.Component<IProps, IState>
{
  private offsetX: number;
  private offsetY: number;
  private panelRef: HTMLDivElement | null;
  private positionOverride: boolean;
  private updateRef: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      id: this.props.id,
      pinned: false,
      x: this.props.startPosition.x,
      y: this.props.startPosition.y
    }

    this.offsetX = 0;
    this.offsetY = 0;
    this.panelRef = null;
    this.positionOverride = false;
    this.updateRef = false;
  }

  public render()
  {
    return <div id={this.props.id+"-panel"}
      className={`panel-wrapper ${this.props.horizontal ?
      "horizontal": ""} ${this.props.empty ? "empty" : ""}`}
      style={{left: this.state.x, top: this.state.y}}
      ref={(ref) => { this.panelRef = ref; }}
      onContextMenu={this.preventDefault}>
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
    if (this.props.returnRef)
    {
      this.props.returnRef(this.panelRef);
    }

    this.checkPositionInWindow();
  }

  public componentWillUnmount()
  {
    window.removeEventListener("resize", this.checkCurrentPanelPosition);
    if (this.props.returnRef)
    {
      this.props.returnRef(this.panelRef);
    }

    this.positionOverride = false;
  }

  // Check panel position in window on update if allowed
  public componentDidUpdate()
  {
    // Pass back reference to panel
    if (this.updateRef && this.props.returnRef)
    {
      this.updateRef = false;
      this.props.returnRef(this.panelRef);
    }

    const pos = this.props.startPosition;

    // Panel has been updated with a new id so reset state and position override
    // flag
    if (this.state.id !== this.props.id)
    {
      this.setState({id: this.props.id});
      this.positionOverride = false;
    }

    // Position hasn't been overridden and is different from previous position
    // so check the panel position is correct within the window
    if (!this.positionOverride && (this.state.x !== pos.x ||
      this.state.y !== pos.y))
    {
      this.setState({x: this.props.startPosition.x,
      y: this.props.startPosition.y});

      this.checkPositionInWindow();
    }
  }

  private togglePin = (e: React.PointerEvent<SVGSVGElement>) =>
  {
    e.stopPropagation();
    e.preventDefault();

    const newPinState = !this.state.pinned;
    this.props.notifyPin(newPinState, this.props.id);
    this.setState({pinned: newPinState});
  }

  private preventDefault = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.preventDefault();
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
    this.positionOverride = true;
    this.setState(this.checkPanelPosition(e.pageX - this.offsetX,
      e.pageY - this.offsetY));
  }

  // Ensure panel isn't moved off any of the window edges
  private checkPanelPosition = (x: number, y: number) =>
  {
    let newX = Math.max(x, 0);
    let newY = Math.max(y, 0);

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

  // Check panel is positioned within the window, moving it if necessary
  private checkPositionInWindow = () =>
  {
    if (this.panelRef)
    {
      // Reposition menu if it would be created off screen
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const newPosition = {...this.props.startPosition};

      const menuBoundX = newPosition.x + this.panelRef.offsetWidth;
      const menuBoundY = newPosition.y + this.panelRef.offsetHeight;

      let updateFlag = false;

      if (menuBoundX > windowWidth)
      {
        updateFlag = true;
        newPosition.x -= this.panelRef.offsetWidth;
      }

      if (menuBoundY > windowHeight)
      {
        updateFlag = true;
        newPosition.y -= this.panelRef.offsetHeight;

        // Add padding between panel and parent panel if it exists
        if (this.props.parentRef)
        {
          newPosition.y -= (this.props.parentRef.offsetHeight +
            (this.props.parentPadding?this.props.parentPadding:0));
        }
      }

      if (updateFlag)
      {
        this.positionOverride = true;
        this.setState({x: newPosition.x, y: newPosition.y});
        this.updateRef = true;
      }
    }
  }
}
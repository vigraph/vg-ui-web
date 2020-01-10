import * as React from 'react';

import { vgData } from './data/Data';
import { vgConfig } from './lib/Config';
import { vgIcons } from './icons/Icons';

interface IProps
{
  position: {x: number, y: number},
  menuClosed: () => void,
  menuItemSelected: (id: string, position?: {x: number, y: number}) => void,
  pinMenu: (pin: boolean) => void
}

interface IState
{
  menuItem?: {id: string, children: Array<string[]>},
  position: {x: number, y: number},
  subMenuPosition: {x: number, y: number, reverse: boolean},
  pinned: boolean,
  showLabel: string | null
}

export default class Menu extends React.Component<IProps, IState>
{
  private menuData: Array<{id: string, children: Array<string[]>}>;
  private menuRef: HTMLDivElement | null;
  private subMenuRef: HTMLDivElement | null;
  private updateSubMenu: boolean;
  private pointerPosition: {x: number, y: number};
  private hoverTimer: number | null;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      menuItem: undefined,
      position: this.props.position,
      subMenuPosition: {x: 0, y: 0, reverse: false},
      pinned: false,
      showLabel: null
    }

    this.menuRef = null;
    this.subMenuRef = null;
    this.updateSubMenu = true;
    this.pointerPosition = {x: 0, y: 0};
    this.hoverTimer = null;

    this.menuData = this.generateMenuData();
  }

  public render()
  {
    if (!this.menuData.length)
    {
      this.menuData = this.generateMenuData();
    }

    const position = (this.state.pinned ? this.props.position :
      this.state.position);

    return <div id="menu" className="menu"
      onContextMenu={this.handleMenuContextMenu}>
      <div className={"menu-parent-wrapper"}
      style={{left: position.x, top: position.y}}
      ref={(ref) => { this.menuRef = ref; }}>
        <svg id="pin-button" className={this.state.pinned?"pinned":""}
        onPointerDown={this.togglePin}>
          <circle cx="7" cy="7" r="5"/>
        </svg>
      {
        this.menuData.map((value: {id: string, children: Array<string[]>},
          index: number) =>
        {
          const Icon = vgIcons.Menu[value.id] ? vgIcons.Menu[value.id] : "";
          return <div key={index} id={"menu-"+value.id}
            className={`menu-item parent` +
              ` ${(this.state.menuItem && value.id ===
              this.state.menuItem.id) ? "selected" : "" }`}
            onPointerDown={this.handleParentPointerDown}
            onPointerMove={this.handlePointerMove}
            onPointerEnter={this.handlePointerEnter}
            onPointerLeave={this.handlePointerLeave}>
            {
              Icon ? <Icon /> : value.id
            }
            </div>
        })
      }
      </div>
      {
        this.state.menuItem && this.createSubMenu()
      }
      {
        this.state.showLabel && this.createLabel()
      }
    </div>
  }

  public componentDidMount()
  {
    if (this.menuRef)
    {
      // Reposition menu if it would be created off screen
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const newPosition = {...this.props.position};

      const menuBoundX = newPosition.x + this.menuRef.offsetWidth;
      const menuBoundY = newPosition.y + this.menuRef.offsetHeight;

      let updateFlag = false;

      if (menuBoundX > windowWidth)
      {
        updateFlag = true;
        newPosition.x -= this.menuRef.offsetWidth;
      }

      if (menuBoundY > windowHeight)
      {
        updateFlag = true;
        newPosition.y -= this.menuRef.offsetHeight;
      }

      if (updateFlag)
      {
        this.setState({position: newPosition});
      }
    }
  }

  public componentDidUpdate()
  {
    // Only update when updateSubMenu is set to stop an infinite number of
    // componentDidUpdate calls
    if (this.state.menuItem && this.menuRef && this.subMenuRef &&
      this.updateSubMenu)
    {
      // Reposition menu if it would be created off screen
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const newPosition = (this.state.pinned ? {...this.props.position} :
      {...this.state.position});

      newPosition.y += this.menuRef.offsetHeight + 10;

      const menuBoundX = newPosition.x + this.subMenuRef.offsetWidth;
      const menuBoundY = newPosition.y + this.subMenuRef.offsetHeight;

      let reverseOrder = false;

      if (menuBoundX > windowWidth)
      {
        newPosition.x -= (this.subMenuRef.offsetWidth -
          this.menuRef.offsetWidth);
      }

      if (menuBoundY > windowHeight)
      {
        newPosition.y -= (this.subMenuRef.offsetHeight +
          this.menuRef.offsetHeight);

        reverseOrder = true;
      }

      this.updateSubMenu = false;
      this.setState({subMenuPosition: {...newPosition, reverse: reverseOrder}});
    }
  }

  private createSubMenu = () =>
  {
    const menuID = (this.state.menuItem ? this.state.menuItem.id : "");
    const menuData = this.menuData.find(x => x.id === menuID);

    if (menuData)
    {
      if (this.state.pinned)
      {
        window.addEventListener("pointerdown", this.handleWindowPointerDown);
      }

      const position = this.state.subMenuPosition;

      // Reverse order of sub menu block creation when sub menu created above
      // menu. Ensures submenu and menu are visually connected
      const subMenuData = (position.reverse ?
        menuData.children.slice(0).reverse() : menuData.children);

      return <div className={"menu-children-wrapper"}
        style={{left: position.x, top: position.y}}
        ref={(ref) => { this.subMenuRef = ref; }}>
        {
          subMenuData.map(
            (subMenuBlock: string[], index: number) =>
            {
              return <div id={"sub-menu-block-"+index} key={"block-"+index}
                className={"sub-menu-block"}>
                {
                  subMenuBlock.map((value: string, index: number) =>
                  {
                    const id = menuID + "/" + value;
                    const Icon = vgIcons.Menu[id]?vgIcons.Menu[id]:"";

                    return <div key={index} id={"menu-"+id}
                      className="menu-item child"
                      onPointerDown={this.handleChildPointerDown}
                      onPointerMove={this.handlePointerMove}
                      onPointerEnter={this.handlePointerEnter}
                      onPointerLeave={this.handlePointerLeave}>
                      {
                        Icon ? <Icon /> : <span>{ value }</span>
                      }
                      </div>
                  })
                }
                </div>
            })
        }
      </div>
    }
  }

  private generateMenuData = () =>
  {
    const metadata = vgData.returnMetadata();
    const menuData: Array<{id: string, children: Array<string[]>}> = [];

    vgConfig.Graph.menu.parents.forEach((category: string) =>
      {
        const children: Array<string[]> = [[]];
        let count: number = 0;
        let section: number = 0;

        if (metadata[category] && vgConfig.Graph.menu.children[category])
        {
          vgConfig.Graph.menu.children[category].forEach((child: string) =>
          {
            if (metadata[category][child])
            {
              if (count + 1 > vgConfig.Graph.menu.size)
              {
                section++;
                count = 0;
                children[section] = [];
              }
              children[section].push(child);
              count++;
            }
          });

          menuData.push({id: category, children});
        }
      });

    return menuData;
  }

  private createLabel = () =>
  {
    return <div id={"menu-label"} className={"menu label"}
      style={{left: this.pointerPosition.x, top: this.pointerPosition.y}}>
        {this.state.showLabel}
      </div>
  }

  private handleParentPointerDown = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.stopPropagation();
    const target = e.currentTarget.id;
    const targetItemID = target.substring(5, target.length);

    if (this.state.menuItem && this.state.menuItem.id === targetItemID)
    {
      this.setState({menuItem: undefined});
    }
    else
    {
      this.updateSubMenu = true;
      this.setState({menuItem: this.menuData.find(x => x.id === targetItemID),
        subMenuPosition: {x: 0, y: 0, reverse: false}});
      this.clearHoverTimeout();
    }
  }

  private handleChildPointerDown = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.stopPropagation();
    const target = e.currentTarget.id;
    if (!this.state.pinned)
    {
      this.clearHoverTimeout();
      this.props.menuClosed();
    }
    else
    {
      this.setState({menuItem: undefined});
    }

    const position = (this.state.pinned ? {x: e.pageX, y: e.pageY}: undefined);

    this.props.menuItemSelected(target.substring(5, target.length), position);
  }

  // Do nothing - prevents browser context menu from showing
  private handleMenuContextMenu = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.preventDefault();
  }

  private handleWindowPointerDown = (e: PointerEvent) =>
  {
    e.stopPropagation();
    window.removeEventListener("pointerdown", this.handleWindowPointerDown);
    this.setState({menuItem: undefined});
  }

  private handlePointerMove = (e: React.PointerEvent) =>
  {
    this.pointerPosition = {x: e.pageX+10, y: e.pageY+10};
  }

  private handlePointerEnter = (e: React.PointerEvent) =>
  {
    const id = e.currentTarget.id;
    let itemID = id.substring(5, id.length);

    if (itemID.lastIndexOf("/") >= 1)
    {
      itemID = itemID.substring(itemID.lastIndexOf("/") + 1, itemID.length);
    }

    this.hoverTimer = window.setTimeout(() =>
      {
        this.setState({showLabel: itemID});
      }, vgConfig.Graph.menu.hoverTime * 1000)
  }

  private handlePointerLeave = (e: React.PointerEvent) =>
  {
    this.clearHoverTimeout();
  }

  private clearHoverTimeout = () =>
  {
    if (this.hoverTimer)
    {
      this.setState({showLabel: null});
      window.clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  // Toggle pinning menu to set position (handled by Graph)

  private togglePin = (e: React.MouseEvent<SVGSVGElement>) =>
  {
    e.stopPropagation();
    window.removeEventListener("pointerdown", this.handleWindowPointerDown);
    const newPinState = !this.state.pinned;
    this.updateSubMenu = true;
    this.setState({pinned: newPinState});
    this.props.pinMenu(newPinState);
  }
}

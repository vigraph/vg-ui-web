import * as React from 'react';

import { vgData } from './data/Data';
import { vgConfig } from './lib/Config';
import { vgIcons } from './icons/Icons';
import { vgUtils } from './lib/Utils';

import Panel from './Panel';

interface IProps
{
  displayState: string,
  position: {x: number, y: number},
  menuClosed: () => void,
  menuItemSelected: (id: string, position?: {x: number, y: number}) => void,
  pinMenu: (pin: boolean) => void
}

interface IState
{
  subMenuPanels: Array<{id: string, children: Array<string[]>,
    position: {x: number, y: number}, pinned: boolean}>,
  position: {x: number, y: number},
  showLabel: string | null,
  display: string
}

export default class Menu extends React.Component<IProps, IState>
{
  private menuData: Array<{id: string, children: Array<string[]>}>;
  private menuRef: HTMLDivElement | null;
  private updateSubMenu: boolean;
  private pointerPosition: {x: number, y: number};
  private hoverTimer: number | null;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      subMenuPanels: [],
      position: this.props.position,
      showLabel: null,
      display: this.props.displayState
    }

    this.menuRef = null;
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

    const position = this.state.position;

    return <div id="menu" className="menu">
      { this.state.display !== "hidden" && <Panel id="menu"
      startPosition={{x: position.x, y: position.y}}
      horizontal={true} empty={false} notifyPin={this.props.pinMenu}
      returnRef={this.updateMenuRef}>
      {
          <div className={"menu-parent-wrapper"}>
          {
            this.menuData.map((value: {id: string, children: Array<string[]>},
              index: number) =>
            {
              const Icon = vgIcons.Menu[value.id] ? vgIcons.Menu[value.id] : "";
              return <div key={index} id={"menu-"+value.id}
                className={`menu-item parent` +
                  ` ${(this.state.subMenuPanels.length &&
                  this.state.subMenuPanels.find(x => x.id === value.id)) ?
                  "selected" : "" }`}
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
    }
      </Panel>
    }
      {
        this.state.subMenuPanels.map(
          (subMenu: {id: string, children: Array<string[]>,
            position: {x: number, y: number}, pinned: boolean},
            index: number) =>
          {
            return this.createSubMenu(subMenu, index);
          })
      }
      {
        this.state.showLabel && this.createLabel()
      }
        </div>
  }

  // Update state values from properties to ensure they're up to date
  public componentDidUpdate()
  {
    let stateUpdate = {};

    if (this.state.display !== this.props.displayState)
    {
      stateUpdate = {...stateUpdate, display: this.props.displayState};
    }

    // If display state = hidden then hide all unpinned panels
    if (this.props.displayState === "hidden")
    {
      const newSubMenuPanels = this.clearUnpinnedPanels();
      if (newSubMenuPanels.length !== this.state.subMenuPanels.length)
      {
        stateUpdate = {...stateUpdate, subMenuPanels: newSubMenuPanels};
      }
    }

    if (this.state.position !== this.props.position &&
      this.props.displayState !== "pinned")
    {
      stateUpdate = {...stateUpdate, position: this.props.position};
    }

    // State has changed so update
    if (Object.keys(stateUpdate).length)
    {
      this.setState(stateUpdate);
    }
  }

  // Create single sub menu panel
  private createSubMenu = (menuData: {id: string, children: Array<string[]>,
    position: {x: number, y: number}, pinned: boolean},
    key: number) =>
  {
    const position = menuData.position;

    return <Panel id={menuData.id} key={key}
    startPosition={{x: position.x, y: position.y}}
    horizontal={true} empty={false} notifyPin={this.notifySubMenuPin}
    parentRef={this.menuRef?this.menuRef:undefined}
    parentPadding={vgConfig.Graph.menu.padding*2}>
    {
      <div className={"menu-children-wrapper"}>
        <div className={"menu-children-title label"}>
        {vgUtils.capitaliseFirstLetter(menuData.id)}
        </div>
        {
          menuData.children.map(
            (subMenuBlock: string[], index: number) =>
            {
              return <div id={"sub-menu-block-"+index} key={"block-"+index}
                className={"sub-menu-block"}>
                {
                  subMenuBlock.map((value: string, index: number) =>
                  {
                    const id = menuData.id + "/" + value;
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
    </Panel>
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

    const targetIndex =
      this.state.subMenuPanels.findIndex(x => x.id === targetItemID);

    if (targetIndex > -1)
    {
      if (!this.state.subMenuPanels[targetIndex].pinned)
      {
        const subMenuPanels = this.state.subMenuPanels;
        subMenuPanels.splice(targetIndex, 1);
        this.setState({subMenuPanels});
      }
    }
    else
    {
      this.updateSubMenu = true;

      // Position sub menu under center of parent icon
      const subMenuPosition = {...this.state.position};

      if (this.menuRef)
      {
        subMenuPosition.y = this.menuRef.offsetTop +
          this.menuRef.offsetHeight + vgConfig.Graph.menu.padding;
        subMenuPosition.x = this.menuRef.offsetLeft +
          e.currentTarget.offsetLeft + (e.currentTarget.offsetWidth / 2);
      }

      const newSubMenuPanel = this.menuData.find(x => x.id === targetItemID);
      const subMenuPanels = this.clearUnpinnedPanels();

      if (newSubMenuPanel)
      {
        subMenuPanels.push({...newSubMenuPanel, position: subMenuPosition,
          pinned: false});
      }

      this.setState({subMenuPanels});
      this.clearHoverTimeout();
    }
  }

  private handleChildPointerDown = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.stopPropagation();
    const target = e.currentTarget.id;

    this.clearHoverTimeout();
    this.props.menuClosed();

    this.props.menuItemSelected(target.substring(5, target.length),
      {x: e.pageX, y: e.pageY});
  }

  // Do nothing - prevents browser context menu from showing
  private handleMenuContextMenu = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.preventDefault();
  }

  private handlePointerMove = (e: React.PointerEvent) =>
  {
    this.pointerPosition = {x: e.pageX+vgConfig.Graph.menu.padding,
      y: e.pageY+vgConfig.Graph.menu.padding};
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

  private updateMenuRef = (ref: HTMLDivElement | null) =>
  {
    this.menuRef = ref;
  }

  // Sub menu panel has been pinned so update pinned state in sub menu panels
  // store
  private notifySubMenuPin = (pin: boolean, id?: string) =>
  {
    const newSubMenuPanels = this.state.subMenuPanels;
    const index = newSubMenuPanels.findIndex(x => x.id === id);

    if (index > -1)
    {
      newSubMenuPanels[index].pinned = pin;
      this.setState({subMenuPanels: newSubMenuPanels});
    }
  }

  // Clear all panels with pinned = false
  private clearUnpinnedPanels = () =>
  {
    const newSubMenuPanels = this.state.subMenuPanels.filter(
        (subMenuPanel: {id: string, children: Array<string[]>,
          position: {x: number, y: number}, pinned: boolean}) =>
        {
          return subMenuPanel.pinned;
        });

    if (newSubMenuPanels.length !== this.state.subMenuPanels.length)
    {
      return newSubMenuPanels;
    }
    else
    {
      return this.state.subMenuPanels;
    }
  }
}

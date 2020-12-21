import * as React from 'react';

import { vgData } from './data/Data';
import { vgConfig } from './lib/Config';
import { vgIcons } from './icons/Icons';
import { vgUtils } from './lib/Utils';

import Panel from './Panel';

interface IProps
{
  graphDisplay: string,
  position: {x: number, y: number},
  menuStateUpdate: (menuState: string) => void,
  menuItemSelected: (id: string, position?: {x: number, y: number}) => void
}

interface IState
{
  subMenuPanels: Array<{id: string, children: Array<string>,
    position: {x: number, y: number}, pinned: boolean}>,
  position: {x: number, y: number},
  itemLabel: {name: string, description?: string, x: number, y: number} | null,
  display: string,
  draggingIcon: {id: string, x: number, y: number} | null
}

export default class Menu extends React.Component<IProps, IState>
{
  private menuData: Array<{id: string, children: Array<string>}>;
  private menuRef: HTMLDivElement | null;
  private updateSubMenu: boolean;
  private mouseDownChild: boolean;
  private menuPinned: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      subMenuPanels: [],
      position: this.props.position,
      itemLabel: null,
      display: this.props.graphDisplay,
      draggingIcon: null
    }

    this.menuRef = null;
    this.updateSubMenu = true;
    this.mouseDownChild = false;
    this.menuPinned = false;

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
      { (this.state.display !== "hidden" || this.menuPinned) && <Panel id="menu"
        startPosition={{x: position.x, y: position.y}}
        horizontal={true} empty={false} notifyPin={this.notifyMenuPin}
        returnRef={this.updateMenuRef}>
        {
          <div className={"menu-parent-wrapper"}>
          {
            this.menuData.map((value: {id: string, children: Array<string>},
              index: number) =>
            {
              const Icon = vgIcons.Menu[value.id] ? vgIcons.Menu[value.id] : "";
              return <div key={index} id={"menu-"+value.id}
                className={`menu-item parent` +
                  ` ${(this.state.subMenuPanels.length &&
                  this.state.subMenuPanels.find(x => x.id === value.id)) ?
                  "selected" : "" }`}
                onPointerDown={this.handleParentPointerDown}>
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
          (subMenu: {id: string, children: Array<string>,
            position: {x: number, y: number}, pinned: boolean},
            index: number) =>
          {
            return this.createSubMenu(subMenu, index);
          })
      }
      { this.createDraggingIcon() }
    </div>
  }

  // Update state values from properties to ensure they're up to date
  public componentDidUpdate()
  {
    let stateUpdate = {};

    let newDisplay;

    // Told to show from Graph (right click on background) so show
    if (this.props.graphDisplay === "show")
    {
      newDisplay = "show";
    }
    // Told to hide from Graph (left click on background)
    else if (this.props.graphDisplay === "hidden")
    {
      // Hide all unpinned subpanels
      const newSubMenuPanels = this.clearUnpinnedPanels();
      if (newSubMenuPanels.length !== this.state.subMenuPanels.length)
      {
        stateUpdate = {...stateUpdate, subMenuPanels: newSubMenuPanels};
      }

      // If the menu is pinned tell Graph that menu is still being shown
      // (and therefore used)
      if (this.menuPinned)
      {
        this.props.menuStateUpdate("show");
        newDisplay = "show";
      }
      // Menu is not pinned so update state to hidden
      else
      {
        newDisplay = "hidden";
      }
    }

    // Update display state if it has changed
    if (newDisplay !== this.state.display)
    {
      stateUpdate = {...stateUpdate, display: newDisplay};
    }

    if (this.state.position !== this.props.position && !this.menuPinned)
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
  private createSubMenu = (menuData: {id: string, children: Array<string>,
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
            (value: string, index: number) =>
            {
              const id = menuData.id + "/" + value;
              const Icon = vgIcons.Menu[id]?vgIcons.Menu[id]:"";

              return <div key={index} id={"menu-"+id}
                          className="menu-item child"
                          onPointerDown={this.handleChildPointerDown}
                          onPointerUp={this.handleChildPointerUp}
                          onPointerMove={this.handleChildPointerMove}
                          onPointerEnter={this.handleChildPointerEnter}
                          onPointerLeave={this.handleChildPointerLeave}>
                {
                  Icon ? <Icon /> : <span>{ value }</span>
                }
              </div>
            })
        }
        { this.createLabel() }
      </div>
    }
    </Panel>
  }

  private generateMenuData = () =>
  {
    const metadata = vgData.returnMetadata();
    const menuData: Array<{id: string, children: Array<string>}> = [];

    vgConfig.Graph.menu.parents.forEach((category: string) =>
      {
        const children: Array<string> = [];

        if (metadata[category] && vgConfig.Graph.menu.children[category])
        {
          vgConfig.Graph.menu.children[category].forEach((child: string) =>
          {
            if (metadata[category][child])
              children.push(child);
            else
              console.log("Missing metadata for "+category+":"+child);
          });

          menuData.push({id: category, children});
        }
      });

    return menuData;
  }

  private createLabel = () =>
  {
    if (this.state.itemLabel)
    {
      const label = this.state.itemLabel;
      return <div id="menu-label-wrapper" className="button-label label"
        style={{left: label.x, top: label.y}}>
        <div id="menu-label-name">{label.name}</div>
        {label.description !== undefined && <div id="menu-label-desc">
          {label.description}</div>}
        </div>
    }
    else
    {
      return "";
    }
  }

  private createDraggingIcon = () =>
  {
    if (this.state.draggingIcon)
    {
      const dIcon = this.state.draggingIcon;
      const id = this.state.draggingIcon.id;
      const Icon = vgIcons.Menu[id]?vgIcons.Menu[id]:"";
      const splitID = id.split("/");

      return <div id={"menu-dragging-icon"}
        className="menu-item child" style={{left: dIcon.x, top: dIcon.y}}>
        {
          Icon ? <Icon /> : <span>{ splitID[1] }</span>
        }
        </div>
    }
    else
    {
      return;
    }
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
    }
  }

  private handleChildPointerDown = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    e.stopPropagation();
    this.mouseDownChild = true;
    this.setState({itemLabel: null});
  }

  private handleChildPointerUp = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    if (!this.state.draggingIcon)
    {
      const target = e.currentTarget.id;

      this.mouseDownChild = false;

      if (!this.menuPinned)
      {
        this.props.menuStateUpdate("hidden");
      }
      else
      {
        // Hide all unpinned
        const newSubMenuPanels = this.clearUnpinnedPanels();
        if (newSubMenuPanels.length !== this.state.subMenuPanels.length)
        {
          this.setState({subMenuPanels: newSubMenuPanels});
        }
      }

      this.props.menuItemSelected(target.substring(5, target.length),
        {x: e.pageX, y: e.pageY});
    }
  }

  private handleChildPointerMove = (e: React.PointerEvent) =>
  {
    if (this.mouseDownChild)
    {
      const id = e.currentTarget.id;
      this.setState({draggingIcon: {id: id.substring(5, id.length),
        x: 0, y: 0}});
      window.addEventListener("pointermove", this.handleChildDragMove);
      window.addEventListener("pointerup", this.handleChildDragUp);
    }
  }

  private handleChildPointerEnter = (e: React.PointerEvent<HTMLDivElement>) =>
  {
    const id = e.currentTarget.id;
    let itemID = id.substring(5, id.length);

    const x = e.currentTarget.offsetLeft + (e.currentTarget.offsetWidth / 2);
    const y = e.currentTarget.offsetTop + e.currentTarget.offsetHeight;

    const splitID = itemID.split("/");

    const metadata = vgData.returnMetadata()[splitID[0]][splitID[1]];
    const strings = vgConfig.Strings.descriptions[itemID];
    const description = strings ? strings.description : undefined;

    this.setState({itemLabel: {name: metadata.name, description,
      x, y}});
  }

  private handleChildPointerLeave = (e: React.PointerEvent) =>
  {
    this.mouseDownChild = false;
    this.setState({itemLabel: null});
  }

  private handleChildDragMove = (e: PointerEvent) =>
  {
    if (this.state.draggingIcon)
    {
      const draggingIcon = {id: this.state.draggingIcon.id, x: e.pageX,
        y: e.pageY};

      this.setState({draggingIcon});
    }
  }

  private handleChildDragUp = (e: PointerEvent) =>
  {
    window.removeEventListener("pointermove", this.handleChildDragMove);
    window.removeEventListener("pointerup", this.handleChildDragUp);

    if (this.state.draggingIcon)
    {

      this.props.menuItemSelected(this.state.draggingIcon.id,
        {x: e.pageX, y: e.pageY});

      this.setState({draggingIcon: null});
      this.mouseDownChild = false;
    }
  }

  private updateMenuRef = (ref: HTMLDivElement | null) =>
  {
    this.menuRef = ref;
  }

  private notifyMenuPin = (pin: boolean) =>
  {
    this.menuPinned = pin;
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
        (subMenuPanel: {id: string, children: Array<string>,
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

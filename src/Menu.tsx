import * as React from 'react';

import { vgData } from './data/Data';
import { vgConfig } from './lib/Config';

interface IProps
{
  position: {x: number, y: number},
  menuClosed: () => void,
  menuItemSelected: (id: string) => void
}

interface IState
{
  parentID: string | null,
  childSection: number,
  position: {x: number, y: number},
  subMenuPosition: {x: number, y: number, alignTop: boolean}
}

export default class Menu extends React.Component<IProps, IState>
{
  private menuData: Array<{id: string, children: Array<string[]>}>;
  private menuRef: HTMLDivElement | null;
  private subMenuRef: HTMLDivElement | null;
  private updateSubMenu: boolean;

  constructor(props: IProps)
  {
    super(props);

    this.state =
    {
      parentID: null,
      childSection: 0,
      position: this.props.position,
      subMenuPosition: {x: 0, y: 0, alignTop: true}
    }

    this.menuRef = null;
    this.subMenuRef = null;
    this.updateSubMenu = true;

    this.menuData = [];

    const metadata = vgData.returnMetadata();

    for (const key of Object.keys(metadata))
    {
      const children: Array<string[]> = [[]];
      let count: number = 0;
      let section: number = 0;

      for (const ckey of Object.keys(metadata[key]))
      {
        if (count + 1 > vgConfig.Graph.menuSize)
        {
          section++;
          count = 0;
          children[section] = [];
        }
        children[section].push(ckey);
        count++;
      }

      this.menuData.push({id: key, children});
    }
  }

  public render()
  {
    return <div id="menu" className="menu" onContextMenu={this.handleMenuContextMenu}>
        <div className={"menu-parent-wrapper"}
        style={{left: this.state.position.x, top: this.state.position.y}}
        ref={(ref) => { this.menuRef = ref; }}>
      {
        this.menuData.map((value: {id: string, children: Array<string[]>},
          index: number) =>
        {
          return <div key={index} id={"menu-"+value.id}
            className={`menu-item parent ${value.id === this.state.parentID ?
            "selected" : "" }`}
            onMouseDown={this.handleParentMouseDown}> {value.id} </div>
        })
      }
      </div>
      {
        this.state.parentID && this.createSubMenu()
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

      const newPosition = {...this.state.position};

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
    // Only update when updateSubMenu is set to stop an infinite of
    // componentDidUpdate calls
    if (this.state.parentID && this.menuRef && this.subMenuRef &&
      this.updateSubMenu)
    {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let index = this.menuData.findIndex(x => x.id === this.state.parentID);
      const itemHeight = this.menuRef.offsetHeight / this.menuData.length;

      if (!this.state.subMenuPosition.alignTop)
      {
        index++;
      }

      // Position submenu next to parent
      const adjustment = (this.menuRef.offsetHeight / this.menuData.length) *
        index;
      const newPosition = {...this.state.subMenuPosition};
      newPosition.x = this.menuRef.offsetLeft + this.menuRef.offsetWidth;
      newPosition.y = this.menuRef.offsetTop + adjustment;

      // Reposition if menu would be created off screen
      const subMenuBoundX = newPosition.x + this.subMenuRef.offsetWidth;
      const subMenuBoundY = newPosition.y + this.subMenuRef.offsetHeight;

      if (subMenuBoundX > windowWidth)
      {
        newPosition.x -= (this.subMenuRef.offsetWidth + this.menuRef.offsetWidth);
      }

      if (!newPosition.alignTop)
      {
        newPosition.y -= this.subMenuRef.offsetHeight;
      }
      else if (subMenuBoundY > windowHeight)
      {
        newPosition.y -= (this.subMenuRef.offsetHeight - itemHeight);
        // Align top stopped for this submenu - ensure all future updates for
        // this submenu don't align top either.
        newPosition.alignTop = false;
      }

      this.updateSubMenu = false;
      this.setState({subMenuPosition: newPosition});
    }
  }

  private createSubMenu = () =>
  {
    const subMenuData = this.menuData.find(x => x.id === this.state.parentID);

    if (subMenuData)
    {
      const position = this.state.subMenuPosition

      return <div className={"menu-children-wrapper"}
        style={{left: position.x, top: position.y}}
        ref={(ref) => { this.subMenuRef = ref; }}>
        <div className={"sub-menu"}>
        {
          subMenuData.children[this.state.childSection].map(
            (value: string, index: number) =>
          {
            const id = this.state.parentID + "/" + value;
            return <div key={index} id={"menu-"+id} className="menu-item child"
                onMouseDown={this.handleChildMouseDown}> {value} </div>
          })
        }
        </div>
        {this.createNavigation(subMenuData)}
      </div>
    }
  }

  private createNavigation = (subMenuData: {id: string,
    children: Array<string[]>}) =>
  {
    let prevButton;
    let nextButton;
    let result = false;

    if (this.state.childSection !== 0 ||
      subMenuData.children[this.state.childSection-1])
    {
      result = true;
      prevButton = <div id={"menu-prev"} className="menu-nav child"
        onMouseDown={this.handleSubMenuPrev}>
        <svg id={"menu-prev-icon"} width={20} height={10}>
          <path className="menu-icon nav" d={`M 0,5 5,0 10,5 z`}/>
        </svg>
      </div>
    }

    if (subMenuData.children[this.state.childSection+1])
    {
      result = true;
      nextButton = <div id={"menu-next"} className="menu-nav child"
        onMouseDown={this.handleSubMenuNext}>
        <svg id={"menu-next-icon"} width={20} height={10}>
          <path className="menu-icon nav" d={`M 0,0 5,5 10,0 z`}/>
        </svg>
      </div>
    }

    if (result)
    {
      return <div className={"nav-wrapper"}>
          {prevButton}
          {nextButton}
        </div>
    }
  }

  private handleParentMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    const target = e.currentTarget.id;
    this.updateSubMenu = true;
    this.setState({parentID: target.substring(5, target.length),
      childSection: 0, subMenuPosition: {x: 0, y: 0, alignTop: true}});
  }

  private handleChildMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    const target = e.currentTarget.id;
    this.props.menuClosed();
    this.props.menuItemSelected(target.substring(5, target.length));
  }

  // Do nothing - prevents browser context menu from showing
  private handleMenuContextMenu = (e: React.MouseEvent<HTMLDivElement>) =>
  {
    e.preventDefault();
  }

  private handleSubMenuPrev = () =>
  {
    this.updateSubMenu = true;
    this.setState({childSection: this.state.childSection - 1});
  }

  private handleSubMenuNext = () =>
  {
    this.updateSubMenu = true;
    this.setState({childSection: this.state.childSection + 1});
  }
}

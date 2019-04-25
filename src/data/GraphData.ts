// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// TODO: refactor (and/or rename) this file if needed
// TODO: write description for this file
// TODO: move types to type description file
// TODO: comments throughout
// TODO: move rest client address to config or global variable
// TODO: description for config file

// TODO: show values and node labels on (time delay) mouse over
// TODO: default layout - layout without the need for properties config
// (in a line with type:number = Knob etc)
// TODO: calculate knob background based on range min and max
// TODO: better node layout algorithm
// TODO: hide/show property value option
// TODO: 'trigger' should have a momentary button
// TODO: if a property has an input attached the control should be disabled
// TODO: handle 'multiple' value of inputs/outputs and behaviour with 'default'
// TODO: layout node properties nicely
// TODO: split property name and value
// TODO: mouse wheel zoom
// TODO: grab/move background to scroll around
// TODO: nicer create/delete nodes

import * as rm from 'typed-rest-client/RestClient';

import { vgLogger } from '../Logger'

interface IPropertiesConfig
{
  [key: string]: {
    width: number,
    height: number,
    properties: {
      [key: string]: {
        controlType: string,
        subType: string,
        rangeMin?: number,
        rangeMax?: number,
        increment?: number,
        available?: string[],
        x: number,
        y: number
      }
    }
  }
}

interface IRawGraphItem
{
  id: string,
  outputs?: { [key: string]: Array<{element: string, prop: string}>},
  props: { [key: string]: number | string | boolean },
  type: string
}

interface IProcessedGraphItem
{
  id: string,
  name: string,
  type: string,
  inputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
  outputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
  edges: Array<{ output: string, destId: string, input: string}>,
  // propType = "iprop" | "prop" | "oprop"
  properties?: Array<{ id: string, propType: string, controlType: string,
    subType: string, value: any, rangeMin?: number, rangeMax?: number,
    increment?: number, available?: string[], x: number, y:number}>
}

interface IRawMetadataItem
{
  id: string,
  description: string,
  name: string,
  section: string,
  inputs?: Array<{ type: string, multiple?: boolean}>,
  iprops?: Array<{ id: string, description: string, type: string, alias?: boolean }>,
  props?: Array<{ id: string, description: string, type: string, alias?: boolean }>,
  oprops?: Array<{ id: string, description: string, type: string, alias?: boolean }>,
  outputs?: Array<{ type: string, multiple?: boolean}>
}

interface IProcessedMetadata
{
  [key: string]: {
    name: string,
    section: string,
    inputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
    outputs: Array<{ id: string, connectorType: string, multiple?: boolean}>,
    properties: Array<{ id: string, type: string, propType: string,
      description: string}>,
  }
}

const restURL = 'http://localhost:33380';
const marginPadding = { x: 40, y: 40 };
const layoutPadding = { x: 100, y: 40 };

class GraphData
{
  private rest: rm.RestClient;
  private generateSuccess: (json: any) => void;
  private inputEdgeMap: { [key: string]: string[]};
  private outputEdgeMap: { [key: string]: string[]};
  private propertiesConfig: IPropertiesConfig;
  private processedMetadata?: IProcessedMetadata;
  private sectionedMetadata: { [key: string]: string[]};

  public constructor()
  {
    this.rest = new rm.RestClient('vigraph-rest', restURL);
    this.inputEdgeMap = {};
    this.outputEdgeMap = {};
    this.sectionedMetadata = {};

    this.propertiesConfig = require('./PropertiesConfig.json');
  }

  public returnMetadata()
  {
    return this.processedMetadata;
  }

  public returnSectionedMetadata()
  {
    return this.sectionedMetadata;
  }

  public generateGraph(success: (json: any) => void)
  {
    this.generateSuccess = success;
    this.getGraphData();
  }

  public updateProperty(nodeID: string, propID: string,
    value: number | string | boolean)
  {
    const url = restURL + "/graph/" + nodeID + "/";
    const data = {[propID]: value};

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          vgLogger.log("Update Property Success");
        }
        else
        {
          // Error
          vgLogger.log("Update Property Failure with response status: " +
            response.status)
        }
      })
    .catch(error =>
      {
        // Error
        vgLogger.log("Update Property Failure with error: " + error);
      });
  }

  public updateEdges(outputNodeID: string, outputID: string,
    edges: Array<{dest: string, destInput: string}>, success?: ()=>void)
  {
    const url = restURL + "/graph/" + outputNodeID + "/" + outputID;

    const data: Array<{"element": string, "prop": string}> = [];

    edges.forEach((value: {dest: string, destInput: string}) =>
    {
      data.push({"element": value.dest, "prop": value.destInput});
    })

    fetch(url,
    {
      method: "POST",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          if (success)
          {
            vgLogger.log("Update Edges Success");
            success();
          }
        }
        else
        {
          // Error
          vgLogger.log("Update Edges Success with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgLogger.log("Update Edges Success with error: " + error);
      });
  }

  public createNode(nodeID: string, nodeType: string, success?: ()=>void)
  {
    const url = restURL + "/graph/" + nodeID;
    const data = {type: nodeType}

    fetch(url,
    {
      method: "PUT",
      body: JSON.stringify(data)
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          if (success)
          {
            success();
            vgLogger.log("Create Node Success");
          }
        }
        else
        {
          // Error
          vgLogger.log("Create Node Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgLogger.log("Create Node Failure with error: " + error);
      });
  }

  public deleteNode(nodeID: string, success?: ()=>void)
  {
    const url = restURL + "/graph/" + nodeID;

    fetch(url,
    {
      method: "DELETE"
    })
    .then(response =>
      {
        if (response.status === 200)
        {
          // Success
          if (success)
          {
            success();
            vgLogger.log("Delete Node Success");
          }
        }
        else
        {
          // Error
          vgLogger.log("Delete Node Failure with response status: " +
            response.status);
        }
      })
    .catch(error =>
      {
        // Error
        vgLogger.log("Delete Node Failure with error: " + error);
      });
  }

  public getNode(nodeID: string, success?: (result: any)=>void)
  {
    this.getNodeByID(nodeID, success);
  }

  private async getNodeByID(nodeID: string,
    success?: (result: IProcessedGraphItem)=>void)
  {
    try
    {
      const res: rm.IRestResponse<IRawGraphItem> =
        await this.rest.get<IRawGraphItem>('/graph/'+nodeID);

      if (res.statusCode === 200 && res.result && success)
      {
        vgLogger.log("Get Node By ID Success");
        if (this.processedMetadata)
        {
          const item = this.processSingleGraphItem(res.result,
            this.processedMetadata)

          const layout = {h: 0, w: 0};

          if (this.propertiesConfig[item.type])
          {
            layout.h = this.propertiesConfig[item.type].height;
            layout.w = this.propertiesConfig[item.type].width;
          }

          success({...item, ...layout});
        }
        else
        {
          // Error - trying to create node before Graph set up
          vgLogger.log("Process Get Node Failure: Trying to process node " +
            "before full Graph set up");
        }

      }
      else
      {
        // Error with status code
        vgLogger.log("Get Node By ID Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgLogger.log("Get Node By Id Failure with error: " + error);
    }
  }

  private async getGraphData()
  {
    try
    {
      const res: rm.IRestResponse<IRawGraphItem[]> =
        await this.rest.get<IRawGraphItem[]>('/graph');

      if (res.statusCode === 200 && res.result)
      {
        vgLogger.log("Get Graph Data Success");
        if (this.processedMetadata)
        {
          this.createGraphModel(res.result, this.processedMetadata);
        }
        else
        {
          this.getMetadata(res.result);
        }
      }
      else
      {
        // Error with status code
        vgLogger.log("Get Graph Data Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgLogger.log("Get Graph Data Failure with error: " + error);
    }
  }

  private async getMetadata(rawGraphData: IRawGraphItem[])
  {
    try
    {
      const res: rm.IRestResponse<IRawMetadataItem[]> =
        await this.rest.get<IRawMetadataItem[]>('/meta');

      if (res.statusCode === 200 && res.result)
      {
        vgLogger.log("Get Metadata Success");
        this.createGraphModel(rawGraphData, this.processMetadata(res.result));
      }
      else
      {
        // Error with status code
        vgLogger.log("Get Metadata Failure with status code: " +
          res.statusCode);
      }
    }
    catch (error)
    {
      // Error
      vgLogger.log("Get Metadata Failure with error: " + error);
    }
  }

  private processMetadata(rawMetadata: IRawMetadataItem[]):
    IProcessedMetadata
  {
    const processedMetadata: IProcessedMetadata = {};

    rawMetadata.forEach((value: IRawMetadataItem, index: number) =>
    {
      const pInputs:
        Array<{ id: string, connectorType: string, multiple?: boolean}> = [];

      const pOutputs:
        Array<{ id: string, connectorType: string, multiple?: boolean}> = [];

      const pProps: Array<{ id: string, type: string, propType: string,
           description: string}> = [];

      if (value.inputs)
      {
        value.inputs.forEach((input: {type: string, multiple?: boolean},
          iIndex: number) =>
          {
            pInputs.push({id: "default", connectorType: input.type,
              multiple: !!input.multiple});
          });
      }

      if (value.iprops)
      {
        value.iprops.forEach(
          (input: {id: string, description: string, type: string,
            alias?: boolean}) =>
          {
            pInputs.push({id: input.id, connectorType: input.type});

            if (!input.alias)
            {
              pProps.push({id: input.id, type: input.type, propType: "iprop",
                description: input.description });
            }
          });
      }

      if (value.props)
      {
          value.props.forEach(
            (prop: {id: string, description: string, type: string,
              alias?: boolean}) =>
            {
              if (!prop.alias)
              {
                pProps.push({id: prop.id, type: prop.type, propType: "prop",
                  description: prop.description });
              }
            });
      }

      if (value.outputs)
      {
        value.outputs.forEach((output: {type: string, multiple?: boolean},
          oIndex: number) =>
          {
            pOutputs.push({id: "default", connectorType: output.type});
          });
      }

      if (value.oprops)
      {
        value.oprops.forEach(
          (output: {id: string, description: string, type: string,
            alias?: boolean}) =>
          {
            pOutputs.push({id: output.id, connectorType: output.type});

            if (!output.alias)
            {
              pProps.push({id: output.id, type: output.type, propType: "oprop",
                description: output.description });
            }
          });
      }

      processedMetadata[value.id] =
      {
        name: value.name,
        section: value.section,
        inputs: pInputs,
        outputs: pOutputs,
        properties: pProps
      };

      if (!this.sectionedMetadata[value.section])
      {
        this.sectionedMetadata[value.section] = [];
      }

      this.sectionedMetadata[value.section].push(value.id);

    });

    this.processedMetadata = processedMetadata;

    return processedMetadata;
  }

  private createGraphModel(rawGraphData: IRawGraphItem[],
    metadata: IProcessedMetadata)
  {
    const nodes: IProcessedGraphItem[] = [];

    rawGraphData.forEach((value: IRawGraphItem, index: number) =>
    {
      nodes.push(this.processSingleGraphItem(value, metadata));
    })

    this.layoutGraph(nodes);
  }

  private processSingleGraphItem(item: IRawGraphItem,
    metadata: IProcessedMetadata)
  {
    const gEdges:
      Array<{ output: string, destId: string, input: string}> = [];

    if (item.outputs)
    {
      for (const key of Object.keys(item.outputs))
      {
        item.outputs[key].forEach(
          (vOutput: {element: string, prop: string}) =>
          {
            gEdges.push({ output: key, destId: vOutput.element,
              input: vOutput.prop})

            this.inputEdgeMap[vOutput.element] ?
              this.inputEdgeMap[vOutput.element].push(item.id) :
              this.inputEdgeMap[vOutput.element] = [item.id];

            this.outputEdgeMap[item.id] ?
              this.outputEdgeMap[item.id].push(vOutput.element) :
              this.outputEdgeMap[item.id] = [vOutput.element];
          });
      }
    }

    const gProps: Array<{ id: string, propType: string, controlType: string,
      subType: string, value: any, rangeMin?: number, rangeMax?: number,
      increment?: number, available?: string[], x: number, y:number}> = [];


    if (this.propertiesConfig[item.type])
    {
      for (const key of Object.keys(item.props))
      {
        const fProp =  metadata[item.type].properties.find(x =>
            x.id === key);
        const propType = fProp ? fProp.propType : "prop";

        gProps.push({id: key, value: item.props[key],
          propType,
          ...this.propertiesConfig[item.type].properties[key]});
      };
    }

    const node: IProcessedGraphItem =
    {
      id: item.id,
      name: metadata[item.type].name,
      type: item.type,
      inputs: metadata[item.type].inputs,
      outputs: metadata[item.type].outputs,
      edges: gEdges,
      properties: gProps
    };

    return node;
  }

  private layoutGraph(nodes: IProcessedGraphItem[])
  {
    const graph = { "nodes" : this.generateLayout(nodes)};

    this.generateSuccess(graph);
  }

  private generateLayout(nodes: IProcessedGraphItem[])
  {
    const layoutNodes: any[] = [];

    const leaves: string[] = [];
    const ranks: { [key: string] : number } = {};

    const rankNodes = (rank: number, rNodes: string[]) =>
    {
      rNodes.forEach((name: string) =>
      {
        if (!ranks[name] || ranks[name] < rank)
        {
          ranks[name] = rank;
        }

        if (this.outputEdgeMap[name])
        {
          rankNodes(rank+1, this.outputEdgeMap[name]);
        }
      });
    }

    for (const key of Object.keys(this.outputEdgeMap))
    {
      if (!this.inputEdgeMap[key])
      {
        leaves.push(key);
        ranks[key] = 0;
        rankNodes(1, this.outputEdgeMap[key]);
      }
    }

    const ranksCount: number[] = [];
    const rankNextPos: [{x: number, y: number}] = [{x: 0, y: 0}];

    nodes.forEach((value: IProcessedGraphItem) =>
    {
      const layout = {x: 0, y: 0, h: 50, w: 50};

      if (this.propertiesConfig[value.type])
      {
        layout.h = this.propertiesConfig[value.type].height;
        layout.w = this.propertiesConfig[value.type].width;
      }

      const nRank = ranks[value.id] ? ranks[value.id] : 0;

      if (typeof ranksCount[nRank] === "undefined")
      {
        ranksCount[nRank] = 0;
      }
      else
      {
        ranksCount[nRank] = ranksCount[nRank] + 1;
      }

      // Position nodes in this rank based on the previous nodes height and
      // the nodes in the next rank based on the largest (width) node so far

      if (!rankNextPos[nRank])
      {
        rankNextPos[nRank] = {x: 0, y: 0};
      }

      layout.x = (rankNextPos[nRank].x) + (nRank === 0 ? marginPadding.x :
        layoutPadding.x);
      layout.y = (rankNextPos[nRank].y) + layoutPadding.y;

      rankNextPos[nRank] = {x: rankNextPos[nRank].x,
        y: layout.y + layout.h};

      if (!rankNextPos[nRank+1])
      {
        rankNextPos[nRank+1] = {x: 0, y: 0};
      }

      rankNextPos[nRank+1] = {x: Math.max(layout.x + layout.w,
        rankNextPos[nRank+1].x),
        y: rankNextPos[nRank+1].y};

      layoutNodes.push({...value, ...layout});
    })

    return layoutNodes;
  }
}

export const graphData = new GraphData();

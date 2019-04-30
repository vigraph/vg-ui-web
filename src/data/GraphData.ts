// ViGraph UI model - Graph Data class
// Copyright (c) Paul Clark 2019

// Class to interrogate and modify a dataflow graph within the ViGraph engine,
// as well as getting property Metadata, using REST protocol API.
// State is read/sent in JSON.  The URL format identifies a hierarchy of
// elements (nodes) by ID.
// Processes and combines graph and metadata to create graph model.


// TODO: calculate knob background based on range min and max

// TODO: split property name and value
// TODO: show values and node labels on (time delay) mouse over
// TODO: hide/show property value option
// TODO: layout node properties nicely

// TODO: if a property has an input attached the control should be disabled
// TODO: default layout - layout without the need for properties config
// (in a line with type:number = Knob etc)
// TODO: better node layout algorithm
// TODO: save/load node layout/position data
// TODO: 'trigger' should have a momentary button
// TODO: handle 'multiple' value of inputs/outputs and behaviour with 'default'
// TODO: mouse wheel zoom
// TODO: grab/move background to scroll around
// TODO: nicer create/delete nodes

import * as rm from 'typed-rest-client/RestClient';

import { vgLogger } from '../Logger'

import * as vgType from '../Types'

const restURL = 'http://localhost:33380';
const marginPadding = { x: 40, y: 40 };
const layoutPadding = { x: 100, y: 40 };

class GraphData
{
  private rest: rm.RestClient;
  private generateSuccess: (json: any) => void;
  private inputEdgeMap: { [key: string]: string[]};
  private outputEdgeMap: { [key: string]: string[]};
  private propertiesConfig: vgType.IPropertiesConfig;
  private processedMetadata?: vgType.IProcessedMetadata;
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

  // Update property (propID) on node (nodeID) with given value (value)
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

  // Update edges from output Node with an Array of all valid edges.
  // Edge removed by copying current edges, removing the edge and updating with
  // new array.
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
          vgLogger.log("Update Edges Success");

          // Success
          if (success)
          {
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

  // Create/add node with ID nodeID and type nodeType to Graph
  // Calls success function on PUT success
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
          vgLogger.log("Create Node Success");

          // Success
          if (success)
          {
            success();
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

  // Delete node with ID nodeID from Graph
  // Calls success on DELETE success
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
          vgLogger.log("Delete Node Success");

          // Success
          if (success)
          {
            success();
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

  // Get node (nodeID) and calls success with resulting (processed) node
  // allowing it to be added to the Graph model
  public getNode(nodeID: string, success?: (result: any)=>void)
  {
    this.getNodeByID(nodeID, success);
  }

  private async getNodeByID(nodeID: string,
    success?: (result: vgType.IProcessedGraphItem)=>void)
  {
    try
    {
      const res: rm.IRestResponse<vgType.IRawGraphItem> =
        await this.rest.get<vgType.IRawGraphItem>('/graph/'+nodeID);

      if (res.statusCode === 200 && res.result && success)
      {
        vgLogger.log("Get Node By ID Success");
        if (this.processedMetadata)
        {
          const item = this.processSingleGraphItem(res.result,
            this.processedMetadata)

          const layout = {h: 0, w: 0};

          // Node properties layout from config
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

  // Get data for entire graph and start processing
  private async getGraphData()
  {
    try
    {
      const res: rm.IRestResponse<vgType.IRawGraphItem[]> =
        await this.rest.get<vgType.IRawGraphItem[]>('/graph');

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

  // Get properties metadata, process and pass on to creating Graph model
  private async getMetadata(rawGraphData: vgType.IRawGraphItem[])
  {
    try
    {
      const res: rm.IRestResponse<vgType.IRawMetadataItem[]> =
        await this.rest.get<vgType.IRawMetadataItem[]>('/meta');

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

  // Process metadata from raw metadata into a usable format to create Graph
  // model (see type definition file)
  private processMetadata(rawMetadata: vgType.IRawMetadataItem[]):
    vgType.IProcessedMetadata
  {
    const processedMetadata: vgType.IProcessedMetadata = {};

    rawMetadata.forEach((value: vgType.IRawMetadataItem, index: number) =>
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

  // Create Graph model from processed raw graph data and metadata
  private createGraphModel(rawGraphData: vgType.IRawGraphItem[],
    metadata: vgType.IProcessedMetadata)
  {
    const nodes: vgType.IProcessedGraphItem[] = [];

    rawGraphData.forEach((value: vgType.IRawGraphItem, index: number) =>
    {
      nodes.push(this.processSingleGraphItem(value, metadata));
    })

    this.layoutGraph(nodes);
  }

  // Process a single graph item into format to create Graph model
  // (see type definitions)
  private processSingleGraphItem(item: vgType.IRawGraphItem,
    metadata: vgType.IProcessedMetadata)
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

            // Store input and output IDs used to layout Graph without
            // node position data
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

    // Node properties from metadata
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

    const node: vgType.IProcessedGraphItem =
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

  // Layout Graph and pass full graph on to final success callback
  private layoutGraph(nodes: vgType.IProcessedGraphItem[])
  {
    const graph = { "nodes" : this.generateLayout(nodes)};

    this.generateSuccess(graph);
  }

  // Generate Graph layout without node position data. Nodes ranked by number of
  // parents and layed out without overlapping
  private generateLayout(nodes: vgType.IProcessedGraphItem[])
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

    nodes.forEach((value: vgType.IProcessedGraphItem) =>
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

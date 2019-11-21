import * as React from 'react';

import { vgConfig } from './lib/Config';

interface IProps
{
  size: { x: number, y: number };
  beams: boolean;
  projection: boolean;
  beam_multiplier: number;
  points: boolean;
  ip: string;
  port: number;
}

export default class WebsocketCanvas extends React.Component<IProps>
{
  public static defaultProps = vgConfig.Graph.websocket.defaultProps;

  private canvasRef = React.createRef<HTMLCanvasElement>()
  private previousSize: {x: number, y: number};

  constructor(props: IProps)
  {
    super(props);

    this.previousSize = {x: 0, y: 0};
  }

  public render()
  {
    const size = this.props.size;

    return (
      <canvas ref={this.canvasRef} id="canvas" width={size.x} height={size.y} />
    );
  }

  public componentDidMount()
  {
    const rxSocket = new WebSocket(this.props.ip+':'+this.props.port+'/');
    rxSocket.binaryType = 'arraybuffer';
    rxSocket.onmessage = (e: MessageEvent) => { this.handleFrame(e.data); };
  }

  private handleVectorFrame(view: DataView, ctx: CanvasRenderingContext2D)
  {
    if (view.byteLength < 10) return;
    view.getUint32(2);  // ts high
    view.getUint32(6);  // ts low

    // Scale from vector co-ordinates
    ctx.resetTransform();
    ctx.translate(this.props.size.x / 2, this.props.size.y / 2);
    ctx.scale(this.props.size.x, -this.props.size.y);
    ctx.lineWidth = 1 / this.props.size.x;

    // Beam scatter effect - fill triangle from origin
    if (this.props.beams)
      {
        let lastX = 0;
        let lastY = 0;
        for (let i = 10; i < view.byteLength; i += 10)
          {
            if (view.byteLength < i + 10) { break; }
            const x = (view.getUint16(i) - 32768) / 65535.0;   // (-0.5 .. 0.5)
            const y = (view.getUint16(i + 2) - 32768) / 65535.0; // (-0.5 .. 0.5)
            const r = view.getUint16(i + 4) / 256;           // (0..255)
            const g = view.getUint16(i + 6) / 256;           // (0..255)
            const b = view.getUint16(i + 8) / 256;           // (0..255)

            if (i > 10)
              {
                // Calculate fill-in brightness based on beam velocity
                const dist = Math.sqrt((x - lastX) * (x - lastX) + (y - lastY) * (y - lastY));
                const brightness = (1.0 - dist) / 10;
                ctx.strokeStyle = ctx.fillStyle =
                  'rgba(' + Math.floor(r)
                  + ',' + Math.floor(g)
                  + ',' + Math.floor(b)
                  + ',' + brightness + ')';

                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this.props.beam_multiplier * lastX,
                           this.props.beam_multiplier * lastY);
                ctx.lineTo(this.props.beam_multiplier * x,
                           this.props.beam_multiplier * y);
                ctx.lineTo(0, 0);
                ctx.fill();
                ctx.stroke();
                ctx.closePath();
              }

            lastX = x;
            lastY = y;
          }
      }

    // Projection lines
    if (this.props.projection)
      {
        let lastX = 0;
        let lastY = 0;
        for (let i = 10; i < view.byteLength; i += 10)
          {
            if (view.byteLength < i + 10) { break; }
            const x = (view.getUint16(i) - 32768) / 65535.0;   // (-0.5 .. 0.5)
            const y = (view.getUint16(i + 2) - 32768) / 65535.0; // (-0.5 .. 0.5)
            const r = view.getUint16(i + 4) / 256;           // (0..255)
            const g = view.getUint16(i + 6) / 256;           // (0..255)
            const b = view.getUint16(i + 8) / 256;           // (0..255)

            if (i > 10 && (r || g || b))  // don't draw blanked
              {
                if (this.props.points)
                  {
                    ctx.fillStyle = 'rgba(' + Math.floor(r) + ',' + Math.floor(g)
                                  + ',' + Math.floor(b) + ',0.5)';
                    ctx.fillRect(x, y, 0.005, 0.005);
                  }
                else
                  {
                    ctx.strokeStyle = 'rgb(' + Math.floor(r) + ',' + Math.floor(g)
                                    + ',' + Math.floor(b) + ')';
                    ctx.beginPath();

                    ctx.moveTo(lastX, lastY);
                    // Check for pure point, spread it if so
                    if (x === lastX && y === lastY)
                      {
                        ctx.lineTo(x + 0.001, y + 0.001);
                      }
                    else
                      {
                        ctx.lineTo(x, y);
                      }
                    ctx.stroke();
                    ctx.closePath();
                  }
              }

            lastX = x;
            lastY = y;
          }
      }
  }

  private handleBitmapFrame(view: DataView, ctx: CanvasRenderingContext2D)
  {
    if (view.byteLength < 18) return;
    view.getUint32(2);  // ts high
    view.getUint32(6);  // ts low

    const width = view.getUint32(10);
    const height = view.getUint32(14);
    const image:ImageData = ctx.createImageData(width, height);

    let i=18;
    let di=0;
    for (let y=0; y<height; y++)
    {
      for(let x=0; x<width; x++)
      {
        if (view.byteLength < i + 3) { break; }
        const r = view.getUint8(i++);
        const g = view.getUint8(i++);
        const b = view.getUint8(i++);

        image.data[di++] = r;
        image.data[di++] = g;
        image.data[di++] = b;
        image.data[di++] = 255;  // alpha
      }
    }

    // Create a new temporary canvas to scale into
    let tc = document.createElement("canvas");
    tc.setAttribute("width", ""+width);
    tc.setAttribute("height", ""+height);
    tc.getContext("2d")!.putImageData(image, 0, 0);

    // Reset the transform and scale the image, retaining aspect ratio
    ctx.resetTransform();
    let scale = Math.min(this.props.size.x / width,
                         this.props.size.y / height);
    ctx.scale(scale, scale);
    ctx.drawImage(tc, 0, 0);
  }

  private handleFrame(data: ArrayBuffer)
  {
    if (data.byteLength < 2) { return; }
    const view = new DataView(data);
    view.getInt8(0); // version
    const type = view.getInt8(1);

    const canvas = this.canvasRef.current;
    if (!canvas) { return; }

    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    ctx.fillStyle = 'black';
    ctx.fillRect(-0.5, -0.5, 1, 1);

    switch (type)
    {
      case 0x01:
        this.handleVectorFrame(view, ctx);
      break;

      case 0x04:
        this.handleBitmapFrame(view, ctx);
      break;
    }
  }
}

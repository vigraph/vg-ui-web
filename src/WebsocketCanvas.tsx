import * as React from 'react';

interface IProps
{
  size: { x: number, y: number };
  beams: boolean;
  projection: boolean;
  beam_multiplier: number;
  points: boolean;
  port: number;
}

export default class WebsocketCanvas extends React.Component<IProps>
{
  public static defaultProps = {
    size: { x: 400, y: 400 },
    beams: false,
    projection: true,
    beam_multiplier: 10,
    points: false,
    port: 33382
  }

  private canvasRef = React.createRef<HTMLCanvasElement>()

  constructor(props: IProps)
  {
    super(props);
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
    const rxSocket = new WebSocket('ws://localhost:'+this.props.port+'/');
    rxSocket.binaryType = 'arraybuffer';
    rxSocket.onmessage = (e: MessageEvent) => { this.handleFrame(e.data); };

    this.updateCanvas();
  }

  private updateCanvas()
  {
    const canvas = this.canvasRef.current;
    if (canvas)
    {
      const ctx = canvas.getContext('2d');
      if (ctx)
      {
        // Scale to float coordinates, flipped, origin at centre, -0.5 .. 0.5
        ctx.translate(this.props.size.x / 2, this.props.size.y / 2);
        ctx.scale(this.props.size.x, -this.props.size.y);
        ctx.lineWidth = 1 / this.props.size.x;
      }
    }
  }

  private handleFrame(data: ArrayBuffer)
  {
    if (data.byteLength < 6) { return; }
    const view = new DataView(data);
    const version = view.getInt8(0);
    if (version !== 0x01) { return; }
    const type = view.getInt8(1);
    if (type !== 0x01) { return; }

    view.getUint32(2);  // ts high
    view.getUint32(6);  // ts low

    const canvas = this.canvasRef.current;
    if (!canvas) { return; }

    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    ctx.fillStyle = 'black';
    ctx.fillRect(-0.5, -0.5, 1, 1);

    // Beam scatter effect - fill triangle from origin
    if (this.props.beams)
    {
      let lastX = 0;
      let lastY = 0;
      for (let i = 10; i < data.byteLength; i += 10)
      {
        if (data.byteLength < i + 10) { break; }
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
      for (let i = 10; i < data.byteLength; i += 10)
      {
        if (data.byteLength < i + 10) { break; }
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
}

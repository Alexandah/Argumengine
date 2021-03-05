import React from "react";
import { Stage, Layer, Circle } from "react-konva";
import Konva from "konva";

const Node = () => {
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();
  const [text, setText] = React.useState();

  return (
    <Circle
      x={100}
      y={100}
      draggable
      radius={50}
      fill={"white"}
      stroke={"black"}
      strokeWidth={4}
    ></Circle>
  );
};

class ArgGraph extends React.Component {
  render() {
    return (
      <Stage width={500} height={500}>
        <Layer>
          <Node></Node>
        </Layer>
      </Stage>
    );
  }
}

export default ArgGraph;

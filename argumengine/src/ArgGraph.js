import React from "react";
import { Stage, Layer, Circle } from "react-konva";
import Konva from "konva";

const Node = (props) => {
  const [x, setX] = React.useState();
  const [y, setY] = React.useState();
  const [text, setText] = React.useState();

  return (
    <Circle
      x={props.x}
      y={props.y}
      draggable
      radius={50}
      fill={"white"}
      stroke={"black"}
      strokeWidth={4}
    ></Circle>
  );
};

class ArgGraph extends React.Component {
  state = {
    nodes: [],
    arguments: [],
    conflicts: [],
  };

  handleDoubleClick = () => {};
  render() {
    return (
      <Stage width={500} height={500}>
        <Layer>
          <Node x={250} y={250}></Node>
        </Layer>
      </Stage>
    );
  }
}

export default ArgGraph;

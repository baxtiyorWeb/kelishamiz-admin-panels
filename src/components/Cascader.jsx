import React from "react";
import { Cascader } from "antd";

const CascaderComponent = ({ options, onChange }) => (
  <Cascader
    options={options}
    onChange={onChange}
    placeholder="Please select"
    style={{ height: "40px" }}
  />
);
export default CascaderComponent;

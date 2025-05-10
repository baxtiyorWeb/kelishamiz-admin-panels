import { Input } from "antd";
import React from "react";

const InputComponent = ({
  type = "text",
  placeholder = "Basic usage",
  value,
  onChange,
  setValue,
  name = "",
  id = "",
  className = "",
  disabled = false,
}) => {
  return (
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      className={className}
      disabled={disabled}
    />
  );
};

export default InputComponent;

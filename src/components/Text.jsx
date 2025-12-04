
const Text = ({ children, size = "", className = "", ...props }) => {
  return (
    <span className={`${size ? `text-[${size}px]` : ""} ${className}`} {...props}>
      {children}
    </span>
  );
};

export default Text;

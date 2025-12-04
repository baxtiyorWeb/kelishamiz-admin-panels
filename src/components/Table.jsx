import { Form, Input, InputNumber,  Table,  } from "antd";

const EditableCell = ({
  editing,
  dataIndex,
  title,
  inputType,
  record,
  index,
  children,
  ...restProps
}) => {
  const inputNode = inputType === "number" ? <InputNumber /> : <Input />;
  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Please Input ${title}!` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const AppTable = ({
  dataSource = [],
  columnDefs = [],
  rowKey = "id",
  locale = { emptyText: "No data available" },
  isLoading = false,
  page,
  pageSize,
  total,
  setPage,
  setPageSize,
}) => {
  const [form] = Form.useForm();

  return (
    <Form form={form} component={false}>
      <Table
        components={{ body: { cell: EditableCell } }}
        bordered
        locale={locale}
        dataSource={isLoading ? [] : dataSource}
        columns={columnDefs}
        rowClassName="editable-row"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: total,
          onChange: (current, size) => {
            setPage(current);
            setPageSize(size);
          },
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
        }}
        rowKey={rowKey}
      />
    </Form>
  );
};

export default AppTable;

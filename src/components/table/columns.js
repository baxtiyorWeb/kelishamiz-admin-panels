import { Popconfirm } from "antd";

export const columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Category Name",
    dataIndex: "name",
    key: "name",
  },
  {
    title: "Parent Category",
    dataIndex: "parentName",
    key: "parentName",
  },
  {
    title: "Action",
    key: "action",
    render: (_, record) => (
      <Popconfirm
        title="Are you sure to delete this category?"
        onConfirm={() => handleDelete(record.id)}
        okText="Yes"
        cancelText="No"
      >
        <Button type="danger" size="small">
          Delete
        </Button>
      </Popconfirm>
    ),
  },
];

return null;

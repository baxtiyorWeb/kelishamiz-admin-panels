import { useQueries, useQuery } from "@tanstack/react-query";
import { get, isArray } from "lodash";
import React from "react";
import api from "../config/auth/api";
import Table from "./../components/Table";
import { useMutation } from "@tanstack/react-query";
import { Button, message, Popconfirm } from "antd";
const Profiles = () => {
  // This component will display the profiles

  // get profiles from the API

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const response = await api.get("/profiles");
      if (!response.status || response.status !== 200) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
  });

  const profileItems = isArray(get(data, "content", []))
    ? get(data, "content", [])
    : [];

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      className: "table-column-id",
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      className: "table-column-full-name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      className: "table-column-email",
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      className: "table-column-phone-number",
    },
    {
      title: "Region ID",
      dataIndex: "regionId",
      key: "regionId",
      className: "table-column-region-id",
    },
    {
      title: "District ID",
      dataIndex: "districtId",
      key: "districtId",
      className: "table-column-district-id",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      className: "table-column-address",
    },
    {
      title: "Balance",
      dataIndex: ["user", "balance"],
      key: "balance",
      className: "table-column-balance",
    },
    {
      title: "Actions",
      key: "actions",
      className: "table-column-actions",
      render: (_, record) => (
        <div className="actions-buttons">
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this profile?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handleEdit = (record) => {
    console.log("Edit record:", record);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/profiles/${id}`);
      if (!response.status || response.status !== 200) {
        throw new Error("Failed to delete profile");
      }
      return response.data;
    },
    onSuccess: () => {
      console.log("Profile deleted successfully");
      message.success("Profile deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting profile:", error);
      message.error("Profile delete error occurred");
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error loading profiles</div>;
  }
  if (!data || data.length === 0) {
    return <div>No profiles found</div>;
  }

  return (
    <div>
      Profiles
      <div>
        <Table dataSource={profileItems} columnDefs={columns} />
      </div>
    </div>
  );
};

export default Profiles;

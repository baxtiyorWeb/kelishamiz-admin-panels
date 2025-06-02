import React, { useEffect, useState } from "react";
import Table from "./../components/Table";
import ModalComponent from "./../components/Modal";
import CascaderComponent from "./../components/Cascader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "./../config/auth/api";
import { get, isArray } from "lodash";
import { Button, message, Popconfirm, Select } from "antd";
import InputComponent from "../components/Input";

const Locations = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isOpenEditModal, setisOpenEditModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [isCreateRegion, setIsCreateRegion] = useState(false);
  const [name, setName] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("region");
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["products", page, pageSize, selectedLocation, selectedParentId],
    queryFn: async () => {
      if (!selectedLocation) {
        throw new Error("Please select a location type (region/district)");
      }

      console.log(selectedParentId);

      // Adjust the endpoint based on the selected location type
      const endpoint =
        selectedLocation === "region"
          ? "/location/regions"
          : `/location/districts/${
              selectedParentId === undefined ? "" : selectedParentId || ""
            }`;
      // Fetch data from the appropriate endpoint

      const response = await api.get(endpoint);
      if (!response.status === 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error fetching products:", error);
    },
    onSuccess: (data) => {
      console.log("Products fetched successfully:", data);
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
    retryDelay: 1000,
  });

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await api.get("/location/regions");
      if (!response.status === 200 || !response.data) {
        throw new Error("Network response was not ok");
      }
      return response.data;
    },
  });

  const regionItems = isArray(get(regions, "content", []))
    ? get(regions, "content", [])
    : [];

  const regionOptions = regionItems.map((region) => ({
    label: region.name,
    value: region.id,
  }));

  const propertyItems = isArray(get(data, "content", []))
    ? get(data, "content", [])
    : [];

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Viloyat",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Tumanlar",
      key: "districts",
      render: (_, record) =>
        selectedLocation === "district" ? (
          record?.region?.name
        ) : (
          <Select
            defaultValue={record.districts?.[0]?.id}
            style={{ width: 200 }}
            placeholder="Select district"
            options={record.districts?.map((district) => ({
              label: district.name,
              value: district.id,
            }))}
          />
        ),
    },
    {
      title: "Delete",
      key: "delete",
      render: (_, record) => (
        <Popconfirm
          title={`Are you sure you want to delete item with ID: ${record.id}?`}
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <a>Delete</a>
        </Popconfirm>
      ),
    },
  ];

  const { mutate: deleteRegion } = useMutation({
    mutationFn: async (id) => {
      const endpoint =
        selectedLocation === "region" ? `${id}/region` : `${id}/district`;
      const response = await api.delete(`/location/${endpoint}`);
      if (!response.status === 200) {
        throw new Error("Failed to delete region");
      }
      return response.data;
    },
    onError: (error) => {
      console.error("Error deleting region:", error);
    },
    onSuccess: () => {
      const endpointMessage =
        selectedLocation === "region" ? "region" : "district";
      message.success(`${endpointMessage} deleted successfully`);
      refetch();
    },
  });

  const handleLocationMutate = useMutation({
    mutationFn: async (data) => {
      if (isCreateRegion) {
        return api.post("/location/district", {
          name: data.name,
          regionId: selectedParentId,
        });
      } else {
        return api.post("/location/region", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["products"]);
      setisOpenEditModal(false);
      setName("");
      setSelectedParentId(null);
      message.success("Category created successfully");
    },
    onError: (error) => {
      console.error("Error creating category:", error);
      message.error("Failed to create category");
    },
  });

  const handleCreateCategory = () => {
    handleLocationMutate.mutate({
      name,
    });
  };

  const buildCascaderOptions = (categories = []) => {
    return categories.map((item) => ({
      label: item.name,
      value: item.id,
      children: item.districts?.length
        ? buildCascaderOptions(item.districts)
        : undefined,
    }));
  };
  const options = buildCascaderOptions(propertyItems);

  const handleDelete = (id) => {
    deleteRegion(id);
  };

  if (isError) {
    return <div>Error fetching products.</div>;
  }

  return (
    <div>
      <div className="flex space-x-5 justify-between">
        <Select
          style={{ width: "180px" }}
          placeholder="Select location"
          options={[
            {
              label: "Viloyatlar",
              value: "region",
            },
            {
              label: "tumanlar",
              value: "district",
            },
          ]}
          onChange={(value) => setSelectedLocation(value)}
          className="mb-4"
        />

        {selectedLocation === "district" && (
          <Select
            options={regionOptions}
            onChange={(value) => setSelectedParentId(value)}
            placeholder="Select region"
            className="mb-4"
          />
        )}
        <div className="w-full">
          <ModalComponent
            handleFunc={handleCreateCategory}
            setIsModalOpen={setisOpenEditModal}
            isModalOpen={isOpenEditModal}
          >
            <div className="grid grid-cols-1 items-center gap-4">
              <label htmlFor="type" className="text-left">
                Type
              </label>
              <Select
                style={{ width: "100%" }}
                placeholder="Select type"
                options={[
                  { value: "region", label: "Tuman qo'shish" },
                  { value: "district", label: "Viloyat qo'shish" },
                ]}
                onChange={(value) => setIsCreateRegion(value === "region")}
              />
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 items-center gap-4">
                <label htmlFor="name" className="text-left">
                  Name
                </label>
                <InputComponent
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {isCreateRegion && (
                <div className="grid grid-cols-1 items-center gap-4">
                  <label htmlFor="parent" className="text-left">
                    Parent Category
                  </label>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Select parent category"
                    options={options.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                    onChange={(value) => setSelectedParentId(value)}
                  />
                </div>
              )}
            </div>
          </ModalComponent>
          <Button
            className=" float-end"
            type="primary"
            onClick={() => {
              setisOpenEditModal(true);
              setName("");
              setSelectedParentId(null);
            }}
          >
            Location qo'shish
          </Button>
        </div>
      </div>
      <Table
        dataSource={propertyItems}
        columnDefs={columns}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        total={propertyItems?.total || 0}
        setPage={setPage || 1}
        locale={{ emptyText: "No data available" }}
        setPageSize={setPageSize || 5}
      />
    </div>
  );
};

export default Locations;

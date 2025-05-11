"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { get, isArray } from "lodash"
import { Button } from "antd"
import { Table } from "antd"
import { Popconfirm, message } from "antd"
import InputComponent from "./../components/Input"
import ModalComponent from "./../components/Modal"
// Import your actual API configuration
import api from "../config/auth/api"
import CascaderComponent from "../components/Cascader"

const Properties = () => {
  const [isOpenEditModal, setIsOpenEditModal] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState("STRING")
  const [categoryId, setCategoryId] = useState(null)
  const [options, setOptions] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null)
  const queryClient = useQueryClient()

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      return (await api.get("/category")).data
    },
  })

  // Fetch properties by category ID
  const {
    data: propertiesData,
    isLoading: propertiesLoading,
    refetch: refetchProperties,
  } = useQuery({
    queryKey: ["categoryProperties", selectedCategoryFilter],
    queryFn: async () => {
      if (!selectedCategoryFilter) {
        return { content: [] }
      }
      return (await api.get(`/category/${selectedCategoryFilter}/properties`)).data
    },
    enabled: !!selectedCategoryFilter,
  })

  const categoryList = isArray(get(categoriesData, "content", [])) ? get(categoriesData, "content") : []

  // Extract properties from the response
  const propertiesList = []
  if (propertiesData && propertiesData.content) {
    propertiesData.content.forEach((category) => {
      if (category.properties && category.properties.length > 0) {
        category.properties.forEach((property) => {
          propertiesList.push({
            ...property,
            categoryName: category.name,
            categoryId: category.id,
          })
        })
      }
    })
  }

  // Build cascader options recursively to handle nested categories
  const buildCascaderOptions = (categories = []) => {
    return categories.map((category) => {
      const option = {
        value: category.id,
        label: category.name,
      }

      if (category.children && category.children.length > 0) {
        option.children = buildCascaderOptions(category.children)
      }

      return option
    })
  }

  const cascaderOptions = buildCascaderOptions(categoryList)

  // Property types options
  const typeOptions = [
    { value: "STRING", label: "String" },
    { value: "NUMBER", label: "Number" },
    { value: "BOOLEAN", label: "Boolean" },
    { value: "DATE", label: "Date" },
    { value: "SELECT", label: "Select" },
  ]

  const handlePropertyMutate = useMutation({
    mutationFn: async (property) => {
      return await api.post("/property", property)
    },
    onSuccess: () => {
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries(["categoryProperties", selectedCategoryFilter])
        refetchProperties()
      }
      setIsOpenEditModal(false)
      resetForm()
      message.success("Property created successfully")
    },
    onError: (error) => {
      console.error("Error creating property", error)
      message.error("Failed to create property")
    },
  })

  const handlePropertyMutateDelete = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/property/${id}`)
    },
    onSuccess: () => {
      if (selectedCategoryFilter) {
        queryClient.invalidateQueries(["categoryProperties", selectedCategoryFilter])
        refetchProperties()
      }
      message.success("Property deleted successfully")
    },
    onError: (error) => {
      console.error("Error deleting property", error)
      message.error("Failed to delete property")
    },
  })

  const resetForm = () => {
    setName("")
    setType("STRING")
    setCategoryId(null)
    setOptions("")
  }

  const handleCreateProperty = () => {
    if (!name) {
      message.error("Property name is required")
      return
    }

    if (!categoryId) {
      message.error("Category is required")
      return
    }

    const propertyData = {
      name,
      type,
      categoryId,
      options: type === "SELECT" ? options : null,
    }

    handlePropertyMutate.mutate(propertyData)
  }

  const handleDelete = (id) => {
    handlePropertyMutateDelete.mutate(id)
  }

  // Get the last selected category ID from the cascader path
  const handleCategoryChange = (value, selectedOptions) => {
    // If value is an array, take the last item which is the deepest selected category
    const lastSelectedId = Array.isArray(value) ? value[value.length - 1] : value
    setCategoryId(lastSelectedId)
  }

  // Get the last selected category ID from the cascader path for filtering
  const handleCategoryFilterChange = (value, selectedOptions) => {
    // If value is an array, take the last item which is the deepest selected category
    const lastSelectedId = Array.isArray(value) ? value[value.length - 1] : value
    setSelectedCategoryFilter(lastSelectedId)
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Property Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
    },
    {
      title: "Category",
      dataIndex: "categoryName",
      key: "categoryName",
    },
    {
      title: "Options",
      key: "options",
      render: (_, record) => {
        if (record.type === "SELECT" && record.options) {
          return Array.isArray(record.options) ? record.options.join(", ") : record.options
        }
        return "-"
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Are you sure to delete this property?"
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
  ]

  if (categoriesLoading) return <div>Loading categories...</div>

  return (
    <div>
      <ModalComponent
        handleFunc={handleCreateProperty}
        setIsModalOpen={setIsOpenEditModal}
        isModalOpen={isOpenEditModal}
        title="Add Property"
      >
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right">
              Name
            </label>
            <InputComponent
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Property name"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="text-right">
              Type
            </label>
            <CascaderComponent
              id="type"
              value={type}
              onChange={(value) => setType(value)}
              options={typeOptions}
              style={{ width: "100%" }}
              isCascader={false}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="category" className="text-right">
              Category
            </label>
            <CascaderComponent
              id="category"
              onChange={handleCategoryChange}
              options={cascaderOptions}
              placeholder="Select category"
              changeOnSelect
            />
          </div>

          {type === "SELECT" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="options" className="text-right">
                Options
              </label>
              <InputComponent
                id="options"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Comma separated options"
              />
            </div>
          )}
        </div>
      </ModalComponent>

      <div className="mb-4">
        <label htmlFor="categoryFilter" className="mr-2">
          Filter by Category:
        </label>
        <CascaderComponent
          id="categoryFilter"
          onChange={handleCategoryFilterChange}
          options={cascaderOptions}
          placeholder="Select category to view properties"
          changeOnSelect
          allowClear
        />
      </div>

      <Button type="primary" className="my-4 float-end" onClick={() => setIsOpenEditModal(true)}>
        Add Property
      </Button>

      {propertiesLoading ? (
        <div>Loading properties...</div>
      ) : (
        <Table
          dataSource={propertiesList}
          columns={columns}
          rowKey="id"
          locale={{
            emptyText: selectedCategoryFilter ? "No properties found for this category" : "Please select a category",
          }}
        />
      )}
    </div>
  )
}

export default Properties

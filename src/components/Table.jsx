import React from "react";
import { Table, Empty, ConfigProvider } from "antd";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";

const AppTable = ({
  dataSource = [],
  columnDefs = [],
  rowKey = "id",
  locale = {
    emptyText: (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400">
        <Empty description="Ma'lumot topilmadi" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    ),
  },
  isLoading = false,
  page,
  pageSize,
  total,
  setPage,
  setPageSize,
  scroll = { x: "max-content" },
  onRow,
  rowClassName,
}) => {
  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <Table
        bordered={false}
        locale={locale}
        dataSource={isLoading ? [] : dataSource}
        columns={columnDefs}
        loading={isLoading}
        scroll={scroll}
        onRow={onRow}
        rowClassName={rowClassName || (() => "transition-colors duration-150 hover:bg-slate-50/80")}
        pagination={
          page !== undefined && pageSize !== undefined
            ? {
                current: page,
                pageSize: pageSize,
                total: total,
                showTotal: (totalCount, range) => (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-700 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      Jami <strong className="text-indigo-600 font-extrabold">{totalCount}</strong> tadan{" "}
                      <span className="font-mono text-slate-900">{range[0]}-{range[1]}</span> ko'rsatilmoqda
                    </span>
                  </div>
                ),
                onChange: (current, size) => {
                  if (setPage) setPage(current);
                  if (setPageSize && size !== pageSize) setPageSize(size);
                },
                showSizeChanger: true,
                pageSizeOptions: ["10", "15", "25", "50", "100"],
                itemRender: (current, type, originalElement) => {
                  if (type === "prev") {
                    return (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Oldingi</span>
                      </button>
                    );
                  }
                  if (type === "next") {
                    return (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs border border-slate-200 transition-all cursor-pointer shadow-2xs"
                      >
                        <span>Keyingi</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  }
                  return originalElement;
                },
                className: "px-5 py-4 !m-0 !flex !items-center !justify-between border-t border-slate-100 flex-wrap gap-3",
              }
            : false
        }
        rowKey={rowKey}
      />
    </div>
  );
};

export default AppTable;

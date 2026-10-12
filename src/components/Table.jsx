import React from "react";
import { Table, Empty } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AppTable = ({
  dataSource = [],
  columnDefs = [],
  rowKey = "id",
  locale = {
    emptyText: (
      <div className="py-10 flex flex-col items-center justify-center text-slate-400">
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
  sticky = false,
  size = "middle",
  onRow,
  rowClassName,
}) => {
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
      <Table
        size={size}
        bordered={false}
        sticky={sticky}
        locale={locale}
        dataSource={isLoading ? [] : dataSource}
        columns={columnDefs}
        loading={isLoading}
        scroll={scroll}
        onRow={onRow}
        rowClassName={rowClassName || (() => "transition-colors duration-100 hover:bg-slate-50/80")}
        pagination={
          page !== undefined && pageSize !== undefined
            ? {
                current: page,
                pageSize: pageSize,
                total: total,
                showTotal: (totalCount, range) => (
                  <div className="text-xs text-slate-500 font-medium">
                    Jami <strong className="text-slate-800 font-bold">{totalCount}</strong> tadan{" "}
                    <span className="font-mono text-slate-700">{range[0]}-{range[1]}</span> ko'rsatilmoqda
                  </div>
                ),
                onChange: (current, size) => {
                  if (setPage) setPage(current);
                  if (setPageSize && size !== pageSize) setPageSize(size);
                },
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                itemRender: (current, type, originalElement) => {
                  if (type === "prev") {
                    return (
                      <button
                        type="button"
                        aria-label="Oldingi sahifa"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 transition-colors cursor-pointer"
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
                        aria-label="Keyingi sahifa"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs border border-slate-200 transition-colors cursor-pointer"
                      >
                        <span>Keyingi</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  }
                  return originalElement;
                },
                className: "px-3 py-2.5 !m-0 !flex !items-center !justify-between border-t border-slate-100 flex-wrap gap-2 text-xs",
              }
            : false
        }
        rowKey={rowKey}
      />
    </div>
  );
};

export default AppTable;

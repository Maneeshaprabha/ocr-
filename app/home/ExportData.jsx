"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  Download,
  FileText,
  FileType,
  Image,
  Loader2,
  Trash2,
  Eye,
  X,
} from "lucide-react";
import Card from "../components/ui/card";
import { useTranslation } from "react-i18next";
import client from "@/lib/supabaseClient";
import { useAuth } from "@/app/components/context/AuthProvider";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { exportExcelDummy, exportPdfDummy, exportTextDummy } from "../utils/dummy";

const FILE_TYPES = {
  pdf: ["pdf"],
  images: ["jpg", "jpeg", "png", "gif", "webp"],
  other: ["docx", "doc", "txt", "xlsx"],
};

function getFileIcon(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg" || ext === "png") return Image;
  if (ext === "docx" || ext === "doc") return FileType;
  return FileText;
}

function getFileCategory(name) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (FILE_TYPES.pdf.includes(ext)) return "pdf";
  if (FILE_TYPES.images.includes(ext)) return "images";
  return "other";
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const BUTTON_STYLES =
  "flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground hover:shadow-md sm:px-4 sm:py-2.5";

export default function ExportData() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showDateRange, setShowDateRange] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  

  const filterRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchDocuments = async () => {
      setIsLoading(true);
      const { data, error } = await client
        .from("documents")
        .select("*, results(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setDocuments(data);
      }
      setIsLoading(false);
    };

    fetchDocuments();
  }, [user?.id, authLoading]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilters(false);
      if (dateRef.current && !dateRef.current.contains(e.target))
        setShowDateRange(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = async (doc) => {
    const { data, error } = await client.storage
      .from("documents")
      .download(doc.file_path);

    if (error) {
      console.error("Download failed:", error.message);
      return;
    }

    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // After downloading the original document, download the results as Excel
    await handleExportExcel(doc);
  };

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;

    const { error: storageError } = await client.storage
      .from("documents")
      .remove([doc.file_path]);

    if (storageError) {
      console.error("Storage delete failed:", storageError.message);
    }

    const { error: dbError } = await client
      .from("documents")
      .delete()
      .eq("id", doc.id);

    if (!dbError) {
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    }
  };

  const logExportEvent = async (format, docId) => {
    if (!user) return;
    try {
      await client.from("export_history").insert({
        user_id: user.id,
        document_id: docId,
        export_format: format,
        export_file_name: `export_${format}_${Date.now()}`
      });
    } catch (e) {
      console.error("Failed to log export", e);
    }
  };



  const handleExportExcel = async (doc) => {
    try {
      let rawData = doc.results?.[0]?.table_data;
      let parsed = typeof rawData === 'string' ? JSON.parse(rawData) : (rawData || []);
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      const tableData = Array.isArray(parsed) ? parsed : [];
      
      const extractedText = doc.results?.[0]?.extracted_text || "No text extracted";
      const translatedText = doc.results?.[0]?.translated_text || "No translation";

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'OCR Automation System';
      workbook.created = new Date();

      if (tableData && tableData.length > 0) {
        // --- SHEET 1: Tabular Data ---
        const tableSheet = workbook.addWorksheet("Tabular Data");
        
        const headers = Array.from(new Set(tableData.flatMap(Object.keys)));
        
        const headerRow = tableSheet.addRow(headers);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F46E5' },
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;
        
        tableData.forEach(row => {
          const rowData = headers.map(key => row[key] || "");
          const addedRow = tableSheet.addRow(rowData);
          addedRow.alignment = { vertical: 'middle', wrapText: true };
        });
        
        tableSheet.columns.forEach((column) => {
          let maxLength = 0;
          column.eachCell({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = maxLength < 15 ? 15 : Math.min(maxLength + 2, 80);
        });
      }

      // --- SHEET 2: Document Text ---
      const textSheet = workbook.addWorksheet("Extracted & Translated Text");
      textSheet.getColumn(1).width = 150;
      
      const extTitle = textSheet.addRow(["Original Extracted Text"]);
      extTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      extTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
      extTitle.height = 30;
      extTitle.alignment = { vertical: 'middle', indent: 1 };
      
      const extContent = textSheet.addRow([extractedText]);
      extContent.alignment = { wrapText: true, vertical: 'top', indent: 1 };
      
      const extLines = extractedText.split('\n').length;
      const extLength = extractedText.length;
      extContent.height = Math.max(100, extLines * 15 + (extLength / 120) * 15);
      
      textSheet.addRow([]);
      
      const trTitle = textSheet.addRow(["Translated Text (Japanese)"]);
      trTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      trTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      trTitle.height = 30;
      trTitle.alignment = { vertical: 'middle', indent: 1 };
      
      const trContent = textSheet.addRow([translatedText]);
      trContent.alignment = { wrapText: true, vertical: 'top', indent: 1 };
      
      const trLines = translatedText.split('\n').length;
      const trLength = translatedText.length;
      trContent.height = Math.max(100, trLines * 15 + (trLength / 120) * 15);
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const safeFileName = doc.file_name ? doc.file_name.replace(/\.[^/.]+$/, "") : "Results";
      saveAs(blob, `Results_${safeFileName}_${new Date().getTime()}.xlsx`);
      
      logExportEvent("excel", doc.id);
    } catch (error) {
      console.error("Error exporting Excel:", error);
    }
  };



  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.file_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const category = getFileCategory(doc.file_name);
    const matchesFileType =
      fileTypeFilter === "all" || category === fileTypeFilter;
    const docDate = new Date(doc.created_at);
    const matchesDateFrom = !dateFrom || docDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || docDate <= new Date(dateTo + "T23:59:59");
    return matchesSearch && matchesFileType && matchesDateFrom && matchesDateTo;
  });




  return (
    <>
    <div className="min-h-full w-full overflow-x-hidden p-4 sm:p-6 bg-background print:hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {t("exportData.title")}
        </h2>
        <p className="mt-0.5 text-sm sm:text-base text-muted-foreground">
          {t("exportData.subtitle")}
        </p>
      </div>

      {/* Search & Controls */}
      <div className="mb-4 flex items-center gap-2 sm:mb-6 sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:h-5 sm:w-5"
            strokeWidth={2}
          />
          <input
            type="text"
            placeholder={t("exportData.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            suppressHydrationWarning
            className="w-full rounded-xl border-0 bg-muted py-2 pl-9 pr-4 text-sm text-foreground placeholder-muted-foreground transition focus:bg-card focus:ring-2 focus:ring-ring sm:py-2.5 sm:pl-10"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            suppressHydrationWarning
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className={`${BUTTON_STYLES} px-2.5 sm:px-4`}
            aria-label="Toggle view"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <rect
                x="3"
                y="3.5"
                width="2"
                height="2"
                fill="currentColor"
                stroke="none"
              />
              <line x1="9" y1="5" x2="17" y2="5" />
              <rect
                x="3"
                y="8.5"
                width="2"
                height="2"
                fill="currentColor"
                stroke="none"
              />
              <line x1="9" y1="10" x2="17" y2="10" />
              <rect
                x="3"
                y="13.5"
                width="2"
                height="2"
                fill="currentColor"
                stroke="none"
              />
              <line x1="9" y1="15" x2="14" y2="15" />
            </svg>
          </button>

          <div className="relative" ref={filterRef}>
            <button
              suppressHydrationWarning
              onClick={() => {
                setShowFilters(!showFilters);
                setShowDateRange(false);
              }}
              className={`${BUTTON_STYLES} px-2.5 sm:px-4`}
            >
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline text-xs sm:text-sm truncate">
                {t("exportData.filters")}
              </span>
            </button>
            {showFilters && (
              <div className="absolute right-0 top-full z-10 mt-2 min-w-[150px] w-48 rounded-xl border border-border bg-popover py-2 shadow-lg">
                <p className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
                  {t("exportData.fileType")}
                </p>
                {["all", "pdf", "images", "other"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFileTypeFilter(type);
                      setShowFilters(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm ${fileTypeFilter === type ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
                  >
                    {type === "all"
                      ? t("exportData.allDocuments")
                      : type === "images"
                        ? t("exportData.images")
                        : type === "pdf"
                          ? t("exportData.pdfs")
                          : t("exportData.otherDocs")}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={dateRef}>
            <button
              suppressHydrationWarning
              onClick={() => {
                setShowDateRange(!showDateRange);
                setShowFilters(false);
              }}
              className={`${BUTTON_STYLES} px-2.5 sm:px-4`}
            >
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline text-xs sm:text-sm truncate">
                {t(`exportData.dateRange`)}
              </span>
            </button>
            {showDateRange && (
              <div className="absolute right-0 top-full z-10 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-64 rounded-xl border border-border bg-popover p-4 shadow-lg">
                <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  {t(`exportData.dateRange`)}
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t("exportData.from")}
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      {t("exportData.to")}
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      setShowDateRange(false);
                    }}
                    className="w-full rounded-lg py-2 text-sm text-muted-foreground bg-accent hover:bg-accent/80 transition-colors"
                  >
                    {t("exportData.clear")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Document Grid */}
      {!isLoading && (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {filteredDocs.map((doc) => {
            const FileIcon = getFileIcon(doc.file_name);
            const confidence = doc.results?.[0]?.confidence_score;
            const dateStr = new Date(doc.created_at).toLocaleDateString();

            return viewMode === "grid" ? (
              <Card
                key={doc.id}
                className="group relative overflow-hidden rounded-2xl border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1 sm:top-4 sm:right-4">

                  <button
                    onClick={() => handleDownload(doc)}
                    className="rounded-lg p-1.5 text-foreground transition hover:bg-accent"
                    aria-label={`Download ${doc.file_name}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    aria-label={`Delete ${doc.file_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-start gap-3 pt-2 sm:gap-4">
                  <div
                    className="shrink-0 rounded-xl p-2.5 sm:p-3"
                    style={{ backgroundColor: "hsl(var(--accent))" }}
                  >
                    <FileIcon className="h-8 w-8 sm:h-10 sm:w-10 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {doc.file_name}
                    </p>
                    <div className="mt-2 space-y-1.5 text-sm sm:mt-3 sm:space-y-2 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>{t("exportData.date")}</span>
                        <span className="font-medium text-foreground">
                          {dateStr}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("exportData.size")}</span>
                        <span className="font-medium text-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                      {confidence && (
                        <div className="flex justify-between">
                          <span>{t("exportData.confidence")}</span>
                          <span className="font-medium text-foreground">
                            {Math.round(confidence * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card
                key={doc.id}
                className="relative flex items-center gap-3 overflow-hidden rounded-2xl border-border bg-card shadow-sm p-4"
              >
                <div className="absolute top-3 right-3 flex items-center gap-2">

                  <button
                    onClick={() => handleDownload(doc)}
                    className="rounded-lg p-2 transition hover:bg-accent text-foreground"
                    aria-label={`Download ${doc.file_name}`}
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc)}
                    className="rounded-lg p-2 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 text-muted-foreground"
                    aria-label={`Delete ${doc.file_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex min-w-0 items-center gap-3 pr-32">
                  <div className="shrink-0 rounded-lg p-2 sm:p-2.5 bg-accent text-foreground">
                    <FileIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {doc.file_name}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>
                        {t("exportData.date")} {dateStr}
                      </span>
                      <span>
                        {t("exportData.size")} {formatFileSize(doc.file_size)}
                      </span>
                      {confidence && (
                        <span>
                          {t("exportData.confidence")}{" "}
                          {Math.round(confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredDocs.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          {t("exportData.noData")}
        </div>
      )}

    </div>

    </>
  );
}

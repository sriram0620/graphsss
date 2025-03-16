"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Download, ZoomIn, ZoomOut, Square, Lasso, Trash2, FileJson, FileSpreadsheet, File as FilePdf, Image, Settings2 } from 'lucide-react';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import type { ECharts } from 'echarts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';

interface ChartToolbarProps {
  chartInstance: ECharts | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onBoxSelect: () => void;
  onLassoSelect: () => void;
  onClearSelection: () => void;
  data: any[];
  title: string;
}

export function ChartToolbar({
  chartInstance,
  onZoomIn,
  onZoomOut,
  onBoxSelect,
  onLassoSelect,
  onClearSelection,
  data,
  title
}: ChartToolbarProps) {
  const [showTools, setShowTools] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setShowTools(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (format: 'png' | 'svg' | 'pdf' | 'csv' | 'json') => {
    if (!chartInstance) return;

    switch (format) {
      case 'png':
      case 'svg': {
        const url = chartInstance.getDataURL({
          type: format,
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
        saveAs(url, `chart-${title}.${format}`);
        break;
      }
      case 'pdf': {
        const url = chartInstance.getDataURL({
          type: 'png',
          pixelRatio: 2,
          backgroundColor: '#fff'
        });
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px'
        });
        const imgProps = pdf.getImageProperties(url);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(url, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`chart-${title}.pdf`);
        break;
      }
      case 'csv': {
        const csvContent = data.map(row => 
          Object.values(row).join(',')
        ).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `chart-${title}.csv`);
        break;
      }
      case 'json': {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, `chart-${title}.json`);
        break;
      }
    }
  };

  return (
    <div ref={toolbarRef} className="absolute top-2 right-2 z-30 flex items-center gap-2">
      <div className="flex items-center">
        <motion.div
          className="flex items-center bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border"
          initial={false}
          animate={{
            width: showTools ? 'auto' : '2rem',
            paddingRight: showTools ? '0.375rem' : '0',
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg transition-colors",
              showTools && "rounded-r-none border-r border-border"
            )}
            onClick={() => setShowTools(!showTools)}
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          <AnimatePresence>
            {showTools && (
              <motion.div
                className="flex items-center gap-1 px-1"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onZoomIn}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onZoomOut}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>

                <div className="w-[1px] h-8 bg-border mx-1" />

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onBoxSelect}
                  title="Box Selection"
                >
                  <Square className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onLassoSelect}
                  title="Lasso Selection"
                >
                  <Lasso className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClearSelection}
                  title="Clear Selection"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 ml-2 bg-background/95 backdrop-blur-sm hover:bg-accent/80"
            >
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleDownload('png')}>
              <Image className="h-4 w-4 mr-2" />
              <span>Download PNG</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('pdf')}>
              <FilePdf className="h-4 w-4 mr-2" />
              <span>Download PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('csv')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              <span>Download CSV</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('json')}>
              <FileJson className="h-4 w-4 mr-2" />
              <span>Download JSON</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
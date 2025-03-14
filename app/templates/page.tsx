"use client"

import { motion } from "framer-motion"
import { Plus, Search, Star, StarOff } from "lucide-react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Sheet from "@/components/sheet"
import AddGraphSheet from "@/components/add-graph-sheet"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Sidebar from "@/components/sidebar"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string;
  name: string;
  system: string;
  timeRange: string;
  resolution: string;
  isDefault: boolean;
  isFavorite: boolean;
}

const timeRangeOptions = [
  'auto',
  'last 1 hour',
  'today',
  'yesterday',
  'last 7 days',
  'last 30 days',
  'last 90 days',
  'custom'
];

const systemOptions = ['SVW', 'System 1', 'System 2'];

const resolutionOptions = [
  { value: 'auto', label: 'Auto' },
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' }
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [isAddGraphSheetOpen, setIsAddGraphSheetOpen] = useState(false)
  const [templateData, setTemplateData] = useState({
    name: "",
    system: "",
    timeRange: "auto",
    resolution: "auto",
    isDefault: false,
    isFavorite: false
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const validateFields = () => {
    const newErrors: Record<string, boolean> = {}
    if (!templateData.name.trim()) newErrors.name = true
    if (!templateData.system) newErrors.system = true
    if (!templateData.timeRange) newErrors.timeRange = true
    if (!templateData.resolution) newErrors.resolution = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddGraph = () => {
    if (!validateFields()) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      })
      return
    }

    setSelectedTemplate({
      id: Date.now().toString(),
      ...templateData
    })
    setIsAddGraphSheetOpen(true)
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-background/98 to-background/95 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
              Templates
            </h1>
            <p className="text-muted-foreground/90 text-lg">
              Create and manage your monitoring templates
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="p-6 backdrop-blur-sm bg-card/90 border border-border/40 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    value={templateData.name}
                    onChange={(e) => {
                      setTemplateData(prev => ({ ...prev, name: e.target.value }))
                      setErrors(prev => ({ ...prev, name: false }))
                    }}
                    placeholder="Template Name"
                    className={`h-9 ${errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>

                <Select
                  value={templateData.system}
                  onValueChange={(value) => {
                    setTemplateData(prev => ({ ...prev, system: value }))
                    setErrors(prev => ({ ...prev, system: false }))
                  }}
                >
                  <SelectTrigger className={`w-[180px] h-9 ${errors.system ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemOptions.map(system => (
                      <SelectItem key={system} value={system.toLowerCase()}>{system}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={templateData.timeRange}
                  onValueChange={(value) => {
                    setTemplateData(prev => ({ ...prev, timeRange: value }))
                    setErrors(prev => ({ ...prev, timeRange: false }))
                  }}
                >
                  <SelectTrigger className={`w-[180px] h-9 ${errors.timeRange ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={templateData.resolution}
                  onValueChange={(value) => {
                    setTemplateData(prev => ({ ...prev, resolution: value }))
                    setErrors(prev => ({ ...prev, resolution: false }))
                  }}
                >
                  <SelectTrigger className={`w-[180px] h-9 ${errors.resolution ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                    <SelectValue placeholder="Resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={templateData.isDefault}
                    onCheckedChange={(checked) => setTemplateData(prev => ({ ...prev, isDefault: checked }))}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className="text-sm text-muted-foreground">Default</span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={templateData.isFavorite}
                    onCheckedChange={(checked) => setTemplateData(prev => ({ ...prev, isFavorite: checked }))}
                    className="data-[state=checked]:bg-primary"
                  />
                  <span className="text-sm text-muted-foreground">Favorite</span>
                </div>
              </div>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <Card 
                className="p-6 backdrop-blur-sm bg-card/90 border border-border/40 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
                onClick={handleAddGraph}
              >
                <div className="flex flex-col items-center justify-center py-8">
                  <Plus className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground/90">Add Graph</h3>
                  <p className="text-sm text-muted-foreground mt-2">Click to add a new graph to your template</p>
                </div>
              </Card>
            </motion.div>
          </motion.div>

          <Sheet
            isOpen={isAddGraphSheetOpen}
            onClose={() => setIsAddGraphSheetOpen(false)}
            title="Add Graph from Template"
          >
            {selectedTemplate && (
              <AddGraphSheet
                template={selectedTemplate}
                onClose={() => setIsAddGraphSheetOpen(false)}
              />
            )}
          </Sheet>
        </div>
      </main>
    </div>
  )
}
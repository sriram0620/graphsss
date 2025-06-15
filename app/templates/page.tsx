"use client"

import { motion } from "framer-motion"
import { Plus, Search, Star, StarOff, Heart, Shield } from "lucide-react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Sidebar from "@/components/sidebar"
import { useTemplates } from "@/hooks/useTemplates"

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const {
    templates,
    selectedTemplate,
    loading,
    error,
    selectTemplate,
  } = useTemplates();

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-background via-background/98 to-background/95">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading templates...</p>
          </div>
        </main>
      </div>
    );
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
              Manage your monitoring templates
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="p-4 border-destructive/50 bg-destructive/5">
                <p className="text-destructive">{error}</p>
              </Card>
            </motion.div>
          )}

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Templates Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card 
                  className={`p-6 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer ${
                    selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => selectTemplate(template.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {template.isDefault && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                          <Shield className="h-3 w-3" />
                          <span className="text-xs font-medium">Default</span>
                        </div>
                      )}
                      {template.isFavorite && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          <Heart className="h-3 w-3 fill-current" />
                          <span className="text-xs font-medium">Favorite</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      ID: {template.id.split('_').slice(-1)[0]}
                    </div>
                    <Button
                      variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectTemplate(template.id);
                      }}
                    >
                      {selectedTemplate?.id === template.id ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {filteredTemplates.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-12 backdrop-blur-sm bg-card/90 border-border/40 shadow-xl text-center">
                <p className="text-muted-foreground text-lg">
                  {searchQuery ? 'No templates found matching your search' : 'No templates available'}
                </p>
                <p className="text-sm text-muted-foreground/80 mt-1">
                  {searchQuery ? 'Try adjusting your search terms' : 'Templates will appear here when available'}
                </p>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
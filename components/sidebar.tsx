"use client"

import { motion } from "framer-motion"
import { LayoutDashboard, FileText, Network, Settings, Users, HelpCircle, Sun, Moon, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { useSidebar } from "@/contexts/sidebar-context"
import { Button } from "./ui/button"

const menuItems = [
  { id: 1, label: "Dashboard", icon: LayoutDashboard, link: "/" },
  { id: 2, label: "Templates", icon: FileText, link: "/templates" },
  { id: 3, label: "Topology", icon: Network, link: "/topology" },
  { id: 4, label: "Users", icon: Users, link: "/users" },
  { id: 5, label: "Settings", icon: Settings, link: "/settings" },
  { id: 6, label: "Help", icon: HelpCircle, link: "/help" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { isExpanded, toggleSidebar } = useSidebar()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isExpanded ? '16rem' : '4rem',
      }}
      transition={{ duration: 0.3 }}
      className={`relative bg-card/90 backdrop-blur-sm h-screen border-r border-border/40 shadow-2xl`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-4 top-6 h-8 w-8 rounded-full border shadow-md bg-background"
        onClick={toggleSidebar}
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isExpanded ? 'rotate-180' : ''}`} />
      </Button>

      <div className={`flex gap-x-4 items-center mb-10 p-6 ${!isExpanded && 'justify-center'}`}>
        <h1 className={`text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent transition-opacity duration-300 ${!isExpanded ? 'opacity-0 w-0' : 'opacity-100'}`}>
          Analytics
        </h1>
      </div>

      <ul className="pt-2 space-y-2.5 px-3">
        {menuItems.map((menu) => (
          <Link href={menu.link} key={menu.id}>
            <motion.li
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.95 }}
              className={`flex rounded-xl p-3.5 cursor-pointer hover:bg-accent/40 text-muted-foreground hover:text-accent-foreground transition-all duration-300
                ${pathname === menu.link ? "bg-accent/70 text-accent-foreground shadow-lg" : ""}`}
            >
              <span className="flex items-center gap-x-4">
                <menu.icon className="w-5 h-5" />
                <span className={`origin-left duration-300 ${!isExpanded ? 'opacity-0 w-0' : 'opacity-100'}`}>
                  {menu.label}
                </span>
              </span>
            </motion.li>
          </Link>
        ))}
      </ul>

      <motion.div
        className={`absolute bottom-6 ${isExpanded ? 'left-6 right-6' : 'left-3 right-3'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-center gap-3 p-3.5 rounded-xl bg-accent/40 hover:bg-accent/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          <span className={`text-sm font-medium transition-opacity duration-300 ${!isExpanded ? 'opacity-0 w-0' : 'opacity-100'}`}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>
      </motion.div>
    </motion.div>
  )
}
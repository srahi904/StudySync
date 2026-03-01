'use client'
import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, FileText, User, BookOpen } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const debouncedQuery = useDebounce(query, 300)
  
  const [materials, setMaterials] = React.useState<any[]>([])
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setMaterials([])
      setUsers([])
      return
    }
  }, [open])

  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setMaterials([])
      setUsers([])
      return
    }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        if (data.success) {
          setMaterials(data.data.materials)
          setUsers(data.data.users)
        }
      } catch (error) {
        console.error("Search error", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative group flex items-center justify-center p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
      >
        <Search className="w-5 h-5" />
      </button>

      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted px-3 py-1.5 rounded-lg border border-border/50 transition-colors w-64 justify-between"
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          <span>Search StudySync...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Search for materials, subjects, or users..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? "Searching..." : "No results found."}
          </CommandEmpty>
          
          {materials.length > 0 && (
            <CommandGroup heading="Study Materials">
              {materials.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`material-${m.id}-${m.title}`}
                  onSelect={() => runCommand(() => router.push(`/materials/${m.id}`))}
                >
                  <FileText className="mr-2 h-4 w-4 text-primary" />
                  <div className="flex flex-col">
                    <span>{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.subject || 'Material'} • {m.type}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {materials.length > 0 && users.length > 0 && <CommandSeparator />}

          {users.length > 0 && (
            <CommandGroup heading="Users">
              {users.map((u) => (
                <CommandItem
                  key={u.id}
                  value={`user-${u.id}-${u.name}`}
                  onSelect={() => runCommand(() => router.push(`/profile/${u.id}`))}
                >
                  <User className="mr-2 h-4 w-4 text-blue-500" />
                  <div className="flex flex-col">
                    <span>{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.major || 'Student'} {u.university ? `• ${u.university}` : ''}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

        </CommandList>
      </CommandDialog>
    </>
  )
}

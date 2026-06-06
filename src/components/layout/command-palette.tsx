"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, CheckSquare, Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

type SearchResult = {
  projects: Array<{ id: string; name: string; status: string }>;
  tasks: Array<{ id: string; title: string; project: { id: string; name: string } }>;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [] });
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const q = encodeURIComponent(query.trim());
        const [pRes, tRes] = await Promise.all([
          fetch(`/api/projects?search=${q}&pageSize=5`),
          fetch(`/api/tasks?search=${q}&pageSize=5`),
        ]);
        const [p, t] = await Promise.all([pRes.json(), tRes.json()]);
        setResults({ projects: p.data ?? [], tasks: t.data ?? [] });
      } catch {
        setResults({ projects: [], tasks: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    setQuery("");
    fn();
  }, []);

  const hasResults = results.projects.length > 0 || results.tasks.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2.5 rounded-xl border border-border bg-muted/50 px-3.5 py-2 text-sm text-muted-foreground w-72 transition-all hover:border-primary/40 hover:bg-muted"
      >
        <Search className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-primary" />
        <span>Search projects, tasks…</span>
        <div className="ml-auto flex items-center gap-0.5">
          <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px] font-medium">⌘</kbd>
          <kbd className="rounded border border-border bg-background px-1 py-0.5 text-[10px] font-medium">K</kbd>
        </div>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search projects and tasks">
        <Command>
          <CommandInput
            placeholder="Search projects and tasks…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!query.trim() && (
              <CommandEmpty>Start typing to search.</CommandEmpty>
            )}
            {query.trim() && loading && (
              <CommandEmpty>Searching…</CommandEmpty>
            )}
            {query.trim() && !loading && !hasResults && (
              <CommandEmpty>No results for &ldquo;{query}&rdquo;.</CommandEmpty>
            )}
            {results.projects.length > 0 && (
              <CommandGroup heading="Projects">
                {results.projects.map((project) => (
                  <CommandItem
                    key={project.id}
                    value={project.name}
                    onSelect={() => run(() => router.push(`/projects/${project.id}`))}
                  >
                    <FolderKanban className="text-muted-foreground" />
                    <span>{project.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.projects.length > 0 && results.tasks.length > 0 && (
              <CommandSeparator />
            )}
            {results.tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.tasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    value={task.title}
                    onSelect={() => run(() => router.push(`/projects/${task.project.id}`))}
                  >
                    <CheckSquare className="text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{task.title}</span>
                      <span className="text-xs text-muted-foreground">{task.project.name}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

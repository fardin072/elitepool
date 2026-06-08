"use client";

import { create } from "zustand";
import type { TaskFilters, ProjectFilters } from "@/types";

interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  selectedTaskIds: string[];
  toggleTaskSelection: (id: string) => void;
  selectAllTasks: (ids: string[]) => void;
  clearTaskSelection: () => void;

  taskFilters: TaskFilters;
  setTaskFilters: (filters: Partial<TaskFilters>) => void;
  clearTaskFilters: () => void;

  projectFilters: ProjectFilters;
  setProjectFilters: (filters: Partial<ProjectFilters>) => void;
  clearProjectFilters: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),

  selectedTaskIds: [],
  toggleTaskSelection: (id) =>
    set((s) => ({
      selectedTaskIds: s.selectedTaskIds.includes(id)
        ? s.selectedTaskIds.filter((i) => i !== id)
        : [...s.selectedTaskIds, id],
    })),
  selectAllTasks: (ids) => set({ selectedTaskIds: ids }),
  clearTaskSelection: () => set({ selectedTaskIds: [] }),

  taskFilters: {},
  setTaskFilters: (filters) =>
    set((s) => ({ taskFilters: { ...s.taskFilters, ...filters } })),
  clearTaskFilters: () => set({ taskFilters: {} }),

  projectFilters: {},
  setProjectFilters: (filters) =>
    set((s) => ({ projectFilters: { ...s.projectFilters, ...filters } })),
  clearProjectFilters: () => set({ projectFilters: {} }),
}));
